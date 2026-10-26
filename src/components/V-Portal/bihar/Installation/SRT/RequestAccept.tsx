import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  KpiSkeleton,
  type ExportColumn,
} from '../../../../../common';

/* ── Styles: KPI cards + single-line header (Search + Export with flex row & gap, identical to ViewInstallation.tsx) ── */
const VIEW_CSS = `
.bsv-page {
  --bsv-card-radius: var(--ax-radius-lg);
}
.bsv-page .ax-dash-grid {
  align-items: stretch;
  gap: var(--ax-space-4);
}
.bsv-kpi {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ax-border);
  border-radius: var(--bsv-card-radius);
  background: var(--ax-bg-surface, var(--ax-surface-solid));
  box-shadow: var(--ax-shadow-sm);
  transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
}
.bsv-kpi:hover {
  box-shadow: var(--ax-shadow-md);
  border-color: var(--ax-border);
  transform: translateY(-1px);
}
.bsv-kpi::before { display: none; }
.bsv-kpi__body {
  height: 100%;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bsv-kpi__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}
.bsv-kpi__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bsv-kpi__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--ax-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--bsv-accent);
  background: color-mix(in srgb, var(--bsv-accent) 12%, transparent);
}
.bsv-kpi__icon svg { width: 16px; height: 16px; }
.bsv-kpi__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--ax-text-muted);
}
.bsv-kpi__caption {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ax-text-muted);
}
.bsv-kpi__head > .ax-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 6px;
}
.bsv-kpi__value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}
.bsv-kpi__value {
  font-family: var(--ax-font-display);
  font-size: 1.35rem;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ax-text-strong);
  font-variant-numeric: tabular-nums;
}
.bsv-kpi__unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted);
}
.bsv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  padding-top: 7px;
  border-top: 1px solid var(--ax-border-subtle);
}
.bsv-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--ax-text-muted);
}
.bsv-legend__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--c);
}
.bsv-legend__num {
  font-weight: 700;
  color: var(--ax-text-strong);
  font-variant-numeric: tabular-nums;
}

/* ── Card & Table Header (Exact pattern from ViewInstallation.tsx) ── */
.bsv-page .ax-card { min-width: 0; }

.bsv-page .ax-card__header {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: var(--ax-space-4) var(--ax-space-6);
  background: var(--ax-surface-subtle);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.bsv-page .ax-card__titles {
  flex: 1 1 220px;
  min-width: 220px;
  max-width: 100%;
}
.bsv-page .ax-card__title,
.bsv-page .ax-card__eyebrow,
.bsv-page .ax-card__subtitle {
  max-width: none;
  word-break: normal;
  overflow-wrap: normal;
  hyphens: none;
}
.bsv-page .ax-card__subtitle { line-height: 1.45; }

.bsv-page .ax-card__actions {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 8px;
}
.bsv-page .ax-card__actions .ax-cluster {
  flex-wrap: nowrap !important;
  min-width: 0;
  justify-content: flex-end;
  gap: var(--ax-space-2, 8px);
}
.bsv-page .ax-card__actions .ax-search,
.bsv-page .ax-card__actions [class*="search"] {
  flex: 1 1 160px;
  min-width: 200px;
  max-width: 260px;
}
.bsv-page .ax-card__actions input { min-width: 0; width: 100%; }
.bsv-page .ax-card__actions .ax-export-toolbar,
.bsv-page .ax-card__actions [class*="export-toolbar"] {
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 4px;
}
.bsv-page .ax-export-toolbar__button {
  padding-inline: 8px !important;
  min-width: 0;
}

.bsv-page .ax-table-wrap {
  width: 100%;
  overflow: auto;
  scrollbar-width: thin;
}
.bsv-page .ax-table {
  min-width: 800px;
}
.bsv-page .ax-table__th {
  font-size: var(--ax-text-2xs);
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--ax-text-muted);
  background: var(--ax-surface-subtle);
  white-space: nowrap;
}
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); vertical-align: middle; }
.bsv-page .bsv-benef {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--ax-text-strong);
}
.bsv-page .ax-alert { border-radius: var(--ax-radius-md); }

@media (max-width: 1100px) {
  .bsv-page .ax-export-toolbar__button {
    font-size: 0;
    gap: 0;
    padding: 0 8px !important;
    justify-content: center;
  }
  .bsv-page .ax-export-toolbar__button svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .bsv-page .ax-card__actions .ax-search,
  .bsv-page .ax-card__actions [class*="search"] { max-width: 200px; }
}

@media (max-width: 900px) {
  .bsv-kpi__body { padding: 11px 12px; }
  .bsv-kpi__value { font-size: 1.25rem; }
}

@media (max-width: 760px) {
  .bsv-page .ax-card__header {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 10px;
  }
  .bsv-page .ax-card__titles {
    flex: 0 0 auto;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
  .bsv-page .ax-card__title {
    font-family: var(--ax-font-display);
    font-size: var(--ax-text-md);
    line-height: var(--ax-leading-md);
  }
  .bsv-page .ax-card__actions {
    flex: 0 0 auto;
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .bsv-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important;
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
  }
  .bsv-page .ax-card__actions .ax-search,
  .bsv-page .ax-card__actions [class*="search"] {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .bsv-page .ax-card__actions .ax-export-toolbar,
  .bsv-page .ax-card__actions [class*="export-toolbar"] {
    flex: 1 1 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
  }
  .bsv-page .ax-export-toolbar__button {
    font-size: 12px;
    gap: 4px;
    height: 30px;
    padding: 0 8px !important;
  }
}

@media (max-width: 490px) {
  .bsv-page .ax-export-toolbar__button {
    font-size: 11px;
    height: 28px;
    padding: 0 6px !important;
  }
  .bsv-page .ax-export-toolbar { gap: 4px; }
}
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

const ICON_PROPS = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_CHECK = (
  <svg className="ax-btn__icon" {...ICON_PROPS} strokeWidth={2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_EYE = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component (matches src/pages/ui/Modals.tsx) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
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
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
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

/* ───────── KPI Card (exact same as Survey/SRT200MW/ViewData.tsx) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const DASH = '—';

export function Bihar_Installation_SRT_RequestAccept() {
  const [assignments, setAssignments] = useState<SrtAssignBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected batch for viewing site list in modal
  const [viewBatch, setViewBatch] = useState<SrtAssignBatchItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharSrtInstallationService.getViewAssignSites();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[SRT RequestAccept] load error:', err);
      setAssignments([]);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load assigned batches.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Accept
  const handleAccept = async (id: number) => {
    if (!window.confirm(`Are you sure you want to accept installation batch #${id}?`)) return;
    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await biharSrtInstallationService.acceptAssignSite(id);
      setFeedbackMsg({ type: 'success', text: res.message || 'Installation batch accepted successfully!' });
      setAssignments((prev) => prev.map((item) => (item.id === id ? { ...item, status: 2 } : item)));
      setViewBatch((prev) => (prev && prev.id === id ? { ...prev, status: 2 } : prev));
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to accept installation batch.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI calculations
  const totalAssignments = assignments.length;
  const totalSites = useMemo(() => assignments.reduce((acc, a) => acc + (Number(a.sitecount) || (a.site_names?.length || 0)), 0), [assignments]);
  const acceptedCount = useMemo(() => assignments.filter((a) => Number(a.status) === 2).length, [assignments]);
  const pendingCount = totalAssignments - acceptedCount;
  const acceptedPct = totalAssignments > 0 ? Math.round((acceptedCount / totalAssignments) * 100) : 0;
  const pendingPct = totalAssignments > 0 ? Math.round((pendingCount / totalAssignments) * 100) : 0;

  // Filtered
  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) => {
      const idMatch = String(a.id).includes(q);
      const distMatch = String(a.district || '').toLowerCase().includes(q);
      const stateMatch = String(a.state || '').toLowerCase().includes(q);
      const siteNamesMatch = a.site_names?.some((s) => String(s.site_name || '').toLowerCase().includes(q));
      return idMatch || distMatch || stateMatch || siteNamesMatch;
    });
  }, [assignments, search]);

  // Paginated
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Export Columns (without Batch ID)
  const exportCols: ExportColumn<SrtAssignBatchItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => idx + 1 },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Count', accessor: (r) => r.sitecount || r.site_names?.length || 0 },
      { header: 'Sites', accessor: (r) => (r.site_names || []).map((s) => s.site_name).join(', ') },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Pending Acceptance') },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filteredAssignments, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_Assigned_Batches', filteredAssignments, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_Assigned_Batches', filteredAssignments, exportCols);
  const handlePdf = () => printTableData('Bihar SRT Assigned Batches', filteredAssignments, exportCols);

  return (
    <div className="ax-page bsv-page">
      <style>{VIEW_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="SRT-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Request Accept' },
        ]}
        actions={
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
            {ICON_REFRESH}
            <span className="ax-btn__label">Refresh</span>
          </button>
        }
      />

      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedbackMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedbackMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Assignments"
              value={totalAssignments.toLocaleString('en-IN')}
              sub={`${acceptedCount} accepted · ${pendingCount} pending`}
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Pending Acceptance"
              value={pendingCount.toLocaleString('en-IN')}
              sub={`${pendingPct}% of total · Action required`}
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Accepted Batches"
              value={acceptedCount.toLocaleString('en-IN')}
              sub={`${acceptedPct}% accepted · Ready to install`}
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="cyan"
              label="Total Allocated Sites"
              value={totalSites.toLocaleString('en-IN')}
              sub="Cumulative rooftop installations"
              icon={svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card (Card Header matches ViewInstallation.tsx) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Batches">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Assigned Installation Batches</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredAssignments.length}</span> of <span className="ax-num">{assignments.length}</span> records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search district, site name…"
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
                Loading assigned installation batches…
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <TableEmptyState
              title="No installation assignments found"
              message={
                search
                  ? 'No assignments match your search filter. Try clearing your query.'
                  : 'Assigned installation requests will appear here once allocated.'
              }
              onClear={search ? () => setSearch('') : undefined}
              clearLabel="Clear search"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                  <caption className="ax-visually-hidden">Assigned Installation Batches</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      <th className="ax-table__th" scope="col">State</th>
                      <th className="ax-table__th" scope="col">District</th>
                      <th className="ax-table__th" scope="col">Site Count</th>
                      <th className="ax-table__th" scope="col">Assigned Sites</th>
                      <th className="ax-table__th" scope="col">Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((row, index) => {
                      const isAccepted = Number(row.status) === 2;
                      const isActioning = actionLoadingId === row.id;
                      const sites = row.site_names || [];
                      const siteCount = row.sitecount ?? sites.length;

                      return (
                        <tr key={row.id} className="ax-table__row">
                          <td className="ax-table__td">{(currentPage - 1) * pageSize + index + 1}</td>
                          <td className="ax-table__td">{row.state || 'Bihar'}</td>
                          <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)' as any }}>{row.district || DASH}</td>
                          <td className="ax-table__td">
                            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                              {siteCount} {siteCount === 1 ? 'Site' : 'Sites'}
                            </span>
                          </td>
                          <td className="ax-table__td">
                            {sites.length > 0 ? (
                              <div className="ax-cluster" style={{ gap: 6, alignItems: 'center' }}>
                                <span className="bsv-benef" title={sites[0].site_name}>{sites[0].site_name}</span>
                                {sites.length > 1 && (
                                  <button
                                    type="button"
                                    className="ax-badge ax-badge--soft ax-badge--neutral"
                                    style={{ cursor: 'pointer', border: 0 }}
                                    onClick={() => setViewBatch(row)}
                                  >
                                    +{sites.length - 1} more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>{row.site_name || DASH}</span>
                            )}
                          </td>
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ax-badge--pill ${isAccepted ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                              <span className="ax-badge__dot" />
                              {isAccepted ? 'Accepted' : 'Pending Accept'}
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setViewBatch(row)}>
                                {ICON_EYE}
                                <span className="ax-btn__label">View Sites</span>
                              </button>
                              {!isAccepted && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  disabled={isActioning}
                                  onClick={() => handleAccept(row.id)}
                                >
                                  {isActioning ? <span className="ax-spinner" /> : ICON_CHECK}
                                  <span className="ax-btn__label">Accept</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredAssignments.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </section>
      </div>

      {/* ── View Batch Sites Modal (Design from src/pages/ui/Modals.tsx) ── */}
      <Modal
        open={Boolean(viewBatch)}
        onClose={() => setViewBatch(null)}
        labelledBy="m-view-sites-title"
        dialogClass="ax-modal__dialog--lg ax-modal__dialog--scrollable"
      >
        <div className="ax-modal__header">
          <div>
            <h2 className="ax-modal__title" id="m-view-sites-title" style={{ fontSize: '1.15rem' }}>
              Assignment Details — Batch #{viewBatch?.id}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              District: {viewBatch?.district || DASH} · {(viewBatch?.site_names || []).length} {(viewBatch?.site_names || []).length === 1 ? 'Site' : 'Sites'}
            </p>
          </div>
          <button
            type="button"
            className="ax-modal__close"
            onClick={() => setViewBatch(null)}
            aria-label="Close dialog"
          >
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {(viewBatch?.site_names || []).length === 0 ? (
            <TableEmptyState title="No sites listed" message="No sites attached to this assignment batch." />
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col">Sr.</th>
                    <th className="ax-table__th" scope="col">Site ID</th>
                    <th className="ax-table__th" scope="col">Site Name</th>
                    <th className="ax-table__th" scope="col">Installation Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewBatch?.site_names || []).map((s, idx) => (
                    <tr key={s.id || idx} className="ax-table__row">
                      <td className="ax-table__td">{idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}>
                        #{s.id}
                      </td>
                      <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', fontWeight: 500 }}>
                        {s.site_name || DASH}
                      </td>
                      <td className="ax-table__td">{s.inst_deadline || DASH}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {viewBatch && Number(viewBatch.status) !== 2 && (
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={actionLoadingId === viewBatch.id}
                onClick={() => handleAccept(viewBatch.id)}
              >
                {actionLoadingId === viewBatch.id ? <span className="ax-spinner" /> : ICON_CHECK}
                <span className="ax-btn__label">Accept Installation</span>
              </button>
            )}
          </div>
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={() => setViewBatch(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Bihar_Installation_SRT_RequestAccept;
