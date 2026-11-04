import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoAssignSiteItem,
} from '../../up-services';
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

/* ───────── KPI Card ───────── */
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

/* ───────── Detail Modal for Site ───────── */
function SiteDetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: UpRescoAssignSiteItem | null;
  onClose: () => void;
}) {
  if (!open || !item) return null;

  const fileUrl = item.file ? resolveUpMediaUrl(item.file) : '';

  return (
    <Modal open onClose={onClose} labelledBy="site-detail-title" dialogStyle={{ maxWidth: 620 }}>
      <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
            Assigned Resco Site Details
          </span>
          <h3 id="site-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
            {item.site_name || `Site #${item.id}`}
          </h3>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ padding: 20 }}>
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)', marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Assignment Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span><strong>{item.vendor || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span><strong>{item.assign_date || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{(item.state || 'UP').toUpperCase()}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{item.district || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name: </span><strong>{item.site_name || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Deadline: </span><strong>{item.deadline || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Count: </span><strong>{item.count ?? 1}</strong></div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
              <span className={`ax-badge ax-badge--soft ${item.status === 2 ? 'ax-badge--success' : 'ax-badge--warning'}`} style={{ fontWeight: 600 }}>
                {item.status === 2 ? 'Accepted' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {item.remarks && (
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)', marginBottom: 14 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Remarks</h4>
            <p style={{ margin: 0, fontSize: 12.5 }}>{item.remarks}</p>
          </div>
        )}

        {fileUrl && (
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Attached File</h4>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost" style={{ fontSize: 12 }}>
              Download File ↗
            </a>
          </div>
        )}
      </div>

      <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Link
          to={`/v/up/resco-install-site?site_id=${item.id}`}
          className="ax-btn ax-btn--primary"
          style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13 }}
        >
          Go to Install
        </Link>
        <button type="button" className="ax-btn ax-btn--secondary" onClick={onClose} style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13 }}>
          Close
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Main Component ───────── */
export function UP_Installation_Resco_AssignedSites() {
  const [sites, setSites] = useState<UpRescoAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Detail modal
  const [detailItem, setDetailItem] = useState<UpRescoAssignSiteItem | null>(null);

  const handleAccept = async (id: number) => {
    setAcceptingId(id);
    try {
      const res = await upInstallationService.acceptRescoAssignment(id);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Assignment accepted successfully!' });
        setSites((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 2 } : s))
        );
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to accept assignment.' });
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'danger', text: e?.message || 'Error accepting assignment.' });
    } finally {
      setAcceptingId(null);
    }
  };

  const renderSiteNames = (raw: any, deadlineFallback?: string) => {
    if (!raw) return DASH;
    if (typeof raw === 'object' && raw !== null) {
      const entries = Object.entries(raw);
      if (entries.length === 0) return DASH;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {entries.map(([name, dl], idx) => (
            <div key={idx} style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{name}</span>
              {dl ? (
                <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 4 }}>
                  ({String(dl)})
                </span>
              ) : null}
            </div>
          ))}
        </div>
      );
    }
    return (
      <span>
        {String(raw)}{' '}
        {deadlineFallback && (
          <span style={{ color: 'var(--ax-text-muted)', fontSize: 11 }}>
            ({deadlineFallback})
          </span>
        )}
      </span>
    );
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoAssignSites();
      setSites(res.data || []);
    } catch (err: any) {
      console.warn('[UP Resco AssignedSites] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load assigned Resco sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Summary counts
  const summary = useMemo(() => {
    const accepted = sites.filter((s) => s.status === 2).length;
    return { total: sites.length, accepted, pending: sites.length - accepted };
  }, [sites]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district && s.district.trim()) set.add(s.district.trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered data
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      // Status filter
      if (statusFilter === 'pending' && s.status === 2) return false;
      if (statusFilter === 'accepted' && s.status !== 2) return false;

      // District filter
      if (districtFilter !== 'all' && (s.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const vendorStr = String(s.vendor || '').toLowerCase();
        const siteStr = String(s.site_name || '').toLowerCase();
        const distStr = String(s.district || '').toLowerCase();
        const remarksStr = String(s.remarks || '').toLowerCase();
        const dateStr = String(s.assign_date || '').toLowerCase();
        const idStr = String(s.id);

        if (
          !idStr.includes(q) &&
          !vendorStr.includes(q) &&
          !siteStr.includes(q) &&
          !distStr.includes(q) &&
          !remarksStr.includes(q) &&
          !dateStr.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [sites, statusFilter, districtFilter, search]);

  // Paginated slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

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

  // Export columns
  const exportCols: ExportColumn<UpRescoAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: UpRescoAssignSiteItem, i: number) => String(i + 1) },
      { header: 'Vendor', accessor: (r) => r.vendor || DASH },
      { header: 'Assign Date', accessor: (r) => r.assign_date || DASH },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Deadline', accessor: (r) => r.deadline || DASH },
      { header: 'Count', accessor: (r) => String(r.count ?? 1) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending') },
    ],
    []
  );

  const TOTAL_COLUMNS = 12;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Assigned Resco Installation"
        subtitle="Welcome to, View Assigned Resco Installation"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'View Assigned Resco Installation' },
          { label: 'Assigned Resco Site' },
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
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Site
            </Link>
          </div>
        }
      />

      {/* ── Feedback Alert ── */}
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

      {/* ── Main Table Card ── */}
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned Resco Site Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">ASSIGNED SITES</span>
              <h2 className="ax-card__title">View Assigned Resco Installation</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSites.length} of {sites.length} records
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
                  onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                  onExportCSV={() => exportDataToCSV('UP_Resco_Assigned_Sites', filteredSites, exportCols)}
                  onExportExcel={() => exportDataToExcel('UP_Resco_Assigned_Sites', filteredSites, exportCols)}
                  onExportPDF={() => printTableData('UP Assigned Resco Installation Sites', filteredSites, exportCols)}
                />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1400 }}
            >
              <caption className="ax-visually-hidden">View Assigned Resco Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 200 }}>Site Name - Deadline</th>
                  <th className="ax-table__th" scope="col" style={{ width: 80, textAlign: 'center' }}>Count</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>File</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>View</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>Status</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned Resco sites…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'Assigned Resco installation sites will appear here.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((item, index) => {
                    const isAccepted = item.status === 2;
                    const fileUrl = item.file ? resolveUpMediaUrl(item.file) : '';

                    return (
                      <tr key={item.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {item.vendor || DASH}
                        </td>
                        <td className="ax-table__td">{item.assign_date || DASH}</td>
                        <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                          {item.state || 'UP'}
                        </td>
                        <td className="ax-table__td">{item.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {renderSiteNames(item.site_name, item.deadline)}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                          {item.count ?? (typeof item.site_name === 'object' && item.site_name !== null ? Object.keys(item.site_name).length : 1)}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              Download
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => setDetailItem(item)}
                          >
                            Details
                          </button>
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
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                            {!isAccepted && (
                              <button
                                type="button"
                                disabled={acceptingId === item.id}
                                onClick={() => handleAccept(item.id)}
                                className="ax-btn ax-btn--success ax-btn--xs"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                {acceptingId === item.id ? 'Accepting…' : 'Accept'}
                              </button>
                            )}
                            <Link
                              to={`/v/up/resco-install-site?site_id=${item.id}`}
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                            >
                              Install
                            </Link>
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
                pageSize={pageSize}
                totalItems={filteredSites.length}
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

      {/* ── Detail Modal ── */}
      <SiteDetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}

export default UP_Installation_Resco_AssignedSites;