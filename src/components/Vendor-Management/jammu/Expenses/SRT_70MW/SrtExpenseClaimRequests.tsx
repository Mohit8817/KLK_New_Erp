import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSrtExpenseService,
  resolveJammuMediaUrl,
  type JammuSrtExpenseClaimItem,
  type JammuSrtExpensePaymentItem,
  type ExpensePaymentStats,
} from './jammuSrtExpenseService';
import {
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

/* ───────── Responsive page CSS matching Solar ERP standard ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
    --ax-primary: #2559bf;
    --ax-primary-hover: #1e4699;
    --ax-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary,
  .solar-erp-page .ax-button--primary {
    background: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover,
  .solar-erp-page .ax-button--primary:hover {
    background: #1e4699 !important;
    border-color: #1e4699 !important;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Compact table action buttons */
  .solar-erp-page .ax-table .ax-btn--sm,
  .solar-erp-page .ax-table .ax-btn--xs,
  .solar-erp-page .ax-table button.ax-btn,
  .solar-erp-page .ax-table a.ax-btn {
    min-height: unset !important;
    height: auto !important;
    padding: 4px 10px !important;
    font-size: 11px !important;
    line-height: 1.2 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
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
    min-width: 200px;
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

  /* All table columns fully scrollable horizontally */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
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
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }

  /* ── Action Dropdown Button & Menu ── */
  .ula-action-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer;
    background: #ffffff; border: 1px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text-strong, #0f172a);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: all 0.15s ease;
  }
  .ula-action-btn:hover {
    background: var(--ax-surface-subtle, #f8fafc);
    border-color: #94a3b8;
  }
  .ula-action-btn[aria-expanded="true"] {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 6px; text-align: left;
    background: #ffffff; border: 1px solid var(--ax-border, #e2e8f0); border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: flex; align-items: center; gap: 10px; width: 100%; box-sizing: border-box;
    margin: 0; padding: 8px 12px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 6px; cursor: pointer;
    transition: all 0.12s ease;
  }
  .ula-menu__item:hover:not(:disabled), .ula-menu__item:focus-visible:not(:disabled) {
    background: var(--ax-surface-subtle, #f1f5f9);
    outline: none;
  }
  .ula-menu__item:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ── Row Action Dropdown Component ── */
const ACTION_MENU_W = 180;
const ACTION_MENU_H = 130;

function RowActionDropdown({
  row,
  onVerify,
  onDownload,
  onPaymentDetails,
}: {
  row: JammuSrtExpenseClaimItem;
  onVerify: () => void;
  onDownload: () => void;
  onPaymentDetails: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < ACTION_MENU_H + 10 && r.top > ACTION_MENU_H + 10 ? r.top - ACTION_MENU_H - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - ACTION_MENU_W, window.innerWidth - ACTION_MENU_W - 8));
    setPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
      >
        <span>Action</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 12,
            height: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={menuRef}
            className="ula-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left, width: ACTION_MENU_W }}
          >
            {/* 1. Verify Claim Button */}
            {row.claim_status === 1 ? (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onVerify();
                }}
                style={{
                  color: '#16a34a',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: 'rgba(22, 163, 74, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Verify Claim</span>
              </button>
            ) : (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                disabled
                title={row.claim_status === 2 ? 'Claim Approved' : 'Claim Closed'}
                style={{
                  color: '#94a3b8',
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: '#f1f5f9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <span>{row.claim_status === 2 ? 'Verified' : 'Closed'}</span>
              </button>
            )}

            {/* 2. Download Button */}
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDownload();
              }}
              style={{
                color: '#2563eb',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              <span>Download</span>
            </button>

            {/* 3. Payment Details Button */}
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPaymentDetails();
              }}
              style={{
                color: '#0f172a',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: '#f1f5f9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#475569"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span>Payment Details</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

/* ── Modal Component ── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 540,
}: {
  open: boolean;
  onClose: () => void;
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            {typeof title === 'string' ? (
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              typeof subtitle === 'string' ? (
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>
              ) : (
                subtitle
              )
            )}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted, #94a3b8)', fontSize: 12 }}>—</span>;
  }

  const url = resolveJammuMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 6,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        margin: '0 auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.borderColor = '#2559bf';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt="Invoice"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '9px';
              span.style.fontWeight = '700';
              span.style.color = '#2559bf';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2559bf" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#2559bf', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export function SrtExpenseClaimRequests() {
  const [claimsList, setClaimsList] = useState<JammuSrtExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Verify Claim Modal state (for pending claims)
  const [selectedClaimForVerify, setSelectedClaimForVerify] = useState<JammuSrtExpenseClaimItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string>('');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Payment Details Popup state
  const [selectedClaimForPaymentDetails, setSelectedClaimForPaymentDetails] = useState<JammuSrtExpenseClaimItem | null>(null);
  const [paymentDetailsData, setPaymentDetailsData] = useState<{
    payments: JammuSrtExpensePaymentItem[];
    stats: ExpensePaymentStats;
  } | null>(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState<boolean>(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);
  const [popupSearch, setPopupSearch] = useState<string>('');

  // Lightbox preview state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Toast notification
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSrtExpenseService.getExpenseClaims();
      setClaimsList(data.list);
    } catch (e: any) {
      console.error('Failed to load SRT expense claims:', e);
      showToast(e?.message || 'Failed to fetch expense claims', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Verify Claim Submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForVerify) return;

    if (!verifyStatus) {
      setVerifyError('Status field is required. Please select a status.');
      return;
    }

    const numStatus = Number(verifyStatus) as 2 | 3;
    if (numStatus !== 2 && numStatus !== 3) {
      setVerifyError('Status must be Approved (2) or Rejected (3).');
      return;
    }

    setSubmittingVerify(true);
    setVerifyError(null);
    try {
      const res = await jammuSrtExpenseService.verifyExpenseClaim(
        selectedClaimForVerify.id,
        numStatus,
        verifyRemarks
      );
      const updatedRemarks = verifyRemarks.trim();
      setClaimsList((prev) =>
        prev.map((c) =>
          c.id === selectedClaimForVerify.id
            ? {
                ...c,
                claim_status: numStatus,
                approved_remarks: updatedRemarks,
                claim_verify_remarks: updatedRemarks,
              }
            : c
        )
      );
      showToast(res.message || 'Claim status updated successfully!', 'success');
      setSelectedClaimForVerify(null);
      await loadData();
    } catch (err: any) {
      console.error('Verify claim submit error:', err);
      setVerifyError(err?.message || 'Failed to verify claim. Only pending claims can be verified.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Open Payment Details Popup
  const handleOpenPaymentDetails = async (claim: JammuSrtExpenseClaimItem) => {
    setSelectedClaimForPaymentDetails(claim);
    setLoadingPaymentDetails(true);
    setPaymentDetailsError(null);
    setPaymentDetailsData(null);
    setPopupSearch('');

    try {
      const res = await jammuSrtExpenseService.getPaymentDetails(claim.id);
      const apiPayments = Array.isArray(res.payments) && res.payments.length > 0 ? res.payments : [];

      // If backend returned payments, use them; otherwise construct row from claim
      if (apiPayments.length > 0) {
        setPaymentDetailsData({
          payments: apiPayments,
          stats: res.stats || {
            total: apiPayments.length,
            complete: apiPayments.filter((p: any) => p.pay_status === 'Paid').length,
            partially: apiPayments.filter((p: any) => p.pay_status === 'Partially').length,
            pending: apiPayments.filter((p: any) => p.pay_status === 'Pending').length,
          },
        });
      } else {
        const isPaid = claim.pay_status === 1;
        const isPartial = claim.pay_status === 2;
        const fallbackPayment: JammuSrtExpensePaymentItem = {
          id: claim.id,
          vendor_id: claim.vendor_id,
          site_id: claim.site_id,
          date: claim.claim_date,
          vendor: claim.vendor,
          district: claim.district,
          site_name: claim.site_name,
          site_code: claim.site_code,
          purpose: claim.purpose,
          invoice: claim.claim_invoice,
          amount: claim.claim_amount,
          remarks: claim.approved_remarks || claim.claim_verify_remarks || '',
          pay_amount: isPaid ? claim.claim_amount : null,
          balance_amount: isPaid ? 0 : claim.claim_amount,
          pay_date: claim.claim_update_date || null,
          pay_remarks: claim.approved_remarks || claim.claim_verify_remarks || null,
          pay_status: isPaid ? 'Paid' : isPartial ? 'Partially' : 'Pending',
          pay_status_code: claim.pay_status,
          can_pay: !isPaid,
          allpayment: [],
        };

        setPaymentDetailsData({
          payments: [fallbackPayment],
          stats: {
            total: 1,
            complete: isPaid ? 1 : 0,
            partially: isPartial ? 1 : 0,
            pending: !isPaid && !isPartial ? 1 : 0,
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch payment details for claim:', err);
      // Fallback to displaying claim data directly
      const isPaid = claim.pay_status === 1;
      const isPartial = claim.pay_status === 2;
      const fallbackPayment: JammuSrtExpensePaymentItem = {
        id: claim.id,
        vendor_id: claim.vendor_id,
        site_id: claim.site_id,
        date: claim.claim_date,
        vendor: claim.vendor,
        district: claim.district,
        site_name: claim.site_name,
        site_code: claim.site_code,
        purpose: claim.purpose,
        invoice: claim.claim_invoice,
        amount: claim.claim_amount,
        remarks: claim.approved_remarks || claim.claim_verify_remarks || '',
        pay_amount: isPaid ? claim.claim_amount : null,
        balance_amount: isPaid ? 0 : claim.claim_amount,
        pay_date: claim.claim_update_date || null,
        pay_remarks: claim.approved_remarks || claim.claim_verify_remarks || null,
        pay_status: isPaid ? 'Paid' : isPartial ? 'Partially' : 'Pending',
        pay_status_code: claim.pay_status,
        can_pay: !isPaid,
        allpayment: [],
      };

      setPaymentDetailsData({
        payments: [fallbackPayment],
        stats: {
          total: 1,
          complete: isPaid ? 1 : 0,
          partially: isPartial ? 1 : 0,
          pending: !isPaid && !isPartial ? 1 : 0,
        },
      });
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  // Single unified table filtered list (NO tabs)
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return claimsList;
    return claimsList.filter(
      (c) =>
        c.vendor.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.site_name.toLowerCase().includes(q) ||
        (c.site_code && c.site_code.toLowerCase().includes(q)) ||
        c.purpose.toLowerCase().includes(q) ||
        (c.approved_remarks && c.approved_remarks.toLowerCase().includes(q)) ||
        (c.claim_verify_remarks && c.claim_verify_remarks.toLowerCase().includes(q)) ||
        (c.claim_status === 2 ? 'approved' : c.claim_status === 3 ? 'rejected' : 'pending').includes(q)
    );
  }, [claimsList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Filtered payments inside Popup
  const popupFilteredPayments = useMemo(() => {
    if (!paymentDetailsData) return [];
    const q = popupSearch.trim().toLowerCase();
    if (!q) return paymentDetailsData.payments;
    return paymentDetailsData.payments.filter(
      (p) =>
        p.vendor.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.site_name.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
        (p.remarks && p.remarks.toLowerCase().includes(q)) ||
        (p.pay_remarks && p.pay_remarks.toLowerCase().includes(q)) ||
        p.pay_status.toLowerCase().includes(q)
    );
  }, [paymentDetailsData, popupSearch]);

  // Export Columns matching exact fields
  const exportCols: ExportColumn<JammuSrtExpenseClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r) => r.state || 'JAMMU & KASHMIR' },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'Claim Date', accessor: (r) => r.claim_date },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Claim Count', accessor: (r) => r.claim_count },
      { header: 'Site Name', accessor: (r) => r.site_name },
      { header: 'Purpose', accessor: (r) => r.purpose },
      { header: 'Claim Invoice', accessor: (r) => r.claim_invoice || '—' },
      { header: 'Claim Amount', accessor: (r) => `₹${r.claim_amount.toLocaleString('en-IN')}` },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date },
      {
        header: 'Claim Status',
        accessor: (r) => (r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Pending'),
      },
      { header: 'Claim Verify Remarks', accessor: (r) => r.approved_remarks || '—' },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="View Expenses Claim Request"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'View Expenses Claim Request' },
          { label: 'View Expenses Claim Request' },
        ]}
      />

      {/* Main Single Table Card - NO TABS */}
      <section className="ax-card ax-col--12" style={{ marginTop: 8 }}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Expenses Claim Request</h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} expense claim submission records</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: '11px' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredList, exportCols, 'View_Expenses_Claim_Request')}
                onExportExcel={() => exportRowsExcel(filteredList, exportCols, 'View_Expenses_Claim_Request')}
                onExportPDF={() => exportRowsPDF(filteredList, exportCols, 'View Expenses Claim Request')}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Single Table matching exact user column structure */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1650 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Claim Date</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th ax-table__th--num">Claim Count</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Purpose</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Claim Invoice</th>
                <th className="ax-table__th ax-table__th--num">Claim Amount</th>
                <th className="ax-table__th">Claim Update Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Claim Status</th>
                <th className="ax-table__th">Claim Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading expense claims...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <TableEmptyState
                      title="No expense claims found"
                      description={searchQuery ? 'Adjust your search query' : 'No records found'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{row.state || 'JAMMU & KASHMIR'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{row.vendor}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.claim_date}</td>
                      <td className="ax-table__td">{row.district}</td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700 }}>{row.claim_count}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2559bf' }}>
                        {row.site_name}
                        {row.site_code && (
                          <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>({row.site_code})</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.purpose}
                      </td>

                      {/* Claim Invoice Thumbnail */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={row.claim_invoice} onClick={(url) => setLightboxUrl(url)} />
                      </td>

                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 800, color: '#16a34a' }}>
                        ₹{row.claim_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.claim_update_date}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.claim_status === 2 ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#16a34a',
                              background: 'rgba(22, 163, 74, 0.1)',
                              border: '1px solid rgba(22, 163, 74, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                            Approved
                          </span>
                        ) : row.claim_status === 3 ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#dc2626',
                              background: 'rgba(220, 38, 38, 0.1)',
                              border: '1px solid rgba(220, 38, 38, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                            Rejected
                          </span>
                        ) : (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#d97706',
                              background: 'rgba(217, 119, 6, 0.1)',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Claim Verify Remarks (Displaying approved_remarks) */}
                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 200, whiteSpace: 'normal' }}>
                        {row.approved_remarks || '—'}
                      </td>

                      {/* Action column with Action Button + Dropdown containing 3 options */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          row={row}
                          onVerify={() => {
                            setSelectedClaimForVerify(row);
                            setVerifyStatus('');
                            setVerifyRemarks('');
                            setVerifyError(null);
                          }}
                          onDownload={() => {
                            if (row.claim_invoice) {
                              window.open(resolveJammuMediaUrl(row.claim_invoice), '_blank', 'noopener,noreferrer');
                            } else {
                              setFeedbackToast({
                                type: 'info',
                                message: `Downloading claim invoice for #${row.id} (${row.site_name || 'N/A'})...`,
                              });
                              setTimeout(() => setFeedbackToast(null), 3000);
                            }
                          }}
                          onPaymentDetails={() => handleOpenPaymentDetails(row)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Feedback Toast Notification */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10000,
            background: feedbackToast.type === 'error' ? '#ef4444' : '#16a34a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{feedbackToast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* ── Verify Claim Status Popup Modal ── */}
      <Modal
        open={Boolean(selectedClaimForVerify)}
        onClose={() => {
          setSelectedClaimForVerify(null);
          setVerifyError(null);
        }}
        title="Verify Claim Status"
        maxWidth={460}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => {
                setSelectedClaimForVerify(null);
                setVerifyError(null);
              }}
              disabled={submittingVerify}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleVerifySubmit}
              disabled={submittingVerify}
            >
              {submittingVerify ? 'Saving...' : 'Submit'}
            </button>
          </>
        }
      >
        {selectedClaimForVerify && (
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {verifyError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ⚠️ {verifyError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={verifyStatus}
                onChange={(e) => setVerifyStatus(e.target.value)}
                className="ax-input"
                style={{ width: '100%', height: 38, padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="2">Approve</option>
                <option value="3">Reject</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Remark
              </label>
              <textarea
                rows={3}
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="Enter remarks..."
                className="ax-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ── Payment Details Popup Modal ── */}
      <Modal
        open={Boolean(selectedClaimForPaymentDetails)}
        onClose={() => {
          setSelectedClaimForPaymentDetails(null);
          setPaymentDetailsData(null);
          setPaymentDetailsError(null);
          setPopupSearch('');
        }}
        title={
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Welcome to,</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Jammu Installation Payment Details
            </div>
          </div>
        }
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 4 }}>
            <span>Home</span>
            <span>&gt;</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>View Payment Details</span>
          </div>
        }
        maxWidth={980}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={() => setSelectedClaimForPaymentDetails(null)}
          >
            Close
          </button>
        }
      >
        {selectedClaimForPaymentDetails && (
          <div>
            {paymentDetailsError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                ⚠️ {paymentDetailsError}
              </div>
            )}

            {/* 4 KPI Cards inside popup */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {/* Payment Request */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Payment Request
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2559bf', marginTop: 2 }}>
                  {paymentDetailsData?.stats.total ?? 0}
                </div>
              </div>

              {/* Payment Complete */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Payment Complete
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                  {paymentDetailsData?.stats.complete ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 1 }}>Complete</div>
              </div>

              {/* Payment Partially */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  Payment Partially
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                  {paymentDetailsData?.stats.partially ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#2563eb', marginTop: 1 }}>Partially</div>
              </div>

              {/* Payment Pending */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Payment Pending
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                  {paymentDetailsData?.stats.pending ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#d97706', marginTop: 1 }}>Pending</div>
              </div>
            </div>

            {/* Expenses Payment Details Section */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                  Expenses Payment Details
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Search:</span>
                  <input
                    type="text"
                    value={popupSearch}
                    onChange={(e) => setPopupSearch(e.target.value)}
                    placeholder="Search..."
                    className="ax-input"
                    style={{ height: 32, padding: '0 8px', fontSize: 12, width: 180, borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="ax-table-wrap" style={{ overflowX: 'auto', maxHeight: '42vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>S.No.</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Vendor</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>District</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Site Name</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Purpose</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>Invoice</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Remarks</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Pay Amount</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Balance Amount</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Pay Date</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Pay Remarks</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>Pay Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPaymentDetails ? (
                      <tr>
                        <td colSpan={14} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span className="ax-spinner" aria-hidden="true" />
                            <span>Loading payment details...</span>
                          </div>
                        </td>
                      </tr>
                    ) : popupFilteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={14} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                          No payment records found for this claim.
                        </td>
                      </tr>
                    ) : (
                      popupFilteredPayments.map((p, pIdx) => (
                        <tr key={p.id || pIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{pIdx + 1}</td>
                          <td style={{ padding: '8px 10px' }}>{p.date}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{p.vendor}</td>
                          <td style={{ padding: '8px 10px' }}>{p.district}</td>
                          <td style={{ padding: '8px 10px', color: '#2559bf', fontWeight: 600 }}>{p.site_name}</td>
                          <td style={{ padding: '8px 10px' }}>{p.purpose}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <MediaFileThumbnail file={p.invoice} onClick={(url) => setLightboxUrl(url)} />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.approved_remarks || p.remarks || '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                            {p.pay_amount != null ? `₹${p.pay_amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                            {p.balance_amount != null ? `₹${p.balance_amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '8px 10px' }}>{p.pay_date || '—'}</td>
                          <td style={{ padding: '8px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.pay_remarks || '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              className={`ax-badge ax-badge--soft ${
                                p.pay_status === 'Paid'
                                  ? 'ax-badge--success'
                                  : p.pay_status === 'Partially'
                                  ? 'ax-badge--info'
                                  : 'ax-badge--warning'
                              }`}
                              style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}
                            >
                              {p.pay_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Invoice Document Lightbox Preview ── */}
      <Modal open={Boolean(lightboxUrl)} onClose={() => setLightboxUrl(null)} title="Claim Invoice Document" maxWidth={750}>
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <div style={{ maxHeight: '72vh', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/\.pdf($|\?)/i.test(lightboxUrl) ? (
                <iframe src={lightboxUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} title="PDF Preview" />
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Invoice Document"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                />
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ textDecoration: 'none', padding: '6px 16px' }}
              >
                Open in New Tab ↗
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SrtExpenseClaimRequests;
