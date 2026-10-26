import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharComplaintService,
  getMediaUrl,
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
const todayStr = () => new Date().toISOString().split('T')[0];

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
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'resolved', label: 'Resolved' },
];

const MODAL_OVERLAY: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(211, 211, 211, 0.65)',
  backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
  zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'var(--ax-space-4)',
};

const LABEL_STYLE: CSSProperties = { fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

function Field({ label, value, col = 6 }: { label: string; value: ReactNode; col?: number }) {
  return (
    <div className={`ax-col--${col}`}>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const Req = () => <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>;

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

  // Detail Modal
  const [viewItem, setViewItem] = useState<Row | null>(null);

  // Close Request Modal (API 11, 12) — proof files optional
  const [closeItem, setCloseItem] = useState<Row | null>(null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeForm, setCloseForm] = useState({
    resolved_by: '', r_mobile: '', r_email: '',
    manual_close_date: todayStr(), remarks: '', close_sms: 'Yes',
  });
  const [closeFiles, setCloseFiles] = useState<{ r_file: File | null; r_file2: File | null }>({
    r_file: null, r_file2: null,
  });

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
      if (statusFilter === 'open' && (isResolved(item) || isPendingApproval(item))) return false;
      if (statusFilter === 'pending' && !isPendingApproval(item)) return false;
      if (statusFilter === 'resolved' && !isResolved(item)) return false;
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

  /* ── Close request ── */
  const openCloseModal = (item: Row) => {
    setCloseItem(item);
    setCloseError(null);
    setCloseForm({
      resolved_by: item.resolved_by || '',
      r_mobile: item.r_mobile || '',
      r_email: item.r_email || '',
      manual_close_date: todayStr(),
      remarks: item.remarks || '',
      close_sms: 'Yes',
    });
    setCloseFiles({ r_file: null, r_file2: null });
  };

  // API 12: POST /bihar/ssl/complaint/close-update
  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeItem) return;
    setCloseError(null);

    if (!closeForm.resolved_by.trim()) return setCloseError('Technician / Resolved By name is required.');
    if (!/^\d{10}$/.test(closeForm.r_mobile.trim())) return setCloseError('Technician mobile number must be exactly 10 digits.');
    if (!closeForm.remarks.trim()) return setCloseError('Resolution remarks are required.');

    setCloseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('ssl_id', String(closeItem.id));
      fd.append('resolved_by', closeForm.resolved_by);
      fd.append('r_email', closeForm.r_email);
      fd.append('r_mobile', closeForm.r_mobile);
      fd.append('manual_close_date', closeForm.manual_close_date);
      fd.append('remarks', closeForm.remarks);
      fd.append('close_sms', closeForm.close_sms);
      fd.append('beneficiary_name', closeItem.beneficiary_name || '');
      fd.append('contact_no', closeItem.contact_no || '');
      if (closeFiles.r_file) fd.append('r_file', closeFiles.r_file);
      if (closeFiles.r_file2) fd.append('r_file2', closeFiles.r_file2);

      const res = await biharComplaintService.closeUpdateSslComplaint(fd);
      if (res.success) {
        alert(res.message || 'Complaint Resolved successfully.');
        setCloseItem(null);
        loadComplaints();
      } else {
        setCloseError(res.message);
      }
    } catch (err: any) {
      setCloseError(err?.message || 'Failed to submit close request');
    } finally {
      setCloseSubmitting(false);
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
              sub={`${kpis.resolved} resolved · ${kpis.total - kpis.resolved} remaining`}
              icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>)}
            />
            <KpiCard
              tone="amber" label="Open Tickets"
              value={kpis.open.toLocaleString('en-IN')}
              sub="Under investigation"
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
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Complaints">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">SSL Grievance Records</h2>
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
                              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setViewItem(item)}>View</button>
                              {!resolved && (
                                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => openCloseModal(item)}>Resolve</button>
                              )}
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

      {/* ── View Detail Modal ── */}
      {viewItem && (
        <div style={MODAL_OVERLAY} onClick={() => setViewItem(null)}>
          <div
            className="ax-card"
            style={{ position: 'relative', padding: 'var(--ax-space-4)', width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' as any }}>
                  Complaint #{viewItem.complaint_id} ({viewItem.uid || 'BR-SSL'})
                </h4>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Registered on {viewItem.start_date || DASH}
                </div>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setViewItem(null)} aria-label="Close details">✕</button>
            </div>

            <div className="ax-dash-grid">
              <Field label="Beneficiary Name" value={txt(viewItem.beneficiary_name)} />
              <Field label="Contact Number" value={txt(viewItem.contact_no)} />
              <Field col={4} label="District" value={txt(viewItem.district)} />
              <Field col={4} label="Block" value={txt(viewItem.block)} />
              <Field col={4} label="Panchayat" value={txt(viewItem.panchyat || viewItem.panchayat)} />
              <Field col={4} label="Ward No" value={txt(viewItem.ward_no)} />
              <Field col={4} label="Pole No" value={txt(viewItem.pole_no)} />
              <Field col={4} label="Light No" value={txt(viewItem.light_no)} />
              <Field label="Luminary No" value={txt(viewItem.luminary_no)} />
              <Field label="Battery Serial No" value={txt(viewItem.battery_serial_no)} />
              <Field label="Module No" value={txt(viewItem.module_no)} />
              <Field label="Date of Installation" value={txt(viewItem.date_of_installation)} />
              <div className="ax-col--12">
                <div style={LABEL_STYLE}>Issue / Complaint Description</div>
                <div style={{ background: 'var(--ax-surface-subtle)', padding: 12, borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)', marginTop: 4, fontSize: 'var(--ax-text-sm)', lineHeight: 1.5 }}>
                  {viewItem.complaint_issue && (
                    <strong style={{ display: 'block', marginBottom: 4 }}>Issue: {viewItem.complaint_issue}</strong>
                  )}
                  {viewItem.complaint}
                </div>
              </div>

              <div className="ax-col--12">
                <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>Defect Photo</div>
                {viewItem.file ? (
                  <a href={getMediaUrl(viewItem.file)} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
                    View Uploaded Photo ↗
                  </a>
                ) : (
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>No photo uploaded</span>
                )}
              </div>

              {isResolved(viewItem) && (
                <div className="ax-col--12">
                  <div className="ax-alert ax-alert--success">
                    <strong>Resolution Details:</strong>
                    <div style={{ marginTop: 4, fontSize: 'var(--ax-text-sm)' }}>
                      Closed by: {viewItem.resolved_by || 'Technician'} | Date: {viewItem.close_date || viewItem.manual_close_date || DASH}
                    </div>
                    {viewItem.remarks && <div style={{ marginTop: 4, fontSize: 'var(--ax-text-sm)' }}>Remarks: {viewItem.remarks}</div>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--ax-space-4)' }}>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Close Update Modal (API 12) ── */}
      {closeItem && (
        <div style={MODAL_OVERLAY} onClick={() => setCloseItem(null)}>
          <div
            className="ax-card"
            style={{ position: 'relative', padding: 'var(--ax-space-4)', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitClose}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' as any }}>
                    Resolve SSL Complaint #{closeItem.complaint_id}
                  </h4>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Beneficiary: {closeItem.beneficiary_name} ({closeItem.district}, Pole: {closeItem.pole_no})
                  </div>
                </div>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setCloseItem(null)} aria-label="Close">✕</button>
              </div>

              {closeError && <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>{closeError}</div>}

              <div className="ax-dash-grid">
                <div className="ax-col--6">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Technician / Resolved By <Req /></label>
                    <input type="text" className="ax-form-control" required value={closeForm.resolved_by}
                      onChange={(e) => setCloseForm((p) => ({ ...p, resolved_by: e.target.value }))} placeholder="e.g. Ramesh Singh" />
                  </div>
                </div>
                <div className="ax-col--6">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Technician Mobile (10 Digits) <Req /></label>
                    <input type="tel" maxLength={10} className="ax-form-control" required value={closeForm.r_mobile}
                      onChange={(e) => setCloseForm((p) => ({ ...p, r_mobile: e.target.value }))} placeholder="e.g. 9811111111" />
                  </div>
                </div>
                <div className="ax-col--6">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Technician Email <Req /></label>
                    <input type="email" className="ax-form-control" required value={closeForm.r_email}
                      onChange={(e) => setCloseForm((p) => ({ ...p, r_email: e.target.value }))} placeholder="tech@example.com" />
                  </div>
                </div>
                <div className="ax-col--6">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Closure Date <Req /></label>
                    <input type="date" className="ax-form-control" required value={closeForm.manual_close_date}
                      onChange={(e) => setCloseForm((p) => ({ ...p, manual_close_date: e.target.value }))} />
                  </div>
                </div>
                <div className="ax-col--12">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Resolution Remarks / Fixed Root Cause <Req /></label>
                    <textarea rows={3} className="ax-form-control" required value={closeForm.remarks}
                      onChange={(e) => setCloseForm((p) => ({ ...p, remarks: e.target.value }))}
                      placeholder="Describe what was repaired or replaced (e.g. Replaced defective 30W LED Luminaire, terminal wiring re-crimped, light tested and glowing fine)..." />
                  </div>
                </div>
                <div className="ax-col--12">
                  <div className="ax-form-group">
                    <label className="ax-form-label">Send Closure SMS to Beneficiary?</label>
                    <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                      {['Yes', 'No'].map((v) => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="radio" name="close_sms" value={v} checked={closeForm.close_sms === v}
                            onChange={(e) => setCloseForm((p) => ({ ...p, close_sms: e.target.value }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {([
                  { key: 'r_file', label: '1. Rectified / Glowing Light Photo (Optional)' },
                  { key: 'r_file2', label: '2. Replaced Component Photo (Optional)' },
                ] as const).map((field) => (
                  <div key={field.key} className="ax-col--6">
                    <div className="ax-form-group">
                      <label className="ax-form-label" style={{ fontSize: 11 }}>{field.label}</label>
                      <input
                        type="file" accept="image/*,application/pdf"
                        className="ax-form-control" style={{ fontSize: 12, padding: 6 }}
                        onChange={(e) => {
                          const fl = e.target.files?.[0] || null;
                          setCloseFiles((p) => ({ ...p, [field.key]: fl }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 'var(--ax-space-4)' }}>
                <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setCloseItem(null)}>Cancel</button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={closeSubmitting}>
                  {closeSubmitting ? 'Resolving Ticket...' : 'Resolve Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Complaint_SSL_ViewComplaint;