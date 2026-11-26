import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpKusumCClaimPaymentItem,
  type UpKusumCInstallPaymentBreakdown,
} from '../../up-services';

/* ───────── Responsive page CSS (Exact Assam SWP Claims & Payments pattern) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
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
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
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

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }

  /* Row action button + menu (Exact UP Resco Installation pattern) */
  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
    transition: background 0.15s ease;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible {
    background: var(--ax-surface-subtle, #f1f5f9) !important;
    outline: none;
  }
`;

/* ───────── Overlay CSS (modals & modern fields matching Assam SWP reference) ───────── */
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
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
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
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }

  /* ── Modern Form Controls ── */
  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
  .ax-modern-input-wrap {
    display: flex; align-items: center;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px; background: var(--ax-surface-solid, #ffffff);
    transition: all 0.2s ease; overflow: hidden;
  }
  .ax-modern-input-wrap:focus-within {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-addon {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 13px; height: 42px; background: var(--ax-surface-subtle, #f8fafc);
    border-right: 1.5px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text-muted, #64748b); font-size: 14px; font-weight: 700; user-select: none;
  }
  .ax-modern-input {
    width: 100%; height: 42px; padding: 0 14px;
    border: none; outline: none; font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a); background: transparent;
  }
  .ax-modern-input::placeholder { color: var(--ax-text-muted, #94a3b8); }
  .ax-modern-select {
    width: 100%; height: 42px; padding: 0 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px; font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a); background: var(--ax-surface-solid, #ffffff);
    outline: none; transition: all 0.2s ease;
  }
  .ax-modern-select:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-textarea {
    width: 100%; min-height: 80px; padding: 10px 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1); border-radius: 9px;
    font-size: 13px; color: var(--ax-text-strong, #0f172a);
    background: var(--ax-surface-solid, #ffffff); outline: none;
    transition: all 0.2s ease; resize: vertical; line-height: 1.5;
  }
  .ax-modern-textarea:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 620,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
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
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h4>
            {subtitle && <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ax-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Row Action Dropdown (Matching UP Resco Installation pattern) ───────── */
const MENU_W = 180;

function RowActionDropdown({
  onViewDetails,
  onEditClaim,
  canEdit = true,
  invoiceUrl,
}: {
  onViewDetails: () => void;
  onEditClaim: () => void;
  canEdit?: boolean;
  invoiceUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalItems = 2 + (invoiceUrl ? 1 : 0);
  const MENU_H = totalItems * 36 + 12;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < MENU_H + 8 && r.top > MENU_H + 8 ? r.top - MENU_H - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
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
        className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
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

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="ula-menu"
            role="menu"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: MENU_W,
              zIndex: 99999,
            }}
          >
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                style={{ width: 14, height: 14, color: '#059669', flexShrink: 0 }}
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>View Details</span>
            </button>

            {canEdit ? (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEditClaim();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: 14, height: 14, color: '#2563eb', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Claim</span>
              </button>
            ) : (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="Claim has been approved. Action is locked."
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: 14, height: 14, color: '#94a3b8', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ color: '#94a3b8' }}>Edit Claim (Locked)</span>
              </button>
            )}

            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: 14, height: 14, color: '#0284c7', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>View Invoice ↗</span>
              </a>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ── Top Metric KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const fmtMoney = (val?: string | number) => {
  const n = Number(val || 0);
  return '₹' + n.toLocaleString('en-IN');
};

const fmtDate = (s?: string) => {
  if (!s || s === 'NA' || s === 'null') return '—';
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return s.slice(0, 10);
};

const renderClaimStatusBadge = (status: number) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Raised (Pending)</Badge>;
};

const getAllPayments = (c: UpKusumCClaimPaymentItem): UpKusumCInstallPaymentBreakdown[] => {
  if (Array.isArray(c.allpayment) && c.allpayment.length > 0) return c.allpayment;
  if (Array.isArray((c as any).all_payments) && (c as any).all_payments.length > 0) return (c as any).all_payments;
  if (Array.isArray((c as any).payments) && (c as any).payments.length > 0) return (c as any).payments;
  return [];
};

const getPaymentAmount = (c: UpKusumCClaimPaymentItem): number | null => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    return list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }
  if (c.pay_amount !== undefined && c.pay_amount !== null && c.pay_amount !== '') {
    return Number(c.pay_amount) || 0;
  }
  if ((c as any).payment_amount !== undefined && (c as any).payment_amount !== null && (c as any).payment_amount !== '') {
    return Number((c as any).payment_amount) || 0;
  }
  if ((c as any).paid_amount !== undefined && (c as any).paid_amount !== null && (c as any).paid_amount !== '') {
    return Number((c as any).paid_amount) || 0;
  }
  if (Number(c.pay_status) === 1) {
    return Number(c.amount) || 0;
  }
  return null;
};

const getPaymentBalance = (c: UpKusumCClaimPaymentItem): number | null => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    const last = list[list.length - 1];
    if (last.balance !== undefined && last.balance !== null && last.balance !== '') {
      return Number(last.balance) || 0;
    }
    const total = Number(c.amount || 0);
    const paid = list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    return Math.max(0, total - paid);
  }
  if (c.balance_amount !== undefined && c.balance_amount !== null && c.balance_amount !== '') {
    return Number(c.balance_amount) || 0;
  }
  if ((c as any).payment_balance !== undefined && (c as any).payment_balance !== null && (c as any).payment_balance !== '') {
    return Number((c as any).payment_balance) || 0;
  }
  if (Number(c.pay_status) === 1) {
    return 0;
  }
  const total = Number(c.amount || 0);
  const paid = getPaymentAmount(c);
  if (paid !== null) {
    return Math.max(0, total - paid);
  }
  if (Number(c.pay_status) === 0 || c.pay_status === null || c.pay_status === undefined) {
    return total;
  }
  return null;
};

const getPaymentDate = (c: UpKusumCClaimPaymentItem): string => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    const last = list[list.length - 1];
    if (last.date) return last.date;
    if (last.created_at) return last.created_at.slice(0, 10);
  }
  return (
    c.pay_date ||
    (c as any).payment_date ||
    (c as any).paid_date ||
    (Number(c.pay_status) === 1 || Number(c.pay_status) === 2 ? c.approved_date : '') ||
    ''
  );
};

const getPaymentRemarks = (c: UpKusumCClaimPaymentItem): string => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i].pay_remarks || list[i].remarks;
      if (r && typeof r === 'string' && r.trim() !== '' && r !== '—') {
        return r;
      }
    }
  }
  return c.pay_remarks || (c as any).payment_remarks || c.approved_remarks || '—';
};

const renderPaymentStatusBadge = (status: number | string | undefined | null) => {
  const s = Number(status);
  if (s === 1) return <Badge tone="success">Complete</Badge>;
  if (s === 2) return <Badge tone="warning">Partially</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const parseSiteIds = (val?: any): (number | string)[] => {
  if (val === null || val === undefined || val === '') return [];
  if (typeof val === 'number') return [val];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
        const n = Number(item);
        return isNaN(n) ? String(item).trim() : n;
      })
      .filter((x) => x !== '' && x !== null && x !== undefined);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
            const n = Number(item);
            return isNaN(n) ? String(item).trim() : n;
          })
          .filter((x) => x !== '' && x !== null && x !== undefined);
      }
      if (typeof parsed === 'number') return [parsed];
    } catch {}
    const parts = trimmed
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.map((p) => {
        const n = Number(p);
        return isNaN(n) ? p : n;
      });
    }
    return [trimmed];
  }
  return [];
};

export function UP_Installation_KusumC_ViewPayment() {
  const [claims, setClaims] = useState<UpKusumCClaimPaymentItem[]>([]);
  const [claimableSites, setClaimableSites] = useState<{ id: number; f_farmer_name: string; inst_doc_status?: number; district?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3'>('all');

  // Add Claim Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addSelectedSites, setAddSelectedSites] = useState<number[]>([]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addRemarks, setAddRemarks] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Update Claim Modal
  const [editClaim, setEditClaim] = useState<UpKusumCClaimPaymentItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSelectedSites, setEditSelectedSites] = useState<(number | string)[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // View Payment Details / Breakdown Modal
  const [viewingPaymentClaim, setViewingPaymentClaim] = useState<UpKusumCClaimPaymentItem | null>(null);

  // Map of site IDs to farmer names for quick label lookup
  const [siteLabelMap, setSiteLabelMap] = useState<Map<number, { name: string; district?: string }>>(new Map());

  // Load Claims Data & Eligible Sites strictly from view-claim API (no fetch-site API)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const claimsRes = await upInstallationService.getKusumCClaims();

      let paymentsList: UpKusumCClaimPaymentItem[] = [];
      const cVal = claimsRes;
      if (Array.isArray(cVal?.payments)) paymentsList = cVal.payments;

      const realAvailableSites: { id: number; f_farmer_name: string; district?: string }[] = [];
      const labelsMap = new Map<number, { name: string; district?: string }>();
      const seenSiteIds = new Set<number>();

      // 1. Available sites from view-claim sites array
      if (Array.isArray(cVal?.sites)) {
        cVal.sites.forEach((s: any) => {
          if (s && s.id) {
            const numId = Number(s.id);
            const farmerName = s.f_farmer_name || s.farmer_name || s.site_name || s.name || '';
            const dist = s.district || '';
            if (farmerName) {
              labelsMap.set(numId, { name: farmerName, district: dist });
            }
            if (!seenSiteIds.has(numId)) {
              seenSiteIds.add(numId);
              realAvailableSites.push({
                id: numId,
                f_farmer_name: farmerName,
                district: dist,
              });
            }
          }
        });
      }

      // 2. Also populate labelsMap and pending sites from view-claim payments array
      paymentsList.forEach((p: any) => {
        const isPending = Number(p.claim_status) === 1 || Number(p.claim_status) === 0;
        const details = Array.isArray(p.site_details) ? p.site_details : [];
        details.forEach((s: any) => {
          if (s && s.id) {
            const numId = Number(s.id);
            const farmerName = s.f_farmer_name || s.farmer_name || s.name || '';
            const dist = s.district || '';
            if (farmerName) {
              labelsMap.set(numId, { name: farmerName, district: dist });
            }
            if (isPending && !seenSiteIds.has(numId)) {
              seenSiteIds.add(numId);
              realAvailableSites.push({
                id: numId,
                f_farmer_name: farmerName,
                district: dist,
              });
            }
          }
        });

        // Also if site_id is present without site_details
        const pIds = parseSiteIds(p.site_id);
        if (isPending && pIds.length > 0) {
          pIds.forEach((sid) => {
            const numId = Number(sid);
            if (!isNaN(numId) && !seenSiteIds.has(numId)) {
              seenSiteIds.add(numId);
              const farmerName = labelsMap.get(numId)?.name || '';
              realAvailableSites.push({
                id: numId,
                f_farmer_name: farmerName,
                district: labelsMap.get(numId)?.district || '',
              });
            }
          });
        }
      });

      setClaims(paymentsList);
      setClaimableSites(realAvailableSites);
      setSiteLabelMap(labelsMap);
    } catch (err: any) {
      console.error('Failed to load UP Kusum-C claims:', err);
      setClaims([]);
      setClaimableSites([]);
      setSiteLabelMap(new Map());
      setError(err?.message || 'Failed to load UP Kusum-C claims.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Claim Submit
  const handleAddClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) < 1) {
      setAddError('Please enter a valid claim amount (minimum 1).');
      return;
    }
    if (addSelectedSites.length === 0) {
      setAddError('Please select at least one eligible installation site.');
      return;
    }
    if (!addFile) {
      setAddError('Invoice document is required.');
      return;
    }
    if (!addRemarks.trim()) {
      setAddError('Claim remarks are required.');
      return;
    }

    setAddSubmitting(true);
    setAddError(null);
    try {
      const cleanSiteIds = addSelectedSites
        .map((id) => Number(id))
        .filter((num) => !isNaN(num) && num > 0);

      if (cleanSiteIds.length === 0) {
        setAddError('Please select at least one valid eligible installation site.');
        setAddSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('amount', addAmount.trim());
      cleanSiteIds.forEach((id) => {
        formData.append('site_id[]', String(id));
      });
      formData.append('file', addFile);
      formData.append('invoice', addFile);
      formData.append('remarks', addRemarks.trim());

      const res = await upInstallationService.storeKusumCClaim(formData);
      if (res.status !== false && (res as any).success !== false) {
        setAddSuccess(res.message || 'Payment claim raised successfully!');
        setTimeout(() => {
          setAddModalOpen(false);
          setAddAmount('');
          setAddSelectedSites([]);
          setAddFile(null);
          setAddRemarks('');
          setAddSuccess(null);
          loadData();
        }, 1500);
      } else {
        const fieldErrors =
          res.errors && typeof res.errors === 'object'
            ? Object.values(res.errors).flat().filter(Boolean).join(', ')
            : '';
        const errMsg = fieldErrors
          ? `${res.message ? `${res.message}: ` : ''}${fieldErrors}`
          : res.message || 'Failed to raise payment claim.';
        setAddError(errMsg);
      }
    } catch (err: any) {
      console.error('Failed to raise UP Kusum-C payment claim:', err);
      setAddError(err?.message || 'Failed to raise payment claim');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (c: UpKusumCClaimPaymentItem) => {
    setEditClaim(c);
    setEditAmount(String(c.amount || ''));
    setEditRemarks(c.remarks || '');
    setEditFile(null);
    setEditError(null);
    setEditSuccess(null);

    let siteIds: (number | string)[] = parseSiteIds(c.site_id);
    if (siteIds.length > 0) {
      siteIds = siteIds.map((sid) => {
        if (typeof sid === 'string' && isNaN(Number(sid))) {
          const match = claimableSites.find(
            (s) => s.f_farmer_name && s.f_farmer_name.trim().toLowerCase() === sid.trim().toLowerCase()
          );
          return match ? match.id : sid;
        }
        return sid;
      });
    } else if (c.site_id) {
      const match = claimableSites.find(
        (s) => s.f_farmer_name && s.f_farmer_name.trim().toLowerCase() === String(c.site_id).trim().toLowerCase()
      );
      siteIds = match ? [match.id] : [c.site_id as any];
    }
    setEditSelectedSites(siteIds);
  };

  // Handle Update Claim Submit
  const handleUpdateClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClaim) return;
    if (!editAmount || Number(editAmount) < 1) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    let sitesToSend = editSelectedSites;
    if (sitesToSend.length === 0) {
      sitesToSend = parseSiteIds(editClaim.site_id);
    }
    if (sitesToSend.length === 0 && editClaim.site_id) {
      sitesToSend = [editClaim.site_id as any];
    }

    const cleanSitesToSend = sitesToSend
      .map((id) => Number(id))
      .filter((num) => !isNaN(num) && num > 0);

    if (cleanSitesToSend.length === 0) {
      setEditError('Please select at least one valid site.');
      return;
    }
    if (!editRemarks.trim()) {
      setEditError('Claim remarks are required.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('update_id', String(editClaim.id));
      formData.append('id', String(editClaim.id));
      formData.append('amount', editAmount.trim());
      cleanSitesToSend.forEach((sid) => {
        formData.append('site_id[]', String(sid));
      });
      if (editFile) {
        formData.append('file', editFile);
        formData.append('invoice', editFile);
      }
      formData.append('remarks', editRemarks.trim());

      const res = await upInstallationService.updateKusumCClaim(formData);
      if (res.status !== false && (res as any).success !== false) {
        setEditSuccess(res.message || 'Payment claim updated successfully!');
        setTimeout(() => {
          setEditClaim(null);
          setEditAmount('');
          setEditSelectedSites([]);
          setEditFile(null);
          setEditRemarks('');
          setEditSuccess(null);
          loadData();
        }, 1500);
      } else {
        const fieldErrors =
          res.errors && typeof res.errors === 'object'
            ? Object.values(res.errors).flat().filter(Boolean).join(', ')
            : '';
        const errMsg = fieldErrors
          ? `${res.message ? `${res.message}: ` : ''}${fieldErrors}`
          : res.message || 'Failed to update payment claim.';
        setEditError(errMsg);
      }
    } catch (err: any) {
      console.error('Failed to update payment claim:', err);
      setEditError(err?.message || 'Failed to update payment claim');
    } finally {
      setEditSubmitting(false);
    }
  };

  const renderSiteFarmerNames = useCallback((c: UpKusumCClaimPaymentItem): string => {
    // 1. From c.site_details array (e.g. [{ id: 3030, f_farmer_name: "Deepak Pal" }])
    const details = (c as any).site_details;
    if (Array.isArray(details) && details.length > 0) {
      const names = details
        .map((s: any) => s.f_farmer_name || s.farmer_name || s.name)
        .filter((n: any) => typeof n === 'string' && n.trim() !== '');
      if (names.length > 0) {
        return names.join(', ');
      }
    }

    // 2. From site_id mapped via siteLabelMap
    const ids = parseSiteIds(c.site_id);
    if (ids && ids.length > 0) {
      const names = ids
        .map((id) => {
          const numId = Number(id);
          const match = !isNaN(numId) ? siteLabelMap.get(numId) : undefined;
          if (match?.name && isNaN(Number(match.name))) return match.name;
          if (typeof id === 'string' && isNaN(Number(id))) return id;
          return '';
        })
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }

    return '—';
  }, [siteLabelMap]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      const st = Number(statusFilter);
      list = list.filter((c) => c.claim_status === st);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const idStr = String(c.id);
        const amountStr = String(c.amount || '');
        const remarksStr = (c.remarks || '').toLowerCase();
        const dateStr = (c.date || (c as any).created_at || '').toLowerCase();
        const farmerStr = renderSiteFarmerNames(c).toLowerCase();
        const payRemarksStr = getPaymentRemarks(c).toLowerCase();
        const payDateStr = getPaymentDate(c).toLowerCase();
        return (
          idStr.includes(q) ||
          amountStr.includes(q) ||
          remarksStr.includes(q) ||
          dateStr.includes(q) ||
          farmerStr.includes(q) ||
          payRemarksStr.includes(q) ||
          payDateStr.includes(q)
        );
      });
    }
    return list;
  }, [claims, search, statusFilter, renderSiteFarmerNames]);

  // Pagination hook
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // KPI Calculations
  const totalClaimsCount = claims.length;
  const approvedClaims = claims.filter((c) => c.claim_status === 2).length;
  const pendingClaims = claims.filter((c) => c.claim_status === 1 || c.claim_status === 0).length;
  const totalAmountSum = claims.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const eligibleSitesCount = claimableSites.length;

  // Export Columns definition - Exact fields
  const exportCols: ExportColumn<UpKusumCClaimPaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r: UpKusumCClaimPaymentItem) => fmtDate(r.date || (r as any).created_at) },
      { header: 'Sites', accessor: (r: UpKusumCClaimPaymentItem) => renderSiteFarmerNames(r) },
      { header: 'Invoice', accessor: (r: UpKusumCClaimPaymentItem) => (r.file ? resolveUpMediaUrl(r.file) : '—') },
      { header: 'Amount', accessor: (r: UpKusumCClaimPaymentItem) => (r.amount ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : '—') },
      { header: 'Remarks', accessor: (r: UpKusumCClaimPaymentItem) => r.remarks || '—' },
      {
        header: 'Claim Status',
        accessor: (r: UpKusumCClaimPaymentItem) =>
          r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Raised (Pending)',
      },
      {
        header: 'Payment Amount',
        accessor: (r: UpKusumCClaimPaymentItem) => {
          const p = getPaymentAmount(r);
          return p !== null ? `₹ ${p.toLocaleString('en-IN')}` : '—';
        },
      },
      {
        header: 'Payment Balance',
        accessor: (r: UpKusumCClaimPaymentItem) => {
          const b = getPaymentBalance(r);
          return b !== null ? `₹ ${b.toLocaleString('en-IN')}` : '—';
        },
      },
      {
        header: 'Payment Date',
        accessor: (r: UpKusumCClaimPaymentItem) => {
          const d = getPaymentDate(r);
          return d ? fmtDate(d) : '—';
        },
      },
      { header: 'Payment Remarks', accessor: (r: UpKusumCClaimPaymentItem) => getPaymentRemarks(r) },
      {
        header: 'Payment Status',
        accessor: (r: UpKusumCClaimPaymentItem) =>
          Number(r.pay_status) === 1 ? 'Complete' : Number(r.pay_status) === 2 ? 'Partially' : 'Pending',
      },
    ],
    [siteLabelMap, renderSiteFarmerNames]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'UP_KusumC_Claims';
  const fileTitle = 'UP Kusum-C Claims & Payments Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Claims data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Claims data copied to clipboard!');
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const headers = [
    'S.No.',
    'Date',
    'Sites',
    'Invoice',
    'Amount',
    'Remarks',
    'Claim Status',
    'Payment Amount',
    'Payment Balance',
    'Payment Date',
    'Payment Remarks',
    'Payment Status',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact Assam SWP pattern) ── */}
      <PageHead
        title="View Kusum-C Installation Claims & Payments"
        subtitle="Submit stage payment invoices and manage claims for verified Kusum-C solar pump installations"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'Claims & Payments' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setAddAmount('');
                setAddSelectedSites([]);
                setAddFile(null);
                setAddRemarks('');
                setAddError(null);
                setAddSuccess(null);
                setAddModalOpen(true);
              }}
            >
              <span className="ax-btn__label">+ Raise New Claim</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Claims</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims Raised"
          value={totalClaimsCount.toLocaleString('en-IN')}
          sub={`${approvedClaims} approved · ${pendingClaims} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Claimed Amount"
          value={fmtMoney(totalAmountSum)}
          sub="Disbursement requests"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Claims"
          value={pendingClaims.toLocaleString('en-IN')}
          sub="Under review by administration"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Eligible Unclaimed"
          value={eligibleSitesCount.toLocaleString('en-IN')}
          sub="Sites ready to claim"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2l4 -4" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact Assam SWP table card layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Vendor Claims & Invoice Registry">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Claims & Invoice Registry</h2>
            <p className="ax-card__subtitle">
              Listing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Approved <b className="ax-num">{approvedClaims}</b> · Pending <b className="ax-num">{pendingClaims}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="kusumc_claim_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="1">Raised (Pending)</option>
                <option value="2">Approved</option>
                <option value="3">Rejected</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search date, farmer, amount, remarks…"
                size="sm"
                ariaLabel="Search vendor claims"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1450 }}
          >
            <caption className="ax-visually-hidden">Vendor Claims & Invoice Registry</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action'
                        ? { textAlign: 'center', width: 110 }
                        : h === 'Amount' || h === 'Payment Amount' || h === 'Payment Balance'
                        ? { textAlign: 'right' }
                        : h === 'Claim Status' || h === 'Payment Status' || h === 'Invoice'
                        ? { textAlign: 'center' }
                        : h === 'S.No.'
                        ? { width: 60 }
                        : undefined
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claim records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No claims have been submitted yet. Click "+ Raise New Claim" to submit your first claim.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((c, index) => {
                  const invoiceUrl = c.file ? resolveUpMediaUrl(c.file) : '';
                  const payAmt = getPaymentAmount(c);
                  const balAmt = getPaymentBalance(c);
                  const payDate = getPaymentDate(c);
                  const payRemarks = getPaymentRemarks(c);

                  return (
                    <tr key={c.id} className="ax-table__row">
                      {/* 1. S.No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Date */}
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {fmtDate(c.date || (c as any).created_at)}
                        </div>
                      </td>

                      {/* 3. Sites (Only f_farmer_name, no ID) */}
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {renderSiteFarmerNames(c)}
                        </div>
                      </td>

                      {/* 4. Invoice */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {invoiceUrl ? (
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: 'var(--asw-primary)', fontWeight: 600 }}
                          >
                            View Invoice ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* 5. Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--asw-primary)' }}>
                          {fmtMoney(c.amount)}
                        </strong>
                      </td>

                      {/* 6. Remarks */}
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)', maxWidth: 220, display: 'inline-block' }}>
                          {c.remarks || '—'}
                        </span>
                      </td>

                      {/* 7. Claim Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderClaimStatusBadge(c.claim_status)}
                      </td>

                      {/* 8. Payment Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {payAmt !== null ? (
                          <div>
                            <span style={{ color: 'var(--ax-text-strong)' }}>{fmtMoney(payAmt)}</span>
                            {getAllPayments(c).length > 0 && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                                {getAllPayments(c).length} {getAllPayments(c).length === 1 ? 'installment' : 'installments'}
                              </div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 9. Payment Balance */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {balAmt !== null ? fmtMoney(balAmt) : '—'}
                      </td>

                      {/* 10. Payment Date */}
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px' }}>
                          {payDate ? fmtDate(payDate) : '—'}
                        </div>
                      </td>

                      {/* 11. Payment Remarks */}
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)', maxWidth: 220, display: 'inline-block' }}>
                          {payRemarks}
                        </span>
                      </td>

                      {/* 12. Payment Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderPaymentStatusBadge(c.pay_status)}
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          canEdit={c.claim_status !== 2}
                          invoiceUrl={invoiceUrl}
                          onViewDetails={() => setViewingPaymentClaim(c)}
                          onEditClaim={() => openEditModal(c)}
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (exact Assam SWP pagination structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Add Claim Modal ── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Raise Installation Payment Claim"
        subtitle="Submit payment invoice for verified & doc-approved UP Kusum-C sites"
        maxWidth={620}
      >
        {addSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {addSuccess}</span>
          </div>
        )}

        {addError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{addError}</span>
          </div>
        )}

        <form onSubmit={handleAddClaimSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Amount Field with ₹ icon */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_amount">
                <span>Claim Amount (₹)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <div className="ax-modern-input-wrap">
                <span className="ax-modern-addon">₹</span>
                <input
                  id="add_amount"
                  type="number"
                  className="ax-modern-input"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  min={1}
                />
              </div>
            </div>

            {/* Eligible Completed Sites Dropdown */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_site_select">
                <span>
                  Select Eligible Completed Sites{' '}
                  {addSelectedSites.length > 0 && (
                    <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>
                      ({addSelectedSites.length} selected)
                    </span>
                  )}
                </span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="add_site_select"
                className="ax-modern-select"
                value={addSelectedSites.length === 1 ? String(addSelectedSites[0]) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const num = Number(val);
                  if (!addSelectedSites.includes(num)) {
                    setAddSelectedSites((prev) => [...prev, num]);
                  }
                }}
                disabled={addSubmitting}
                required={addSelectedSites.length === 0}
              >
                <option value="">
                  {loading
                    ? 'Fetching completed sites from server…'
                    : claimableSites.length === 0
                    ? 'No unclaimed eligible sites available'
                    : '-- Choose Eligible Completed Site --'}
                </option>
                {claimableSites.map((site) => {
                  const isSelected = addSelectedSites.includes(site.id);
                  const farmerLabel = site.f_farmer_name || siteLabelMap.get(site.id)?.name || 'Farmer';
                  return (
                    <option key={site.id} value={site.id}>
                      {farmerLabel} {isSelected ? '✓ [Selected]' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Selected site tags */}
              {addSelectedSites.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {addSelectedSites.map((sid) => {
                    const match = claimableSites.find((s) => s.id === sid);
                    const farmerLabel = match?.f_farmer_name || siteLabelMap.get(sid)?.name || 'Farmer';
                    return (
                      <span
                        key={sid}
                        className="ax-badge ax-badge--soft ax-badge--info"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: 6,
                        }}
                      >
                        <span>{farmerLabel}</span>
                        <button
                          type="button"
                          onClick={() => setAddSelectedSites((prev) => prev.filter((id) => id !== sid))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            color: 'currentColor',
                            lineHeight: 1,
                          }}
                          title="Remove site"
                          aria-label="Remove site"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Document Upload Dropzone */}
            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>Invoice / Bill File (PDF / JPG / PNG)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                ref={addFileRef}
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => setAddFile(e.target.files?.[0] || null)}
              />
              {!addFile ? (
                <div
                  className="ax-modern-dropzone"
                  onClick={() => addFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ax-modern-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                      Click to upload invoice / bill file
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                      Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ax-modern-file-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="ax-modern-file-chip__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {addFile.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                        {(addFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      setAddFile(null);
                      if (addFileRef.current) addFileRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_remarks">
                <span>Claim Remarks / Description</span>
                <span className="ax-modern-req">*</span>
              </label>
              <textarea
                id="add_remarks"
                className="ax-modern-textarea"
                rows={3}
                value={addRemarks}
                onChange={(e) => setAddRemarks(e.target.value)}
                placeholder="Enter remarks or invoice details..."
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={addSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={addSubmitting || claimableSites.length === 0}
            >
              {addSubmitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Claim Modal ── */}
      <Modal
        open={!!editClaim}
        onClose={() => setEditClaim(null)}
        title="Edit Claim"
        subtitle="Update claim amount, remarks, or replace invoice document"
        maxWidth={620}
      >
        {editSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {editSuccess}</span>
          </div>
        )}

        {editError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{editError}</span>
          </div>
        )}

        {editClaim && (
          <form onSubmit={handleUpdateClaimSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Amount */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_amount">
                  <span>Claim Amount (₹)</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <div className="ax-modern-input-wrap">
                  <span className="ax-modern-addon">₹</span>
                  <input
                    id="edit_amount"
                    type="number"
                    className="ax-modern-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                    min={1}
                  />
                </div>
              </div>

              {/* Sites */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_site_select">
                  <span>Included Sites ({editSelectedSites.length > 0 ? editSelectedSites.length : 1} selected)</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <select
                  id="edit_site_select"
                  className="ax-modern-select"
                  value={editSelectedSites.length === 1 ? String(editSelectedSites[0]) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const num = Number(val);
                    if (!editSelectedSites.some((id) => String(id) === String(num))) {
                      setEditSelectedSites((prev) => [...prev, num]);
                    }
                  }}
                >
                  <option value="">-- Select Site to Add --</option>
                  {claimableSites.map((site) => {
                    const isChecked = editSelectedSites.some((id) => String(id) === String(site.id));
                    const farmerLabel = site.f_farmer_name || siteLabelMap.get(site.id)?.name || 'Farmer';
                    return (
                      <option key={site.id} value={site.id}>
                        {farmerLabel} {isChecked ? '✓ [Included]' : ''}
                      </option>
                    );
                  })}
                </select>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {editSelectedSites.map((sid) => {
                    const match = claimableSites.find((s) => String(s.id) === String(sid));
                    const farmerLabel = match?.f_farmer_name || siteLabelMap.get(Number(sid))?.name || 'Farmer';
                    return (
                      <span
                        key={sid}
                        className="ax-badge ax-badge--soft ax-badge--info"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '12px' }}
                      >
                        <span>{farmerLabel}</span>
                        <button
                          type="button"
                          onClick={() => setEditSelectedSites((prev) => prev.filter((id) => String(id) !== String(sid)))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                          title="Remove site"
                          aria-label="Remove site"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Replace Invoice File */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>Replace Invoice File (Optional)</span>
                </label>
                <input
                  ref={editFileRef}
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                />
                {!editFile ? (
                  <div>
                    <div
                      className="ax-modern-dropzone"
                      onClick={() => editFileRef.current?.click()}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="ax-modern-dropzone__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                          Click to upload new invoice file
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                          Leave empty to keep existing invoice document
                        </div>
                      </div>
                    </div>
                    {editClaim.file && (
                      <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                        Current invoice:{' '}
                        <a href={resolveUpMediaUrl(editClaim.file)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                          View Current ↗
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {editFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(editFile.size / 1024).toFixed(1)} KB (New file)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setEditFile(null);
                        if (editFileRef.current) editFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_remarks">
                  <span>Claim Remarks / Description</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <textarea
                  id="edit_remarks"
                  className="ax-modern-textarea"
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setEditClaim(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={editSubmitting}
              >
                {editSubmitting ? 'Updating…' : 'Update Claim'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Payment Details & Breakdown Modal ── */}
      <Modal
        open={!!viewingPaymentClaim}
        onClose={() => setViewingPaymentClaim(null)}
        title={viewingPaymentClaim ? `Payment Details — Claim #${viewingPaymentClaim.id}` : 'Payment Details'}
        subtitle="Detailed breakdown of disbursements, approval records, and balance"
        maxWidth={740}
      >
        {viewingPaymentClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
              }}
            >
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Claim Amount</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--asw-primary, #2563eb)', marginTop: 4 }}>
                  {fmtMoney(viewingPaymentClaim.amount)}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Amount Paid</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>
                  {fmtMoney(getPaymentAmount(viewingPaymentClaim) ?? 0)}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Remaining Balance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706', marginTop: 4 }}>
                  {fmtMoney(getPaymentBalance(viewingPaymentClaim) ?? 0)}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Payout Status</div>
                <div style={{ marginTop: 6 }}>
                  {renderPaymentStatusBadge(viewingPaymentClaim.pay_status)}
                </div>
              </div>
            </div>

            {/* Approval Info */}
            {(viewingPaymentClaim.approved_date || viewingPaymentClaim.approved_by || viewingPaymentClaim.approved_remarks) && (
              <div style={{ padding: 14, borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Administrative Approval
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 13 }}>
                  {viewingPaymentClaim.approved_date && (
                    <div>
                      <span style={{ color: '#64748b' }}>Approved Date: </span>
                      <strong>{fmtDate(viewingPaymentClaim.approved_date)}</strong>
                    </div>
                  )}
                  {viewingPaymentClaim.approved_by && (
                    <div>
                      <span style={{ color: '#64748b' }}>Approved By: </span>
                      <strong>User #{viewingPaymentClaim.approved_by}</strong>
                    </div>
                  )}
                  {viewingPaymentClaim.approved_remarks && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748b' }}>Approval Remarks: </span>
                      <strong>{viewingPaymentClaim.approved_remarks}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sites Info */}
            <div style={{ padding: 14, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Associated Site(s)
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {renderSiteFarmerNames(viewingPaymentClaim)}
              </div>
            </div>

            {/* Individual Payments / Installments Table */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Disbursement Transactions ({getAllPayments(viewingPaymentClaim).length})
              </h4>
              {getAllPayments(viewingPaymentClaim).length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>#</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Date</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Amount Paid</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Balance</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Remarks</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllPayments(viewingPaymentClaim).map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>#{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{fmtDate(p.date || p.created_at)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {fmtMoney(p.amount)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                            {fmtMoney(p.balance)}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>{p.pay_remarks || p.remarks || '—'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge tone="success">Settled</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: 13 }}>
                  No installment transactions recorded yet.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setViewingPaymentClaim(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export { UP_Installation_KusumC_ViewPayment as ViewPayment };
export default UP_Installation_KusumC_ViewPayment;
