<<<<<<< HEAD
﻿import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  JAMMU_RESCO_VENDORS,
  jammuRescoAdminService,
  resolveJammuMediaUrl,
  type RescoPaymentItem,
} from './jammuRescoAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP reference, all columns scrollable) ───────── */
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
=======
<<<<<<< HEAD
import React from 'react';
import RescoStatusView from '../../../../V-Portal/jammu/Installation/Resco/RescoStatusView';

/**
 * Super Admin - Jammu RESCO View Payment Desk
 * Monitor payment settlements, milestone disbursements and financial audits
 */
export const ViewRescoPayment: React.FC = () => {
  return <RescoStatusView />;
=======
import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  type JammuRescoPaymentItem,
  type JammuRescoClaimData,
} from '../../../../V-Portal/jammu/jammu-services';
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
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const PaymentStatusBadge = ({ status, isClaimRaised }: { status?: number | string; isClaimRaised?: boolean }) => {
  if (isClaimRaised === false) return <Badge tone="neutral">Not Raised</Badge>;
  const s = Number(status ?? 0);
  if (s === 1 || s === 2) return <Badge tone="success">Disbursed</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending Disbursement</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Invoice Preview Lightbox ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function InvoicePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf ? 'ready' : 'loading');
  }, [url, isPdf]);

  return (
    <Modal open onClose={onClose} labelledBy="invoice-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="invoice-preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Invoice Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading invoice document…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Invoice document could not be previewed inline. Try opening it in a new tab.</div>
          )}

          {isPdf ? (
            <iframe
              src={url}
              title={title || 'Invoice PDF Preview'}
              style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
            />
          ) : (
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
          )}
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        {!isPdf ? (
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
        ) : <div />}
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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

