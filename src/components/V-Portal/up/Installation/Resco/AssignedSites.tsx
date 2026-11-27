import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
  type UpRescoAssignSiteItem,
} from '../../up-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Responsive Page CSS (Exact Kusum-C / Karnataka SWP Pattern) ───────── */
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

  /* All table columns fully scrollable horizontally */
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
`;

/* ───────── Overlay CSS (modals & lightbox) ───────── */
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

const DASH = '—';
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
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`} style={{ fontWeight: 600 }}>{children}</span>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

/* ───────── Top Metric KPI Card Component ───────── */
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

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 780,
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Modern Image Placeholder & Interactive Lightbox ── */
function ImagePlaceholder({
  size = 36,
  label = 'No photo uploaded',
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

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_STEPS[zoomIdx];

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 100000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{ maxWidth: 840, width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title || 'Image Preview'}</h3>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div
          className="ax-modal__body"
          style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            overflow: 'auto',
            minHeight: 360,
          }}
        >
          <img
            src={url}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '65vh',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          />
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              −
            </button>
            <span style={{ fontSize: 12, minWidth: 44, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              +
            </button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
              Open in new tab ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getUpMediaCandidates(src), [src]);
  const [candIdx, setCandIdx] = useState(0);

  useEffect(() => {
    setCandIdx(0);
  }, [src]);

  if (!src || candidates.length === 0 || candIdx >= candidates.length) {
    return <ImagePlaceholder size={size} label={`No image — ${alt}`} />;
  }

  const currentUrl = candidates[candIdx];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        margin: '0 auto',
      }}
    >
      <img
        src={currentUrl}
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
        onError={() => setCandIdx((prev) => prev + 1)}
        onClick={() => onPreview(currentUrl, alt)}
        title="Click to preview photograph"
      />
    </div>
  );
}

/* ── Helpers for Parsing & Display ── */
const fmtState = (s?: string | null): string => {
  const clean = (s || '').trim();
  if (!clean) return 'UP';
  if (clean.toLowerCase() === 'uttar pradesh') return 'UP';
  return clean.toUpperCase();
};

const fmtDate = (d?: string | null) => {
  if (!d) return DASH;
  try {
    const cleanStr = String(d).trim().replace(' ', 'T');
    const dt = new Date(cleanStr);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  const datePart = String(d).trim().split(/[ T]/)[0];
  const [y, m, day] = datePart.split('-');
  return y && m && day ? `${day}-${m}-${y}` : datePart;
};

const isImage = (url?: string | null) =>
  Boolean(url && /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(String(url)));

const getFileExt = (url?: string | null) => {
  if (!url) return 'FILE';
  const clean = url.split('?')[0];
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  return ext ? ext.toUpperCase() : 'FILE';
};

const resolveFileUrl = (file?: string | null) => {
  if (!file) return '';
  if (/^https?:\/\//i.test(file)) return file;
  return resolveUpMediaUrl(file) || '';
};

function getSiteEntries(item: UpRescoAssignSiteItem | null | undefined): [string, string][] {
  if (!item || !item.site_name) return [];
  let data: any = item.site_name;
  if (typeof data === 'string' && data.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        data = parsed;
      }
    } catch {
      // not JSON
    }
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).map(([k, v]) => [k.trim(), String(v || '')]);
  }
  if (typeof data === 'string' && data.trim()) {
    return [[data.trim(), item.deadline || '']];
  }
  return [];
}

function getSiteCount(item: UpRescoAssignSiteItem): number {
  if (item.sitecount !== undefined && item.sitecount !== null && item.sitecount !== '') {
    const n = Number(item.sitecount);
    if (!isNaN(n) && n > 0) return n;
  }
  if (item.count !== undefined && item.count !== null) {
    const n = Number(item.count);
    if (!isNaN(n) && n > 0) return n;
  }
  const entries = getSiteEntries(item);
  if (entries.length > 0) return entries.length;
  return 1;
}

