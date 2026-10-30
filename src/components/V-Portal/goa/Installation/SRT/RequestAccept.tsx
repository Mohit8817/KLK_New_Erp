import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtAssignBatchItem,
} from '../../goa-services/goaSrtInstallationService';
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

/* ───────── KPI Card (same style as Goa SRT Survey) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

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
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
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

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS, size 34) ── */
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
  const candidates = useMemo(() => getGoaSrtInstallationImageCandidates(src), [src]);
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

export function Goa_Installation_SRT_RequestAccept() {
  const [assignments, setAssignments] = useState<GoaSrtAssignBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected batch for viewing site list in modal
  const [viewBatch, setViewBatch] = useState<GoaSrtAssignBatchItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goaSrtInstallationService.getViewAssignSites();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('[Goa SRT RequestAccept] load error:', err);
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
      const res = await goaSrtInstallationService.acceptAssignSite(id);
      setFeedbackMsg({ type: 'success', text: res?.message || 'Status Updated Successfully!!!' });
      // Update local state to status = 2 (accepted)
      setAssignments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 2 } : item))
      );
    } catch (err: any) {
      setFeedbackMsg({
        type: 'danger',
        text: err?.message || 'Failed to accept assignment. Please try again.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Summary counts (status === 2 is accepted)
  const summary = useMemo(() => {
    const accepted = assignments.filter((a) => a.status === 2).length;
    return { total: assignments.length, accepted, pending: assignments.length - accepted };
  }, [assignments]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.district && a.district.trim()) set.add(a.district.trim());
    });
    return Array.from(set).sort();
  }, [assignments]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Status filter: status === 2 is accepted, status !== 2 is pending
      if (statusFilter === 'pending' && a.status === 2) return false;
      if (statusFilter === 'accepted' && a.status !== 2) return false;

      // District filter
      if (districtFilter !== 'all' && (a.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const vendorName = (a.vendors?.name || (a as any).vendor_name || String(a.vendor || '')).toLowerCase();
        const siteNamesStr = Array.isArray(a.site_name) ? a.site_name.join(' ').toLowerCase() : String(a.site_name || '').toLowerCase();
        const dist = (a.district || '').toLowerCase();
        const rem = (a.remarks || '').toLowerCase();
        const idStr = String(a.id);

        if (!idStr.includes(q) && !vendorName.includes(q) && !siteNamesStr.includes(q) && !dist.includes(q) && !rem.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, statusFilter, districtFilter, search]);

  // Paginated slice
  const paginatedData = useMemo(() => {
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

  const setStatus = (s: 'all' | 'pending' | 'accepted') => {
    setStatusFilter(s);
    setCurrentPage(1);
  };

  // Export Columns (Exact match with 10 table headers)
  const exportCols: ExportColumn<GoaSrtAssignBatchItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, i) => String((i ?? 0) + 1) },
      { header: 'Vendor', accessor: (r) => r.vendors?.name || (r as any).vendor_name || `Vendor #${r.vendor}` },
      { header: 'Assign Date', accessor: (r) => r.assign_date || r.created_at || DASH },
      { header: 'State', accessor: (r) => r.state || 'goa' },
      { header: 'District', accessor: (r) => r.district || DASH },
      {
        header: 'Site Name - Deadline',
        accessor: (r) => (Array.isArray(r.site_name) ? r.site_name.join(', ') : String(r.site_name || DASH)),
      },
      {
        header: 'Site Count',
        accessor: (r) => String(Number(r.site_count) || (Array.isArray(r.site_name) ? r.site_name.length : 1)),
      },
      { header: 'File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending') },
    ],
    []
  );

  const getSiteCount = (batch: GoaSrtAssignBatchItem): number => {
    if (batch.site_count !== undefined && batch.site_count !== null && batch.site_count !== '') {
      const n = Number(batch.site_count);
      if (!isNaN(n) && n > 0) return n;
    }
    if (Array.isArray(batch.site_name)) return batch.site_name.length;
    return 1;
  };

  const renderSiteNameSnippet = (batch: GoaSrtAssignBatchItem) => {
    if (Array.isArray(batch.site_name) && batch.site_name.length > 0) {
      const first = batch.site_name[0];
      const count = batch.site_name.length;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{first}</span>
          {count > 1 && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              style={{ padding: '0 4px', height: 20, fontSize: 11, alignSelf: 'flex-start', color: 'var(--ax-accent)' }}
              onClick={() => setViewBatch(batch)}
            >
              + {count - 1} more sites
            </button>
          )}
        </div>
      );
    }
    return String(batch.site_name || DASH);
  };

  const TOTAL_COLUMNS = 10;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Assigned SRT Installation"
        subtitle="Welcome to, View Assigned SRT Installation"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'View Assigned SRT Installation' },
          { label: 'Assigned SRT Site' },
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

      {/* ── KPI Cards (click to filter) ── */}
      {!loading && (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <KpiCard
            tone="accent"
            label="Total Assigned"
            value={summary.total.toLocaleString('en-IN')}
            sub="All assigned batches"
            active={statusFilter === 'all'}
            onClick={() => setStatus('all')}
            icon={svg(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />
          <KpiCard
            tone="amber"
            label="Pending"
            value={summary.pending.toLocaleString('en-IN')}
            sub="Waiting for acceptance"
            active={statusFilter === 'pending'}
            onClick={() => setStatus('pending')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </>
            )}
          />
          <KpiCard
            tone="emerald"
            label="Accepted"
            value={summary.accepted.toLocaleString('en-IN')}
            sub="Accepted by vendor"
            active={statusFilter === 'accepted'}
            onClick={() => setStatus('accepted')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned SRT Site Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">ASSIGNED SITES</span>
              <h2 className="ax-card__title">View Installation Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredAssignments.length} of {assignments.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
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
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value as 'all' | 'pending' | 'accepted')}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
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
                  placeholder="Search vendor, site, district…"
                  size="sm"
                  ariaLabel="Search assignments"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredAssignments, exportCols)}
                  onExportCSV={() => exportDataToCSV('Goa_SRT_Assigned_Sites', filteredAssignments, exportCols)}
                  onExportExcel={() => exportDataToExcel('Goa_SRT_Assigned_Sites', filteredAssignments, exportCols)}
                  onExportPDF={() => printTableData('Goa Assigned SRT Installation Sites', filteredAssignments, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1600 }}
            >
              <caption className="ax-visually-hidden">View Assigned SRT Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 200 }}>Site Name - Deadline</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>File</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned installation sites…
                    </td>
                  </tr>
                )}
                {!loading && filteredAssignments.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'Assigned installation sites will appear here.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((item, index) => {
                    const isAccepted = item.status === 2;
                    const siteCount = getSiteCount(item);
                    const fileCandidates = getGoaSrtInstallationImageCandidates(item.file);
                    const fileUrl = fileCandidates[0];

                    return (
                      <tr key={item.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {item.vendors?.name || (item as any).vendor_name || `Vendor #${item.vendor}`}
                  
                        </td>
                        <td className="ax-table__td">{item.assign_date || item.created_at || DASH}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{item.state || 'goa'}</td>
                        <td className="ax-table__td">{item.district || DASH}</td>
                        <td className="ax-table__td">{renderSiteNameSnippet(item)}</td>
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
                              background: 'rgba(var(--ax-accent-rgb, 73, 146, 255), 0.1)',
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
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallationThumbnail
                            src={fileUrl || item.file}
                            alt="Work Order"
                            onPreview={(url, title) => setPreviewFile({ url, title })}
                            size={34}
                          />
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {item.remarks || DASH}
                        </td>
                        <td className="ax-table__td">
                          {isAccepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                              Accepted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-badge ax-badge--soft ax-badge--warning"
                              style={{ fontWeight: 600, cursor: 'pointer', border: 'none' }}
                              onClick={() => handleAccept(item.id)}
                              disabled={actionLoadingId !== null}
                              title="Click to accept assignment"
                            >
                              {actionLoadingId === item.id ? 'Accepting…' : 'Pending'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Punjab-style: pagination only) ── */}
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

      {/* ── View Batch Sites Modal ── */}
      {viewBatch && (
        <Modal
          open={!!viewBatch}
          onClose={() => setViewBatch(null)}
          labelledBy="view-batch-modal-title"
          dialogStyle={{ maxWidth: 620 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <h3 id="view-batch-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Batch #{viewBatch.id} Sites List
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                District: <b>{viewBatch.district || 'Goa'}</b> · Total: <b>{getSiteCount(viewBatch)} sites</b>
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setViewBatch(null)}
              aria-label="Close modal"
            >
              {X_ICON}
            </button>
          </div>
          <div className="ax-modal__body" style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
            {Array.isArray(viewBatch.site_name) && viewBatch.site_name.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewBatch.site_name.map((st, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--ax-surface-subtle)',
                      border: '1px solid var(--ax-border-subtle, var(--ax-border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{st}</span>
                    {viewBatch.deadline_date && (
                      <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontSize: 11 }}>
                        Due: {viewBatch.deadline_date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>{String(viewBatch.site_name || 'No individual site names provided in batch.')}</p>
            )}
          </div>
          <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
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

export default Goa_Installation_SRT_RequestAccept;