import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  type SslSupplyInspectionItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Responsive page CSS (exact Bihar reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

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
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

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

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharSslInstallationService.getViewSupplyInspection();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[SupplyInspection] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load supply inspection records.' });
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
          (item.vendor && item.vendor.toLowerCase().includes(q)) ||
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

  // Universal Pagination with 100 items by default
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, setPage]);

  const hasFilters = searchQuery.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns
  const exportCols: ExportColumn<SslSupplyInspectionItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SslSupplyInspectionItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || DASH },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'Date', accessor: (r) => r.date || DASH },
      { header: 'No. of Lights', accessor: (r) => String(r.no_of_lights || 0) },
      { header: 'Amount', accessor: (r) => String(r.amount || 0) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      {
        header: 'Inspection Status',
        accessor: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) => (r.verify_status === 1 ? 'Verified' : 'Pending'),
      },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_SSL_Supply_Inspections';
  const fileTitle = 'Bihar SSL Supply Inspection Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

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
      setToastMsg({ type: 'success', text: 'Created Supply Inspection Successfully!' });
      await loadData();
      setTimeout(() => {
        setAddModalOpen(false);
        setAddForm({ date: new Date().toISOString().slice(0, 10), no_of_lights: '', amount: '', remarks: '' });
        setAddFile(null);
      }, 1000);
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
      setToastMsg({ type: 'success', text: 'Supply inspection updated successfully!' });
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

  const HEADERS = [
    'Sr. No.',
    'Vendor Name',
    'State',
    'Date',
    'No of Lights',
    'Amount',
    'Inspection Remark',
    'File',
    'Inspection Status',
    'Verify Status',
    'Verify Remarks',
    'Action',
  ];
  const TOTAL_COLUMNS = HEADERS.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{MODAL_FIELD_STYLES}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Supply Inspection"
        subtitle="Manage and monitor Bihar Solar Street Light material delivery inspection records"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Supply Inspection' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
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

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Inspections"
          value={num(metrics.totalCount)}
          sub="Delivery batches recorded"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 12h6M9 16h6" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Inspected Lights"
          value={num(metrics.totalLights)}
          sub="Total quantity supplied"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Inspected Amount"
          value={cur(metrics.totalAmount)}
          sub="Cumulative supply valuation"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Verified Status"
          value={num(metrics.verifiedCount)}
          sub="Approved supply inspections"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />
      </div>

      {/* ── Status Tabs ABOVE Table (per requirement) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Supply inspection status tabs" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">All ({inspections.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === '1'}
            className={`ax-btn ax-btn--sm ${statusFilter === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('1');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">Approved ({metrics.verifiedCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === '0'}
            className={`ax-btn ax-btn--sm ${statusFilter === '0' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('0');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">Pending ({inspections.length - metrics.verifiedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Main Table Card (exact reference design) ── */}
      <section className="ax-card ax-col--12" id="ssl-supply-inspect-tabpanel" role="tabpanel" aria-label="Supply Inspection">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Supply Inspection Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{inspections.length}</span> inspections
              {' '}· Total Lights <b className="ax-num">{num(metrics.totalLights)}</b> · Verified <b className="ax-num">{num(metrics.verifiedCount)}</b> · Total Amount <b className="ax-num">{cur(metrics.totalAmount)}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search code, vendor, remarks…"
                size="sm"
                ariaLabel="Search supply inspections"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: 1200 }}
          >
            <caption className="ax-visually-hidden">Completed Supply Inspection Data</caption>
            <thead className="ax-table__head">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action' || h === 'File' || h === 'Inspection Status' || h === 'Verify Status'
                        ? { textAlign: 'center' }
                        : h === 'No of Lights' || h === 'Amount'
                        ? { textAlign: 'right' }
                        : undefined
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading supply inspections from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No supply inspection found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'No supply inspections recorded yet.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, index) => {
                  const fileUrl = getMediaUrl(r.file);
                  const isApproved = r.inspection_status === 1;

                  return (
                    <tr key={r.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {r.vendor_name || r.vendor || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {num(r.no_of_lights)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {cur(r.amount)}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }} title={r.remarks || ''}>
                        {r.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--asw-primary)' }}
                            title="View inspection document"
                          >
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span>Doc</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Badge tone={isApproved ? 'success' : 'warning'}>
                          {isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Badge tone={r.verify_status === 1 ? 'success' : 'neutral'}>
                          {r.verify_status === 1 ? 'Verified' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.verify_remarks || ''}>
                        {r.verify_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
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
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
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
                  ✕ {addError}
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--asw-primary)' }}>
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
                  ✕ {editError}
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--asw-primary)' }}>
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