import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoInstallCounts,
  type UpRescoPanelItem,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Normalized row ───────── */
interface Row {
  id: number;
  unique_id?: string;
  state?: string;
  district?: string;
  site_name?: string;
  contact_person?: string;
  contact_number?: string;
  installation_date?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_meter_smart_meter_image?: string;
  loger_image?: string;
  latitude?: string;
  longitude?: string;
  remark?: string;
  verify_status: number;
  verify_remarks?: string;
  document_status: number;
  document_file?: string;
  document_remarks?: string;
  inst_status: number;
}

const pickStr = (...vals: unknown[]): string | undefined => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
};

const pickNum = (...vals: unknown[]): number => {
  for (const v of vals) {
    if (v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

const normalizeSite = (r: any): Row => ({
  id: r.id,
  unique_id: pickStr(r.unique_id, r.id),
  state: pickStr(r.state),
  district: pickStr(r.district),
  site_name: pickStr(r.site_name),
  contact_person: pickStr(r.contact_person),
  contact_number: pickStr(r.contact_number),
  installation_date: pickStr(r.inst_date, r.installation_date),
  solar_meter_no: pickStr(r.solarmeter_no, r.solar_meter_no),
  inverter_no: pickStr(r.inverter_no),
  net_smart_meter_no: pickStr(r.nm_sm_no, r.net_smart_meter_no),
  loger_no: pickStr(r.loger_no),
  system_image: pickStr(r.system_image),
  inverter_image: pickStr(r.inverter_image),
  panel_image: pickStr(r.panel_image),
  net_meter_smart_meter_image: pickStr(r.nm_sm_image, r.net_meter_smart_meter_image),
  loger_image: pickStr(r.loger_image),
  latitude: pickStr(r.inst_latitude, r.latitude),
  longitude: pickStr(r.inst_longitude, r.longitude),
  remark: pickStr(r.inst_remarks, r.remark),
  verify_status: pickNum(r.inst_verify_status, r.verify_status),
  verify_remarks: pickStr(r.inst_verify_remarks, r.verify_remarks),
  document_status: pickNum(r.inst_doc_status, r.document_status, r.doc_status),
  document_file: pickStr(r.inst_doc_file, r.document_file, r.doc_file, r.inst_doc),
  document_remarks: pickStr(r.inst_doc_remarks, r.document_remarks, r.doc_remarks),
  inst_status: pickNum(r.inst_status),
});

type VerifyFilter = 'all' | 'approved' | 'pending' | 'reject';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const isCompleted = (r: Row) => r.inst_status === 1 || !!(r.installation_date && r.inverter_no);
const isVerifiedApproved = (r: Row) => Number(r.verify_status) === 1;
const isDocumentSubmitted = (r: Row) => {
  const docStatus = Number(r.document_status);
  const hasDocFile = Boolean(
    r.document_file &&
    r.document_file !== DASH &&
    r.document_file.toLowerCase() !== 'null'
  );
  return docStatus === 1 || docStatus === 2 || (hasDocFile && docStatus !== 3);
};

/* ───────── Badges ───────── */
const VerifyStatusBadge = ({ value }: { value?: number | string }) => {
  const n = Number(value ?? 0);
  if (n === 1) return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (n === 2) return <span className="ax-badge ax-badge--soft ax-badge--danger">Reject</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

const DocStatusBadge = ({ value }: { value?: number | string }) => {
  const n = Number(value ?? 0);
  if (n === 2) return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (n === 3) return <span className="ax-badge ax-badge--soft ax-badge--danger">Reject</span>;
  if (n === 1) return <span className="ax-badge ax-badge--soft ax-badge--info">Submitted</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>;
};

const getVerifyLabel = (v?: number | string) => {
  const n = Number(v ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Reject';
  return 'Pending';
};

const getDocLabel = (v?: number | string) => {
  const n = Number(v ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Reject';
  if (n === 1) return 'Submitted';
  return 'Pending';
};

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
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1024px) {
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
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }

  /* Modal & Lightbox Styles */
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
  .ax-modal__dialog--lg { max-width: 780px; }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: #0f172a;
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }

  /* Row action button + menu (Exact Bihar ULA Installation pattern) */
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
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── Top Metric KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'violet' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
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
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)', whiteSpace: 'nowrap' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {sub}
      </div>
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Photo Lightbox (Strict Square Corners) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="resco-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Installation Photograph'}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>}
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
        <div className="ax-modal__footer">
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Modern Image Placeholder & Interactive Thumbnail ── */
function ImagePlaceholder({
  size = 36,
  label = 'No photograph uploaded',
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="ax-img-placeholder"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '1px dashed var(--ax-border, #cbd5e1)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ax-text-muted, #94a3b8)',
        flexShrink: 0,
        cursor: 'default',
        userSelect: 'none',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 0.18s ease',
      }}
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.max(14, Math.round(size * 0.48))}
        height={Math.max(14, Math.round(size * 0.48))}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: 0.7 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

function Thumb({ path, alt, onPreview, size = 36 }: { path?: string | null; alt: string; onPreview: (url: string, title: string) => void; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [path]);

  if (!path || failed) return <ImagePlaceholder size={size} label={`No image — ${alt}`} />;
  const url = resolveUpMediaUrl(path);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0, margin: '0 auto' }}>
      <img
        src={url}
        alt={alt}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          objectFit: 'cover',
          cursor: 'zoom-in',
          border: '1px solid var(--ax-border, #cbd5e1)',
          background: 'var(--ax-surface-subtle, #f8fafc)',
          display: 'block',
          margin: '0 auto',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.14)';
          e.currentTarget.style.borderColor = 'var(--ax-primary-default, #2563eb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = 'var(--ax-border, #cbd5e1)';
        }}
        onError={() => setFailed(true)}
        onClick={() => onPreview(url, alt)}
        title="Click to preview photograph"
      />
    </div>
  );
}

