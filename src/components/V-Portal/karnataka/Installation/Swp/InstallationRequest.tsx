import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
  karnatakaSwpService,
  resolveKarnatakaMediaUrl,
  getKarnatakaMediaCandidates,
  type AssignedSiteItem,
  type AssignSiteDetailResponse,
} from '../../karnataka-services';

/* ───────── Responsive page CSS (Exact Solar ERP / ULA reference, all columns scrollable) ───────── */
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
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
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component (matching reference) ── */
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

const parseSiteIds = (val?: any): number[] => {
  if (val === null || val === undefined) return [];
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? [Math.floor(val)] : [];
  }
  if (Array.isArray(val)) {
    const list: number[] = [];
    for (const v of val) {
      if (typeof v === 'object' && v !== null) {
        const id = Number((v as any).id ?? (v as any).site_id);
        if (Number.isFinite(id) && id > 0) list.push(Math.floor(id));
      } else {
        list.push(...parseSiteIds(v));
      }
    }
    return Array.from(new Set(list));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseSiteIds(parsed);
      }
    } catch {}
    const matches = trimmed.match(/\d+/g);
    if (matches && matches.length > 0) {
      return Array.from(new Set(matches.map(Number).filter((n) => Number.isFinite(n) && n > 0).map(Math.floor)));
    }
  }
  return [];
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Helper to extract numeric assignment ID (assigns table id)
const getAssignId = (item?: any): number => {
  if (!item) return 0;
  if (typeof item === 'number') return Number.isFinite(item) && item > 0 ? Math.floor(item) : 0;
  if (typeof item === 'string') {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  const candidate =
    item.assign_id ??
    item.assignment_id ??
    item.assignId ??
    item.assign?.id ??
    item.id;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
};

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const cleanStr = String(val).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

const isImage = (path?: string | null): boolean => {
  if (!path || typeof path !== 'string') return false;
  const clean = path.trim().toLowerCase();
  return /\.(jpe?g|png|webp|gif|svg|bmp|jfif)($|\?)/i.test(clean);
};

function extractFilePath(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '—' || trimmed === '-') return null;
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
  return null;
}

