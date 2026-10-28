import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabSslInstallationService,
  type PunjabAssignedLightItem,
} from '../../punjab-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
} from '../../../../../common';

/* ───────── Helpers ───────── */
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

// API: panchayat can be string, comma-separated or JSON
const parsePanchayat = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s;
    }
  }
  return '';
};

// API field names -> component field names
const normalizeRecord = (r: any): PunjabAssignedLightItem => ({
  ...r,
  panchayat: parsePanchayat(r.panchayat),
  status: Number(r.status) || 0,
});

/* ───────── DLE Layout CSS (same as SSL dashboard) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ssl-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ssl-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: max-content; max-width: 55%; }
  .solar-erp-page .ax-card__title { max-width: none; white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { word-break: normal; overflow-wrap: normal; line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 1 1 0; min-width: 0; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; min-width: 0; width: 100%; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 120px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export"] .ax-btn { padding-inline: 8px; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ssl-table--md { min-width: 820px; }

  .solar-erp-page .ssl-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ssl-filter-item select { width: 170px; }

  @media (min-width: 641px) {
    .solar-erp-page .ax-card__actions .ax-export-toolbar { width: auto; }
  }
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn span:not([class*="icon"]),
    .solar-erp-page .ax-card__actions [class*="export"] .ax-btn span:not([class*="icon"]) { display: none; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ssl-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ssl-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ssl-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 130px; }
    .solar-erp-page .ssl-sticky-first th:first-child,
    .solar-erp-page .ssl-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1; background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .ax-card__header { flex-wrap: wrap; }
    .solar-erp-page .ax-card__titles { min-width: 0; max-width: 100%; flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions { flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-start; }
    .solar-erp-page .ax-card__title {

      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-col--3,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
  }
`;

/* ───────── Icons (Tabler design) ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);

/* ───────── DLE Exact KPI Card ───────── */
interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  sub: string;
  badge?: string;
  onClick?: () => void;
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)' },
};

