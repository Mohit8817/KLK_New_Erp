import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSslAdminService,
  resolveJammuSslMediaUrl,
  type AdminAssignLightItem,
  type AssignSummaryCounts,
} from './jammuSslAdminService';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

/* ───────── Responsive page CSS (Exact Solar ERP standard) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
    --ax-primary: #2559bf;
    --ax-primary-hover: #1e4699;
    --ax-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary,
  .solar-erp-page .ax-button--primary {
    background: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover,
  .solar-erp-page .ax-button--primary:hover {
    background: #1e4699 !important;
    border-color: #1e4699 !important;
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
  @media (max-width: 1100px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
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
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
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
    width: 100%;
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'rgba(8, 145, 178, 0.12)', fg: '#0891b2' },
  emerald: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#16a34a' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706' },
  violet: { bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed' },
  rose: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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

function FilePreviewButton({
  file,
  label,
  onPreview,
}: {
  file?: string | null;
  label: string;
  onPreview: (url: string) => void;
}) {
  if (!file) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const url = resolveJammuSslMediaUrl(file);
  const isImg = /\.(jpe?g|png|webp|gif|svg)$/i.test(file);

  return (
    <button
      type="button"
      onClick={() => onPreview(url)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: '3px 8px',
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: '#2559bf',
      }}
      title={`Click to preview / view ${label}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {isImg ? (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        ) : (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </>
        )}
      </svg>
      {isImg ? 'Photo' : 'File'}
    </button>
  );
}

export function ViewAssignSslLights() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [list, setList] = useState<AdminAssignLightItem[]>([]);
  const [summary, setSummary] = useState<AssignSummaryCounts>({
    totalsite: 0,
    complete: 0,
    pendingsite: 0,
    approvedsite: 0,
    rejectsite: 0,
    verifypending: 0,
    claimedapplicable: 0,
    paymentsitecount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Approval In-Progress
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Modals
  const [selectedDetails, setSelectedDetails] = useState<AdminAssignLightItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Import Modal State
  const [importTarget, setImportTarget] = useState<AdminAssignLightItem | null>(null);
  const [importType, setImportType] = useState<'battery' | 'imei' | 'panel' | 'sim'>('battery');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [submittingImport, setSubmittingImport] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSslAdminService.getViewAssignWithSummary();
      setList(res.viewassign);
      setSummary(res.summary);
    } catch (err: any) {
      console.error('Load assign lights error:', err);
      setErrorMsg(err?.message || 'Failed to fetch assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuSslAdminService.approvalAssign(id);
      if (res.success) {
        setSuccessMsg(res.message || `Assignment #${id} approved successfully!`);
        setList((prev) => prev.map((item) => (item.id === id ? { ...item, status: 1 } : item)));
        setSummary((prev) => ({
          ...prev,
          approvedsite: (prev.approvedsite || 0) + 1,
          pendingsite: Math.max(0, (prev.pendingsite || 0) - 1),
        }));
      } else {
        setErrorMsg(res.message || `Failed to approve assignment #${id}.`);
      }
    } catch (err: any) {
      console.error('Approval failed:', err);
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  // Handle Excel Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTarget || !importFile) {
      setErrorMsg('Please select a file to import.');
      return;
    }

    setSubmittingImport(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let res;
      if (importType === 'battery') {
        res = await jammuSslAdminService.importBattery(importFile, importTarget.vendor, importTarget.id);
      } else if (importType === 'imei') {
        res = await jammuSslAdminService.importImei(importFile, importTarget.vendor, importTarget.id);
      } else if (importType === 'panel') {
        res = await jammuSslAdminService.importPanel(importFile, importTarget.vendor, importTarget.id);
      } else {
        res = await jammuSslAdminService.importSim(importFile, importTarget.vendor, importTarget.id);
      }

      if (res.success) {
        setSuccessMsg(res.message || `${importType.toUpperCase()} file imported successfully!`);
        setImportTarget(null);
        setImportFile(null);
        loadData();
      } else {
        setErrorMsg(res.message || `Failed to import ${importType.toUpperCase()} file.`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err?.message || 'Failed to import file.');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Tab Filtering
  const filteredByTab = useMemo(() => {
    if (activeTab === 'pending') return list.filter((item) => item.status === 0);
    if (activeTab === 'approved') return list.filter((item) => item.status === 1 || item.status === 2);
    return list;
  }, [list, activeTab]);

  // Search Query Filtering
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByTab;

    return filteredByTab.filter((item) => {
      const vName = (item.vendor_name || `Vendor ${item.vendor}`).toLowerCase();
      const dist = (item.district || '').toLowerCase();
      const blk = (item.block || '').toLowerCase();
      const pan = (Array.isArray(item.panchayat) ? item.panchayat.join(' ') : String(item.panchayat || '')).toLowerCase();
      const rem = (item.remarks || item.remark || '').toLowerCase();
      const idStr = String(item.id);

      return (
        vName.includes(q) ||
        dist.includes(q) ||
        blk.includes(q) ||
        pan.includes(q) ||
        rem.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [filteredByTab, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 50 });

  // Export Columns definition
  const exportCols: ExportColumn<AdminAssignLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: AdminAssignLightItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r: AdminAssignLightItem) => r.vendor_name || `Vendor ${r.vendor}` },
      { header: 'State', accessor: (r: AdminAssignLightItem) => r.state?.toUpperCase() || 'JAMMU' },
      { header: 'District', accessor: (r: AdminAssignLightItem) => r.district || '—' },
      { header: 'Block', accessor: (r: AdminAssignLightItem) => r.block || '—' },
      {
        header: 'Village',
        accessor: (r: AdminAssignLightItem) =>
          Array.isArray(r.panchayat) ? r.panchayat.join(', ') : String(r.panchayat || r.village || '—'),
      },
      { header: 'Assign Date', accessor: (r: AdminAssignLightItem) => fmtDate(r.assign_date || r.created_at) },
      { header: 'Deadline Date', accessor: (r: AdminAssignLightItem) => fmtDate(r.ldate) },
      { header: 'Site Count', accessor: (r: AdminAssignLightItem) => r.sitecount ?? r.count ?? 0 },
      { header: 'Unique ID File', accessor: (r: AdminAssignLightItem) => r.uid_file || r.file || '—' },
      { header: 'Battery File', accessor: (r: AdminAssignLightItem) => r.battery_file || '—' },
      { header: 'Sim File', accessor: (r: AdminAssignLightItem) => r.sim_file || '—' },
      { header: 'Panel File', accessor: (r: AdminAssignLightItem) => r.panel_file || '—' },
      { header: 'IMEI File', accessor: (r: AdminAssignLightItem) => r.imei_file || '—' },
      { header: 'Remarks', accessor: (r: AdminAssignLightItem) => r.remarks || r.remark || '—' },
      { header: 'Status', accessor: (r: AdminAssignLightItem) => (r.status === 1 || r.status === 2 ? 'Approved' : 'Pending') },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_Assigned_${activeTab}`;
  const fileTitle = `Jammu SSL Assigned Lights Register (${activeTab.toUpperCase()})`;

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

  const exportToCSV = <T,>(listData: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!listData.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...listData.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(listData: T[], columns: ExportColumn<T>[]) => {
    if (!listData.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...listData.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
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

  const exportToExcel = <T,>(listData: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!listData.length || !columns.length) return;
    const headerRow = columns.map((c) => `<th>${escapeHtml(c.header ?? c.label ?? '')}</th>`).join('');
    const bodyRows = listData
      .map(
        (row, idx) =>
          `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`
      )
      .join('');
    const tableHtml = `<table border="1"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    downloadTextFile(
      `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${tableHtml}</body></html>`,
      `${filename}.xls`,
      'application/vnd.ms-excel'
    );
  };

  const exportToPDF = <T,>(listData: T[], columns: ExportColumn<T>[], reportTitle: string) => {
    if (!listData.length || !columns.length) return;
    const headerRow = columns.map((c) => `<th>${escapeHtml(c.header ?? c.label ?? '')}</th>`).join('');
    const bodyRows = listData
      .map(
        (row, idx) =>
          `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`
      )
      .join('');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; font-size: 11px; }
            h2 { margin: 0 0 10px 0; color: #2559bf; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; color: #0f172a; }
            tr:nth-child(even) { background-color: #fbfcfd; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(reportTitle)}</h2>
          <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
          <table border="1"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SSL View Assigned Lights"
        subtitle="Master register of solar street light batch allocations, panchayat work orders, and contracted EPC agencies"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu SSL', href: '/vendor-management/jammu/installation/ssl/dashboard' },
          { label: 'View Assigned' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/ssl/assign-lights"
            className="ax-btn ax-btn--primary ax-btn--sm"
            style={{ fontWeight: 700 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ marginRight: 6 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Assign New Lights
          </Link>
        }
      />

      {/* ── Status Feedback Banners ── */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Top 8 KPI Metric Cards matching Backend Counters ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total Assigned Lights"
          value={num(summary.totalsite || list.length)}
          sub="Total lights assigned"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Complete Lights"
          value={num(summary.complete)}
          sub="Installation complete"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Lights"
          value={num(summary.pendingsite)}
          sub="Installation pending"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
          tone="cyan"
          label="Approve Lights"
          value={num(summary.approvedsite)}
          sub="Approved assignments"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="rose"
          label="Reject Lights"
          value={num(summary.rejectsite)}
          sub="Rejected lights"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          tone="amber"
          label="Verify Pending"
          value={num(summary.verifypending)}
          sub="Awaiting verification"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="violet"
          label="Claim Applicable"
          value={num(summary.claimedapplicable)}
          sub="Claims ready to audit"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
          }
          tone="emerald"
          label="Payment Done"
          value={num(summary.paymentsitecount)}
          sub="Payment disbursed"
        />
      </div>

      {/* ── Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Assigned Lights
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {list.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval (Status 0)
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {list.filter((x) => x.status === 0).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved / Active
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {list.filter((x) => x.status === 1 || x.status === 2).length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Pending Approval Jammu SSL Light Assignments' : activeTab === 'approved' ? 'Approved Jammu SSL Light Assignments' : 'All Jammu SSL Assigned Lights Master Table'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} assignment record{filteredList.length === 1 ? '' : 's'} with live Excel imports & approval workflow
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
                placeholder="Search vendor, district, block, village..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportToCSV(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredList, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Table with Exact Columns Requested ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1750 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th" style={{ minWidth: 160 }}>Village</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">Deadline Date</th>
                <th className="ax-table__th ax-table__th--num">Site Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Unique ID's File</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Battery No. File</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Sim No. File</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel No. File</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>IMEI No. File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={17} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned lights records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={17} style={centerCell}>
                    <TableEmptyState
                      title="No assigned light records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: AdminAssignLightItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.status === 1 || row.status === 2;
                  const villagesStr = Array.isArray(row.panchayat)
                    ? row.panchayat.join(', ')
                    : String(row.panchayat || row.village || '—');

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || `Vendor #${row.vendor}`}
                      </td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">{row.block || '—'}</td>
                      <td className="ax-table__td" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        <span
                          title={villagesStr}
                          style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {villagesStr}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {fmtDate(row.assign_date || row.created_at)}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {fmtDate(row.ldate)}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {num(row.sitecount ?? row.count ?? 0)}
                      </td>

                      {/* Unique ID's File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <FilePreviewButton
                          file={row.uid_file || row.file}
                          label="Unique ID File"
                          onPreview={setLightboxUrl}
                        />
                      </td>

                      {/* Battery No. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <FilePreviewButton
                          file={row.battery_file}
                          label="Battery No. File"
                          onPreview={setLightboxUrl}
                        />
                      </td>

                      {/* Sim No. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <FilePreviewButton
                          file={row.sim_file}
                          label="Sim No. File"
                          onPreview={setLightboxUrl}
                        />
                      </td>

                      {/* Panel No. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <FilePreviewButton
                          file={row.panel_file}
                          label="Panel No. File"
                          onPreview={setLightboxUrl}
                        />
                      </td>

                      {/* IMEI No. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <FilePreviewButton
                          file={row.imei_file}
                          label="IMEI No. File"
                          onPreview={setLightboxUrl}
                        />
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, fontSize: 12 }}>
                        <span
                          title={row.remarks || row.remark || ''}
                          style={{ display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {row.remarks || row.remark || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {/* Approve Button (Only when status === 0) */}
                          {row.status === 0 && (
                            <button
                              type="button"
                              onClick={() => handleApprove(row.id)}
                              disabled={approvingId === row.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title="Approve Assignment Order"
                            >
                              {approvingId === row.id ? (
                                <span className="ax-spinner" style={{ width: 10, height: 10 }} />
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              Approve
                            </button>
                          )}

                          {/* Edit Button (Only when status === 0) */}
                          {row.status === 0 && (
                            <Link
                              to={`/vendor-management/jammu/installation/ssl/assign-lights?edit=${row.id}`}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#2559bf',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              Edit
                            </Link>
                          )}

                          {/* Excel Import Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setImportTarget(row);
                              setImportType('battery');
                              setImportFile(null);
                            }}
                            style={{
                              padding: '4px 9px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="Import Excel files (Battery, IMEI, Panel, SIM)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Import
                          </button>

                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetails(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="View details"
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

      {/* ── Excel Import Modal ── */}
      <Modal
        open={Boolean(importTarget)}
        onClose={() => {
          if (!submittingImport) setImportTarget(null);
        }}
        title="Import Excel Asset Data"
        subtitle={
          importTarget
            ? `Assignment ID: #${importTarget.id} • Vendor: ${importTarget.vendor_name || 'Vendor ' + importTarget.vendor} • District: ${importTarget.district}`
            : ''
        }
        maxWidth={500}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setImportTarget(null)}
              disabled={submittingImport}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-button ax-button--primary"
              onClick={handleImportSubmit}
              disabled={submittingImport || !importFile}
              style={{
                background: '#2559bf',
                borderColor: '#2559bf',
                padding: '6px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {submittingImport && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Upload & Import
            </button>
          </div>
        }
      >
        <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Select Asset File Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as any)}
              required
              style={{
                width: '100%',
                height: 42,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                color: '#0f172a',
                background: '#fff',
              }}
            >
              <option value="battery">Battery No. Excel Import</option>
              <option value="imei">IMEI No. Excel Import</option>
              <option value="panel">Panel No. Excel Import</option>
              <option value="sim">SIM No. Excel Import</option>
            </select>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Endpoint: /jammu/ssl/installation/state-{importType}-import
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Excel / CSV File <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                background: '#f8fafc',
              }}
            />
            {importFile && (
              <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Comprehensive Work Order Details Modal ── */}
      <Modal
        open={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title="Assigned Solar Street Light Batch Details"
        subtitle={
          selectedDetails
            ? `ID: #${selectedDetails.id} • Vendor: ${selectedDetails.vendor_name || 'Vendor ' + selectedDetails.vendor}`
            : ''
        }
        maxWidth={780}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedDetails(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Assignment ID</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2559bf', fontFamily: 'monospace', marginTop: 2 }}>
                  #{selectedDetails.id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Contracted Vendor</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {selectedDetails.vendor_name || `Vendor #${selectedDetails.vendor}`}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Allocated Lights</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                  {num(selectedDetails.sitecount ?? selectedDetails.count ?? 0)} Units
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Deadline</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {fmtDate(selectedDetails.ldate)}
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                Assigned Territory
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>State:</span>
                <span style={{ fontWeight: 600 }}>JAMMU</span>

                <span style={{ color: '#64748b' }}>District:</span>
                <span>{selectedDetails.district}</span>

                <span style={{ color: '#64748b' }}>Block:</span>
                <span>{selectedDetails.block}</span>

                <span style={{ color: '#64748b' }}>Panchayat / Village:</span>
                <div>{Array.isArray(selectedDetails.panchayat) ? selectedDetails.panchayat.join(', ') : selectedDetails.panchayat || selectedDetails.village || '—'}</div>

                <span style={{ color: '#64748b' }}>Remarks:</span>
                <span>{selectedDetails.remarks || selectedDetails.remark || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Lightbox Modal for Photo / Document Preview ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Asset Document Preview"
        maxWidth={720}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="ax-button ax-button--secondary"
                style={{ padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}
              >
                Open / Download ↗
              </a>
            )}
            <button
              type="button"
              className="ax-button ax-button--primary"
              onClick={() => setLightboxUrl(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            {/\.(jpe?g|png|webp|gif|svg)$/i.test(lightboxUrl) ? (
              <img
                src={lightboxUrl}
                alt="Asset Preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <iframe
                src={lightboxUrl}
                title="Document Preview"
                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ViewAssignSslLights;