function getDeadlineDate(item: UpRescoAssignSiteItem | null | undefined): string {
  if (!item) return '';
  if (item.deadline) return item.deadline;
  const entries = getSiteEntries(item);
  if (entries.length > 0) {
    const withDeadline = entries.find(([, dl]) => dl && dl.trim() !== '');
    if (withDeadline) return withDeadline[1];
  }
  return '';
}

function getVendorLabel(item: UpRescoAssignSiteItem | null | undefined): string {
  if (!item) return DASH;
  return item.vendors?.name || item.vendor || `Vendor #${item.vendor_id || item.id}`;
}

function getSitesSummaryText(item: UpRescoAssignSiteItem): string {
  const entries = getSiteEntries(item);
  if (entries.length > 0) {
    return entries.map(([name, dl]) => (dl ? `${name} (${fmtDate(dl)})` : name)).join(', ');
  }
  return typeof item.site_name === 'string' ? item.site_name : '';
}

const getImageForSite = (item: any): string | null => {
  if (!item) return null;
  const candidates = [
    item.image,
    item.photo,
    item.site_image,
    item.building_image,
    item.roof_image,
    item.panel_no_file,
    item.file,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && isImage(c)) {
      return c.trim();
    }
  }
  return null;
};

const isAcceptedStatus = (s: any) => Number(s) === 2 || String(s) === '2';

/* ═════════════════════════════════════════════════════════════════
 * MAIN COMPONENT: UP RESCO ASSIGNED SITES
 * ═════════════════════════════════════════════════════════════════ */
