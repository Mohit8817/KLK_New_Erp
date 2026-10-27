<<<<<<< HEAD
﻿import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type FormEvent } from 'react';
=======
import { useCallback, useEffect, useMemo, useState, useDeferredValue, type CSSProperties, type FormEvent, type ReactNode } from 'react';
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
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
<<<<<<< HEAD
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
=======
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Colors & Helpers ── */
const DASH = '—';
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

type KpiTone = 'blue' | 'cyan' | 'emerald' | 'amber';

const KPI_TONE: Record<KpiTone, { bg: string; fg: string }> = {
  blue: { bg: 'color-mix(in srgb, var(--ax-accent, #2563eb) 12%, transparent)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in srgb, #06b6d4 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in srgb, #10b981 14%, transparent)', fg: '#059669' },
  amber: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', fg: '#d97706' },
};

/* ── ULA Page & Table Styling ── */
const PAGE_CSS = `
  .solar-erp-page { --bsv-card-radius: var(--ax-radius-lg); --ula-accent: var(--ax-accent, #2563eb); }
  .solar-erp-page .ax-dash-grid { align-items: stretch; gap: var(--ax-space-4); margin-bottom: var(--ax-space-5); }
  .solar-erp-page .bsv-kpi {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--ax-border);
    border-radius: var(--bsv-card-radius);
    background: var(--ax-bg-surface, var(--ax-surface-solid));
    box-shadow: var(--ax-shadow-sm);
    transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
  }
  .solar-erp-page .bsv-kpi:hover {
    box-shadow: var(--ax-shadow-md);
    border-color: var(--ax-border);
    transform: translateY(-1px);
  }
  .solar-erp-page .bsv-kpi__body {
    height: 100%;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .solar-erp-page .bsv-kpi__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--ax-radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .solar-erp-page .bsv-kpi__icon svg { width: 16px; height: 16px; }
  .solar-erp-page .bsv-kpi__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__caption {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.35;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__value {
    font-family: var(--ax-font-display);
    font-size: 1.35rem;
    line-height: 1.1;
    font-weight: 700;
    color: var(--ax-text-strong);
    font-variant-numeric: tabular-nums;
  }
  .solar-erp-page .bsv-kpi__unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted);
  }

  /* Table Card */
  .solar-erp-page .ax-card {
    min-width: 0;
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: var(--ax-shadow-sm, 0 2px 8px rgba(15,23,42,.04));
    overflow: hidden;
    background: var(--ax-surface-solid, #fff);
  }
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 180px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title {
    font-size: var(--ax-text-lg, 17px);
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    margin: 0;
  }
  .solar-erp-page .ax-card__subtitle {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Table */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 1600px; white-space: nowrap; }
  .solar-erp-page .ax-table { border-collapse: separate; border-spacing: 0; }
  .solar-erp-page .ax-table__th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: var(--ax-text-muted, #64748b);
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    white-space: nowrap;
  }
  .solar-erp-page .ax-table__td {
    padding: 11px 14px;
    vertical-align: middle;
    font-size: var(--ax-text-sm, 13px);
    border-bottom: 1px solid var(--ax-border-subtle, #edf2f7);
  }
  .solar-erp-page .ax-table__row:last-child .ax-table__td { border-bottom: 0; }
  .solar-erp-page .ax-table--hover .ax-table__row:hover .ax-table__td {
    background: color-mix(in srgb, var(--ula-accent) 4%, var(--ax-surface-solid, #fff));
  }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-surface-solid, #fff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-sticky-first th:first-child {
    z-index: 3;
    background: var(--ax-surface-subtle, #f8fafc);
  }

  /* Left-aligned ULA Pagination */
  .solar-erp-page .ax-card__footer {
    width: 100%;
    box-sizing: border-box;
    background: var(--ax-surface-subtle, #f8fafc);
    padding: 10px 16px;
    border-top: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Modal */
  .solar-erp-page .ax-modal {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: 0 24px 70px rgba(15,23,42,.2);
    overflow: hidden;
  }
  .solar-erp-page .ax-modal__header {
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
`;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_EDIT = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

