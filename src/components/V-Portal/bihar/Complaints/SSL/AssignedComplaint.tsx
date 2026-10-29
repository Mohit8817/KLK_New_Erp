import { useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharComplaintService,
  getMediaUrl,
  type BiharComplaintItem,
  type AssignedComplaintsResponse,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
  Modal,
} from '../../../../../common';

type Row = BiharComplaintItem;
type TabKey = 'open' | 'approved' | 'closed';

interface Toast { id: number; msg: string; }
let TID = 0;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const X = (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* ── Pure White Professional Modal (Fixed, Non-jumping, Scrollable) ── */
  .ax-modal {
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
  .ax-modal__backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: transparent !important;
  }
  .ax-modal__dialog,
  .ax-modal__dialog--lg,
  .ax-modal__dialog--scrollable,
  .ax-modal__dialog--white {
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
  .ax-modal__dialog > form {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }
  .ax-modal__header {
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
  .ax-modal__title {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
  }
  .ax-modal__close {
    width: 32px !important;
    height: 32px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    color: #64748b !important;
    background: #f1f5f9 !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__close:hover {
    color: #0f172a !important;
    background: #e2e8f0 !important;
  }
  .ax-modal__body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    background: #ffffff !important;
    padding: 24px !important;
  }
  .ax-modal__body::-webkit-scrollbar {
    width: 6px;
  }
  .ax-modal__body::-webkit-scrollbar-track {
    background: #ffffff;
  }
  .ax-modal__body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
  }
  .ax-modal__body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .ax-modal__footer {
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
  .ax-modal__footer .ax-btn--ghost,
  .ax-modal__footer .ax-btn--secondary {
    background: #f1f5f9 !important;
    color: #334155 !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    padding: 8px 18px !important;
    border-radius: 8px !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__footer .ax-btn--ghost:hover,
  .ax-modal__footer .ax-btn--secondary:hover {
    background: #e2e8f0 !important;
    color: #0f172a !important;
  }
  .ax-modal__footer .ax-btn--primary {
    background: #2563eb !important;
    color: #ffffff !important;
    border: 1px solid #2563eb !important;
    font-weight: 600 !important;
    padding: 8px 24px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__footer .ax-btn--primary:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }

  /* ── Floating labels: Clean professional styling ── */
  .ax-modal .ax-float { position: relative; width: 100%; }
  .ax-modal .ax-float__input {
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
  .ax-modal .ax-float__input::placeholder { color: transparent !important; }
  .ax-modal .ax-float__input:hover { border-color: #94a3b8 !important; }
  .ax-modal .ax-float__input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
    outline: none !important;
  }
  .ax-modal .ax-float__input.is-invalid {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
  }
  .ax-modal .ax-float__input.is-valid {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
  }
  .ax-modal .ax-float__label {
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
  .ax-modal .ax-float__input:focus + .ax-float__label,
  .ax-modal .ax-float__input:not(:placeholder-shown) + .ax-float__label,
  .ax-modal .ax-float--date .ax-float__label,
  .ax-modal .ax-float--locked .ax-float__label,
  .ax-modal .ax-float--area .ax-float__input:focus + .ax-float__label,
  .ax-modal .ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
    top: 0;
    font-size: 11px;
    font-weight: 600;
    color: #475569;
  }
  .ax-modal .ax-float__input:focus + .ax-float__label { color: #2563eb !important; }
  .ax-modal .ax-float__input.is-invalid + .ax-float__label { color: #ef4444 !important; }
  .ax-modal .ax-float--area .ax-float__label { top: 14px; transform: none; }
  .ax-modal .ax-textarea.ax-float__input {
    height: auto !important;
    min-height: 96px !important;
    padding: 14px !important;
    line-height: 1.5 !important;
  }
  .ax-modal .ax-float--locked .ax-float__input {
    background: #f8fafc !important;
    color: #475569 !important;
    cursor: not-allowed !important;
  }

  
  /* ── Professional View Modal Styles ── */
  .view-modal-wrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 8px;
  }
  .view-summary-strip {
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
  .view-summary-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .view-summary-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .view-summary-value {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
  }
  .view-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.15s ease;
  }
  .view-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }
  .view-card__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .view-card__icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .view-card__title {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin: 0;
  }
  .view-card__body {
    padding: 16px;
  }
  .view-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 16px;
  }
  .view-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px 16px;
  }
  @media (max-width: 700px) {
    .view-grid-3, .view-grid-2 {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  .view-data-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .view-data-cell--full {
    grid-column: 1 / -1;
  }
  .view-data-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .view-data-value {
    font-size: 13.5px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
    word-break: break-word;
  }
  .view-desc-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13.5px;
    color: #1e293b;
    line-height: 1.5;
  }

  .assigned-overview-card {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 16px 20px !important;
  }

  @media (max-width: 768px) {
    .ax-modal {
      padding: 12px !important;
    }
    .ax-modal__dialog,
    .ax-modal__dialog--lg,
    .ax-modal__dialog--scrollable,
    .ax-modal__dialog--white {
      max-width: 100% !important;
      height: calc(100vh - 24px) !important;
      max-height: calc(100vh - 24px) !important;
      border-radius: 12px !important;
    }
    .ax-modal__body {
      padding: 16px !important;
    }
    .ax-modal__header,
    .ax-modal__footer {
      padding: 14px 16px !important;
    }
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}


function PhoneLink({ phone }: { phone?: string | null }) {
  if (!phone || phone.trim() === '' || phone === '—') return <span>—</span>;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return (
    <a
      href={`tel:${cleanPhone}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: '#2563eb',
        fontWeight: 600,
        textDecoration: 'none',
      }}
      title="Click to call"
    >
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      {phone}
    </a>
  );
}

function GpsLink({ lat, lng }: { lat?: string | number | null; lng?: string | number | null }) {
  if (!lat && !lng) return <span>—</span>;
  const latStr = String(lat ?? '').trim();
  const lngStr = String(lng ?? '').trim();
  if (!latStr || !lngStr || latStr === '—' || lngStr === '—') return <span>—</span>;
  return (
    <a
      href={`https://www.google.com/maps?q=${encodeURIComponent(`${latStr},${lngStr}`)}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: '#059669',
        fontWeight: 600,
        textDecoration: 'none',
      }}
      title="Open location in Google Maps"
    >
      <span>{latStr}, {lngStr}</span>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
      </svg>
    </a>
  );
}

function AttachmentChips({ files }: { files: { label: string; file?: string | null }[] }) {
  const valid = files.filter(f => Boolean(f.file && typeof f.file === 'string' && f.file.trim().length > 0));
  if (valid.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
        Attached Files & Documents ({valid.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {valid.map((item, idx) => {
          const url = getMediaUrl(item.file);
          const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(item.file || '');
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#1e293b',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.background = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              {isImg ? (
                <div style={{ width: '100%', height: 64, borderRadius: 4, overflow: 'hidden', background: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={url} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: 64, borderRadius: 4, background: '#f1f5f9', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {item.label}
              </span>
              <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>View File ↗</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  badgeTone = 'blue',
  children,
}: {
  title: string;
  icon: ReactNode;
  badgeTone?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  children: ReactNode;
}) {
  const toneMap = {
    blue: { bg: '#eff6ff', fg: '#2563eb' },
    emerald: { bg: '#ecfdf5', fg: '#059669' },
    amber: { bg: '#fffbeb', fg: '#d97706' },
    purple: { bg: '#f5f3ff', fg: '#7c3aed' },
    rose: { bg: '#fff1f2', fg: '#e11d48' },
  };
  const t = toneMap[badgeTone] || toneMap.blue;
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

function DetailItem({
  label,
  value,
  children,
  fullWidth = false,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`view-data-cell${fullWidth ? ' view-data-cell--full' : ''}`}>
      <span className="view-data-label">{label}</span>
      <div className="view-data-value">{children !== undefined ? children : (value ?? '—')}</div>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span: number; children: ReactNode }) {
  return (
    <div className={`ax-col--${span}`}>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{children}</div>
    </div>
  );
}

/* ───────── Upload dropzone (dashed card) ───────── */
function UploadDrop({
  id, label, file, onPick, onClear,
  accept = 'image/*,.pdf',
  hint = 'PDF, JPG or PNG — single file',
}: {
  id: string; label: string; file: File | null;
  onPick: (f: File | null) => void; onClear: () => void;
  accept?: string; hint?: string;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 6 }}>
        {label}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0] || null); }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, textAlign: 'center', cursor: 'pointer',
          padding: '28px 16px', minHeight: 150,
          border: `1.5px dashed ${drag ? 'var(--ax-accent)' : 'color-mix(in oklab, var(--ax-accent) 35%, var(--ax-border))'}`,
          borderRadius: 12,
          background: drag ? 'rgba(var(--ax-accent-rgb), 0.06)' : '#ffffff',
          transition: 'all .15s ease',
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => { onPick(e.target.files?.[0] || null); e.target.value = ''; }}
        />

        <span style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
            <path d="M9 15l3 -3l3 3" />
            <path d="M12 12v9" />
          </svg>
        </span>

        {file ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ax-success-500)', wordBreak: 'break-all' }}>
              ✓ {file.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB ·{' '}
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                style={{ padding: '0 6px', height: 'auto', color: 'var(--ax-danger-500)' }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>{hint}</div>
          </>
        )}
      </div>
    </div>
  );
}

const isItemRejected = (item: BiharComplaintItem | any): boolean => {
  if (!item) return false;
  const statusStr = String(item.status ?? '').toLowerCase().trim();
  const closeStatusStr = String(item.close_status ?? '').toLowerCase().trim();
  const approvalStatusStr = String(item.approval_status ?? item.approved_status ?? item.approval ?? '').toLowerCase().trim();
  const rejectStatusStr = String(item.reject_status ?? item.rejected ?? item.is_rejected ?? '').toLowerCase().trim();
  const remarksStr = String(item.reject_reason ?? item.reject_remarks ?? item.admin_remarks ?? '').toLowerCase().trim();

  return (
    statusStr === '2' || statusStr === '-1' || statusStr === '3' ||
    statusStr === 'rejected' || statusStr === 'reject' ||
    closeStatusStr === '-1' || closeStatusStr === '2' ||
    closeStatusStr === 'rejected' || closeStatusStr === 'reject' ||
    approvalStatusStr === 'rejected' || approvalStatusStr === 'reject' || approvalStatusStr === '2' ||
    rejectStatusStr === '1' || rejectStatusStr === 'true' || rejectStatusStr === 'rejected' ||
    (remarksStr.length > 0 && (remarksStr.includes('reject') || statusStr === '2'))
  );
};

/* ── Table column config ── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const digits = (v: string) => v.trim().replace(/\D/g, '');
const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

interface Col { key: string; th: string; get: (r: Row) => ReactNode; exp: (r: Row) => string | number; style?: CSSProperties }

const ellipsis = (maxWidth: number, v: unknown) => (
  <div title={v ? String(v) : undefined} style={{ maxWidth, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(v)}</div>
);

const COLS: Col[] = [
  { key: 'Complaint ID', th: 'Complaint ID', get: (r) => `#${r.complaint_id}`, exp: (r) => r.complaint_id ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-accent)' } },
  { key: 'Complaint Date', th: 'Complaint Date', get: (r) => txt(r.start_date), exp: (r) => r.start_date ?? '' },
  { key: 'Complaint Issue', th: 'Complaint Issue', get: (r) => txt(r.complaint_issue), exp: (r) => r.complaint_issue ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Complaint', th: 'Complaint', get: (r) => ellipsis(240, r.complaint), exp: (r) => r.complaint ?? '' },
  { key: 'Complaint Source', th: 'Complaint Source', get: (r) => txt(r.complaint_source), exp: (r) => r.complaint_source ?? '' },
  { key: 'State', th: 'State', get: (r) => txt(r.state || 'Bihar'), exp: (r) => r.state || 'Bihar' },
  { key: 'District', th: 'District', get: (r) => txt(r.district), exp: (r) => r.district ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Block', th: 'Block', get: (r) => txt(r.block), exp: (r) => r.block ?? '' },
  { key: 'Panchayat', th: 'Panchayat', get: (r) => txt(r.panchyat || r.panchayat), exp: (r) => r.panchyat || r.panchayat || '' },
  { key: 'Phase', th: 'Phase', get: (r) => txt(r.phase), exp: (r) => r.phase ?? '' },
  { key: 'Address', th: 'Address', get: (r) => ellipsis(200, r.address), exp: (r) => r.address ?? '' },
  { key: 'Ward No', th: 'Ward No', get: (r) => txt(r.ward_no), exp: (r) => r.ward_no ?? '' },
  { key: 'Pole No', th: 'Pole No', get: (r) => txt(r.pole_no), exp: (r) => r.pole_no ?? '' },
  { key: 'Light No', th: 'Light No', get: (r) => txt(r.light_no), exp: (r) => r.light_no ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Beneficiary Name', th: 'Beneficiary Name', get: (r) => txt(r.beneficiary_name), exp: (r) => r.beneficiary_name ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  {
    key: 'Contact No', th: 'Contact No',
    get: (r) => (r.contact_no ? <a href={`tel:${r.contact_no}`} style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}>{r.contact_no}</a> : DASH),
    exp: (r) => r.contact_no ?? '',
  },
  { key: 'Latitude', th: 'Latitude', get: (r) => txt(r.latitude), exp: (r) => r.latitude ?? '' },
  { key: 'Longitude', th: 'Longitude', get: (r) => txt(r.longitude), exp: (r) => r.longitude ?? '' },
  { key: 'Along with Pole', th: 'Along with Pole', get: (r) => txt(r.along_with_pole), exp: (r) => r.along_with_pole ?? '' },
  { key: 'Luminary No', th: 'Luminary No', get: (r) => txt(r.luminary_no), exp: (r) => r.luminary_no ?? '' },
  { key: 'SIM No', th: 'SIM No', get: (r) => txt(r.sim_no), exp: (r) => r.sim_no ?? '' },
  { key: 'Battery Serial No', th: 'Battery Serial No', get: (r) => txt(r.battery_serial_no), exp: (r) => r.battery_serial_no ?? '' },
  { key: 'Module No', th: 'Module No', get: (r) => txt(r.module_no), exp: (r) => r.module_no ?? '' },
  { key: 'Date of Installation', th: 'Date of Installation', get: (r) => txt(r.date_of_installation || r.inst_date), exp: (r) => r.date_of_installation || r.inst_date || '' },
  {
    key: 'Document', th: 'Document',
    get: (r) => {
      const url = r.file ? getMediaUrl(r.file) : '';
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', textDecoration: 'none' }} title="View Proof">View</a>
      ) : DASH;
    },
    exp: (r) => (r.file ? getMediaUrl(r.file) : ''),
  },
  {
    key: 'Assign Complaint', th: 'Assign Complaint',
    get: (r) => (r.assigned_vendor_name
      ? <span className="ax-badge ax-badge--soft ax-badge--pill"><span className="ax-badge__dot" />{r.assigned_vendor_name}</span>
      : DASH),
    exp: (r) => r.assigned_vendor_name ?? '',
  },
];

const approvalLabel = (r: Row) =>
  isItemRejected(r) ? 'Rejected' : r.close_status === 1 ? 'Approved' : r.status === 1 ? 'Pending Approval' : 'Open';

export function Bihar_Complaint_SSL_AssignedComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedData, setAssignedData] = useState<AssignedComplaintsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<BiharComplaintItem | null>(null);

  // Resolve / Close Complaint Modal
  const [resolvingItem, setResolvingItem] = useState<BiharComplaintItem | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rMobile, setRMobile] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>('Yes');
  const [rFile, setRFile] = useState<File | null>(null);
  const [rFile2, setRFile2] = useState<File | null>(null);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((msg: string, ttl = 3500) => {
    const id = ++TID;
    setToasts((t) => [...t, { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  const pickResolveFile = (f: File | null, setter: (f: File | null) => void) => {
    if (!f) return;
    const okType = /^image\/(jpeg|png|webp)$/.test(f.type) || f.type === 'application/pdf';
    if (!okType) { setResolveError('Only PDF, JPG, PNG or WebP files are allowed.'); return; }
    if (f.size > MAX_FILE_SIZE) { setResolveError('File size must be 5 MB or less.'); return; }
    setResolveError(null);
    setter(f);
  };

  const openResolveModal = (item: BiharComplaintItem) => {
    setAttempted(false);
    setResolvingItem(item);
    setResolveError(null);
    setResolvedBy(assignedData?.name || (assignedData as any)?.vendor?.name || 'App Testing');
    setBeneficiaryName(item.beneficiary_name || '');
    setContactNo(item.contact_no || '');
    setREmail((assignedData as any)?.vendor?.email || '');
    setRMobile((assignedData as any)?.vendor?.contact || '');
    setClosingDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setCloseSms('Yes');
    setRFile(null);
    setRFile2(null);
  };

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // API 13: GET /bihar/ssl/complaint/assign
      const resp = await biharComplaintService.getAssignedSslComplaints();
      setAssignedData(resp);
      if (resp.open && resp.open.length > 0) setActiveTab('open');
      else if (resp.approved && resp.approved.length > 0) setActiveTab('approved');
      else setActiveTab('closed');
    } catch (err) {
      console.error('Error loading SSL assigned complaints:', err);
      setErrorMsg('Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;
    setAttempted(true);

    const cleanMobile = digits(rMobile);
    const cleanContact = digits(contactNo);

    if (!resolvedBy.trim()) { setResolveError('Resolved By is required.'); return; }
    if (!beneficiaryName.trim()) { setResolveError('Beneficiary name is required.'); return; }
    if (!isEmail(rEmail)) { setResolveError('Please enter a valid resolver email address.'); return; }
    if (cleanMobile.length !== 10) { setResolveError('Resolver mobile must be exactly 10 digits.'); return; }
    if (!closingDate) { setResolveError('Closing date is required.'); return; }
    if (!remarks.trim()) { setResolveError('Remarks are required.'); return; }
    if (cleanContact.length !== 10) { setResolveError('Beneficiary contact number must be exactly 10 digits.'); return; }

    setResolveSubmitting(true);
    setResolveError(null);

    try {
      const fd = new FormData();
      fd.append('ssl_id', String(resolvingItem.id));
      fd.append('resolved_by', resolvedBy.trim());
      fd.append('r_email', rEmail.trim());
      fd.append('r_mobile', cleanMobile);
      fd.append('manual_close_date', closingDate);
      fd.append('remarks', remarks.trim());
      fd.append('close_sms', closeSms);
      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('contact_no', cleanContact);
      if (rFile) fd.append('r_file', rFile);
      if (rFile2) fd.append('r_file2', rFile2);

      const res = await biharComplaintService.closeUpdateSslComplaint(fd);
      if (res.success) {
        showToast(res.message || 'Complaint Resolved successfully.');
        setResolvingItem(null);
        await loadData();
      } else {
        setResolveError(res.message || 'Failed to resolve complaint.');
      }
    } catch (err: any) {
      setResolveError(err?.message || 'Error occurred while resolving complaint.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const tabItems = useMemo(() => {
    if (!assignedData) return [];
    if (activeTab === 'open') return assignedData.open || [];
    if (activeTab === 'approved') return assignedData.approved || [];
    return assignedData.data || [];
  }, [assignedData, activeTab]);

  const districts = useMemo(() => {
    if (!assignedData) return [];
    const all = [...(assignedData.open || []), ...(assignedData.approved || []), ...(assignedData.data || [])];
    const s = new Set<string>();
    all.forEach((i) => { if (i.district) s.add(i.district); });
    return Array.from(s).sort();
  }, [assignedData]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return tabItems.filter((item) => {
      if (districtFilter !== 'all' && item.district !== districtFilter) return false;
      if (q) {
        const str = [
          item.complaint_id, item.uid, item.beneficiary_name, item.contact_no, item.light_no, item.pole_no,
          item.district, item.block, item.panchyat || item.panchayat, item.complaint, item.complaint_issue, item.luminary_no,
        ].join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [tabItems, districtFilter, deferredQuery]);

  const pagination = usePagination({ data: filtered, initialPageSize: 100 });

  // Counts from API response #13
  const totalCount = assignedData?.total_complaint ?? 0;
  const openCount = assignedData?.open_complaint ?? 0;
  const approvedCount = assignedData?.approved_complaint ?? 0;
  const closedCount = assignedData?.close_complaint ?? 0;

  /* ── Export ── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      ...COLS.filter((c) => c.key !== 'Document').map((c) => ({ header: c.key, accessor: c.exp })),
      { header: 'Approval Status', accessor: (r: Row) => approvalLabel(r) },
      { header: 'Status', accessor: (r: Row) => (r.close_status === 1 ? 'Closed' : 'Open') },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV(`Bihar_SSL_Assigned_${activeTab}`, filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel(`Bihar_SSL_Assigned_${activeTab}`, filtered, exportCols);
  const handleExportPDF = () => printTableData(`Bihar SSL Assigned Complaints (${activeTab})`, filtered, exportCols);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'open', label: 'Open', count: openCount },
    { key: 'approved', label: 'Pending Approval', count: approvedCount },
    { key: 'closed', label: 'Closed', count: closedCount },
  ];

  const hasFilters = !!searchQuery || districtFilter !== 'all';
  const clearFilters = () => { setSearchQuery(''); setDistrictFilter('all'); pagination.setPage(1); };
  const tabTitle = activeTab === 'open' ? 'Open Assigned Complaints' : activeTab === 'approved' ? 'Pending Approval Complaints' : 'Closed Assigned Complaints';

  const renderApproval = (item: Row) => {
    if (isItemRejected(item)) {
      return (
        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--danger" title={(item as any).reject_reason || (item as any).reject_remarks || 'Complaint rejected from main portal'}>
          <span className="ax-badge__dot" />Rejected
        </span>
      );
    }
    if (activeTab === 'approved' || (item.status === 1 && item.close_status !== 1)) {
      return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--info"><span className="ax-badge__dot" />Pending</span>;
    }
    if (activeTab === 'closed' || item.close_status === 1) {
      return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success"><span className="ax-badge__dot" />Approved</span>;
    }
    return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--warning"><span className="ax-badge__dot" />Open</span>;
  };

  const contactInvalid = attempted && digits(contactNo).length !== 10;
  const mobileInvalid = attempted && digits(rMobile).length !== 10;
  const emailInvalid = attempted && !isEmail(rEmail);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Complaints"
        subtitle="Manage and inspect all Solar Street Light breakdown complaints assigned to vendor in Bihar"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SSL', href: '/v/complaint/bihar/ssl-view-complaint' },
          { label: 'Assigned Complaints' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠ {errorMsg}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent" label="Total Complaints" value={num(totalCount)} sub="Overall assigned tickets"
              icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>)}
            />
            <KpiCard
              tone="amber" label="Open Complaints" value={num(openCount)} sub="Pending field action"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>)}
            />
            <KpiCard
              tone="cyan" label="Pending Approval" value={num(approvedCount)} sub="Resolution under review"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald" label="Resolved Complaints" value={num(closedCount)} sub="Resolved & closed"
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Assigned complaints tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => { setActiveTab(t.key); pagination.setPage(1); }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : t.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Assigned Complaints">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{tabTitle}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabItems.length}</span> complaints
                {' '}· Open <b className="ax-num">{openCount}</b> · Pending Approval <b className="ax-num">{approvedCount}</b> · Closed <b className="ax-num">{closedCount}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); pagination.setPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={searchQuery}
                  onChange={(val) => { setSearchQuery(val); pagination.setPage(1); }}
                  placeholder="Search records…"
                  size="sm"
                  ariaLabel="Search records"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <TableSkeleton columns={12} rows={8} showCard={false} />
          ) : filtered.length === 0 ? (
            <TableEmptyState
              title="No records found"
              message={
                hasFilters
                  ? 'No complaints match your filters. Try clearing filters or search term.'
                  : 'There are currently no tickets matching this status tab.'
              }
              onClear={hasFilters ? clearFilters : undefined}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                  <caption className="ax-visually-hidden">Bihar SSL Assigned Complaints</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      {COLS.map((c) => <th key={c.key} className="ax-table__th" scope="col">{c.th}</th>)}
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Approval Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paged.map((item, idx) => {
                      const srNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                      const rejected = isItemRejected(item);
                      return (
                        <tr key={item.id || idx} className="ax-table__row">
                          <td className="ax-table__td ax-num">{srNo}</td>
                          {COLS.map((c) => (
                            <td key={c.key} className="ax-table__td" style={c.style}>
                              {c.key === 'Complaint ID' ? (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--ghost ax-btn--sm"
                                  onClick={() => setSelectedItem(item)}
                                  style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-accent)' }}
                                >
                                  {c.get(item)}
                                </button>
                              ) : c.get(item)}
                            </td>
                          ))}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderApproval(item)}</td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              {(activeTab === 'approved' || rejected) ? (
                                <>
                                  <button
                                    type="button"
                                    className="ax-btn ax-btn--secondary ax-btn--sm"
                                    onClick={() => navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${item.id}`)}
                                  >
                                    Edit
                                  </button>
                                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                    View
                                  </button>
                                </>
                              ) : activeTab === 'closed' ? (
                                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                  View
                                </button>
                              ) : (
                                <>
                                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                    View
                                  </button>
                                  {item.close_status !== 1 && (
                                    <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => openResolveModal(item)} title="Resolve this complaint">
                                      Resolve
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ax-card__footer">
                <div className="ula-pagination-left">
                  <Pagination {...pagination} onPageSizeChange={pagination.setPageSize} pageSizeOptions={[100, 200, 300]} />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── View Detail Modal ── */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        labelledBy="m-ssl-view-title"
        dialogClass="ax-modal__dialog--lg ax-modal__dialog--white ax-modal__dialog--scrollable"
      >
        {selectedItem && (
          <>
            <div className="ax-modal__header">
              <div>
                <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  SSL COMPLAINT · TICKET OVERVIEW
                </span>
                <h2 className="ax-modal__title" id="m-ssl-view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>Complaint #{selectedItem.complaint_id}</span>
                  {selectedItem.uid && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                      {selectedItem.uid}
                    </span>
                  )}
                </h2>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginTop: '4px' }}>
                  Assigned to: <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedItem.assigned_vendor_name || '—'}</strong> • Registered: {selectedItem.start_date || selectedItem.complaint_date || '—'}
                </div>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setSelectedItem(null)} aria-label="Close dialog">
                {X}
              </button>
            </div>

            <div className="ax-modal__body">
              <div className="view-modal-wrap">
                {/* ── Top Summary Strip ── */}
                <div className="view-summary-strip">
                  <div className="view-summary-col">
                    <span className="view-summary-label">Complaint ID</span>
                    <span className="view-summary-value" style={{ color: '#2563eb' }}>#{selectedItem.complaint_id}</span>
                  </div>
                  {selectedItem.uid && (
                    <div className="view-summary-col">
                      <span className="view-summary-label">System UID</span>
                      <span className="view-summary-value">{selectedItem.uid}</span>
                    </div>
                  )}
                  <div className="view-summary-col">
                    <span className="view-summary-label">Ticket Status</span>
                    <div>
                      {isItemRejected(selectedItem) ? (
                        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--danger">Rejected by Portal</span>
                      ) : selectedItem.close_status === 1 || activeTab === 'closed' ? (
                        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success">Resolved & Approved</span>
                      ) : selectedItem.status === 1 || activeTab === 'approved' ? (
                        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--cyan">Pending Approval</span>
                      ) : (
                        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--accent">Open & Assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="view-summary-col">
                    <span className="view-summary-label">Assigned Vendor</span>
                    <span className="view-summary-value">{selectedItem.assigned_vendor_name || '—'}</span>
                  </div>
                  <div className="view-summary-col">
                    <span className="view-summary-label">Complaint Date</span>
                    <span className="view-summary-value">{selectedItem.start_date || selectedItem.complaint_date || '—'}</span>
                  </div>
                </div>

                {/* ── Rejection Alert ── */}
                {isItemRejected(selectedItem) && (
                  <div className="ax-alert ax-alert--danger" role="alert" style={{ borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
                    <span className="ax-alert__icon" style={{ color: '#ef4444' }}>
                      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 9v4m0 4h.01M5 19h14a2 2 0 0 0 1.84-2.75L13.74 4a2 2 0 0 0-3.48 0L3.16 16.25A2 2 0 0 0 5 19z"/></svg>
                    </span>
                    <div className="ax-alert__content">
                      <p className="ax-alert__title" style={{ fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>Complaint Rejected by Main Portal</p>
                      <p className="ax-alert__message" style={{ color: '#b91c1c' }}>
                        Reason / Remarks: <strong>{(selectedItem as any).reject_reason || (selectedItem as any).reject_remarks || (selectedItem as any).admin_remarks || 'Not specified'}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* ── 1. Beneficiary Information ── */}
                <DetailSection
                  title="Beneficiary & Resident Details"
                  icon={<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></svg>}
                  badgeTone="blue"
                >
                  <div className="view-grid-3">
                    <DetailItem label="Beneficiary Name" value={selectedItem.beneficiary_name || '—'} />
                    <DetailItem label="Contact Mobile">
                      <PhoneLink phone={selectedItem.contact_no} />
                    </DetailItem>
                    <DetailItem label="Village / Ward">
                      {selectedItem.village ? `${selectedItem.village}${selectedItem.ward_no ? ` (Ward ${selectedItem.ward_no})` : ''}` : (selectedItem.ward_no ? `Ward ${selectedItem.ward_no}` : '—')}
                    </DetailItem>
                    <DetailItem label="Full Resident Address" fullWidth value={selectedItem.address || '—'} />
                  </div>
                </DetailSection>

                {/* ── 2. Location & Geographical Hierarchy ── */}
                <DetailSection
                  title="Location & Geographical Hierarchy"
                  icon={<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>}
                  badgeTone="emerald"
                >
                  <div className="view-grid-3">
                    <DetailItem label="State" value={selectedItem.state || 'Bihar'} />
                    <DetailItem label="District" value={selectedItem.district || '—'} />
                    <DetailItem label="Block" value={selectedItem.block || '—'} />
                    <DetailItem label="Gram Panchayat" value={selectedItem.panchyat || selectedItem.panchayat || '—'} />
                    <DetailItem label="Ward Number" value={selectedItem.ward_no ? `Ward ${selectedItem.ward_no}` : '—'} />
                    <DetailItem label="GPS Coordinates">
                      <GpsLink lat={selectedItem.latitude} lng={selectedItem.longitude} />
                    </DetailItem>
                  </div>
                </DetailSection>

                {/* ── 3. Solar Hardware & Technical Specifications ── */}
                <DetailSection
                  title="Solar Light & Hardware Specifications"
                  icon={<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>}
                  badgeTone="amber"
                >
                  <div className="view-grid-3">
                    <DetailItem label="Light Number" value={selectedItem.light_no || '—'} />
                    <DetailItem label="Pole Number">
                      {selectedItem.pole_no || '—'}{selectedItem.along_with_pole ? ` (${selectedItem.along_with_pole})` : ''}
                    </DetailItem>
                    <DetailItem label="Luminary Serial No" value={selectedItem.luminary_no || '—'} />
                    <DetailItem label="Battery Serial No" value={selectedItem.battery_serial_no || '—'} />
                    <DetailItem label="Solar Module Serial No" value={selectedItem.module_no || '—'} />
                    <DetailItem label="Date of Installation" value={selectedItem.date_of_installation || selectedItem.inst_date || '—'} />
                  </div>
                </DetailSection>

                {/* ── 4. Complaint & Problem Description ── */}
                <DetailSection
                  title="Complaint & Issue Details"
                  icon={<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                  badgeTone="purple"
                >
                  <div className="view-grid-3" style={{ marginBottom: 12 }}>
                    <DetailItem label="Reported Issue Category">
                      <span style={{ display: 'inline-block', background: '#f5f3ff', color: '#6d28d9', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12.5 }}>
                        {selectedItem.complaint_issue || 'General Issue'}
                      </span>
                    </DetailItem>
                    <DetailItem label="Complaint Source" value={selectedItem.complaint_source || '—'} />
                    <DetailItem label="Complaint Date" value={selectedItem.start_date || selectedItem.complaint_date || '—'} />
                  </div>

                  <div className="view-data-cell view-data-cell--full">
                    <span className="view-data-label" style={{ marginBottom: 4 }}>Detailed Problem Description</span>
                    <div className="view-desc-box" style={{ borderLeft: '4px solid #7c3aed' }}>
                      {selectedItem.complaint || 'No detailed remarks provided.'}
                    </div>
                  </div>

                  <AttachmentChips
                    files={[
                      { label: 'Complaint Photo 1', file: selectedItem.file },
                      { label: 'Complaint Photo 2', file: selectedItem.file2 },
                      { label: 'Complaint Photo 3', file: selectedItem.file3 },
                      { label: 'Complaint Photo 4', file: selectedItem.file4 },
                    ]}
                  />
                </DetailSection>

                {/* ── 5. Resolution & Verification Work Log ── */}
                {(selectedItem.close_status === 1 || selectedItem.status === 1 || selectedItem.resolved_by || selectedItem.close_date || selectedItem.remarks || selectedItem.r_file) && (
                  <DetailSection
                    title="Resolution & Verification Work Log"
                    icon={<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    badgeTone="emerald"
                  >
                    <div className="view-grid-3" style={{ marginBottom: 12 }}>
                      <DetailItem label="Resolved By" value={selectedItem.resolved_by || '—'} />
                      <DetailItem label="Resolution Date" value={selectedItem.close_date || '—'} />
                      <DetailItem label="Current Resolution Status">
                        {selectedItem.close_status === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success">Approved & Closed</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--cyan">Submitted for Approval</span>
                        )}
                      </DetailItem>
                    </div>

                    <div className="view-data-cell view-data-cell--full">
                      <span className="view-data-label" style={{ marginBottom: 4 }}>Resolution Remarks / Action Taken</span>
                      <div className="view-desc-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', borderLeft: '4px solid #16a34a' }}>
                        {selectedItem.remarks || 'No resolution remarks provided.'}
                      </div>
                    </div>

                    <AttachmentChips
                      files={[
                        { label: 'Resolution Proof 1', file: selectedItem.r_file },
                        { label: 'Resolution Proof 2', file: selectedItem.r_file2 },
                        { label: 'Resolution Proof 3', file: selectedItem.r_file3 },
                        { label: 'Resolution Proof 4', file: selectedItem.r_file4 },
                      ]}
                    />
                  </DetailSection>
                )}
              </div>
            </div>

            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {isItemRejected(selectedItem) ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => {
                      const id = selectedItem.id;
                      setSelectedItem(null);
                      navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${id}`);
                    }}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                    <span className="ax-btn__label">Edit & Fix Complaint</span>
                  </button>
                ) : activeTab === 'open' && selectedItem.close_status !== 1 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      openResolveModal(item);
                    }}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                    <span className="ax-btn__label">Resolve This Complaint</span>
                  </button>
                )}
              </div>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Vendor Close / Resolve Complaint Modal ── */}
      <Modal
        open={Boolean(resolvingItem)}
        onClose={() => !resolveSubmitting && setResolvingItem(null)}
        labelledBy="m-ssl-resolve-title"
        dialogClass="ax-modal__dialog--lg ax-modal__dialog--white ax-modal__dialog--scrollable"
        closeOnBackdrop={!resolveSubmitting}
      >
        {resolvingItem && (
          <form onSubmit={handleResolveSubmit} noValidate>
            <div className="ax-modal__header">
              <div>
                <span className="ax-card__eyebrow" style={{ color: 'var(--ax-viz-emerald, #1042d7)' }}>
                  Vendor Close Complaints
                </span>
                <h2 className="ax-modal__title" id="m-ssl-resolve-title">
                  Resolve Complaint #{resolvingItem.complaint_id}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Enter resolution information, attach proof images and submit to close.
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => !resolveSubmitting && setResolvingItem(null)}
                disabled={resolveSubmitting}
                aria-label="Close dialog"
              >
                {X}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              {resolveError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <span className="ax-alert__icon">
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                    </svg>
                  </span>
                  <div className="ax-alert__content">
                    <p className="ax-alert__message">{resolveError}</p>
                  </div>
                </div>
              )}

              {/* ── Read-only Complaint Overview ── */}
              <div className="assigned-overview-card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-bold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ax-text-muted)', marginBottom: 'var(--ax-space-3)' }}>
                  Complaint Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', fontSize: 'var(--ax-text-xs)' }}>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{resolvingItem.state || 'bihar'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{resolvingItem.district || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Block:</span> <b>{resolvingItem.block || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Panchayat:</span> <b>{resolvingItem.panchyat || resolvingItem.panchayat || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Created By:</span> <b>{resolvingItem.created_by || assignedData?.name || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Ward No:</span> <b>{resolvingItem.ward_no || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Pole No:</span> <b>{resolvingItem.pole_no || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Name:</span> <b>{resolvingItem.beneficiary_name || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Mobile:</span> <b>{resolvingItem.contact_no || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Complaint Date:</span> <b>{resolvingItem.start_date || '—'}</b></div>
                </div>
              </div>

              {/* ── Resolution Inputs ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--ax-space-5)' }}>
                {/* Resolved By */}
                <div className="ax-float ax-float--locked">
                  <input
                    id="res-resolved-by"
                    type="text"
                    className="ax-input ax-float__input"
                    placeholder=" "
                    value={resolvedBy}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.85 }}
                  />
                  <label className="ax-float__label" htmlFor="res-resolved-by">
                    Resolved By <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                </div>

                {/* Beneficiary Name */}
                <div className="ax-float">
                  <input
                    id="res-ben-name"
                    type="text"
                    className={`ax-input ax-float__input${attempted ? (beneficiaryName.trim() ? ' is-valid' : ' is-invalid') : ''}`}
                    placeholder=" "
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-ben-name">
                    Beneficiary Name <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !beneficiaryName.trim() && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Enter beneficiary name.</span>
                  )}
                </div>

                {/* Beneficiary Contact */}
                <div className="ax-float">
                  <input
                    id="res-contact-no"
                    type="tel"
                    maxLength={10}
                    className={`ax-input ax-float__input ax-num${attempted ? (contactInvalid ? ' is-invalid' : ' is-valid') : ''}`}
                    placeholder=" "
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    style={{ fontFamily: 'var(--ax-font-mono)' }}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-contact-no">
                    Beneficiary Contact <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {contactInvalid && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Contact must be exactly 10 digits.</span>
                  )}
                </div>

                {/* Resolver Email */}
                <div className="ax-float">
                  <input
                    id="res-remail"
                    type="email"
                    className={`ax-input ax-float__input${attempted ? (emailInvalid ? ' is-invalid' : ' is-valid') : ''}`}
                    placeholder=" "
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-remail">
                    Resolver Email <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {emailInvalid && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Enter a valid email address.</span>
                  )}
                </div>

                {/* Resolver Mobile */}
                <div className="ax-float">
                  <input
                    id="res-rmobile"
                    type="tel"
                    maxLength={10}
                    className={`ax-input ax-float__input ax-num${attempted ? (mobileInvalid ? ' is-invalid' : ' is-valid') : ''}`}
                    placeholder=" "
                    value={rMobile}
                    onChange={(e) => setRMobile(e.target.value)}
                    style={{ fontFamily: 'var(--ax-font-mono)' }}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-rmobile">
                    Resolver Mobile (10 Digits) <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {mobileInvalid && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Resolver mobile must be 10 digits.</span>
                  )}
                </div>

                {/* Closing Date */}
                <div className="ax-float ax-float--date">
                  <input
                    id="res-closing-date"
                    type="date"
                    className={`ax-input ax-float__input${attempted ? (closingDate ? ' is-valid' : ' is-invalid') : ''}`}
                    placeholder=" "
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-closing-date">
                    Closing Date <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !closingDate && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Select closing date.</span>
                  )}
                </div>

                {/* Upload dropzones (Light Image + Document) */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-5)' }}>
                  <UploadDrop
                    id="res-rfile"
                    label="Light Image (Optional)"
                    file={rFile}
                    onPick={(f) => pickResolveFile(f, setRFile)}
                    onClear={() => setRFile(null)}
                  />
                  <UploadDrop
                    id="res-rfile2"
                    label="Document (Optional)"
                    file={rFile2}
                    onPick={(f) => pickResolveFile(f, setRFile2)}
                    onClear={() => setRFile2(null)}
                  />
                </div>

                {/* Remarks */}
                <div className="ax-float ax-float--area" style={{ gridColumn: '1 / -1' }}>
                  <textarea
                    id="res-remarks"
                    className={`ax-textarea ax-float__input${attempted ? (remarks.trim() ? ' is-valid' : ' is-invalid') : ''}`}
                    rows={3}
                    placeholder=" "
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-remarks">
                    Remarks <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !remarks.trim() && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Please enter remarks / resolution notes.</span>
                  )}
                </div>

                {/* Send SMS Notification */}
                <div style={{
                  gridColumn: '1 / -1',
                  padding: 'var(--ax-space-3) var(--ax-space-4)',
                  background: 'var(--ax-surface-subtle)',
                  borderRadius: 'var(--ax-radius-sm)',
                  border: '1px solid var(--ax-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--ax-space-3)',
                }}>
                  <div style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                    Send SMS Notification <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </div>
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)' }}>
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>
                        <input
                          type="radio"
                          className="ax-radio"
                          name="close_sms"
                          value={opt}
                          checked={closeSms === opt}
                          onChange={() => setCloseSms(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setResolvingItem(null)}
                disabled={resolveSubmitting}
              >
                <span className="ax-btn__label">Cancel</span>
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={resolveSubmitting}
                aria-busy={resolveSubmitting}
                style={{ minWidth: 160 }}
              >
                {resolveSubmitting && <span className="ax-spinner ax-spinner--xs" aria-hidden="true" />}
                <span className="ax-btn__label">{resolveSubmitting ? 'Resolving…' : 'Confirm & Resolve Complaint'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ───── Toast region ───── */}
      {toasts.length > 0 && createPortal(
        <div className="ax-toast-region" aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 'var(--ax-space-6)', insetInlineEnd: 'var(--ax-space-6)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          {toasts.map((t) => (
            <div key={t.id} className="ax-toast" role="status">
              <div className="ax-toast__content"><p className="ax-toast__message">{t.msg}</p></div>
              <button type="button" className="ax-toast__dismiss" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Dismiss">{X}</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default Bihar_Complaint_SSL_AssignedComplaint;