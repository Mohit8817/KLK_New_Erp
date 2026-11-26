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
  upKusumCAdminService,
  resolveUpMediaUrl,
  type UpKusumCAssignRecord,
  type UpKusumCAssignSiteDetail,
  type UpKusumCDetailSummary,
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
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../upInstallationShared';

function getSiteList(row: UpKusumCAssignRecord): UpKusumCAssignSiteDetail[] {
  if (Array.isArray(row.site_id)) {
    return row.site_id
      .filter((s: any) => s && typeof s === 'object')
      .map((s: any) => s as UpKusumCAssignSiteDetail);
  }
  return [];
}

function getAssignStatusMeta(status: unknown): { label: string; tone: 'warning' | 'info' | 'success' } {
  const code = Number(status);
  if (code === 2) return { label: 'Accepted', tone: 'success' };
  if (code === 1) return { label: 'Approved', tone: 'info' };
  return { label: 'Pending', tone: 'warning' };
}

function normalizeMaterialYesNo(val?: string | number | null): string {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim().toLowerCase();
  if (s === 'yes' || s === '1' || s === 'true') return 'Yes';
  if (s === 'no' || s === '0' || s === 'false') return 'No';
  return '';
}

function normalizeVfdValue(val?: string | number | null): string {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim().toLowerCase();
  if (s === '1' || s === 'yes' || s === 'true') return '1';
  if (s === '0' || s === 'no' || s === 'false') return '0';
  return '';
}

