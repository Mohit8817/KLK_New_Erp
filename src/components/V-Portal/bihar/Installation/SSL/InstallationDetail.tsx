import { useCallback, useEffect, useMemo, useState, useDeferredValue, type FormEvent } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type InstalledLightsSummary,
  type InstalledLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const RED_DANGER = '#ef4444';

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

export function Bihar_Installation_SSL_InstallationDetail() {
  const [activeTab, setActiveTab] = useState<'Completed' | 'Payment'>('Completed');
  const [loading, setLoading] = useState(true);

  // Raw lists & summary
  const [summary, setSummary] = useState<InstalledLightsSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<InstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<InstalledLightItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState('all');

  // Modal States
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<InstalledLightItem | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    beneficiary_name: '',
    contact_no: '',
    ward_no: '',
    pole_no: '',
    uuid_no: '',
    light_no: '',
    module_no: '',
    battery_serial_no: '',
    latitude: '',
    longitude: '',
    remark: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstalledLights();
      if (res) {
        setSummary(res.install_detail || null);
        setCompleteLights(Array.isArray(res.complete_lights) ? res.complete_lights : []);
        setPaymentLights(Array.isArray(res.payment_lights) ? res.payment_lights : []);
      }
    } catch (err) {
      console.error('[InstallationDetail] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current tab dataset
  const currentList = activeTab === 'Completed' ? completeLights : paymentLights;

  // Available districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  // Filtered dataset
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return currentList.filter((r) => {
      if (q) {
        const matches =
          (r.unique_id && r.unique_id.toLowerCase().includes(q)) ||
          (r.uid && r.uid.toLowerCase().includes(q)) ||
          (r.beneficiary_name && r.beneficiary_name.toLowerCase().includes(q)) ||
          (r.contact_no && r.contact_no.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.panchyat && r.panchyat.toLowerCase().includes(q)) ||
          (r.uuid_no && r.uuid_no.toLowerCase().includes(q)) ||
          (r.light_no && r.light_no.toLowerCase().includes(q)) ||
          (r.battery_no && r.battery_no.toLowerCase().includes(q)) ||
          (r.panel_no && r.panel_no.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (verifyFilter !== 'all') {
        const vStatus = String(r.inst_verify_status ?? r.verify_status ?? '');
        if (vStatus !== verifyFilter) return false;
      }

      return true;
    });
  }, [currentList, deferredQuery, districtFilter, verifyFilter]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Open Edit Modal & load light details
  const handleOpenEdit = async (lightId: number) => {
    setEditingId(lightId);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    setEditFile(null);

    try {
      const data = await biharSslInstallationService.getInstalledLightEdit(lightId);
      if (data) {
        setEditForm({
          beneficiary_name: data.beneficiary_name || '',
          contact_no: data.contact_no || '',
          ward_no: data.ward_no || '',
          pole_no: data.pole_no || '',
          uuid_no: data.uuid_no || '',
          light_no: data.light_no || '',
          module_no: data.module_no || data.panel_no || '',
          battery_serial_no: data.battery_serial_no || data.battery_no || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          remark: data.remark || data.inst_remark || '',
        });
      }
    } catch (err: any) {
      console.error('[Edit Light] fetch error:', err);
      setEditErrorMsg(err.message || 'Failed to fetch light details.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setEditSubmitting(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const fd = new FormData();
      fd.append('ssl_id', String(editingId));
      fd.append('uuid_no', editForm.uuid_no.trim());
      fd.append('light_no', editForm.light_no.trim());
      fd.append('module_no', editForm.module_no.trim());
      fd.append('battery_serial_no', editForm.battery_serial_no.trim());
      fd.append('beneficiary_name', editForm.beneficiary_name.trim());
      fd.append('contact_no', editForm.contact_no.trim());
      fd.append('ward_no', editForm.ward_no.trim());
      fd.append('pole_no', editForm.pole_no.trim());
      fd.append('latitude', editForm.latitude.trim());
      fd.append('longitude', editForm.longitude.trim());
      if (editForm.remark.trim()) fd.append('remark', editForm.remark.trim());
      if (editFile) fd.append('light_file', editFile);

      const res = await biharSslInstallationService.updateInstalledLight(fd);
      setEditSuccessMsg(res.message || 'Details Updated Successfully');
      await loadData();
      setTimeout(() => {
        setEditModalOpen(false);
        setEditingId(null);
      }, 1200);
    } catch (err: any) {
      console.error('[Save Edit] error:', err);
      setEditErrorMsg(err.message || 'Failed to update details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export handlers
  const completedExportCols: ExportColumn<InstalledLightItem>[] = [
    { header: 'UID', accessor: (r) => r.unique_id || r.uid || `#${r.id}` },
    { header: 'State', accessor: 'state' },
    { header: 'Phase', accessor: 'phase' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => r.panchayat || r.panchyat || '—' },
    { header: 'Ward No.', accessor: 'ward_no' },
    { header: 'Pole No.', accessor: 'pole_no' },
    { header: 'Beneficiary Name', accessor: 'beneficiary_name' },
    { header: 'Contact', accessor: 'contact_no' },
    { header: 'Light No.', accessor: 'light_no' },
    { header: 'UUID No.', accessor: 'uuid_no' },
    { header: 'Battery No.', accessor: (r) => r.battery_no || r.battery_serial_no || '—' },
    { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || '—' },
    {
      header: 'Verify Status',
      accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Approved' : 'Pending'),
    },
  ];

  const paymentExportCols: ExportColumn<InstalledLightItem>[] = [
    { header: 'UID', accessor: (r) => r.unique_id || r.uid || `#${r.id}` },
    { header: 'State', accessor: 'state' },
    { header: 'Phase', accessor: 'phase' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => r.panchayat || r.panchyat || '—' },
    { header: 'Beneficiary Name', accessor: 'beneficiary_name' },
    { header: 'Contact', accessor: 'contact_no' },
    { header: 'IMEI No.', accessor: 'imei_no' },
    { header: 'Sim No.', accessor: 'sim_no' },
    { header: 'Battery No.', accessor: (r) => r.battery_no || r.battery_serial_no || '—' },
    { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || '—' },
    {
      header: 'Payment Status',
      accessor: (r) => (Number(r.inst_pay_status ?? r.payment_status) === 1 ? 'Paid' : 'Pending'),
    },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="Installation Details"
        subtitle="View installed lights and payment status for Bihar Solar Street Light sites"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh records"
            >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      }
      />

      {/* ── Summary KPI Cards ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : summary ? (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Completed Sites
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(summary.complete)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Out of {num(summary.total)} total lights
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Verified Approved
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(summary.verify_approved)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {num(summary.verify_pending)} verification pending
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Claim Applicable
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: AMBER_WARNING, marginTop: 4 }}>
              {num(summary.claim_applicable)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {num(summary.claim_raised)} claims raised
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Payment Complete
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
              {num(summary.payment_complete)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {num(summary.payment_pending)} pending payment
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Main Section with Tabs ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Tab Navigation Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Tab Switch Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${activeTab === 'Completed' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => {
                setActiveTab('Completed');
                pagination.setPage(1);
              }}
              style={{ fontWeight: 700 }}
            >
              Lights Completed ({completeLights.length})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${activeTab === 'Payment' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => {
                setActiveTab('Payment');
                pagination.setPage(1);
              }}
              style={{ fontWeight: 700 }}
            >
              Payment Lights ({paymentLights.length})
            </button>
          </div>

          {/* Search, Filter & Export */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 130, height: 36, borderRadius: 8 }}
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {activeTab === 'Completed' && (
              <select
                className="ax-input ax-input--sm"
                value={verifyFilter}
                onChange={(e) => {
                  setVerifyFilter(e.target.value);
                  pagination.setPage(1);
                }}
                style={{ minWidth: 140, height: 36, borderRadius: 8 }}
              >
                <option value="all">All Verification</option>
                <option value="1">Approved</option>
                <option value="0">Pending</option>
                <option value="2">Rejected</option>
              </select>
            )}

            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search UID, contact, pole…"
            />

            <TableExportToolbar
              onExportCSV={() => {
                if (activeTab === 'Completed') {
                  exportDataToCSV('Bihar_SSL_Completed_Lights', filtered, completedExportCols);
                } else {
                  exportDataToCSV('Bihar_SSL_Payment_Lights', filtered, paymentExportCols);
                }
              }}
              onExportExcel={() => {
                if (activeTab === 'Completed') {
                  exportDataToExcel('Bihar_SSL_Completed_Lights', filtered, completedExportCols);
                } else {
                  exportDataToExcel('Bihar_SSL_Payment_Lights', filtered, paymentExportCols);
                }
              }}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={activeTab === 'Completed' ? 14 : 12} rows={8} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            {activeTab === 'Completed' ? (
              /* Tab 1: Lights Completed Table */
              <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
                <thead>
                  <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>UID</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Phase</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>District</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Block</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panchayat</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Ward No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Pole No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Beneficiary Name</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Beneficiary Contact</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Latitude</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Longitude</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Light No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>UUID No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Battery No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panel No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Light Image</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Remark</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Verify Status</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Claim Status</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Payment Status</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 90 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.length === 0 ? (
                    <tr>
                      <td colSpan={23} style={{ padding: 40, textAlign: 'center' }}>
                        <TableEmptyState
                          title="No Completed Lights Found"
                          message={searchQuery ? `No records match "${searchQuery}"` : 'No lights marked as completed.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    pagination.paged.map((r, idx) => {
                      const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                      const imgUrl = getMediaUrl(r.light_image || r.light_file);
                      const vStatus = Number(r.inst_verify_status ?? r.verify_status);
                      const cStatus = Number(r.inst_claim_status ?? r.claim_status);
                      const pStatus = Number(r.inst_pay_status ?? r.payment_status);

                      return (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: BLUE_PRIMARY }}>
                            {r.unique_id || r.uid || `#${r.id}`}
                          </td>
                          <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.phase || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.district || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.block || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.panchayat || r.panchyat || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.ward_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.pole_no || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.beneficiary_name || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.contact_no || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.latitude || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.longitude || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.light_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.uuid_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.battery_no || r.battery_serial_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.panel_no || r.module_no || '—'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt="Light Thumbnail"
                                onClick={() => setImageModalUrl(imgUrl)}
                                style={{
                                  width: 38,
                                  height: 38,
                                  objectFit: 'cover',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  border: '1px solid #cbd5e1',
                                }}
                                title="Click to enlarge"
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remark || r.inst_remark || ''}>
                            {r.remark || r.inst_remark || '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: vStatus === 1 ? '#ecfdf5' : vStatus === 2 ? '#fef2f2' : '#fffbeb',
                                color: vStatus === 1 ? GREEN_EMERALD : vStatus === 2 ? RED_DANGER : AMBER_WARNING,
                              }}
                            >
                              {vStatus === 1 ? 'Approved' : vStatus === 2 ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: cStatus === 1 ? '#eff6ff' : '#f8fafc',
                                color: cStatus === 1 ? BLUE_PRIMARY : '#64748b',
                              }}
                            >
                              {cStatus === 1 ? 'Raised' : 'Not Raised'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: pStatus === 1 ? '#ecfdf5' : '#fffbeb',
                                color: pStatus === 1 ? GREEN_EMERALD : AMBER_WARNING,
                              }}
                            >
                              {pStatus === 1 ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => handleOpenEdit(r.id)}
                                title="Edit light details"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                onClick={() => setViewItem(r)}
                                title="View specs"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Tab 2: Payment Lights Table */
              <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
                <thead>
                  <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>UID</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Phase</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>District</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Block</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panchayat</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Ward No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Pole No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Beneficiary Name</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Beneficiary Contact</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Latitude</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Longitude</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>IMEI No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Sim No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Battery No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panel No.</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Light Image</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Remark</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.length === 0 ? (
                    <tr>
                      <td colSpan={20} style={{ padding: 40, textAlign: 'center' }}>
                        <TableEmptyState
                          title="No Payment Lights Found"
                          message={searchQuery ? `No records match "${searchQuery}"` : 'No lights marked in payment stage.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    pagination.paged.map((r, idx) => {
                      const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                      const imgUrl = getMediaUrl(r.light_image || r.light_file);
                      const pStatus = Number(r.inst_pay_status ?? r.payment_status);

                      return (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: BLUE_PRIMARY }}>
                            {r.unique_id || r.uid || `#${r.id}`}
                          </td>
                          <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.phase || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.district || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.block || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.panchayat || r.panchyat || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.ward_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.pole_no || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.beneficiary_name || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.contact_no || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.latitude || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.longitude || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.imei_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.sim_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.battery_no || r.battery_serial_no || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.panel_no || r.module_no || '—'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt="Light Thumbnail"
                                onClick={() => setImageModalUrl(imgUrl)}
                                style={{
                                  width: 38,
                                  height: 38,
                                  objectFit: 'cover',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  border: '1px solid #cbd5e1',
                                }}
                                title="Click to enlarge"
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remark || r.inst_remark || ''}>
                            {r.remark || r.inst_remark || '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: pStatus === 1 ? '#ecfdf5' : '#fffbeb',
                                color: pStatus === 1 ? GREEN_EMERALD : AMBER_WARNING,
                              }}
                            >
                              {pStatus === 1 ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <Pagination {...pagination} />
        </div>
      </section>

      {/* ── Image Light Modal ── */}
      {imageModalUrl && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#000',
              borderRadius: 12,
              maxWidth: 700,
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageModalUrl(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ✕
            </button>
            <img
              src={imageModalUrl}
              alt="Full Light Site"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* ── View Specs Modal ── */}
      {viewItem && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setViewItem(null)}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 650,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                SSL Site Details - {viewItem.unique_id || viewItem.uid || `#${viewItem.id}`}
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setViewItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 22, maxHeight: 480, overflowY: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  fontSize: 13,
                }}
              >
                {[
                  { label: 'Beneficiary', val: viewItem.beneficiary_name },
                  { label: 'Contact', val: viewItem.contact_no },
                  { label: 'District / Block', val: `${viewItem.district || '—'} / ${viewItem.block || '—'}` },
                  { label: 'Panchayat', val: viewItem.panchayat || viewItem.panchyat },
                  { label: 'Ward / Pole', val: `${viewItem.ward_no || '—'} / ${viewItem.pole_no || '—'}` },
                  { label: 'GPS (Lat, Lng)', val: `${viewItem.latitude || '—'}, ${viewItem.longitude || '—'}` },
                  { label: 'UUID No.', val: viewItem.uuid_no },
                  { label: 'Light No.', val: viewItem.light_no },
                  { label: 'Battery Serial No.', val: viewItem.battery_no || viewItem.battery_serial_no },
                  { label: 'Module / Panel No.', val: viewItem.panel_no || viewItem.module_no },
                  { label: 'Sim No.', val: viewItem.sim_no },
                  { label: 'IMEI No.', val: viewItem.imei_no },
                  { label: 'Remark', val: viewItem.remark || viewItem.inst_remark },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{item.val || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ax-modal__footer" style={{ padding: '12px 22px', borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setViewItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal (API 7 & 8) ── */}
      {editModalOpen && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => {
            if (!editSubmitting) setEditModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 750,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Edit Installed Light Details (ID: #{editingId})
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!editSubmitting) setEditModalOpen(false);
                }}
                disabled={editSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 22, maxHeight: '70vh', overflowY: 'auto' }}>
              {editSuccessMsg && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                  ✓ {editSuccessMsg}
                </div>
              )}
              {editErrorMsg && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {editErrorMsg}
                </div>
              )}

              {editLoading ? (
                <TableSkeleton rows={4} columns={2} showCard={false} />
              ) : (
                <form onSubmit={handleSaveEdit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Beneficiary Name *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.beneficiary_name}
                        onChange={(e) => setEditForm({ ...editForm, beneficiary_name: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Contact No. *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.contact_no}
                        onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Ward No. *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.ward_no}
                        onChange={(e) => setEditForm({ ...editForm, ward_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Pole No. *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.pole_no}
                        onChange={(e) => setEditForm({ ...editForm, pole_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        UUID NO *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.uuid_no}
                        onChange={(e) => setEditForm({ ...editForm, uuid_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Light Number *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.light_no}
                        onChange={(e) => setEditForm({ ...editForm, light_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Panel Number (Module No) *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.module_no}
                        onChange={(e) => setEditForm({ ...editForm, module_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Battery Number *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.battery_serial_no}
                        onChange={(e) => setEditForm({ ...editForm, battery_serial_no: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Latitude *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Longitude *
                      </label>
                      <input
                        type="text"
                        className="ax-input ax-input--sm"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        required
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Replace Light Photo (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                        style={{ fontSize: 13 }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Remarks
                      </label>
                      <textarea
                        className="ax-input"
                        rows={2}
                        value={editForm.remark}
                        onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                        style={{ width: '100%', borderRadius: 6, padding: 8 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={() => setEditModalOpen(false)}
                      disabled={editSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ax-btn ax-btn--primary ax-btn--sm"
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? 'Saving…' : 'Update Details'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;
