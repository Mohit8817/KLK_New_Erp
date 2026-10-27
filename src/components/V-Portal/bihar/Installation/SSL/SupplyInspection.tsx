import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type FormEvent } from 'react';
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
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const RED_DANGER = '#ef4444';

const ICON_CLIPBOARD = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);
const ICON_LIGHTS = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);
const ICON_RUPEE = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);
const ICON_VERIFIED = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);


const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const MODAL_FIELD_STYLES = `
  .ax-modern-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ax-modern-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em;
    margin: 0;
  }
  .ax-modern-req {
    color: #ef4444;
    font-weight: 700;
    margin-left: 3px;
  }
  .ax-modern-input-wrap {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px;
    background: var(--ax-surface-solid, #ffffff);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  .ax-modern-input-wrap:focus-within {
    border-color: var(--ax-accent, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #3b82f6) 18%, transparent);
  }
  .ax-modern-addon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 13px;
    height: 42px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-right: 1.5px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text-muted, #64748b);
    font-size: 14px;
    font-weight: 700;
    user-select: none;
  }
  .ax-modern-input {
    width: 100%;
    height: 42px;
    padding: 0 14px;
    border: none;
    outline: none;
    font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a);
    background: transparent;
  }
  .ax-modern-input::placeholder {
    color: var(--ax-text-muted, #94a3b8);
  }
  .ax-modern-textarea {
    width: 100%;
    min-height: 90px;
    padding: 10px 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px;
    font-size: 13px;
    color: var(--ax-text-strong, #0f172a);
    background: var(--ax-surface-solid, #ffffff);
    outline: none;
    transition: all 0.2s ease;
    resize: vertical;
    line-height: 1.5;
  }
  .ax-modern-textarea:focus {
    border-color: var(--ax-accent, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #3b82f6) 18%, transparent);
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px;
    padding: 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #3b82f6);
    background: color-mix(in srgb, var(--ax-accent, #3b82f6) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #3b82f6) 10%, #ffffff);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ax-modern-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 540px) {
    .ax-modern-grid-2 {
      grid-template-columns: 1fr;
    }
  }
`;