const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function KpiCard({ icon, tone, label, value, sub, badge, onClick }: KpiProps) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card ax-col--4"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={{ padding: '13px 15px',  display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-sm)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {ARROW_UP} {badge}
            </span>
          )}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const emptyCellStyle = { textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' } as const;


export function Punjab_Installation_SSL_AssignedLights() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PunjabAssignedLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PunjabAssignedLightItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await punjabSslInstallationService.getAssignedLights();
      setRecords(Array.isArray(data) ? data.map(normalizeRecord) : []);
    } catch (err: any) {
      console.error('[AssignedLights] load error:', err);
      setActionErrorMsg('Failed to load Punjab assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts for filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter: 1 = Pending, 2 = Accepted
      if (statusFilter === 'pending' && r.status === 2) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;

      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let pendingCount = 0;
    let acceptedCount = 0;
    records.forEach((r) => {
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
    });
    return { totalBatches, pendingCount, acceptedCount };
  }, [records]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [deferredQuery, statusFilter, districtFilter]);

  // Export Columns
  const exportCols: ExportColumn<PunjabAssignedLightItem>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'State', accessor: (r) => r.state || 'Punjab' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Status', accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Acceptance') },
  ];

  const handleExportCSV = () => exportDataToCSV('Punjab_SSL_Assigned_Lights', filtered, exportCols);
  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportPDF = () => printTableData('Punjab SSL Assigned Lights', filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel('Punjab_SSL_Assigned_Lights', filtered, exportCols);

  // Trigger Accept
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await punjabSslInstallationService.acceptAssignedLight(selectedItem.id);
      setActionSuccessMsg(res.message || 'Light assignment accepted successfully!');
      setAcceptModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to accept light assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtersActive = statusFilter !== 'all' || districtFilter !== 'all';
  const resetFilters = () => {
    setStatusFilter('all');
    setDistrictFilter('all');
  };
  const dash = (v: number) => (loading && records.length === 0 ? '…' : num(v));
  const acceptedPct = pctOf(metrics.acceptedCount, metrics.totalBatches);
  const pendingPct = pctOf(metrics.pendingCount, metrics.totalBatches);

  const statusTabs: Array<{ key: 'all' | 'pending' | 'accepted'; label: string; count: number }> = [
    { key: 'all', label: 'All', count: records.length },
    { key: 'pending', label: 'Pending', count: metrics.pendingCount },
    { key: 'accepted', label: 'Accepted', count: metrics.acceptedCount },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Assigned Lights"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Punjab State Operations · Manage and accept SSL installation site allocations
          </span>
        }
        breadcrumbs={[
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
          { label: 'Assigned Lights' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Punjab
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh list" onClick={loadData} disabled={loading}>
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* Notifications */}
        {actionSuccessMsg && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-emerald) 12%, transparent)', color: 'var(--ax-viz-emerald)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span><b>Success:</b> {actionSuccessMsg}</span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setActionSuccessMsg(null)} aria-label="Dismiss">✕</button>
          </div>
        )}
        {actionErrorMsg && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span><b>Error:</b> {actionErrorMsg}</span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setActionErrorMsg(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

 

        <KpiCard
          icon={I_LIST}
          tone="accent"
          label="Total Assigned Batches"
          value={dash(metrics.totalBatches)}
          sub="All allocations"
          onClick={() => setStatusFilter('all')}
        />
        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Acceptance"
          value={dash(metrics.pendingCount)}
          sub="Awaiting your acceptance"
          badge={metrics.pendingCount > 0 ? `${pendingPct}% Pending` : undefined}
          onClick={() => setStatusFilter('pending')}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Accepted Batches"
          value={dash(metrics.acceptedCount)}
          sub="Ready for installation"
          badge={metrics.acceptedCount > 0 ? `${acceptedPct}% Accepted` : undefined}
          onClick={() => setStatusFilter('accepted')}
        />

        {/* 4. Data Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned lights data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Site Allocation</span>
              <h2 className="ax-card__title">Assigned Light Batches</h2>
              <p className="ax-card__subtitle">Review district, block and panchayat allocations and accept pending batches</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, district, block..." size="sm" />
                <TableExportToolbar
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  onCopy={handleCopy}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ssl-table--md ssl-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">#</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={emptyCellStyle}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned light sites…
                    </td>
                  </tr>
                )}
                {!loading && pagination.paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No assigned lights found"
                        message={
                          searchQuery || filtersActive
                            ? 'No records match your filters. Try clearing your query.'
                            : 'No assigned lights currently allocated.'
                        }
                        onClear={
                          searchQuery || filtersActive
                            ? () => {
                                setSearchQuery('');
                                resetFilters();
                              }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagination.paginatedData.map((row, idx) => {
                    const isAccepted = row.status === 2;
                    return (
                      <tr key={row.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                          {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                          {row.vendor || '—'}
                        </td>
                        <td className="ax-table__td">
                          <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ textTransform: 'capitalize' }}>{row.state || 'Punjab'}</span>
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                          {row.district || '—'}
                        </td>
                        <td className="ax-table__td">{row.block || '—'}</td>
                        <td className="ax-table__td" style={{ maxWidth: 240, whiteSpace: 'normal', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                          {row.panchayat || '—'}
                        </td>
                        <td className="ax-table__td">
                          {isAccepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                              <span className="ax-badge__dot" />Accepted
                            </span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Pending Acceptance</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {isAccepted ? (
                            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>—</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ height: 26, padding: '0 10px', fontSize: '11px', gap: '4px' }}
                              onClick={() => {
                                setSelectedItem(row);
                                setAcceptModalOpen(true);
                              }}
                            >
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ssl-pagination-left">
              <Pagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Accept Confirmation Modal */}
      {acceptModalOpen && selectedItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-label="Confirm acceptance" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => !submitting && setAcceptModalOpen(false)}
          />
          <div
            className="ax-card"
            style={{
              position: 'relative', width: '92%', maxWidth: 480, display: 'flex', flexDirection: 'column',
              background: 'var(--ax-bg-surface)', borderRadius: 'var(--ax-radius-xl)', boxShadow: 'var(--ax-shadow-2xl)', overflow: 'hidden', zIndex: 10,
            }}
          >
            <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', background: 'var(--ax-surface-subtle)' }}>
              <div className="ax-card__titles" style={{ maxWidth: '85%' }}>
                <span className="ax-card__eyebrow">Punjab SSL · Site Allocation</span>
                <h2 className="ax-card__title">Confirm Acceptance</h2>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" disabled={submitting} onClick={() => setAcceptModalOpen(false)} aria-label="Close modal">✕</button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                Are you sure you want to accept this assigned light allocation?
              </p>
              <dl style={{ margin: 0, padding: 12, background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 'var(--ax-text-sm)' }}>
                <dt style={labelStyle}>Batch ID</dt>
                <dd className="ax-num" style={{ margin: 0, fontWeight: 600, color: 'var(--ax-accent)' }}>#{selectedItem.id}</dd>
                <dt style={labelStyle}>District</dt>
                <dd style={{ margin: 0, fontWeight: 600, color: 'var(--ax-text-strong)' }}>{selectedItem.district || '—'}</dd>
                <dt style={labelStyle}>Block</dt>
                <dd style={{ margin: 0, color: 'var(--ax-text-strong)' }}>{selectedItem.block || '—'}</dd>
                <dt style={labelStyle}>Panchayats</dt>
                <dd style={{ margin: 0, color: 'var(--ax-text-strong)' }}>{selectedItem.panchayat || '—'}</dd>
              </dl>
            </div>

            <div className="ax-card__footer" style={{ ...footerStyle, justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" disabled={submitting} onClick={() => setAcceptModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" disabled={submitting} onClick={handleConfirmAccept}>
                {submitting ? <><span className="ax-spinner" /> Accepting…</> : 'Confirm & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Punjab_Installation_SSL_AssignedLights;