<<<<<<< HEAD
import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
=======
import { useCallback, useEffect, useRef, useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  punjabSslInstallationService,
  resolvePunjabMediaUrl,
  type PunjabLightDropdownItem,
  type PunjabLightDetail,
} from '../../punjab-services';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

<<<<<<< HEAD
// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Arunachal & Assam reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
=======
// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam SWP reference)
const SINGLE_CARD_FORM_CSS = `
.punjab-ssl-form .ax-card {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
<<<<<<< HEAD
.swp-inst-form .ax-card__header {
=======
.punjab-ssl-form .ax-card__header {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
<<<<<<< HEAD
.swp-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.swp-section-pills {
=======
.punjab-ssl-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.ssl-section-pills {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
<<<<<<< HEAD
.swp-section-pill-btn {
=======
.ssl-section-pill-btn {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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
<<<<<<< HEAD
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
=======
  color: var(--ax-text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ssl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
}
.ssl-section-pill-btn .pill-num {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
<<<<<<< HEAD
.swp-section-block { padding-top: var(--ax-space-2, 8px); }
.swp-section-header {
=======
.ssl-section-block { padding-top: var(--ax-space-2, 8px); }
.ssl-section-header {
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
<<<<<<< HEAD
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
=======
.ssl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ssl-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core (matching Assam FloatingInput) */
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13.5px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
<<<<<<< HEAD
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus::placeholder { color: #94a3b8; }
=======
  color: var(--ax-text, #1e293b);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
<<<<<<< HEAD
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
=======
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
.ax-float__input.is-invalid {
  border-color: #ef4444 !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

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
<<<<<<< HEAD
  transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
=======
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating {
  top: 0;
  font-size: 11px;
<<<<<<< HEAD
  font-weight: 500;
=======
  font-weight: 600;
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
<<<<<<< HEAD

/* GPS Section 3 columns in 1 line */
.swp-gps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 768px) {
  .swp-gps-grid {
    grid-template-columns: 1fr;
  }
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
  onCameraClick?: () => void;
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
  onCameraClick,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  const inputNode = (
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
        style={onCameraClick ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined}
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );

  if (onCameraClick) {
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
        {inputNode}
        <button
          type="button"
          className="ax-btn ax-btn--secondary"
          onClick={onCameraClick}
          title={`Scan barcode for ${label}`}
          aria-label={`Scan barcode for ${label}`}
          style={{
            height: 46,
            padding: '0 12px',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '12px',
            flexShrink: 0,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            borderColor: 'var(--ax-border, #cbd5e1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Scan</span>
        </button>
      </div>
    );
  }

  return inputNode;
}

/* ───────── Modern Upload Dropzone (matching reference code) ───────── */
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
  accept = 'image/*',
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
        capture="environment"
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
          padding: file || preview ? '12px 14px' : '22px 16px',
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
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Photo captured'}
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
              Choose File <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 12 }}>No file chosen</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG or JPEG image — single file (Max 5MB)
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
=======
.ax-float__label.is-error {
  color: #ef4444 !important;
}

/* Grids */
.ssl-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4, 16px);
}
@media (min-width: 1024px) {
  .ssl-form-grid--3col { grid-template-columns: repeat(3, 1fr); }
}

.ssl-site-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ax-space-3, 12px);
}
@media (min-width: 1024px) {
  .ssl-site-info-grid { grid-template-columns: repeat(4, 1fr); }
}
.ssl-site-info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-lg, 10px);
}
.ssl-site-info-card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ax-text-muted, #64748b);
}
.ssl-site-info-card__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ax-text-strong, #0f172a);
}

/* Sticky Action Bar */
.ssl-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4, 16px);
  z-index: 30;
  margin-top: var(--ax-space-6, 24px);
  padding: 14px 24px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 14px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3, 12px);
}
`;

const MAX_FILE = 5 * 1024 * 1024; // 5120 KB per documentation