/* ── Interactive Image Thumbnail (NO Broken Icons, Real Candidates, Hover Scale) ── */
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
  const cleanPath = extractFilePath(src);
  const candidates = useMemo(() => getKarnatakaMediaCandidates(cleanPath), [cleanPath]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!cleanPath || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  }

  const currentUrl = candidates[candidateIdx];

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
          borderRadius: 4,
          objectFit: 'cover',
          cursor: 'zoom-in',
          border: '1px solid var(--ax-border, #cbd5e1)',
          background: 'var(--ax-surface-subtle, #f8fafc)',
          display: 'block',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.12)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.borderColor = 'var(--asw-primary, #2563eb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = 'var(--ax-border, #cbd5e1)';
        }}
        onError={() => {
          if (candidateIdx + 1 < candidates.length) {
            setCandidateIdx((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
        onClick={() => onPreview(currentUrl, alt)}
        title="Click to preview photograph"
      />
    </div>
  );
}

/* ── Interactive Image Preview Modal (Lightbox) ── */
const PREVIEW_ZOOM_STEPS = [1, 1.5, 2];

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
  const zoom = PREVIEW_ZOOM_STEPS[zoomIdx];
  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          width: '92vw',
          maxWidth: isPdf ? 960 : 760,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title || 'Document Preview'}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: '50%',
            }}
            aria-label="Close dialog"
          >
            {X_ICON}
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0b1120',
            overflow: 'auto',
            minHeight: 380,
            maxHeight: '70vh',
          }}
        >
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '65vh', border: 'none', background: '#fff', borderRadius: 8 }} />
          ) : (
            <img
              src={url}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transition: 'transform 0.18s ease',
                borderRadius: 6,
              }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          {!isPdf ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {PREVIEW_ZOOM_STEPS.map((z, idx) => (
                <button
                  key={z}
                  type="button"
                  className={`ax-btn ax-btn--sm ${zoomIdx === idx ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => setZoomIdx(idx)}
                  style={{ minWidth: 42, padding: '4px 8px', fontSize: 12 }}
                >
                  {z}x
                </button>
              ))}
            </div>
          ) : <div />}
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ fontSize: 12.5 }}
            >
              Open Original ↗
            </a>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={onClose}
              style={{ fontSize: 12.5 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function InstallationRequest() {

  const [data, setData] = useState<AssignedSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  const openPreview = useCallback((url: string, title: string) => {
    setPreviewMedia({ url, title });
  }, []);

  // Details Modal search filter
  const [modalSearch, setModalSearch] = useState('');

  // Persisted accepted IDs (handles cases where backend returns 200 OK for site_id but assigns table status lags)
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('karnataka_swp_accepted_ids');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr.map(Number));
      }
    } catch {}
    return new Set<number>();
  });

  // Dynamic server-based status: driven by API data (1 = Pending, 2 = Accepted) or confirmed acceptance
  const isSiteAccepted = useCallback((item: AssignedSiteItem) => {
    const aId = getAssignId(item) || item.id;
    return (
      Number(item.status) === 2 ||
      String(item.status) === '2' ||
      Number((item as any).inst_accept) === 1 ||
      String((item as any).inst_accept) === '1' ||
      String(item.status).toLowerCase() === 'accepted' ||
      acceptedIds.has(Number(item.id)) ||
      (aId > 0 && acceptedIds.has(Number(aId)))
    );
  }, [acceptedIds]);

  // Detail Modal state (API 2)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AssignSiteDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<AssignedSiteItem | null>(null);

  // Filtered names inside the details modal based on modalSearch
  const filteredModalNames = useMemo(() => {
    const list = detailData?.Names || detailData?.sites || [];
    const q = modalSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s: any) => {
      const fn = (s.farmer_name || s.f_farmer_name || '').toLowerCase();
      const fath = (
        s.father_name ||
        s.f_father_name ||
        s.father ||
        s.f_father ||
        s.f_father_or_husband_name ||
        s.father_or_husband_name ||
        s.guardian_name ||
        ''
      ).toLowerCase();
      const app = (s.application_no || s.app_no || '').toLowerCase();
      const sId = String(s.id || '').toLowerCase();
      const st = (s.state || detailData?.state || activeItem?.state || '').toLowerCase();
      const dist = (s.district || detailData?.district || activeItem?.district || '').toLowerCase();
      const blk = (s.block || s.tehsil || s.f_tehsil || '').toLowerCase();
      const vil = (s.village || s.f_village || '').toLowerCase();
      return (
        fn.includes(q) ||
        fath.includes(q) ||
        app.includes(q) ||
        sId.includes(q) ||
        st.includes(q) ||
        dist.includes(q) ||
        blk.includes(q) ||
        vil.includes(q)
      );
    });
  }, [detailData, activeItem, modalSearch]);

  // Accept Action state (API 3)
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptSuccessMsg, setAcceptSuccessMsg] = useState<string | null>(null);
  const [acceptErrorMsg, setAcceptErrorMsg] = useState<string | null>(null);

  // Load Data (API 1: 100% Real API)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await karnatakaSwpService.getAssignedInstallationSites();
      setData(list);
    } catch (err: any) {
      console.error('Failed to load Karnataka assigned installation sites:', err);
      setError(err?.message || 'Failed to load assigned installation sites from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle View Details (API 2: 100% Real API)
  const handleViewDetail = async (item: AssignedSiteItem) => {
    setActiveItem(item);
    setModalSearch('');
    setDetailModalOpen(true);
    setDetailError(null);

    const assignId = getAssignId(item);

    // If item already has Names or sites from list response, pre-populate
    const initialList = item.Names || item.sites;
    if (initialList && initialList.length > 0) {
      setDetailData({
        id: assignId || item.id,
        site_id: item.site_id,
        status: item.status,
        Names: initialList,
        sites: initialList,
        state: item.state,
        district: item.district,
        assign_date: item.assign_date || item.created_at,
        deadline_date: item.deadline_date,
      });
      setDetailLoading(false);
    } else {
      setDetailData(null);
      setDetailLoading(true);
    }

    try {
      const res = await karnatakaSwpService.getAssignSiteDetail(assignId || item.id);
      const detailPayload = (res as any)?.data || res;
      if (detailPayload) {
        const fetchedList = detailPayload.Names || detailPayload.sites || [];
        const baseList = initialList && initialList.length > 0 ? initialList : [];
        const mergedList = (fetchedList.length > 0 ? fetchedList : baseList).map((s: any, idx: number) => {
          const initMatch = baseList.find((init: any) => init.id === s.id) || baseList[idx] || {};
          return {
            ...initMatch,
            ...s,
            farmer_name: s.farmer_name || s.f_farmer_name || initMatch.farmer_name || initMatch.f_farmer_name,
            f_farmer_name: s.f_farmer_name || s.farmer_name || initMatch.f_farmer_name || initMatch.farmer_name,
            father_name:
              s.father_name ||
              s.f_father_name ||
              initMatch.father_name ||
              initMatch.f_father_name ||
              s.father ||
              s.f_father ||
              initMatch.father ||
              initMatch.f_father ||
              s.f_father_or_husband_name ||
              initMatch.f_father_or_husband_name ||
              s.father_or_husband_name ||
              initMatch.father_or_husband_name ||
              s.guardian_name ||
              initMatch.guardian_name ||
              s.husband_name ||
              initMatch.husband_name,
            f_father_name:
              s.f_father_name ||
              s.father_name ||
              initMatch.f_father_name ||
              initMatch.father_name ||
              s.father ||
              s.f_father ||
              initMatch.father ||
              initMatch.f_father,
          };
        });

        const mergedPayload = {
          ...detailPayload,
          Names: mergedList,
          sites: mergedList,
        };
        setDetailData(mergedPayload);

        // Proactively fetch full site details for any site in this assignment missing father_name
        const siteIdCandidates: { idx: number; id: number; hasFather: boolean }[] = mergedList
          .map((s: Record<string, unknown>, idx: number) => ({
            idx,
            id: Number(s.id || parseSiteIds(item.site_id)[idx]),
            hasFather: Boolean(
              s.father_name ||
              s.f_father_name ||
              s.father ||
              s.f_father ||
              s.f_father_or_husband_name ||
              s.father_or_husband_name ||
              s.guardian_name ||
              s.husband_name
            ),
          }))
          .filter((c: { idx: number; id: number; hasFather: boolean }) => Number.isFinite(c.id) && c.id > 0 && !c.hasFather);

        if (siteIdCandidates.length > 0) {
          Promise.all(
            siteIdCandidates.map(async ({ idx, id }) => {
              try {
                const sDetail = await karnatakaSwpService.fetchSiteDetails(id);
                const sData = (sDetail.data?.site || sDetail.data?.sites?.[0] || sDetail.data) as any;
                if (sData) {
                  return {
                    idx,
                    id,
                    father_name: sData.f_father_name || sData.father_name || sData.father || sData.f_father || '',
                    f_father_name: sData.f_father_name || sData.father_name || sData.father || sData.f_father || '',
                    farmer_name: sData.f_farmer_name || sData.farmer_name || sData.farmer_name,
                    f_farmer_name: sData.f_farmer_name || sData.farmer_name || sData.f_farmer_name,
                    tehsil: sData.f_tehsil || sData.tehsil,
                    village: sData.f_village || sData.village,
                    district: sData.f_district || sData.district,
                    application_no: sData.application_no || sData.app_no,
                  };
                }
              } catch {
                // Ignore enrichment error
              }
              return null;
            })
          ).then((enrichResults) => {
            const valid = enrichResults.filter(Boolean) as any[];
            if (valid.length > 0) {
              setDetailData((prev: any) => {
                if (!prev) return prev;
                const prevList = prev.Names || prev.sites || [];
                const updatedList = prevList.map((st: any, i: number) => {
                  const match = valid.find((v) => v.id === st.id || v.idx === i);
                  return match ? { ...st, ...match } : st;
                });
                return {
                  ...prev,
                  Names: updatedList,
                  sites: updatedList,
                };
              });
            }
          });
        }
      }
    } catch (err: any) {
      if (!initialList || initialList.length === 0) {
        setDetailError(err?.message || 'Failed to load assignment site details from server');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Accept (API 3: 100% Real API)
  const handleAccept = async (
    item: AssignedSiteItem,
    extraDetail?: AssignSiteDetailResponse | null
  ): Promise<boolean> => {
    const assignId = getAssignId(item) || getAssignId(extraDetail) || (activeItem ? getAssignId(activeItem) : 0);

    // Collect candidate site IDs
    let siteIds = Array.from(
      new Set([
        ...parseSiteIds(item?.site_id),
        ...parseSiteIds(extraDetail?.site_id),
        ...parseSiteIds(activeItem?.site_id),
        ...((item?.Names || item?.sites || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
        ...((extraDetail?.Names || extraDetail?.sites || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
      ])
    );

    // If siteIds is empty and we have an assignId, prefetch details to discover site ID
    if (siteIds.length === 0 && assignId > 0) {
      try {
        const fetched = await karnatakaSwpService.getAssignSiteDetail(assignId);
        const payload = (fetched as any)?.data || fetched;
        if (payload) {
          const fetchedSites = Array.from(
            new Set([
              ...parseSiteIds(payload.site_id),
              ...((payload.Names || payload.sites || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
            ])
          );
          if (fetchedSites.length > 0) {
            siteIds = fetchedSites;
          }
        }
      } catch {
        // prefetch silent
      }
    }

    if (!assignId && siteIds.length === 0) {
      setAcceptErrorMsg('Could not determine a valid assignment or site id for this row.');
      setTimeout(() => setAcceptErrorMsg(null), 6000);
      return false;
    }

    const confirmMsg =
      siteIds.length > 0
        ? `Are you sure you want to accept Karnataka SWP Installation Assignment ${assignId || siteIds[0]} (Site ${siteIds.join(', ')})?`
        : `Are you sure you want to accept Karnataka SWP Installation Assignment ${assignId}?`;

    if (!window.confirm(confirmMsg)) {
      return false;
    }

    const rowKeyId = item?.id ?? assignId ?? siteIds[0];
    setAcceptingId(rowKeyId);
    setAcceptErrorMsg(null);
    setAcceptSuccessMsg(null);

    try {
      let res: any = null;
      let usedId = assignId || siteIds[0];
      let accepted = false;

      // 1. Try Assign ID first (API spec: id required, exists in assigns)
      if (assignId > 0) {
        try {
          res = await karnatakaSwpService.acceptInstallation(assignId);
          usedId = assignId;
          accepted = true;
        } catch (assignErr: any) {
          console.warn(`[Accept Installation] Assign ID ${assignId} failed, checking site IDs:`, assignErr);
        }
      }

      // 2. If assignId failed or wasn't provided, try site IDs
      if (!accepted && siteIds.length > 0) {
        for (const sId of siteIds) {
          try {
            res = await karnatakaSwpService.acceptInstallation(sId, assignId);
            usedId = sId;
            accepted = true;
            break;
          } catch (siteErr: any) {
            console.warn(`[Accept Installation] Site ID${sId} failed:`, siteErr);
          }
        }
      }

      if (!accepted) {
        throw new Error('Failed to accept installation assignment with available IDs.');
      }

      setAcceptSuccessMsg(res?.message || 'Installation accepted successfully!');

      // Persist accepted status locally
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        if (rowKeyId) next.add(Number(rowKeyId));
        if (assignId) next.add(Number(assignId));
        if (item?.id) next.add(Number(item.id));
        try {
          localStorage.setItem('karnataka_swp_accepted_ids', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });

      // Optimistically mark as accepted locally
      setData((prev) =>
        prev.map((r) => {
          const rAssignId = getAssignId(r);
          const rSiteIds = parseSiteIds(r.site_id);
          const matches =
            r.id === rowKeyId ||
            (assignId > 0 && rAssignId === assignId) ||
            siteIds.some((s) => rSiteIds.includes(s));
          if (matches) {
            return { ...r, status: 2, inst_accept: 1 };
          }
          return r;
        })
      );

      // Re-fetch fresh live data directly from the server API
      await loadData();
      if (detailModalOpen) {
        try {
          const detailQueryId = assignId || usedId;
          const updatedDetail = await karnatakaSwpService.getAssignSiteDetail(detailQueryId);
          const detailPayload = (updatedDetail as any)?.data || updatedDetail;
          setDetailData(detailPayload);
        } catch {}
      }
      setTimeout(() => setAcceptSuccessMsg(null), 4000);
      return true;
    } catch (err: any) {
      console.error('Accept error:', err);
      const rawMsg = err?.message || 'Error occurred while accepting installation';
      setAcceptErrorMsg(rawMsg);
      setTimeout(() => setAcceptErrorMsg(null), 8000);
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = data;
    if (statusFilter === 'pending') {
      list = list.filter((item) => !isSiteAccepted(item));
    } else if (statusFilter === 'accepted') {
      list = list.filter((item) => isSiteAccepted(item));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const vendorName = item.vendors?.name || (item.vendor ? `Vendor ${item.vendor}` : '');
        const companyId = item.company_id || '';
        const state = item.state || '';
        const district = item.district || (item.Names && item.Names[0]?.district) || (item.sites && item.sites[0]?.district) || '';
        const remarks = item.remarks || '';
        const assignDate = item.assign_date || item.created_at || '';
        const deadlineDate = item.deadline_date || '';
        const purpose = item.purpose || '';
        const namesList = item.Names || item.sites || [];
        const namesStr = namesList
          .map((n: any) => `${n.farmer_name || n.f_farmer_name || ''} ${n.father_name || n.f_father_name || ''} ${n.application_no || ''} ${n.id || ''}`)
          .join(' ');
        const siteIds = parseSiteIds(item.site_id).join(' ');
        const assignIdStr = String(getAssignId(item) || '');
        return (
          String(item.id).includes(q) ||
          (assignIdStr && assignIdStr.includes(q)) ||
          vendorName.toLowerCase().includes(q) ||
          companyId.toLowerCase().includes(q) ||
          state.toLowerCase().includes(q) ||
          district.toLowerCase().includes(q) ||
          remarks.toLowerCase().includes(q) ||
          assignDate.toLowerCase().includes(q) ||
          deadlineDate.toLowerCase().includes(q) ||
          purpose.toLowerCase().includes(q) ||
          namesStr.toLowerCase().includes(q) ||
          siteIds.includes(q)
        );
      });
    }
    return list;
  }, [data, search, statusFilter, isSiteAccepted]);

  // Items with photos / image files for top quick-preview bar
  const itemsWithFiles = useMemo(() => {
    return filtered.filter((item) => {
      const clean = extractFilePath(item.file);
      return Boolean(clean && isImage(clean));
    });
  }, [filtered]);

  // Pagination hook - default 100 items per user requirement
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // KPI Calculations
  const totalAssignments = data.length;
  const pendingAcceptance = data.filter((x) => !isSiteAccepted(x)).length;
  const acceptedCount = data.filter((x) => isSiteAccepted(x)).length;
  const totalSitesCount = data.reduce((sum, item) => {
    const ids = parseSiteIds(item.site_id);
    return sum + (Number(item.site_count) || ids.length || item.Names?.length || item.sites?.length || 0);
  }, 0);

  // Export Columns definition
  const exportCols: ExportColumn<AssignedSiteItem>[] = useMemo(() => [
    { header: 'Sr. No.', accessor: (_r: AssignedSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
    { header: 'Vendor', accessor: (r: AssignedSiteItem) => r.vendors?.name || (r.vendor ? `Vendor ${r.vendor}${r.company_id ? ` (${r.company_id})` : ''}` : (r.company_id || '—')) },
    { header: 'Assign Date', accessor: (r: AssignedSiteItem) => fmtDate(r.assign_date || r.created_at) },
    { header: 'State', accessor: (r: AssignedSiteItem) => r.state?.toUpperCase() || 'KARNATAKA' },
    { header: 'District', accessor: (r: AssignedSiteItem) => r.district || (r.Names && r.Names[0]?.district) || (r.sites && r.sites[0]?.district) || '—' },
    {
      header: 'Farmer Name - Father Name',
      accessor: (r: AssignedSiteItem) => {
        const list = r.Names || r.sites || [];
        return list.map((n: any) => {
          const fn = n.farmer_name || n.f_farmer_name || 'Farmer';
          const fath = n.father_name || n.f_father_name;
          const app = n.application_no ? ` (${n.application_no})` : '';
          return fath ? `${fn} - ${fath}${app}` : `${fn}${app}`;
        }).join(', ') || '—';
      },
    },
    {
      header: 'Count',
      accessor: (r: AssignedSiteItem) => r.site_count || parseSiteIds(r.site_id).length || r.Names?.length || r.sites?.length || 0,
    },
    { header: 'Deadline Date', accessor: (r: AssignedSiteItem) => fmtDate(r.deadline_date) },
    { header: 'File', accessor: (r: AssignedSiteItem) => r.file || '—' },
    { header: 'Remarks', accessor: (r: AssignedSiteItem) => r.remarks || '—' },
    {
      header: 'Status',
      accessor: (r: AssignedSiteItem) => (isSiteAccepted(r) ? 'Accepted' : 'Pending Accept'),
    },
  ], [isSiteAccepted]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Karnataka_SWP_Assignments';
  const fileTitle = 'Karnataka SWP Assigned Installation Register';

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
      columns.map((c) => c.header ?? c.label ?? ''),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header ?? c.label ?? '').join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Assignment data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Assignment data copied to clipboard!');
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
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Farmer Name - Father Name',
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

      {/* ── Page Header (exact pattern) ── */}
      <PageHead
        title="SWP-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution in Karnataka"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Karnataka' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Request Accept' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/karnataka/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Installation Site</span>
            </Link>
          </div>
        }
      />

      {/* Success notification */}
      {acceptSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{acceptSuccessMsg}</div>
        </div>
      )}

      {/* Error notification */}
      {acceptErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Accept Error</div>
          <div className="ax-alert__text">{acceptErrorMsg}</div>
        </div>
      )}

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Assignments</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
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
          sub="Cumulative solar pump sites"
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
              {' '}· Accepted <b className="ax-num">{acceptedCount}</b> · Pending <b className="ax-num">{pendingAcceptance}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="kswp_req_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
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
                onChange={setSearch}
                placeholder="Search vendor, farmer, ID…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              {/* TableExportToolbar without columns toggle */}
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Top Photo Strip (Small thumbnails matching other pages) ── */}
        {itemsWithFiles.length > 0 && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--ax-surface-subtle, #f8fafc)',
              borderBottom: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 13 }}>📷</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Batch Photos ({itemsWithFiles.length}):
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
              {itemsWithFiles.map((item) => {
                const aId = getAssignId(item) || item.id;
                const dist = item.district || (item.Names && item.Names[0]?.district) || 'Karnataka';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid var(--ax-border, #e2e8f0)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <InstallationThumbnail
                      src={item.file}
                      alt={`Assign #${aId} Photo`}
                      onPreview={openPreview}
                      size={28}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}>
                        #{aId}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap' }}>
                        {dist}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                        ? { textAlign: 'right' }
                        : h === 'Count' || h === 'View' || h === 'File' || h === 'Sr. No.'
                        ? { textAlign: 'center' }
                        : h === 'Vendor'
                        ? { minWidth: 220, maxWidth: 280, width: 250 }
                        : h === 'Farmer Name - Father Name'
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
                  const siteIds = parseSiteIds(item.site_id);
                  const count = item.site_count || siteIds.length || item.Names?.length || item.sites?.length || 0;
                  const isAccepted = isSiteAccepted(item);
                  const districtVal = item.district || (item.Names && item.Names[0]?.district) || (item.sites && item.sites[0]?.district) || '—';
                  const namesList = item.Names || item.sites || [];

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
                          {item.vendors?.name ? (
                            item.vendors.name
                          ) : item.vendor ? (
                            <>
                              Vendor {item.vendor}
                              {item.company_id && (
                                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', display: 'block', fontWeight: 500 }}>
                                  {item.company_id}
                                </span>
                              )}
                            </>
                          ) : (
                            item.company_id || '—'
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          <div>Assign ID: {getAssignId(item) || item.id}</div>
                          {siteIds.length > 0 && (
                            <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                              <span style={{ fontWeight: 500, color: 'var(--ax-text-default)' }}>
                                Sites ({siteIds.length}):
                              </span>
                              <span style={{ wordBreak: 'break-word' }}>
                                [{siteIds.slice(0, 4).join(', ')}{siteIds.length > 4 ? `, +${siteIds.length - 4} more` : ''}]
                              </span>
                              {siteIds.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => handleViewDetail(item)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontSize: '11px',
                                    color: 'var(--asw-primary)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontWeight: 500,
                                  }}
                                >
                                  View all
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(item.assign_date || item.created_at)}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {(item.state || 'Karnataka').toUpperCase()}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <b>{districtVal}</b>
                        {item.volume && (
                          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            Vol: {item.volume} {item.project ? `· ${String(item.project).toUpperCase()}` : ''}
                          </div>
                        )}
                      </td>

                      {/* 6. Farmer Name - Father Name */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 260, maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {namesList.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {namesList.slice(0, 2).map((f: any, i: number) => {
                              const fn = f.farmer_name || f.f_farmer_name || 'Farmer';
                              const father = f.father_name || f.f_father_name;
                              const appNo = f.application_no || f.app_no;
                              return (
                                <div key={i} style={{ fontSize: '12px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                  <b style={{ color: 'var(--ax-text-strong)' }}>{fn}</b>
                                  {father ? (
                                    <span style={{ color: 'var(--ax-text-default)' }}> - {father}</span>
                                  ) : appNo ? (
                                    <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginLeft: 4 }}>
                                      ({appNo})
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                            {namesList.length > 2 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                                  +{namesList.length - 2} more
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleViewDetail(item)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontSize: '11px',
                                    color: 'var(--asw-primary)',
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
                        ) : siteIds.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-strong)', wordBreak: 'break-word' }}>
                              Site IDs: {siteIds.slice(0, 3).join(', ')}{siteIds.length > 3 ? ` (+${siteIds.length - 3} more)` : ''}
                            </div>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ padding: 0, fontSize: '11px', color: 'var(--asw-primary)', justifyContent: 'flex-start', height: 'auto', textAlign: 'left' }}
                              onClick={() => handleViewDetail(item)}
                            >
                              View farmer details &rarr;
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* 7. Count */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 700 }}>
                          {item.site_count || count}
                        </span>
                      </td>

                      {/* 8. Deadline Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(item.deadline_date)}
                      </td>

                      {/* 9. File (Thumbnail if Image, else File Link) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {item.file ? (
                          (() => {
                            const cleanFile = extractFilePath(item.file);
                            const fileUrl = resolveKarnatakaMediaUrl(cleanFile || item.file);
                            const isImg = isImage(cleanFile || item.file);
                            const ext = cleanFile ? cleanFile.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE';

                            if (isImg) {
                              return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                  <InstallationThumbnail
                                    src={item.file}
                                    alt={`Assign #${getAssignId(item) || item.id} File`}
                                    onPreview={openPreview}
                                    size={36}
                                  />
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ax-btn ax-btn--ghost ax-btn--xs"
                                    style={{ color: 'var(--asw-primary, #2563eb)', padding: '2px 5px', fontSize: 11 }}
                                    title="Open original file in new tab"
                                  >
                                    ↗
                                  </a>
                                </div>
                              );
                            }

                            return (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                style={{ color: 'var(--asw-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                                title="View / Download Assignment File"
                              >
                                📎 {ext} ↗
                              </a>
                            );
                          })()
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
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
                        title={item.remarks || ''}
                      >
                        {item.remarks || '—'}
                      </td>

                      {/* 12. Status */}
                      <td className="ax-table__td">
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
                              disabled={acceptingId === item.id || (getAssignId(item) > 0 && acceptingId === getAssignId(item))}
                            >
                              {acceptingId === item.id || (getAssignId(item) > 0 && acceptingId === getAssignId(item)) ? 'Accepting…' : 'Accept'}
                            </button>
                          ) : (
                            <Badge tone="success">Done</Badge>
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
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Assignment Details Modal (API 2: 100% Real API) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details ·${getAssignId(activeItem) || activeItem.id}` : 'Assignment Details'}
        subtitle="Individual beneficiary and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isSiteAccepted(activeItem) && detailData ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={async () => {
                  const ok = await handleAccept(activeItem, detailData);
                  if (ok) setDetailModalOpen(false);
                }}
                disabled={acceptingId === activeItem.id || (getAssignId(activeItem) > 0 && acceptingId === getAssignId(activeItem))}
              >
                {acceptingId === activeItem.id || (getAssignId(activeItem) > 0 && acceptingId === getAssignId(activeItem)) ? 'Accepting…' : 'Accept Assignment'}
              </button>
            </div>
          ) : undefined
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
        ) : filteredModalNames.length === 0 ? (
          <p style={{ color: 'var(--ax-text-muted)', textAlign: 'center', margin: '20px 0' }}>
            No specific site detail entries found for this assignment batch.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Top Batch Overview Card with thumbnail preview */}
            {activeItem && (
              <div
                style={{
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1px solid var(--ax-border, #e2e8f0)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {activeItem.file && isImage(extractFilePath(activeItem.file)) ? (
                    <InstallationThumbnail
                      src={activeItem.file}
                      alt={`Assign #${getAssignId(activeItem) || activeItem.id} Document`}
                      onPreview={openPreview}
                      size={44}
                    />
                  ) : activeItem.file ? (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: '#e0e7ff',
                        color: '#3730a3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      📄
                    </div>
                  ) : null}

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      Assignment #{getAssignId(activeItem) || activeItem.id}
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ax-text-muted)', marginLeft: 8 }}>
                        {activeItem.district || 'Karnataka'} {activeItem.volume ? `· Vol ${activeItem.volume}` : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>Deadline: <b>{fmtDate(activeItem.deadline_date)}</b></span>
                      <span>Assigned: <b>{fmtDate(activeItem.assign_date || activeItem.created_at)}</b></span>
                      {activeItem.remarks && <span>Remarks: <i>{activeItem.remarks}</i></span>}
                    </div>
                  </div>
                </div>

                {activeItem.file && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isImage(extractFilePath(activeItem.file)) && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--secondary ax-btn--sm"
                        onClick={() => openPreview(resolveKarnatakaMediaUrl(activeItem.file), `Assign #${getAssignId(activeItem) || activeItem.id} File`)}
                      >
                        Preview Image
                      </button>
                    )}
                    <a
                      href={resolveKarnatakaMediaUrl(activeItem.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ color: 'var(--asw-primary)' }}
                    >
                      Open File ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Search filter above the popup table */}
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
                placeholder="Search farmer, block, village, district…"
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

            {/* Popup Table: Sr. No., Site ID, Application No, Farmer Name, Father Name, District, Block, Village, Deadline Date, Assign Date, File / Photo */}
            <div className="ax-table-wrap" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Sr. No.</th>
                    <th className="ax-table__th">Site ID</th>
                    <th className="ax-table__th">Application No</th>
                    <th className="ax-table__th">Farmer Name</th>
                    <th className="ax-table__th">Father Name</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Block</th>
                    <th className="ax-table__th">Village</th>
                    <th className="ax-table__th">Deadline Date</th>
                    <th className="ax-table__th">Assign Date</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>File / Photo</th>
                  </tr>
                </thead>
                <tbody className="ax-table__body">
                  {filteredModalNames.map((site: any, idx: number) => {
                    const assignDate = site.assign_date || detailData?.assign_date || activeItem?.assign_date || activeItem?.created_at;
                    const deadlineDate = site.inst_deadline || site.deadline_date || detailData?.deadline_date || activeItem?.deadline_date;
                    const districtVal = site.district || detailData?.district || activeItem?.district || '—';
                    const blockVal = site.block || site.tehsil || site.f_tehsil || '—';
                    const villageVal = site.village || site.f_village || '—';
                    const siteId = site.id || (parseSiteIds(activeItem?.site_id)[idx] ?? '—');
                    const appNo = site.application_no || site.app_no || '—';
                    const sFile = site.file || site.image || activeItem?.file;

                    return (
                      <tr key={site.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                          {idx + 1}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {siteId}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {appNo}
                        </td>
                        <td className="ax-table__td">
                          <strong style={{ color: 'var(--ax-text-strong)' }}>{site.farmer_name || site.f_farmer_name || '—'}</strong>
                        </td>
                        <td className="ax-table__td">
                          {site.father_name ||
                            site.f_father_name ||
                            site.father ||
                            site.f_father ||
                            site.f_father_or_husband_name ||
                            site.father_or_husband_name ||
                            site.guardian_name ||
                            site.f_guardian_name ||
                            site.husband_name ||
                            site.f_husband_name ||
                            site.farmer_father_name ||
                            site.fath_name ||
                            (activeItem?.Names && (activeItem.Names.find((n: any) => n.id === site.id)?.father_name || activeItem.Names.find((n: any) => n.id === site.id)?.f_father_name || activeItem.Names[idx]?.father_name || activeItem.Names[idx]?.f_father_name)) ||
                            (activeItem?.sites && (activeItem.sites.find((n: any) => n.id === site.id)?.father_name || activeItem.sites.find((n: any) => n.id === site.id)?.f_father_name || activeItem.sites[idx]?.father_name || activeItem.sites[idx]?.f_father_name)) ||
                            '—'}
                        </td>
                        <td className="ax-table__td">
                          <b>{districtVal}</b>
                        </td>
                        <td className="ax-table__td">
                          {blockVal}
                        </td>
                        <td className="ax-table__td">
                          {villageVal}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px' }}>
                          {fmtDate(deadlineDate)}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px' }}>
                          {fmtDate(assignDate)}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {sFile ? (
                            (() => {
                              const clean = extractFilePath(sFile);
                              const isImg = isImage(clean);
                              if (isImg) {
                                return (
                                  <InstallationThumbnail
                                    src={sFile}
                                    alt={`Site ${siteId} File`}
                                    onPreview={openPreview}
                                    size={30}
                                  />
                                );
                              }
                              return (
                                <a
                                  href={resolveKarnatakaMediaUrl(sFile)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ax-btn ax-btn--ghost ax-btn--xs"
                                  style={{ color: 'var(--asw-primary)', padding: '2px 6px', fontSize: 11 }}
                                >
                                  📎 File ↗
                                </a>
                              );
                            })()
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Interactive Image Preview Lightbox ── */}
      {previewMedia && (
        <ImagePreviewModal
          url={previewMedia.url}
          title={previewMedia.title}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
}

export default InstallationRequest;
