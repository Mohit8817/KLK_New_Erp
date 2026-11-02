import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

export const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 12px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.up-single-card-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.up-single-card-form .ax-card__body {
  padding: var(--ax-space-6, 24px);
}

.up-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.up-section-pill-btn {
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
  color: var(--ax-text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.up-section-pill-btn:hover {
  border-color: var(--ax-accent, #2563eb);
  color: var(--ax-accent, #2563eb);
  background: #eff6ff;
}
.up-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.up-section-block {
  padding-top: var(--ax-space-2, 8px);
}
.up-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.up-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.up-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

.up-form-grid {
  display: grid;
  gap: 16px;
}
.up-form-grid--2col { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.up-form-grid--3col { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.up-form-grid--4col { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (max-width: 900px) {
  .up-form-grid--3col, .up-form-grid--4col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .up-form-grid--2col, .up-form-grid--3col, .up-form-grid--4col {
    grid-template-columns: 1fr;
  }
}

.ax-float {
  position: relative;
  width: 100%;
}
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 14px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 6px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}
.ax-float__input[readonly],
.ax-float__input:disabled {
  background: var(--ax-surface-subtle, #f8fafc);
}
.ax-float__input:disabled {
  cursor: not-allowed;
}

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 14px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float.has-value .ax-float__label {
  top: 0;
  font-size: 11px;
  color: var(--ax-accent, #2563eb);
  font-weight: 500;
}
.ax-float.has-error .ax-float__input {
  border-color: var(--ax-danger, #ef4444) !important;
}
.ax-float.has-error .ax-float__label {
  color: var(--ax-danger, #ef4444) !important;
}
.ax-field__error {
  font-size: 11px;
  color: var(--ax-danger, #ef4444);
  margin-top: 4px;
  padding-left: 2px;
}

.up-upload-box {
  border: 1px dashed var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 6px);
  padding: 8px 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 46px;
  box-sizing: border-box;
}
`;

export function getTodayFormatted(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function opts(list: string[]): { value: string; label: string }[] {
  return list.map((item) => ({ value: item, label: item }));
}

export const BackArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14, marginRight: 6 }}
    aria-hidden="true"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export function StatusBanner({ toast }: { toast: { type: 'success' | 'error'; message: string } | null }) {
  if (!toast) return null;
  return (
    <div
      className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`}
      style={{ marginBottom: 'var(--ax-space-4, 16px)' }}
      role="status"
    >
      <div className="ax-alert__title">{toast.type === 'success' ? 'Success' : 'Error'}</div>
      <div className="ax-alert__text">{toast.message}</div>
    </div>
  );
}

export interface SectionItem {
  id: string;
  num: string;
  title: string;
}

export function SectionPills({ sections, onJump }: { sections: SectionItem[]; onJump: (id: string) => void }) {
  return (
    <div className="up-section-pills">
      {sections.map((s) => (
        <button key={s.id} type="button" className="up-section-pill-btn" onClick={() => onJump(s.id)}>
          <span className="pill-num">{s.num}</span> {s.title}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({
  num,
  total,
  title,
  desc,
}: {
  num: string | number;
  total?: number;
  title: string;
  desc?: string;
}) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <h3 className="ax-card__title" style={{ fontSize: 16 }}>
          {num}. {title}
        </h3>
        {desc && <p className="ax-card__subtitle" style={{ margin: 0 }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ──────── Floating Input Primitives ──────── */
export interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  maxLength?: number;
  step?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required,
  disabled,
  readOnly,
  placeholder = ' ',
  maxLength,
  step,
  className = '',
  style,
}: FloatingInputProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  return (
    <div className={`ax-float ${hasValue ? 'has-value' : ''} ${error ? 'has-error' : ''} ${className}`} style={style}>
      <input
        id={id}
        type={type}
        className="ax-float__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        step={step}
      />
      <label htmlFor={id} className="ax-float__label">
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && <div className="ax-field__error">{error}</div>}
    </div>
  );
}

export interface FloatingSelectProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required,
  disabled,
  placeholder = '-- Select --',
  className = '',
  style,
}: FloatingSelectProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  return (
    <div className={`ax-float ${hasValue ? 'has-value' : ''} ${error ? 'has-error' : ''} ${className}`} style={style}>
      <select
        id={id}
        className="ax-float__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label htmlFor={id} className="ax-float__label">
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && <div className="ax-field__error">{error}</div>}
    </div>
  );
}

export interface FloatingTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingTextarea({
  id,
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  rows = 3,
  placeholder = ' ',
  className = '',
  style,
}: FloatingTextareaProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  return (
    <div className={`ax-float ${hasValue ? 'has-value' : ''} ${error ? 'has-error' : ''} ${className}`} style={style}>
      <textarea
        id={id}
        className="ax-float__input"
        rows={rows}
        style={{ height: 'auto', minHeight: 76, paddingTop: 18 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <label htmlFor={id} className="ax-float__label" style={{ top: hasValue ? 0 : 20 }}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && <div className="ax-field__error">{error}</div>}
    </div>
  );
}

export interface FloatingFileInputProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingFileInput({
  id,
  label,
  file,
  onChange,
  error,
  required,
  accept = 'image/*,.pdf',
  disabled,
  className = '',
  style,
}: FloatingFileInputProps) {
  return (
    <div className={`ax-float has-value ${error ? 'has-error' : ''} ${className}`} style={style}>
      <div className="up-upload-box">
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          style={{ fontSize: 12, flex: 1, minWidth: 0 }}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file && (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm"
            style={{ padding: '0 6px', height: 26, fontSize: 11, color: 'var(--ax-danger, #ef4444)' }}
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        )}
      </div>
      <label htmlFor={id} className="ax-float__label" style={{ top: 0, fontSize: 11 }}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && <div className="ax-field__error">{error}</div>}
    </div>
  );
}

/* ──────── SMS Radio Group ──────── */
export interface SmsRadioGroupProps {
  name: string;
  value: string;
  yesValue?: string;
  noValue?: string;
  onChange: (v: string) => void;
  label?: string;
}

export function SmsRadioGroup({
  name,
  value,
  yesValue = 'yes',
  noValue = 'no',
  onChange,
  label = 'Send SMS',
}: SmsRadioGroupProps) {
  const radioLabel = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--ax-text, #334155)',
  } as const;

  return (
    <div role="radiogroup" aria-label={label}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text, #334155)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <label style={radioLabel}>
          <input
            type="radio"
            name={name}
            value={yesValue}
            checked={value === yesValue}
            onChange={() => onChange(yesValue)}
            style={{ accentColor: 'var(--ax-accent, #2563eb)', margin: 0 }}
          />
          <span>Yes</span>
        </label>
        <label style={radioLabel}>
          <input
            type="radio"
            name={name}
            value={noValue}
            checked={value === noValue}
            onChange={() => onChange(noValue)}
            style={{ accentColor: 'var(--ax-accent, #2563eb)', margin: 0 }}
          />
          <span>No</span>
        </label>
      </div>
    </div>
  );
}

/* ──────── Form Card Layout ──────── */
export interface ComplaintFormLayoutProps {
  title: string;
  subtitle: ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  viewLink: string;
  viewLabel?: string;
  eyebrow: string;
  formTitle: string;
  formSubtitle: string;
  sections: SectionItem[];
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  loading: boolean;
  submitLabel?: string;
  toast: { type: 'success' | 'error'; message: string } | null;
  children: ReactNode;
}

export function ComplaintFormLayout({
  title,
  subtitle,
  breadcrumbs,
  viewLink,
  viewLabel = 'View Complaints',
  eyebrow,
  formTitle,
  formSubtitle,
  sections,
  onSubmit,
  onReset,
  loading,
  submitLabel = 'Submit Complaint Ticket',
  toast,
  children,
}: ComplaintFormLayoutProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="solar-erp-page up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <Link to={viewLink} className="ax-btn ax-btn--secondary ax-btn--pill">
            <BackArrowIcon />
            <span className="ax-btn__label">{viewLabel}</span>
          </Link>
        }
      />

      <StatusBanner toast={toast} />

      <form onSubmit={onSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">{eyebrow}</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>{formTitle}</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>{formSubtitle}</p>
            </div>
            <SectionPills sections={sections} onJump={scrollToSection} />
          </div>

          <div className="ax-card__body">{children}</div>

          <div
            className="ax-card__footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}
          >
            <button type="button" className="ax-btn ax-btn--ghost" onClick={onReset} disabled={loading}>
              Reset Form
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Submitting…
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
