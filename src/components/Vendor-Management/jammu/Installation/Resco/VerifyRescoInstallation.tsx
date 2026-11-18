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
  jammuRescoAdminService,
  resolveJammuMediaUrl,
  type RescoVerifySiteItem,
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
import RescoInstallationDetails from '../../../../V-Portal/jammu/Installation/Resco/RescoInstallationDetails';

/**
 * Super Admin - Verify Jammu RESCO Installation Desk
 * Review completed installations, BOS materials, electrical checks, and approve/reject verification
 */
export const VerifyRescoInstallation: React.FC = () => {
  return <RescoInstallationDetails />;
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
  type JammuRescoInstallDetailSummary,
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

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved' || r === 'complete') return <Badge tone="success">Complete</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Reject</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Complete</Badge>;
  if (s === 3) return <Badge tone="danger">Reject</Badge>;
  if (s === 1) return <Badge tone="info">Pending</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Shell Component ───────── */
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
    <Modal open onClose={onClose} labelledBy="preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Media Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Preview'}
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

/* ── Interactive Image Thumbnail ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 34,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getJammuMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview"
    />
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

const RESCO_COLUMNS = [
  'Sr. No.',
  'Installation Date',
  'State',
  'District',
  'Site Name',
  'Contact Person',
  'Contact Number',
  'Solar Meter No.',
  'Inverter No.',
  'Net/Smart Meter No.',
  'Loger No.',
  'System Image',
  'Inverter Image',
  'Panel Image',
  'Net Meter Image',
  'Loger Image',
  'Latitude',
  'Longitude',
  'Remark',
  'Verify Status',
  'Verify Remarks',
  'Document Status',
  'Document File',
  'Document Remarks',
  'Action',
];

export const VerifyRescoInstallation: React.FC = () => {
  const [sites, setSites] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [summary, setSummary] = useState<JammuRescoInstallDetailSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [verifyFilter, setVerifyFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Verification Audit Modal State
  const [verifyModalItem, setVerifyModalItem] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [verifyStatusVal, setVerifyStatusVal] = useState<string>('1');
  const [verifyRemarksVal, setVerifyRemarksVal] = useState<string>('');
  const [savingVerify, setSavingVerify] = useState<boolean>(false);

  // Document Upload Modal State
  const [docModalItem, setDocModalItem] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docRemarks, setDocRemarks] = useState<string>('');
  const [savingDoc, setSavingDoc] = useState<boolean>(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Installed Sites from API
  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getViewInstalledSites();
      setSites(res.sites || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      console.error('[Admin Verify Installation] load error:', err);
      setSites([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Unique Districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    sites.forEach((r) => {
      if (r.district) s.add(r.district);
    });
    return Array.from(s).sort();
  }, [sites]);

  // KPI Metrics
  const totalInstalled = summary?.inst_complete ?? sites.length;
  const verifyApproved = useMemo(
    () => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length,
    [sites]
  );
  const verifyRejected = useMemo(
    () => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length,
    [sites]
  );
  const verifyPending = Math.max(0, sites.length - verifyApproved - verifyRejected);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((r) => {
      if (districtFilter !== 'all' && r.district !== districtFilter) return false;

      const vStatus = Number(r.inst_verify_status ?? r.verify_status ?? 0);
      if (verifyFilter === 'approved' && vStatus !== 1) return false;
      if (verifyFilter === 'rejected' && vStatus !== 2) return false;
      if (verifyFilter === 'pending' && (vStatus === 1 || vStatus === 2)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sName = String(r.site_name || '').toLowerCase();
        const d = String(r.district || '').toLowerCase();
        const cp = String(r.contact_person || '').toLowerCase();
        const inv = String(r.inverter_no || '').toLowerCase();
        const sm = String(r.solarmeter_no || '').toLowerCase();
        if (!sName.includes(q) && !d.includes(q) && !cp.includes(q) && !inv.includes(q) && !sm.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sites, districtFilter, verifyFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filteredSites,
    initialPageSize: 10,
  });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, verifyFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || verifyFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    setPage(1);
  };

  // Handle Save Verification Audit
  const handleSaveVerification = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyModalItem) return;
    setSavingVerify(true);
    try {
      const fd = new FormData();
      fd.append('id', String(verifyModalItem.id));
      fd.append('inst_verify_status', verifyStatusVal);
      fd.append('inst_verify_remarks', verifyRemarksVal);

      await jammuRescoService.updateInstallation(verifyModalItem.id, fd);

      setToastMsg({
        type: 'success',
        text: `Site verification updated to ${verifyStatusVal === '1' ? 'Complete' : 'Rejected'}!`,
      });

      // Update local state optimistically
      setSites((prev) =>
        prev.map((s) =>
          s.id === verifyModalItem.id
            ? { ...s, inst_verify_status: Number(verifyStatusVal), inst_verify_remarks: verifyRemarksVal }
            : s
        )
      );
      setVerifyModalItem(null);
    } catch (err: any) {
      console.error('[Admin Verify Installation] verification error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update verification audit.' });
    } finally {
      setSavingVerify(false);
    }
  };

  // Handle Submit Document
  const handleSaveDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalItem || !docFile) return;
    setSavingDoc(true);
    try {
      const fd = new FormData();
      fd.append('id', String(docModalItem.id));
      fd.append('site_id', String(docModalItem.id));
      fd.append('inst_doc_file', docFile);
      fd.append('inst_doc_remarks', docRemarks);

      await jammuRescoService.submitInstallationDocument(fd);

      setToastMsg({
        type: 'success',
        text: 'Installation document submitted successfully!',
      });

      setDocModalItem(null);
      setDocFile(null);
      setDocRemarks('');
      loadSites();
    } catch (err: any) {
      console.error('[Admin Verify Installation] doc error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to submit document.' });
    } finally {
      setSavingDoc(false);
    }
  };

  // Export columns
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Installation Date', accessor: (r) => txt(r, 'inst_date') || txt(r, 'created_at') },
      { header: 'State', accessor: (r) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => r.inst_latitude || r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.inst_longitude || r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.inst_remarks || r.remark || DASH },
      { header: 'Verify Status', accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Complete' : Number(r.inst_verify_status ?? r.verify_status) === 2 ? 'Reject' : 'Pending') },
      { header: 'Verify Remarks', accessor: (r) => r.inst_verify_remarks || r.verify_remarks || DASH },
      { header: 'Document Status', accessor: (r) => (Number(r.inst_doc_status ?? r.document_status) === 2 ? 'Complete' : Number(r.inst_doc_status ?? r.document_status) === 3 ? 'Reject' : 'Pending') },
      { header: 'Document Remarks', accessor: (r) => r.inst_doc_remarks || r.doc_remarks || DASH },
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
        title="Jammu RESCO - Verify Installation"
        subtitle="Review completed rooftop solar installations, BOS materials, electrical checks, and approve/reject verification"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Verify Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/verify-document" className="ax-btn ax-btn--primary ax-btn--sm">
              Verify Documents
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
          label="Total Installed Sites"
          value={totalInstalled.toLocaleString('en-IN')}
          sub="Sites executed in field"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Verification Complete"
          value={verifyApproved.toLocaleString('en-IN')}
          sub="Audited & authorized"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Verification Pending"
          value={verifyPending.toLocaleString('en-IN')}
          sub="Awaiting QA audit"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Verification Rejected"
          value={verifyRejected.toLocaleString('en-IN')}
          sub="Flagged for rework"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Verify Resco Installation Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Installation Verification Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> installations
              {' '}· Complete <b className="ax-num">{verifyApproved}</b> · Pending <b className="ax-num">{verifyPending}</b>
            </p>
          </div>

          <div className="ax-card__actions">
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
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Verify Status</option>
                <option value="approved">Complete</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, inverter, serial…"
                size="sm"
                ariaLabel="Search installations"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportToCSV(filteredSites, exportCols, 'Jammu_RESCO_Installation_Verification')}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, 'Jammu_RESCO_Installation_Verification')}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, 'Jammu RESCO Installation Verification Report')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                {RESCO_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="ax-table__th"
                    scope="col"
                    style={col === 'Action' ? { textAlign: 'center' } : undefined}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={RESCO_COLUMNS.length} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation verification records…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={RESCO_COLUMNS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No installation records found"
                      message={hasFilters ? 'No sites match your filters. Try clearing your search.' : 'No site installations recorded yet.'}
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
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || `Site #${row.site_id || row.id}`}
                      </td>
                      <td className="ax-table__td">{row.contact_person || DASH}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.contact_number || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.solarmeter_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.inverter_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.nm_sm_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.loger_no || DASH}
                      </td>

                      {/* Evidence Photo Thumbnails */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.system_image}
                          alt={`System: ${row.site_name || row.id}`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.inverter_image}
                          alt={`Inverter: ${row.site_name || row.id}`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.panel_image}
                          alt={`Panel: ${row.site_name || row.id}`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.nmsm_image}
                          alt={`Net Meter: ${row.site_name || row.id}`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.loger_image}
                          alt={`Logger: ${row.site_name || row.id}`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td" style={{ fontSize: 11 }}>{row.inst_latitude || row.latitude || DASH}</td>
                      <td className="ax-table__td" style={{ fontSize: 11 }}>{row.inst_longitude || row.longitude || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.inst_remarks || row.remark || DASH}
                      </td>

                      {/* Verify Status & Remarks */}
                      <td className="ax-table__td">
                        <VerifyBadge value={row.inst_verify_status} raw={row.verify_status} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.inst_verify_remarks || row.verify_remarks || DASH}
                      </td>

                      {/* Document Status & File */}
                      <td className="ax-table__td">
                        <DocBadge status={row.inst_doc_status ?? row.document_status} />
                      </td>
                      <td className="ax-table__td">
                        {docUrl ? (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            View Doc ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.inst_doc_remarks || row.doc_remarks || DASH}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => {
                              setVerifyModalItem(row);
                              setVerifyStatusVal(String(row.inst_verify_status ?? '1'));
                              setVerifyRemarksVal(row.inst_verify_remarks || '');
                            }}
                            style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                          >
                            Audit / Verify
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => {
                              setDocModalItem(row);
                              setDocFile(null);
                              setDocRemarks('');
                            }}
                            style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                          >
                            Upload Doc
                          </button>
                        </div>
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

      {/* ── Verification Audit Modal ── */}
      {verifyModalItem && (
        <Modal open onClose={() => setVerifyModalItem(null)} labelledBy="verify-modal-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSaveVerification}>
            <div className="ax-modal__header">
              <div>
                <h3 id="verify-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Audit Site Installation
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{verifyModalItem.site_name}</b> · District: <b>{verifyModalItem.district}</b> · ID #{verifyModalItem.id}
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setVerifyModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Verification Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={verifyStatusVal}
                  onChange={(e) => setVerifyStatusVal(e.target.value)}
                  required
                >
                  <option value="1">Approve / Complete Installation</option>
                  <option value="2">Reject Installation (Requires Rework)</option>
                  <option value="0">Keep as Pending</option>
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
                  value={verifyRemarksVal}
                  onChange={(e) => setVerifyRemarksVal(e.target.value)}
                  placeholder="Enter audit remarks, quality assessment, or reasons for rejection…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setVerifyModalItem(null)}
                disabled={savingVerify}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingVerify}
              >
                {savingVerify ? 'Saving Decision…' : 'Save Verification Audit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Document Upload Modal ── */}
      {docModalItem && (
        <Modal open onClose={() => setDocModalItem(null)} labelledBy="doc-modal-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSaveDocument}>
            <div className="ax-modal__header">
              <div>
                <h3 id="doc-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Upload Installation Document
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{docModalItem.site_name}</b> · District: <b>{docModalItem.district}</b>
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDocModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Document File (CEIG / Commissioning / Net-Metering Certificate) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  className="ax-input"
                  style={{ height: 42, width: '100%', padding: '6px 10px' }}
                  accept="application/pdf,image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  required
                />
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4, display: 'block' }}>
                  Supported formats: PDF, JPG, PNG (Max 10 MB)
                </span>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Document Remarks
                </label>
                <textarea
                  className="ax-input"
                  rows={3}
                  style={{ width: '100%', height: 'auto', padding: '10px 12px' }}
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  placeholder="Enter certificate reference number, issuing authority, or validity…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDocModalItem(null)}
                disabled={savingDoc}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingDoc || !docFile}
              >
                {savingDoc ? 'Uploading…' : 'Upload Document'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Lightbox Zoom Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
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

export function VerifyRescoInstallation() {
  const [pendingList, setPendingList] = useState<RescoVerifySiteItem[]>([]);
  const [approvedRejectedList, setApprovedRejectedList] = useState<RescoVerifySiteItem[]>([]);
  const [stats, setStats] = useState({
    total: 21,
    assigned: 5,
    not_assigned: 13,
    installed_complete: 4,
    installed_pending: 1,
    verify_complete: 3,
    verify_pending: 1,
    verify_reject: 0,
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<RescoVerifySiteItem | null>(null);
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<RescoVerifySiteItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoAdminService.getVerifyInstallation();
      setPendingList(data.pending);
      setApprovedRejectedList(data.approved_rejected);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load verify installation data:', e);
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
      (s) =>
        s.site_name.toLowerCase().includes(q) ||
        s.uid.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.contact_person.toLowerCase().includes(q) ||
        s.inverter_no.toLowerCase().includes(q) ||
        s.solar_meter_no.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 10 });

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    setSubmittingAction(true);
    try {
      const st = parseInt(actionStatus, 10);
      await jammuRescoAdminService.submitVerifyStatus(selectedSiteForAction.id, st, actionRemarks);

      const updated: RescoVerifySiteItem = {
        ...selectedSiteForAction,
        verify_status: st as 1 | 2 | 0,
        verify_remarks: actionRemarks,
        verify_date: new Date().toISOString().slice(0, 10),
      };

      if (st === 1 || st === 2) {
        setPendingList((prev) => prev.filter((p) => p.id !== selectedSiteForAction.id));
        setApprovedRejectedList((prev) => [updated, ...prev.filter((p) => p.id !== selectedSiteForAction.id)]);
      } else {
        setApprovedRejectedList((prev) => prev.filter((p) => p.id !== selectedSiteForAction.id));
        setPendingList((prev) => [updated, ...prev.filter((p) => p.id !== selectedSiteForAction.id)]);
      }

      setSelectedSiteForAction(null);
      setActionRemarks('');
    } catch (e) {
      console.error('Submit verify action failed:', e);
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
        title="Welcome to, Verify Jammu Resco Installation"
        subtitle="Verification desk for commissioned rooftop solar installations, CEIG electrical clearances, solar meter telemetry, and grid sync proof."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'Verify Jammu Resco Installation' },
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Verify Status"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#16a34a' }}>{stats.verify_complete}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.verify_pending}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#dc2626' }}>{stats.verify_reject}</span>
            </div>
          }
          sub={`Complete: ${stats.verify_complete} • Pending: ${stats.verify_pending} • Reject: ${stats.verify_reject}`}
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
              {activeTab === 'pending' ? 'Jammu RESCO Verification Pending Sites' : 'Jammu RESCO Approved / Rejected Sites'}
            </h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} site installations with proof images</p>
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
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search site, UID, meter..." size="sm" />
              <TableExportToolbar onCopy={() => {}} onExportCSV={() => {}} onExportExcel={() => {}} onExportPDF={() => {}} />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Installation Date</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Loger No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Net Meter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Installation Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={25} style={centerCell}>Loading installations...</td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={25} style={centerCell}>
                    <TableEmptyState title="No installation records found" description="No sites match current filter" />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.installation_date}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf' }}>
                        {row.uid}
                      </td>
                      <td className="ax-table__td">JAMMU &amp; KASHMIR</td>
                      <td className="ax-table__td">{row.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{row.site_name}</td>
                      <td className="ax-table__td">{row.contact_person}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', color: '#2559bf' }}>{row.contact_number}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.solar_meter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.inverter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.net_smart_meter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.loger_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.panel_no}</td>

                      {/* Evidence Images */}
                      {[
                        { img: row.system_image, label: 'System' },
                        { img: row.inverter_image, label: 'Inverter' },
                        { img: row.panel_image, label: 'Panel' },
                        { img: row.net_meter_image, label: 'Net Meter' },
                        { img: row.loger_image, label: 'Loger' },
                      ].map((thumb, ti) => (
                        <td key={ti} className="ax-table__td" style={{ textAlign: 'center' }}>
                          {thumb.img ? (
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(resolveJammuMediaUrl(thumb.img))}
                              style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: 2, background: '#fff', cursor: 'pointer' }}
                            >
                              <img src={resolveJammuMediaUrl(thumb.img)} alt={thumb.label} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 2 }} />
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      ))}

                      <td className="ax-table__td" style={{ fontSize: 11, fontFamily: 'monospace' }}>{row.latitude}</td>
                      <td className="ax-table__td" style={{ fontSize: 11, fontFamily: 'monospace' }}>{row.longitude}</td>
                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 160, whiteSpace: 'normal' }}>{row.remark}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 6px', fontSize: 11 }}>
                          {row.installation_status}
                        </span>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '2px 6px', fontSize: 11 }}>
                          {row.panel_status}
                        </span>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              lineHeight: 1.2,
                              height: 'auto',
                              minHeight: 'unset',
                            }}
                            title="View full site details"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteForAction(row);
                              setActionStatus(String(row.verify_status || '1'));
                              setActionRemarks(row.verify_remarks || '');
                            }}
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{
                              padding: '4px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              lineHeight: 1.2,
                              height: 'auto',
                              minHeight: 'unset',
                            }}
                          >
                            Verify
                          </button>
                        </div>
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

      {/* Full Details Modal */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Jammu RESCO Commissioning Details"
        subtitle={selectedSiteForDetails ? `${selectedSiteForDetails.site_name} (${selectedSiteForDetails.uid})` : ''}
        maxWidth={780}
        footer={
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedSiteForDetails(null)}>
            Close
          </button>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
              <div><span style={{ color: '#64748b' }}>Solar Meter:</span> <strong>{selectedSiteForDetails.solar_meter_no}</strong></div>
              <div><span style={{ color: '#64748b' }}>Inverter:</span> <strong>{selectedSiteForDetails.inverter_no}</strong></div>
              <div><span style={{ color: '#64748b' }}>Net Meter:</span> <strong>{selectedSiteForDetails.net_smart_meter_no}</strong></div>
              <div><span style={{ color: '#64748b' }}>RMS Logger:</span> <strong>{selectedSiteForDetails.loger_no}</strong></div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2559bf', marginBottom: 10 }}>Site Contacts &amp; Location</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Contact Person:</span> <span>{selectedSiteForDetails.contact_person}</span>
                <span style={{ color: '#64748b' }}>Phone Number:</span> <span style={{ fontFamily: 'monospace', color: '#2559bf' }}>{selectedSiteForDetails.contact_number}</span>
                <span style={{ color: '#64748b' }}>Coordinates:</span> <span>{selectedSiteForDetails.latitude}, {selectedSiteForDetails.longitude}</span>
                <span style={{ color: '#64748b' }}>Remarks:</span> <span>{selectedSiteForDetails.remark}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Verify Action Modal */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => setSelectedSiteForAction(null)}
        title="Verify RESCO Installation Status"
        subtitle={selectedSiteForAction ? `${selectedSiteForAction.site_name} (${selectedSiteForAction.uid})` : ''}
        maxWidth={500}
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedSiteForAction(null)} disabled={submittingAction}>
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
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              required
            >
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Audit Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter electrical inspection or approval notes..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      <Modal open={Boolean(lightboxUrl)} onClose={() => setLightboxUrl(null)} title="Installation Proof Image" maxWidth={720}>
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <img src={lightboxUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifyRescoInstallation;