/* ───────── Styles ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

<<<<<<< HEAD
    .solar-erp-page .asw-cards-row {
=======
  .solar-erp-page .asw-cards-row {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
<<<<<<< HEAD
  .solar-erp-page .asw-cards-row span svg {
    width: 15px !important;
    height: 15px !important;
    display: block !important;
  }
  /* Compact table action buttons */
  .solar-erp-page .ax-table .ax-btn--sm,
  .solar-erp-page .ax-table .ax-btn--xs,
  .solar-erp-page .ax-table button.ax-btn,
  .solar-erp-page .ax-table a.ax-btn {
    min-height: unset !important;
    height: auto !important;
    padding: 4px 8px !important;
    font-size: 11px !important;
    line-height: 1.2 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
  }
    @media (max-width: 1024px) {
=======
  @media (max-width: 992px) {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
<<<<<<< HEAD
  @media (max-width: 640px) {
=======
  @media (max-width: 520px) {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
  .solar-erp-page .ax-card__eyebrow,
=======
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD

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

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
=======
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .solar-erp-page .swp-payment-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    padding: 0 20px;
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .solar-erp-page .swp-payment-tab-btn {
    padding: 10px 16px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--ax-text-muted, #64748b);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
  }
  .solar-erp-page .swp-payment-tab-btn.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }

  /* Modals */
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
=======
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
<<<<<<< HEAD
    transition: all 0.15s ease;
=======
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
<<<<<<< HEAD
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
=======
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

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
`;

export const ViewRescoPayment: React.FC = () => {
  const [claimData, setClaimData] = useState<JammuRescoClaimData>({
    payments: [],
    pay1: [],
    pay2: [],
    pay3: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pay40' | 'pay30_1' | 'pay30_2'>('all');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Settle Payment Modal State
  const [settleModalItem, setSettleModalItem] = useState<JammuRescoPaymentItem | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleDate, setSettleDate] = useState<string>('');
  const [settleRemarks, setSettleRemarks] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState<boolean>(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Payment Data from API
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getInstallationClaims();
      setClaimData(res);
    } catch (err: any) {
      console.error('[Admin View Payment] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load payments.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Switch tab records
  const tabPayments = useMemo(() => {
    if (activeTab === 'pay40') return claimData.pay1 || [];
    if (activeTab === 'pay30_1') return claimData.pay2 || [];
    if (activeTab === 'pay30_2') return claimData.pay3 || [];
    return claimData.payments || [];
  }, [activeTab, claimData]);

  // Financial Metrics
  const totalDisbursed = useMemo(
    () => claimData.payments.reduce((acc, p) => acc + (Number(p.payment_amount) || 0), 0),
    [claimData]
  );
  const totalBalance = useMemo(
    () => claimData.payments.reduce((acc, p) => acc + (Number(p.balance) || 0), 0),
    [claimData]
  );
  const settledCount = useMemo(
    () => claimData.payments.filter((p) => Number(p.payment_status) === 1 || Number(p.payment_status) === 2).length,
    [claimData]
  );
  const pendingCount = claimData.payments.length - settledCount;

  // Filtered
  const filtered = useMemo(() => {
    return tabPayments.filter((r) => {
      const pStatus = Number(r.payment_status ?? 0);
      if (statusFilter === 'disbursed' && pStatus !== 1 && pStatus !== 2) return false;
      if (statusFilter === 'pending' && (pStatus === 1 || pStatus === 2 || pStatus === 3)) return false;
      if (statusFilter === 'rejected' && pStatus !== 3) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sName = String(r.site_name || r.sites || '').toLowerCase();
        const cType = String(r.claim || '').toLowerCase();
        const rem = String(r.payment_remarks || r.remarks || '').toLowerCase();
        if (!sName.includes(q) && !cType.includes(q) && !rem.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tabPayments, statusFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filtered,
    initialPageSize: 10,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, activeTab, setPage]);

  // Submit Payment Settlement
  const handleSavePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!settleModalItem) return;
    setSavingPayment(true);
    try {
      const fd = new FormData();
      fd.append('id', String(settleModalItem.id));
      fd.append('payment_amount', settleAmount);
      fd.append('payment_date', settleDate || new Date().toISOString().split('T')[0]);
      fd.append('payment_remarks', settleRemarks);
      fd.append('status', '2'); // Ensure approved

      await jammuRescoService.updateClaim(fd);
      setToastMsg({ type: 'success', text: 'Disbursement settlement recorded successfully!' });
      setSettleModalItem(null);
      loadPayments();
    } catch (err: any) {
      console.error('[Admin Settle Payment] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to record disbursement.' });
    } finally {
      setSavingPayment(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoPaymentItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Payment Date', accessor: (r) => txt(r, 'payment_date') || txt(r, 'date') || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || r.sites || DASH },
      { header: 'Claim Milestone', accessor: (r) => r.claim || '—' },
      { header: 'Claim Amount', accessor: (r) => (r.amount !== undefined ? `Rs. ${Number(r.amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Disbursed Amount', accessor: (r) => (r.payment_amount !== undefined ? `Rs. ${Number(r.payment_amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Balance', accessor: (r) => (r.balance !== undefined ? `Rs. ${Number(r.balance).toLocaleString('en-IN')}` : DASH) },
      { header: 'Payment Status', accessor: (r) => (Number(r.payment_status) === 1 || Number(r.payment_status) === 2 ? 'Disbursed' : 'Pending') },
      { header: 'Payment Remarks / UTR', accessor: (r) => r.payment_remarks || DASH },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - View Payment"
        subtitle="Track milestone disbursements, Stage 1 (80%) and Stage 2 (20%) subsidy releases, UTR numbers, and payment reconciliation"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'View Payment' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/view-claim" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Claims
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/view-bills" className="ax-btn ax-btn--primary ax-btn--sm">
              Monthly Bills
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="emerald"
          label="Total Disbursed"
          value={`Rs. ${totalDisbursed.toLocaleString('en-IN')}`}
          sub="Disbursed to vendors"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Outstanding Balance"
          value={`Rs. ${totalBalance.toLocaleString('en-IN')}`}
          sub="Pending milestone release"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="accent"
          label="Settled Milestones"
          value={settledCount.toLocaleString('en-IN')}
          sub="Paid claims"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Pending Releases"
          value={pendingCount.toLocaleString('en-IN')}
          sub="Awaiting finance release"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card with Tabs ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Payments Register Table">
        {/* Milestone Sub-Tabs */}
        <div className="swp-payment-tabs" role="tablist">
          <button
            type="button"
            className={`swp-payment-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            role="tab"
            aria-selected={activeTab === 'all'}
          >
            All Payments ({claimData.payments.length})
          </button>
          <button
            type="button"
            className={`swp-payment-tab-btn ${activeTab === 'pay40' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay40')}
            role="tab"
            aria-selected={activeTab === 'pay40'}
          >
            Stage 1 (80% / 40%) ({claimData.pay1.length})
          </button>
          <button
            type="button"
            className={`swp-payment-tab-btn ${activeTab === 'pay30_1' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay30_1')}
            role="tab"
            aria-selected={activeTab === 'pay30_1'}
          >
            Stage 2 (20% / 30%) ({claimData.pay2.length})
          </button>
          <button
            type="button"
            className={`swp-payment-tab-btn ${activeTab === 'pay30_2' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay30_2')}
            role="tab"
            aria-selected={activeTab === 'pay30_2'}
          >
            Stage 3 (Final 30%) ({claimData.pay3.length})
          </button>
        </div>

        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Payment Disbursements Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabPayments.length}</span> payment disbursements
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 150, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by payment status"
              >
                <option value="all">All Payment Status</option>
                <option value="disbursed">Disbursed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, UTR, remarks…"
                size="sm"
                ariaLabel="Search payments"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Payments')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Payments')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Payment Disbursements Register')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Payment Date</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Claim Milestone</th>
                <th className="ax-table__th" scope="col">Claim Amount</th>
                <th className="ax-table__th" scope="col">Disbursed Amount</th>
                <th className="ax-table__th" scope="col">Outstanding Balance</th>
                <th className="ax-table__th" scope="col">Invoice</th>
                <th className="ax-table__th" scope="col">Payment Status</th>
                <th className="ax-table__th" scope="col">Payment Remarks / UTR</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payment disbursements…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No payment records found"
                      message="No disbursements match your current filter query."
                      onClear={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const invoiceUrl = row.invoice ? resolveJammuMediaUrl(row.invoice) : null;
                  const isClaimRaised = row.status !== undefined && Number(row.status) > 0;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{txt(row, 'payment_date') || txt(row, 'date') || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || row.sites || DASH}
                      </td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">
                          {row.claim || `Stage ${row.pay || 1}`}
                        </span>
                      </td>

                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>
                        {row.amount !== undefined ? `Rs. ${Number(row.amount).toLocaleString('en-IN')}` : DASH}
                      </td>

                      <td className="ax-table__td ax-num" style={{ color: '#16a34a', fontWeight: 700 }}>
                        {row.payment_amount !== undefined && Number(row.payment_amount) > 0
                          ? `Rs. ${Number(row.payment_amount).toLocaleString('en-IN')}`
                          : DASH}
                      </td>

                      <td className="ax-table__td ax-num" style={{ color: '#d97706' }}>
                        {row.balance !== undefined ? `Rs. ${Number(row.balance).toLocaleString('en-IN')}` : DASH}
                      </td>

                      {/* Invoice Link */}
                      <td className="ax-table__td">
                        {invoiceUrl ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => openPreview(invoiceUrl, `Invoice: ${row.site_name || row.id}`)}
                            style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            View Invoice
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="ax-table__td">
                        <PaymentStatusBadge status={row.payment_status} isClaimRaised={isClaimRaised} />
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.payment_remarks || DASH}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => {
                            setSettleModalItem(row);
                            setSettleAmount(String(row.payment_amount || row.amount || ''));
                            setSettleDate(row.payment_date || new Date().toISOString().split('T')[0]);
                            setSettleRemarks(row.payment_remarks || '');
                          }}
                          style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                        >
                          Settle Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>

      {/* ── Settle Payment Modal ── */}
      {settleModalItem && (
        <Modal open onClose={() => setSettleModalItem(null)} labelledBy="settle-payment-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSavePayment}>
            <div className="ax-modal__header">
              <div>
                <h3 id="settle-payment-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Record Payment Disbursement
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{settleModalItem.site_name || settleModalItem.sites}</b> · Claim: <b>{settleModalItem.claim}</b>
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setSettleModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Disbursement Amount (Rs.) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Disbursement / Settlement Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Payment UTR / Transaction Reference & Remarks
                </label>
                <textarea
                  className="ax-input"
                  rows={3}
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                  value={settleRemarks}
                  onChange={(e) => setSettleRemarks(e.target.value)}
                  placeholder="Enter Bank transaction UTR number, voucher code, or finance remarks…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSettleModalItem(null)}
                disabled={savingPayment}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingPayment}
              >
                {savingPayment ? 'Recording…' : 'Record Disbursement'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Invoice Preview Modal ── */}
      {preview && (
        <InvoicePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}
    </div>
  );
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
          <span style={{ width: 15, height: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

export function ViewRescoPayment() {
  const [payments, setPayments] = useState<RescoPaymentItem[]>([]);
  const [stats, setStats] = useState({
    total: 3,
    complete: 1,
    partially: 1,
    pending: 1,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Top Filter Controls matching exact prompt
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Settle Payment Modal
  const [selectedForSettlement, setSelectedForSettlement] = useState<RescoPaymentItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<'RTGS' | 'NEFT' | 'IMPS' | 'Treasury Transfer'>('RTGS');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [settlementRemarks, setSettlementRemarks] = useState('');
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoAdminService.getPayments();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load RESCO payments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Multi-facet filter
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          p.vendor.toLowerCase().includes(q) ||
          (p.utr_no && p.utr_no.toLowerCase().includes(q)) ||
          (p.remarks && p.remarks.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      // Date filters
      if (fromDate && p.date < fromDate) return false;
      if (toDate && p.date > toDate) return false;
      // Vendor filter
      if (filterVendor && !p.vendor.toLowerCase().includes(filterVendor.toLowerCase())) return false;
      // Status filter
      if (filterStatus && p.pay_status !== filterStatus) return false;

      return true;
    });
  }, [payments, searchQuery, fromDate, toDate, filterVendor, filterStatus]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 10 });

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterVendor('');
    setFilterStatus('');
    setSearchQuery('');
  };

  const handleSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForSettlement) return;

    setSubmittingSettlement(true);
    try {
      const disbursedNow = Number(payAmountInput) || (selectedForSettlement.amount - selectedForSettlement.pay_amount);
      const newPaid = selectedForSettlement.pay_amount + disbursedNow;
      const newBalance = Math.max(0, selectedForSettlement.amount - newPaid);
      const newStatus = newBalance === 0 ? 'Complete' : 'Partially';

      setPayments((prev) =>
        prev.map((item) =>
          item.id === selectedForSettlement.id
            ? {
                ...item,
                pay_amount: newPaid,
                balance_amount: newBalance,
                pay_status: newStatus,
                pay_date: settlementDate,
                pay_remarks: settlementRemarks,
                utr_no: utrNumber,
                payment_mode: paymentMode,
              }
            : item
        )
      );

      setSelectedForSettlement(null);
      setPayAmountInput('');
      setUtrNumber('');
      setSettlementRemarks('');
    } finally {
      setSubmittingSettlement(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="View Jammu Resco Installation Payment"
        subtitle="Tracking rooftop solar milestone disbursements, RTGS/NEFT transaction references, and contractor treasury accounts in Jammu & Kashmir."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'View Jammu Resco Installation Payment' },
        ]}
      />

      {/* Top 4 KPI Metric Cards matching exact user format */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          tone="accent"
          label="Payment Request"
          value={stats.total}
          sub="Total raised payment batches"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Payment Complete"
          value={stats.complete}
          sub="Fully settled contractor accounts"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="cyan"
          label="Payment Partially"
          value={stats.partially}
          sub="Milestone installments disbursed"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          tone="amber"
          label="Payment Pending"
          value={stats.pending}
          sub="Awaiting treasury disbursement"
        />
      </div>

      {/* Resco Installation Payment Filters Card matching exact prompt */}
      <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Resco Installation Payment Filter
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ax-input"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ax-input"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              Select Vendor
            </label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="ax-select"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="">-- Select Vendor --</option>
              {JAMMU_RESCO_VENDORS.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ax-select"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="">-- Select Status --</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Paid</option>
              <option value="Partially">Partially</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ax-btn ax-btn--secondary"
              style={{ width: '100%', padding: '6px 14px', fontSize: 12, height: 34 }}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Resco Installation Payment</h2>
            <p className="ax-card__subtitle">Showing {filteredPayments.length} payment records</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, UTR..." size="sm" />
              <TableExportToolbar onCopy={() => {}} onExportCSV={() => {}} onExportExcel={() => {}} onExportPDF={() => {}} />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th ax-table__th--num">Sites</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Invoice</th>
                <th className="ax-table__th ax-table__th--num">Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th ax-table__th--num">Pay Amount</th>
                <th className="ax-table__th ax-table__th--num">Balance Amount</th>
                <th className="ax-table__th">Pay Date</th>
                <th className="ax-table__th">Pay Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Pay Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>Loading payment records...</td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No payment disbursements match current criteria" />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.date}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{row.vendor}</td>
                      <td className="ax-table__td ax-table__td--num">{row.sites}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.invoice_file ? (
                          <a
                            href={resolveJammuMediaUrl(row.invoice_file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2559bf', fontWeight: 600 }}
                          >
                            📄 Invoice
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 800 }}>
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 160, whiteSpace: 'normal' }}>
                        {row.remarks || '—'}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{row.pay_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: row.balance_amount > 0 ? '#d97706' : '#64748b' }}>
                        ₹{row.balance_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.pay_date || 'Awaiting Transfer'}</td>
                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 160, whiteSpace: 'normal' }}>
                        {row.pay_remarks || '—'}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            row.pay_status === 'Complete'
                              ? 'ax-badge--success'
                              : row.pay_status === 'Partially'
                              ? 'ax-badge--info'
                              : 'ax-badge--warning'
                          }`}
                          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {row.pay_status}
                        </span>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedForSettlement(row);
                            setPayAmountInput(String(row.balance_amount || row.amount));
                            setUtrNumber(row.utr_no || '');
                            setPaymentMode(row.payment_mode || 'RTGS');
                            setSettlementDate(row.pay_date || new Date().toISOString().slice(0, 10));
                            setSettlementRemarks(row.pay_remarks || '');
                          }}
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          style={{
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            lineHeight: 1.2,
                            height: 'auto',
                            minHeight: 'unset',
                          }}
                        >
                          {row.pay_status === 'Complete' ? 'Edit UTR' : 'Settle'}
                        </button>
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

      {/* Settlement Action Modal */}
      <Modal
        open={Boolean(selectedForSettlement)}
        onClose={() => setSelectedForSettlement(null)}
        title="Record RESCO Treasury Settlement"
        subtitle={selectedForSettlement ? `Vendor: ${selectedForSettlement.vendor} • Amount: ₹${selectedForSettlement.amount.toLocaleString('en-IN')}` : ''}
        maxWidth={560}
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedForSettlement(null)} disabled={submittingSettlement}>
              Cancel
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={handleSettlementSubmit} disabled={submittingSettlement}>
              {submittingSettlement ? 'Confirming...' : 'Confirm Settlement'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSettlementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Disbursement Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              value={payAmountInput}
              onChange={(e) => setPayAmountInput(e.target.value)}
              className="ax-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              UTR / Bank Transaction Reference <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. JKB202602160998812"
              className="ax-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="ax-select"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              >
                <option value="RTGS">RTGS</option>
                <option value="NEFT">NEFT</option>
                <option value="IMPS">IMPS</option>
                <option value="Treasury Transfer">Treasury Transfer</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Disbursement Date
              </label>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="ax-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Settlement Remarks
            </label>
            <textarea
              rows={3}
              value={settlementRemarks}
              onChange={(e) => setSettlementRemarks(e.target.value)}
              placeholder="Enter bank transaction remarks or tranche details..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ViewRescoPayment;
