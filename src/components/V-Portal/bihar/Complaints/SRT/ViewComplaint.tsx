import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharComplaintService,
  type BiharComplaintItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
  type ColumnDef,
} from '../../../../../common';

type Row = BiharComplaintItem;
type StatusFilter = 'all' | 'open' | 'pending' | 'resolved';

/* ── Status helpers ── */
const isResolved = (r: Row) => Number(r.close_status) === 1;
const isPendingApproval = (r: Row) => !isResolved(r) && Number(r.status) === 1;
const statusLabel = (r: Row) => (isResolved(r) ? 'Resolved' : isPendingApproval(r) ? 'Pending Approval' : 'Open');

/* ── Styles: light table polish only (same as Survey view) ── */
const VIEW_CSS = `
.bsv-page .ax-card__header { background: var(--ax-surface-subtle); border-bottom: 1px solid var(--ax-border-subtle); }
.bsv-page .ax-table__th { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted); background: var(--ax-surface-subtle); }
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); }
`;

/* ───────── KPI card (same as Survey view) ───────── */
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ── Table column config (display + export from one list) ── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

interface Col { key: string; th: string; get: (r: Row) => ReactNode; exp: (r: Row) => string | number; style?: CSSProperties }

const COLS: Col[] = [
  { key: 'Complaint ID', th: 'Complaint ID', get: (r) => `#${r.complaint_id}`, exp: (r) => r.complaint_id ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-accent)' } },
  { key: 'Date', th: 'Date', get: (r) => txt(r.start_date), exp: (r) => r.start_date ?? '' },
  { key: 'Site / Building Name', th: 'Site / Building Name', get: (r) => r.site_name || 'Rooftop Site', exp: (r) => r.site_name ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Department', th: 'Department', get: (r) => txt(r.dept_name), exp: (r) => r.dept_name ?? '' },
  { key: 'District', th: 'District', get: (r) => txt(r.district), exp: (r) => r.district ?? '' },
  { key: 'Location', th: 'Location', get: (r) => txt(r.location), exp: (r) => r.location ?? '' },
  { key: 'Discom', th: 'Discom', get: (r) => r.discom || 'NBPDCL', exp: (r) => r.discom ?? '' },
  { key: 'CA No', th: 'CA No', get: (r) => txt(r.ca_no), exp: (r) => r.ca_no ?? '' },
  { key: 'Sanction Load', th: 'Sanction Load', get: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH), exp: (r) => r.sanction_load ?? '' },
  { key: 'Plant SC', th: 'Plant SC', get: (r) => txt(r.plant_sc), exp: (r) => r.plant_sc ?? '' },
  { key: 'WO No', th: 'WO No', get: (r) => txt(r.wo_no), exp: (r) => r.wo_no ?? '' },
  { key: 'Phase', th: 'Phase', get: (r) => txt(r.phase), exp: (r) => r.phase ?? '' },
  {
    key: 'Complaint Description', th: 'Defect Observation',
    get: (r) => (
      <div title={r.complaint} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(r.complaint)}</div>
    ),
    exp: (r) => r.complaint ?? '',
  },
];

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'resolved', label: 'Resolved' },
];

