import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getMediaUrl, getUpMediaCandidates } from '../../up-services';

export const UP_MODAL_CSS = `
  /* ── Pure White Professional Modal (Matching Vendor Close Complaints Design) ── */
  .up-modal.ax-modal {
    position: fixed !important;
    inset: 0 !important;
    z-index: 10000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px 16px !important;
    overflow: hidden !important;
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(4px) !important;
  }
  .up-modal .ax-modal__backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: transparent !important;
  }
  .up-modal .ax-modal__dialog {
    position: relative !important;
    z-index: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    max-width: 840px !important;
    height: min(88vh, 840px) !important;
    max-height: calc(100vh - 48px) !important;
    background: #ffffff !important;
    color: #0f172a !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05) !important;
    overflow: hidden !important;
    margin: 0 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .up-modal .ax-modal__dialog.up-modal__dialog--compact {
    max-width: 520px !important;
    height: auto !important;
    max-height: calc(100vh - 48px) !important;
  }
  .up-modal .ax-modal__dialog.up-modal__dialog--preview {
    max-width: 900px !important;
    height: auto !important;
    max-height: calc(100vh - 48px) !important;
  }
  .up-modal .ax-modal__dialog > form {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    background: #ffffff !important;
    margin: 0 !important;
  }
  .up-modal .ax-modal__header {
    flex: 0 0 auto !important;
    background: #ffffff !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 18px 24px !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 12px !important;
    z-index: 5 !important;
  }
  .up-modal .ax-modal__title {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
  }
  .up-modal .up-modal__eyebrow {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ax-viz-emerald, #103ab9);
    margin-bottom: 2px;
  }
  .up-modal .up-modal__sub {
    margin: 2px 0 0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }
  .up-modal .ax-modal__close {
    width: 32px !important;
    height: 32px !important;
    flex-shrink: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    color: #64748b !important;
    background: #f1f5f9 !important;
    border: none !important;
    cursor: pointer !important;
    padding: 0 !important;
    transition: all 0.15s ease !important;
  }
  .up-modal .ax-modal__close svg {
    width: 16px;
    height: 16px;
  }
  .up-modal .ax-modal__close:hover {
    color: #0f172a !important;
    background: #e2e8f0 !important;
  }
  .up-modal .ax-modal__body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    background: #ffffff !important;
    padding: 24px !important;
  }
  .up-modal .ax-modal__body::-webkit-scrollbar { width: 6px; }
  .up-modal .ax-modal__body::-webkit-scrollbar-track { background: #ffffff; }
  .up-modal .ax-modal__body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
  .up-modal .ax-modal__body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .up-modal .ax-modal__footer {
    flex: 0 0 auto !important;
    background: #ffffff !important;
    border-top: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 12px !important;
    z-index: 5 !important;
  }
  .up-modal .ax-modal__footer .ax-btn--ghost,
  .up-modal .ax-modal__footer .ax-btn--secondary {
    background: #f1f5f9 !important;
    color: #334155 !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    padding: 8px 18px !important;
    border-radius: 8px !important;
    transition: all 0.15s ease !important;
  }
  .up-modal .ax-modal__footer .ax-btn--ghost:hover,
  .up-modal .ax-modal__footer .ax-btn--secondary:hover {
    background: #e2e8f0 !important;
    color: #0f172a !important;
  }
  .up-modal .ax-modal__footer .ax-btn--primary {
    background: #2563eb !important;
    color: #ffffff !important;
    border: 1px solid #2563eb !important;
    font-weight: 600 !important;
    padding: 8px 24px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
    transition: all 0.15s ease !important;
  }
  .up-modal .ax-modal__footer .ax-btn--primary:hover:not(:disabled) {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
  .up-modal .ax-modal__footer .ax-btn--danger {
    background: #dc2626 !important;
    color: #ffffff !important;
    border: 1px solid #dc2626 !important;
    font-weight: 600 !important;
    padding: 8px 22px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.24) !important;
    transition: all 0.15s ease !important;
  }
  .up-modal .ax-modal__footer .ax-btn--danger:hover:not(:disabled) {
    background: #b91c1c !important;
    border-color: #b91c1c !important;
  }

  /* ── Floating Labels inside Modal ── */
  .up-modal .ax-float { position: relative; width: 100%; }
  .up-modal .ax-float__input {
    width: 100% !important;
    background: #ffffff !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 10px !important;
    height: 48px !important;
    color: #0f172a !important;
    font-size: 14px !important;
    padding: 0 14px !important;
    box-sizing: border-box !important;
    transition: all 0.15s ease !important;
  }
  .up-modal .ax-float__input::placeholder { color: transparent !important; }
  .up-modal .ax-float__input:hover { border-color: #94a3b8 !important; }
  .up-modal .ax-float__input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
    outline: none !important;
  }
  .up-modal .ax-float__input.is-invalid {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
  }
  .up-modal .ax-float__input.is-valid {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
  }
  .up-modal .ax-float__label {
    position: absolute;
    inset-inline-start: 12px;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
    padding: 0 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    background: #ffffff !important;
    border-radius: 4px;
    pointer-events: none;
    z-index: 3;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .up-modal .ax-float__input:focus + .ax-float__label,
  .up-modal .ax-float__input:not(:placeholder-shown) + .ax-float__label,
  .up-modal .ax-float--date .ax-float__label,
  .up-modal .ax-float--locked .ax-float__label,
  .up-modal .ax-float--area .ax-float__input:focus + .ax-float__label,
  .up-modal .ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
    top: 0;
    transform: translateY(-50%);
    font-size: 11px;
    font-weight: 600;
    color: #475569;
  }
  .up-modal .ax-float__input:focus + .ax-float__label { color: #2563eb !important; }
  .up-modal .ax-float__input.is-invalid + .ax-float__label { color: #ef4444 !important; }
  .up-modal .ax-float--area .ax-float__label { top: 14px; transform: none; }
  .up-modal .ax-float--area .ax-float__input:focus + .ax-float__label,
  .up-modal .ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
    top: -8px;
    transform: none;
  }
  .up-modal .ax-textarea.ax-float__input {
    height: auto !important;
    min-height: 96px !important;
    padding: 14px !important;
    line-height: 1.5 !important;
    resize: vertical !important;
  }
  .up-modal .ax-float--locked .ax-float__input {
    background: #f8fafc !important;
    color: #475569 !important;
    cursor: not-allowed !important;
  }
  .up-modal .ax-field__message--error {
    display: block;
    margin-top: 5px;
    font-size: 11.5px;
    font-weight: 500;
    color: #ef4444;
  }

  /* ── Overview Card & SMS Row ── */
  .up-modal .assigned-overview-card {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 16px 20px !important;
  }
  .up-modal .up-sms-bar {
    grid-column: 1 / -1;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  /* ── Professional View Modal Cards ── */
  .up-modal .view-modal-wrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 4px;
  }
  .up-modal .view-summary-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 18px;
  }
  .up-modal .view-summary-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .up-modal .view-summary-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .up-modal .view-summary-value {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
  }
  .up-modal .view-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.15s ease;
  }
  .up-modal .view-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }
  .up-modal .view-card__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .up-modal .view-card__icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .up-modal .view-card__title {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin: 0;
  }
  .up-modal .view-card__body {
    padding: 16px;
  }
  .up-modal .view-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px 16px;
  }
  .up-modal .view-data-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .up-modal .view-data-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .up-modal .view-data-value {
    font-size: 13.5px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
    word-break: break-word;
  }
  .up-modal .view-desc-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #7c3aed;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13.5px;
    color: #1e293b;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media (max-width: 768px) {
    .up-modal.ax-modal { padding: 12px !important; }
    .up-modal .ax-modal__dialog:not(.up-modal__dialog--compact) {
      max-width: 100% !important;
      height: calc(100vh - 24px) !important;
      max-height: calc(100vh - 24px) !important;
      border-radius: 12px !important;
    }
    .up-modal .ax-modal__body { padding: 16px !important; }
    .up-modal .ax-modal__header,
    .up-modal .ax-modal__footer { padding: 14px 16px !important; }
    .up-modal .view-grid-3 { grid-template-columns: 1fr; gap: 12px; }
  }
`;

