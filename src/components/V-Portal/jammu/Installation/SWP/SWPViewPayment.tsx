import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSwpService,
  resolveJammuSwpMediaUrl,
  type JammuSwpClaimItem,
  type JammuSwpClaimableSite,
  type JammuSwpInstallPaymentBreakdown,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const fmtMoney = (val?: string | number) => {
  const n = Number(val || 0);
  return '₹ ' + n.toLocaleString('en-IN');
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

const renderClaimStatusBadge = (status?: number | string) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="warning">Raised (Pending)</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const renderPaymentStatusBadge = (status?: number | string | null) => {
  const s = Number(status);
  const str = String(status || '').toLowerCase();
  if (s === 1 || str === 'paid' || str === 'done' || str === 'complete') {
    return <Badge tone="success">Complete</Badge>;
  }
  if (s === 2 || str === 'partial' || str === 'partially') {
    return <Badge tone="warning">Partially</Badge>;
  }
  return <Badge tone="neutral">Pending</Badge>;
};

const getAllPayments = (c: JammuSwpClaimItem): JammuSwpInstallPaymentBreakdown[] => {
  if (Array.isArray(c.allpayment) && c.allpayment.length > 0) return c.allpayment;
  if (Array.isArray(c.all_payments) && c.all_payments.length > 0) return c.all_payments;
  if (Array.isArray(c.payments) && c.payments.length > 0) return c.payments;
  return [];
};

const getPaymentAmount = (c: JammuSwpClaimItem): number | null => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    return list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }
  if (c.pay_amount !== undefined && c.pay_amount !== null && c.pay_amount !== '') {
    return Number(c.pay_amount) || 0;
  }
  if (c.payment_amount !== undefined && c.payment_amount !== null && c.payment_amount !== '') {
    return Number(c.payment_amount) || 0;
  }
  if (c.paid_amount !== undefined && c.paid_amount !== null && c.paid_amount !== '') {
    return Number(c.paid_amount) || 0;
  }
  if (Number(c.pay_status) === 1) {
    return Number(c.amount) || 0;
  }
  return null;
};

const getPaymentBalance = (c: JammuSwpClaimItem): number | null => {
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
  if (c.payment_balance !== undefined && c.payment_balance !== null && c.payment_balance !== '') {
    return Number(c.payment_balance) || 0;
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

const getPaymentDate = (c: JammuSwpClaimItem): string => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    const last = list[list.length - 1];
    if (last.date) return last.date;
    if (last.created_at) return last.created_at.slice(0, 10);
  }
  return (
    c.pay_date ||
    c.payment_date ||
    c.paid_date ||
    (Number(c.pay_status) === 1 || Number(c.pay_status) === 2 ? (c.approved_date || '') : '') ||
    ''
  );
};

const getPaymentRemarks = (c: JammuSwpClaimItem): string => {
  const list = getAllPayments(c);
  if (list.length > 0) {
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i].pay_remarks || list[i].remarks;
      if (r && typeof r === 'string' && r.trim() !== '' && r !== '—') {
        return r;
      }
    }
  }
  return c.pay_remarks || c.payment_remarks || c.approved_remarks || '—';
};

const parseSiteIds = (val?: any): (number | string)[] => {
  if (val === null || val === undefined || val === '') return [];
  if (typeof val === 'number') return [val];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'id' in item) return (item as any).id;
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
            if (typeof item === 'object' && item !== null && 'id' in item) return (item as any).id;
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

const fmtSites = (siteVal: any): string => {
  if (!siteVal) return DASH;
  if (Array.isArray(siteVal)) {
    return siteVal.join(', ');
  }
  if (typeof siteVal === 'string') {
    const trimmed = siteVal.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return DASH;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
    } catch {}
    return trimmed.replace(/[\[\]"']/g, '').trim() || DASH;
  }
  return String(siteVal);
};

/* ───────── Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  children: ReactNode;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal (Interactive Lightbox Zoom) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="claim-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="claim-preview-title">{title || 'Invoice Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">✕</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading invoice…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Invoice document could not be previewed. Try opening it in a new tab.</div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Invoice'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            style={{
              display: status === 'ready' ? 'block' : 'none',
              margin: 'auto',
              borderRadius: 0,
              ...(zoom === 1
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Top KPI Card ───────── */
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

/* ───────── Row Action Dropdown ───────── */
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
                <span style={{ color: '#94a3b8' }}>Edit (Locked)</span>
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

/* ───────── Overlay CSS ───────── */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
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
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ax-modal img { border-radius: 0 !important; }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }

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

