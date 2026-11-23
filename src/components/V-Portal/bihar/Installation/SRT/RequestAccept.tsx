import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtAssignBatchItem,
} from '../../bihar-services/biharSrtInstallationService';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

/* ── Top KPI Card Component (matching Goa & Karnataka SWP Reerence) ── */
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
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card"
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 2px ${t.fg}` : undefined,
        transition: 'all 0.2s ease',
        minWidth: 0,
      }}
    >
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
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS (Goa / Karnataka SWP style) ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  /* Image preview stage */
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

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
  }
`;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal ───────── */
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
        <h2 className="ax-modal__title" id="preview-title">{title || 'Media Preview'}</h2>
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

/* ── Bihar Image Candidates Helper ── */
export function getBiharSrtInstallationImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    return [`https://pub-454284bf729d49ffb1a20d40212f458e.r2.dev/${key}`, `${backendBase}/uploads/${key}`];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${backendBase}/uploads/${normalized}`);
  candidates.push(`${backendBase}/storage/${normalized}`);
  candidates.push(`${backendBase}/${normalized}`);
  if (filename !== normalized) {
    candidates.push(`${backendBase}/uploads/${filename}`);
  }
  return candidates;
}

/* ── Interactive Image Thumbnail (matching Goa pattern) ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getBiharSrtInstallationImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
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
        margin: '0 auto',
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

export function Bihar_Installation_SRT_RequestAccept() {
  const [assignments, setAssignments] = useState<SrtAssignBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected batch for viewing site list in modal
  const [viewBatch, setViewBatch] = useState<SrtAssignBatchItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharSrtInstallationService.getViewAssignSites();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('[Bihar SRT RequestAccept] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load assigned installation sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Handle Accept Action
  const handleAccept = async (id: number) => {
    if (actionLoadingId !== null) return;
    if (!window.confirm(`Are you sure you want to accept assignment batch #${id}?`)) return;

    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await biharSrtInstallationService.acceptAssignSite(id);
      setFeedbackMsg({ type: 'success', text: res?.message || 'Assignment batch accepted successfully!' });
      // Update local state to status = 2 (accepted)
      setAssignments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 2 } : item))
      );
      setViewBatch((prev) => (prev && prev.id === id ? { ...prev, status: 2 } : prev));
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to accept assignment batch.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const toSafeString = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.site_name || val.name || val.title || (val.id ? `Site #${val.id}` : fallback);
    }
    return String(val);
  };

  // Helper for counting sites
  const getSiteCount = (batch: SrtAssignBatchItem): number => {
    if (Array.isArray(batch.site_names) && batch.site_names.length > 0) return batch.site_names.length;
    if (batch.site_count !== undefined && batch.site_count !== null && batch.site_count !== '') {
      const n = Number(batch.site_count);
      if (!isNaN(n) && n > 0) return n;
    }
    if (batch.sitecount !== undefined && batch.sitecount !== null && batch.sitecount !== '') {
      const n = Number(batch.sitecount);
      if (!isNaN(n) && n > 0) return n;
    }
    if (Array.isArray(batch.site_name)) return batch.site_name.length;
    return 1;
  };

  // Helper to get array of site records
  const getSiteRows = (batch: SrtAssignBatchItem): { id?: number | string; name: string; deadline?: string }[] => {
    let siteNamesList = batch.site_names;
    if (typeof siteNamesList === 'string') {
      try {
        siteNamesList = JSON.parse(siteNamesList);
      } catch {
        siteNamesList = undefined;
      }
    }

    if (Array.isArray(siteNamesList) && siteNamesList.length > 0) {
      return siteNamesList.map((s: any, idx: number) => {
        if (typeof s === 'object' && s !== null) {
          return {
            id: s.id || idx + 1,
            name: toSafeString(s.site_name || s.name || `Site #${s.id || idx + 1}`),
            deadline: typeof s.inst_deadline === 'string'
              ? s.inst_deadline
              : typeof s.deadline === 'string'
              ? s.deadline
              : typeof s.deadline_date === 'string'
              ? s.deadline_date
              : typeof (batch as any).inst_deadline === 'string'
              ? (batch as any).inst_deadline
              : typeof (batch as any).deadline_date === 'string'
              ? (batch as any).deadline_date
              : undefined,
          };
        }
        return {
          id: idx + 1,
          name: toSafeString(s),
          deadline: (batch as any).inst_deadline || (batch as any).deadline_date,
        };
      });
    }

    let siteNameField = batch.site_name;
    if (typeof siteNameField === 'string' && siteNameField.trim().startsWith('[') && siteNameField.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(siteNameField);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            id: idx + 1,
            name: toSafeString(item),
            deadline: (typeof item === 'object' && item !== null ? (item.inst_deadline || item.deadline) : undefined) || (batch as any).inst_deadline || (batch as any).deadline_date,
          }));
        }
      } catch {
        // fallback
      }
    }

    if (Array.isArray(batch.site_name) && batch.site_name.length > 0) {
      return batch.site_name.map((item: any, idx: number) => ({
        id: idx + 1,
        name: toSafeString(item),
        deadline: (typeof item === 'object' && item !== null ? (item.inst_deadline || item.deadline) : undefined) || (batch as any).inst_deadline || (batch as any).deadline_date,
      }));
    }
    if (batch.site_name) {
      return [
        {
          id: batch.id,
          name: toSafeString(batch.site_name),
          deadline: (typeof batch.site_name === 'object' && batch.site_name !== null ? ((batch.site_name as any).inst_deadline || (batch.site_name as any).deadline) : undefined) || (batch as any).inst_deadline || (batch as any).deadline_date,
        },
      ];
    }
    return [
      {
        id: batch.id,
        name: `Site #${batch.id}`,
        deadline: (batch as any).inst_deadline || (batch as any).deadline_date,
      },
    ];
  };

  // KPI Calculations
  const summary = useMemo(() => {
    const total = assignments.length;
    const accepted = assignments.filter((a) => Number(a.status) === 2 || String(a.status).toLowerCase() === 'accepted').length;
    const pending = total - accepted;
    return { total, accepted, pending };
  }, [assignments]);

  // Cumulative allocated sites
  const totalSitesCount = useMemo(() => {
    return assignments.reduce((sum, item) => sum + getSiteCount(item), 0);
  }, [assignments]);

  // Districts for dropdown filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.district && String(a.district).trim()) {
        set.add(String(a.district).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const isAccepted = Number(item.status) === 2 || String(item.status).toLowerCase() === 'accepted';
      if (statusFilter === 'pending' && isAccepted) return false;
      if (statusFilter === 'accepted' && !isAccepted) return false;

      if (districtFilter !== 'all' && (item.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const vName = String(item.vendors?.name || item.vendor_name || `vendor ${item.vendor}`).toLowerCase();
        const dist = String(item.district || '').toLowerCase();
        const state = String(item.state || '').toLowerCase();
        const idStr = String(item.id || '').toLowerCase();
        const remark = String(item.remarks || '').toLowerCase();
        const siteNames = getSiteRows(item).map((s) => `${s.name} ${s.deadline || ''}`).join(' ').toLowerCase();

        const match =
          vName.includes(q) ||
          dist.includes(q) ||
          state.includes(q) ||
          idStr.includes(q) ||
          remark.includes(q) ||
          siteNames.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [assignments, statusFilter, districtFilter, search]);

  // Paginated Assignments
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export Columns (Exact match with 11 table headers, excluding Action)
  const exportCols: ExportColumn<SrtAssignBatchItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (r: SrtAssignBatchItem) => String(r.id || DASH) },
      { header: 'Vendor', accessor: (r) => r.vendors?.name || (r as any).vendor_name || `Vendor ${r.vendor}` },
      { header: 'Assign Date', accessor: (r) => r.assign_date || r.created_at || DASH },
      { header: 'State', accessor: (r) => (r.state || 'BIHAR').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      {
        header: 'Site Name - Deadline',
        accessor: (r) => {
          const rows = getSiteRows(r);
          return rows.map((s) => `${s.name}${s.deadline ? ' - ' + s.deadline : ''}`).join(', ');
        },
      },
      {
        header: 'Count',
        accessor: (r) => String(getSiteCount(r)),
      },
      { header: 'File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Pending Accept') },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filteredAssignments, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_Assigned_Batches', filteredAssignments, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_Assigned_Batches', filteredAssignments, exportCols);
  const handlePdf = () => printTableData('Bihar SRT Assigned Installation Batches', filteredAssignments, exportCols);

  const renderSiteNameSnippet = (batch: SrtAssignBatchItem) => {
    const list = getSiteRows(batch);
    if (list.length > 0) {
      const count = list.length;
      const displayCount = count <= 2 ? count : 1;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
          {list.slice(0, displayCount).map((st, idx) => {
            const dl = st.deadline || (batch as any).deadline_date || (batch as any).inst_deadline;
            return (
              <div key={st.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{toSafeString(st.name)}</span>
                {dl ? (
                  <span style={{ fontSize: 12, color: '#000000', fontWeight: 500 }}>
                    - {dl}
                  </span>
                ) : null}
              </div>
            );
          })}
          {count > displayCount && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              style={{ padding: '0 4px', height: 20, fontSize: 11, alignSelf: 'flex-start', color: 'var(--ax-accent)' }}
              onClick={() => setViewBatch(batch)}
            >
              + {count - displayCount} more sites
            </button>
          )}
        </div>
      );
    }
    const fallbackDl = (batch as any).deadline_date || (batch as any).inst_deadline;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{toSafeString(batch.site_name, DASH)}</span>
        {fallbackDl ? (
          <span style={{ fontSize: 12, color: '#000000', fontWeight: 500 }}>
            - {fallbackDl}
          </span>
        ) : null}
      </div>
    );
  };

  const TOTAL_COLUMNS = 11;
  const tableHeaders = [
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Site Name - Deadline',
    'Count',
    'File',
    'Remarks',
    'Status',
    'Action',
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (exact matching Goa / V-Portal pattern) ── */}
      <PageHead
        title="SRT-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'SRT-Request Accept' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link
              to="/v/bihar/installation/srt/installation-detail"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ textDecoration: 'none' }}
            >
              <span style={{ fontSize: 14 }}>+</span>
              <span className="ax-btn__label">Installation Detail</span>
            </Link>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row - exact Goa / Karnataka SWP pattern) ── */}
      <div className="asw-cards-row" style={{ marginBottom: 'var(--ax-space-4)' }}>
        <KpiCard
          tone="accent"
          label="Total Assignments"
          value={summary.total.toLocaleString('en-IN')}
          sub={`${summary.accepted} accepted · ${summary.pending} pending`}
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          active={statusFilter === 'pending'}
          onClick={() => setStatusFilter('pending')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          active={statusFilter === 'accepted'}
          onClick={() => setStatusFilter('accepted')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          }
        />
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card (Exact same styling as Goa) ── */}
        <section className="ax-card ax-col--12" id="bihar-srt-request-tabpanel" role="region" aria-label="Bihar SRT Assigned Installation Sites">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">ASSIGNED SITES</span>
              <h2 className="ax-card__title">
                {statusFilter === 'all'
                  ? 'All Assigned Batches'
                  : statusFilter === 'pending'
                  ? 'Pending Acceptance Batches'
                  : 'Accepted Batches'}
              </h2>
              <p className="ax-card__subtitle">
                Showing <b className="ax-num">{filteredAssignments.length}</b> of{' '}
                <b className="ax-num">{assignments.length}</b> assignment batches
                {statusFilter !== 'all' && <> (filtered by <i>{statusFilter}</i>)</>}
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster">
                <select
                  className="ax-input ax-input--sm"
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  aria-label="Filter by status"
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
                  placeholder="Search vendor, district, site…"
                  size="sm"
                  ariaLabel="Search assigned batches"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* ── Table (Goa & Karnataka SWP structure) ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
              <caption className="ax-visually-hidden">Bihar SRT Assigned Installation Batches</caption>
              <thead className="ax-table__head">
                <tr>
                  {tableHeaders.map((hdr, idx) => (
                    <th
                      key={hdr}
                      className="ax-table__th"
                      scope="col"
                      style={{
                        textAlign: idx === 0 || idx === 6 || idx === 7 ? 'center' : idx === 10 ? 'right' : 'left',
                        width: idx === 0 ? 60 : undefined,
                      }}
                    >
                      {hdr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                      <div style={{ color: 'var(--ax-text-muted)', fontSize: 13 }}>Loading assigned installation batches…</div>
                    </td>
                  </tr>
                )}

                {!loading && filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No assigned batches found"
                        message={
                          hasFilters
                            ? 'No installation batches match your search or filters.'
                            : 'Assigned installation batches will appear here once allocated.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedAssignments.map((item, index) => {
                    const isAccepted = Number(item.status) === 2 || String(item.status).toLowerCase() === 'accepted';
                    const siteCount = getSiteCount(item);
                    const fileUrl = item.file || '';

                    return (
                      <tr key={item.id} className="ax-table__row">
                        {/* 1. Sr. No. */}
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>

                        {/* 2. Vendor */}
                        <td className="ax-table__td" style={{ minWidth: 200 }}>
                          <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {item.vendors?.name || (item as any).vendor_name || `${item.vendor || item.company_id || item.id}`}
                          </div>
                       
                        </td>

                        {/* 3. Assign Date */}
                        <td className="ax-table__td" style={{ fontSize: 13 }}>
                          {item.assign_date || item.created_at || DASH}
                        </td>

                        {/* 4. State */}
                        <td className="ax-table__td" style={{ textTransform: 'uppercase', fontWeight: 500, fontSize: 13 }}>
                          {item.state || 'BIHAR'}
                        </td>

                        {/* 5. District */}
                        <td className="ax-table__td">
                          <b>{item.district || DASH}</b>
                        </td>

                        {/* 6. Site Name - Deadline */}
                        <td className="ax-table__td" style={{ minWidth: 220 }}>
                          {renderSiteNameSnippet(item)}
                        </td>

                        {/* 7. Count */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px',
                              borderRadius: 'var(--ax-radius-pill, 9999px)',
                              background: 'rgba(var(--ax-accent-rgb, 73, 146, 255), 0.12)',
                              color: 'var(--ax-accent)',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                            onClick={() => setViewBatch(item)}
                            title="Click to view sites in this batch"
                          >
                            {siteCount}
                          </button>
                        </td>

                        {/* 8. File */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <InstallationThumbnail
                              src={fileUrl}
                              alt="Work Order"
                              onPreview={(url, title) => setPreviewFile({ url, title })}
                              size={32}
                            />
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>

                        {/* 9. Remarks */}
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 180, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.remarks || ''}
                        >
                          {item.remarks || DASH}
                        </td>

                        {/* 10. Status */}
                        <td className="ax-table__td">
                          {isAccepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                              ✓ Accepted
                            </span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>
                              Pending Accept
                            </span>
                          )}
                        </td>

                        {/* 11. Action */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            {!isAccepted ? (
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--sm"
                                onClick={() => handleAccept(item.id)}
                                disabled={actionLoadingId !== null}
                              >
                                {actionLoadingId === item.id ? (
                                  <>
                                    <span className="ax-spinner" />
                                    Accepting…
                                  </>
                                ) : (
                                  'Accept'
                                )}
                              </button>
                            ) : (
                              <span
                                className="ax-badge ax-badge--soft ax-badge--success"
                                style={{ fontWeight: 600, padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center' }}
                              >
                                Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Goa / Karnataka SWP style: left-aligned pagination) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredAssignments.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── View Batch Sites Modal (Interactive table with site details matching Goa) ── */}
      {viewBatch && (
        <Modal
          open={!!viewBatch}
          onClose={() => setViewBatch(null)}
          labelledBy="view-batch-modal-title"
          dialogStyle={{ maxWidth: 780 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <h3 id="view-batch-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Assignment Batch #{viewBatch.id} · Sites List
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                District: <b>{viewBatch.district || 'Bihar'}</b> · State: <b>{(viewBatch.state || 'Bihar').toUpperCase()}</b> · Total: <b>{getSiteCount(viewBatch)} Sites</b>
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setViewBatch(null)}
              aria-label="Close modal"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              {X_ICON}
            </button>
          </div>
          <div className="ax-modal__body" style={{ padding: '16px 20px', maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, padding: '12px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border)' }}>
              <div style={{ fontSize: 12 }}><span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span><b>{viewBatch.vendors?.name || (viewBatch as any).vendor_name || `Vendor #${viewBatch.vendor || viewBatch.company_id || viewBatch.id}`}</b></div>
              <div style={{ fontSize: 12 }}><span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span><b>{viewBatch.assign_date || viewBatch.created_at || DASH}</b></div>

              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
                {Number(viewBatch.status) === 2 || String(viewBatch.status).toLowerCase() === 'accepted' ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Accepted</span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending Accept</span>
                )}
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600, color: 'var(--ax-text-strong)' }}>
              Sites in this Batch ({getSiteCount(viewBatch)})
            </h4>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 13 }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>#</th>
                    <th className="ax-table__th">Site Name / ID</th>
                    <th className="ax-table__th" style={{ width: 190 }}>Deadline</th>
                    <th className="ax-table__th" style={{ width: 130, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSiteRows(viewBatch).map((st, i) => (
                    <tr key={st.id || i} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center', color: 'var(--ax-text-muted)' }}>{i + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{st.name}</td>
                      <td className="ax-table__td" style={{ color: '#000000', fontSize: 13 }}>
                        {st.deadline || viewBatch.deadline_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <span
                          className="ax-badge ax-badge--soft ax-badge--success"
                          style={{ fontWeight: 600, padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}
                        >
                          Done
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--ax-border)' }}>
            {Number(viewBatch.status) !== 2 && String(viewBatch.status).toLowerCase() !== 'accepted' && (
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={async () => {
                  const bId = viewBatch.id;
                  setViewBatch(null);
                  await handleAccept(bId);
                }}
                disabled={actionLoadingId === viewBatch.id}
              >
                {actionLoadingId === viewBatch.id ? 'Accepting…' : 'Accept Batch'}
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => setViewBatch(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── File Preview Modal ── */}
      {previewFile && (
        <ImagePreviewModal
          url={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

export default Bihar_Installation_SRT_RequestAccept;
