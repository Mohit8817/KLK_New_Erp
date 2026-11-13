import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

export interface BiharSRTInstAssignRecord {
  id: number;
  vendor: string;
  assign_date: string;
  state: string;
  district: string;
  site_name_deadline: string;
  site_count: number;
  file: string;
  remarks: string;
  status: 0 | 1 | 2; // 0: Pending, 1: Approved, 2: Accepted
}

type FilterKey = 'all' | 'pending' | 'approved' | 'accepted';

const DASH = '—';

const statusKey = (s: number): Exclude<FilterKey, 'all'> => (s === 2 ? 'accepted' : s === 1 ? 'approved' : 'pending');
const statusLabel = (s: number) => (s === 2 ? 'Accepted' : s === 1 ? 'Approved' : 'Pending');
const statusTone = (s: number): 'info' | 'success' | 'warning' => (s === 2 ? 'info' : s === 1 ? 'success' : 'warning');

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Modal Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff; border-radius: 16px;
    border: 1px solid var(--ax-border, #e2e8f0); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--ax-text-muted, #64748b);
  }
  .ax-modal__body { padding: 0; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 14px 20px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }

  /* Image thumbnails */
  .solar-erp-page .kswp-thumb {
    display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--ax-border, #e2e8f0); background: var(--ax-surface-subtle, #f8fafc);
    overflow: hidden; cursor: pointer; transition: transform 0.15s ease;
  }
  .solar-erp-page .kswp-thumb:hover { transform: scale(1.08); }
  .solar-erp-page .kswp-thumb img { width: 100%; height: 100%; object-fit: cover; }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const ICONS = {
  doc: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>),
  check: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>),
  shield: svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  cross: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></>),
  coin: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M10 8c4 0 4 4 0 4l4 4" /></>),
};
type IconKey = keyof typeof ICONS;

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub?: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const REFRESH_ICON = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'accepted', label: 'Accepted' },
];

