<<<<<<< HEAD
﻿import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
=======
<<<<<<< HEAD
﻿import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
  jammuRescoAdminService,
  resolveJammuMediaUrl,
<<<<<<< HEAD
} from './jammuRescoAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SWP / SRT 70MW reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
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
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
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

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

=======
  type RescoVerifyDocItem,
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
 * Super Admin - Verify Jammu RESCO Documents Desk
 * Inspect commissioned site documents, net-metering certificates, and CEIG approvals
 */
export const VerifyRescoDocument: React.FC = () => {
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
  getJammuMediaCandidates,
  type JammuRescoInstalledSiteItem,
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

const DocBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Under Review</Badge>;
  return <Badge tone="neutral">Not Uploaded</Badge>;
};

const VerifyBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Verified</Badge>;
  if (s === 2) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
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
  children,
  dialogClass = '',
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
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

/* ───────── Document & Media Preview Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function DocPreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf ? 'ready' : 'loading');
  }, [url, isPdf]);

  return (
    <Modal open onClose={onClose} labelledBy="doc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="doc-preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Document Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading document…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Document could not be previewed inline. Try opening it in a new tab.</div>
          )}

          {isPdf ? (
            <iframe
              src={url}
              title={title || 'PDF Document Preview'}
              style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
            />
          ) : (
            <img
              key={url}
              src={url}
              alt={title || 'Document'}
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

>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0' }}>
=======
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

<<<<<<< HEAD
/* ───────── Modal Dialog Component ───────── */
=======
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
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
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
  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
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

<<<<<<< HEAD
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
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
  }

=======
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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

>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
<<<<<<< HEAD
  maxWidth = 540,
=======
  maxWidth = 640,
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
=======
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
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

<<<<<<< HEAD
/* ───────── Lightbox Modal ───────── */
function LightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Document Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface JammuRescoVerifyDocumentItem {
  id: number;
  state: string;
  vendorName: string;
  district: string;
  block: string;
  village: string;
  siteName: string;
  applicantName: string;
  contactPerson?: string;
  contactNumber?: string;
  documentFile?: string;
  submitDate: string;
  remarks: string;
  verifyStatus: 'Pending' | 'Approved' | 'Rejected';
  rawStatus: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  verifyRemarks: string;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function extractFilePath(raw: any): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) return extractFilePath(parsed[0]);
      } catch {}
    }
    trimmed = trimmed.replace(/^["']|["']$/g, '');
    trimmed = trimmed.replace(/\\+/g, '/');
    return trimmed;
  }
  if (Array.isArray(raw) && raw.length > 0) return extractFilePath(raw[0]);
  return undefined;
}

