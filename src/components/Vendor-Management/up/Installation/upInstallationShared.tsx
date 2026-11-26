import { useEffect, useMemo, useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../hooks/useFocusTrap';
import type { ExportColumn } from '../../../../common';

export const DASH = '—';

/* ═══════════════════ FORM CSS (Goa SRT Single-Card Reference) ═══════════════════ */
export const SINGLE_CARD_FORM_CSS = `
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
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
}
.swp-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

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

.swp-site-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
}
.swp-site-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.swp-site-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
.swp-site-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #3b82f6;
}

.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) ease,
              box-shadow var(--ax-motion-fast, 0.15s) ease;
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
  transition: top var(--ax-motion-fast, 0.15s) ease,
              font-size var(--ax-motion-fast, 0.15s) ease,
              color var(--ax-motion-fast, 0.15s) ease;
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

/* ═══════════════════ TABLE & DASHBOARD PAGE CSS (Assam SWP Reference) ═══════════════════ */
export const TABLE_PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  .solar-erp-page .asw-cards-row--5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row--5 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row,
    .solar-erp-page .asw-cards-row--5 {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-pill-btn.active {
    background: var(--ax-gradient-accent, var(--ax-accent, #2563eb)) !important;
    color: var(--ax-on-accent, #ffffff) !important;
    border-color: transparent !important;
    box-shadow: var(--ax-glow-accent, 0 2px 4px rgba(37, 99, 235, 0.2)) !important;
  }

  .solar-erp-page .asw-filter-card {
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 20px;
  }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 180px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(37, 99, 235, 0.35) !important;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }
`;

export const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong, #0f172a); }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

export const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

export const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

export const centerCell = { textAlign: 'center', padding: 24 } as const;

/* ═══════════════════ Floating Input ═══════════════════ */
export interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  min?: string | number;
  placeholder?: string;
}

export function FloatingInput({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  readOnly,
  type = 'text',
  min,
  placeholder,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0) || type === 'date';

  return (
    <div className="ax-float">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        min={min}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ═══════════════════ Upload Dropzone ═══════════════════ */
export interface UploadDropzoneProps {
  id?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  helperText?: string;
  hint?: string;
  existingFileLabel?: string;
  existingFileName?: string;
  file: File | null;
  preview?: string;
  onSelect?: (file: File) => void;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  onClear?: () => void;
  error?: string;
}

export function UploadDropzone({
  id = 'upload-dropzone',
  label = 'Upload File',
  required,
  disabled,
  accept = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx',
  helperText,
  hint,
  existingFileLabel,
  existingFileName,
  file,
  preview,
  onSelect,
  onFileSelect,
  onRemove,
  onClear,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveHelper = helperText ?? hint ?? 'PDF, JPG, JPEG, PNG (Max 5 MB)';
  const effectiveExisting = existingFileLabel ?? existingFileName;
  const fireSelect = (f: File) => {
    if (onSelect) onSelect(f);
    else if (onFileSelect) onFileSelect(f);
  };
  const fireRemove = () => {
    if (onRemove) onRemove();
    else if (onClear) onClear();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    fireRemove();
    if (inputRef.current) inputRef.current.value = '';
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
          if (f) fireSelect(f);
        }}
      />

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          setIsDragging(false);
          const chosen = e.dataTransfer.files?.[0];
          if (chosen) fireSelect(chosen);
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
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
            ? '1.5px dashed #ef4444'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? '#f8fafc'
            : isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file || preview ? '12px 14px' : '22px 16px',
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
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
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
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : effectiveExisting || label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'File selected'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
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
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              Click to upload or drag & drop installation work order document
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
              {effectiveExisting ? `Current file: ${effectiveExisting} (upload new to replace)` : effectiveHelper}
            </div>
          </>
        )}
      </div>

      {error && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

/* ═══════════════════ Modal Dialog ═══════════════════ */
export function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 760,
  width,
}: {
  open?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number | string;
  width?: number | string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const effectiveMaxWidth = width ?? maxWidth;
  const styleMaxWidth = typeof effectiveMaxWidth === 'number' ? `${effectiveMaxWidth}px` : effectiveMaxWidth;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth: styleMaxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 18, height: 18 }}>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════ KPI Card ═══════════════════ */
