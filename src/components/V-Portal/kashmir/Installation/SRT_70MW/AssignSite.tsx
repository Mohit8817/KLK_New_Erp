import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
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
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  getKashmirMediaCandidates,
  type KashmirAssignSiteItem,
} from '../../kashmir-services';

/* ───────── Responsive page CSS (Exact UP RESCO / Karnataka SWP style) ───────── */
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
const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

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
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ width: 18, height: 18 }}
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

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
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Modern Image Placeholder & Interactive Lightbox (Matching UP RESCO pattern) ── */
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
  const candidates = useMemo(() => getKashmirMediaCandidates(src), [src]);
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

/* ── Top Metric KPI Card Component (matching UP RESCO pattern) ── */
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

// Helper to extract numeric assignment ID
const getAssignId = (item?: any): number => {
  if (!item) return 0;
  if (typeof item === 'number') return Number.isFinite(item) && item > 0 ? Math.floor(item) : 0;
  if (typeof item === 'string') {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  const candidate =
    item.assign_srt?.id ??
    item.assign_id ??
    item.assignment_id ??
    item.id;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
};

// Date formatter
const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  try {
    const cleanStr = String(val).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
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
  return getKashmirMediaUrl(file) || '';
};

// Site list extractor for batch
const getBatchSites = (item: KashmirAssignSiteItem): any[] => {
  if (Array.isArray(item.jammu_srt70mws) && item.jammu_srt70mws.length > 0) {
    return item.jammu_srt70mws;
  }
  const raw = item.assign_srt?.site_name;
  if (Array.isArray(raw)) {
    return raw.map((s) => ({ id: s, site_name: `Site #${s}` }));
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s, idx) => (typeof s === 'object' ? s : { id: idx + 1, site_name: String(s) }));
      }
    } catch {}
    if (raw.includes(',')) {
      return raw.split(',').map((s, idx) => ({ id: idx + 1, site_name: s.trim() }));
    }
    return [{ id: 1, site_name: raw }];
  }
  return [{ id: item.assign_srt?.id || 1, site_name: `Site #${item.assign_srt?.id || 1}` }];
};

// Site count helper
const getSiteCount = (item: KashmirAssignSiteItem): number => {
  const n = Number(item.assign_srt?.sitecount);
  if (!isNaN(n) && n > 0) return n;
  if (item.jammu_srt70mws?.length) return item.jammu_srt70mws.length;
  const sites = getBatchSites(item);
  return sites.length;
};

// Check if site batch is accepted
const isSiteAccepted = (item: KashmirAssignSiteItem): boolean => {
  const status = item.assign_srt?.status ?? (item as any).status;
  return Number(status) === 2 || String(status) === '2' || String(status).toLowerCase() === 'accepted';
};

const getDeadlineDate = (item: KashmirAssignSiteItem | null | undefined): string => {
  if (!item) return '';
  if (item.jammu_srt70mws?.[0]?.inst_deadline) return item.jammu_srt70mws[0].inst_deadline;
  if (item.assign_srt?.deadline_date) return item.assign_srt.deadline_date;
  const list = getBatchSites(item);
  const found = list.find((s) => s.inst_deadline || s.deadline_date);
  return found?.inst_deadline || found?.deadline_date || '';
};

const getSitesSummaryText = (item: KashmirAssignSiteItem): string => {
  const sites = getBatchSites(item);
  if (sites.length > 0) {
    return sites
      .map((s) => {
        const dl = s.inst_deadline || s.deadline_date;
        return dl ? `${s.site_name || `Site #${s.id}`} (${fmtDate(dl)})` : s.site_name || `Site #${s.id}`;
      })
      .join(', ');
  }
  return typeof item.assign_srt?.site_name === 'string' ? item.assign_srt.site_name : '';
};

// Vendor Name Helper (extracts name from assign_srt.vendors.name per API)
const getVendorName = (item: KashmirAssignSiteItem | null | undefined): string => {
  if (!item) return '';
  const a = item.assign_srt || ({} as any);
  const vObj = a.vendors || (item as any).vendors || a.vendor || (item as any).vendor;
  if (vObj && typeof vObj === 'object') {
    if (Array.isArray(vObj) && vObj[0]?.name) return String(vObj[0].name).trim();
    if (vObj.name) return String(vObj.name).trim();
  }
  const direct =
    item.vendor_name ||
    a.vendor_name ||
    (typeof a.vendor === 'string' && isNaN(Number(a.vendor)) ? a.vendor : '');
  return String(direct || '').trim();
};

