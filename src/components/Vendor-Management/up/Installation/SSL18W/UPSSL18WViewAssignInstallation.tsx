import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  upSsl18wAdminService,
  resolveUpMediaUrl,
  type UpSsl18wAssignRecord,
  type UpSsl18wDetailSummary,
} from '../../up-services';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
  actionsRowStyle,
  footerStyle,
  centerCell,
  Modal,
  KpiCard,
  MediaFileThumbnail,
  MediaLightbox,
  StatusFeedbackBanners,
  fmtDate,
  fmtNum,
  parseStringArray,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../upInstallationShared';

function getAssignStatusMeta(status: unknown): { label: string; tone: 'warning' | 'info' | 'success' } {
  const code = Number(status);
  if (code === 2) return { label: 'Accepted', tone: 'success' };
  if (code === 1) return { label: 'Approved', tone: 'info' };
  return { label: 'Pending', tone: 'warning' };
}

export function UPSSL18WViewAssignInstallation() {
  const [assigns, setAssigns] = useState<UpSsl18wAssignRecord[]>([]);
  const [detail, setDetail] = useState<UpSsl18wDetailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailRow, setDetailRow] = useState<UpSsl18wAssignRecord | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upSsl18wAdminService.getViewAssign();
      setAssigns(res.assigns);
      setDetail(res.detail);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load UP SSL-18W assigned installations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await upSsl18wAdminService.approveAssign(id);
      setSuccessMsg(res.message || `Assigned installation #${id} approved successfully.`);
      setAssigns((prev) => prev.map((a) => (a.id === id ? { ...a, status: 1 } : a)));
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  const filteredAssigns = useMemo(() => {
    let list = assigns;
    if (statusFilter !== 'all') {
      list = list.filter((r) => String(Number(r.status)) === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const panchayats = parseStringArray(row.village).join(' ');
      const hay = [
        row.id,
        row.vendor_name || row.vendors?.name || row.vendor,
        row.district,
        row.block,
        panchayats,
        row.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [assigns, searchQuery, statusFilter]);

  const pagination = usePagination(filteredAssigns, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpSsl18wAssignRecord>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpSsl18wAssignRecord, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Vendor', accessor: (r) => r.vendor_name || r.vendors?.name || `Vendor #${r.vendor}` },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => parseStringArray(r.village).join(', ') || DASH },
      { header: 'Count', accessor: (r) => r.site_count ?? 0 },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => getAssignStatusMeta(r.status).label },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Assign UP SSL-18W Installation"
        subtitle="Manage assigned UP 18W Solar Street Light panchayat allocations, approvals, and work orders"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'SSL 18W', href: '/vendor-management/up/ssl18w/installation/dashboard' },
          { label: 'View Assign Installation' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /></svg>}
          tone="accent"
          label="Total / Assigned / Accept / Not Assigned"
          value={`${fmtNum(detail?.total)} / ${fmtNum(detail?.assigned)} / ${fmtNum(detail?.accept)} / ${fmtNum(detail?.not_assigned)}`}
          sub="Total · Assigned · Accept · Not Assigned"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Installation Status"
          value={`${fmtNum(detail?.complete)} / ${fmtNum(detail?.pending)}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
          tone="cyan"
          label="Verify Status"
          value={`${fmtNum(detail?.verify_approved)} / ${fmtNum(detail?.verify_pending)} / ${fmtNum(detail?.verify_reject)}`}
          sub="Complete / Pending / Reject"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>}
          tone="violet"
          label="Assigned Batches"
          value={fmtNum(assigns.length)}
          sub={`Pending: ${assigns.filter((a) => Number(a.status) === 0).length} · Approved: ${assigns.filter((a) => Number(a.status) === 1).length} · Accepted: ${assigns.filter((a) => Number(a.status) === 2).length}`}
        />
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Assign UP SSL-18W Installation Data</h2>
            <p className="ax-card__subtitle">
              Showing {filteredAssigns.length} of {assigns.length} batch assignment(s)
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 145, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="0">Pending</option>
                <option value="1">Approved</option>
                <option value="2">Accepted</option>
              </select>

              <Link
                to="/vendor-management/up/ssl18w/installation/assign"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                + Assign SSL-18W Sites
              </Link>

              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, district, block, panchayat..." size="sm" />

              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredAssigns, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredAssigns, exportCols, `UP_SSL18W_View_Assign_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredAssigns, exportCols, `UP_SSL18W_View_Assign_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredAssigns, exportCols, 'View Assign UP SSL-18W Installation Data')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Count</th>
                <th className="ax-table__th">File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading UP SSL-18W assignments...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No SSL 18W installation assignments found." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vendorName = row.vendor_name || row.vendors?.name || `Vendor #${row.vendor}`;
                  const panchayats = parseStringArray(row.village);
                  const previewPanchayats =
                    panchayats.slice(0, 2).join(', ') + (panchayats.length > 2 ? ` +${panchayats.length - 2} more` : '');

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{vendorName}</td>
                      <td className="ax-table__td">{fmtDate(row.assign_date || row.created_at)}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.block || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {previewPanchayats || DASH}
                      </td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setDetailRow(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {fmtNum(row.site_count)} Lights
                        </button>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={row.file ? resolveUpMediaUrl(row.file, 'ssl18w') : null}
                          alt="Work Order File"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                        {(() => {
                          const st = getAssignStatusMeta(row.status);
                          return (
                            <span className={`ax-badge ax-badge--soft ax-badge--${st.tone}`} style={{ fontSize: 11, fontWeight: 700 }}>
                              {st.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {Number(row.status) === 0 && (
                            <button
                              type="button"
                              onClick={() => handleApprove(row.id)}
                              disabled={approvingId === row.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: approvingId === row.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {approvingId === row.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          <Link
                            to={`/vendor-management/up/ssl18w/installation/assign?edit=${row.id}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#2563eb',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDetailRow(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Details Modal */}
      <Modal
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title={`SSL-18W Assignment #${detailRow?.id}`}
        subtitle={detailRow ? `${detailRow.district} · ${detailRow.block} · ${fmtNum(detailRow.site_count)} Lights` : ''}
        maxWidth={640}
        footer={
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => setDetailRow(null)}>
            Close
          </button>
        }
      >
        {detailRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              <div><span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Vendor</span><b>{detailRow.vendor_name || detailRow.vendors?.name || `Vendor #${detailRow.vendor}`}</b></div>
              <div><span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Assign Date</span><b>{fmtDate(detailRow.assign_date || detailRow.created_at)}</b></div>
              <div><span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Deadline</span><b>{fmtDate(detailRow.deadline_date)}</b></div>
            </div>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Assigned Panchayats ({parseStringArray(detailRow.village).length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {parseStringArray(detailRow.village).map((p) => (
                  <span key={p} style={{ padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {detailRow.remarks && (
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block' }}>Remarks</span>
                <p style={{ margin: '4px 0 0', color: '#334155' }}>{detailRow.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPSSL18WViewAssignInstallation;
