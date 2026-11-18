import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../shell/PageHead';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../common';
import {
  vendorOperationsService,
  type VendorComplaintItem,
} from './vendorOperationsService';

type BifurcationTab = 'all' | 'open' | 'assigned' | 'closed';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1024px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-pill-btn.active {
    background: var(--ax-accent, #2563eb) !important;
    color: #ffffff !important;
    border-color: transparent !important;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25) !important;
  }
  .solar-erp-page .asw-pill-badge {
    padding: 1px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.08);
  }
  .solar-erp-page .asw-pill-btn.active .asw-pill-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
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

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component ── */
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

export function VendorComplaintView() {
  const [complaints, setComplaints] = useState<VendorComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BifurcationTab>('all');
  const [selectedComplaintForView, setSelectedComplaintForView] = useState<VendorComplaintItem | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorOperationsService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleUpdateStatus = async (id: number, status: 'Open' | 'Assigned' | 'Closed', assigned_to?: string) => {
    try {
      const patch: Partial<VendorComplaintItem> = { status };
      if (assigned_to) patch.assigned_to = assigned_to;
      await vendorOperationsService.updateComplaint(id, patch);
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
      if (selectedComplaintForView && selectedComplaintForView.id === id) {
        setSelectedComplaintForView((prev) => (prev ? { ...prev, ...patch } : null));
      }
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    }
  };

  // Tab Filtering & Search Filtering
  const filteredComplaints = useMemo(() => {
    let list = complaints;
    if (activeTab === 'open') {
      list = list.filter((c) => c.status === 'Open');
    } else if (activeTab === 'assigned') {
      list = list.filter((c) => c.status === 'Assigned');
    } else if (activeTab === 'closed') {
      list = list.filter((c) => c.status === 'Closed');
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
      (c.complaint && c.complaint.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.site && c.site.toLowerCase().includes(q)) ||
      (c.workorder && c.workorder.toLowerCase().includes(q))
    );
  }, [complaints, activeTab, searchQuery]);

  const pagination = usePagination(filteredComplaints, { initialPageSize: 100 });

  const kpis = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === 'Open').length;
    const assigned = complaints.filter((c) => c.status === 'Assigned').length;
    const closed = complaints.filter((c) => c.status === 'Closed').length;
    return { total, open, assigned, closed };
  }, [complaints]);

  const exportCols: ExportColumn<VendorComplaintItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: VendorComplaintItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Complaint ID', accessor: (r) => r.complaint_id },
      { header: 'Date', accessor: (r) => r.complaint_date },
      { header: 'Complaint', accessor: (r) => r.complaint },
      { header: 'State', accessor: (r) => r.state },
      { header: 'Complainant', accessor: (r) => r.name },
      { header: 'Mobile', accessor: (r) => r.mobile },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Location', accessor: (r) => r.location },
      { header: 'Site', accessor: (r) => r.site },
      { header: 'Work Order', accessor: (r) => r.workorder },
      { header: 'Created By', accessor: (r) => r.created_by },
      { header: 'Assigned To', accessor: (r) => r.assigned_to || '—' },
      { header: 'Status', accessor: (r) => r.status },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Vendor_Complaints_Log';
  const fileTitle = 'Vendor Grievances and Site Complaints Register';

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
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
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
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Header */}
      <PageHead
        title="Vendor & Site Complaints"
        subtitle="Manage field issue escalation, customer grievances, technician allocations and resolutions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Vendor Grievance & Complaints' },
        ]}
      />

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Complaints"
          value={kpis.total}
          sub="Registered grievance cases"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <KpiCard
          tone="amber"
          label="Open Issues"
          value={kpis.open}
          sub="Pending initial review"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
        <KpiCard
          tone="cyan"
          label="Assigned Complaints"
          value={kpis.assigned}
          sub="Field tech in progress"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald"
          label="Closed / Resolved"
          value={kpis.closed}
          sub="Verified and completed"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Status Filter:</span>
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            pagination.setPage(1);
          }}
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Complaints <span className="asw-pill-badge">{kpis.total}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('open');
            pagination.setPage(1);
          }}
          className={`asw-pill-btn ${activeTab === 'open' ? 'active' : ''}`}
        >
          Open <span className="asw-pill-badge">{kpis.open}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('assigned');
            pagination.setPage(1);
          }}
          className={`asw-pill-btn ${activeTab === 'assigned' ? 'active' : ''}`}
        >
          Assigned Complaints <span className="asw-pill-badge">{kpis.assigned}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('closed');
            pagination.setPage(1);
          }}
          className={`asw-pill-btn ${activeTab === 'closed' ? 'active' : ''}`}
        >
          Closed <span className="asw-pill-badge">{kpis.closed}</span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Complaints & Grievances Register</h2>
            <p className="ax-card__subtitle">
              Showing {filteredComplaints.length} ticket{filteredComplaints.length === 1 ? '' : 's'} under {activeTab === 'all' ? 'all categories' : activeTab}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search ticket, name, phone, district..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredComplaints, exportCols)}
                onExportCSV={() => exportToCSV(filteredComplaints, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredComplaints, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredComplaints, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1450 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: '48px', textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Complaint ID</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Description</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Complainant Name</th>
                <th className="ax-table__th">Mobile</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Location / Site</th>
                <th className="ax-table__th">Work Order</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Document</th>
                <th className="ax-table__th">Assigned To</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: '130px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading complaints...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <TableEmptyState
                      title="No complaints found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No complaints registered under this status.'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((c, index) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + index + 1;
                  const isOpen = c.status === 'Open';
                  const isAssigned = c.status === 'Assigned';

                  return (
                    <tr key={c.id}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {globalIdx}
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>
                          {c.complaint_id}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>{c.complaint_date}</span>
                      </td>
                      <td className="ax-table__td">
                        <div
                          style={{
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--ax-text, #0f172a)',
                          }}
                          title={c.complaint}
                        >
                          {c.complaint}
                        </div>
                      </td>
                      <td className="ax-table__td">{c.state}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{c.mobile}</div>
                      </td>
                      <td className="ax-table__td">{c.district}</td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '12px' }}>{c.location}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>Site: {c.site}</div>
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>{c.workorder}</span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {c.document ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            File
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{c.assigned_to || 'Unassigned'}</div>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            isOpen ? 'ax-badge--danger' : isAssigned ? 'ax-badge--info' : 'ax-badge--success'
                          }`}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: isOpen ? '#fef2f2' : isAssigned ? '#eff6ff' : '#ecfdf5',
                            color: isOpen ? '#dc2626' : isAssigned ? '#1d4ed8' : '#047857',
                            border: `1px solid ${isOpen ? '#fecaca' : isAssigned ? '#bfdbfe' : '#a7f3d0'}`,
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => setSelectedComplaintForView(c)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            View
                          </button>
                          {isOpen && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleUpdateStatus(c.id, 'Assigned', 'Senior Field Tech')}
                              title="Assign to Field Engineer"
                              style={{
                                padding: '4px 6px',
                                fontSize: '11px',
                              }}
                            >
                              Assign
                            </button>
                          )}
                          {isAssigned && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleUpdateStatus(c.id, 'Closed')}
                              title="Resolve & Close"
                              style={{
                                padding: '4px 6px',
                                fontSize: '11px',
                                color: '#16a34a',
                              }}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Left Aligned Pagination in Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Complaint Details Modal ── */}
      <Modal
        open={Boolean(selectedComplaintForView)}
        onClose={() => setSelectedComplaintForView(null)}
        title="Grievance Ticket Overview"
        subtitle={selectedComplaintForView ? `${selectedComplaintForView.complaint_id} • ${selectedComplaintForView.workorder}` : ''}
        maxWidth={640}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedComplaintForView && selectedComplaintForView.status !== 'Closed' && (
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => handleUpdateStatus(selectedComplaintForView.id, 'Closed')}
                style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}
              >
                Mark as Resolved
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => setSelectedComplaintForView(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedComplaintForView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>ISSUE STATEMENT</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginTop: '2px' }}>
                {selectedComplaintForView.complaint}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>COMPLAINANT</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedComplaintForView.name}</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Phone: {selectedComplaintForView.mobile}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Created by: {selectedComplaintForView.created_by}</div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SITE LOCATION</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedComplaintForView.location}</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>District: {selectedComplaintForView.district}, {selectedComplaintForView.state}</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>Site: {selectedComplaintForView.site}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ASSIGNED ENGINEER: </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedComplaintForView.assigned_to || 'Not assigned yet'}
                </span>
              </div>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CURRENT STATUS: </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: selectedComplaintForView.status === 'Closed' ? '#16a34a' : '#2563eb' }}>
                  {selectedComplaintForView.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VendorComplaintView;
