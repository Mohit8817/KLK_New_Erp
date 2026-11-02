import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoInstalledSiteItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value?: number | string }) => {
  const v = Number(value ?? 0);
  if (v === 1) return <Badge tone="success">Approved</Badge>;
  if (v === 2) return <Badge tone="danger">Reject</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

export function UP_Installation_Resco_InstallationDetail() {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<UpRescoInstalledSiteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<UpRescoInstalledSiteItem | null>(null);

  // Summary counts
  const [totalAssign, setTotalAssign] = useState(0);
  const [completeCount, setCompleteCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [verifyPendingCount, setVerifyPendingCount] = useState(0);
  const [rejectCount, setRejectCount] = useState(0);
  const [docApproved, setDocApproved] = useState(0);
  const [docPending, setDocPending] = useState(0);
  const [docReject, setDocReject] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoInstalledSites();
      const list = res.data || [];
      setSites(list);

      // Derive counts
      const tot = list.length;
      setTotalAssign(tot);
      const comp = list.filter((s) => s.installation_date || s.inverter_no).length;
      setCompleteCount(comp);
      setPendingCount(tot - comp);

      const vApp = list.filter((s) => s.verify_status === 1).length;
      const vRej = list.filter((s) => s.verify_status === 2).length;
      setApprovedCount(vApp);
      setRejectCount(vRej);
      setVerifyPendingCount(tot - vApp - vRej);

      const dApp = list.filter((s) => s.document_status === 1).length;
      const dRej = list.filter((s) => s.document_status === 2).length;
      setDocApproved(dApp);
      setDocReject(dRej);
      setDocPending(tot - dApp - dRej);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load Resco installations.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const q = searchQuery.toLowerCase();
    return sites.filter((s) =>
      Object.values(s).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [sites, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  const renderImageThumb = (path?: string) => {
    if (!path) return <span style={{ color: 'var(--ax-text-muted)', fontSize: 11 }}>{DASH}</span>;
    const url = resolveUpMediaUrl(path);
    return (
      <button
        type="button"
        onClick={() => setPreviewImage(url)}
        style={{
          background: 'transparent',
          border: '1px solid #cbd5e1',
          padding: 2,
          borderRadius: 4,
          cursor: 'pointer',
        }}
        title="View image"
      >
        <img
          src={url}
          alt="Equipment"
          style={{ width: 28, height: 28, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </button>
    );
  };

  const exportCols: ExportColumn<UpRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'Installation Date', accessor: (r) => r.installation_date || DASH },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.remark || DASH },
      { header: 'Verify Status', accessor: (r) => (r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Reject' : 'Pending') },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
      { header: 'Document Status', accessor: (r) => (r.document_status === 1 ? 'Approved' : r.document_status === 2 ? 'Reject' : 'Pending') },
      { header: 'Document Remarks', accessor: (r) => r.document_remarks || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, View UP Resco Installation"
        subtitle="Rooftop solar installation progress, metering equipment and site verification status"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Installation' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Site
            </Link>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ${toast.type === 'success' ? 'ax-alert--success' : 'ax-alert--danger'}`} style={{ marginBottom: 16 }}>
          <span>{toast.message}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setToast(null)} style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Card 1: Total */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Total</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            {totalAssign}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Total Assign</div>
        </div>

        {/* Card 2: Installation Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Installation Status</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{completeCount}</span> / <span style={{ color: '#f59e0b' }}>{pendingCount}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Complete / Pending</div>
        </div>

        {/* Card 3: Verification Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Verification Status</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{approvedCount}</span> / <span style={{ color: '#f59e0b' }}>{verifyPendingCount}</span> / <span style={{ color: '#ef4444' }}>{rejectCount}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Approved / Pending / Reject</div>
        </div>

        {/* Card 4: Document Verify */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Document Verify</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{docApproved}</span> / <span style={{ color: '#f59e0b' }}>{docPending}</span> / <span style={{ color: '#ef4444' }}>{docReject}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Approved / Pending / Reject</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              UP Resco Installation
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              List of completed RESCO sites and physical verification records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search site, CA, meter..."
              size="sm"
            />
            <TableExportToolbar
              data={filtered}
              columns={exportCols}
              filename="up_resco_installation_details"
              title="UP Resco Installation"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>Installation Date</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Site Name</th>
                  <th>Contact Person</th>
                  <th>Contact Number</th>
                  <th>Solar Meter No.</th>
                  <th>Inverter No.</th>
                  <th>Net/Smart Meter No.</th>
                  <th>Loger No.</th>
                  <th>System Image</th>
                  <th>Inverter Image</th>
                  <th>Panel Image</th>
                  <th>Net Meter Image</th>
                  <th>Loger Image</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Remark</th>
                  <th>Verify Status</th>
                  <th>Verify Remarks</th>
                  <th>Document Status</th>
                  <th>Document File</th>
                  <th>Document Remarks</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={25} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading Resco installations...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={25} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : 'No installation records available'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, idx) => {
                    const sr = startIndex + idx + 1;
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td>{item.installation_date || DASH}</td>
                        <td>{item.state ? item.state.toUpperCase() : 'UP'}</td>
                        <td>{item.district || DASH}</td>
                        <td style={{ fontWeight: 600 }}>{item.site_name || DASH}</td>
                        <td>{item.contact_person || DASH}</td>
                        <td>{item.contact_number || DASH}</td>
                        <td>{item.solar_meter_no || DASH}</td>
                        <td>{item.inverter_no || DASH}</td>
                        <td>{item.net_smart_meter_no || DASH}</td>
                        <td>{item.loger_no || DASH}</td>
                        <td>{renderImageThumb(item.system_image)}</td>
                        <td>{renderImageThumb(item.inverter_image)}</td>
                        <td>{renderImageThumb(item.panel_image)}</td>
                        <td>{renderImageThumb(item.net_meter_smart_meter_image)}</td>
                        <td>{renderImageThumb(item.loger_image)}</td>
                        <td>{item.latitude || DASH}</td>
                        <td>{item.longitude || DASH}</td>
                        <td>{item.remark || DASH}</td>
                        <td><VerifyBadge value={item.verify_status} /></td>
                        <td>{item.verify_remarks || DASH}</td>
                        <td><VerifyBadge value={item.document_status} /></td>
                        <td>
                          {item.document_file ? (
                            <a
                              href={resolveUpMediaUrl(item.document_file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              File
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td>{item.document_remarks || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => setViewModal(item)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ax-card__footer" style={{ padding: '10px 18px' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setPreviewImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--icon"
                style={{ position: 'absolute', top: -16, right: -16, background: '#fff', borderRadius: '50%', zIndex: 10 }}
                onClick={() => setPreviewImage(null)}
              >
                ✕
              </button>
              <img
                src={previewImage}
                alt="Enlarged view"
                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* View Detail Modal */}
      {viewModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setViewModal(null)}
          >
            <div
              className="ax-card"
              style={{ width: 680, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Site: {viewModal.site_name || `Site #${viewModal.id}`}
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setViewModal(null)}
                >
                  ✕
                </button>
              </div>
              <div className="ax-card__body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, fontSize: 13 }}>
                  <div><b>State:</b> UP</div>
                  <div><b>District:</b> {viewModal.district || DASH}</div>
                  <div><b>Site Name:</b> {viewModal.site_name || DASH}</div>
                  <div><b>Installation Date:</b> {viewModal.installation_date || DASH}</div>
                  <div><b>Contact Person:</b> {viewModal.contact_person || DASH}</div>
                  <div><b>Contact Number:</b> {viewModal.contact_number || DASH}</div>
                  <div><b>Solar Meter No.:</b> {viewModal.solar_meter_no || DASH}</div>
                  <div><b>Inverter No.:</b> {viewModal.inverter_no || DASH}</div>
                  <div><b>Net/Smart Meter No.:</b> {viewModal.net_smart_meter_no || DASH}</div>
                  <div><b>Loger No.:</b> {viewModal.loger_no || DASH}</div>
                  <div><b>Latitude:</b> {viewModal.latitude || DASH}</div>
                  <div><b>Longitude:</b> {viewModal.longitude || DASH}</div>
                  <div><b>Verify Status:</b> <VerifyBadge value={viewModal.verify_status} /></div>
                  <div><b>Document Status:</b> <VerifyBadge value={viewModal.document_status} /></div>
                  <div style={{ gridColumn: 'span 2' }}><b>Remark:</b> {viewModal.remark || DASH}</div>
                  <div style={{ gridColumn: 'span 2' }}><b>Verify Remarks:</b> {viewModal.verify_remarks || DASH}</div>
                </div>
              </div>
              <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setViewModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_Resco_InstallationDetail;