export function VerifyRescoDocument() {
  const [items, setItems] = useState<JammuRescoVerifyDocumentItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    not_assigned: 0,
    complete: 0,
    pending: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>('all');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Verify Modal
  const [selectedDocForAction, setSelectedDocForAction] = useState<JammuRescoVerifyDocumentItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('2'); // '2' = Approved, '3' = Rejected
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Fetch document verification records strictly from live API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await jammuRescoAdminService.getViewInstallationDocument();
      if (resp.detail) {
        setStats({
          total: Number(resp.detail.total || 0),
          assigned: Number(resp.detail.assigned || 0),
          not_assigned: Number(resp.detail.not_assigned || 0),
          complete: Number(resp.detail.complete || 0),
          pending: Number(resp.detail.pending || 0),
          doc_approved: Number(resp.detail.doc_approved || 0),
          doc_pending: Number(resp.detail.doc_pending || 0),
          doc_reject: Number(resp.detail.doc_reject || 0),
        });
      }

      const mapDocItem = (item: any, defaultSt: number): JammuRescoVerifyDocumentItem => {
        const rawStatus = Number(item.inst_doc_status ?? item.status ?? item.verify_status ?? defaultSt);
        const verifyStatus: 'Pending' | 'Approved' | 'Rejected' =
          rawStatus === 2 ? 'Approved' : rawStatus === 3 ? 'Rejected' : 'Pending';

        const rawCandidate =
          item.inst_doc_file ||
          item.document_file ||
          item.doc_file ||
          item.file ||
          item.inst_doc ||
          item.document ||
          item.hoc_photo;
        const cleanFile = extractFilePath(rawCandidate);

        const displayName =
          item.site_name ||
          item.f_farmer_name ||
          item.farmer_name ||
          item.applicant_name ||
          item.beneficiary_name ||
          `Site #${item.id}`;

        return {
          id: Number(item.id),
          state: 'Jammu',
          vendorName: item.vendor_name || item.vendor || item.firm_name || (item.vendors?.name ? item.vendors.name : (item.inst_vendor ? `Vendor #${item.inst_vendor}` : '—')),
          district: item.district || item.f_district || 'Jammu',
          block: item.block || item.f_block || '—',
          village: item.village || item.panchayat || item.f_village || '—',
          siteName: displayName,
          applicantName: displayName,
          contactPerson: item.contact_person || item.person || '—',
          contactNumber: item.contact_number || item.phone || item.mobile || '—',
          documentFile: cleanFile ? resolveJammuMediaUrl(cleanFile) : undefined,
          submitDate: item.inst_doc_date || item.submit_date || item.doc_date || item.created_at || '—',
          remarks: item.inst_doc_remarks || item.remarks || item.inst_remarks || '—',
          verifyStatus,
          rawStatus,
          verifyRemarks: item.inst_doc_verify_remarks || item.doc_verify_remarks || item.verify_remarks || '—',
        };
      };

      const combined: JammuRescoVerifyDocumentItem[] = [
        ...(resp.verification || []).map((x: any) => mapDocItem(x, 1)),
        ...(resp.verified || []).map((x: any) => mapDocItem(x, 2)),
      ];
      setItems(combined);
    } catch (err: any) {
      console.error('Failed to load live Jammu RESCO document verification data:', err);
      setItems([]);
=======
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

export const VerifyRescoDocument: React.FC = () => {
  const [sites, setSites] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [docFilter, setDocFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Review Audit Modal State
  const [auditModalItem, setAuditModalItem] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [docStatusVal, setDocStatusVal] = useState<string>('2');
  const [docRemarksVal, setDocRemarksVal] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState<boolean>(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Installed Sites with documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getViewInstalledSites();
      setSites(res.sites || []);
    } catch (err: any) {
      console.error('[Admin Verify Document] load error:', err);
      setSites([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load document records.' });
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    loadData();
  }, [loadData]);

  // Distinct districts
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      const d = String(r.district || '').trim();
      if (d && d !== '—') set.add(d);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter based on bifurcation tabs and search
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'pending') {
      result = result.filter((s) => s.verifyStatus === 'Pending');
    } else if (activeTab === 'processed') {
      result = result.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected');
    }

    if (districtFilter !== 'all') {
      result = result.filter((s) => s.district.toLowerCase() === districtFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.applicantName.toLowerCase().includes(q) ||
          s.siteName.toLowerCase().includes(q) ||
          s.vendorName.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.block.toLowerCase().includes(q) ||
          s.village.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    return result;
  }, [items, activeTab, districtFilter, search]);

  const pagination = usePagination(filteredItems, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, districtFilter, search]);

  // Export columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'State', accessor: 'state' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Village', accessor: 'village' },
    { header: 'Site / Applicant Name', accessor: 'applicantName' },
    { header: 'Document File', accessor: 'documentFile' },
    { header: 'Submit Date', accessor: 'submitDate' },
    { header: 'Remarks', accessor: 'remarks' },
    { header: 'Verify Status', accessor: 'verifyStatus' },
    { header: 'Verify Remarks', accessor: 'verifyRemarks' },
  ];

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
=======
    loadDocuments();
  }, [loadDocuments]);

  // Unique Districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    sites.forEach((r) => {
      if (r.district) s.add(r.district);
    });
    return Array.from(s).sort();
  }, [sites]);

  // Metrics
  const totalSites = sites.length;
  const approvedDocs = useMemo(
    () => sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 2).length,
    [sites]
  );
  const rejectedDocs = useMemo(
    () => sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 3).length,
    [sites]
  );
  const pendingDocs = Math.max(0, totalSites - approvedDocs - rejectedDocs);

  // Filtered
  const filtered = useMemo(() => {
    return sites.filter((r) => {
      if (districtFilter !== 'all' && r.district !== districtFilter) return false;

      const dStatus = Number(r.inst_doc_status ?? r.document_status ?? 0);
      if (docFilter === 'complete' && dStatus !== 2) return false;
      if (docFilter === 'rejected' && dStatus !== 3) return false;
      if (docFilter === 'pending' && (dStatus === 2 || dStatus === 3)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sName = String(r.site_name || '').toLowerCase();
        const d = String(r.district || '').toLowerCase();
        const cp = String(r.contact_person || '').toLowerCase();
        const ca = String(r.ca_no || '').toLowerCase();
        const rem = String(r.inst_doc_remarks || r.doc_remarks || '').toLowerCase();
        if (!sName.includes(q) && !d.includes(q) && !cp.includes(q) && !ca.includes(q) && !rem.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sites, districtFilter, docFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filtered,
    initialPageSize: 10,
  });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, docFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || docFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setDocFilter('all');
    setPage(1);
  };

  // Save Document Audit Decision
  const handleSaveDocAudit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auditModalItem) return;
    setSavingAudit(true);
    try {
      const fd = new FormData();
      fd.append('id', String(auditModalItem.id));
      fd.append('inst_doc_status', docStatusVal);
      fd.append('inst_doc_remarks', docRemarksVal);

      await jammuRescoService.updateInstallation(auditModalItem.id, fd);

      setToastMsg({
        type: 'success',
        text: `Document audit updated to ${docStatusVal === '2' ? 'Complete' : 'Rejected'} successfully!`,
      });

      // Update state optimistically
      setSites((prev) =>
        prev.map((s) =>
          s.id === auditModalItem.id
            ? { ...s, inst_doc_status: Number(docStatusVal), inst_doc_remarks: docRemarksVal }
            : s
        )
      );
      setAuditModalItem(null);
    } catch (err: any) {
      console.error('[Admin Verify Document] audit error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update document audit.' });
    } finally {
      setSavingAudit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Installation Date', accessor: (r) => txt(r, 'inst_date') || txt(r, 'created_at') },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Consumer CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Document Status', accessor: (r) => (Number(r.inst_doc_status ?? r.document_status) === 2 ? 'Complete' : Number(r.inst_doc_status ?? r.document_status) === 3 ? 'Reject' : 'Pending') },
      { header: 'Document Remarks', accessor: (r) => r.inst_doc_remarks || r.doc_remarks || DASH },
      { header: 'Verify Status', accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Complete' : 'Pending') },
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
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

<<<<<<< HEAD
  const copyToClipboard = async () => {
    if (!filteredItems.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!filteredItems.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_RESCO_Doc_Verify_${activeTab}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredItems.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((row) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_RESCO_Doc_Verify_${activeTab}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredItems.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu RESCO Verify Documents</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu RESCO Document Verification</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
=======
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
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    w.document.close();
    w.focus();
  };

<<<<<<< HEAD
  // Submit document audit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForAction) return;

    if (!actionStatus) {
      alert('Please select status.');
      return;
    }

    setSubmittingAction(true);
    try {
      const targetStatus = Number(actionStatus); // 2 = Approved, 3 = Rejected
      const res = await jammuRescoAdminService.verifyInstallationDocument({
        id: selectedDocForAction.id,
        status: targetStatus,
        remarks: actionRemarks,
      });

      if (res.success || res.status) {
        const newStatusLabel: 'Pending' | 'Approved' | 'Rejected' =
          targetStatus === 2 ? 'Approved' : 'Rejected';

        setItems((prev) =>
          prev.map((s) =>
            s.id === selectedDocForAction.id
              ? {
                  ...s,
                  rawStatus: targetStatus,
                  verifyStatus: newStatusLabel,
                  verifyRemarks: actionRemarks || s.verifyRemarks,
                }
              : s
          )
        );

        setStats((prev) => ({
          ...prev,
          doc_pending: Math.max(0, (prev.doc_pending || 0) - 1),
          doc_approved: targetStatus === 2 ? (prev.doc_approved || 0) + 1 : prev.doc_approved,
          doc_reject: targetStatus === 3 ? (prev.doc_reject || 0) + 1 : prev.doc_reject,
        }));

        setSelectedDocForAction(null);
        setActionStatus('2');
        setActionRemarks('');
        alert(res.message || 'Document verification status updated successfully.');
      } else {
        alert(res.message || 'Failed to update document status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating document status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const pendingCount = items.filter((s) => s.verifyStatus === 'Pending').length;
  const processedCount = items.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected').length;

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu RESCO Installation - Verify Documents"
        subtitle="Verification and audit desk for beneficiary handover certificates (HOC), Joint Commissioning Reports (JCR), and installation documents in Jammu"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: 'Verify Documents' },
        ]}
      />

      {/* ── Top 5 KPI Metric Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
          }
          tone="accent"
          label="Total Sites"
          value={stats.total || items.length}
          sub={`${stats.assigned} Assigned · ${stats.not_assigned} Unassigned`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={`${stats.complete} / ${stats.pending}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Doc Pending"
          value={stats.doc_pending || pendingCount}
          sub="HOC under audit review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Document Approved"
          value={stats.doc_approved}
          sub="Handover accepted"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
=======
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
        title="Jammu RESCO - Verify Documents"
        subtitle="Review and verify CEIG inspection clearance, net-metering synchronization certificates, and plant commissioning documents"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Verify Documents' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Installation
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/view-claim" className="ax-btn ax-btn--primary ax-btn--sm">
              View Claims
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
          tone="accent"
          label="Total Plant Documents"
          value={totalSites.toLocaleString('en-IN')}
          sub="Installed site records"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Documents Approved"
          value={approvedDocs.toLocaleString('en-IN')}
          sub="CEIG & sync authorized"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Review"
          value={pendingDocs.toLocaleString('en-IN')}
          sub="Awaiting document audit"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Documents Rejected"
          value={rejectedDocs.toLocaleString('en-IN')}
          sub="Requires resubmission"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
<<<<<<< HEAD
          tone="violet"
          label="Document Rejected"
          value={stats.doc_reject}
          sub="Signoff papers rejected"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Documents
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {stats.doc_pending || pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processed')}
          className={`asw-pill-btn ${activeTab === 'processed' ? 'active' : ''}`}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'processed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(stats.doc_approved + stats.doc_reject) || processedCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'all'
                ? 'All Jammu RESCO Installation Documents'
                : activeTab === 'pending'
                ? 'Jammu RESCO Installation Documents Pending Verification'
                : 'Jammu RESCO Verified Installation Documents Register'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredItems.length} document record{filteredItems.length === 1 ? '' : 's'} across Jammu
=======
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Verify Resco Document Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Commissioning Document Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> site records
              {' '}· Approved <b className="ax-num">{approvedDocs}</b> · Pending <b className="ax-num">{pendingDocs}</b>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </p>
          </div>

          <div className="ax-card__actions">
<<<<<<< HEAD
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtOptions.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-form-control"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', height: 32 }}
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
=======
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

<<<<<<< HEAD
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
=======
              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                aria-label="Filter by doc status"
              >
                <option value="all">All Document Status</option>
                <option value="complete">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                >
                  Reset
                </button>
              )}
<<<<<<< HEAD
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, applicant, district..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={copyToClipboard}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
=======

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, CA no, remarks…"
                size="sm"
                ariaLabel="Search documents"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Document_Verification')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Document_Verification')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Document Verification Register')}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              />
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* ── Horizontally Scrollable Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: activeTab === 'pending' ? 1400 : 1550 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Site / Applicant Name</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' ? (
                  <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Action</th>
                ) : (
                  <th className="ax-table__th">Verify Remarks</th>
                )}
=======
        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Installation Date</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Consumer CA No.</th>
                <th className="ax-table__th" scope="col">Contact Person</th>
                <th className="ax-table__th" scope="col">Contact Number</th>
                <th className="ax-table__th" scope="col">Document Status</th>
                <th className="ax-table__th" scope="col">Document File</th>
                <th className="ax-table__th" scope="col">Document Remarks</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading commissioning documents from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No document records found"
                      message={hasFilters ? 'No sites match your current filters.' : 'No commissioning documents found.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const instDate = txt(row, 'inst_date') || txt(row, 'created_at') || DASH;
                  const docUrl = row.inst_doc_file ? resolveJammuMediaUrl(row.inst_doc_file) : null;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{instDate}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || `Site #${row.site_id || row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td">{row.contact_person || DASH}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.contact_number || DASH}</td>

                      {/* Document Status */}
                      <td className="ax-table__td">
                        <DocBadge status={row.inst_doc_status ?? row.document_status} />
                      </td>

                      {/* Document File Link */}
                      <td className="ax-table__td">
                        {docUrl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => openPreview(docUrl, `Document: ${row.site_name || row.id}`)}
                              style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                            >
                              Preview Doc
                            </button>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ height: 26, padding: '0 6px', fontSize: 11 }}
                              title="Open in new window"
                            >
                              ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>No Document</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.inst_doc_remarks || row.doc_remarks || DASH}
                      </td>

                      <td className="ax-table__td">
                        <VerifyBadge status={row.inst_verify_status ?? row.verify_status} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => {
                            setAuditModalItem(row);
                            setDocStatusVal(String(row.inst_doc_status ?? '2'));
                            setDocRemarksVal(row.inst_doc_remarks || '');
                          }}
                          style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                        >
                          Review Doc
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

      {/* ── Review Document Audit Modal ── */}
      {auditModalItem && (
        <Modal open onClose={() => setAuditModalItem(null)} labelledBy="audit-doc-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSaveDocAudit}>
            <div className="ax-modal__header">
              <div>
                <h3 id="audit-doc-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Audit Commissioning Document
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{auditModalItem.site_name}</b> · District: <b>{auditModalItem.district}</b> · CA No: <b>{auditModalItem.ca_no || DASH}</b>
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setAuditModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {auditModalItem.inst_doc_file && (
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Attached File</span>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{auditModalItem.inst_doc_file.split('/').pop()}</span>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={() => openPreview(resolveJammuMediaUrl(auditModalItem.inst_doc_file!)!, `Document: ${auditModalItem.site_name}`)}
                      style={{ height: 26, fontSize: 11 }}
                    >
                      Inspect File
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Document Audit Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={docStatusVal}
                  onChange={(e) => setDocStatusVal(e.target.value)}
                  required
                >
                  <option value="2">Approve Document (Complete & Valid)</option>
                  <option value="3">Reject Document (Discrepancy / Resubmission Required)</option>
                  <option value="1">Keep Under Review / Pending</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Audit Remarks / Findings
                </label>
                <textarea
                  className="ax-input"
                  rows={4}
                  style={{ width: '100%', height: 'auto', padding: '10px 12px' }}
                  value={docRemarksVal}
                  onChange={(e) => setDocRemarksVal(e.target.value)}
                  placeholder="Enter certificate validity, CEIG inspector notes, or reason for rejection…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setAuditModalItem(null)}
                disabled={savingAudit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingAudit}
              >
                {savingAudit ? 'Saving Audit…' : 'Save Document Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Document Lightbox Preview Modal ── */}
      {preview && (
        <DocPreviewModal
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

export function VerifyRescoDocument() {
  const [pendingList, setPendingList] = useState<RescoVerifyDocItem[]>([]);
  const [approvedRejectedList, setApprovedRejectedList] = useState<RescoVerifyDocItem[]>([]);
  const [stats, setStats] = useState({
    total: 21,
    assigned: 5,
    not_assigned: 13,
    installed_complete: 4,
    installed_pending: 1,
    doc_complete: 2,
    doc_pending: 1,
    doc_reject: 0,
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Action popup states
  const [selectedDocForAction, setSelectedDocForAction] = useState<RescoVerifyDocItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoAdminService.getVerifyDocument();
      setPendingList(data.pending);
      setApprovedRejectedList(data.approved_rejected);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load verify document data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = activeTab === 'pending' ? pendingList : approvedRejectedList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(
      (d) =>
        d.vendor_name.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.site_name.toLowerCase().includes(q) ||
        d.contact_person.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 10 });

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForAction) return;

    setSubmittingAction(true);
    try {
      const st = parseInt(actionStatus, 10);
      const updated: RescoVerifyDocItem = {
        ...selectedDocForAction,
        verify_status: st as 1 | 2 | 0,
        verify_remarks: actionRemarks,
      };

      if (st === 1 || st === 2) {
        setPendingList((prev) => prev.filter((p) => p.id !== selectedDocForAction.id));
        setApprovedRejectedList((prev) => [updated, ...prev.filter((p) => p.id !== selectedDocForAction.id)]);
      } else {
        setApprovedRejectedList((prev) => prev.filter((p) => p.id !== selectedDocForAction.id));
        setPendingList((prev) => [updated, ...prev.filter((p) => p.id !== selectedDocForAction.id)]);
      }

      setSelectedDocForAction(null);
      setActionRemarks('');
    } catch (e) {
      console.error('Submit verify document failed:', e);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="Welcome to, Verify Resco Document"
        subtitle="Verification desk for commissioned site compliance documents, CEIG clearance certificates, DISCOM net-metering letters, and JMR records."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'Verify Resco Document' },
        ]}
      />

      {/* Top 3 Metric Cards exactly matching user's summary format */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total / Assigned / Not Assigned"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span>{stats.total}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#16a34a' }}>{stats.assigned}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.not_assigned}</span>
            </div>
          }
          sub={`Total Sites: ${stats.total} • Assigned: ${stats.assigned} • Not Assigned: ${stats.not_assigned}`}
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          tone="emerald"
          label="Installation Status"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#16a34a' }}>{stats.installed_complete}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.installed_pending}</span>
            </div>
          }
          sub={`Complete: ${stats.installed_complete} • Pending: ${stats.installed_pending}`}
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          tone="cyan"
          label="Document Verify Status"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#16a34a' }}>{stats.doc_complete}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.doc_pending}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#dc2626' }}>{stats.doc_reject}</span>
            </div>
          }
          sub={`Approved: ${stats.doc_complete} • Pending: ${stats.doc_pending} • Reject: ${stats.doc_reject}`}
        />
      </div>

      {/* Report Wise Bifurcation Pills */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {approvedRejectedList.length}
          </span>
        </button>
      </div>

      {/* Main Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Jammu RESCO Compliance Documents Pending Verification' : 'Jammu RESCO Approved / Rejected Documents'}
            </h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} site compliance submission{filteredList.length === 1 ? '' : 's'}</p>
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
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, site, district..." size="sm" />
              <TableExportToolbar onCopy={() => {}} onExportCSV={() => {}} onExportExcel={() => {}} onExportPDF={() => {}} />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan={12} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading document verification records...</span>
                    </div>
                  </td>
=======
                  <td colSpan={12} style={centerCell}>Loading compliance documents...</td>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
<<<<<<< HEAD
                    <TableEmptyState
                      title="No Document Records Found"
                      description={`No records found under "${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected Data'}" matching your criteria.`}
                    />
=======
                    <TableEmptyState title="No document records found" description="No files match current filter" />
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
<<<<<<< HEAD
                  const serialNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.state}
                      </td>

                      {/* 3. Vendor Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendorName}</div>
                      </td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 5. Block */}
                      <td className="ax-table__td">{row.block}</td>

                      {/* 6. Village */}
                      <td className="ax-table__td">{row.village}</td>

                      {/* 7. Site / Applicant Name */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.applicantName}
                      </td>

                      {/* 8. Document File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.documentFile ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(row.documentFile) ? (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl({ url: row.documentFile!, title: `Document - ${row.applicantName}` })}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title="Click to preview Document image"
                              >
                                <img
                                  src={row.documentFile}
                                  alt="Document"
                                  style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                />
                              </button>
                            ) : (
                              <a
                                href={row.documentFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#eff4fc',
                                  color: '#2559bf',
                                  textDecoration: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #bfd3f8',
                                }}
                                title="Open / Download Document"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View File</span>
                              </a>
                            )}
                          </div>
=======
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{row.vendor_name}</td>
                      <td className="ax-table__td">JAMMU &amp; KASHMIR</td>
                      <td className="ax-table__td">{row.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#2559bf' }}>{row.site_name}</td>
                      <td className="ax-table__td">{row.contact_person}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', color: '#2559bf' }}>{row.contact_number}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.document_file ? (
                          <a
                            href={resolveJammuMediaUrl(row.document_file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2559bf', fontWeight: 600 }}
                          >
                            📄 View File
                          </a>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

<<<<<<< HEAD
                      {/* 9. Submit Date */}
                      <td className="ax-table__td">{row.submitDate}</td>

                      {/* 10. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remarks}>
                          {row.remarks}
                        </div>
                      </td>

                      {/* 11. Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              row.verifyStatus === 'Approved'
                                ? '#ecfdf5'
                                : row.verifyStatus === 'Rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              row.verifyStatus === 'Approved'
                                ? '#059669'
                                : row.verifyStatus === 'Rejected'
                                ? '#dc2626'
                                : '#d97706',
                            border: `1px solid ${
                              row.verifyStatus === 'Approved'
                                ? '#a7f3d0'
                                : row.verifyStatus === 'Rejected'
                                ? '#fecaca'
                                : '#fde68a'
                            }`,
                          }}
                        >
                          {row.verifyStatus}
                        </span>
                      </td>

                      {/* 12. If Pending: Action column */}
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForAction(row);
                              setActionStatus('2');
                              setActionRemarks(row.verifyRemarks !== '—' ? row.verifyRemarks : '');
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#2559bf',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Verify
                          </button>
                        </td>
                      )}

                      {/* 12. If Approved/Rejected: Verify Remarks */}
                      {activeTab === 'processed' && (
                        <td className="ax-table__td" style={{ maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                            {row.verifyRemarks}
                          </div>
                        </td>
                      )}
=======
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.submit_date}</td>
                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 180, whiteSpace: 'normal' }}>
                        {row.remarks || '—'}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            row.verify_status === 1
                              ? 'ax-badge--success'
                              : row.verify_status === 2
                              ? 'ax-badge--danger'
                              : 'ax-badge--warning'
                          }`}
                          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {row.verify_status === 1 ? 'Approved' : row.verify_status === 2 ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocForAction(row);
                            setActionStatus(String(row.verify_status || '1'));
                            setActionRemarks(row.verify_remarks || '');
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
                          Verify
                        </button>
                      </td>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

<<<<<<< HEAD
        {/* ── Table Footer with Pagination ── */}
=======
        {/* Footer Pagination */}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
<<<<<<< HEAD
              pageSizeOptions={[10, 25, 50, 100, 200]}
=======
              pageSizeOptions={[10, 25, 50, 100]}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            />
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* ── Document Verification Modal (Only from Pending tab) ── */}
      <Modal
        open={Boolean(selectedDocForAction)}
        onClose={() => {
          if (!submittingAction) {
            setSelectedDocForAction(null);
            setActionStatus('2');
            setActionRemarks('');
          }
        }}
        title="Verify Document"
        subtitle={selectedDocForAction ? `Site: ${selectedDocForAction.applicantName} (${selectedDocForAction.district})` : undefined}
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedDocForAction?.documentFile && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(selectedDocForAction.documentFile) ? (
                  <img
                    src={selectedDocForAction.documentFile}
                    alt="Document"
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                  />
                ) : (
                  <span style={{ fontSize: 24 }}>📄</span>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Submitted Document</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Date: {selectedDocForAction.submitDate}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setLightboxUrl({ url: selectedDocForAction.documentFile!, title: `Document - ${selectedDocForAction.applicantName}` })}
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ fontSize: 12 }}
                >
                  Preview
                </button>
                <a
                  href={selectedDocForAction.documentFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  style={{ fontSize: 12 }}
                >
                  Open ↗
                </a>
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Status <span style={{ color: '#dc2626' }}>*</span>
=======
      {/* Verify Document Action Modal */}
      <Modal
        open={Boolean(selectedDocForAction)}
        onClose={() => setSelectedDocForAction(null)}
        title="Verify RESCO Document Status"
        subtitle={selectedDocForAction ? `${selectedDocForAction.site_name} (${selectedDocForAction.vendor_name})` : ''}
        maxWidth={500}
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedDocForAction(null)} disabled={submittingAction}>
              Cancel
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={handleActionSubmit} disabled={submittingAction}>
              {submittingAction ? 'Updating...' : 'Submit Verification'}
            </button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
<<<<<<< HEAD
              required
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="2">Approved</option>
              <option value="3">Rejected</option>
=======
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              required
            >
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="0">Pending</option>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </select>
          </div>

          <div>
<<<<<<< HEAD
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Remark
=======
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Audit Remarks
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
<<<<<<< HEAD
              placeholder="Enter document verification remarks..."
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setSelectedDocForAction(null);
                setActionStatus('2');
                setActionRemarks('');
              }}
              className="ax-btn ax-btn--secondary"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                borderRadius: 8,
                background: '#2559bf',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: submittingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {submittingAction ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Media Lightbox Modal ── */}
      {lightboxUrl && (
        <LightboxModal
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          url={lightboxUrl.url}
          title={lightboxUrl.title}
        />
      )}
=======
              placeholder="Enter document verification remarks or missing certificate notes..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    </div>
  );
}

export default VerifyRescoDocument;
