import { useCallback, useEffect, useMemo, useState, useDeferredValue, type FormEvent } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type SslSupplyInspectionItem,
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
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function Bihar_Installation_SSL_SupplyInspection() {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<SslSupplyInspectionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    no_of_lights: '',
    amount: '',
    remarks: '',
  });
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SslSupplyInspectionItem | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    no_of_lights: '',
    amount: '',
    remarks: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharSslInstallationService.getViewSupplyInspection();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[SupplyInspection] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered List
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return inspections.filter((item) => {
      if (q) {
        const matches =
          (item.insp_code && item.insp_code.toLowerCase().includes(q)) ||
          (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
          (item.remarks && item.remarks.toLowerCase().includes(q)) ||
          String(item.no_of_lights).includes(q) ||
          String(item.amount).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && String(item.inspection_status) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [inspections, deferredQuery, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = inspections.length;
    let totalLights = 0;
    let totalAmount = 0;
    let verifiedCount = 0;

    inspections.forEach((item) => {
      totalLights += Number(item.no_of_lights) || 0;
      totalAmount += Number(item.amount) || 0;
      if (item.inspection_status === 1 || item.verify_status === 1) verifiedCount++;
    });

    return { totalCount, totalLights, totalAmount, verifiedCount };
  }, [inspections]);

  // Pagination
  const pagination = usePagination<SslSupplyInspectionItem>({
    data: filtered,
    initialPageSize: 15,
  });

  // Handle Add Submit
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!addForm.date || !addForm.no_of_lights || !addForm.amount || !addForm.remarks.trim()) {
      setAddError('All fields marked with * are required.');
      return;
    }
    if (!addFile) {
      setAddError('Please upload an inspection file.');
      return;
    }

    setAddSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('date', addForm.date);
      fd.append('no_of_lights', addForm.no_of_lights);
      fd.append('amount', addForm.amount);
      fd.append('remarks', addForm.remarks.trim());
      fd.append('file', addFile);

      const res = await biharSslInstallationService.storeSupplyInspection(fd);
      setAddSuccess(res.message || 'Created Supply Inspection Successfully!');
      await loadData();
      setTimeout(() => {
        setAddModalOpen(false);
        setAddForm({ date: new Date().toISOString().slice(0, 10), no_of_lights: '', amount: '', remarks: '' });
        setAddFile(null);
      }, 1200);
    } catch (err: any) {
      console.error('[Add Inspection] error:', err);
      setAddError(err.message || 'Failed to create supply inspection.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: SslSupplyInspectionItem) => {
    setEditingItem(item);
    setEditForm({
      date: item.date || '',
      no_of_lights: String(item.no_of_lights || ''),
      amount: String(item.amount || ''),
      remarks: item.remarks || '',
    });
    setEditFile(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditError(null);
    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('date', editForm.date);
      fd.append('no_of_lights', editForm.no_of_lights);
      fd.append('amount', editForm.amount);
      fd.append('remarks', editForm.remarks.trim());
      if (editFile) fd.append('file', editFile);

      await biharSslInstallationService.updateSupplyInspection(editingItem.id, fd);
      await loadData();
      setEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('[Edit Inspection] error:', err);
      setEditError(err.message || 'Failed to update supply inspection.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslSupplyInspectionItem>[] = [
    { header: 'Insp Code', accessor: 'insp_code' },
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || '—' },
    { header: 'Date', accessor: 'date' },
    { header: 'No. of Lights', accessor: 'no_of_lights' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Remarks', accessor: 'remarks' },
    {
      header: 'Inspection Status',
      accessor: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Verify Status',
      accessor: (r) => (r.verify_status === 1 ? 'Verified' : 'Pending'),
    },
    { header: 'Verify Remarks', accessor: 'verify_remarks' },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="View SSL Supply Inspection"
        subtitle="Manage and monitor Bihar Solar Street Light material delivery inspection records"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Supply Inspection' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setAddError(null);
                setAddSuccess(null);
                setAddModalOpen(true);
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1={12} y1={5} x2={12} y2={19} />
                <line x1={5} y1={12} x2={19} y2={12} />
              </svg>
              <span>Add Supply Inspection</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh inspections"
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

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Total Inspections
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Delivery batches recorded
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Inspected Lights
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.totalLights)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Total quantity supplied
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Inspected Amount
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {cur(metrics.totalAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Cumulative supply valuation
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Verified Status
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.verifiedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Approved supply inspections
            </div>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('all'); pagination.setPage(1); }}
            >
              All ({inspections.length})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('1'); pagination.setPage(1); }}
            >
              Approved ({metrics.verifiedCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '0' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('0'); pagination.setPage(1); }}
            >
              Pending ({inspections.length - metrics.verifiedCount})
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search code, remarks…"
            />
            <TableExportToolbar
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={12} rows={6} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Vendor Name</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>No of Lights</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Inspection Remark</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>File</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Inspection Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Verify Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Verify Remarks</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Supply Inspection Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No supply inspections recorded yet.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.page - 1) * pagination.pageSize + idx + 1;
                    const fileUrl = getMediaUrl(r.file);
                    const isApproved = r.inspection_status === 1;

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor_name || r.vendor || 'App Testing'}
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.no_of_lights)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {cur(r.amount)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remarks || ''}>
                          {r.remarks || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: BLUE_PRIMARY }}
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>Doc</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isApproved ? '#ecfdf5' : '#fffbeb',
                              color: isApproved ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {isApproved ? 'Approved' : 'Pending'}
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
                              background: r.verify_status === 1 ? '#ecfdf5' : '#f8fafc',
                              color: r.verify_status === 1 ? GREEN_EMERALD : '#64748b',
                            }}
                          >
                            {r.verify_status === 1 ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.verify_remarks || ''}>
                          {r.verify_remarks || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => handleOpenEdit(r)}
                            title="Edit inspection"
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
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <Pagination {...pagination} />
        </div>
      </section>

      {/* ── Add Supply Inspection Modal ── */}
      {addModalOpen && (
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
            if (!addSubmitting) setAddModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 550,
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
                Add SSL Supply Inspection
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!addSubmitting) setAddModalOpen(false);
                }}
                disabled={addSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 22 }}>
              {addSuccess && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                  ✓ {addSuccess}
                </div>
              )}
              {addError && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Inspection Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="ax-input"
                      value={addForm.date}
                      onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Number of Lights <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="ax-input"
                      placeholder="e.g. 50"
                      value={addForm.no_of_lights}
                      onChange={(e) => setAddForm({ ...addForm, no_of_lights: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="ax-input"
                      placeholder="e.g. 120000.00"
                      value={addForm.amount}
                      onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Inspection Document (File) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                      required
                      style={{ fontSize: 13 }}
                    />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      Allowed formats: jpg, jpeg, png, webp, pdf (Max 5 MB)
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Remarks <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      className="ax-input"
                      rows={3}
                      placeholder="Enter inspection remarks…"
                      value={addForm.remarks}
                      onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                      required
                      style={{ width: '100%', borderRadius: 8, padding: 10 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setAddModalOpen(false)}
                    disabled={addSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={addSubmitting}
                  >
                    {addSubmitting ? 'Submitting…' : 'Save Inspection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Supply Inspection Modal ── */}
      {editModalOpen && editingItem && (
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
              maxWidth: 550,
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
                Edit Supply Inspection (#{editingItem.id})
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

            <div className="ax-modal__body" style={{ padding: 22 }}>
              {editError && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Inspection Date *
                    </label>
                    <input
                      type="date"
                      className="ax-input"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Number of Lights *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="ax-input"
                      value={editForm.no_of_lights}
                      onChange={(e) => setEditForm({ ...editForm, no_of_lights: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="ax-input"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Replace Document File (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Remarks *
                    </label>
                    <textarea
                      className="ax-input"
                      rows={3}
                      value={editForm.remarks}
                      onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                      required
                      style={{ width: '100%', borderRadius: 8, padding: 10 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Updating…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_SupplyInspection;