/* ───────── Existing Thumbnail ───────── */
function ExistingThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUpMediaUrl(src);
  if (failed || !resolved) {
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          background: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          border: '1px solid var(--ax-border, #cbd5e1)',
          flexShrink: 0,
        }}
      >
        File
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={alt}
      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}

/* ───────── File Upload Dropzone (matching uploaded design) ───────── */
interface FileUploadDropzoneProps {
  id: string;
  label?: string;
  required?: boolean;
  accept?: string;
  hint?: string;
  file: File | null;
  existingUrl?: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function FileUploadDropzone({
  id,
  label,
  required,
  accept = 'image/*',
  hint = 'PDF, JPG or PNG — single file',
  file,
  existingUrl,
  onSelect,
  onRemove,
  error,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file && (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name))) {
      const url = URL.createObjectURL(file);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalPreview(null);
  }, [file]);

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

  const hasNewFile = Boolean(file);
  const hasExisting = Boolean(!hasNewFile && existingUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
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
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
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
            : hasExisting
            ? '1.5px solid #cbd5e1'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : hasExisting
            ? '#f8fafc'
            : '#ffffff',
          padding: hasNewFile || hasExisting ? '10px 12px' : '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 105,
        }}
      >
        {hasNewFile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, textAlign: 'left' }}>
              {localPreview ? (
                <img
                  src={localPreview}
                  alt={file!.name}
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 34,
                    height: 34,
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
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file!.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {`${(file!.size / 1024).toFixed(0)} KB · Ready to upload`}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0, padding: '2px 6px', fontSize: 11 }}
              title="Remove file"
            >
              Remove
            </button>
          </div>
        ) : hasExisting ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, textAlign: 'left' }}>
              <ExistingThumbnail src={existingUrl!} alt={label || 'Existing'} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label || 'Attached File'}
                </div>
                <div style={{ fontSize: 11, color: '#059669', marginTop: 1, fontWeight: 500 }}>
                  ✓ Existing Photo Attached
                </div>
                <div style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>
                  Click or drop to replace
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0, fontSize: 11, padding: '2px 6px' }}
              title="Clear attached photo"
            >
              Clear
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              {hint}
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

/* ───────── Row Action Dropdown (Matching Bihar ULA) ───────── */
function RowActionDropdown({
  onEdit,
  onSubmitDoc,
  onImportPanel,
  onViewPanel,
  canEdit = true,
  canSubmitDoc = true,
}: {
  onEdit: () => void;
  onSubmitDoc: () => void;
  onImportPanel: () => void;
  onViewPanel: () => void;
  canEdit?: boolean;
  canSubmitDoc?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_W = 195;
  const totalItems = (canEdit ? 1 : 0) + (canSubmitDoc ? 1 : 0) + 2;
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
          style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
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
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: MENU_W,
              zIndex: 9999,
            }}
          >
            {canEdit && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => { setOpen(false); onEdit(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#2563eb' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
            )}
            {canSubmitDoc && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => { setOpen(false); onSubmitDoc(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#16a34a' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
                <span>Doc Submit</span>
              </button>
            )}
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => { setOpen(false); onImportPanel(); }}
            >
              <span>Import Panel</span>
            </button>
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => { setOpen(false); onViewPanel(); }}
            >
              <span>View Panel</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Main Component ───────── */