/* ───────── Responsive Page CSS ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .ula-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 600;
  }
  .ula-menu {
    background: #ffffff;
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 4px;
    display: flex;
    flex-direction: column;
    min-width: 170px;
  }
  .ula-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 12.5px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    color: var(--ax-text, #0f172a);
    background: transparent;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible {
    background: var(--ax-surface-subtle, #f1f5f9) !important;
    outline: none;
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

// Requested headers for SWP Installation Payment (Exact 13 columns)
const PAYMENT_HEADERS = [
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

export function SWPViewPayment() {
  const [payments, setPayments] = useState<JammuSwpClaimItem[]>([]);
  const [claimableSites, setClaimableSites] = useState<JammuSwpClaimableSite[]>([]);
  const [siteLabelMap, setSiteLabelMap] = useState<Map<number, { name: string; district?: string }>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Invoice preview lightbox modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // View Payment Details / Breakdown Modal State
  const [viewingPaymentClaim, setViewingPaymentClaim] = useState<JammuSwpClaimItem | null>(null);

  // Add Payment Modal State (API 11)
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState<string>('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimFileRef = useRef<HTMLInputElement>(null);

  // Edit Payment Claim Modal State (API 12 & API 13)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingClaimId, setEditingClaimId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editSites, setEditSites] = useState<number[]>([]);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setSelectedSites([]);
    setClaimAmount('');
    setClaimInvoiceFile(null);
    setClaimRemarks('');
    setClaimError(null);
    if (claimFileRef.current) claimFileRef.current.value = '';
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingClaimId(null);
    setEditSites([]);
    setEditAmount('');
    setEditFile(null);
    setEditRemarks('');
    setEditError(null);
    if (editFileRef.current) editFileRef.current.value = '';
  }, []);

  // Load claims from API 10 and map farmer names from sites / installed sites
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsRes, installedRes] = await Promise.allSettled([
        jammuSwpService.getClaims(),
        jammuSwpService.getInstalledSites(),
      ]);

      const claimsData = claimsRes.status === 'fulfilled' ? claimsRes.value : { payments: [], sites: [] };
      const paymentsList: JammuSwpClaimItem[] = Array.isArray(claimsData.payments) ? claimsData.payments : [];
      const directSites: JammuSwpClaimableSite[] = Array.isArray(claimsData.sites) ? claimsData.sites : [];

      const labelsMap = new Map<number, { name: string; district?: string }>();
      const seenSiteIds = new Set<number>();
      const mergedClaimableSites: JammuSwpClaimableSite[] = [];

      // 1. From direct claim sites
      directSites.forEach((s) => {
        if (s && s.id) {
          const numId = Number(s.id);
          const farmerName = s.f_farmer_name || (s as any).farmer_name || '';
          const dist = s.district || '';
          if (farmerName) {
            labelsMap.set(numId, { name: farmerName, district: dist });
          }
          if (!seenSiteIds.has(numId)) {
            seenSiteIds.add(numId);
            mergedClaimableSites.push(s);
          }
        }
      });

      // 2. From payments' site_details
      paymentsList.forEach((p) => {
        const details = Array.isArray(p.site_details) ? p.site_details : [];
        details.forEach((s: any) => {
          if (s && s.id) {
            const numId = Number(s.id);
            const farmerName = s.f_farmer_name || s.farmer_name || s.name || '';
            const dist = s.district || '';
            if (farmerName) {
              labelsMap.set(numId, { name: farmerName, district: dist });
            }
          }
        });
      });

      // 3. From installed sites
      if (installedRes.status === 'fulfilled' && Array.isArray(installedRes.value?.sites)) {
        installedRes.value.sites.forEach((site) => {
          if (site && site.id) {
            const numId = Number(site.id);
            const farmerName = site.f_farmer_name || site.farmer_name || site.beneficiary_name || '';
            const dist = site.district || '';
            if (farmerName) {
              labelsMap.set(numId, { name: farmerName, district: dist });
            }
            const isClaimable =
              Number(site.inst_doc_status) === 2 ||
              (Number(site.inst_status) === 1 && Number(site.inst_claim_status) !== 2);
            if (isClaimable && !seenSiteIds.has(numId)) {
              seenSiteIds.add(numId);
              mergedClaimableSites.push({
                id: numId,
                f_farmer_name: farmerName || `Site #${numId}`,
                district: dist,
                inst_doc_status: site.inst_doc_status,
              });
            }
          }
        });
      }

      setPayments(paymentsList);
      setClaimableSites(mergedClaimableSites);
      setSiteLabelMap(labelsMap);
    } catch (err: any) {
      console.error('[Jammu SWP Claims] load error:', err);
      setPayments([]);
      setClaimableSites([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load claims from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to render Farmer Names for Sites column
  const renderSiteFarmerNames = useCallback(
    (c: JammuSwpClaimItem): string => {
      // 1. From c.site_details array if present
      const details = c.site_details;
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

      // 3. Fallback to fmtSites(c.site_id)
      return fmtSites(c.site_id);
    },
    [siteLabelMap]
  );

  // Submit Add Payment Form (API 11: POST jammu/swp/installation-add-claim)
  const handleAddPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedSites.length === 0) {
      setClaimError('Please select at least one eligible site to raise payment.');
      return;
    }
    const numAmt = Number(claimAmount);
    if (!claimAmount || isNaN(numAmt) || numAmt <= 0) {
      setClaimError('Please enter a valid amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setClaimError('Please upload the certified invoice file.');
      return;
    }
    if (!claimRemarks.trim()) {
      setClaimError('Remarks are required.');
      return;
    }

    setSubmittingClaim(true);
    setClaimError(null);

    try {
      const fd = new FormData();
      fd.append('amount', String(numAmt));
      selectedSites.forEach((sId) => {
        fd.append('site_id[]', String(sId));
      });
      fd.append('file', claimInvoiceFile);
      fd.append('remarks', claimRemarks.trim());

      const res = await jammuSwpService.addClaim(fd);

      setToastMsg({
        type: 'success',
        text: res.message || 'Payment raised successfully.',
      });

      closeAddModal();
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SWP RaiseClaim] error:', err);
      setClaimError(err?.message || 'Failed to raise payment claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Open Edit Claim Modal (API 13: POST jammu/swp/installation-fetch-claim)
  const handleOpenEdit = async (claimId: number) => {
    setEditingClaimId(claimId);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await jammuSwpService.fetchClaim(claimId);
      const c = res.claims;
      if (c) {
        setEditAmount(String(c.amount || ''));
        setEditRemarks(c.remarks || '');

        let parsedSites: number[] = [];
        if (Array.isArray(c.site_id)) {
          parsedSites = c.site_id.map(Number).filter(Boolean);
        } else if (typeof c.site_id === 'string') {
          try {
            parsedSites = JSON.parse(c.site_id).map(Number).filter(Boolean);
          } catch {
            parsedSites = c.site_id.split(',').map((x) => Number(x.trim())).filter(Boolean);
          }
        }
        setEditSites(parsedSites);
      }
    } catch (err: any) {
      console.error('Error fetching claim for edit:', err);
      const target = payments.find((p) => p.id === claimId);
      if (target) {
        setEditAmount(String(target.amount || ''));
        setEditRemarks(target.remarks || '');
      }
      setEditError(err?.message || 'Failed to fetch claim details for edit.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Update Claim (API 12: POST jammu/swp/installation-update-claim)
  const handleUpdateClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaimId) return;

    if (editSites.length === 0) {
      setEditError('Please select at least one site for this claim.');
      return;
    }
    const numAmt = Number(editAmount);
    if (!editAmount || isNaN(numAmt) || numAmt <= 0) {
      setEditError('Please enter a valid amount.');
      return;
    }
    if (!editRemarks.trim()) {
      setEditError('Remarks are required.');
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);

    try {
      const fd = new FormData();
      fd.append('update_id', String(editingClaimId));
      fd.append('amount', String(numAmt));
      editSites.forEach((sId) => {
        fd.append('site_id[]', String(sId));
      });
      fd.append('remarks', editRemarks.trim());
      if (editFile) {
        fd.append('file', editFile);
      }

      const res = await jammuSwpService.updateClaim(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Payment updated successfully.',
      });

      closeEditModal();
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SWP UpdateClaim] error:', err);
      setEditError(err?.message || 'Failed to update payment claim.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = payments.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalAmount += amt;
      if (Number(p.claim_status) === 2) {
        approvedCount++;
        approvedAmount += amt;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
    });

    return {
      totalCount,
      totalAmount,
      approvedCount,
      approvedAmount,
      pendingCount,
      pendingAmount,
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    let list = payments;

    if (statusFilter === 'approved') {
      list = list.filter((p) => Number(p.claim_status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((p) => Number(p.claim_status) === 1 || Number(p.claim_status) === 0);
    } else if (statusFilter === 'rejected') {
      list = list.filter((p) => Number(p.claim_status) === 3);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const amtStr = String(p.amount || '');
        const payAmt = getPaymentAmount(p);
        const payAmtStr = payAmt !== null ? String(payAmt) : '';
        const balAmt = getPaymentBalance(p);
        const balStr = balAmt !== null ? String(balAmt) : '';
        const sitesStr = renderSiteFarmerNames(p).toLowerCase();
        const remMatch = (p.remarks || '').toLowerCase().includes(q);
        const payRemMatch = getPaymentRemarks(p).toLowerCase().includes(q);
        const dateStr = (p.date || p.created_at || '').toLowerCase();
        const payDateStr = getPaymentDate(p).toLowerCase();
        return (
          String(p.id).includes(q) ||
          sitesStr.includes(q) ||
          amtStr.includes(q) ||
          payAmtStr.includes(q) ||
          balStr.includes(q) ||
          remMatch ||
          payRemMatch ||
          dateStr.includes(q) ||
          payDateStr.includes(q)
        );
      });
    }

    return list;
  }, [payments, search, statusFilter, renderSiteFarmerNames]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredPayments, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns definition (Exact 12 fields excluding Action)
  const exportCols: ExportColumn<JammuSwpClaimItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r: JammuSwpClaimItem) => fmtDate(r.date || r.created_at) },
      { header: 'Sites', accessor: (r: JammuSwpClaimItem) => renderSiteFarmerNames(r) },
      { header: 'Invoice', accessor: (r: JammuSwpClaimItem) => (r.file ? resolveJammuSwpMediaUrl(r.file) : DASH) },
      { header: 'Amount', accessor: (r: JammuSwpClaimItem) => (r.amount ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Remarks', accessor: (r: JammuSwpClaimItem) => r.remarks || DASH },
      {
        header: 'Claim Status',
        accessor: (r: JammuSwpClaimItem) =>
          Number(r.claim_status) === 2 ? 'Approved' : Number(r.claim_status) === 3 ? 'Rejected' : 'Raised (Pending)',
      },
      {
        header: 'Payment Amount',
        accessor: (r: JammuSwpClaimItem) => {
          const p = getPaymentAmount(r);
          return p !== null ? `₹ ${p.toLocaleString('en-IN')}` : DASH;
        },
      },
      {
        header: 'Payment Balance',
        accessor: (r: JammuSwpClaimItem) => {
          const b = getPaymentBalance(r);
          return b !== null ? `₹ ${b.toLocaleString('en-IN')}` : DASH;
        },
      },
      {
        header: 'Payment Date',
        accessor: (r: JammuSwpClaimItem) => {
          const d = getPaymentDate(r);
          return d ? fmtDate(d) : DASH;
        },
      },
      { header: 'Payment Remarks', accessor: (r: JammuSwpClaimItem) => getPaymentRemarks(r) },
      {
        header: 'Payment Status',
        accessor: (r: JammuSwpClaimItem) =>
          Number(r.pay_status) === 1 ? 'Complete' : Number(r.pay_status) === 2 ? 'Partially' : 'Pending',
      },
    ],
    [renderSiteFarmerNames]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SWP_Installation_Payment';
  const fileTitle = 'SWP Installation Payment Ledger';

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
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="SWP Installation Payment"
        subtitle="Submit SWP payment claims, upload certified invoices, and track subsidy disbursal ledger"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'View Payment' },
        ]}
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={() => setAddModalOpen(true)}
          >
            <span className="ax-btn__label">+ Add Payment</span>
          </button>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims Raised"
          value={kpis.totalCount.toLocaleString('en-IN')}
          sub={`${kpis.approvedCount} approved · ${kpis.pendingCount} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Claimed Amount"
          value={fmtMoney(kpis.totalAmount)}
          sub="Disbursement requests"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Pending Audit"
          value={kpis.pendingCount.toLocaleString('en-IN')}
          sub={fmtMoney(kpis.pendingAmount)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Claims Approved"
          value={kpis.approvedCount.toLocaleString('en-IN')}
          sub={fmtMoney(kpis.approvedAmount)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="SWP Installation Payment Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">SWP Installation Payment</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredPayments.length}</span> of <span className="ax-num">{payments.length}</span> claims
              {' '}· Approved <b className="ax-num">{kpis.approvedCount}</b> · Pending <b className="ax-num">{kpis.pendingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Filter */}
              <select
                id="claim_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Raised (Pending)</option>
                <option value="rejected">Rejected</option>
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
                ariaLabel="Search payment claims"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportToCSV(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredPayments, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Table matching exact 13 requested columns:
            S.No. | Date | Sites | Invoice | Amount | Remarks | Claim Status | Payment Amount | Payment Balance | Payment Date | Payment Remarks | Payment Status | Action ── */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1550 }}
          >
            <caption className="ax-visually-hidden">SWP Installation Payment Ledger</caption>
            <thead className="ax-table__head">
              <tr>
                {PAYMENT_HEADERS.map((h) => (
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
                  <td className="ax-table__td" colSpan={PAYMENT_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payment claims from server…
                  </td>
                </tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={PAYMENT_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No claim records match your current search or status filter.'
                          : 'No installation claims have been raised yet. Click "+ Add Payment" to initiate.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const invoiceUrl = row.file ? resolveJammuSwpMediaUrl(row.file) : '';
                  const isApproved = Number(row.claim_status) === 2;
                  const payAmt = getPaymentAmount(row);
                  const balAmt = getPaymentBalance(row);
                  const payDate = getPaymentDate(row);
                  const payRemarks = getPaymentRemarks(row);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      {/* 1. S.No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Date */}
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {fmtDate(row.date || row.created_at)}
                        </div>
                      </td>

                      {/* 3. Sites */}
                      <td className="ax-table__td" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {renderSiteFarmerNames(row)}
                        </span>
                      </td>

                      {/* 4. Invoice */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {invoiceUrl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', fontWeight: 600, padding: '2px 6px' }}
                              onClick={() => openPreview(invoiceUrl, `Invoice Claim #${row.id}`)}
                              title="Preview Invoice"
                            >
                              View
                            </button>
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#0284c7', fontSize: 11, padding: '2px 4px' }}
                              title="Open Invoice in new tab"
                            >
                              ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* 5. Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--asw-primary, #2563eb)' }}>
                          {fmtMoney(row.amount)}
                        </strong>
                      </td>

                      {/* 6. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        <span style={{ color: 'var(--ax-text-muted)' }}>
                          {row.remarks || '—'}
                        </span>
                      </td>

                      {/* 7. Claim Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderClaimStatusBadge(row.claim_status)}
                      </td>

                      {/* 8. Payment Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {payAmt !== null ? (
                          <div>
                            <span style={{ color: 'var(--ax-text-strong)' }}>{fmtMoney(payAmt)}</span>
                            {getAllPayments(row).length > 0 && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                                {getAllPayments(row).length} {getAllPayments(row).length === 1 ? 'installment' : 'installments'}
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
                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {payDate ? fmtDate(payDate) : '—'}
                      </td>

                      {/* 11. Payment Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        <span style={{ color: 'var(--ax-text-muted)' }}>
                          {payRemarks}
                        </span>
                      </td>

                      {/* 12. Payment Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderPaymentStatusBadge(row.pay_status)}
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          canEdit={!isApproved}
                          invoiceUrl={invoiceUrl}
                          onViewDetails={() => setViewingPaymentClaim(row)}
                          onEditClaim={() => handleOpenEdit(row.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Invoice Lightbox Zoom Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Payment Details & Breakdown Modal ── */}
      <Modal
        open={!!viewingPaymentClaim}
        onClose={() => setViewingPaymentClaim(null)}
        labelledBy="payment-breakdown-title"
        dialogClass="ax-modal__dialog--lg"
      >
        {viewingPaymentClaim && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="payment-breakdown-title">
                  Payment Details — Claim #{viewingPaymentClaim.id}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Detailed breakdown of disbursements, approval records, and balance
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setViewingPaymentClaim(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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

              {/* Administrative Approval Info */}
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
            </div>

            <div className="ax-modal__footer">
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

      {/* ── Add Payment Modal (API 11) ── */}
      <Modal open={addModalOpen} onClose={closeAddModal} labelledBy="add-payment-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleAddPaymentSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="add-payment-title">
                Add Payment
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Raise payment claim for verified SWP installations.
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={closeAddModal}
              disabled={submittingClaim}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {claimError && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {claimError}
              </div>
            )}

            {/* Select Site Dropdown */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_site_select">
                <span>Select Site</span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="claim_site_select"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                value={selectedSites[0] || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedSites(val ? [val] : []);
                }}
                disabled={submittingClaim}
                required
              >
                <option value="">-- Select Eligible Site --</option>
                {claimableSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.f_farmer_name || `Site #${s.id}`} {s.district ? `(${s.district})` : ''}
                  </option>
                ))}
              </select>
              {claimableSites.length === 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  ℹ️ Only verified installed sites can be claimed.
                </div>
              )}
            </div>

            {/* Invoice File Dropzone */}
            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>Invoice</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                ref={claimFileRef}
                id="claim_invoice_file"
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
              />
              {!claimInvoiceFile ? (
                <div
                  className="ax-modern-dropzone"
                  onClick={() => claimFileRef.current?.click()}
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
                      No file chosen
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                      Click to choose certified invoice file (PDF, JPG, PNG)
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
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {claimInvoiceFile.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                        {(claimInvoiceFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      setClaimInvoiceFile(null);
                      if (claimFileRef.current) claimFileRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_amount_input">
                <span>Amount</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                id="claim_amount_input"
                type="number"
                min="1"
                step="0.01"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                placeholder="Enter Amount"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                disabled={submittingClaim}
                required
              />
            </div>

            {/* Remarks */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_remarks">
                <span>Remarks</span>
                <span className="ax-modern-req">*</span>
              </label>
              <textarea
                id="claim_remarks"
                className="ax-input"
                style={{ width: '100%', padding: '10px 12px', minHeight: 65 }}
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                placeholder="Enter claim remarks..."
                rows={2}
                required
              />
            </div>
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={closeAddModal}
              disabled={submittingClaim}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingClaim || selectedSites.length === 0 || !claimAmount || !claimInvoiceFile}
            >
              {submittingClaim ? 'Submitting…' : 'Add Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Payment Claim Modal (API 12 & API 13) ── */}
      <Modal open={editModalOpen} onClose={closeEditModal} labelledBy="edit-payment-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleUpdateClaimSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="edit-payment-title">
                Edit Payment Claim
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Claim ID: <b>{editingClaimId}</b>
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={closeEditModal}
              disabled={submittingEdit}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editError && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editError}
              </div>
            )}

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#2563eb' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim details…
              </div>
            ) : (
              <>
                {/* Amount */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_amount_input">
                    <span>Amount (₹)</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input
                    id="edit_amount_input"
                    type="number"
                    min="1"
                    step="0.01"
                    className="ax-input"
                    style={{ width: '100%', height: 42 }}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Replace Invoice File (Optional on Edit) */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Replace Invoice Document (Optional)</span>
                  </label>
                  <input
                    ref={editFileRef}
                    id="edit_invoice_file"
                    type="file"
                    accept=".pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                  {!editFile ? (
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary"
                      onClick={() => editFileRef.current?.click()}
                    >
                      📎 Upload New Invoice File
                    </button>
                  ) : (
                    <div className="ax-modern-file-chip">
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{editFile.name}</span>
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--xs"
                        style={{ color: '#ef4444' }}
                        onClick={() => setEditFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_remarks_input">
                    <span>Remarks</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <textarea
                    id="edit_remarks_input"
                    className="ax-input"
                    style={{ width: '100%', padding: '10px 12px', minHeight: 70 }}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={closeEditModal}
              disabled={submittingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEdit || editLoading || !editAmount}
            >
              {submittingEdit ? 'Updating…' : 'Update Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SWPViewPayment;
