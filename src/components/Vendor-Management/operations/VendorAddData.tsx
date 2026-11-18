import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { vendorOperationsService } from './vendorOperationsService';

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
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
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

export function VendorAddData() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    type_of_entity: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    register_for: '',
    state: '',
    gst_number: '',
    status: 'Active' as 'Active' | 'Inactive',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    sow: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section Refs for Quick Nav Pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.type_of_entity) return setErrorMsg('Type of Entity is required.');
    if (!formData.company_name) return setErrorMsg('Name of Company/Firm is required.');
    if (!formData.contact_person) return setErrorMsg('Contact Person Name is required.');
    if (!formData.email) return setErrorMsg('Email is required.');
    if (!formData.phone) return setErrorMsg('Phone/Mobile is required.');
    if (!formData.register_for) return setErrorMsg('Register to Become is required.');
    if (!formData.state) return setErrorMsg('State is required.');
    if (!formData.gst_number) return setErrorMsg('GST Number is required.');
    if (!formData.sow) return setErrorMsg('Scope of Work is required.');

    setSubmitting(true);
    try {
      await vendorOperationsService.createVendor({
        name: formData.contact_person,
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        type_of_entity: formData.type_of_entity,
        register_for: formData.register_for,
        state: formData.state,
        gst_number: formData.gst_number,
        status: formData.status,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        bank_name: formData.bank_name,
        sow: formData.sow,
      });

      setSuccessMsg('Vendor registered successfully! Redirecting to Vendor Directory...');
      setTimeout(() => {
        navigate('/vendor-management/vendor/view');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to register vendor.');
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
        title="Add Vendor"
        subtitle="Register new state vendors, contractors, and partner commercial entities"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Vendor', href: '/vendor-management/vendor/view' },
          { label: 'Add Vendor' },
        ]}
        actions={
          <Link
            to="/vendor-management/vendor/view"
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
            View Vendor Data
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
            onClick={() => setErrorMsg('')}
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
                Add Vendor
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
              Master Vendor Entry
            </span>
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Entity & Firm
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Contact & State
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Bank & Tax
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Scope of Work
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Entity & Firm Details */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Type of Entity & Firm Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Business legal structure and commercial entity registration
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Type of Entity * */}
              <div className="ax-float">
                <select
                  id="type_of_entity"
                  name="type_of_entity"
                  className="ax-float__input"
                  value={formData.type_of_entity}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select...</option>
                  <option value="Individual/ Sole Proprietorship">Individual/ Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="KLK Employee">KLK Employee</option>
                </select>
                <label htmlFor="type_of_entity" className="ax-float__label floating">
                  Type of Entity <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Name of Company/Firm * */}
              <FloatingInput
                label="Name of Company/Firm"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="Enter Company or Firm Name"
              />

              {/* Contact Person Name * */}
              <FloatingInput
                label="Contact Person Name"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="Enter Contact Person Full Name"
              />

              {/* Status */}
              <div className="ax-float">
                <select
                  id="status"
                  name="status"
                  className="ax-float__input"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <label htmlFor="status" className="ax-float__label floating">
                  Status
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: Contact & Regional Details */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Contact & State Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Vendor registration role and communication channels
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Email * */}
              <FloatingInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="vendor@company.com"
              />

              {/* Phone/Mobile * */}
              <FloatingInput
                label="Phone/Mobile"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="10-digit mobile number"
              />

              {/* Register to Become * */}
              <div className="ax-float">
                <select
                  id="register_for"
                  name="register_for"
                  className="ax-float__input"
                  value={formData.register_for}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select...</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Installer">Installer</option>
                  <option value="Employee">Employee</option>
                  <option value="DLE">DLE</option>
                  <option value="VLE">VLE</option>
                </select>
                <label htmlFor="register_for" className="ax-float__label floating">
                  Register to Become <span style={{ color: '#ef4444' }}>*</span>
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
                  <option value="">Select...</option>
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

          {/* Section 3: Tax & Banking Details */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Tax Identification & Banking Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Statutory GST and bank disbursement information
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* GST Number * */}
              <FloatingInput
                label="GST Number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="22AAAAA0000A1Z5"
              />

              {/* Bank Name */}
              <FloatingInput
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={submitting}
                placeholder="e.g. State Bank of India"
              />

              {/* Account Number */}
              <FloatingInput
                label="Account Number"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter Bank Account Number"
              />

              {/* IFSC Code */}
              <FloatingInput
                label="IFSC Code"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                disabled={submitting}
                placeholder="e.g. SBIN0001234"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Scope of Work */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Scope of Work (SOW)</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Define contract operational scope, product schemes, and service lines
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '640px' }}>
              <div className="ax-float">
                <select
                  id="sow"
                  name="sow"
                  className="ax-float__input"
                  value={formData.sow}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select Scope of Work...</option>
                  <option value="Solar Water Pump Installation (SWP)">Solar Water Pump Installation (SWP)</option>
                  <option value="Solar Rooftop Installation (SRT)">Solar Rooftop Installation (SRT)</option>
                  <option value="Solar Street Light (SSL)">Solar Street Light (SSL)</option>
                  <option value="Annual Maintenance Contract (AMC)">Annual Maintenance Contract (AMC)</option>
                  <option value="Material Supply & Logistics">Material Supply & Logistics</option>
                  <option value="Field Survey & Geo-Tagging">Field Survey & Geo-Tagging</option>
                </select>
                <label htmlFor="sow" className="ax-float__label floating">
                  Scope of Work <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/vendor/view" className="ax-btn ax-btn--secondary">
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
                  <span className="ax-spinner" /> Submitting...
                </span>
              ) : (
                'Add Vendor'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default VendorAddData;