export function Kashmir_Installation_AssignSite() {
  const [data, setData] = useState<KashmirAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Details Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<KashmirAssignSiteItem | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Interactive Lightbox state
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => {
    setLightbox({ url, title });
  }, []);

  // Accept Action state
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptSuccessMsg, setAcceptSuccessMsg] = useState<string | null>(null);
  const [acceptErrorMsg, setAcceptErrorMsg] = useState<string | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await kashmirSrtService.getAssignSites();
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load Kashmir assigned installation sites:', err);
      setError(err?.message || 'Failed to load assigned installation sites from server');
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

  // Handle View Details
  const handleViewDetail = (item: KashmirAssignSiteItem) => {
    setActiveItem(item);
    setModalSearch('');
    setDetailModalOpen(true);
  };

  // Handle Accept
  const handleAccept = async (item: KashmirAssignSiteItem): Promise<boolean> => {
    const aId = getAssignId(item);
    if (!aId || acceptingId !== null) return false;
    if (!window.confirm(`Are you sure you want to accept Assignment Batch #${aId}?`)) return false;

    setAcceptingId(aId);
    setAcceptErrorMsg(null);
    setAcceptSuccessMsg(null);
    try {
      const res = await kashmirSrtService.acceptAssignment(aId);
      setAcceptSuccessMsg(res.message || 'Status Updated Successfully!!!');
      setData((prev) =>
        prev.map((r) =>
          getAssignId(r) === aId
            ? { ...r, assign_srt: { ...r.assign_srt, status: 2 } }
            : r
        )
      );
      if (activeItem && getAssignId(activeItem) === aId) {
        setActiveItem((prev) =>
          prev ? { ...prev, assign_srt: { ...prev.assign_srt, status: 2 } } : null
        );
      }
      return true;
    } catch (err: any) {
      setAcceptErrorMsg(err?.message || 'Failed to accept assignment batch.');
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // KPI Metrics
  const summary = useMemo(() => {
    const accepted = data.filter((r) => isSiteAccepted(r)).length;
    return {
      total: data.length,
      accepted,
      pending: data.length - accepted,
    };
  }, [data]);

  const totalSitesCount = useMemo(() => {
    return data.reduce((sum, r) => sum + getSiteCount(r), 0);
  }, [data]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = r.assign_srt?.district;
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const a = r.assign_srt || ({} as any);
      const accepted = isSiteAccepted(r);
      const vName = getVendorName(r).toLowerCase();

      if (statusFilter === 'pending' && accepted) return false;
      if (statusFilter === 'accepted' && !accepted) return false;

      if (districtFilter !== 'all' && (a.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(a.id || '').includes(q) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.state && a.state.toLowerCase().includes(q)) ||
        (vName && vName.includes(q)) ||
        (a.remarks && String(a.remarks).toLowerCase().includes(q)) ||
        (r.jammu_srt70mws && r.jammu_srt70mws.some((s) => s.site_name?.toLowerCase().includes(q)))
      );
    });
  }, [data, search, districtFilter, statusFilter]);

  const totalItems = filtered.length;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Filtered sites inside Details Modal
  const modalSites = useMemo(() => {
    if (!activeItem) return [];
    return getBatchSites(activeItem);
  }, [activeItem]);

  const filteredModalSites = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return modalSites;
    return modalSites.filter((s: any) => {
      const name = (s.site_name || s.name || '').toLowerCase();
      const sId = String(s.id || '').toLowerCase();
      const deadline = (s.inst_deadline || s.deadline_date || '').toLowerCase();
      const dist = (s.district || activeItem?.assign_srt?.district || '').toLowerCase();
      return name.includes(q) || sId.includes(q) || deadline.includes(q) || dist.includes(q);
    });
  }, [modalSites, modalSearch, activeItem]);

  // Export Columns (11 Columns matching UP RESCO table headers)
  const exportCols: ExportColumn<KashmirAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Batch ID', accessor: (r) => String(r.assign_srt?.id || '') },
      { header: 'Vendor', accessor: (r) => getVendorName(r) || DASH },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_srt?.assign_date || r.assign_srt?.created_at) },
      { header: 'State', accessor: (r) => (r.assign_srt?.state || 'Kashmir').toUpperCase() },
      { header: 'District', accessor: (r) => r.assign_srt?.district || DASH },
      { header: 'Sites & Deadlines', accessor: (r) => getSitesSummaryText(r) },
      { header: 'Count', accessor: (r) => String(getSiteCount(r)) },
      { header: 'Deadline Date', accessor: (r) => fmtDate(getDeadlineDate(r)) },
      { header: 'Remarks', accessor: (r) => r.assign_srt?.remarks || DASH },
      { header: 'Status', accessor: (r) => (isSiteAccepted(r) ? 'Accepted' : 'Pending Accept') },
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
        title="View Assigned SRT Installation"
        subtitle="Manage assigned installation batches and accept assignments for site execution in Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW', href: '/v/kashmir/srt/70mw/installation/dashboard' },
          { label: 'View Assigned SRT Installation' },
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
            <Link to="/v/kashmir/srt/70mw/installation/site" className="ax-btn ax-btn--primary ax-btn--sm">
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

      {/* ── Top Metric KPI Cards (4 cards in 1 row matching reference pattern) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assignments"
          value={summary.total.toLocaleString('en-IN')}
          sub={districtFilter !== 'all' ? `Filtered in ${districtFilter}` : `${summary.accepted} accepted · ${summary.pending} pending`}
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
          value={summary.pending.toLocaleString('en-IN')}
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
          value={summary.accepted.toLocaleString('en-IN')}
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
          sub="Cumulative SRT installation sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
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
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> assignments
              {' '}· Accepted <b className="ax-num">{summary.accepted}</b> · Pending <b className="ax-num">{summary.pending}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  id="kash_dist_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                id="kash_req_filter"
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
                onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                placeholder="Search vendor, site, ID…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('Kashmir_Assigned_Batches', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('Kashmir_Assigned_Batches', filtered, exportCols)}
                onExportPDF={() => printTableData('Assigned SRT Installation Batches', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
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
                        ? { textAlign: 'right', minWidth: 140 }
                        : h === 'Count' || h === 'View' || h === 'File' || h === 'Sr. No.' || h === 'Status'
                        ? { textAlign: 'center' }
                        : h === 'Vendor'
                        ? { minWidth: 220, maxWidth: 280, width: 250 }
                        : h === 'Site Name - Deadline'
                        ? { minWidth: 260, maxWidth: 360, width: 300 }
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
                  const a = item.assign_srt || ({} as any);
                  const isAccepted = isSiteAccepted(item);
                  const count = getSiteCount(item);
                  const sitesList = getBatchSites(item);
                  const deadlineDate = getDeadlineDate(item);
                  const fileUrl = resolveFileUrl(a.file);
                  const fileExt = getFileExt(a.file);
                  const vendorName = getVendorName(item);
                  const vendorLabel = vendorName || DASH;

                  return (
                    <tr key={a.id || index} className="ax-table__row">
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
                          {vendorName || DASH}
                        </div>
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(a.assign_date || a.created_at)}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {(a.state || 'Kashmir').toUpperCase()}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <b>{a.district || DASH}</b>
                        {a.volume && (
                          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            Vol: {a.volume}
                          </div>
                        )}
                      </td>

                      {/* 6. Site Name - Deadline */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 260, maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {sitesList.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {sitesList.slice(0, 2).map((s: any, i: number) => {
                              const deadlineStr = s.inst_deadline || a.deadline_date;
                              return (
                                <div key={i} style={{ fontSize: '12px', lineHeight: 1.35 }}>
                                  <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                                    {s.site_name || `Site #${s.id || i + 1}`}
                                  </span>
                                  {deadlineStr && (
                                    <span style={{ color: 'var(--ax-text-muted)', marginLeft: 6, fontSize: '11px' }}>
                                      ({fmtDate(deadlineStr)})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {sitesList.length > 2 && (
                              <button
                                type="button"
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  padding: 0,
                                  fontSize: '11px',
                                  color: 'var(--asw-primary, #2563eb)',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  marginTop: 2,
                                  fontWeight: 600,
                                }}
                                onClick={() => handleViewDetail(item)}
                              >
                                +{sitesList.length - 2} more sites (View details &rarr;)
                              </button>
                            )}
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

                      {/* 9. File (Thumbnail if Image, else File Link - matching UP RESCO) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {a.file && isImage(a.file) ? (
                          <InstallationThumbnail
                            src={a.file}
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
                            style={{ color: 'var(--asw-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download Assigned Site File"
                          >
                            📎 {fileExt} ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* 10. View */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => handleViewDetail(item)}
                        >
                          View
                        </button>
                      </td>

                      {/* 11. Remarks */}
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 160, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={a.remarks || ''}
                      >
                        {a.remarks || DASH}
                      </td>

                      {/* 12. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isAccepted ? (
                          <Badge tone="success">✓ Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleAccept(item)}
                              disabled={acceptingId === a.id}
                            >
                              {acceptingId === a.id ? 'Accepting…' : 'Accept'}
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
              totalItems={totalItems}
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

      {/* ── Assignment Details Modal (Exact UP RESCO Pattern) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details · #${activeItem.assign_srt?.id}` : 'Assignment Details'}
        subtitle="Individual site allocation and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isSiteAccepted(activeItem) ? (
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
                disabled={acceptingId === activeItem.assign_srt?.id}
              >
                {acceptingId === activeItem.assign_srt?.id ? 'Accepting…' : 'Accept Assignment'}
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
              <b>{getVendorName(activeItem) || DASH}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>District: </span>
              <b>{activeItem?.assign_srt?.district || DASH}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>State: </span>
              <b>{(activeItem?.assign_srt?.state || 'Kashmir').toUpperCase()}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span>
              <b>{fmtDate(activeItem?.assign_srt?.assign_date || activeItem?.assign_srt?.created_at)}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Deadline: </span>
              <b>{fmtDate(getDeadlineDate(activeItem))}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
              <Badge tone={activeItem && isSiteAccepted(activeItem) ? 'success' : 'warning'}>
                {activeItem && isSiteAccepted(activeItem) ? '✓ Accepted' : 'Pending Accept'}
              </Badge>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Total Sites: </span>
              <b style={{ color: 'var(--asw-primary)' }}>{activeItem ? getSiteCount(activeItem) : 0}</b>
            </div>
          </div>

          {/* Search filter above popup table */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label
              htmlFor="modal_site_search"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}
            >
              Search:
            </label>
            <input
              id="modal_site_search"
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

          {/* Popup Table: Sr. No., Site ID, Site Name, State, District, Deadline Date, File */}
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
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>File</th>
                </tr>
              </thead>
              <tbody className="ax-table__body">
                {filteredModalSites.map((site: any, idx: number) => {
                  const deadlineDate = site.inst_deadline || site.deadline_date || activeItem?.assign_srt?.deadline_date;
                  const districtVal = site.district || activeItem?.assign_srt?.district || DASH;
                  const stateVal = (site.state || activeItem?.assign_srt?.state || 'Kashmir').toUpperCase();
                  const siteId = site.id || site.site_id || idx + 1;
                  const siteName = site.site_name || site.name || `Site #${siteId}`;
                  const siteFile = site.file || activeItem?.assign_srt?.file;
                  const fileUrl = resolveFileUrl(siteFile);
                  const fileExt = getFileExt(siteFile);
                  const isImg = isImage(siteFile);

                  return (
                    <tr key={site.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {idx + 1}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        #{siteId}
                      </td>
                      <td className="ax-table__td">
                        <strong style={{ color: 'var(--ax-text-strong)' }}>{siteName}</strong>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {stateVal}
                      </td>
                      <td className="ax-table__td">
                        <b>{districtVal}</b>
                      </td>
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(deadlineDate)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {siteFile && isImg ? (
                          <InstallationThumbnail
                            src={siteFile}
                            alt={`${siteName} Photo`}
                            onPreview={openPreview}
                            size={34}
                          />
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ color: 'var(--asw-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download File"
                          >
                            📎 {fileExt} ↗
                          </a>
                        ) : (
                          <ImagePlaceholder size={34} label={`No image — ${siteName}`} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredModalSites.length === 0 && (
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

export default Kashmir_Installation_AssignSite;
