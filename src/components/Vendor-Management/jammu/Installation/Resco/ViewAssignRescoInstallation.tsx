import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  type JammuRescoAssignedSiteItem,
  type JammuRescoAssignedDetailData,
} from '../../../../V-Portal/jammu/jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Badges & Status ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const formatDate = (val?: any): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(val);
  }
};

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
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

/* ───────── Styles matching ERP Layout ───────── */
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
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Modal */
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
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
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
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

const actionsRowStyle: CSSProperties = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' };

export const ViewAssignRescoInstallation: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<JammuRescoAssignedSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Detail Modal State
  const [detailModalItem, setDetailModalItem] = useState<JammuRescoAssignedSiteItem | null>(null);
  const [detailData, setDetailData] = useState<JammuRescoAssignedDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, detailModalItem !== null);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load live data from API
  const loadAssignedSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoService.getAssignedSites();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Admin Jammu RESCO Assigned] load error:', err);
      setRecords([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned RESCO sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignedSites();
  }, [loadAssignedSites]);

  // Handle Accept Assignment
  const handleDirectAccept = async (id?: number | string) => {
    if (!id) return;
    const numId = Number(id);
    setAcceptingId(numId);
    try {
      const res = await jammuRescoService.acceptAssignment(numId);
      setToastMsg({
        type: 'success',
        text: res.message || `Installation Assignment #${numId} accepted successfully!`,
      });

      // Update state optimistically
      setRecords((prev) =>
        prev.map((r) => (Number(r.id) === numId ? { ...r, status: 2 } : r))
      );

      if (detailModalItem && Number(detailModalItem.id) === numId) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 2 } : null));
      }
    } catch (err: any) {
      console.error('[Admin Jammu RESCO Accept] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to accept installation assignment.' });
    } finally {
      setAcceptingId(null);
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (item: JammuRescoAssignedSiteItem) => {
    setDetailModalItem(item);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const detail = await jammuRescoService.getAssignedSiteDetail(item.id);
      setDetailData(detail);
    } catch (err: any) {
      console.warn('[Admin Jammu RESCO Assigned] fetchDetail warning:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Unique Districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [records]);

  // Metrics
  const totalBatches = records.length;
  const acceptedBatches = useMemo(
    () => records.filter((r) => Number(r.status) === 2).length,
    [records]
  );
  const pendingBatches = totalBatches - acceptedBatches;
  const acceptRate = totalBatches > 0 ? Math.round((acceptedBatches / totalBatches) * 100) : 0;

  // Filtered
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (districtFilter !== 'all' && r.district !== districtFilter) return false;
      if (statusFilter === 'pending' && Number(r.status) === 2) return false;
      if (statusFilter === 'accepted' && Number(r.status) !== 2) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const v = String(r.inst_vendor || r.vendor || '').toLowerCase();
        const s = String(r.site_name || '').toLowerCase();
        const d = String(r.district || '').toLowerCase();
        const rem = String(r.remarks || r.remark || '').toLowerCase();
        if (!v.includes(q) && !s.includes(q) && !d.includes(q) && !rem.includes(q) && !String(r.id).includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, districtFilter, statusFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoAssignedSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r) => String(r.inst_vendor || r.vendor || '—') },
      { header: 'Assign Date', accessor: (r) => formatDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || '—' },
      { header: 'Deadline', accessor: (r) => formatDate(r.inst_deadline) },
      { header: 'Count', accessor: (r) => r.count ?? 1 },
      { header: 'Remarks', accessor: (r) => r.remarks || r.remark || '—' },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Assigned') },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Assigned Installation Sites"
        subtitle="Manage and accept RESCO solar rooftop installation work orders, developer allocations, and deadlines"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'View Assigned Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              + Assign Installation
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-vendor-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              + Vendor Installation
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assigned Sites"
          value={totalBatches.toLocaleString('en-IN')}
          sub="Total site allocations"
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
          value={pendingBatches.toLocaleString('en-IN')}
          sub="Awaiting vendor acceptance"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Sites"
          value={acceptedBatches.toLocaleString('en-IN')}
          sub="Ready for field execution"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Acceptance Rate"
          value={`${acceptRate}%`}
          sub={`${acceptedBatches} of ${totalBatches} sites`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Resco Sites Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Resco Sites</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> site batches
              {' '}· Accepted <b className="ax-num">{acceptedBatches}</b> · Pending <b className="ax-num">{pendingBatches}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, district…"
                size="sm"
                ariaLabel="Search assigned sites"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Assigned_Sites')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Assigned_Sites')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Assigned Sites Register')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">Assign Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name - Deadline</th>
                <th className="ax-table__th" scope="col">Count</th>
                <th className="ax-table__th" scope="col">File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned RESCO sites from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned RESCO sites found"
                      message={hasFilters ? 'No records match your filters. Try clearing your query.' : 'No site allocations currently assigned.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isAccepted = Number(row.status) === 2;
                  const assignDate = formatDate(row.assign_date || row.created_at);
                  const deadlineDate = formatDate(row.inst_deadline);
                  const rowId = Number(row.id);
                  const fileUrl = row.file ? resolveJammuMediaUrl(row.file) : null;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {String(row.inst_vendor || row.vendor || '—')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {assignDate}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>

                      {/* Site Name - Deadline */}
                      <td className="ax-table__td" style={{ maxWidth: 320, whiteSpace: 'normal', fontSize: 12 }}>
                        <div
                          style={{
                            display: 'inline-block',
                            background: 'var(--ax-surface-subtle, #f8fafc)',
                            border: '1px solid var(--ax-border, #e2e8f0)',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          <b style={{ color: 'var(--ax-text-strong)' }}>{row.site_name || `Site ${row.site_id || row.id}`}</b>
                          {deadlineDate !== '—' && (
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 6 }}>
                              (Deadline: {deadlineDate})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {row.count ?? 1}
                      </td>

                      {/* Document File link */}
                      <td className="ax-table__td">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            View File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.remarks || row.remark || '—'}
                      </td>

                      {/* Status */}
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Assigned</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => handleOpenDetailModal(row)}
                            style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                          >
                            View Sites
                          </button>

                          {!isAccepted && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleDirectAccept(rowId)}
                              disabled={acceptingId === rowId}
                              style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                            >
                              {acceptingId === rowId ? 'Accepting…' : 'Accept'}
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

        {/* ── Card Footer with Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>

      {/* ── Modal: Itemized Assigned Sites Breakdown ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 860 }}>
            <div className="ax-modal__header">
              <div>
                <h3 id="modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Assigned RESCO Sites Breakdown
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Vendor: <b>{String(detailModalItem.inst_vendor || detailModalItem.vendor || '—')}</b> · District: <b>{detailModalItem.district || '—'}</b> · Allocation ID: #{detailModalItem.id}
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailModalItem(null)}
                aria-label="Close modal"
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 36 }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading allocation details…
                </div>
              ) : !detailData?.sites || detailData.sites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' }}>
                  No itemized individual sites found in this allocation batch.
                </div>
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                    <thead className="ax-table__head">
                      <tr>
                        <th className="ax-table__th" scope="col">Sr. No.</th>
                        <th className="ax-table__th" scope="col">Assign Date</th>
                        <th className="ax-table__th" scope="col">State</th>
                        <th className="ax-table__th" scope="col">District</th>
                        <th className="ax-table__th" scope="col">Site Name</th>
                        <th className="ax-table__th" scope="col">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="ax-table__body">
                      {detailData.sites.map((st, i) => (
                        <tr key={st.sr_no || i} className="ax-table__row">
                          <td className="ax-table__td ax-num">{i + 1}</td>
                          <td className="ax-table__td" style={{ fontSize: 12 }}>{formatDate(st.assign_date)}</td>
                          <td className="ax-table__td">{st.state || 'Jammu & Kashmir'}</td>
                          <td className="ax-table__td"><b>{st.district || '—'}</b></td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {st.site_name || `Site #${i + 1}`}
                          </td>
                          <td className="ax-table__td" style={{ fontSize: 12 }}>{formatDate(st.inst_deadline)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              {Number(detailModalItem.status) !== 2 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => handleDirectAccept(detailModalItem.id)}
                  disabled={acceptingId === Number(detailModalItem.id)}
                >
                  {acceptingId === Number(detailModalItem.id) ? 'Accepting…' : 'Accept Allocation'}
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAssignRescoInstallation;
