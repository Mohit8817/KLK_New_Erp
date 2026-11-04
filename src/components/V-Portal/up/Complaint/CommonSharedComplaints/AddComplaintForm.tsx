import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

/**
 * Unified Single-Card Form Styling matching Bihar AMC Add Data Design
 * Features:
 * - Single card with distinct header & section navigation pills
 * - Floating labels that transition smoothly to field border
 * - Floating select with sleek chevron indicator
 * - Floating textarea with generous multiline padding
 * - Modern upload drop area with cloud upload icon, browse button, and clear action
 * - Floating sticky bottom action bar with backdrop-blur
 * - Consistent alerts and responsive 1-, 2-, 3- and 4-column form grid
 */
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
  flex-wrap: wrap;
  padding-top: var(--ax-space-1, 4px);
}
.up-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 600;
  border: 1px solid var(--ax-border, #cbd5e1);
  background: var(--ax-surface-solid, #ffffff);
  color: var(--ax-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.up-section-pill-btn:hover {
  background: var(--ax-surface-hover, #f1f5f9);
  color: var(--ax-text-strong, #0f172a);
  border-color: var(--ax-accent, #2563eb);
}
.up-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  color: var(--ax-text-subtle, #64748b);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.up-section-block {
  padding-top: var(--ax-space-2, 8px);
}
.up-section-block + .up-section-block {
  margin-top: var(--ax-space-8, 32px);
  padding-top: var(--ax-space-6, 24px);
  border-top: 1px solid var(--ax-border-subtle, #f1f5f9);
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
  border-top: 1px solid var(--ax-border-subtle, #f1f5f9);
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

.ax-col--span-2 { grid-column: span 2 / span 2; }
.ax-col--span-3 { grid-column: span 3 / span 3; }
.ax-col--span-full { grid-column: 1 / -1; }

@media (max-width: 900px) {
  .ax-col--span-3 { grid-column: 1 / -1; }
}
@media (max-width: 600px) {
  .ax-col--span-2, .ax-col--span-3 { grid-column: 1 / -1; }
}

/* ──────── Floating Inputs (Exact Bihar AMC Add Data) ──────── */
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
  border-radius: var(--ax-radius-md, 8px);
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
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 20%, transparent);
}
.ax-float__input[readonly] {
  background: var(--ax-surface-subtle, #f8fafc);
  opacity: 0.9;
}
.ax-float__input:disabled {
  background: var(--ax-surface-subtle, #f8fafc);
  opacity: 0.7;
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
  border-radius: 4px;
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
.ax-float.has-value .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--ax-text-muted, #64748b);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent, #2563eb);
}

.ax-float.has-error .ax-float__input,
.ax-float__input.is-invalid {
  border-color: var(--ax-danger, #ef4444) !important;
}
.ax-float.has-error .ax-float__input:focus,
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger, #ef4444) 20%, transparent) !important;
}
.ax-float.has-error .ax-float__label,
.ax-float__input.is-invalid + .ax-float__label {
  color: var(--ax-danger, #ef4444) !important;
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
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--area.has-value .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
}

.ax-field__error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--ax-danger, #ef4444);
  margin-top: 4px;
  padding-left: 2px;
}

/* ──────── Modern Upload Box ──────── */
.up-upload-box {
  border: 1px dashed var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  padding: 8px 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 46px;
  box-sizing: border-box;
}

/* ──────── Read-only Info Card (Key-Value) ──────── */
.up-info-card {
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-lg, 8px);
  padding: var(--ax-space-4, 16px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ax-space-3, 12px);
  font-size: var(--ax-text-xs, 12px);
}
.up-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.up-info-label {
  color: var(--ax-text-muted, #64748b);
  font-weight: 500;
  font-size: 11px;
}
.up-info-value {
  color: var(--ax-text-strong, #0f172a);
  font-weight: 600;
  word-break: break-word;
}

/* ──────── Sticky Action Bar (Exact Bihar AMC Add Data) ──────── */
.up-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4, 16px);
  z-index: 30;
  margin-top: var(--ax-space-6, 24px);
  padding: 12px 20px;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 12px);
  box-shadow: var(--ax-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  backdrop-filter: blur(12px);
}

@keyframes up-spin {
  to { transform: rotate(360deg); }
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
      style={{ marginBottom: 'var(--ax-space-5, 20px)' }}
      role="status"
    >
      <span className="ax-alert__icon">
        {toast.type === 'success' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <path d="M5 12l5 5l10 -10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>
      <div className="ax-alert__content">
        <h4 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base, 15px)', fontWeight: 600, margin: 0 }}>
          {toast.type === 'success' ? 'Success' : 'Error'}
        </h4>
        <div className="ax-alert__text" style={{ marginTop: 2, fontSize: 'var(--ax-text-sm, 13px)' }}>
          {toast.message}
        </div>
      </div>
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
    <div className="up-section-pills" role="navigation" aria-label="Jump to section">
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--ax-accent, #2563eb)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {num}
          </span>
          <h3 className="ax-card__title" style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>
            {title}
          </h3>
          {total && (
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', fontWeight: 500 }}>
              (Step {num} of {total})
            </span>
          )}
        </div>
        {desc && <p className="ax-card__subtitle" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ax-text-muted, #64748b)' }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ──────── Read-only Info Item Component ──────── */
export function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  const displayVal = value !== null && value !== undefined && value !== '' ? String(value) : '—';
  return (
    <div className="up-info-item">
      <span className="up-info-label">{label}</span>
      <span className="up-info-value">{displayVal}</span>
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
  const isDate = type === 'date' || type === 'datetime-local' || type === 'month';

  return (
    <div
      className={`ax-float ${hasValue ? 'has-value' : ''} ${isDate ? 'ax-float--date' : ''} ${error ? 'has-error' : ''} ${className}`}
      style={style}
    >
      <input
        id={id}
        type={type}
        className={`ax-float__input ${error ? 'is-invalid' : ''}`}
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
      {error && (
        <div className="ax-field__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
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
    <div
      className={`ax-float ax-float--select ${hasValue ? 'has-value' : ''} ${error ? 'has-error' : ''} ${className}`}
      style={style}
    >
      <select
        id={id}
        className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ paddingRight: 36, appearance: 'none', WebkitAppearance: 'none' }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 14,
          height: 14,
          color: 'var(--ax-text-muted, #64748b)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <label htmlFor={id} className="ax-float__label">
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && (
        <div className="ax-field__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
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
    <div
      className={`ax-float ax-float--area ${hasValue ? 'has-value' : ''} ${error ? 'has-error' : ''} ${className}`}
      style={style}
    >
      <textarea
        id={id}
        className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        rows={rows}
        style={{ height: 'auto', minHeight: 84, paddingTop: 18 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <label htmlFor={id} className="ax-float__label">
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && (
        <div className="ax-field__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18, color: 'var(--ax-accent, #2563eb)', flexShrink: 0 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <input
            id={id}
            type="file"
            accept={accept}
            disabled={disabled}
            style={{ fontSize: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </div>
        {file && (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm"
            style={{
              padding: '2px 8px',
              height: 26,
              fontSize: 11,
              color: 'var(--ax-danger, #ef4444)',
              borderRadius: 4,
              flexShrink: 0,
            }}
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        )}
      </div>
      <label htmlFor={id} className="ax-float__label" style={{ top: 0, fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
      {error && (
        <div className="ax-field__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
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
  label = 'Send SMS Notification',
}: SmsRadioGroupProps) {
  const isYes = value.toLowerCase() === yesValue.toLowerCase() || value === 'Yes';

  return (
    <div role="radiogroup" aria-label={label} style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => onChange(yesValue)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 'var(--ax-radius-pill, 9999px)',
            fontSize: 12,
            fontWeight: 600,
            border: isYes ? '1.5px solid var(--ax-accent, #2563eb)' : '1px solid var(--ax-border, #cbd5e1)',
            background: isYes ? 'color-mix(in srgb, var(--ax-accent, #2563eb) 12%, transparent)' : 'var(--ax-surface-solid, #ffffff)',
            color: isYes ? 'var(--ax-accent, #2563eb)' : 'var(--ax-text-muted, #64748b)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: isYes ? '4px solid var(--ax-accent, #2563eb)' : '1.5px solid var(--ax-border, #cbd5e1)',
              background: '#ffffff',
              boxSizing: 'border-box',
            }}
          />
          <span>Yes</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(noValue)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 'var(--ax-radius-pill, 9999px)',
            fontSize: 12,
            fontWeight: 600,
            border: !isYes ? '1.5px solid var(--ax-accent, #2563eb)' : '1px solid var(--ax-border, #cbd5e1)',
            background: !isYes ? 'color-mix(in srgb, var(--ax-accent, #2563eb) 12%, transparent)' : 'var(--ax-surface-solid, #ffffff)',
            color: !isYes ? 'var(--ax-accent, #2563eb)' : 'var(--ax-text-muted, #64748b)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: !isYes ? '4px solid var(--ax-accent, #2563eb)' : '1.5px solid var(--ax-border, #cbd5e1)',
              background: '#ffffff',
              boxSizing: 'border-box',
            }}
          />
          <span>No</span>
        </button>
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
    <div className="solar-erp-page up-single-card-form" style={{ paddingBottom: 'var(--ax-space-6, 24px)' }}>
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
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ax-accent, #2563eb)',
                  marginBottom: 2,
                }}
              >
                {eyebrow}
              </span>
              <h2 className="ax-card__title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {formTitle}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                {formSubtitle}
              </p>
            </div>
            <SectionPills sections={sections} onJump={scrollToSection} />
          </div>

          <div className="ax-card__body">{children}</div>

          {/* Sticky Action Bar matching Bihar AMC Add Data */}
          <div className="up-form-sticky-bar">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={onReset}
              disabled={loading}
              style={{ fontWeight: 600, paddingInline: 18 }}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading}
              style={{
                fontWeight: 600,
                paddingInline: 24,
                boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="ax-spinner"
                    style={{
                      marginRight: 8,
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'up-spin 0.8s linear infinite',
                    }}
                  />
                  Submitting…
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