function MetricKpiCard({
  icon,
  tone,
  label,
  value,
  unit,
  sub,
  badge,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  badge: string;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className="bsv-kpi ax-col--3" role="region" aria-label={label}>
      <div className="bsv-kpi__body">
        <div className="bsv-kpi__head">
          <div className="bsv-kpi__title-wrap">
            <span className="bsv-kpi__icon" style={{ background: t.bg, color: t.fg }}>
              <svg {...ICON_PROPS}>{icon}</svg>
            </span>
            <span className="bsv-kpi__label">{label}</span>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
          </div>
          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{badge}</span>
        </div>
<<<<<<< HEAD
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
=======
        <div className="bsv-kpi__value-row">
          <span className="bsv-kpi__value">{value}</span>
          {unit && <span className="bsv-kpi__unit">{unit}</span>}
        </div>
        <div className="bsv-kpi__caption">{sub}</div>
      </div>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
    </div>
  );
}

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

  // Pagination hook
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

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
      }, 1000);
    } catch (err: any) {
      console.error('[Add Supply Inspection] error:', err);
      setAddError(err.message || 'Failed to submit supply inspection.');
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
      fd.append('id', String(editingItem.id));
      fd.append('date', editForm.date);
      fd.append('no_of_lights', editForm.no_of_lights);
      fd.append('amount', editForm.amount);
      fd.append('remarks', editForm.remarks.trim());
      if (editFile) fd.append('file', editFile);

      await biharSslInstallationService.updateSupplyInspection(fd);
      await loadData();
      setEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('[Edit Supply Inspection] error:', err);
      setEditError(err.message || 'Failed to update supply inspection.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslSupplyInspectionItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || DASH },
    { header: 'State', accessor: (r) => r.state || 'Bihar' },
    { header: 'Date', accessor: 'date' },
    { header: 'No of Lights', accessor: 'no_of_lights' },
    { header: 'Amount', accessor: (r) => cur(r.amount) },
    { header: 'Inspection Remark', accessor: 'remarks' },
    {
      header: 'Inspection Status',
      accessor: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Verify Status',
      accessor: (r) => (r.verify_status === 1 ? 'Approved' : 'Pending'),
    },
    { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
  ];

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV('Bihar_SSL_Supply_Inspection', filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel('Bihar_SSL_Supply_Inspection', filtered, exportCols);
  const handleExportPDF = () => printTableData('Bihar SSL Supply Inspection', filtered, exportCols);

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Supply Inspection"
        subtitle="Track material delivery inspection requests, verify status, and audit reports"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
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
              {ICON_PLUS}
              <span className="ax-btn__label">Add Supply Inspection</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh list"
            >
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid">
          <MetricKpiCard
            icon={
              <>
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </>
            }
            tone="blue"
            label="Total Supply Inspections"
            value={metrics.totalCount}
            sub="Material batches raised"
            badge="All Batches"
          />

          <MetricKpiCard
            icon={
              <>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </>
            }
            tone="cyan"
            label="Total Inspected Lights"
            value={num(metrics.totalLights)}
            unit="lights"
            sub="Cumulative light points"
            badge="Supply"
          />

          <MetricKpiCard
            icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
            tone="emerald"
            label="Cumulative Amount"
            value={cur(metrics.totalAmount)}
            sub="Supply invoice value"
            badge="Invoice"
          />

          <MetricKpiCard
            icon={
              <>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </>
            }
            tone="amber"
            label="Verified Inspections"
            value={metrics.verifiedCount}
            unit="passed"
            sub="Confirmed material supply"
            badge="Verified"
          />
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SSL Supply Inspection</h2>
            <p className="ax-card__subtitle" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {inspections.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            {/* Status Filter */}
            <select
              className="ax-input ax-input--sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
            >
              <option value="all">All Status</option>
              <option value="1">Approved</option>
              <option value="0">Pending</option>
            </select>

            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, remarks, amount…"
              ariaLabel="Search inspections"
            />

            {/* Export Toolbar */}
            <TableExportToolbar
              onCopy={handleCopy}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={12} rows={8} showCard={false} />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            title="No Data Available in Table"
            message={
              searchQuery || statusFilter !== 'all'
                ? 'No supply inspection records match your filters.'
                : 'No supply inspections recorded yet. Click "Add Supply Inspection" to create one.'
            }
            onClear={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            clearLabel="Reset Filters"
          />
        ) : (
          <>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
                <caption className="ax-visually-hidden">View SSL Supply Inspection</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 50 }}>
                      Sr. No.
                    </th>
                    <th className="ax-table__th" scope="col">
                      Vendor Name
                    </th>
                    <th className="ax-table__th" scope="col">
                      State
                    </th>
                    <th className="ax-table__th" scope="col">
                      Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      No of Lights
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Amount
                    </th>
                    <th className="ax-table__th" scope="col">
                      Inspection Remark
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      File
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Inspection Status
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Verify Status
                    </th>
                    <th className="ax-table__th" scope="col">
                      Verify Remarks
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.map((item, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isInspApproved = item.inspection_status === 1;
                    const isVerifyApproved = item.verify_status === 1;
                    const fileUrl = getMediaUrl(item.file);

                    return (
                      <tr key={item.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {rowNum}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}
                        >
                          {item.vendor_name || DASH}
                        </td>
                        <td className="ax-table__td">{item.state || 'Bihar'}</td>
                        <td className="ax-table__td">{item.date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                            {item.no_of_lights ? `${item.no_of_lights} Lights` : DASH}
                          </span>
                        </td>
                        <td
                          className="ax-table__td"
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            fontFamily: 'var(--ax-font-mono)',
                            color: 'var(--ax-text-strong)',
                          }}
                        >
                          {cur(item.amount)}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.remarks || undefined}
                        >
                          {item.remarks || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-badge ax-badge--soft ax-badge--neutral"
                              style={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                              View File ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isInspApproved ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isInspApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isVerifyApproved ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isVerifyApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.verify_remarks || undefined}
                        >
                          {item.verify_remarks || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Inspection"
                            style={{ gap: 4 }}
                          >
                            {ICON_EDIT}
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left-aligned ULA Pagination */}
            <div className="ax-card__footer">
              <div className="ula-pagination-left">
                <Pagination
                  currentPage={pagination.curPage}
                  totalItems={filtered.length}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Add Supply Inspection Modal ── */}
      {addModalOpen && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !addSubmitting && setAddModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 520 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Add SSL Supply Inspection</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setAddModalOpen(false)}
                disabled={addSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="ax-modal__body">
                {addError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{addError}</div>
                  </div>
                )}
                {addSuccess && (
                  <div className="ax-alert ax-alert--success" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{addSuccess}</div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Inspection Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="ax-input"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Number of Lights <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="ax-input"
                    value={addForm.no_of_lights}
                    onChange={(e) => setAddForm({ ...addForm, no_of_lights: e.target.value })}
                    placeholder="Enter number of lights"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-input"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    placeholder="Enter inspection value"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Inspection Remarks <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="ax-input"
                    rows={3}
                    value={addForm.remarks}
                    onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                    placeholder="Enter remarks..."
                    style={{ width: '100%', borderRadius: 8, resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Inspection Report File (PDF/Image) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                    className="ax-input"
                    style={{ width: '100%', height: 40 }}
                    required
                  />
                </div>
              </div>

              <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setAddModalOpen(false)}
                  disabled={addSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={addSubmitting}>
                  {addSubmitting ? 'Submitting…' : 'Submit Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Supply Inspection Modal ── */}
      {editModalOpen && editingItem && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !editSubmitting && setEditModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 500 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Edit Supply Inspection #{editingItem.id}</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="ax-modal__body">
                {editError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{editError}</div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    className="ax-input"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Number of Lights
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="ax-input"
                    value={editForm.no_of_lights}
                    onChange={(e) => setEditForm({ ...editForm, no_of_lights: e.target.value })}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-input"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Remarks
                  </label>
                  <textarea
                    className="ax-input"
                    rows={3}
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    style={{ width: '100%', borderRadius: 8, resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Update File (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="ax-input"
                    style={{ width: '100%', height: 40 }}
                  />
                </div>
              </div>

              <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Updating…' : 'Update Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_SupplyInspection;
