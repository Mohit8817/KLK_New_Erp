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
type StatusFilter = 'all' | 'pending' | 'closed';

/* ── Status helpers ──
   Pending = abhi tak assigned nahi hua
   Closed  = assigned ho gaya (ya resolve ho chuka hai) → edit/delete locked */
const isAssigned = (r: Row) => {
  const a = String((r as any).assigned_to ?? '').trim();
  return a !== '' && a !== '0' && a.toLowerCase() !== 'null';
};
const isResolved = (r: Row) => Number(r.close_status) === 1;
const isClosed = (r: Row) => isResolved(r); // Closed sirf tab jab vendor resolve kar de
const isLocked = (r: Row) => isAssigned(r) || isResolved(r); // assigned hote hi edit/delete lock
const statusLabel = (r: Row) => (isClosed(r) ? 'Closed' : 'Pending');

/* ── Styles: light table polish only (same as Survey view) ── */
const VIEW_CSS = `
.bsv-page .ax-card__header { background: var(--ax-surface-subtle); border-bottom: 1px solid var(--ax-border-subtle); }
.bsv-page .ax-table__th { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted); background: var(--ax-surface-subtle); }
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); }
.bsv-page .bsv-lock-btn { opacity: .75; cursor: not-allowed; display: inline-flex; align-items: center; gap: 6px; }
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
  { key: 'UID', th: 'UID', get: (r) => r.uid || `BR-SSL-${r.id}`, exp: (r) => r.uid ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  { key: 'Date', th: 'Date', get: (r) => txt(r.start_date), exp: (r) => r.start_date ?? '' },
  { key: 'Beneficiary Name', th: 'Beneficiary Name', get: (r) => txt(r.beneficiary_name), exp: (r) => r.beneficiary_name ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  {
    key: 'Contact No', th: 'Contact No',
    get: (r) => (r.contact_no ? <a href={`tel:${r.contact_no}`} style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}>{r.contact_no}</a> : DASH),
    exp: (r) => r.contact_no ?? '',
  },
  { key: 'District', th: 'District', get: (r) => txt(r.district), exp: (r) => r.district ?? '' },
  { key: 'Block', th: 'Block', get: (r) => txt(r.block), exp: (r) => r.block ?? '' },
  { key: 'Panchayat', th: 'Panchayat', get: (r) => txt(r.panchyat || r.panchayat), exp: (r) => r.panchyat || r.panchayat || '' },
  { key: 'Ward No', th: 'Ward No', get: (r) => txt(r.ward_no), exp: (r) => r.ward_no ?? '' },
  { key: 'Pole No', th: 'Pole No', get: (r) => txt(r.pole_no), exp: (r) => r.pole_no ?? '' },
  { key: 'Light No', th: 'Light No', get: (r) => txt(r.light_no), exp: (r) => r.light_no ?? '' },
  { key: 'Complaint Issue', th: 'Grievance Issue', get: (r) => txt(r.complaint_issue), exp: (r) => r.complaint_issue ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  {
    key: 'Complaint Description', th: 'Complaint Description',
    get: (r) => (
      <div title={r.complaint} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(r.complaint)}</div>
    ),
    exp: (r) => r.complaint ?? '',
  },
];

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'closed', label: 'Closed' },
];

export function Bihar_Complaint_SSL_ViewComplaint() {
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
      const data = await biharComplaintService.getViewSslComplaints();
      const list = Array.isArray(data) ? data : [];
      setComplaints(list);
      if (!list.length) setErrorMsg('No complaint tickets have been submitted yet.');
    } catch (err: any) {
      console.error('Error loading SSL complaints:', err);
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
      if (statusFilter === 'pending' && isClosed(item)) return false;
      if (statusFilter === 'closed' && !isClosed(item)) return false;
      if (selectedDistrict !== 'all' && item.district !== selectedDistrict) return false;
      if (q) {
        const hay = [
          item.complaint_id, item.uid, item.beneficiary_name, item.contact_no, item.district,
          item.block, item.panchyat || item.panchayat, item.complaint, item.light_no, item.pole_no,
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
    const closed = complaints.filter(isClosed).length;
    return { total, pending: total - closed, closed };
  }, [complaints]);

  const closedPct = kpis.total > 0 ? Math.round((kpis.closed / kpis.total) * 100) : 0;

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
  const handleCsv = () => exportDataToCSV('Bihar_SSL_Complaints', filteredComplaints, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SSL_Complaints', filteredComplaints, activeExportCols);
  const handlePdf = () => printTableData('Bihar SSL Complaints Report', filteredComplaints, activeExportCols);

  /* ── Delete (API 14: GET /bihar/ssl/complaint/delete?ssl_id=...) ── */
  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint #${id}?`)) return;
    const res = await biharComplaintService.deleteSslComplaint(id);
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
        title="View SSL Complaints"
        subtitle="Manage Solar Street Light grievance tickets raised by vendor in Bihar"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SSL' },
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
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/complaint/bihar/ssl-add-complaint')}>
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
              sub={`${kpis.closed} closed · ${kpis.pending} pending`}
              icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>)}
            />
            <KpiCard
              tone="amber" label="Pending"
              value={kpis.pending.toLocaleString('en-IN')}
              sub="Waiting for resolution"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald" label="Closed"
              value={kpis.closed.toLocaleString('en-IN')}
              sub="Resolved by vendor"
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="cyan" label="Closed Rate"
              value={`${closedPct}%`}
              sub="Of total complaints"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Complaints">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
View Vendor SSL Complaint Data
</h2>
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
                    {t.label} ({t.key === 'all' ? kpis.total : t.key === 'pending' ? kpis.pending : kpis.closed})
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
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Loading SSL complaints…</p>
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
                  <caption className="ax-visually-hidden">Bihar SSL Complaints</caption>
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
                      const closed = isClosed(item);
                      const locked = isLocked(item);
                      return (
                        <tr key={item.id} className="ax-table__row">
                          <td className="ax-table__td">{srNo}</td>
                          {visibleCols.map((c) => (
                            <td key={c.key} className="ax-table__td" style={c.style}>{c.get(item)}</td>
                          ))}
                          {isVisible('Status') && (
                            <td className="ax-table__td">
                              <span className={`ax-badge ax-badge--soft ax-badge--pill ${closed ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                                <span className="ax-badge__dot" />
                                {statusLabel(item)}
                              </span>
                            </td>
                          )}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {locked ? (
                              /* Assigned / Closed → Edit & Delete hata kar lock button */
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm bsv-lock-btn"
                                disabled
                                aria-disabled="true"
                                title="Complaint assigned — edit/delete locked"
                              >
                                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="10" rx="2" />
                                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                                Assigned
                              </button>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--secondary ax-btn--sm"
                                  onClick={() => navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${item.id}`)}
                                >
                                  Edit
                                </button>
                                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--ax-danger, #ef4444)' }}>
                                  Delete
                                </button>
                              </div>
                            )}
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

export default Bihar_Complaint_SSL_ViewComplaint;