export function Bihar_Complaint_SRT_ViewComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [complaints, setComplaints] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (key: string) => !hiddenCols.includes(key);

  const loadComplaints = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await biharComplaintService.getViewSrtComplaints();
      const list = Array.isArray(data) ? data : [];
      setComplaints(list);
      if (!list.length) setErrorMsg('No complaint tickets have been submitted yet.');
    } catch (err: any) {
      console.error('Error loading SRT complaints:', err);
      setErrorMsg(err?.message || 'Failed to load complaints from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => { if (c.district) set.add(c.district); });
    return Array.from(set).sort();
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((item) => {
      if (statusFilter === 'open' && (isResolved(item) || isPendingApproval(item))) return false;
      if (statusFilter === 'pending' && !isPendingApproval(item)) return false;
      if (statusFilter === 'resolved' && !isResolved(item)) return false;
      if (selectedDistrict !== 'all' && item.district !== selectedDistrict) return false;
      if (q) {
        const hay = [
          item.complaint_id, item.site_name, item.dept_name, item.ca_no,
          item.district, item.location, item.firm_name, item.complaint,
        ];
        if (!hay.some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, selectedDistrict, search]);

  const pagedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredComplaints.slice(start, start + pageSize);
  }, [filteredComplaints, currentPage, pageSize]);

  const kpis = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter(isResolved).length;
    const pendingApproval = complaints.filter(isPendingApproval).length;
    return { total, open: total - resolved - pendingApproval, pendingApproval, resolved };
  }, [complaints]);

  const resolvedPct = kpis.total > 0 ? Math.round((kpis.resolved / kpis.total) * 100) : 0;

  /* ── Export ── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      ...COLS.map((c) => ({ header: c.key, accessor: c.exp })),
      { header: 'Status', accessor: (r: Row) => statusLabel(r) },
    ],
    []
  );
  const activeExportCols = useMemo(() => exportCols.filter((c) => !hiddenCols.includes(c.header)), [exportCols, hiddenCols]);
  const toolbarColumns: ColumnDef[] = useMemo(
    () => exportCols.map((c) => ({ key: c.header, label: c.header, visible: !hiddenCols.includes(c.header) })),
    [exportCols, hiddenCols]
  );
  const toggleColumn = (key: string) =>
    setHiddenCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleCopy = () => copyTableDataToClipboard(filteredComplaints, activeExportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_Complaints', filteredComplaints, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_Complaints', filteredComplaints, activeExportCols);
  const handlePdf = () => printTableData('Bihar SRT Rooftop Complaints Report', filteredComplaints, activeExportCols);

  /* ── Delete (API 11: GET /bihar/srt/complaint/delete?srt_id=...) ── */
  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint #${id}?`)) return;
    const res = await biharComplaintService.deleteSrtComplaint(id);
    if (res.success) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      alert(res.message);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const hasFilters = !!search || statusFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setSelectedDistrict('all'); setCurrentPage(1);
  };

  const visibleCols = COLS.filter((c) => isVisible(c.key));

  return (
    <div className="ax-page bsv-page">
      <style>{VIEW_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SRT Complaints"
        subtitle=" plant breakdowns, inverter errors, and closure tracking"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadComplaints} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/complaint/bihar/srt-add-complaint')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Add Complaint</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent" label="Total Complaints"
              value={kpis.total.toLocaleString('en-IN')}
              sub={`${kpis.resolved} resolved · ${kpis.total - kpis.resolved} remaining`}
              icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>)}
            />
            <KpiCard
              tone="amber" label="Open Tickets"
              value={kpis.open.toLocaleString('en-IN')}
              sub="Under inspection"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>)}
            />
            <KpiCard
              tone="cyan" label="Pending Approval"
              value={kpis.pendingApproval.toLocaleString('en-IN')}
              sub="Close request raised"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald" label="Resolved Tickets"
              value={kpis.resolved.toLocaleString('en-IN')}
              sub={`${resolvedPct}% verified & closed`}
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT Complaints">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View SRT Vendor Complaints Data</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredComplaints.length} of {complaints.length} records
              </p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <select
                className="ax-form-control"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
                style={{ height: 36, fontSize: 'var(--ax-text-sm)', width: 'auto' }}
              >
                {FILTER_TABS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.key === 'all' ? kpis.total : t.key === 'open' ? kpis.open : t.key === 'pending' ? kpis.pendingApproval : kpis.resolved})
                  </option>
                ))}
              </select>
              <select
                className="ax-form-control"
                aria-label="Filter by district"
                value={selectedDistrict}
                onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                style={{ height: 36, fontSize: 'var(--ax-text-sm)', width: 'auto' }}
              >
                <option value="all">All Districts</option>
                {uniqueDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <SearchInput
                value={search}
                onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                placeholder="Search records…"
                ariaLabel="Search records"
              />
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleCsv}
                onExportExcel={handleExcel}
                onExportPDF={handlePdf}
                columns={toolbarColumns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Loading SRT complaints…</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <TableEmptyState
              title="No records found"
              message={
                hasFilters
                  ? 'No complaints match your filters. Try clearing filters or search term.'
                  : errorMsg || 'No complaint tickets have been submitted yet.'
              }
              onClear={hasFilters ? clearFilters : undefined}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                  <caption className="ax-visually-hidden">Bihar SRT Complaints</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      {visibleCols.map((c) => <th key={c.key} className="ax-table__th" scope="col">{c.th}</th>)}
                      {isVisible('Status') && <th className="ax-table__th" scope="col">Status</th>}
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedComplaints.map((item, idx) => {
                      const srNo = (currentPage - 1) * pageSize + idx + 1;
                      const resolved = isResolved(item);
                      const pending = isPendingApproval(item);
                      return (
                        <tr key={item.id} className="ax-table__row">
                          <td className="ax-table__td">{srNo}</td>
                          {visibleCols.map((c) => (
                            <td key={c.key} className="ax-table__td" style={c.style}>{c.get(item)}</td>
                          ))}
                          {isVisible('Status') && (
                            <td className="ax-table__td">
                              <span className={`ax-badge ax-badge--soft ax-badge--pill ${resolved ? 'ax-badge--success' : pending ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                                <span className="ax-badge__dot" />
                                {statusLabel(item)}
                              </span>
                            </td>
                          )}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => navigate(`/v/complaint/bihar/srt-add-complaint?edit=${item.id}`)}
                              >
                                Edit
                              </button>
                              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--ax-danger, #ef4444)' }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filteredComplaints.length}
                onChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SRT_ViewComplaint;