export function UP_Installation_Resco_InstallationDetail() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [sites, setSites] = useState<Row[]>([]);
  const [counts, setCounts] = useState<UpRescoInstallCounts | null>(null);

  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Photo Preview Modal (Lightbox)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Detail Modal
  const [viewModal, setViewModal] = useState<Row | null>(null);

  // Edit Modal State
  const [editModalSite, setEditModalSite] = useState<Row | null>(null);
  const [editInverterNo, setEditInverterNo] = useState('');
  const [editSolarMeterNo, setEditSolarMeterNo] = useState('');
  const [editNetSmartMeterNo, setEditNetSmartMeterNo] = useState('');
  const [editLogerNo, setEditLogerNo] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editSystemImg, setEditSystemImg] = useState<File | null>(null);
  const [editInverterImg, setEditInverterImg] = useState<File | null>(null);
  const [editPanelImg, setEditPanelImg] = useState<File | null>(null);
  const [editNetMeterImg, setEditNetMeterImg] = useState<File | null>(null);
  const [editLogerImg, setEditLogerImg] = useState<File | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<{
    system?: string | null;
    inverter?: string | null;
    panel?: string | null;
    netMeter?: string | null;
    loger?: string | null;
  }>({});
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Document Submit Modal State
  const [docModalSite, setDocModalSite] = useState<Row | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docRemarks, setDocRemarks] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Import Panel Modal State
  const [importModalSite, setImportModalSite] = useState<Row | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingPanels, setImportingPanels] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; text: string; duplicates?: string[] } | null>(null);

  // View Panel Modal State
  const [viewPanelModalSite, setViewPanelModalSite] = useState<Row | null>(null);
  const [sitePanels, setSitePanels] = useState<UpRescoPanelItem[]>([]);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [panelSearch, setPanelSearch] = useState('');

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [sitesRes, countsRes] = await Promise.allSettled([
        upInstallationService.getRescoInstalledSites(),
        upInstallationService.getRescoInstallCounts(),
      ]);

      if (sitesRes.status === 'fulfilled') {
        const rawList = Array.isArray(sitesRes.value?.data) ? sitesRes.value.data : [];
        const list: Row[] = rawList.map(normalizeSite);
        setSites(list);
      }
      if (countsRes.status === 'fulfilled' && countsRes.value) {
        setCounts(countsRes.value);
      }
    } catch (err: any) {
      console.error('[UP Resco Installation] load error:', err);
      setErrorMsg(err?.message || 'Failed to load Resco installations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI Summary (Pure Numbers, NO "Nos.") ── */
  const summary = useMemo(() => {
    const total = counts?.total ?? sites.length;
    const complete = counts?.complete ?? sites.filter(isCompleted).length;
    const pending = counts?.pending ?? Math.max(0, total - complete);

    const vApp = counts?.verify_approved ?? sites.filter((s) => Number(s.verify_status) === 1).length;
    const vRej = counts?.verify_reject ?? sites.filter((s) => Number(s.verify_status) === 2).length;
    const vPend = counts?.verify_pending ?? Math.max(0, total - vApp - vRej);

    const dApp = counts?.doc_approved ?? sites.filter((s) => Number(s.document_status) === 2).length;
    const dRej = counts?.doc_reject ?? sites.filter((s) => Number(s.document_status) === 3).length;
    const dPend = counts?.doc_pending ?? 0;

    return { total, complete, pending, vApp, vPend, vRej, dApp, dPend, dRej };
  }, [counts, sites]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((r) => r.district && set.add(r.district.trim()));
    return Array.from(set).sort();
  }, [sites]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sites.filter((s) => {
      const vStatus = Number(s.verify_status);
      if (verifyFilter === 'approved' && vStatus !== 1) return false;
      if (verifyFilter === 'reject' && vStatus !== 2) return false;
      if (verifyFilter === 'pending' && (vStatus === 1 || vStatus === 2)) return false;

      if (selectedDistrict !== 'all' && s.district?.trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (q && !Object.values(s).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [sites, search, verifyFilter, selectedDistrict]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, verifyFilter, selectedDistrict]);

  const hasFilters = !!search || verifyFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  /* ───────── 25 Export Columns matching Table ───────── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Installation Date', accessor: (r) => r.installation_date || DASH },
      { header: 'State', accessor: (r) => (r.state ? r.state.toUpperCase() : 'UP') },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'System Image', accessor: (r) => (r.system_image ? 'Uploaded' : DASH) },
      { header: 'Inverter Image', accessor: (r) => (r.inverter_image ? 'Uploaded' : DASH) },
      { header: 'Panel Image', accessor: (r) => (r.panel_image ? 'Uploaded' : DASH) },
      { header: 'Net Meter/Smart Meter Image', accessor: (r) => (r.net_meter_smart_meter_image ? 'Uploaded' : DASH) },
      { header: 'Loger Image', accessor: (r) => (r.loger_image ? 'Uploaded' : DASH) },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.remark || DASH },
      { header: 'Verify Status', accessor: (r) => getVerifyLabel(r.verify_status) },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
      { header: 'Document Status', accessor: (r) => getDocLabel(r.document_status) },
      { header: 'Document File', accessor: (r) => (r.document_file ? 'Uploaded' : 'No file available') },
      { header: 'Document Remarks', accessor: (r) => r.document_remarks || DASH },
    ],
    []
  );

  const handleCopy = () => {
    copyTableDataToClipboard(filtered, exportCols);
    setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
  };
  const handleCsv = () => exportDataToCSV('UP_Resco_Installations', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('UP_Resco_Installations', filtered, exportCols);
  const handlePdf = () => printTableData('UP Resco Installation Report', filtered, exportCols);

  /* ───────── Action Handlers ───────── */
  // 1. Edit
  const handleOpenEdit = async (item: Row) => {
    if (isVerifiedApproved(item)) return;
    setEditModalSite(item);
    setEditError(null);
    setEditInverterNo(item.inverter_no || '');
    setEditSolarMeterNo(item.solar_meter_no || '');
    setEditNetSmartMeterNo(item.net_smart_meter_no || '');
    setEditLogerNo(item.loger_no || '');
    setEditLat(item.latitude || '');
    setEditLng(item.longitude || '');
    setEditRemark(item.remark || '');
    setEditSystemImg(null);
    setEditInverterImg(null);
    setEditPanelImg(null);
    setEditNetMeterImg(null);
    setEditLogerImg(null);
    setExistingPhotos({
      system: item.system_image,
      inverter: item.inverter_image,
      panel: item.panel_image,
      netMeter: item.net_meter_smart_meter_image,
      loger: item.loger_image,
    });

    try {
      const fetched = await upInstallationService.getRescoSiteForEdit(item.id);
      if (fetched?.resco) {
        const r = fetched.resco;
        if (r.inverter_no) setEditInverterNo(r.inverter_no);
        const smNo = r.solarmeter_no || (r as any).solar_meter_no;
        if (smNo) setEditSolarMeterNo(smNo);
        const nmNo = r.nm_sm_no || (r as any).net_meter_smart_meter;
        if (nmNo) setEditNetSmartMeterNo(nmNo);
        if (r.loger_no) setEditLogerNo(r.loger_no);
        if (r.inst_latitude) setEditLat(r.inst_latitude);
        if (r.inst_longitude) setEditLng(r.inst_longitude);
        if (r.inst_remarks) setEditRemark(r.inst_remarks);
        setExistingPhotos({
          system: (r as any).system_image ?? item.system_image,
          inverter: (r as any).inverter_image ?? item.inverter_image,
          panel: (r as any).panel_image ?? item.panel_image,
          netMeter: (r as any).nm_sm_image ?? (r as any).net_meter_smart_meter_image ?? item.net_meter_smart_meter_image,
          loger: (r as any).loger_image ?? item.loger_image,
        });
      }
    } catch (e: any) {
      console.warn('Edit fetch warning:', e);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalSite) return;
    setUpdating(true);
    setEditError(null);

    const fd = new FormData();
    fd.append('id', String(editModalSite.id));
    fd.append('resco_id', String(editModalSite.id));
    fd.append('site_id', String(editModalSite.id));
    fd.append('inverter_no', editInverterNo.trim());
    fd.append('solarmeter_no', editSolarMeterNo.trim());
    fd.append('nm_sm_no', editNetSmartMeterNo.trim());
    fd.append('loger_no', editLogerNo.trim());
    fd.append('inst_latitude', editLat.trim());
    fd.append('latitude', editLat.trim());
    fd.append('inst_longitude', editLng.trim());
    fd.append('longitude', editLng.trim());
    if (editRemark.trim()) {
      fd.append('inst_remarks', editRemark.trim());
      fd.append('remark', editRemark.trim());
    }

    if (editSystemImg) fd.append('system_image', editSystemImg);
    if (editInverterImg) fd.append('inverter_image', editInverterImg);
    if (editPanelImg) fd.append('panel_image', editPanelImg);
    if (editNetMeterImg) fd.append('nm_sm_image', editNetMeterImg);
    if (editLogerImg) fd.append('loger_image', editLogerImg);

    try {
      const res = await upInstallationService.updateRescoInstallation(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Resco installation updated successfully!' });
        setEditModalSite(null);
        loadData();
      } else {
        setEditError(res.message || 'Failed to update installation.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Server error updating installation.');
    } finally {
      setUpdating(false);
    }
  };

  // 2. Doc Submit
  const handleOpenDocModal = (item: Row) => {
    if (isDocumentSubmitted(item)) return;
    setDocModalSite(item);
    setDocFile(null);
    setDocDate(new Date().toISOString().slice(0, 10));
    setDocRemarks('');
    setDocError(null);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalSite || !docFile) return;
    if (!docRemarks.trim()) {
      setDocError('Document remarks are required.');
      return;
    }
    setSubmittingDoc(true);
    setDocError(null);

    const fd = new FormData();
    const siteId = String(docModalSite.id);
    const remarks = docRemarks.trim();

    // Required by backend validator: resco_id, doc_file, doc_remarks
    fd.append('resco_id', siteId);
    fd.append('site_id', siteId);
    fd.append('id', siteId);

    fd.append('doc_file', docFile);
    fd.append('inst_doc_file', docFile);
    fd.append('document_file', docFile);

    fd.append('doc_remarks', remarks);
    fd.append('inst_doc_remarks', remarks);
    fd.append('remarks', remarks);

    fd.append('date', docDate);
    fd.append('doc_date', docDate);
    fd.append('inst_doc_date', docDate);

    try {
      const res = await upInstallationService.submitRescoDocument(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Installation document submitted successfully!' });
        setDocModalSite(null);
        setDocFile(null);
        setDocRemarks('');
        setDocError(null);
        loadData();
      } else {
        const errorDetails = res.errors
          ? Object.values(res.errors).flat().join(' ')
          : '';
        const errMsg = errorDetails || res.message || 'Failed to submit document.';
        setDocError(errMsg);
        setToastMsg({ type: 'danger', text: errMsg });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Server error uploading document.';
      setDocError(errMsg);
      setToastMsg({ type: 'danger', text: errMsg });
    } finally {
      setSubmittingDoc(false);
    }
  };

  // 3. Import Panel
  const handleOpenImportModal = (item: Row) => {
    setImportModalSite(item);
    setImportFile(null);
    setImportResult(null);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importModalSite || !importFile) return;
    setImportingPanels(true);
    setImportResult(null);

    const fd = new FormData();
    fd.append('id', String(importModalSite.id));
    fd.append('resco_id', String(importModalSite.id));
    fd.append('site_id', String(importModalSite.id));
    fd.append('import_file', importFile);
    fd.append('file', importFile);
    fd.append('panel_file', importFile);

    try {
      const res = await upInstallationService.importRescoPanels(fd);
      if (res.status) {
        setImportResult({
          success: true,
          text: res.message || 'Panels imported successfully!',
          duplicates: res.duplicates,
        });
        setToastMsg({ type: 'success', text: res.message || 'Panels imported successfully!' });
      } else {
        const errText = res.errors
          ? Object.values(res.errors).flat().join(' ')
          : res.message || 'Failed to import panels.';
        setImportResult({
          success: false,
          text: errText,
          duplicates: res.duplicates,
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        text: err?.message || 'Server error importing panels.',
      });
    } finally {
      setImportingPanels(false);
    }
  };

  // 4. View Panel
  const handleOpenViewPanel = async (item: Row) => {
    setViewPanelModalSite(item);
    setLoadingPanels(true);
    setPanelSearch('');
    setSitePanels([]);

    try {
      const res = await upInstallationService.getRescoPanels(item.id);
      setSitePanels(res.panels || []);
    } catch (err: any) {
      console.warn('Error loading panels:', err);
    } finally {
      setLoadingPanels(false);
    }
  };

  const filteredPanels = useMemo(() => {
    if (!panelSearch.trim()) return sitePanels;
    const q = panelSearch.toLowerCase();
    return sitePanels.filter((p) => (p.panel_no || '').toLowerCase().includes(q));
  }, [sitePanels, panelSearch]);

  const totalColumns = 25;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View UP Resco Installation"
        subtitle="Rooftop solar installation progress, metering equipment and site verification status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'UP Resco Installation' },
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
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/up/resco-install-site')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">+ Install Site</span>
            </button>
          </div>
        }
      />

      {/* Toast Alert */}
      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 Cards, Pure Numbers, NO "Nos.") ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="asw-cards-row">
          <KpiCard
            tone="accent"
            label="Total"
            value={summary.total.toLocaleString('en-IN')}
            sub="Total Assign"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
          />

          <KpiCard
            tone="cyan"
            label="Installation Status"
            value={`${summary.complete.toLocaleString('en-IN')} / ${summary.pending.toLocaleString('en-IN')}`}
            sub="Complete / Pending"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />

          <KpiCard
            tone="emerald"
            label="Verification Status"
            value={`${summary.vApp.toLocaleString('en-IN')} / ${summary.vPend.toLocaleString('en-IN')} / ${summary.vRej.toLocaleString('en-IN')}`}
            sub="Approved / Pending / Reject"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            }
          />

          <KpiCard
            tone="violet"
            label="Document Verify"
            value={`${summary.dApp.toLocaleString('en-IN')} / ${summary.dPend.toLocaleString('en-IN')} / ${summary.dRej.toLocaleString('en-IN')}`}
            sub="Approved / Pending / Reject"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
            }
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP Resco Installation Details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">UP Resco Installation</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> sites
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {uniqueDistricts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    aria-label="Filter by district"
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  >
                    <option value="all">All Districts</option>
                    {uniqueDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as VerifyFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="reject">Reject</option>
                </select>

                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search site, contact, meter…"
                  size="sm"
                  ariaLabel="Search installations"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          {/* ── Table (Exact 25 Columns in sequence) ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
              <caption className="ax-visually-hidden">UP Resco Installation Details</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Installation Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>System Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Inverter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Panel Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Net Meter/Smart Meter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Loger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document File</th>
                  <th className="ax-table__th" scope="col">Document Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 110 }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={totalColumns} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Resco installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={totalColumns} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={hasFilters ? 'No sites match your filters or search.' : errorMsg || undefined}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((item, idx) => {
                    const sr = (safePage - 1) * pageSize + idx + 1;
                    const docUrl = item.document_file ? resolveUpMediaUrl(item.document_file) : '';
                    const canEdit = !isVerifiedApproved(item);
                    const canSubmitDoc = !isDocumentSubmitted(item);

                    return (
                      <tr key={item.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{sr}</td>
                        <td className="ax-table__td">{txt(item.installation_date)}</td>
                        <td className="ax-table__td">{item.state ? item.state.toUpperCase() : 'UP'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>
                          <span style={{ cursor: 'pointer' }} onClick={() => setViewModal(item)} title="Click to view details">
                            {txt(item.site_name)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(item.contact_person)}</td>
                        <td className="ax-table__td">{txt(item.contact_number)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.solar_meter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.inverter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.net_smart_meter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.loger_no)}</td>

                        {/* Images with Square Corners */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <Thumb path={item.system_image} alt={`System Image — ${item.site_name || item.id}`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <Thumb path={item.inverter_image} alt={`Inverter Image — ${item.site_name || item.id}`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <Thumb path={item.panel_image} alt={`Panel Image — ${item.site_name || item.id}`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <Thumb path={item.net_meter_smart_meter_image} alt={`Net Meter/Smart Meter Image — ${item.site_name || item.id}`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <Thumb path={item.loger_image} alt={`Loger Image — ${item.site_name || item.id}`} onPreview={openPreview} />
                        </td>

                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.latitude)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.longitude)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(item.remark)}</td>

                        {/* Status Badges */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <VerifyStatusBadge value={item.verify_status} />
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(item.verify_remarks)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <DocStatusBadge value={item.document_status} />
                        </td>

                        {/* Document File */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {docUrl ? (
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--xs">View File</a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>No file available</span>
                          )}
                        </td>

                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(item.document_remarks)}</td>

                        {/* Action Dropdown */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RowActionDropdown
                            canEdit={canEdit}
                            canSubmitDoc={canSubmitDoc}
                            onEdit={() => handleOpenEdit(item)}
                            onSubmitDoc={() => handleOpenDocModal(item)}
                            onImportPanel={() => handleOpenImportModal(item)}
                            onViewPanel={() => handleOpenViewPanel(item)}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={safePage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Lightbox ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Site Detail Modal ── */}
      {viewModal && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-view-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setViewModal(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 680 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="resco-view-detail-title" style={{ fontSize: 15, fontWeight: 600 }}>
                Site Detail: {viewModal.site_name || `Site #${viewModal.id}`}
              </h2>
              <button type="button" className="ax-modal__close" onClick={() => setViewModal(null)} aria-label="Close dialog">{X_ICON}</button>
            </div>
            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{viewModal.state ? viewModal.state.toUpperCase() : 'UP'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(viewModal.district)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{txt(viewModal.site_name)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Installation Date:</span> <b>{txt(viewModal.installation_date)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Person:</span> <b>{txt(viewModal.contact_person)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Number:</span> <b>{txt(viewModal.contact_number)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Solar Meter No.:</span> <b>{txt(viewModal.solar_meter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Inverter No.:</span> <b>{txt(viewModal.inverter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Net/Smart Meter No.:</span> <b>{txt(viewModal.net_smart_meter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Loger No.:</span> <b>{txt(viewModal.loger_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{txt(viewModal.latitude)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{txt(viewModal.longitude)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Status:</span> <VerifyStatusBadge value={viewModal.verify_status} /></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Document Status:</span> <DocStatusBadge value={viewModal.document_status} /></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remark:</span> <b>{txt(viewModal.remark)}</b></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Verify Remarks:</span> <b>{txt(viewModal.verify_remarks)}</b></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Document Remarks:</span> <b>{txt(viewModal.document_remarks)}</b></div>
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>Photographs:</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'System', path: viewModal.system_image },
                    { label: 'Inverter', path: viewModal.inverter_image },
                    { label: 'Panel', path: viewModal.panel_image },
                    { label: 'Net Meter', path: viewModal.net_meter_smart_meter_image },
                    { label: 'Loger', path: viewModal.loger_image },
                  ].map((p) => (
                    <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Thumb path={p.path} alt={`${p.label} image`} onPreview={openPreview} />
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. Edit Modal ── */}
      {editModalSite && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-edit-title">
          <div className="ax-modal__backdrop" onClick={() => setEditModalSite(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 880, width: '95%' }}>
            <form onSubmit={handleEditSubmit}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="resco-edit-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    Edit UP Resco Installation
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Site: <b>{editModalSite.site_name}</b> (#{editModalSite.id})
                  </p>
                </div>
                <button type="button" className="ax-modal__close" onClick={() => setEditModalSite(null)} disabled={updating} aria-label="Close dialog">{X_ICON}</button>
              </div>

              <div className="ax-modal__body" style={{ padding: 20 }}>
                {editError && (
                  <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 12.5, fontWeight: 600, border: '1px solid #fecaca' }}>
                    {editError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Inverter No.</span><span className="ax-modern-req">*</span></label>
                    <input type="text" required className="ax-input" value={editInverterNo} onChange={(e) => setEditInverterNo(e.target.value)} />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Solar Meter No.</span><span className="ax-modern-req">*</span></label>
                    <input type="text" required className="ax-input" value={editSolarMeterNo} onChange={(e) => setEditSolarMeterNo(e.target.value)} />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Net/Smart Meter No.</span></label>
                    <input type="text" className="ax-input" value={editNetSmartMeterNo} onChange={(e) => setEditNetSmartMeterNo(e.target.value)} />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Loger No.</span></label>
                    <input type="text" className="ax-input" value={editLogerNo} onChange={(e) => setEditLogerNo(e.target.value)} />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Latitude</span><span className="ax-modern-req">*</span></label>
                    <input type="text" required className="ax-input" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label"><span>Longitude</span><span className="ax-modern-req">*</span></label>
                    <input type="text" required className="ax-input" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                  </div>

                  <div className="ax-modern-field" style={{ gridColumn: 'span 2' }}>
                    <label className="ax-modern-label"><span>Remark</span></label>
                    <input type="text" className="ax-input" value={editRemark} onChange={(e) => setEditRemark(e.target.value)} placeholder="Installation remarks…" />
                  </div>

                  {/* Installation Photo Evidence (matching uploaded design) */}
                  <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        Installation Photo Evidence
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                        Upload or replace clear photos of installed components (JPG or PNG, max 5MB each)
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      <FileUploadDropzone
                        id="edit-system-img"
                        label="1. Complete System Photo"
                        accept="image/*"
                        hint="JPG or PNG — single file"
                        file={editSystemImg}
                        existingUrl={existingPhotos.system}
                        onSelect={(f) => setEditSystemImg(f)}
                        onRemove={() => {
                          setEditSystemImg(null);
                          setExistingPhotos((p) => ({ ...p, system: null }));
                        }}
                      />
                      <FileUploadDropzone
                        id="edit-inverter-img"
                        label="2. Inverter Photo"
                        accept="image/*"
                        hint="JPG or PNG — single file"
                        file={editInverterImg}
                        existingUrl={existingPhotos.inverter}
                        onSelect={(f) => setEditInverterImg(f)}
                        onRemove={() => {
                          setEditInverterImg(null);
                          setExistingPhotos((p) => ({ ...p, inverter: null }));
                        }}
                      />
                      <FileUploadDropzone
                        id="edit-panel-img"
                        label="3. Panel Photo"
                        accept="image/*"
                        hint="JPG or PNG — single file"
                        file={editPanelImg}
                        existingUrl={existingPhotos.panel}
                        onSelect={(f) => setEditPanelImg(f)}
                        onRemove={() => {
                          setEditPanelImg(null);
                          setExistingPhotos((p) => ({ ...p, panel: null }));
                        }}
                      />
                      <FileUploadDropzone
                        id="edit-netmeter-img"
                        label="4. Net / Smart Meter Photo"
                        accept="image/*"
                        hint="JPG or PNG — single file"
                        file={editNetMeterImg}
                        existingUrl={existingPhotos.netMeter}
                        onSelect={(f) => setEditNetMeterImg(f)}
                        onRemove={() => {
                          setEditNetMeterImg(null);
                          setExistingPhotos((p) => ({ ...p, netMeter: null }));
                        }}
                      />
                      <FileUploadDropzone
                        id="edit-loger-img"
                        label="5. Datalogger Photo"
                        accept="image/*"
                        hint="JPG or PNG — single file"
                        file={editLogerImg}
                        existingUrl={existingPhotos.loger}
                        onSelect={(f) => setEditLogerImg(f)}
                        onRemove={() => {
                          setEditLogerImg(null);
                          setExistingPhotos((p) => ({ ...p, loger: null }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ax-modal__footer">
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setEditModalSite(null)} disabled={updating}>Cancel</button>
                <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={updating}>
                  {updating ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Doc Submit Modal ── */}
      {docModalSite && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-doc-title">
          <div className="ax-modal__backdrop" onClick={() => setDocModalSite(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 560, width: '95%' }}>
            <form onSubmit={handleDocSubmit}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="resco-doc-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    Submit Installation Document
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Site: <b>{docModalSite.site_name}</b> (#{docModalSite.id})
                  </p>
                </div>
                <button type="button" className="ax-modal__close" onClick={() => setDocModalSite(null)} disabled={submittingDoc} aria-label="Close dialog">{X_ICON}</button>
              </div>

              <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {docError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: 13,
                    }}
                  >
                    {docError}
                  </div>
                )}

                <div className="ax-modern-field">
                  <label className="ax-modern-label"><span>Document Date</span><span className="ax-modern-req">*</span></label>
                  <input type="date" required className="ax-input" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
                </div>

                <FileUploadDropzone
                  id="resco-doc-file"
                  label="Document File (PDF / Image)"
                  required
                  accept="application/pdf,image/*"
                  hint="PDF, JPG or PNG — single file"
                  file={docFile}
                  existingUrl={docModalSite.document_file}
                  onSelect={(file) => {
                    setDocFile(file);
                    if (docError) setDocError(null);
                  }}
                  onRemove={() => setDocFile(null)}
                  error={docError && !docFile ? docError : undefined}
                />

                <div className="ax-modern-field">
                  <label className="ax-modern-label"><span>Document Remarks</span><span className="ax-modern-req">*</span></label>
                  <input
                    type="text"
                    required
                    className="ax-input"
                    value={docRemarks}
                    onChange={(e) => {
                      setDocRemarks(e.target.value);
                      if (docError) setDocError(null);
                    }}
                    placeholder="Enter document remarks…"
                  />
                </div>
              </div>

              <div className="ax-modal__footer">
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDocModalSite(null)} disabled={submittingDoc}>Cancel</button>
                <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={submittingDoc || !docFile || !docRemarks.trim()}>
                  {submittingDoc ? 'Uploading…' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Import Panel Modal ── */}
      {importModalSite && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-import-title">
          <div className="ax-modal__backdrop" onClick={() => setImportModalSite(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 560, width: '95%' }}>
            <form onSubmit={handleImportSubmit}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="resco-import-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    Import Panels (Excel / CSV)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Site: <b>{importModalSite.site_name}</b> (#{importModalSite.id})
                  </p>
                </div>
                <button type="button" className="ax-modal__close" onClick={() => setImportModalSite(null)} disabled={importingPanels} aria-label="Close dialog">{X_ICON}</button>
              </div>

              <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
                  Upload an Excel (.xlsx, .xls) or CSV file containing solar panel serial numbers. First column header should be <strong>Panel No</strong>.
                </div>

                <FileUploadDropzone
                  id="resco-import-file"
                  label="Select Excel / CSV File"
                  required
                  accept=".xlsx,.xls,.csv"
                  hint="Excel (.xlsx, .xls) or CSV — single file"
                  file={importFile}
                  onSelect={(file) => {
                    setImportFile(file);
                    setImportResult(null);
                  }}
                  onRemove={() => setImportFile(null)}
                />

                {importResult && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: importResult.success ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${importResult.success ? '#86efac' : '#fecaca'}`,
                      color: importResult.success ? '#15803d' : '#991b1b',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    <div>{importResult.text}</div>
                    {importResult.duplicates && importResult.duplicates.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11.5, color: '#b45309' }}>
                        Duplicates skipped: {importResult.duplicates.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ax-modal__footer">
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setImportModalSite(null)} disabled={importingPanels}>Close</button>
                <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={importingPanels || !importFile}>
                  {importingPanels ? 'Importing…' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. View Panel Modal ── */}
      {viewPanelModalSite && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-panels-title">
          <div className="ax-modal__backdrop" onClick={() => setViewPanelModalSite(null)} />
          <div className="ax-modal__dialog ax-modal__dialog--md">
            <div className="ax-modal__header">
              <div>
                <h3 id="resco-panels-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Installed Panels List
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Site: <b>{viewPanelModalSite.site_name}</b> (#{viewPanelModalSite.id}) · Total: <b>{sitePanels.length}</b> panels
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setViewPanelModalSite(null)} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <SearchInput
                  value={panelSearch}
                  onChange={setPanelSearch}
                  placeholder="Search panel serial number…"
                  size="sm"
                  ariaLabel="Search panel numbers"
                />
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => {
                    const text = sitePanels.map((p, i) => `${i + 1}\t${p.panel_no}`).join('\n');
                    navigator.clipboard.writeText(text);
                    setToastMsg({ type: 'success', text: 'Panel numbers copied to clipboard!' });
                  }}
                  disabled={sitePanels.length === 0}
                >
                  Copy List
                </button>
              </div>

              {loadingPanels ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: 'middle' }} />
                  Loading panels…
                </div>
              ) : filteredPanels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--ax-text-muted)', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  {sitePanels.length === 0 ? 'No panels imported yet for this site.' : 'No panel matches your search.'}
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8 }}>
                  <table className="ax-table ax-table--sm" style={{ width: '100%', whiteSpace: 'nowrap', margin: 0 }}>
                    <thead className="ax-table__head" style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <tr>
                        <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                        <th className="ax-table__th">Panel Serial Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPanels.map((panel, pIdx) => (
                        <tr key={panel.id || pIdx} className="ax-table__row">
                          <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{pIdx + 1}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{panel.panel_no}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => {
                  setViewPanelModalSite(null);
                  handleOpenImportModal(viewPanelModalSite);
                }}
              >
                + Import More Panels
              </button>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setViewPanelModalSite(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UP_Installation_Resco_InstallationDetail;