export function BiharSRTInstallationViewAssignSites() {
  const [records, setRecords] = useState<BiharSRTInstAssignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Summary counts
  const [summaryData, setSummaryData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await biharAdminService.getViewAssignSrt();
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.assignments)
        ? res.assignments
        : Array.isArray(res?.data?.assigned_data)
        ? res.data.assigned_data
        : [];

      if (res?.summary || res?.kpi || res?.data?.summary) {
        setSummaryData(res.summary || res.kpi || res.data?.summary);
      }

      const mapped: BiharSRTInstAssignRecord[] = rawList.map((item: any, idx: number) => ({
        id: item.id ?? idx + 1,
        vendor: item.vendor || item.vendor_name || item.agency_name || '—',
        assign_date: item.assign_date || item.created_at || item.date || '—',
        state: item.state || 'Bihar',
        district: item.district || '—',
        site_name_deadline:
          item.site_name_deadline ||
          `${item.site_name || 'Site'}${item.deadline ? ` - ${item.deadline}` : ''}`,
        site_count: Number(item.site_count || item.count || 1),
        file: item.file || item.allotment_file || '',
        remarks: item.remarks || item.remark || '—',
        status: item.status !== undefined ? Number(item.status) as any : 0,
      }));

      setRecords(mapped);
    } catch (err: any) {
      console.error('Failed to load Bihar SRT assignments:', err);
      setErrorMsg(err?.message || 'Failed to load SRT site allocations from server.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  // Handle Approve Action
  const handleApprove = async (id: number) => {
    try {
      setApprovingId(id);
      setErrorMsg('');
      setSuccessMsg('');
      await biharAdminService.approveSrtAssign(id);
      setSuccessMsg(`Assignment #${id} approved successfully!`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(`Approval failed: ${err?.message || 'Server error'}`);
    } finally {
      setApprovingId(null);
    }
  };

  // Distinct districts from records
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district && r.district !== '—') set.add(r.district);
    });
    return Array.from(set).sort();
  }, [records]);

  // Dynamic KPIs (using API summary or computed from records)
  const totalAssignedSites = summaryData?.totalAssignedSites ?? records.reduce((s, r) => s + (r.site_count || 1), 0);
  const completeSites = summaryData?.completeSites ?? records.filter((r) => r.status === 2 || r.status === 1).reduce((s, r) => s + (r.site_count || 1), 0);
  const pendingSites = summaryData?.pendingSites ?? records.filter((r) => r.status === 0).length;
  const approveSites = summaryData?.approveSites ?? records.filter((r) => r.status === 1 || r.status === 2).length;
  const rejectSites = summaryData?.rejectSites ?? 0;
  const verifyPending = summaryData?.verifyPending ?? records.filter((r) => r.status === 0).length;
  const claimApplicable = summaryData?.claimApplicable ?? 0;
  const claimRaised = summaryData?.claimRaised ?? 0;
  const docSubmit = summaryData?.docSubmit ?? 0;
  const payment70 = summaryData?.payment70 ?? 0;
  const payment15A = summaryData?.payment15A ?? 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (districtFilter !== 'all' && r.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (statusFilter !== 'all' && statusKey(r.status) !== statusFilter) return false;
      if (!q) return true;
      return [r.vendor, r.district, r.site_name_deadline, r.remarks].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      );
    });
  }, [records, districtFilter, statusFilter, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || districtFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<BiharSRTInstAssignRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'Assign Date', accessor: (r) => r.assign_date },
      { header: 'State', accessor: (r) => r.state },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Site Name - Deadline', accessor: (r) => r.site_name_deadline },
      { header: 'Site Count', accessor: (r) => r.site_count },
      { header: 'File', accessor: (r) => r.file },
      { header: 'Remarks', accessor: (r) => r.remarks },
      { header: 'Status', accessor: (r) => statusLabel(r.status) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_View_Assign_Sites', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_View_Assign_Sites', filtered, exportCols);
  const handlePdf = () => printTableData('View Assign Bihar SRT Installation', filtered, exportCols);

  const colCount = 11;
  const tabCount = (k: FilterKey) => (k === 'all' ? records.length : records.filter((r) => statusKey(r.status) === k).length);
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');

  const kpis: { label: string; value: unknown; tone: KpiTone; icon: IconKey; sub?: string }[] = [
    { label: 'Total Assigned Sites', value: totalAssignedSites, tone: 'accent', icon: 'doc', sub: 'assigned to vendors' },
    { label: 'Complete Sites', value: completeSites, tone: 'emerald', icon: 'check', sub: 'installation complete' },
    { label: 'Pending', value: pendingSites, tone: 'amber', icon: 'clock', sub: 'installation pending' },
    { label: 'Approve Sites', value: approveSites, tone: 'cyan', icon: 'shield', sub: 'verified & approved' },
    { label: 'Reject Sites', value: rejectSites, tone: 'amber', icon: 'cross', sub: 'verified & rejected' },
    { label: 'Verify Pending', value: verifyPending, tone: 'accent', icon: 'clock', sub: 'awaiting verification' },
    { label: 'Claim Applicable', value: claimApplicable, tone: 'cyan', icon: 'doc' },
    { label: 'Claim Raised', value: claimRaised, tone: 'accent', icon: 'doc' },
    { label: 'DOC Submit', value: docSubmit, tone: 'emerald', icon: 'check' },
    { label: 'Payment 70%', value: payment70, tone: 'emerald', icon: 'coin' },
    { label: 'Payment 15%', value: payment15A, tone: 'amber', icon: 'coin' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Assign Bihar SRT Installation"
        subtitle="Manage assigned vendor work orders, view site allocations, and approve assignments"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT', href: '/vendor-management/bihar/srt/installation/dashboard' },
          { label: 'View Assign Bihar SRT Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/vendor-management/bihar/srt/installation/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Assign Sites</span>
            </Link>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{successMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={11} />
        ) : (
          kpis.map((k) => (
            <KpiCard key={k.label} tone={k.tone} label={k.label} value={num(k.value)} sub={k.sub} icon={ICONS[k.icon]} />
          ))
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Assignment status tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === statusFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned sites">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Assign SRT Installation</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> site allocations
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <select
                  className="ax-form-select"
                  aria-label="Filter by district"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ height: 32, fontSize: 12, minWidth: 130 }}
                >
                  <option value="all">All Districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, site, district…"
                  size="sm"
                  ariaLabel="Search sites"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Assigned sites</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name - Deadline</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col">File</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading site allocations from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No assigned sites found"
                        message={hasFilters ? 'No records match your search. Try clearing the filters.' : 'No site allocations found under this category.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((r, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={r.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.vendor}</td>
                        <td className="ax-table__td">{r.assign_date}</td>
                        <td className="ax-table__td">{r.state}</td>
                        <td className="ax-table__td">{r.district}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{r.site_name_deadline}</td>
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 600 }}>{r.site_count}</td>
                        <td className="ax-table__td">
                          {r.file ? (
                            <a
                              href={resolveBiharMediaUrl(r.file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              title={r.file.split('/').pop()}
                            >
                              View File
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>{r.remarks}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusTone(r.status)}`}>
                            <span className="ax-badge__dot" />
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {r.status === 0 ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleApprove(r.id)}
                              disabled={approvingId === r.id}
                              title="Approve Site Assignment"
                            >
                              {approvingId === r.id ? 'Approving…' : 'Approve'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ax-viz-emerald)', fontSize: 12, fontWeight: 600 }}>✓ Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default BiharSRTInstallationViewAssignSites;