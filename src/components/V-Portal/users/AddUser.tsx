import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { vendorCommonService } from '../common-services/vendorCommonService';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.user-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.user-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.user-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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

export function AddUser() {
  const navigate = useNavigate();

  // Vendor context data (B4: GET /vendor-add-user)
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Form Fields (B5: POST /vendor-save-user)
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [registerFor, setRegisterFor] = useState<'field-work' | 'documentation'>('field-work');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section Refs
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load Vendor Form Context Data (B4)
  useEffect(() => {
    const fetchContext = async () => {
      setLoadingContext(true);
      try {
        const data = await vendorCommonService.getAddUserData();
        setVendorInfo(data);
      } catch (err: any) {
        console.warn('[AddUser] getAddUserData error:', err);
      } finally {
        setLoadingContext(false);
      }
    };
    fetchContext();
  }, []);

  // Form Submit Handler (B5)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'danger', text: 'Full Name is required.' });
      scrollTo(sec1);
      return;
    }

    const cleanContact = contact.replace(/\D/g, '').trim();
    if (!cleanContact || cleanContact.length < 10) {
      setFeedback({ type: 'danger', text: 'Contact number must be at least 10 digits.' });
      scrollTo(sec1);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'danger', text: 'Please enter a valid email address.' });
      scrollTo(sec1);
      return;
    }

    if (password.length < 8) {
      setFeedback({ type: 'danger', text: 'Password must be at least 8 characters.' });
      scrollTo(sec2);
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ type: 'danger', text: 'Password and Confirm Password do not match.' });
      scrollTo(sec2);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await vendorCommonService.saveSubUser({
        name: name.trim(),
        contact: cleanContact,
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        registerFor,
      });

      if (res?.status === 'danger' || res?.status === 'error') {
        setFeedback({
          type: 'danger',
          text: res?.message || 'Failed to create sub-user (User limit might be exceeded).',
        });
        return;
      }

      setFeedback({
        type: 'success',
        text: res?.message || 'Sub-User Created! User ID and Password sent successfully via WhatsApp.',
      });

      setTimeout(() => {
        navigate('/v/users/view-users');
      }, 1500);
    } catch (err: any) {
      console.error('[AddUser] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to create sub-user. Please verify contact/email uniqueness and 5-user limit.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const v = vendorInfo?.vendor;

  return (
    <div className="solar-erp-page user-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Create Sub-User Account"
        subtitle="Provision a designated vendor sub-user for field operations or documentation, with automated WhatsApp credential dispatch"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Users' },
          { label: 'Add User' },
        ]}
        actions={
          <Link to="/v/users/view-users" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Sub-Users
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      {/* ── Vendor Context Information Banner ── */}
      {v && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 18px',
            background: 'var(--ax-surface-subtle, #f8fafc)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 12,
            marginBottom: 'var(--ax-space-4)',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>Parent Vendor Account</span>
            <b style={{ color: 'var(--ax-text-strong)' }}>{v.name || vendorInfo.username}</b>
            {v.category && <span> · Category: <b>{v.category}</b></span>}
            {vendorInfo.state && <span> · State: <b>{vendorInfo.state.toUpperCase()}</b></span>}
          </div>
          <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11, fontWeight: 600 }}>
            Max 5 Sub-Users Allowed
          </span>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Card Header with Nav Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Sub-User Registration Form
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Enter sub-user credentials. The user will be assigned a generated ID (e.g. KLK12345) and status active.
              </p>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Profile & Work Role
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Access Credentials
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Profile & Work Role ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Profile & Role</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Personal contact details and functional assignment
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Full Name"
                name="user_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />

              <FloatingInput
                label="Mobile Contact (WhatsApp)"
                name="user_contact"
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="e.g. 9876500001"
                required
              />

              <FloatingInput
                label="Email Address"
                name="user_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                required
              />

              <div className="ax-float">
                <select
                  id="user_register_for"
                  className="ax-float__input"
                  value={registerFor}
                  onChange={(e) => setRegisterFor(e.target.value as 'field-work' | 'documentation')}
                  required
                >
                  <option value="field-work">Field Work (On-site installation & survey)</option>
                  <option value="documentation">Documentation (Office records & upload)</option>
                </select>
                <label htmlFor="user_register_for" className="ax-float__label floating">
                  Assigned Department / Work Type <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Access Credentials ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Login Credentials</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set a secure password for this sub-user (minimum 8 characters)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Password"
                name="user_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                required
              />

              <FloatingInput
                label="Confirm Password"
                name="user_confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: 12.5, color: '#065f46' }}>
              <b>WhatsApp Alert:</b> Upon registration, a WhatsApp message with the auto-generated User ID and Password will be sent directly to <b>{contact || 'the user’s contact'}</b>.
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/users/view-users" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Creating Sub-User…' : 'Create Sub-User'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddUser;
