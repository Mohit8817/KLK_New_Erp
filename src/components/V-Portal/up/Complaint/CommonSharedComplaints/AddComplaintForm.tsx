import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

/**
 * Shared complaint form styling — identical to the Kashmir SRT 70MW Survey page.
 * - Single card, header with eyebrow + section pills
 * - Floating labels, native ax-select, FieldFeedback below every field
 * - Drag & drop upload box (with existing-file preview support)
 * - Sticky action bar OUTSIDE the card, badge on the left, buttons on the right
 * - Dashed section dividers, "Section N of T" badge headers, footer copyright
 *
 * Class names (up-*) and all exports are unchanged, so the other UP pages keep working.
 */
export const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.up-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.up-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.up-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.up-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.up-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.up-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.up-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.up-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.up-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.up-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

/* ──────── Grid ──────── */
.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) {
  .up-form-grid--2col { grid-template-columns: repeat(2, 1fr); }
  .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); }
  .up-form-grid--4col { grid-template-columns: repeat(4, 1fr); }
}
.ax-col--span-2 { grid-column: span 2 / span 2; }
.ax-col--span-3 { grid-column: span 3 / span 3; }
.ax-col--span-full { grid-column: 1 / -1; }
@media (max-width: 1023px) {
  .ax-col--span-2, .ax-col--span-3 { grid-column: 1 / -1; }
}

/* ──────── Floating inputs ──────── */
.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float.has-value .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--area.has-value .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

/* ──────── Read-only info card ──────── */
.up-info-card { background: var(--ax-surface-subtle); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-lg); padding: var(--ax-space-4); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--ax-space-3); font-size: var(--ax-text-xs); }
.up-info-item { display: flex; flex-direction: column; gap: 2px; }
.up-info-label { color: var(--ax-text-muted); font-weight: 500; font-size: 11px; }
.up-info-value { color: var(--ax-text-strong); font-weight: 600; word-break: break-word; }

/* ──────── Sticky action bar ──────── */
.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
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
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l14 0" />
    <path d="M5 12l6 6" />
    <path d="M5 12l6 -6" />
  </svg>
);

/* ──────── Alert banner (success / error) ──────── */
export function StatusBanner({ toast }: { toast: { type: 'success' | 'error'; message: string } | null }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`ax-alert ax-alert--${isSuccess ? 'success' : 'danger'}`}
      role={isSuccess ? 'status' : 'alert'}
      style={{ marginBottom: 'var(--ax-space-6)' }}
    >
      <span className="ax-alert__icon">
        {isSuccess ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5l10 -10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" />
            <path d="M12 16h.01" />
          </svg>
        )}
      </span>
      <div className="ax-alert__content">
        <h4 className="ax-alert__title" style={{ fontSize: isSuccess ? 'var(--ax-text-base)' : undefined, fontWeight: 600 }}>
          {toast.message}
        </h4>
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
          <span className="pill-num">{s.num}</span>
          <span>{s.title}</span>
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
  desc?: ReactNode;
}) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            {total ? `Section ${num} of ${total}` : `Section ${num}`}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ──────── Read-only Info Item ──────── */
export function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  const displayVal = value !== null && value !== undefined && value !== '' ? String(value) : '—';
  return (
    <div className="up-info-item">
      <span className="up-info-label">{label}</span>
      <span className="up-info-value">{displayVal}</span>
    </div>
  );
}

/* ──────── Shared bits ──────── */
const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

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