export function UP_Installation_Resco_AssignedSites() {
  const [records, setRecords] = useState<UpRescoAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Accept notification feedback
  const [acceptSuccessMsg, setAcceptSuccessMsg] = useState<string | null>(null);
  const [acceptErrorMsg, setAcceptErrorMsg] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | string | null>(null);

  // Assignment Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<UpRescoAssignSiteItem | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Interactive Lightbox Modal
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => {
    setLightbox({ url, title });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await upInstallationService.getRescoAssignSites();
      const list = Array.isArray(res?.data) ? res.data : [];
      setRecords(list.map((r) => ({ ...r, status: Number(r.status) || 0 })));
    } catch (err: any) {
      console.warn('Error loading Resco assignments:', err);
      setError(err?.message || 'Failed to load assigned Resco sites.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!acceptSuccessMsg && !acceptErrorMsg) return;
    const t = window.setTimeout(() => {
      setAcceptSuccessMsg(null);
      setAcceptErrorMsg(null);
    }, 4500);
    return () => window.clearTimeout(t);
  }, [acceptSuccessMsg, acceptErrorMsg]);

  // Handle Accept
  const handleAccept = async (item: UpRescoAssignSiteItem) => {
    const id = item.id;
    setAcceptingId(id);
    setAcceptSuccessMsg(null);
    setAcceptErrorMsg(null);
    try {
      const res = await upInstallationService.acceptRescoAssignment(id);
      if (res?.status) {
        setAcceptSuccessMsg(res.message || `Site allocation #${id} accepted successfully! Ready for installation.`);
        setRecords((prev) => prev.map((b) => (b.id === id ? { ...b, status: 2 } : b)));
        if (activeItem && activeItem.id === id) {
          setActiveItem((prev) => (prev ? { ...prev, status: 2 } : prev));
        }
        return true;
      } else {
        setAcceptErrorMsg(res?.message || `Failed to accept site allocation #${id}.`);
        return false;
      }
    } catch (err: any) {
      console.error('Error accepting Resco assignment:', err);
      setAcceptErrorMsg(err?.message || 'Error occurred while accepting assignment.');
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // Open Details Modal (View Button Handler)
  const handleViewDetail = async (item: UpRescoAssignSiteItem) => {
    setActiveItem(item);
    setDetailData(item);
    setDetailModalOpen(true);
    setModalSearch('');
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await upInstallationService.getRescoAssignDetail(item.id);
      if (res && res.data) {
        setDetailData(res.data);
      }
    } catch (e: any) {
      console.warn('Error fetching Resco assign detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Distinct districts
  const districtList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((b) => {
      if (b.district && b.district.trim()) {
        set.add(b.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Metric counts matching Kusum-C / Karnataka SWP layout
  const totalAssignments = records.length;
  const acceptedCount = records.filter((item) => isAcceptedStatus(item.status)).length;
  const pendingAcceptance = totalAssignments - acceptedCount;
  const totalSitesCount = useMemo(() => {
    return records.reduce((acc, item) => acc + getSiteCount(item), 0);
  }, [records]);

  // Filtering
  const filtered = useMemo(() => {
    return records.filter((item) => {
      const isAccepted = isAcceptedStatus(item.status);
      if (statusFilter === 'pending' && isAccepted) return false;
      if (statusFilter === 'accepted' && !isAccepted) return false;

      if (selectedDistrict !== 'all') {
        const d = (item.district || '').trim().toLowerCase();
        if (d !== selectedDistrict.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const idStr = String(item.id);
        const vendStr = getVendorLabel(item).toLowerCase();
        const distStr = String(item.district || '').toLowerCase();
        const siteStr = getSitesSummaryText(item).toLowerCase();
        const remarksStr = String(item.remarks || '').toLowerCase();
        const assignDateStr = String(item.assign_date || '').toLowerCase();
        const deadlineDateStr = String(getDeadlineDate(item) || '').toLowerCase();

        if (
          !idStr.includes(q) &&
          !vendStr.includes(q) &&
          !distStr.includes(q) &&
          !siteStr.includes(q) &&
          !remarksStr.includes(q) &&
          !assignDateStr.includes(q) &&
          !deadlineDateStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [records, statusFilter, selectedDistrict, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || selectedDistrict !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  // Modal Table Filtering
  const modalSiteEntries = useMemo(() => {
    const entries = getSiteEntries(detailData || activeItem);
    if (!modalSearch.trim()) return entries;
    const q = modalSearch.toLowerCase();
    return entries.filter(([name, dl]) => {
      return name.toLowerCase().includes(q) || dl.toLowerCase().includes(q);
    });
  }, [detailData, activeItem, modalSearch]);

  const exportCols: ExportColumn<UpRescoAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Batch ID', accessor: (r) => String(r.id) },
      { header: 'Vendor', accessor: (r) => getVendorLabel(r) },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => fmtState(r.state) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Sites & Deadlines', accessor: (r) => getSitesSummaryText(r) },
      { header: 'Count', accessor: (r) => String(getSiteCount(r)) },
      { header: 'Deadline Date', accessor: (r) => fmtDate(getDeadlineDate(r)) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (isAcceptedStatus(r.status) ? 'Accepted' : 'Pending Accept') },
    ],
    []
  );

  const headers = [
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Site Name - Deadline',
    'Count',
    'Deadline Date',
    'File',
    'View',
    'Remarks',
    'Status',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (matching reference pattern) ── */}
      <PageHead
        title="Assigned Sites"
        subtitle="Manage and accept RESCO rooftop solar installation site allocations in Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'RESCO', href: '/v/up/resco-installation-dashboard' },
          { label: 'Assigned Sites' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh assignments"
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Installation Site</span>
            </Link>
          </div>
        }
      />

      {/* Success notification */}
      {acceptSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title" style={{ fontSize: '14px', fontWeight: 600 }}>Success</div>
          <div className="ax-alert__text" style={{ fontSize: '13px' }}>{acceptSuccessMsg}</div>
        </div>
      )}

      {/* Error notification */}
      {acceptErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title" style={{ fontSize: '14px', fontWeight: 600 }}>Accept Error</div>
          <div className="ax-alert__text" style={{ fontSize: '13px' }}>{acceptErrorMsg}</div>
        </div>
      )}

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title" style={{ fontSize: '14px', fontWeight: 600 }}>Error Loading Assignments</div>
          <div className="ax-alert__text" style={{ fontSize: '13px' }}>{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row matching Kusum-C pattern) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assignments"
          value={totalAssignments.toLocaleString('en-IN')}
          sub={`${acceptedCount} accepted · ${pendingAcceptance} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Acceptance"
          value={pendingAcceptance.toLocaleString('en-IN')}
          sub="Action required by vendor"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Batches"
          value={acceptedCount.toLocaleString('en-IN')}
          sub="Accepted & ready to install"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Total Allocated Sites"
          value={totalSitesCount.toLocaleString('en-IN')}
          sub="Cumulative RESCO rooftop sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact reference layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Sites">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Installation Batches</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> assignments
              {' '}· Accepted <b className="ax-num">{acceptedCount}</b> · Pending <b className="ax-num">{pendingAcceptance}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtList.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                id="up_resco_assigned_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                aria-label="Filter by assignment status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Accept</option>
                <option value="accepted">Accepted</option>
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
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search vendor, district, site…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('UP_Resco_Assigned_Sites', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('UP_Resco_Assigned_Sites', filtered, exportCols)}
                onExportPDF={() => printTableData('UP Resco Assigned Installation Sites', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: 1550 }}
          >
            <caption className="ax-visually-hidden">Assigned Installation Batches</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action'
                        ? { textAlign: 'right' }
                        : h === 'Count' || h === 'View' || h === 'File' || h === 'Image' || h === 'Sr. No.'
                        ? { textAlign: 'center' }
                        : h === 'Vendor'
                        ? { minWidth: 220, maxWidth: 280, width: 250 }
                        : h === 'Site Name - Deadline'
                        ? { minWidth: 240, maxWidth: 340, width: 280 }
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned batches from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No installation assignments found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No installation batches have been assigned yet by the administration.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((item, index) => {
                  const isAccepted = isAcceptedStatus(item.status);
                  const count = getSiteCount(item);
                  const entries = getSiteEntries(item);
                  const deadlineDate = getDeadlineDate(item);
                  const vendorLabel = getVendorLabel(item);
                  const fileUrl = resolveFileUrl(item.file);
                  const fileExt = getFileExt(item.file);
                  const imageSrc = getImageForSite(item);

                  return (
                    <tr key={item.id} className="ax-table__row">
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Vendor */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 220, maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)', wordBreak: 'break-word' }}>
                          {item.vendor ? (
                            <>
                               {item.vendor}
                            
                            </>
                          ) : (
                            vendorLabel
                          )}
                        </div>
                     
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(item.assign_date || item.created_at)}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {fmtState(item.state)}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <b>{item.district || DASH}</b>
                        {item.volume && (
                          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            Vol: {item.volume} kW
                          </div>
                        )}
                      </td>

                      {/* 6. Site Name - Deadline */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 240, maxWidth: 340, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {entries.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {entries.slice(0, 2).map(([site, dl], i) => (
                              <div key={i} style={{ fontSize: '12px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                <b style={{ color: 'var(--ax-text-strong)' }}>{site}</b>
                                {dl && (
                                  <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginLeft: 4 }}>
                                    (Deadline: {fmtDate(dl)})
                                  </span>
                                )}
                              </div>
                            ))}
                            {entries.length > 2 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                                  +{entries.length - 2} more
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleViewDetail(item)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontSize: '11px',
                                    color: 'var(--asw-primary, #2563eb)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontWeight: 500,
                                  }}
                                >
                                  View all &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        ) : typeof item.site_name === 'string' && item.site_name.trim() ? (
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {item.site_name}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>{DASH}</span>
                        )}
                      </td>

                      {/* 7. Count */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 700 }}>
                          {count}
                        </span>
                      </td>

                      {/* 8. Deadline Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(deadlineDate)}
                      </td>

                      {/* 9. File (Thumbnail if Image, else File Link) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {imageSrc || (item.file && isImage(item.file)) ? (
                          <InstallationThumbnail
                            src={imageSrc || item.file}
                            alt={`${vendorLabel} - File Photo`}
                            onPreview={openPreview}
                            size={36}
                          />
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ color: 'var(--asw-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download Assigned Site File"
                          >
                            📎 {fileExt} ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* 11. View Button (Requested by User) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => handleViewDetail(item)}
                        >
                          View
                        </button>
                      </td>

                      {/* 12. Remarks */}
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 160, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={item.remarks || ''}
                      >
                        {item.remarks || DASH}
                      </td>

                      {/* 13. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isAccepted ? (
                          <Badge tone="success">✓ Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>

                      {/* 14. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleAccept(item)}
                              disabled={acceptingId === item.id}
                            >
                              {acceptingId === item.id ? 'Accepting…' : 'Accept'}
                            </button>
                          ) : (
                            <Badge tone="success">✓ Done</Badge>
                          )}
                        </div>
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
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Assignment Details Modal (Exact Kusum-C SWP Modal Pattern) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details · #${activeItem.id}` : 'Assignment Details'}
        subtitle="Individual rooftop solar site allocation and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isAcceptedStatus(activeItem.status) ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={async () => {
                  const ok = await handleAccept(activeItem);
                  if (ok) setDetailModalOpen(false);
                }}
                disabled={acceptingId === activeItem.id}
              >
                {acceptingId === activeItem.id ? 'Accepting…' : 'Accept Assignment'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
            </div>
          )
        }
      >
        {detailLoading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <span className="ax-spinner" />
            <p style={{ marginTop: 8, color: 'var(--ax-text-muted)' }}>Fetching site details from server...</p>
          </div>
        ) : detailError ? (
          <div className="ax-alert ax-alert--danger">
            {detailError}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Top metadata info card */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                padding: '12px 18px',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                borderRadius: 8,
                border: '1px solid var(--ax-border, #e2e8f0)',
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span>
                <b>{getVendorLabel(activeItem)}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>District: </span>
                <b>{activeItem?.district || DASH}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>State: </span>
                <b>{fmtState(activeItem?.state)}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span>
                <b>{fmtDate(activeItem?.assign_date || activeItem?.created_at)}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Deadline: </span>
                <b>{fmtDate(getDeadlineDate(activeItem))}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
                <Badge tone={isAcceptedStatus(activeItem?.status) ? 'success' : 'warning'}>
                  {isAcceptedStatus(activeItem?.status) ? '✓ Accepted' : 'Pending Accept'}
                </Badge>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Total Sites: </span>
                <b style={{ color: 'var(--asw-primary)' }}>{activeItem ? getSiteCount(activeItem) : 0}</b>
              </div>
            </div>

            {/* Search filter above the popup table */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label
                htmlFor="modal_resco_search"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}
              >
                Search:
              </label>
              <input
                id="modal_resco_search"
                type="text"
                className="ax-input ax-input--sm"
                style={{ width: 280, height: 32 }}
                placeholder="Search site name, deadline…"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
              {modalSearch && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setModalSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Popup Table: Sr. No., Site ID, Site Name, State, District, Deadline Date, Image */}
            <div className="ax-table-wrap" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ textAlign: 'center', width: 50 }}>Sr. No.</th>
                    <th className="ax-table__th">Site ID</th>
                    <th className="ax-table__th">Site Name</th>
                    <th className="ax-table__th">State</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Deadline Date</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Image</th>
                  </tr>
                </thead>
                <tbody className="ax-table__body">
                  {modalSiteEntries.map(([siteName, dl], idx) => {
                    const isNumeric = /^\d+$/.test(siteName.trim());
                    const targetId = isNumeric ? siteName.trim() : (activeItem?.resco_id || activeItem?.site_id || activeItem?.id);
                    const imageSrc = getImageForSite(activeItem);

                    return (
                      <tr key={idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                          {idx + 1}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          #{targetId}
                        </td>
                        <td className="ax-table__td">
                          <strong style={{ color: 'var(--ax-text-strong)' }}>{siteName}</strong>
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {(activeItem?.state || 'UP').toUpperCase()}
                        </td>
                        <td className="ax-table__td">
                          <b>{activeItem?.district || DASH}</b>
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px' }}>
                          {fmtDate(dl || getDeadlineDate(activeItem))}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallationThumbnail
                            src={imageSrc}
                            alt={`${siteName} Photo`}
                            onPreview={openPreview}
                            size={34}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {modalSiteEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="ax-table__td" style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' }}>
                        No specific site detail entries found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Interactive Lightbox Modal ── */}
      {lightbox && (
        <ImagePreviewModal
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default UP_Installation_Resco_AssignedSites;