export type KpiTone =
  | 'accent'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'red'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  primary: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  info: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  success: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  warning: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  secondary: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  red: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
  neutral: { bg: '#f1f5f9', fg: '#475569' },
};

export function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  onClick,
}: {
  icon?: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
}) {
  const t = TONE[tone] || TONE.accent;
  return (
    <div
      className={`ax-card ${onClick ? 'asw-interactive-kpi' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {icon && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: t.bg,
              color: t.fg,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      {sub !== undefined && sub !== null && (
        <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

/* ═══════════════════ Media Thumbnail & Lightbox ═══════════════════ */
export function MediaFileThumbnail({
  url,
  alt = 'File',
  filename,
  title,
  candidates,
  onClick,
  onPreview,
}: {
  url?: string | null;
  alt?: string;
  filename?: string | null;
  title?: string;
  candidates?: string[];
  onClick?: (resolvedUrl: string, title?: string, candidates?: string[]) => void;
  onPreview?: () => void;
}) {
  const effectiveCandidates = useMemo(() => {
    const list = candidates && candidates.length > 0 ? [...candidates] : [];
    if (url && !list.includes(url)) {
      list.unshift(url);
    }
    return list.filter((c) => Boolean(c && typeof c === 'string' && c.trim() && c !== '—' && c.toLowerCase() !== 'null'));
  }, [url, candidates]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setAllFailed(false);
  }, [url, candidates]);

  if (effectiveCandidates.length === 0 && !url) {
    return <span style={{ color: 'var(--ax-text-muted, #64748b)', fontSize: 12 }}>{DASH}</span>;
  }

  const activeUrl = effectiveCandidates[candidateIdx] || url || '';
  const isPdf = /\.pdf($|\?)/i.test(activeUrl);
  const isImage = !isPdf && (/\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(activeUrl) || !/\.[a-z0-9]{2,5}($|\?)/i.test(activeUrl));
  const displayTitle = title || alt || filename || 'File Preview';

  const handleClick = () => {
    if (onPreview) {
      onPreview();
    } else if (onClick) {
      onClick(activeUrl, displayTitle, effectiveCandidates);
    }
  };

  const handleImgError = () => {
    if (candidateIdx + 1 < effectiveCandidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div
      onClick={handleClick}
      title={`Click to preview ${displayTitle}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {allFailed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={1.75} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', lineHeight: 1 }}>IMG</span>
        </div>
      ) : isImage ? (
        <img
          key={activeUrl}
          src={activeUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={handleImgError}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export function MediaLightbox({
  url,
  title = 'Document Preview',
  candidates,
  onClose,
}: {
  url: string | null;
  title?: string;
  candidates?: string[];
  onClose: () => void;
}) {
  const effectiveCandidates = useMemo(() => {
    const list = candidates && candidates.length > 0 ? [...candidates] : [];
    if (url && !list.includes(url)) {
      list.unshift(url);
    }
    return list.filter((c) => Boolean(c && typeof c === 'string' && c.trim() && c !== '—' && c.toLowerCase() !== 'null'));
  }, [url, candidates]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!url) return;
    const initialIdx = effectiveCandidates.indexOf(url);
    setCandidateIdx(initialIdx >= 0 ? initialIdx : 0);
    setLoadError(false);
  }, [url, effectiveCandidates]);

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url, onClose]);

  if (!url) return null;

  const activeUrl = effectiveCandidates[candidateIdx] || url;
  const isPdf = /\.pdf($|\?)/i.test(activeUrl);
  const isDoc = /\.(heic|docx?|xlsx?|csv)($|\?)/i.test(activeUrl);

  const handleImgError = () => {
    if (candidateIdx + 1 < effectiveCandidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setLoadError(true);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            gap: 16,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{title}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: '#2563eb',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
              }}
            >
              Open Original ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
            >
              ✕
            </button>
          </div>
        </div>
        <div
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            minWidth: 320,
            minHeight: 240,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          {isPdf ? (
            <iframe
              src={activeUrl}
              title={title}
              style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
            />
          ) : isDoc ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
              <p style={{ fontSize: 14, marginBottom: 12 }}>
                Direct preview not supported for this file format in browser.
              </p>
              <a
                href={activeUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn ax-btn--primary"
                style={{ display: 'inline-block', padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
              >
                Download / Open File
              </a>
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
              <p style={{ fontSize: 14, marginBottom: 12 }}>
                Image preview could not be loaded directly.
              </p>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn ax-btn--primary"
                style={{ display: 'inline-block', padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
              >
                Open Image In New Tab ↗
              </a>
            </div>
          ) : (
            <img
              key={activeUrl}
              src={activeUrl}
              alt={title}
              onError={handleImgError}
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════ Formatting & Export Helpers ═══════════════════ */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {
    // ignore
  }
  return String(val).slice(0, 10);
};

export const fmtNum = (x?: number | string | null): string => {
  const n = Number(x);
  return isNaN(n) ? '0' : n.toLocaleString('en-IN');
};

export const fmtCurrency = (x?: number | string | null): string => {
  const n = Number(x);
  if (isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const pctOf = (a?: number | string | null, b?: number | string | null): number => {
  const na = Number(a) || 0;
  const nb = Number(b) || 0;
  return nb ? Math.round((na / nb) * 1000) / 10 : 0;
};

export function parseStringArray(raw?: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '[]') return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      // ignore
    }
  }
  return trimmed
    .split(',')
    .map((s) => s.trim().replace(/^["'\[]+|["'\]]+$/g, ''))
    .filter(Boolean);
}

function getExportValue<T>(row: T, column: ExportColumn<T>, index: number) {
  if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
  return (row as unknown as Record<string, unknown>)[column.accessor as string];
}

const escapeExportValue = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRowsCSV<T>(list: T[], columns: ExportColumn<T>[], filename: string) {
  if (!list.length || !columns.length) return;
  const out = [
    columns.map((c) => c.header),
    ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
  ];
  const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
}

export async function copyRowsToClipboard<T>(list: T[], columns: ExportColumn<T>[]) {
  if (!list.length || !columns.length) return;
  const text = [
    columns.map((c) => c.header).join('\t'),
    ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    alert('Data copied to clipboard!');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Data copied to clipboard!');
  }
}

export function exportRowsExcel<T>(list: T[], columns: ExportColumn<T>[], filename: string) {
  if (!list.length || !columns.length) return;
  const tableHtml = `<table border="1"><thead><tr>${columns
    .map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`)
    .join('')}</tr></thead><tbody>${list
    .map(
      (row, idx) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`
    )
    .join('')}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
  downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
}

export function exportRowsPDF<T>(list: T[], columns: ExportColumn<T>[], title: string) {
  if (!list.length || !columns.length) return;
  const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (!w) return;
  w.document.write(
    `<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns
      .map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`)
      .join('')}</tr></thead><tbody>${body
      .map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`)
      .join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`
  );
  w.document.close();
  w.focus();
}

export function StatusFeedbackBanners({
  errorMsg,
  successMsg,
  onClearError,
  onClearSuccess,
}: {
  errorMsg?: string | null;
  successMsg?: string | null;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}) {
  return (
    <>
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
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
            >
              ×
            </button>
          )}
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
          {onClearSuccess && (
            <button
              type="button"
              onClick={onClearSuccess}
              style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
            >
              ×
            </button>
          )}
        </div>
      )}
    </>
  );
}