/* ──────── Floating Input ──────── */
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
  style?: CSSProperties;
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
  className,
  style,
}: FloatingInputProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  const isDate = type === 'date' || type === 'datetime-local' || type === 'month';

  return (
    <div className={className} style={style}>
      <div className={`ax-float ${hasValue ? 'has-value' : ''} ${isDate ? 'ax-float--date' : ''}`}>
        <input
          id={id}
          type={type}
          step={step}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
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

/* ──────── Floating Select ──────── */
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
  style?: CSSProperties;
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
  className,
  style,
}: FloatingSelectProps) {
  return (
    <div className={className} style={style}>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
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

/* ──────── Floating Textarea ──────── */
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
  style?: CSSProperties;
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
  className,
  style,
}: FloatingTextareaProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div className={className} style={style}>
      <div className={`ax-float ax-float--area ${hasValue ? 'has-value' : ''}`}>
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
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

/* ──────── Drag & Drop File Input (same as Kashmir) ──────── */
export interface FloatingFileInputProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  error?: string;
  required?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

export function FloatingFileInput({
  id,
  label,
  file,
  onChange,
  existingUrl,
  error,
  required,
  accept = 'image/*,.pdf',
  disabled,
  className,
  style,
}: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  const existingClean = existingUrl ? existingUrl.split('?')[0] : '';
  const existingName = existingClean ? existingClean.split('/').pop() : null;
  const existingIsImage = Boolean(existingClean && IMG_RE.test(existingClean));

  const thumbStyle: CSSProperties = {
    width: 44,
    height: 44,
    objectFit: 'cover',
    borderRadius: 0,
    border: '1px solid var(--ax-border)',
    flexShrink: 0,
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

  return (
    <div className={`${error ? 'is-invalid' : ''} ${className ?? ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
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
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div
        onClick={openPicker}
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
            openPicker();
          }
        }}
        style={{
          border: isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file || existingName ? '12px 16px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {objectUrl ? (
                <img src={objectUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#ecfdf5', '#10b981',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )
              )}
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
              {existingIsImage && existingUrl ? (
                <img src={existingUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#eff6ff', '#3b82f6',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              )}
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
              {accept === 'application/pdf' ? 'PDF file' : 'JPG, PNG, WEBP or PDF'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
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

  const pill = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 'var(--ax-radius-pill, 9999px)',
    fontSize: 12,
    fontWeight: 600,
    border: active ? '1.5px solid var(--ax-accent)' : '1px solid var(--ax-border)',
    background: active ? 'color-mix(in srgb, var(--ax-accent) 12%, transparent)' : 'var(--ax-surface-solid)',
    color: active ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });
  const dot = (active: boolean): CSSProperties => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: active ? '4px solid var(--ax-accent)' : '1.5px solid var(--ax-border)',
    background: '#ffffff',
    boxSizing: 'border-box',
  });

  return (
    <div role="radiogroup" aria-label={label} data-name={name} style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => onChange(yesValue)} style={pill(isYes)}>
          <span style={dot(isYes)} />
          <span>Yes</span>
        </button>
        <button type="button" onClick={() => onChange(noValue)} style={pill(!isYes)}>
          <span style={dot(!isYes)} />
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
  formSubtitle: ReactNode;
  sections: SectionItem[];
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  loading: boolean;
  submitLabel?: string;
  /** Small badge on the left of the sticky bar (like "New Survey" in Kashmir) */
  statusLabel?: string;
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
  submitLabel = 'Submit Complaint',
  statusLabel = 'New Complaint',
  toast,
  children,
}: ComplaintFormLayoutProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll to top when a banner appears (same behaviour as Kashmir)
  useEffect(() => {
    if (toast) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toast]);

  return (
    <div className="solar-erp-page up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={title}
        subtitle={
          typeof subtitle === 'string' ? (
            <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>{subtitle}</span>
          ) : (
            subtitle
          )
        }
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
        {/* ── Unified single card ── */}
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">{eyebrow}</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {formTitle}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                {formSubtitle}
              </p>
            </div>
            <SectionPills sections={sections} onJump={scrollToSection} />
          </div>

          <div className="ax-card__body">{children}</div>
        </div>

        {/* ── Sticky action footer (outside the card, same as Kashmir) ── */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">{statusLabel}</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={onReset} disabled={loading}>
              <span className="ax-btn__label">Reset Form</span>
            </button>
            <button type="submit" disabled={loading} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {loading ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}>
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                  <span className="ax-btn__label">{submitLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}