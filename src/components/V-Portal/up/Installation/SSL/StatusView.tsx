import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wInstalledLightItem,
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
  if (v === 2) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Paid</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const STATUS_OPTIONS: { id: string; label: string; countKey?: string }[] = [
  { id: 'total', label: 'Total Lights' },
  { id: 'accept', label: 'Accepted' },
  { id: 'complete', label: 'Complete' },
  { id: 'pending', label: 'Pending' },
  { id: 'verify-approved', label: 'Verify Approved' },
  { id: 'verify-pending', label: 'Verify Pending' },
  { id: 'verify-reject', label: 'Verify Rejected' },
  { id: 'claim-applicable', label: 'Claim Applicable' },
  { id: 'claim-raised', label: 'Claim Raised' },
  { id: 'claim-not-applicable', label: 'Claim N/A' },
  { id: 'claim-verify-approved', label: 'Claim Verify Approved' },
  { id: 'claim-verify-pending', label: 'Claim Verify Pending' },
  { id: 'claim-verify-reject', label: 'Claim Verify Rejected' },
  { id: 'payment-complete', label: 'Payment Done' },
  { id: 'payment-pending', label: 'Payment Pending' },
];

export function UP_Installation_SSL_StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStatus = searchParams.get('status') || 'complete';
  const currentDistrict = searchParams.get('district') || '';

  const [loading, setLoading] = useState(false);
  const [lights, setLights] = useState<UpSsl18wInstalledLightItem[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<UpSsl18wInstalledLightItem | null>(null);

  // Sync state with URL params
  useEffect(() => {
    setSelectedDistrict(searchParams.get('district') || '');
  }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let data: UpSsl18wInstalledLightItem[] = [];
      if (selectedDistrict && selectedDistrict !== 'All') {
        data = await upInstallationService.getSsl18wDashboardByDistrict(currentStatus, selectedDistrict);
      } else {
        data = await upInstallationService.getSsl18wDashboardByStatus(currentStatus);
      }
      setLights(data);

      // Extract unique districts if not loaded
      if (data.length > 0) {
        setDistricts((prev) => {
          const set = new Set([...prev, ...data.map((d) => d.district).filter(Boolean) as string[]]);
          return Array.from(set).sort();
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to fetch status lights');
    } finally {
      setLoading(false);
    }
  }, [currentStatus, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', newStatus);
    setSearchParams(params);
  };

  const handleDistrictChange = (dist: string) => {
    const params = new URLSearchParams(searchParams);
    if (dist && dist !== 'All') {
      params.set('district', dist);
    } else {
      params.delete('district');
    }
    setSearchParams(params);
  };

  // Filtered lights by search query
  const filteredLights = useMemo(() => {
    if (!searchQuery.trim()) return lights;
    const q = searchQuery.toLowerCase();
    return lights.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [lights, searchQuery]);

  const pagination = usePagination(filteredLights, { initialPageSize: 15 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  // Export columns
  const exportCols: ExportColumn<UpSsl18wInstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'UID', accessor: (r) => r.uid || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
      { header: 'Pole No.', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Contact', accessor: (r) => r.beneficiary_contact || DASH },
      { header: 'Installation Date', accessor: (r) => r.installation_date || r.inst_date || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || DASH },
      { header: 'Battery No.', accessor: (r) => r.battery_serial_no || DASH },
      { header: 'Panel No.', accessor: (r) => r.panel_no || DASH },
      { header: 'Verify Status', accessor: (r) => (r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Rejected' : 'Pending') },
      { header: 'Claim Status', accessor: (r) => (r.claim_status === 1 ? 'Raised' : r.claim_status === 2 ? 'Approved' : 'Not Raised') },
      { header: 'Payment Status', accessor: (r) => (r.payment_status === 1 || r.inst_pay_status === 1 ? 'Paid' : 'Pending') },
      { header: 'Remarks', accessor: (r) => r.remark || r.inst_remarks || DASH },
    ],
    []
  );

  const activeStatusMeta = STATUS_OPTIONS.find((s) => s.id === currentStatus) || STATUS_OPTIONS[0];

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="UP SSL 18W - Installation Status Drilldown"
        subtitle={`Viewing lights with status: ${activeStatusMeta.label}${selectedDistrict ? ` in ${selectedDistrict}` : ''}`}
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL 18W Installation', href: '/v/up/ssl-18w-installation-dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <Link to="/v/up/ssl-18w-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
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
          </div>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div className="ax-card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status Quick Pills */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Status Category
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = opt.id === currentStatus;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStatusChange(opt.id)}
                    className="ax-btn ax-btn--sm"
                    style={{
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'var(--ax-accent, #2563eb)' : 'var(--ax-surface-subtle, #f1f5f9)',
                      color: isActive ? '#fff' : 'var(--ax-text, #334155)',
                      border: isActive ? '1px solid var(--ax-accent, #2563eb)' : '1px solid var(--ax-border, #cbd5e1)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* District & Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label htmlFor="ssl-district-filter" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                District:
              </label>
              <select
                id="ssl-district-filter"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 13 }}
                value={selectedDistrict || 'All'}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {selectedDistrict && selectedDistrict !== 'All' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, fontSize: 12 }}
                  onClick={() => handleDistrictChange('All')}
                >
                  Clear District
                </button>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--ax-text-muted)' }}>
              Showing <b style={{ color: 'var(--ax-text-strong)' }}>{filteredLights.length}</b> records
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              {activeStatusMeta.label} Records
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Detailed installation breakdown for selected status
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search UID, contact, site..."
              size="sm"
            />
            <TableExportToolbar
              data={filteredLights}
              columns={exportCols}
              filename={`up_ssl_18w_${currentStatus}`}
              title={`UP SSL 18W - ${activeStatusMeta.label}`}
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>UID</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Panchayat</th>
                  <th>Ward / Pole</th>
                  <th>Beneficiary Name</th>
                  <th>Contact</th>
                  <th>Light / UUID No.</th>
                  <th>Image</th>
                  <th>Verify Status</th>
                  <th>Claim Status</th>
                  <th>Payment</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: 40 }}>
                      <div className="ax-cluster" style={{ justifyContent: 'center', gap: 8 }}>
                        <span className="ax-spinner" /> Loading records...
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No records found"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : `No sites found matching status "${activeStatusMeta.label}"`}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, idx) => {
                    const sr = startIndex + idx + 1;
                    const imgUrl = item.light_file ? resolveUpMediaUrl(item.light_file) : '';
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>{item.uid || DASH}</td>
                        <td>{item.district || DASH}</td>
                        <td>{item.block || DASH}</td>
                        <td>{item.panchayat || DASH}</td>
                        <td>
                          {item.ward_no || DASH} / {item.pole_no || DASH}
                        </td>
                        <td>{item.beneficiary_name || DASH}</td>
                        <td>{item.beneficiary_contact || DASH}</td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            <div><b>L:</b> {item.light_no || DASH}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}><b>U:</b> {item.uuid_no || DASH}</div>
                          </div>
                        </td>
                        <td>
                          {imgUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(imgUrl)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--ax-border, #cbd5e1)',
                                padding: 2,
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'inline-block',
                              }}
                              title="Click to view full photo"
                            >
                              <img
                                src={imgUrl}
                                alt="Light"
                                style={{ width: 34, height: 34, objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: 11 }}>{DASH}</span>
                          )}
                        </td>
                        <td><VerifyBadge value={item.verify_status} /></td>
                        <td><ClaimBadge status={item.claim_status || item.inst_claim_status} /></td>
                        <td><PaymentBadge status={item.payment_status || item.inst_pay_status} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => setViewDetailModal(item)}
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

      {/* Detail Modal */}
      {viewDetailModal &&
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
            onClick={() => setViewDetailModal(null)}
          >
            <div
              className="ax-card"
              style={{ width: 680, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Light Details: {viewDetailModal.uid}
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setViewDetailModal(null)}
                >
                  ✕
                </button>
              </div>
              <div className="ax-card__body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, fontSize: 13 }}>
                  <div><b>UID:</b> {viewDetailModal.uid || DASH}</div>
                  <div><b>State:</b> UP</div>
                  <div><b>District:</b> {viewDetailModal.district || DASH}</div>
                  <div><b>Block:</b> {viewDetailModal.block || DASH}</div>
                  <div><b>Panchayat:</b> {viewDetailModal.panchayat || DASH}</div>
                  <div><b>Ward No.:</b> {viewDetailModal.ward_no || DASH}</div>
                  <div><b>Pole No.:</b> {viewDetailModal.pole_no || DASH}</div>
                  <div><b>Beneficiary Name:</b> {viewDetailModal.beneficiary_name || DASH}</div>
                  <div><b>Beneficiary Contact:</b> {viewDetailModal.beneficiary_contact || DASH}</div>
                  <div><b>Installation Date:</b> {viewDetailModal.installation_date || viewDetailModal.inst_date || DASH}</div>
                  <div><b>Light No.:</b> {viewDetailModal.light_no || DASH}</div>
                  <div><b>UUID No.:</b> {viewDetailModal.uuid_no || DASH}</div>
                  <div><b>Battery Serial No.:</b> {viewDetailModal.battery_serial_no || DASH}</div>
                  <div><b>Panel No.:</b> {viewDetailModal.panel_no || DASH}</div>
                  <div><b>Latitude:</b> {viewDetailModal.latitude || DASH}</div>
                  <div><b>Longitude:</b> {viewDetailModal.longitude || DASH}</div>
                  <div><b>Verify Status:</b> <VerifyBadge value={viewDetailModal.verify_status} /></div>
                  <div><b>Claim Status:</b> <ClaimBadge status={viewDetailModal.claim_status || viewDetailModal.inst_claim_status} /></div>
                  <div><b>Payment Status:</b> <PaymentBadge status={viewDetailModal.payment_status || viewDetailModal.inst_pay_status} /></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <b>Remarks:</b> {viewDetailModal.remark || viewDetailModal.inst_remarks || DASH}
                  </div>
                  {viewDetailModal.light_file && (
                    <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
                      <b>Light Photo:</b>
                      <div style={{ marginTop: 6 }}>
                        <img
                          src={resolveUpMediaUrl(viewDetailModal.light_file)}
                          alt="Light attachment"
                          style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 6, objectFit: 'contain', border: '1px solid #e2e8f0' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setViewDetailModal(null)}
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

export default UP_Installation_SSL_StatusView;
