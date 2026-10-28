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
const isClosed = (r: Row) => isResolved(r);
const isLocked = (r: Row) => isAssigned(r) || isResolved(r);
const statusLabel = (r: Row) => (isClosed(r) ? 'Closed' : 'Pending');

/* ───────── Responsive page CSS (Exact from Installation Details) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
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

/* ── Table column config ── */
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
  { key: 'all', label: 'All Complaints' },
  { key: 'pending', label: 'Pending Complaints' },
  { key: 'closed', label: 'Closed Complaints' },
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
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

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
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
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

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Complaints filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === statusFilter;
              const count = t.key === 'all' ? kpis.total : t.key === 'pending' ? kpis.pending : kpis.closed;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => { setStatusFilter(t.key); setCurrentPage(1); }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Complaints">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {statusFilter === 'all' ? 'All SSL Complaints' : statusFilter === 'pending' ? 'Pending SSL Complaints' : 'Closed SSL Complaints'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredComplaints.length}</span> of <span className="ax-num">{complaints.length}</span> complaints
                {' '}· Total <b className="ax-num">{kpis.total}</b> · Pending <b className="ax-num">{kpis.pending}</b> · Closed <b className="ax-num">{kpis.closed}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search records…"
                  size="sm"
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
                <table className="ax-table ax-table--hover " style={{ whiteSpace: 'nowrap' }}>
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
                          <td className="ax-table__td ax-num">{srNo}</td>
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
                              <span
                                className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11.5, cursor: 'not-allowed' }}
                                title="Complaint assigned — edit/delete locked"
                              >
                                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="10" rx="2" />
                                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                                Assigned (Locked)
                              </span>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--secondary ax-btn--sm"
                                  onClick={() => navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${item.id}`)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--ghost ax-btn--sm"
                                  onClick={() => handleDelete(item.id)}
                                  style={{ color: 'var(--ax-danger, #ef4444)' }}
                                >
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

              <div className="ax-card__footer">
                <div className="ula-pagination-left">
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredComplaints.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SSL_ViewComplaint;