/* ───────── Floating Input Component (Exact Assam SWP Style) ───────── */
interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
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
  maxLength,
  error,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="ax-float">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          placeholder={placeholder || label}
          className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        />
        <label
          htmlFor={name}
          className={`ax-float__label ${error ? 'is-error' : ''} ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      </div>
      {error && (
        <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ───────── Modern Upload Dropzone (matching Assam SWP InstallationSite) ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  existingUrl?: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
  helperText?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  accept = 'image/*,application/pdf',
  file,
  preview,
  existingUrl,
  onSelect,
  onRemove,
  error,
  helperText,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentPreview = preview || existingUrl;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onSelect(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? '#ef4444' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      {helperText && (
        <span style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
          {helperText}
        </span>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture="environment"
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
            ? '1.5px dashed #ef4444'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 10,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          padding: file || currentPreview ? '12px 14px' : '22px 16px',
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
        {file || currentPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {currentPreview ? (
                <img
                  src={currentPreview}
                  alt={label}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : 'Existing Uploaded Photo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Saved on server'}
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
              {file ? 'Remove' : 'Change'}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to capture or drag & drop photo
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG or PDF (Max 5MB)
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

type FormFields = {
  wardNo: string;
  poleNo: string;
  beneficiaryName: string;
  contactNo: string;
  uuidNo: string;
  batteryNo: string;
  panelNo: string;
  lightNo: string;
  latitude: string;
  longitude: string;
  remarks: string;
};

const EMPTY_FORM: FormFields = {
  wardNo: '',
  poleNo: '',
  beneficiaryName: '',
  contactNo: '',
  uuidNo: '',
  batteryNo: '',
  panelNo: '',
  lightNo: '',
  latitude: '',
  longitude: '',
  remarks: '',
};
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

export function Punjab_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

<<<<<<< HEAD
  const editId = searchParams.get('ssl_id') || searchParams.get('id') || searchParams.get('edit_id') || searchParams.get('light_id');
  const isEditMode = Boolean(editId);

  // Logged-in Vendor name resolution from AuthContext, active session & storage
  const loginVendorName = useMemo(() => {
    const getCleanString = (val: any): string => {
      if (
        typeof val === 'string' &&
        val.trim() &&
        val.trim().toLowerCase() !== '[object object]' &&
        val.trim().toLowerCase() !== 'null' &&
        val.trim().toLowerCase() !== 'undefined'
      ) {
        return val.trim();
=======
  // Section Refs for smooth scrolling
  const sec1Ref = useRef<HTMLDivElement>(null);
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Dropdown list
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<PunjabLightDropdownItem[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string>(editIdParam ? String(editIdParam) : '');

  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<PunjabLightDetail | null>(null);

  // Form inputs
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightFile2, setLightFile2] = useState<File | null>(null);
  const [filePreview2, setFilePreview2] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageUrl2, setExistingImageUrl2] = useState<string | null>(null);

  // GPS state
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Validation & alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setLightFile(null);
    setFilePreview(null);
    setLightFile2(null);
    setFilePreview2(null);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setErrors({});
    setGpsStatusMsg(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, []);

  // Fetch dropdown list on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await punjabSslInstallationService.fetchLightNames();
        if (active) setLightOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('[Punjab SSL] fetch dropdown error:', err);
      } finally {
        if (active) setDropdownLoading(false);
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
      }
      return '';
    };

<<<<<<< HEAD
    // 1. From AuthContext reactive state
    if (user) {
      const fromUser =
        getCleanString((user as any).vendor_name) ||
        getCleanString((user as any).vendor) ||
        getCleanString((user as any).name) ||
        getCleanString((user as any).vendor_id) ||
        getCleanString((user as any).username) ||
        getCleanString((user as any).email);
      if (fromUser) return fromUser;
=======
  // Handle selecting a light from dropdown
  const handleSelectLight = useCallback(async (idOrUid: string) => {
    setSelectedLightId(idOrUid);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!idOrUid) {
      setSiteDetail(null);
      resetForm();
      return;
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.user?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name) ||
        getCleanString(rawResponse?.data?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor) ||
        getCleanString(rawResponse?.data?.name) ||
        getCleanString(rawResponse?.data?.user?.name) ||
        getCleanString(rawResponse?.vendor_id) ||
        getCleanString(rawResponse?.data?.vendor_id);
      if (fromRaw) return fromRaw;
    }

    // 2. From authService storage methods
    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.name) ||
          getCleanString(session.vendor_id) ||
          getCleanString(session.username);
        if (fromSession) return fromSession;
      }

<<<<<<< HEAD
      const raw = authService.getRawResponse() as any;
      if (raw) {
        const fromRaw =
          getCleanString(raw?.vendor?.name) ||
          getCleanString(raw?.vendor?.vendor_name) ||
          getCleanString(raw?.vendor) ||
          getCleanString(raw?.vendor_name) ||
          getCleanString(raw?.name) ||
          getCleanString(raw?.user?.name) ||
          getCleanString(raw?.data?.vendor?.name) ||
          getCleanString(raw?.data?.vendor_name) ||
          getCleanString(raw?.data?.vendor) ||
          getCleanString(raw?.data?.name) ||
          getCleanString(raw?.data?.user?.name) ||
          getCleanString(raw?.vendor_id) ||
          getCleanString(raw?.data?.vendor_id);
        if (fromRaw) return fromRaw;
      }
    } catch {}
=======
      setSiteDetail(detail);
      if (detail) {
        setForm({
          wardNo: detail.ward_no ? String(detail.ward_no) : '',
          poleNo: detail.pole_no ? String(detail.pole_no) : '',
          beneficiaryName: detail.beneficiary_name || '',
          contactNo: detail.contact_no ? String(detail.contact_no) : '',
          uuidNo: detail.uuid_no ? String(detail.uuid_no) : '',
          batteryNo: detail.battery_serial_no ? String(detail.battery_serial_no) : '',
          panelNo: detail.panel_no ? String(detail.panel_no) : '',
          lightNo: detail.light_no ? String(detail.light_no) : '',
          latitude: detail.latitude ? String(detail.latitude) : '',
          longitude: detail.longitude ? String(detail.longitude) : '',
          remarks: detail.remark || detail.inst_remark || '',
        });

        if (detail.light_file) setExistingImageUrl(getMediaUrl(detail.light_file));
        if (detail.light_file2) setExistingImageUrl2(getMediaUrl(detail.light_file2));
        setErrors({});
      }
    } catch (err) {
      console.error('[Punjab SSL] fetch detail error:', err);
      setSiteDetail(null);
      setErrorMsg('Could not fetch light details from server.');
    } finally {
      setDetailLoading(false);
    }
  }, [isEditMode, resetForm]);
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

    // 3. Direct localStorage / sessionStorage inspect fallback
    try {
      const sessionStr = sessionStorage.getItem('klk_user_session') || localStorage.getItem('klk_user_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        const fromParsed =
          getCleanString(parsed?.vendor_name) ||
          getCleanString(parsed?.vendor) ||
          getCleanString(parsed?.name) ||
          getCleanString(parsed?.vendor_id);
        if (fromParsed) return fromParsed;
      }

      const rawStr = sessionStorage.getItem('klk_raw_login_response') || localStorage.getItem('klk_raw_login_response');
      if (rawStr) {
        const parsedRaw = JSON.parse(rawStr);
        const fromParsedRaw =
          getCleanString(parsedRaw?.vendor?.name) ||
          getCleanString(parsedRaw?.vendor?.vendor_name) ||
          getCleanString(parsedRaw?.vendor) ||
          getCleanString(parsedRaw?.vendor_name) ||
          getCleanString(parsedRaw?.name) ||
          getCleanString(parsedRaw?.user?.name) ||
          getCleanString(parsedRaw?.data?.vendor?.name) ||
          getCleanString(parsedRaw?.data?.vendor_name) ||
          getCleanString(parsedRaw?.data?.vendor) ||
          getCleanString(parsedRaw?.data?.name);
        if (fromParsedRaw) return fromParsedRaw;
      }
    } catch {}

    return '';
  }, [user, rawResponse]);

  // Light Dropdown & Detail State
  const [lightsList, setLightsList] = useState<PunjabLightDropdownItem[]>([]);
  const [loadingLights, setLoadingLights] = useState(false);
  const [selectedLightId, setSelectedLightId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<PunjabLightDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State (Section 3 manual entry)
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [uuidNo, setUuidNo] = useState('');
  const [lightNo, setLightNo] = useState('');
  const [panelNo, setPanelNo] = useState('');
  const [batteryNo, setBatteryNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // Camera Barcode Scanner Modal State
  const [scannerTarget, setScannerTarget] = useState<'uuid' | 'panel' | 'battery' | 'light' | null>(null);

  // Photo Files & Previews (2 photos for Punjab SSL)
  const [files, setFiles] = useState<{
    light_file: File | null;
    light_file2: File | null;
  }>({
    light_file: null,
    light_file2: null,
  });

  const [previews, setPreviews] = useState<{
    light_file: string;
    light_file2: string;
  }>({
    light_file: '',
    light_file2: '',
  });

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Section refs for smooth scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending lights list (API 3) in Add mode
  useEffect(() => {
<<<<<<< HEAD
    if (isEditMode) return;
    const fetchLights = async () => {
      try {
        setLoadingLights(true);
        const data = await punjabSslInstallationService.fetchLightNames();
        setLightsList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('[Punjab SSL Installation] fetchLightNames error:', err);
      } finally {
        setLoadingLights(false);
=======
    if (editIdParam) {
      handleSelectLight(String(editIdParam));
    }
  }, [editIdParam, handleSelectLight]);

  // GPS detection handler
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your device browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS coordinates…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.latitude;
          delete next.longitude;
          return next;
        });
        setGpsDetecting(false);
        setGpsStatusMsg(`✓ GPS Acquired (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS error: ${err.message}. Please enter manually.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  const handleInputChange = (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhotoSelect = (isSecond: boolean) => (file: File) => {
    if (file.size > MAX_FILE) {
      setErrorMsg(`File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (isSecond) {
        setLightFile2(file);
        setFilePreview2(reader.result as string);
        setErrors((prev) => { const n = { ...prev }; delete n.light_file2; return n; });
      } else {
        setLightFile(file);
        setFilePreview(reader.result as string);
        setErrors((prev) => { const n = { ...prev }; delete n.light_file; return n; });
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
      }
    };
    fetchLights();
  }, [isEditMode]);

  // 2. Load light details on selection (API 4)
  const handleLightSelect = async (lightIdOrUid: string) => {
    setSelectedLightId(lightIdOrUid);
    setSiteDetail(null);

    // Keep all editable inputs in Section 3 ("Fill this Form") completely blank for manual entry!
    setBeneficiaryName('');
    setContactNo('');
    setWardNo('');
    setPoleNo('');
    setUuidNo('');
    setLightNo('');
    setPanelNo('');
    setBatteryNo('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setFiles({ light_file: null, light_file2: null });
    setPreviews({ light_file: '', light_file2: '' });

    if (!lightIdOrUid) return;

    try {
      setLoadingDetail(true);
      const detail = await punjabSslInstallationService.fetchLightDetail(lightIdOrUid);
      if (detail) {
        // ONLY populate siteDetail for Section 2 (read-only display)
        setSiteDetail(detail);
        if (detail.id) setSelectedLightId(String(detail.id));

        // Editable form inputs in Section 3 ("Fill this Form") remain blank for manual entry by technician:
        setBeneficiaryName('');
        setContactNo('');
        setWardNo('');
        setPoleNo('');
        setUuidNo('');
        setLightNo('');
        setPanelNo('');
        setBatteryNo('');
        setLatitude('');
        setLongitude('');
        setRemarks('');
        setFiles({ light_file: null, light_file2: null });
        setPreviews({ light_file: '', light_file2: '' });
      }
    } catch (err: any) {
      console.error('[Punjab SSL Installation] fetchLightDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load light site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

<<<<<<< HEAD
  // 3. Load for Edit (API 6) if in Edit mode
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    const loadForEdit = async () => {
      setLoadingDetail(true);
      try {
        let detail = await punjabSslInstallationService.getUpdateInstallLightLoad(editId);
        if (!detail) {
          detail = await punjabSslInstallationService.fetchLightDetail(editId);
        }
        if (!isMounted) return;

        if (detail) {
          const idVal = String(detail.id || editId);
          setSelectedLightId(idVal);
          setSiteDetail(detail);
          setBeneficiaryName(detail.beneficiary_name || '');
          setContactNo(detail.contact_no ? String(detail.contact_no) : '');
          setWardNo(detail.ward_no ? String(detail.ward_no) : '');
          setPoleNo(detail.pole_no ? String(detail.pole_no) : '');
          setUuidNo(detail.uuid_no ? String(detail.uuid_no) : '');
          setLightNo(detail.light_no ? String(detail.light_no) : '');
          setPanelNo(detail.panel_no ? String(detail.panel_no) : '');
          setBatteryNo(detail.battery_serial_no || detail.battery_no || '');
          setLatitude(detail.latitude ? String(detail.latitude) : '');
          setLongitude(detail.longitude ? String(detail.longitude) : '');
          setRemarks(detail.remark || detail.inst_remark || '');

          if (detail.light_file) {
            setPreviews((p) => ({ ...p, light_file: resolvePunjabMediaUrl(detail.light_file) }));
          }
          if (detail.light_file2) {
            setPreviews((p) => ({ ...p, light_file2: resolvePunjabMediaUrl(detail.light_file2) }));
          }
        }
      } catch (err: any) {
        if (isMounted) setFeedback({ type: 'danger', text: err?.message || 'Failed to load light details for edit' });
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };
    loadForEdit();
    return () => { isMounted = false; };
  }, [editId]);

  // Remove photo handler
  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
      setPreviews((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude.toFixed(6)));
        setLongitude(String(pos.coords.longitude.toFixed(6)));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Please enter manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submit (API 5 or API 7)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sslNumericId = siteDetail?.id || Number(selectedLightId);
    if (!sslNumericId) {
      setFeedback({ type: 'danger', text: 'Please select an installation light first.' });
      scrollTo(sec1);
      return;
    }

    if (!beneficiaryName.trim()) {
      setFeedback({ type: 'danger', text: 'Beneficiary Name is required.' });
      scrollTo(sec3);
      return;
    }
    const cleanPhone = contactNo.replace(/\D/g, '').trim();
    if (cleanPhone.length !== 10) {
      setFeedback({ type: 'danger', text: 'Contact Number must be exactly 10 digits.' });
      scrollTo(sec3);
      return;
    }
    if (!wardNo.trim()) {
      setFeedback({ type: 'danger', text: 'Ward Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!poleNo.trim()) {
      setFeedback({ type: 'danger', text: 'Pole Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!uuidNo.trim()) {
      setFeedback({ type: 'danger', text: 'UUID Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!panelNo.trim()) {
      setFeedback({ type: 'danger', text: 'Solar Panel Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!batteryNo.trim()) {
      setFeedback({ type: 'danger', text: 'Battery Serial Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!lightNo.trim()) {
      setFeedback({ type: 'danger', text: 'Light Luminary Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'GPS Latitude and Longitude are required.' });
      scrollTo(sec3);
      return;
    }

    if (!isEditMode) {
      if (!files.light_file) {
        setFeedback({ type: 'danger', text: 'Light Installation Photo 1 is required.' });
        scrollTo(sec3);
        return;
      }
      if (!files.light_file2) {
        setFeedback({ type: 'danger', text: 'Light Installation Photo 2 is required.' });
        scrollTo(sec3);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFeedback(null);
=======
  const handlePhotoRemove = (isSecond: boolean) => () => {
    if (isSecond) {
      setLightFile2(null);
      setFilePreview2(null);
      setExistingImageUrl2(null);
    } else {
      setLightFile(null);
      setFilePreview(null);
      setExistingImageUrl(null);
    }
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const sslNumericId = siteDetail?.id || Number(selectedLightId);
    if (!sslNumericId && !siteDetail) {
      setErrorMsg('Please select an allocated Light ID from the dropdown.');
      scrollToSection(sec1Ref);
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!form.beneficiaryName.trim()) newErrors.beneficiaryName = 'Beneficiary Name is required.';
    if (!form.wardNo.trim()) newErrors.wardNo = 'Ward Number is required.';

    const cleanContact = form.contactNo.replace(/\D/g, '');
    if (!cleanContact) {
      newErrors.contactNo = 'Contact Number is required.';
    } else if (cleanContact.length !== 10) {
      newErrors.contactNo = 'Contact number must be exactly 10 digits.';
    }

    if (!form.uuidNo.trim()) newErrors.uuidNo = 'UUID Number is required.';
    if (!form.poleNo.trim()) newErrors.poleNo = 'Pole Number is required.';
    if (!form.lightNo.trim()) newErrors.lightNo = 'Light Luminary Number is required.';
    if (!form.panelNo.trim()) newErrors.panelNo = 'Solar Panel Serial No. is required.';
    if (!form.batteryNo.trim()) newErrors.batteryNo = 'Battery Serial No. is required.';

    if (!form.latitude.trim()) newErrors.latitude = 'Latitude is required.';
    if (!form.longitude.trim()) newErrors.longitude = 'Longitude is required.';

    if (!isEditMode) {
      if (!lightFile) newErrors.light_file = 'Light Photo 1 is required.';
      if (!lightFile2) newErrors.light_file2 = 'Light Photo 2 is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Please complete all required fields highlighted in red.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ssl_id', String(sslNumericId || selectedLightId));
      formData.append('uuid_no', form.uuidNo.trim());
      formData.append('pole_no', form.poleNo.trim());
      formData.append('light_no', form.lightNo.trim());
      formData.append('panel_no', form.panelNo.trim());
      formData.append('battery_serial_no', form.batteryNo.trim());
      formData.append('beneficiary_name', form.beneficiaryName.trim());
      formData.append('ward_no', form.wardNo.trim());
      formData.append('contact_no', cleanContact);
      formData.append('latitude', form.latitude.trim());
      formData.append('longitude', form.longitude.trim());

      if (form.remarks.trim()) {
        formData.append('remark', form.remarks.trim());
      }
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

      const fd = new FormData();
      fd.append('ssl_id', String(sslNumericId));
      fd.append('id', String(sslNumericId));
      fd.append('light_id', String(sslNumericId));
      if (isEditMode) {
        fd.append('update_id', String(sslNumericId));
      }

      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('contact_no', cleanPhone);
      fd.append('ward_no', wardNo.trim());
      fd.append('pole_no', poleNo.trim());
      fd.append('uuid_no', uuidNo.trim());
      fd.append('light_no', lightNo.trim());
      fd.append('panel_no', panelNo.trim());
      fd.append('battery_no', batteryNo.trim());
      fd.append('battery_serial_no', batteryNo.trim());

      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      if (remarks.trim()) {
        fd.append('remark', remarks.trim());
        fd.append('remarks', remarks.trim());
      }

      // Attach logged in vendor name if available
      const vendorToSubmit = loginVendorName || siteDetail?.vendor || siteDetail?.vendor_name || '';
      if (vendorToSubmit) {
        fd.append('vendor', vendorToSubmit);
        fd.append('vendor_name', vendorToSubmit);
      }

      if (files.light_file) {
        fd.append('light_file', files.light_file);
      }
      if (files.light_file2) {
        fd.append('light_file2', files.light_file2);
      }

      if (isEditMode) {
        const res = await punjabSslInstallationService.updateInstallLightStore(fd);
        setFeedback({ type: 'success', text: res.message || 'Light Installation Details Updated Successfully!' });
      } else {
        const res = await punjabSslInstallationService.storeLightDetails(fd);
        setFeedback({ type: 'success', text: res.message || 'Light Installed Successfully!' });
      }

      setTimeout(() => {
        navigate('/v/punjab/ssl/installation/complete-light#Completed');
      }, 1400);
    } catch (err: any) {
      console.error('[Punjab SSL Installation] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit Punjab SSL installation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isEditMode ? 'Edit Installation Details' : 'Punjab SSL-Installation Details'}
        subtitle={
          isEditMode
            ? 'Update solar street light equipment numbers, GPS coordinates, and verification photos.'
            : 'Capture Solar Street Light installation execution data, serial numbers, geocoordinates, and verification photos.'
        }
=======
    <div className="solar-erp-page punjab-ssl-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Header (matching Assam SWP pattern) */}
      <PageHead
        title={isEditMode ? 'Update Installed Light' : 'SSL Light Installation'}
        subtitle="Record physical site parameters, hardware serials, and geo-tagged verification photos in Punjab"
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: isEditMode ? 'Edit Details' : 'Installation Details' },
        ]}
        actions={
          <Link to="/v/punjab/ssl/installation/complete-light" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Lights
          </Link>
        }
      />

<<<<<<< HEAD
      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isEditMode ? 'Edit Installation Details' : 'Solar Street Light Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar street light equipment numbers, GPS coordinates, and verification photos.'
                  : 'Fill out installation details and upload site completion evidence for department verification.'}
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.beneficiary_name ? `${siteDetail.beneficiary_name} (${siteDetail.district || ''})` : `Light #${siteDetail.unique_id || siteDetail.id}`}
=======
      {/* Notifications */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }} role="alert">
          <div className="ax-alert__title">Installation Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Navigation Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  {isEditMode ? 'Edit Light Installation Record' : 'Punjab SSL Installation Execution'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  State: <b>Punjab</b> · All fields marked with * are mandatory
                </p>
              </div>

              {/* Light Picker Dropdown */}
              <div style={{ minWidth: 280, maxWidth: '100%' }}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: '100%', fontWeight: 600, height: 38 }}
                  value={selectedLightId}
                  disabled={dropdownLoading || isEditMode}
                  onChange={(e) => handleSelectLight(e.target.value)}
                >
                  <option value="">-- Select Allocated Light --</option>
                  {lightOptions.map((opt) => (
                    <option key={opt.id || opt.unique_id} value={opt.id || opt.unique_id}>
                      {opt.unique_id} {opt.panchayat ? `(${opt.panchayat})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Section Nav Pills (matching Assam SWP) */}
            <div className="ssl-section-pills">
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec1Ref)}>
                <span className="pill-num">1</span> Light Selection
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec2Ref)}>
                <span className="pill-num">2</span> Beneficiary & Ward
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec3Ref)}>
                <span className="pill-num">3</span> Equipment Serials
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec4Ref)}>
                <span className="pill-num">4</span> GPS & Photos
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec5Ref)}>
                <span className="pill-num">5</span> Remarks
              </button>
            </div>
          </div>

          <div className="ax-card__body">
            {detailLoading && (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading light installation details…
              </div>
            )}

            {/* ── Section 1: Pre-Allocated Light Details ── */}
            <div ref={sec1Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    1. Site & Administrative Details
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    System allocated jurisdiction & sarpanch contact
                  </span>
                </div>
              </div>

              {siteDetail ? (
                <div className="ssl-site-info-grid">
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Light Unique ID</span>
                    <span className="ssl-site-info-card__value" style={{ color: '#2563eb' }}>
                      {siteDetail.unique_id || `#${siteDetail.id}`}
                    </span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">District</span>
                    <span className="ssl-site-info-card__value">{siteDetail.district || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Block</span>
                    <span className="ssl-site-info-card__value">{siteDetail.block || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Panchayat</span>
                    <span className="ssl-site-info-card__value">{siteDetail.panchayat || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Sarpanch Name</span>
                    <span className="ssl-site-info-card__value">{siteDetail.sarpanch_name || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Sarpanch Contact</span>
                    <span className="ssl-site-info-card__value">{siteDetail.sarpanch_contact || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Phase</span>
                    <span className="ssl-site-info-card__value">{siteDetail.phase || '1'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Work Order No.</span>
                    <span className="ssl-site-info-card__value">{siteDetail.wo_no || '—'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 18, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 10, border: '1px dashed var(--ax-border, #cbd5e1)', textAlign: 'center', color: 'var(--ax-text-muted, #64748b)', fontSize: 13 }}>
                  Please select an allocated light from the top dropdown to load site details.
                </div>
              )}

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 2: Beneficiary Details ── */}
            <div ref={sec2Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    2. Beneficiary & Location Details
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Beneficiary identification and ward number
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--3col">
                <FloatingInput
                  label="Beneficiary Name"
                  name="beneficiaryName"
                  value={form.beneficiaryName}
                  onChange={handleInputChange('beneficiaryName')}
                  required
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  label="Beneficiary Contact No. (10 digits)"
                  name="contactNo"
                  type="tel"
                  maxLength={10}
                  value={form.contactNo}
                  onChange={handleInputChange('contactNo')}
                  required
                  error={errors.contactNo}
                />
                <FloatingInput
                  label="Ward Number"
                  name="wardNo"
                  value={form.wardNo}
                  onChange={handleInputChange('wardNo')}
                  required
                  error={errors.wardNo}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 3: Hardware Serials ── */}
            <div ref={sec3Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    3. Installed Hardware Identifiers
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Unique equipment and serial numbers installed on pole
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--3col">
                <FloatingInput
                  label="UUID Number"
                  name="uuidNo"
                  value={form.uuidNo}
                  onChange={handleInputChange('uuidNo')}
                  required
                  error={errors.uuidNo}
                />
                <FloatingInput
                  label="Pole Number"
                  name="poleNo"
                  value={form.poleNo}
                  onChange={handleInputChange('poleNo')}
                  required
                  error={errors.poleNo}
                />
                <FloatingInput
                  label="Light Luminary Number"
                  name="lightNo"
                  value={form.lightNo}
                  onChange={handleInputChange('lightNo')}
                  required
                  error={errors.lightNo}
                />
                <FloatingInput
                  label="Solar Panel Serial No."
                  name="panelNo"
                  value={form.panelNo}
                  onChange={handleInputChange('panelNo')}
                  required
                  error={errors.panelNo}
                />
                <FloatingInput
                  label="Battery Serial No."
                  name="batteryNo"
                  value={form.batteryNo}
                  onChange={handleInputChange('batteryNo')}
                  required
                  error={errors.batteryNo}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 4: Geolocation & Verification Photos ── */}
            <div ref={sec4Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    4. Geo Location & Verification Photographs
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Physical installation coordinates and photo evidence (Max 5MB each)
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                  </svg>
                  <span>{gpsDetecting ? 'Acquiring GPS…' : 'Capture Current GPS'}</span>
                </button>
              </div>

              {gpsStatusMsg && (
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginBottom: 14 }}>
                  {gpsStatusMsg}
                </div>
              )}

              {/* Coordinates Grid */}
              <div className="ssl-form-grid" style={{ marginBottom: 20 }}>
                <FloatingInput
                  label="Latitude (e.g. 30.9010)"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleInputChange('latitude')}
                  required
                  error={errors.latitude}
                />
                <FloatingInput
                  label="Longitude (e.g. 75.8573)"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleInputChange('longitude')}
                  required
                  error={errors.longitude}
                />
              </div>

              {/* Photo Upload Dropzones (matching Assam SWP UploadDropzone) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <UploadDropzone
                  id="light_file"
                  label="Light Installation Photo 1"
                  helperText="Full view showing installed pole, luminary, and solar panel"
                  required={!isEditMode}
                  file={lightFile}
                  preview={filePreview || undefined}
                  existingUrl={existingImageUrl}
                  onSelect={handlePhotoSelect(false)}
                  onRemove={handlePhotoRemove(false)}
                  error={errors.light_file}
                />
                <UploadDropzone
                  id="light_file2"
                  label="Light Installation Photo 2"
                  helperText="Close-up view of battery enclosure and hardware barcode label"
                  required={!isEditMode}
                  file={lightFile2}
                  preview={filePreview2 || undefined}
                  existingUrl={existingImageUrl2}
                  onSelect={handlePhotoSelect(true)}
                  onRemove={handlePhotoRemove(true)}
                  error={errors.light_file2}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 5: Remarks ── */}
            <div ref={sec5Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    5. Inspection & Remarks
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Additional site observations or installation remarks
                  </span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea
                  id="remarks"
                  name="remarks"
                  className="ax-input"
                  style={{ width: '100%', minHeight: 90, padding: '12px 14px', fontSize: 13 }}
                  placeholder="Enter any additional installation or site notes (optional)..."
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="ssl-form-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isEditMode ? 'Edit Mode:' : 'Installation Mode:'}
            </span>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 700 }}>
                {siteDetail.unique_id || `#${siteDetail.id}`}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Beneficiary & Location Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Fill this Form
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  {isEditMode
                    ? 'Editing existing installation record'
                    : 'Choose from accepted lights ready for installation in Punjab'}
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                {isEditMode ? (
                  <>
                    <input
                      id="site_id_select"
                      type="text"
                      className="ax-float__input"
                      value={`Light #${selectedLightId} - ${siteDetail?.unique_id || ''} (${siteDetail?.district || ''})`}
                      disabled
                    />
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Installation Light
                    </label>
                  </>
                ) : (
                  <>
                    <select
                      id="site_id_select"
                      className="ax-float__input"
                      value={selectedLightId}
                      onChange={(e) => handleLightSelect(e.target.value)}
                      disabled={loadingLights || submitting}
                      required
                    >
                      <option value="">-- Choose Assigned Punjab SSL Light --</option>
                      {lightsList.map((item) => {
                        const optVal = String(item.id || item.unique_id);
                        return (
                          <option key={optVal} value={optVal}>
                            #{item.unique_id} {item.panchayat ? `· ${item.panchayat}` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Assigned Light <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching light specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Beneficiary & Location Information (Read-only fetched data) ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Auto-populated official beneficiary and site record (Read-only fetched details)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Vendor Name"
                name="vendor_display"
                value={loginVendorName || siteDetail?.vendor || siteDetail?.vendor_name || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Unique ID"
                name="unique_id_display"
                value={siteDetail?.unique_id != null ? String(siteDetail.unique_id) : (selectedLightId ? String(selectedLightId) : '')}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Beneficiary Name"
                name="beneficiary_name_display"
                value={siteDetail?.beneficiary_name || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Contact Number"
                name="contact_no_display"
                value={siteDetail?.contact_no != null ? String(siteDetail.contact_no) : ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="State"
                name="state_display"
                value={siteDetail?.state || (selectedLightId ? 'Punjab' : '')}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="District"
                name="district_display"
                value={siteDetail?.district || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Block"
                name="block_display"
                value={siteDetail?.block || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Panchayat"
                name="panchayat_display"
                value={siteDetail?.panchayat || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Sarpanch Name"
                name="sarpanch_name_display"
                value={siteDetail?.sarpanch_name || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Sarpanch Contact"
                name="sarpanch_contact_display"
                value={siteDetail?.sarpanch_contact || ''}
                onChange={() => {}}
                disabled
              />
              {siteDetail?.address && (
                <FloatingInput
                  label="Address"
                  name="address_display"
                  value={siteDetail?.address || ''}
                  onChange={() => {}}
                  disabled
                />
              )}
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Fill this Form (Technician manual entry) ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Fill this Form</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  The field labels marked with <span style={{ color: 'var(--ax-danger, #ef4444)', fontWeight: 600 }}>*</span> are required fields.
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={detectLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? 'Detecting GPS...' : '📍 Auto-detect GPS'}
              </button>
            </div>

            {/* Grid 1: Beneficiary, Ward, Pole */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FloatingInput
                label="Beneficiary Name"
                name="beneficiary_name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Enter Beneficiary Name"
                required
              />

              <FloatingInput
                label="Contact Number"
                name="contact_no"
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter Contact Number"
                required
              />

              <FloatingInput
                label="Ward Number"
                name="ward_no"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                placeholder="Enter Ward Number"
                required
              />

              <FloatingInput
                label="Pole Number"
                name="pole_no"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                placeholder="Enter Pole Number"
                required
              />
            </div>

            {/* Grid 2: Equipment Serial Numbers with Barcode Scanner Buttons */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FloatingInput
                label="UUID Number"
                name="uuid_no"
                value={uuidNo}
                onChange={(e) => setUuidNo(e.target.value)}
                placeholder="Enter UUID Number"
                required
                onCameraClick={() => setScannerTarget('uuid')}
              />

              <FloatingInput
                label="Solar Panel Number"
                name="panel_no"
                value={panelNo}
                onChange={(e) => setPanelNo(e.target.value)}
                placeholder="Enter Solar Panel Number"
                required
                onCameraClick={() => setScannerTarget('panel')}
              />

              <FloatingInput
                label="Battery Serial Number"
                name="battery_no"
                value={batteryNo}
                onChange={(e) => setBatteryNo(e.target.value)}
                placeholder="Enter Battery Serial Number"
                required
                onCameraClick={() => setScannerTarget('battery')}
              />

              <FloatingInput
                label="Light Luminary Number"
                name="light_no"
                value={lightNo}
                onChange={(e) => setLightNo(e.target.value)}
                placeholder="Enter Light Luminary Number"
                required
                onCameraClick={() => setScannerTarget('light')}
              />
            </div>

            {/* Grid 3: GPS Coordinates & Remarks */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FloatingInput
                label="Installation Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 30.9010"
                required
              />

              <FloatingInput
                label="Installation Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 75.8573"
                required
              />

              <FloatingInput
                label="Installation Remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter Remarks"
              />
            </div>

            {/* Grid 4: Light Installation Photos (2 photos for Punjab SSL) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <UploadDropzone
                id="light_file"
                label="Light Installation Photo 1"
                required={!isEditMode}
                file={files.light_file}
                preview={previews.light_file}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, light_file: f }));
                  setPreviews((prev) => ({ ...prev, light_file: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('light_file')}
              />

              <UploadDropzone
                id="light_file2"
                label="Light Installation Photo 2"
                required={!isEditMode}
                file={files.light_file2}
                preview={previews.light_file2}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, light_file2: f }));
                  setPreviews((prev) => ({ ...prev, light_file2: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('light_file2')}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/punjab/ssl/installation/complete-light" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
<<<<<<< HEAD
              disabled={submitting || !selectedLightId}
              style={{ minWidth: 160 }}
            >
              {submitting
                ? isEditMode
                  ? 'Updating Installation...'
                  : 'Submitting Installation...'
                : isEditMode
                ? 'Update Installation Details'
                : 'Submit Installation Report'}
=======
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting ? (
                <><span className="ax-spinner" style={{ marginRight: 6 }} /> Submitting…</>
              ) : isEditMode ? (
                'Update Installation'
              ) : (
                'Submit Light Installation'
              )}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
            </button>
          </div>
        </div>
      </form>

      {/* ── Camera Barcode Scanner Modal ── */}
      {scannerTarget && (
        <CameraBarcodeScannerModal
          open={Boolean(scannerTarget)}
          fieldName={scannerTarget}
          fieldLabel={
            scannerTarget === 'uuid'
              ? 'UUID Number'
              : scannerTarget === 'panel'
              ? 'Solar Panel Number'
              : scannerTarget === 'battery'
              ? 'Battery Serial Number'
              : 'Light Luminary Number'
          }
          onScan={(val) => {
            if (scannerTarget === 'uuid') setUuidNo(val);
            else if (scannerTarget === 'panel') setPanelNo(val);
            else if (scannerTarget === 'battery') setBatteryNo(val);
            else if (scannerTarget === 'light') setLightNo(val);
          }}
          onClose={() => setScannerTarget(null)}
        />
      )}
    </div>
  );
}

export default Punjab_Installation_SSL_InstallLight;