export function Bihar_Installation_SSL_SupplyInspection() {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<SslSupplyInspectionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const addFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37, 99, 235, 0.12)', color: BLUE_PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_CLIPBOARD}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Total Inspections
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Delivery batches recorded
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.14)', color: GREEN_EMERALD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_LIGHTS}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Inspected Lights
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.totalLights)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Total quantity supplied
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(100, 116, 139, 0.12)', color: 'var(--ax-text-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_RUPEE}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Inspected Amount
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {cur(metrics.totalAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Cumulative supply valuation
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.14)', color: GREEN_EMERALD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_VERIFIED}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Verified Status
              </span>
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
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            >
              All ({inspections.length})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('1'); setCurrentPage(1); }}
            >
              Approved ({metrics.verifiedCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '0' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('0'); setCurrentPage(1); }}
            >
              Pending ({inspections.length - metrics.verifiedCount})
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search code, remarks…"
              size="sm"
              ariaLabel="Search supply inspections"
            />
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
              onExportPDF={() => printTableData('Bihar SSL Supply Inspections', filtered, exportCols)}
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
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Supply Inspection Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No supply inspections recorded yet.'}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((r, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
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
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

            <style>{MODAL_FIELD_STYLES}</style>

      {/* ── Add Supply Inspection Modal ── */}
      {addModalOpen && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
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
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--ax-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Add SSL Supply Inspection
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Record materials inspection and delivery verification
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  if (!addSubmitting) setAddModalOpen(false);
                }}
                disabled={addSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24 }}>
              {addSuccess && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600, border: '1px solid #a7f3d0' }}>
                  ✓ {addSuccess}
                </div>
              )}
              {addError && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ⚠ {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Two column: Date & Number of Lights */}
                  <div className="ax-modern-grid-2">
                    <div className="ax-modern-field">
                      <label className="ax-modern-label" htmlFor="si-date">
                        <span>Inspection Date</span>
                        <span className="ax-modern-req">*</span>
                      </label>
                      <div className="ax-modern-input-wrap">
                        <span className="ax-modern-addon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <input
                          id="si-date"
                          type="date"
                          className="ax-modern-input"
                          value={addForm.date}
                          onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="ax-modern-field">
                      <label className="ax-modern-label" htmlFor="si-lights">
                        <span>Number of Lights</span>
                        <span className="ax-modern-req">*</span>
                      </label>
                      <div className="ax-modern-input-wrap">
                        <span className="ax-modern-addon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                            <line x1="9" y1="18" x2="15" y2="18" />
                            <line x1="10" y1="22" x2="14" y2="22" />
                            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                          </svg>
                        </span>
                        <input
                          id="si-lights"
                          type="number"
                          min="1"
                          className="ax-modern-input"
                          placeholder="e.g. 50"
                          value={addForm.no_of_lights}
                          onChange={(e) => setAddForm({ ...addForm, no_of_lights: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amount Field */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="si-amount">
                      <span>Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="si-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        placeholder="e.g. 120000.00"
                        value={addForm.amount}
                        onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Inspection Document (File)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      ref={addFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                    />
                    {!addFile ? (
                      <div
                        className="ax-modern-dropzone"
                        onClick={() => addFileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ax-modern-dropzone__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--ax-primary, #3b82f6)' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload inspection file
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ax-modern-file-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span className="ax-modern-file-chip__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {addFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(addFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setAddFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="si-remarks">
                      <span>Remarks</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <textarea
                      id="si-remarks"
                      className="ax-modern-textarea"
                      rows={3}
                      placeholder="Enter inspection remarks…"
                      value={addForm.remarks}
                      onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
            backdropFilter: 'blur(6px)',
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
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--ax-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Edit Supply Inspection (#{editingItem.id})
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Update inspection figures or replace document
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  if (!editSubmitting) setEditModalOpen(false);
                }}
                disabled={editSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24 }}>
              {editError && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ⚠ {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Two column: Date & Number of Lights */}
                  <div className="ax-modern-grid-2">
                    <div className="ax-modern-field">
                      <label className="ax-modern-label" htmlFor="esi-date">
                        <span>Inspection Date</span>
                        <span className="ax-modern-req">*</span>
                      </label>
                      <div className="ax-modern-input-wrap">
                        <span className="ax-modern-addon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <input
                          id="esi-date"
                          type="date"
                          className="ax-modern-input"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="ax-modern-field">
                      <label className="ax-modern-label" htmlFor="esi-lights">
                        <span>Number of Lights</span>
                        <span className="ax-modern-req">*</span>
                      </label>
                      <div className="ax-modern-input-wrap">
                        <span className="ax-modern-addon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                            <line x1="9" y1="18" x2="15" y2="18" />
                            <line x1="10" y1="22" x2="14" y2="22" />
                            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                          </svg>
                        </span>
                        <input
                          id="esi-lights"
                          type="number"
                          min="1"
                          className="ax-modern-input"
                          value={editForm.no_of_lights}
                          onChange={(e) => setEditForm({ ...editForm, no_of_lights: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amount Field */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="esi-amount">
                      <span>Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="esi-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="ax-modern-field">
                    <div className="ax-modern-label">
                      <span>Replace Document File</span>
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>(Optional)</span>
                    </div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    />
                    {!editFile ? (
                      <div
                        className="ax-modern-dropzone"
                        onClick={() => editFileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ax-modern-dropzone__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--ax-primary, #3b82f6)' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload replacement document
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ax-modern-file-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span className="ax-modern-file-chip__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {editFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(editFile.size / 1024).toFixed(1)} KB (New file)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setEditFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="esi-remarks">
                      <span>Remarks</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <textarea
                      id="esi-remarks"
                      className="ax-modern-textarea"
                      rows={3}
                      value={editForm.remarks}
                      onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
