import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpKusumCAssignmentItem,
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

type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb, 37, 99, 235), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: 'var(--ax-viz-emerald, #10b981)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: 'var(--ax-viz-amber, #f59e0b)' },
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

const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .is-active-filter {
    border-color: var(--ax-accent, #2563eb) !important;
    background: color-mix(in oklab, var(--ax-accent, #2563eb) 4%, var(--ax-surface, #ffffff));
  }
  .solar-erp-page .ax-card__actions { flex-wrap: wrap; gap: 8px; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ax-table th, .solar-erp-page .ax-table td { white-space: nowrap; vertical-align: middle; }
`;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  dialogStyle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogStyle?: CSSProperties;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

const isAcceptedStatus = (s: any) => Number(s) === 2 || String(s) === '2';

export function UP_Installation_KusumC_InstallationRequest() {
  const [batches, setBatches] = useState<UpKusumCAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Detail modal state
  const [detailModalItem, setDetailModalItem] = useState<UpKusumCAssignmentItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getKusumCAssignments();
      setBatches(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load Kusum-C assignments.' });
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

  // Handle Accept
  const handleAccept = async (id: number) => {
    setAcceptingId(id);
    try {
      const res = await upInstallationService.acceptKusumCAssignment(id);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Batch accepted successfully!' });
        setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, status: '2' } : b)));
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to accept batch.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Error occurred while accepting batch.' });
    } finally {
      setAcceptingId(null);
    }
  };

  // Open Details Modal with API fetch
  const handleOpenDetail = async (item: UpKusumCAssignmentItem) => {
    setDetailModalItem(item);
    setLoadingDetail(true);
    try {
      const res = await upInstallationService.getKusumCAssignmentDetail(item.id);
      if (res && res.details) {
        setDetailModalItem((prev) => (prev ? { ...prev, details: res.details } : res));
      }
    } catch (e) {
      console.warn('Error fetching batch detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    const total = batches.length;
    const accepted = batches.filter((b) => isAcceptedStatus(b.status)).length;
    const pending = total - accepted;
    return { total, accepted, pending };
  }, [batches]);

  // Distinct districts
  const districtList = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => {
      if (b.district && b.district.trim()) {
        set.add(b.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [batches]);

  // Filtered
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const isAccepted = isAcceptedStatus(b.status);
      if (statusFilter === 'pending' && isAccepted) return false;
      if (statusFilter === 'accepted' && !isAccepted) return false;

      if (selectedDistrict !== 'all') {
        const d = (b.district || '').trim().toLowerCase();
        if (d !== selectedDistrict.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const idStr = String(b.id);
        const siteIdStr = String(b.site_id || '').toLowerCase();
        const distStr = String(b.district || '').toLowerCase();
        const projStr = String(b.project || '').toLowerCase();
        const remarksStr = String(b.remarks || '').toLowerCase();
        const assignDateStr = String(b.assign_date || '').toLowerCase();
        const deadlineDateStr = String(b.deadline_date || '').toLowerCase();
        const namesStr = (b.Names || []).map((n) => n.f_farmer_name).join(' ').toLowerCase();
        if (
          !idStr.includes(q) &&
          !siteIdStr.includes(q) &&
          !distStr.includes(q) &&
          !projStr.includes(q) &&
          !remarksStr.includes(q) &&
          !assignDateStr.includes(q) &&
          !deadlineDateStr.includes(q) &&
          !namesStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [batches, statusFilter, selectedDistrict, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || selectedDistrict !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<UpKusumCAssignmentItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Batch ID', accessor: (r) => String(r.id) },
      { header: 'Project', accessor: (r) => r.project || 'kusum-c' },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Sites Count', accessor: (r) => String(r.site_count || r.Names?.length || 0) },
      {
        header: 'Farmers & Deadlines',
        accessor: (r) =>
          (r.Names || [])
            .map((n) => `${n.f_farmer_name} (${n.inst_deadline || 'No deadline'})`)
            .join('; '),
      },
      { header: 'Assign Date', accessor: (r) => r.assign_date || DASH },
      { header: 'Deadline Date', accessor: (r) => r.deadline_date || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (isAcceptedStatus(r.status) ? 'Accepted' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Assigned Kusum-C Installation"
        subtitle="Manage and accept assigned Kusum-C solar pump installation batches and schedules"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'Installation Request' },
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
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Install Site</span>
            </Link>
          </div>
        }
      />

      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setFeedbackMsg(null)}>
            {X_ICON}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <KpiCard
            tone="accent"
            label="Total Batches"
            value={summary.total.toLocaleString('en-IN')}
            sub="All assigned batches"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            icon={svg(<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />)}
          />
          <KpiCard
            tone="emerald"
            label="Accepted Batches"
            value={summary.accepted.toLocaleString('en-IN')}
            sub="Ready for site installation"
            active={statusFilter === 'accepted'}
            onClick={() => setStatusFilter('accepted')}
            icon={svg(<path d="M9 12l2 2 4-4" />)}
          />
          <KpiCard
            tone="amber"
            label="Pending Batches"
            value={summary.pending.toLocaleString('en-IN')}
            sub="Awaiting acceptance"
            active={statusFilter === 'pending'}
            onClick={() => setStatusFilter('pending')}
            icon={svg(<circle cx="12" cy="12" r="9" />)}
          />
        </div>
      )}

      {/* Table Card */}
      <section className="ax-card ax-col--12" role="region" aria-label="Kusum-C Assignment Records">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">UP KUSUM-C INSTALLATION</span>
            <h2 className="ax-card__title">Assigned Batches</h2>
            <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {batches.length} batches
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* District Filter */}
              {districtList.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
              </select>

              {hasFilters && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={resetFilters}>
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                placeholder="Search batch ID, farmer, district…"
                size="sm"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('UP_KusumC_Assignments', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('UP_KusumC_Assignments', filtered, exportCols)}
                onExportPDF={() => printTableData('UP Kusum-C Assigned Installations', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ minWidth: 1280 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 85 }}>Batch ID</th>
                <th className="ax-table__th" style={{ width: 95 }}>Project</th>
                <th className="ax-table__th" style={{ width: 65 }}>State</th>
                <th className="ax-table__th" style={{ width: 110 }}>District</th>
                <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Sites Count</th>
                <th className="ax-table__th" style={{ minWidth: 260 }}>Farmers & Installation Deadlines</th>
                <th className="ax-table__th" style={{ width: 140 }}>Assign Date</th>
                <th className="ax-table__th" style={{ width: 105 }}>Deadline</th>
                <th className="ax-table__th" style={{ width: 95, textAlign: 'center' }}>Attachment</th>
                <th className="ax-table__th" style={{ minWidth: 130 }}>Remarks</th>
                <th className="ax-table__th" style={{ width: 95, textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ width: 165, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={13} style={{ textAlign: 'center', padding: 32 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned batches…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={13} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message="No assigned Kusum-C installation batches found."
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((item, index) => {
                  const isAccepted = isAcceptedStatus(item.status);
                  const siteCount = item.site_count || item.Names?.length || 0;
                  const fileUrl = item.file ? resolveUpMediaUrl(item.file) : null;

                  return (
                    <tr key={item.id} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-mono)' }}>
                        #{item.id}
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {item.project || 'Kusum-C'}
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                        {item.state || 'UP'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {item.district || DASH}
                      </td>
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 700 }}>
                        {siteCount}
                      </td>
                      <td className="ax-table__td">
                        {item.Names && item.Names.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {item.Names.slice(0, 3).map((n, i) => (
                              <div key={i} style={{ fontSize: 12 }}>
                                <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{n.f_farmer_name}</span>
                                {n.inst_deadline && (
                                  <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 6 }}>
                                    (Deadline: {n.inst_deadline})
                                  </span>
                                )}
                              </div>
                            ))}
                            {item.Names.length > 3 && (
                              <span style={{ fontSize: 11, color: 'var(--ax-accent, #2563eb)', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleOpenDetail(item)}>
                                +{item.Names.length - 3} more farmers…
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, color: 'var(--ax-text-muted)', fontFamily: 'var(--ax-font-mono)' }}>
                        {item.assign_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                        {item.deadline_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '2px 8px', fontSize: 11, textDecoration: 'none' }}
                            title="View / Download Assigned Site File"
                          >
                            View File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
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
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => handleOpenDetail(item)}
                          >
                            Details
                          </button>
                          {isAccepted && (
                            <Link
                              to={`/v/up/install-kusum-c-site`}
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                            >
                              Install
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: '12px 16px' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* Details Modal */}
      {detailModalItem && (
        <Modal
          open={!!detailModalItem}
          onClose={() => setDetailModalItem(null)}
          labelledBy="batch-detail-title"
          dialogStyle={{ maxWidth: 720 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Batch Details
              </span>
              <h3 id="batch-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Batch #{detailModalItem.id} — Kusum C
              </h3>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setDetailModalItem(null)}>
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Batch summary card */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Assignment Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Project: </span><strong>{detailModalItem.project || 'Kusum-C'}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Purpose: </span><strong>{detailModalItem.purpose || 'Installation'}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{detailModalItem.state || 'UP'}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{detailModalItem.district || DASH}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Sites Count: </span><strong>{detailModalItem.site_count || detailModalItem.Names?.length || 0}</strong></div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
                  {isAcceptedStatus(detailModalItem.status) ? (
                    <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Accepted</span>
                  ) : (
                    <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                  )}
                </div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span><strong style={{ fontFamily: 'var(--ax-font-mono)' }}>{detailModalItem.assign_date || DASH}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Deadline Date: </span><strong style={{ fontFamily: 'var(--ax-font-mono)' }}>{detailModalItem.deadline_date || DASH}</strong></div>
                {detailModalItem.remarks && (
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span><strong>{detailModalItem.remarks}</strong></div>
                )}
                {detailModalItem.file && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--ax-text-muted)' }}>Assignment Document: </span>
                    <a
                      href={resolveUpMediaUrl(detailModalItem.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ax-btn ax-btn--secondary ax-btn--xs"
                      style={{ marginLeft: 8, padding: '2px 10px', fontSize: 11 }}
                    >
                      View Assigned Document ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Farmers Table */}
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <span className="ax-spinner" /> Loading farmer details…
              </div>
            ) : detailModalItem.details && detailModalItem.details.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>
                  Farmers in this Assignment ({detailModalItem.details.length})
                </h4>
                <div className="ax-table-wrap" style={{ maxHeight: 340 }}>
                  <table className="ax-table ax-table--sm" style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Farmer Name</th>
                        <th>Father Name</th>
                        <th>District</th>
                        <th>Village / Post</th>
                        <th>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalItem.details.map((d, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{d.f_farmer_name || DASH}</td>
                          <td>{d.f_father_name || DASH}</td>
                          <td>{d.f_district || detailModalItem.district || DASH}</td>
                          <td>{[d.f_village, d.f_post].filter(Boolean).join(', ') || DASH}</td>
                          <td>{d.inst_deadline || detailModalItem.deadline_date || DASH}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : detailModalItem.Names && detailModalItem.Names.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>
                  Farmers in this Assignment ({detailModalItem.Names.length})
                </h4>
                <div className="ax-table-wrap" style={{ maxHeight: 300 }}>
                  <table className="ax-table ax-table--sm" style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Sr. No.</th>
                        <th>Farmer Name</th>
                        <th>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalItem.Names.map((n, i) => (
                        <tr key={i}>
                          <td style={{ width: 60 }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{n.f_farmer_name}</td>
                          <td style={{ fontFamily: 'var(--ax-font-mono)' }}>{n.inst_deadline || detailModalItem.deadline_date || DASH}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>No farmer records found in this batch.</p>
            )}
          </div>

          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--ax-border)' }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalItem(null)}>
              Close
            </button>
            {!isAcceptedStatus(detailModalItem.status) && (
              <button
                type="button"
                className="ax-btn ax-btn--success"
                onClick={() => {
                  handleAccept(detailModalItem.id);
                  setDetailModalItem(null);
                }}
              >
                Accept Assignment
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UP_Installation_KusumC_InstallationRequest;
