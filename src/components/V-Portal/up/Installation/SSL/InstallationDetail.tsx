import { useState, useMemo, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wInstalledLightItem,
  type UpSsl18wInstallDetailsCount,
  type UpSsl18wLightDetail,
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

export function UP_Installation_SSL_InstallationDetail() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'completed' | 'payment'>('completed');

  // KPI counts
  const [counts, setCounts] = useState<UpSsl18wInstallDetailsCount>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_not_applicable: 0,
    claim_verify_approved: 0,
    claim_verify_pending: 0,
    claim_verify_reject: 0,
    payment_complete: 0,
    payment_pending: 0,
  });

  const [completedSites, setCompletedSites] = useState<UpSsl18wInstalledLightItem[]>([]);
  const [paymentSites, setPaymentSites] = useState<UpSsl18wInstalledLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editLightModal, setEditLightModal] = useState<UpSsl18wLightDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Edit form state
  const [editWard, setEditWard] = useState('');
  const [editPole, setEditPole] = useState('');
  const [editBenName, setEditBenName] = useState('');
  const [editBenContact, setEditBenContact] = useState('');
  const [editUuid, setEditUuid] = useState('');
  const [editBattery, setEditBattery] = useState('');
  const [editPanel, setEditPanel] = useState('');
  const [editLightNo, setEditLightNo] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getSsl18wInstalledLights();
      setCounts(res.install_details);
      setCompletedSites(res.completed_sites || []);
      setPaymentSites(res.payment_sites || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeItems = activeTab === 'completed' ? completedSites : paymentSites;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase();
    return activeItems.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [activeItems, searchQuery]);

  const pagination = usePagination(filteredItems, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  // Open Edit Modal
  const handleOpenEdit = async (id: number) => {
    setEditLoading(true);
    setEditLightModal(null);
    try {
      const details = await upInstallationService.getSsl18wInstalledLightForEdit(id);
      if (details) {
        setEditLightModal(details);
        setEditWard(details.ward_no || '');
        setEditPole(details.pole_no || '');
        setEditBenName(details.beneficiary_name || '');
        setEditBenContact(details.beneficiary_contact || '');
        setEditUuid(details.uuid_no || '');
        setEditBattery(details.battery_serial_no || '');
        setEditPanel(details.panel_no || '');
        setEditLightNo(details.light_no || '');
        setEditLat(String(details.latitude || ''));
        setEditLng(String(details.longitude || ''));
        setEditRemark(details.inst_remarks || details.remark || '');
        setEditFile(null);
      } else {
        alert('Could not fetch light details for editing.');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to load edit details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editLightModal) return;

    setEditSubmitting(true);
    const fd = new FormData();
    fd.append('ssl_id', String(editLightModal.id));
    fd.append('uuid_no', editUuid);
    fd.append('light_no', editLightNo);
    fd.append('panel_no', editPanel);
    fd.append('battery_serial_no', editBattery);
    fd.append('latitude', editLat);
    fd.append('longitude', editLng);
    fd.append('beneficiary_name', editBenName);
    fd.append('beneficiary_contact', editBenContact);
    if (editWard) fd.append('ward_no', editWard);
    if (editPole) fd.append('pole_no', editPole);
    if (editRemark) fd.append('remark', editRemark);
    if (editFile) fd.append('light_file', editFile);

    try {
      const res = await upInstallationService.updateSsl18wInstallation(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Installation details updated successfully!' });
        setEditLightModal(null);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Update failed.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while saving changes.' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const exportCols: ExportColumn<UpSsl18wInstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'UID', accessor: (r) => r.uid || DASH },
      { header: 'Installation Date', accessor: (r) => r.installation_date || r.inst_date || DASH },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'Phase', accessor: (r) => r.phase || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
      { header: 'Pole No.', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Contact', accessor: (r) => r.beneficiary_contact || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || DASH },
      { header: 'Battery No.', accessor: (r) => r.battery_serial_no || DASH },
      { header: 'Panel No.', accessor: (r) => r.panel_no || DASH },
      { header: 'Remark', accessor: (r) => r.remark || r.inst_remarks || DASH },
      { header: 'Verify Status', accessor: (r) => (r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Rejected' : 'Pending') },
      { header: 'Payment Status', accessor: (r) => (r.payment_status === 1 || r.inst_pay_status === 1 ? 'Paid' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, UP SSL 18w Install Light"
        subtitle="View installed solar street lights, verification reports, and payment status breakdown"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL 18w Install Light' },
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
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Light
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

      {/* Top 5 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Card 1: Lights */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Lights</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span>{counts.total}</span> / <span style={{ color: '#10b981' }}>{counts.complete}</span> / <span style={{ color: '#f59e0b' }}>{counts.pending}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Total / Installed / Pending</div>
        </div>

        {/* Card 2: Verification Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Verification Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{counts.verify_approved}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{counts.verify_pending}</span> /{' '}
            <span style={{ color: '#ef4444' }}>{counts.verify_reject}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Approved / Pending / Rejected</div>
        </div>

        {/* Card 3: Claim Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Claim Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#3b82f6' }}>{counts.claim_applicable}</span> /{' '}
            <span style={{ color: '#10b981' }}>{counts.claim_raised}</span> /{' '}
            <span style={{ color: '#94a3b8' }}>{counts.claim_not_applicable}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Applicable / Submit / Not Applicable</div>
        </div>

        {/* Card 4: Claim Verify Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Claim Verify Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{counts.claim_verify_approved}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{counts.claim_verify_pending}</span> /{' '}
            <span style={{ color: '#ef4444' }}>{counts.claim_verify_reject}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Approved / Pending / Rejected</div>
        </div>

        {/* Card 5: Payment Status */}
        <div className="ax-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Payment Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{counts.payment_complete}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{counts.payment_pending}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Complete / Pending</div>
        </div>
      </div>

      {/* Main Table with Tabs */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="ax-card__eyebrow">Report Wise Bifurcation</span>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                className={`ax-btn ax-btn--sm ${activeTab === 'completed' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setActiveTab('completed');
                  setSearchQuery('');
                }}
              >
                Lights Completed ({completedSites.length})
              </button>
              <button
                type="button"
                className={`ax-btn ax-btn--sm ${activeTab === 'payment' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setActiveTab('payment');
                  setSearchQuery('');
                }}
              >
                Payment Lights ({paymentSites.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search table..."
              size="sm"
            />
            <TableExportToolbar
              data={filteredItems}
              columns={exportCols}
              filename={`up_ssl_18w_${activeTab}_lights`}
              title={`UP SSL 18W - ${activeTab === 'completed' ? 'Lights Completed' : 'Payment Lights'}`}
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
                  <th>Installation Date</th>
                  <th>State</th>
                  <th>Phase</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Panchayat</th>
                  <th>Ward No.</th>
                  <th>Pole No.</th>
                  <th>Beneficiary Name</th>
                  <th>Contact</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Light No.</th>
                  <th>UUID No.</th>
                  <th>Battery No.</th>
                  {activeTab === 'payment' && <th>Panel No.</th>}
                  <th>Light Image</th>
                  <th>Remark</th>
                  {activeTab === 'payment' && <th>Verify Status</th>}
                  {activeTab === 'payment' && <th>Claim Status</th>}
                  <th>Payment Status</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={24} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading records...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={24} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : 'No installation records in this view'}
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
                        <td>{item.installation_date || item.inst_date || DASH}</td>
                        <td>{item.state ? item.state.toUpperCase() : 'UP'}</td>
                        <td>{item.phase || DASH}</td>
                        <td>{item.district || DASH}</td>
                        <td>{item.block || DASH}</td>
                        <td>{item.panchayat || DASH}</td>
                        <td>{item.ward_no || DASH}</td>
                        <td>{item.pole_no || DASH}</td>
                        <td>{item.beneficiary_name || DASH}</td>
                        <td>{item.beneficiary_contact || DASH}</td>
                        <td>{item.latitude || DASH}</td>
                        <td>{item.longitude || DASH}</td>
                        <td>{item.light_no || DASH}</td>
                        <td>{item.uuid_no || DASH}</td>
                        <td>{item.battery_serial_no || DASH}</td>
                        {activeTab === 'payment' && <td>{item.panel_no || DASH}</td>}
                        <td>
                          {imgUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(imgUrl)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #cbd5e1',
                                padding: 2,
                                borderRadius: 4,
                                cursor: 'pointer',
                              }}
                              title="Click to zoom image"
                            >
                              <img
                                src={imgUrl}
                                alt="Light"
                                style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td>{item.remark || item.inst_remarks || DASH}</td>
                        {activeTab === 'payment' && <td><VerifyBadge value={item.verify_status} /></td>}
                        {activeTab === 'payment' && <td><ClaimBadge status={item.claim_status || item.inst_claim_status} /></td>}
                        <td><PaymentBadge status={item.payment_status || item.inst_pay_status} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => handleOpenEdit(item.id)}
                            disabled={editLoading}
                          >
                            Edit
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

      {/* Full Image Preview Modal */}
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

      {/* Edit Light Modal */}
      {editLightModal &&
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
            onClick={() => setEditLightModal(null)}
          >
            <div
              className="ax-card"
              style={{ width: 680, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Edit Installed Light ({editLightModal.uid})
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setEditLightModal(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="ax-card__body" style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Ward No.</label>
                      <input type="text" className="ax-input" value={editWard} onChange={(e) => setEditWard(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Pole No.</label>
                      <input type="text" className="ax-input" value={editPole} onChange={(e) => setEditPole(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Beneficiary Name *</label>
                      <input type="text" required className="ax-input" value={editBenName} onChange={(e) => setEditBenName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Contact Number *</label>
                      <input type="tel" required className="ax-input" value={editBenContact} onChange={(e) => setEditBenContact(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>UUID No. *</label>
                      <input type="text" required className="ax-input" value={editUuid} onChange={(e) => setEditUuid(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Light No. *</label>
                      <input type="text" required className="ax-input" value={editLightNo} onChange={(e) => setEditLightNo(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Panel No. *</label>
                      <input type="text" required className="ax-input" value={editPanel} onChange={(e) => setEditPanel(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Battery No. *</label>
                      <input type="text" required className="ax-input" value={editBattery} onChange={(e) => setEditBattery(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Latitude *</label>
                      <input type="text" required className="ax-input" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Longitude *</label>
                      <input type="text" required className="ax-input" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Change Photo (Optional)</label>
                      <input type="file" accept="image/*,.pdf" className="ax-input" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Remarks</label>
                      <textarea rows={2} className="ax-textarea" value={editRemark} onChange={(e) => setEditRemark(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditLightModal(null)} disabled={editSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={editSubmitting}>
                    {editSubmitting ? 'Saving Changes...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_SSL_InstallationDetail;