/* ───────── Dashed Image / Document Upload Dropzone ───────── */
export function UploadDrop({
  id,
  label,
  required = false,
  file,
  onPick,
  onClear,
  accept = 'image/*,.pdf',
  hint = 'PDF, JPG or PNG — single file',
  invalid = false,
  errorText,
  disabled = false,
}: {
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  onPick: (f: File | null) => void;
  onClear: () => void;
  accept?: string;
  hint?: string;
  invalid?: boolean;
  errorText?: string;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const borderColor = invalid
    ? '#ef4444'
    : drag
    ? '#2563eb'
    : file
    ? '#10b981'
    : '#cbd5e1';

  const bgColor = invalid
    ? '#fef2f2'
    : drag
    ? '#eff6ff'
    : file
    ? '#f0fdf4'
    : '#ffffff';

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled) onPick(e.dataTransfer.files?.[0] || null);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          padding: '20px 16px',
          minHeight: 140,
          border: `1.5px dashed ${borderColor}`,
          borderRadius: 12,
          background: bgColor,
          transition: 'all .15s ease',
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          style={{ display: 'none' }}
          onChange={(e) => {
            onPick(e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={file?.name || 'Preview'}
            className="up-drop-preview"
            style={{
              width: 64,
              height: 64,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
            }}
          />
        ) : (
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: file ? '#dcfce7' : '#eff6ff',
              color: file ? '#16a34a' : '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
              <path d="M9 15l3 -3l3 3" />
              <path d="M12 12v9" />
            </svg>
          </span>
        )}

        {file ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', wordBreak: 'break-all' }}>
              ✓ {file.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {(file.size / 1024).toFixed(1)} KB ·{' '}
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                disabled={disabled}
                style={{ padding: '0 6px', height: 'auto', color: '#ef4444', background: 'transparent', border: 0 }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{hint}</div>
          </>
        )}
      </div>

      {invalid && errorText && (
        <span className="ax-field__message ax-field__message--error" role="alert">
          {errorText}
        </span>
      )}
    </div>
  );
}

/* ───────── Detail Modal Section Card ───────── */
export function DetailSectionCard({
  title,
  icon,
  tone = 'blue',
  children,
}: {
  title: string;
  icon: ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  children: ReactNode;
}) {
  const toneMap = {
    blue: { bg: '#eff6ff', fg: '#2563eb' },
    emerald: { bg: '#ecfdf5', fg: '#059669' },
    amber: { bg: '#fffbeb', fg: '#d97706' },
    purple: { bg: '#f5f3ff', fg: '#7c3aed' },
    rose: { bg: '#fff1f2', fg: '#e11d48' },
  };
  const t = toneMap[tone] || toneMap.blue;
  return (
    <div className="view-card">
      <div className="view-card__header">
        <span className="view-card__icon" style={{ background: t.bg, color: t.fg }}>
          {icon}
        </span>
        <h4 className="view-card__title">{title}</h4>
      </div>
      <div className="view-card__body">{children}</div>
    </div>
  );
}

/* ───────── Attachment Card Grid (for Details Modals) ───────── */
function AttachmentCard({
  label,
  url,
  candidates,
  onPreview,
}: {
  label: string;
  url: string;
  candidates?: string[];
  onPreview?: (url: string, title: string, candidates?: string[]) => void;
}) {
  const list = useMemo(() => {
    const cands = candidates && candidates.length > 0 ? candidates : getUpMediaCandidates(url);
    return cands.length > 0 ? cands : [getMediaUrl(url) || url];
  }, [url, candidates]);
  const [idx, setIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setImgFailed(false);
  }, [url, candidates]);

  const currentUrl = list[idx] || url;
  const isImg = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(currentUrl);

  const handleError = () => {
    if (idx + 1 < list.length) {
      setIdx((i) => i + 1);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (onPreview && isImg && !imgFailed) {
          onPreview(currentUrl, label, list);
        } else {
          window.open(currentUrl, '_blank', 'noopener,noreferrer');
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onPreview && isImg && !imgFailed) {
            onPreview(currentUrl, label, list);
          } else {
            window.open(currentUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {isImg && !imgFailed ? (
        <div
          style={{
            width: '100%',
            height: 76,
            borderRadius: 6,
            overflow: 'hidden',
            background: '#e2e8f0',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={currentUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
            onError={handleError}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: 76,
            borderRadius: 6,
            background: '#f1f5f9',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
        {isImg && !imgFailed ? 'Preview Image ↗' : 'View File ↗'}
      </span>
    </div>
  );
}

export function AttachmentCardGrid({
  docs,
  onPreview,
}: {
  docs: { label: string; url: string; candidates?: string[] }[];
  onPreview?: (url: string, title: string, candidates?: string[]) => void;
}) {
  if (!docs || docs.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          marginBottom: 8,
          letterSpacing: '0.04em',
        }}
      >
        Attached Files &amp; Documents ({docs.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
        {docs.map((doc, idx) => (
          <AttachmentCard
            key={`${doc.label}-${idx}`}
            label={doc.label}
            url={doc.url}
            candidates={doc.candidates}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}
