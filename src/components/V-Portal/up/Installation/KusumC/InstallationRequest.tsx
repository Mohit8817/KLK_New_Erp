import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
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
  upInstallationService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
  type UpKusumCAssignmentItem,
} from '../../up-services';

/* ───────── Responsive Page CSS (Exact Karnataka SWP Reference) ───────── */
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

const isAcceptedStatus = (s: any) => Number(s) === 2 || String(s) === '2';

const isImage = (url?: string | null) =>
  Boolean(url && /\.(jpe?g|png|webp|gif|svg|bmp|tiff|avif)(\?.*)?$/i.test(String(url).trim()));

const getImageForAssignment = (item: any): string | null => {
  if (!item) return null;
  const candidates = [
    item.file,
    item.image,
    item.photo,
    item.site_image,
    item.assigned_file,
    item.uid_file,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && isImage(c)) {
      return c.trim();
    }
  }
  return null;
};

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
            }}
          />
        </div>
        <div
          className="ax-modal__footer"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {ZOOM_STEPS.map((z, idx) => (
              <button
                key={z}
                type="button"
                className={`ax-btn ax-btn--sm ${zoomIdx === idx ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => setZoomIdx(idx)}
              >
                {z}x
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Open original ↗
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

export function UP_Installation_KusumC_InstallationRequest() {
  const navigate = useNavigate();

  const [data, setData] = useState<UpKusumCAssignmentItem[]>([]);
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
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Assignment Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<UpKusumCAssignmentItem | null>(null);
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
      const res = await upInstallationService.getKusumCAssignments();
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.warn('Error loading Kusum-C assignments:', err);
      setError(err?.message || 'Failed to load Kusum-C assignments.');
      setData([]);
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
  const handleAccept = async (item: UpKusumCAssignmentItem) => {
    const id = item.id;
    setAcceptingId(id);
    setAcceptSuccessMsg(null);
    setAcceptErrorMsg(null);
    try {
      const res = await upInstallationService.acceptKusumCAssignment(id);
      if (res?.status) {
        setAcceptSuccessMsg(res.message || `Assignment #${id} accepted successfully! Ready for installation.`);
        setData((prev) => prev.map((b) => (b.id === id ? { ...b, status: 2 } : b)));
        if (activeItem && activeItem.id === id) {
          setActiveItem((prev) => (prev ? { ...prev, status: 2 } : prev));
        }
        return true;
      } else {
        setAcceptErrorMsg(res?.message || `Failed to accept assignment #${id}.`);
        return false;
      }
    } catch (err: any) {
      setAcceptErrorMsg(err?.message || 'Error occurred while accepting assignment.');
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // Open Details Modal
  const handleViewDetail = async (item: UpKusumCAssignmentItem) => {
    setActiveItem(item);
    setDetailData(item);
    setDetailModalOpen(true);
    setModalSearch('');
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await upInstallationService.getKusumCAssignmentDetail(item.id);
      if (res && (res.details || res.Names)) {
        setDetailData(res);
      }
    } catch (e: any) {
      console.warn('Error fetching batch detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Distinct districts
  const districtList = useMemo(() => {
    const set = new Set<string>();
    data.forEach((b) => {
      if (b.district && b.district.trim()) {
        set.add(b.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  // Metric counts matching Karnataka SWP layout
  const totalAssignments = data.length;
  const acceptedCount = data.filter((item) => isAcceptedStatus(item.status)).length;
  const pendingAcceptance = totalAssignments - acceptedCount;
  const totalSitesCount = useMemo(() => {
    return data.reduce((acc, item) => {
      const siteIds = parseSiteIds(item.site_id);
      const c = Number(item.site_count || siteIds.length || item.Names?.length || 0);
      return acc + (Number.isFinite(c) && c > 0 ? c : 1);
    }, 0);
  }, [data]);

  // Filtering
  const filtered = useMemo(() => {
    return data.filter((item) => {
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
        const siteIdStr = String(item.site_id || '').toLowerCase();
        const distStr = String(item.district || '').toLowerCase();
        const projStr = String(item.project || '').toLowerCase();
        const vendStr = String(item.vendor || item.company_id || '').toLowerCase();
        const remarksStr = String(item.remarks || '').toLowerCase();
        const assignDateStr = String(item.assign_date || '').toLowerCase();
        const deadlineDateStr = String(item.deadline_date || '').toLowerCase();
        const namesStr = (item.Names || []).map((n) => n.f_farmer_name).join(' ').toLowerCase();
        if (
          !idStr.includes(q) &&
          !siteIdStr.includes(q) &&
          !distStr.includes(q) &&
          !projStr.includes(q) &&
          !vendStr.includes(q) &&
          !remarksStr.includes(q) &&
          !assignDateStr.includes(q) &&
          !deadlineDateStr.includes(q) &&
          !namesStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data, statusFilter, selectedDistrict, search]);

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
  const modalList = useMemo(() => {
    if (Array.isArray(detailData)) return detailData;
    if (Array.isArray((detailData as any)?.data)) return (detailData as any).data;
    if (Array.isArray((detailData as any)?.sites)) return (detailData as any).sites;
    if (Array.isArray(detailData?.details)) return detailData.details;
    if (Array.isArray((detailData as any)?.Names)) return (detailData as any).Names;
    if (Array.isArray(activeItem?.details)) return activeItem.details;
    if (Array.isArray(activeItem?.Names)) return activeItem.Names;
    if (Array.isArray((activeItem as any)?.sites)) return (activeItem as any).sites;
    const siteIds = parseSiteIds(activeItem?.site_id);
    if (siteIds.length > 0) {
      return siteIds.map((sid) => ({ id: sid }));
    }
    return [];
  }, [detailData, activeItem]);

  const filteredModalNames = useMemo(() => {
    if (!modalSearch.trim()) return modalList;
    const q = modalSearch.toLowerCase();
    return modalList.filter((site: any) => {
      const fn = (site.applicant_name || site.farmer_name || site.f_farmer_name || '').toLowerCase();
      const fath = (site.father_name || site.f_father_name || site.father || '').toLowerCase();
      const dist = (site.district || site.f_district || activeItem?.district || '').toLowerCase();
      const blk = (site.block || site.f_block || site.tehsil || site.f_tehsil || activeItem?.block || '').toLowerCase();
      const vil = (site.village || site.f_village || activeItem?.village || '').toLowerCase();
      const st = (site.state || activeItem?.state || '').toLowerCase();
      const id = String(site.id || '');
      return (
        fn.includes(q) ||
        fath.includes(q) ||
        dist.includes(q) ||
        blk.includes(q) ||
        vil.includes(q) ||
        st.includes(q) ||
        id.includes(q)
      );
    });
  }, [modalList, modalSearch, activeItem]);

  const exportCols: ExportColumn<UpKusumCAssignmentItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Batch ID', accessor: (r) => String(r.id) },
      { header: 'Vendor', accessor: (r) => String(r.vendor || r.company_id || DASH) },
      { header: 'Assign Date', accessor: (r) => r.assign_date || DASH },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      {
        header: 'Farmers & Deadlines',
        accessor: (r) =>
          (r.Names || [])
            .map((n) => `${n.f_farmer_name} (${n.inst_deadline || 'No deadline'})`)
            .join('; '),
      },
      { header: 'Count', accessor: (r) => String(r.site_count || r.Names?.length || 0) },
      { header: 'Deadline Date', accessor: (r) => r.deadline_date || DASH },
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

      {/* ── Page Header (matching pattern) ── */}
      <PageHead
        title="View Assigned Kusum-C Installation"
        subtitle="Manage and accept assigned Kusum-C solar pump installation batches and schedules"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'Installation Request' },
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
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
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

      {/* ── Top Metric KPI Cards (4 cards in 1 row matching Karnataka SWP) ── */}
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
                id="kusumc_req_filter"
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
                onChange={setSearch}
                placeholder="Search vendor, farmer, ID…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('UP_KusumC_Assignments', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('UP_KusumC_Assignments', filtered, exportCols)}
                onExportPDF={() => printTableData('UP Kusum-C Assigned Installations', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - matching reference */}
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
                  const count = item.site_count || siteIds.length || item.Names?.length || (item.details ? item.details.length : 0);
                  const isAccepted = isAcceptedStatus(item.status);
                  const districtVal = item.district || (item.details && item.details[0]?.f_district) || DASH;
                  const namesList = item.Names || item.details || [];
                  const imageSrc = getImageForAssignment(item);
                  const isImg = Boolean(imageSrc || (item.file && isImage(item.file)));
                  const fileUrl = resolveFileUrl(imageSrc || item.file);
                  const fileExt = getFileExt(item.file);

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
                            item.company_id || 'Kusum-C Vendor'
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                         
                          {siteIds.length > 0 && (
                            <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            
              
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
                        {(item.state || 'UP').toUpperCase()}
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
                              const fn = f.f_farmer_name || f.farmer_name || 'Farmer';
                              const father = f.f_father_name || f.father_name;
                              const dline = f.inst_deadline || f.deadline_date;
                              return (
                                <div key={i} style={{ fontSize: '12px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                  <b style={{ color: 'var(--ax-text-strong)' }}>{fn}</b>
                                  {father ? (
                                    <span style={{ color: 'var(--ax-text-default)' }}> - {father}</span>
                                  ) : dline ? (
                                    <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginLeft: 4 }}>
                                      (Deadline: {dline})
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
                        {fmtDate(item.deadline_date)}
                      </td>

                      {/* 9. File (Thumbnail if Image, else File Link) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isImg ? (
                          <InstallationThumbnail
                            src={imageSrc || item.file}
                            alt={`${item.vendor || 'Kusum-C'} - Site File`}
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
                        {item.remarks || DASH}
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
                              disabled={acceptingId === item.id}
                            >
                              {acceptingId === item.id ? 'Accepting…' : 'Accept'}
                            </button>
                          ) : (
                            <>
                              <Badge tone="success">Done</Badge>
                           
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

      {/* ── Assignment Details Modal (exact Karnataka SWP modal pattern) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details · #${activeItem.id}` : 'Assignment Details'}
        subtitle="Individual beneficiary and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isAcceptedStatus(activeItem.status) ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={async () => {
                  const ok = await handleAccept(activeItem);
                  if (ok) setDetailModalOpen(false);
                }}
                disabled={acceptingId === activeItem.id}
              >
                {acceptingId === activeItem.id ? 'Accepting…' : 'Accept Assignment'}
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

            {/* Popup Table: Sr. No., Assign Date, State, District, Block, Village, Applicant Name, Father Name, Deadline Date */}
            <div className="ax-table-wrap" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Sr. No.</th>
                    <th className="ax-table__th">Assign Date</th>
                    <th className="ax-table__th">State</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Block</th>
                    <th className="ax-table__th">Village</th>
                    <th className="ax-table__th">Applicant Name</th>
                    <th className="ax-table__th">Father Name</th>
                    <th className="ax-table__th">Deadline Date</th>
                  </tr>
                </thead>
                <tbody className="ax-table__body">
                  {filteredModalNames.map((site: any, idx: number) => {
                    const assignDate = site.assign_date || detailData?.assign_date || activeItem?.assign_date || activeItem?.created_at;
                    const stateVal = (site.state || detailData?.state || activeItem?.state || 'UP').toUpperCase();
                    const districtVal = site.district || site.f_district || detailData?.district || activeItem?.district || DASH;
                    const blockVal = site.block || site.f_block || site.tehsil || site.f_tehsil || detailData?.block || activeItem?.block || DASH;
                    const villageVal = site.village || site.f_village || detailData?.village || activeItem?.village || DASH;
                    const applicantName = site.applicant_name || site.farmer_name || site.f_farmer_name || site.beneficiary_name || DASH;
                    const fatherName = site.father_name || site.f_father_name || site.father || detailData?.father_name || activeItem?.father_name || DASH;
                    const deadlineDate = site.inst_deadline || site.deadline_date || detailData?.deadline_date || activeItem?.deadline_date;

                    return (
                      <tr key={site.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                          {idx + 1}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px' }}>
                          {fmtDate(assignDate)}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {stateVal}
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
                        <td className="ax-table__td">
                          <strong style={{ color: 'var(--ax-text-strong)' }}>{applicantName}</strong>
                        </td>
                        <td className="ax-table__td">
                          {fatherName}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '13px' }}>
                          {fmtDate(deadlineDate)}
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

export default UP_Installation_KusumC_InstallationRequest;