export function UPKusumCViewAssignInstallation() {
  const [assigns, setAssigns] = useState<UpKusumCAssignRecord[]>([]);
  const [detail, setDetail] = useState<UpKusumCDetailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail modal & Material Status edit modal
  const [selectedAssign, setSelectedAssign] = useState<UpKusumCAssignRecord | null>(null);
  const [materialSite, setMaterialSite] = useState<UpKusumCAssignSiteDetail | null>(null);
  const [mtBos, setMtBos] = useState('');
  const [vfdStatus, setVfdStatus] = useState('');
  const [mtInverter, setMtInverter] = useState('');
  const [mtStructure, setMtStructure] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upKusumCAdminService.getViewAssign();
      setAssigns(res.assigns);
      setDetail(res.detail);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load UP Kusum C assigned installations.');
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
      const res = await upKusumCAdminService.approveAssign(id);
      setSuccessMsg(res.message || `Assignment #${id} approved successfully!`);
      setAssigns((prev) => prev.map((a) => (a.id === id ? { ...a, status: 1 } : a)));
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  const openMaterialModal = (site: UpKusumCAssignSiteDetail) => {
    setMaterialSite(site);
    setMtBos(normalizeMaterialYesNo(site.mt_bos));
    setVfdStatus(normalizeVfdValue(site.vfd_status));
    setMtInverter(normalizeMaterialYesNo(site.mt_inverter));
    setMtStructure(normalizeMaterialYesNo(site.mt_structure));
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialSite) return;
    setSavingMaterial(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const vfdPayload = vfdStatus === '1' || vfdStatus === '0' ? vfdStatus : undefined;
      const res = await upKusumCAdminService.updateMaterialStatus({
        id: materialSite.id,
        mt_bos: mtBos || undefined,
        vfd_status: vfdPayload,
        mt_inverter: mtInverter || undefined,
        mt_structure: mtStructure || undefined,
      });
      setSuccessMsg(res.message || 'Material status updated successfully.');
      const patchSite = (s: UpKusumCAssignSiteDetail) =>
        s.id === materialSite.id
          ? {
              ...s,
              mt_bos: mtBos || s.mt_bos,
              vfd_status: vfdPayload ?? s.vfd_status,
              mt_inverter: mtInverter || s.mt_inverter,
              mt_structure: mtStructure || s.mt_structure,
            }
          : s;

      setAssigns((prev) =>
        prev.map((a) => ({
          ...a,
          site_id: Array.isArray(a.site_id)
            ? a.site_id.map((s: any) => (typeof s === 'object' ? patchSite(s) : s))
            : a.site_id,
        }))
      );
      setSelectedAssign((prev) =>
        prev
          ? {
              ...prev,
              site_id: Array.isArray(prev.site_id)
                ? prev.site_id.map((s: any) => (typeof s === 'object' ? patchSite(s) : s))
                : prev.site_id,
            }
          : null
      );
      setMaterialSite(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update material status.');
    } finally {
      setSavingMaterial(false);
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
      const vName = (row.vendor_name || row.vendors?.name || '').toLowerCase();
      const dist = (row.district || '').toLowerCase();
      const vol = String(row.volume ?? '').toLowerCase();
      const rem = (row.remarks || '').toLowerCase();
      const farmers = getSiteList(row)
        .map((s) => `${s.f_farmer_name || ''} ${s.f_father_name || ''}`.toLowerCase())
        .join(' ');
      return (
        vName.includes(q) ||
        dist.includes(q) ||
        vol.includes(q) ||
        rem.includes(q) ||
        farmers.includes(q) ||
        String(row.id).includes(q)
      );
    });
  }, [assigns, searchQuery, statusFilter]);

  const pagination = usePagination(filteredAssigns, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpKusumCAssignRecord>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpKusumCAssignRecord, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Vendor', accessor: (r) => r.vendor_name || r.vendors?.name || `Vendor #${r.vendor}` },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Volume', accessor: (r) => r.volume ?? DASH },
      {
        header: 'Applicants',
        accessor: (r) =>
          getSiteList(r)
            .map((s) => `${s.f_farmer_name}${s.f_father_name ? ` (${s.f_father_name})` : ''}`)
            .join(', ') || DASH,
      },
      { header: 'Deadline', accessor: (r) => fmtDate(r.deadline_date) },
      { header: 'Count', accessor: (r) => r.site_count || getSiteList(r).length },
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
        title="View Assign UP Kusum-C Installation"
        subtitle="Track Kusum C vendor installation allocations, nested farmer material status (BOS/VFD/Inverter/Structure), and approvals"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'View Assign Installation' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      {/* Top KPI Summary Cards matching User Fields */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /></svg>}
          tone="accent"
          label="Total / Assign / Accept / Not Assigned"
          value={`${fmtNum(detail?.total)} / ${fmtNum(detail?.ourside_assigned)} / ${fmtNum(detail?.assigned)} / ${fmtNum(detail?.not_assigned)}`}
          sub="Total · Assign · Accept · Not Assigned"
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
          label="Assignment Batches"
          value={fmtNum(assigns.length)}
          sub={`Pending: ${assigns.filter((a) => Number(a.status) === 0).length} · Approved: ${assigns.filter((a) => Number(a.status) === 1).length} · Accepted: ${assigns.filter((a) => Number(a.status) === 2).length}`}
        />
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Assign UP Kusum-C Installation</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredAssigns.length}</span> of <span className="ax-num">{assigns.length}</span> assignments
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
                to="/vendor-management/up/kusumc/installation/assign"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                + Assign Installation
              </Link>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, farmer..."
                size="sm"
              />

              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredAssigns, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredAssigns, exportCols, `UP_KusumC_View_Assign_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredAssigns, exportCols, `UP_KusumC_View_Assign_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredAssigns, exportCols, 'View Assign UP Kusum-C Installation')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Applicant Name - Deadline & Material</th>
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
                  <td colSpan={11} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading UP Kusum C assignments...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState title="No assignments found" description="Try adjusting search or status filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vendorName = row.vendor_name || row.vendors?.name || `Vendor #${row.vendor}`;
                  const sites = getSiteList(row);
                  const count = row.site_count || sites.length;
                  const fileUrl = row.file ? resolveUpMediaUrl(row.file, 'kusumc') : '';

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{vendorName}</td>
                      <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>{fmtDate(row.assign_date || row.created_at)}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                        <div>{row.district || DASH}</div>
                        {row.volume && <div style={{ fontSize: 11, color: '#64748b' }}>Vol: {row.volume}</div>}
                      </td>
                      <td className="ax-table__td" style={{ minWidth: 340 }}>
                        {sites.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sites.slice(0, 2).map((s, sIdx) => (
                              <div
                                key={s.id || sIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  padding: '5px 8px',
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 6,
                                  fontSize: 11.5,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                    {s.f_farmer_name} {s.f_father_name ? `(${s.f_father_name})` : ''}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                    Deadline: {fmtDate(s.inst_deadline || row.deadline_date)} · BOS: <b>{normalizeMaterialYesNo(s.mt_bos) || 'No'}</b> · VFD: <b>{normalizeMaterialYesNo(s.vfd_status) || 'No'}</b> · Inv: <b>{normalizeMaterialYesNo(s.mt_inverter) || 'No'}</b> · Str: <b>{normalizeMaterialYesNo(s.mt_structure) || 'No'}</b>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openMaterialModal(s)}
                                  className="ax-btn ax-btn--secondary ax-btn--xs"
                                  style={{ fontSize: 10, padding: '2px 7px', flexShrink: 0 }}
                                >
                                  Material
                                </button>
                              </div>
                            ))}
                            {sites.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setSelectedAssign(row)}
                                style={{
                                  alignSelf: 'flex-start',
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                +{sites.length - 2} more farmer(s) — View all & Material Status ↗
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: 12 }}>
                            Deadline: {fmtDate(row.deadline_date)}
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setSelectedAssign(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {count} Site{count === 1 ? '' : 's'} ↗
                        </button>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={fileUrl || null}
                          alt="Assignment File"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <td className="ax-table__td" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                            to={`/vendor-management/up/kusumc/installation/assign?edit=${row.id}`}
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
                          <Link
                            to={`/vendor-management/up/kusumc/installation/assign?reassign=${row.id}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'rgba(124, 58, 237, 0.08)',
                              color: '#7c3aed',
                              border: '1px solid rgba(124, 58, 237, 0.2)',
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Reassign
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedAssign(row)}
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

      {/* Nested Farmer Info & Material Status Modal */}
      <Modal
        open={Boolean(selectedAssign)}
        onClose={() => setSelectedAssign(null)}
        title={`Assigned Farmers: ${selectedAssign?.vendor_name || selectedAssign?.vendors?.name || ''}`}
        subtitle={`Batch #${selectedAssign?.id} • District: ${selectedAssign?.district} • Volume: ${selectedAssign?.volume ?? DASH}`}
        maxWidth={880}
        footer={
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => setSelectedAssign(null)}>
            Close
          </button>
        }
      >
        {selectedAssign && (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th className="ax-table__th">Sr. No.</th>
                  <th className="ax-table__th">Farmer Info</th>
                  <th className="ax-table__th">Deadline</th>
                  <th className="ax-table__th">BOS</th>
                  <th className="ax-table__th">VFD</th>
                  <th className="ax-table__th">Inverter</th>
                  <th className="ax-table__th">Structure</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getSiteList(selectedAssign).length > 0 ? (
                  getSiteList(selectedAssign).map((site, i) => (
                    <tr key={site.id || i}>
                      <td className="ax-table__td">{i + 1}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{site.f_farmer_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {site.f_father_name ? `S/o ${site.f_father_name} • ` : ''}ID #{site.id}
                        </div>
                      </td>
                      <td className="ax-table__td">{fmtDate(site.inst_deadline || selectedAssign.deadline_date)}</td>
                      <td className="ax-table__td">{normalizeMaterialYesNo(site.mt_bos) || 'No'}</td>
                      <td className="ax-table__td">{normalizeMaterialYesNo(site.vfd_status) || 'No'}</td>
                      <td className="ax-table__td">{normalizeMaterialYesNo(site.mt_inverter) || 'No'}</td>
                      <td className="ax-table__td">{normalizeMaterialYesNo(site.mt_structure) || 'No'}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--xs"
                          onClick={() => openMaterialModal(site)}
                        >
                          Update Material
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                      No farmer site details returned for this assignment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Material Status Update Modal (Endpoint #18) */}
      <Modal
        open={Boolean(materialSite)}
        onClose={() => setMaterialSite(null)}
        title="Material Status Update"
        maxWidth={520}
      >
        <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Farmer Name</label>
              <input
                type="text"
                className="ax-input"
                value={materialSite?.f_farmer_name || DASH}
                readOnly
                disabled
                style={{ width: '100%', background: '#f8fafc', color: '#0f172a', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Father Name</label>
              <input
                type="text"
                className="ax-input"
                value={materialSite?.f_father_name || DASH}
                readOnly
                disabled
                style={{ width: '100%', background: '#f8fafc', color: '#0f172a', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>BOS Status</label>
              <select className="ax-input" value={mtBos} onChange={(e) => setMtBos(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select Status --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>VFD Status</label>
              <select className="ax-input" value={vfdStatus} onChange={(e) => setVfdStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select Status --</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Inverter Status</label>
              <select className="ax-input" value={mtInverter} onChange={(e) => setMtInverter(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select Status --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Structure Status</label>
              <select className="ax-input" value={mtStructure} onChange={(e) => setMtStructure(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select Status --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setMaterialSite(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={savingMaterial}>
              {savingMaterial ? 'Saving...' : 'Save Material Status'}
            </button>
          </div>
        </form>
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPKusumCViewAssignInstallation;
