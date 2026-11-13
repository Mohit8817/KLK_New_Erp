import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  type SslClaimDeskItem,
} from './jammuSslAdminService';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Responsive page CSS (Exact Solar ERP reference, all columns scrollable) ───────── */
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
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
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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

export function SslClaimRequest() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [list, setList] = useState<SslClaimDeskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Audit Modal State
  const [selectedClaimForAudit, setSelectedClaimForAudit] = useState<SslClaimDeskItem | null>(null);
  const [auditStatus, setAuditStatus] = useState<'2' | '3'>('2'); // 2 = Approved, 3 = Rejected
  const [auditRemarks, setAuditRemarks] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // View Details Modal
  const [selectedDetails, setSelectedDetails] = useState<SslClaimDeskItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSslAdminService.getClaimRequests();
      setList(res);
    } catch (err: any) {
      console.error('Failed to load Jammu SSL claims:', err);
      setErrorMsg(err?.message || 'Failed to fetch claim requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForAudit) return;
    setSubmittingAudit(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = auditStatus === '2' ? 2 : 3;
      const res = await jammuSslAdminService.auditClaimRequest(selectedClaimForAudit.id, statusNum, auditRemarks.trim());
      setSuccessMsg(res.message);
      setList((prev) =>
        prev.map((c) =>
          c.id === selectedClaimForAudit.id
            ? { ...c, claim_status: statusNum, audit_remarks: auditRemarks.trim() }
            : c
        )
      );
      setSelectedClaimForAudit(null);
      setAuditRemarks('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update claim audit decision.');
    } finally {
      setSubmittingAudit(false);
    }
  };

  // Top 5 KPI Metrics
  const totalClaimsCount = list.length;
  const claimedSitesTotal = useMemo(
    () => list.reduce((acc, curr) => acc + (Number(curr.claim_site_count) || 0), 0),
    [list]
  );
  const pendingAuditCount = useMemo(() => list.filter((c) => c.claim_status === 1).length, [list]);
  const approvedClaimsCount = useMemo(() => list.filter((c) => c.claim_status === 2).length, [list]);
  const rejectedClaimsCount = useMemo(() => list.filter((c) => c.claim_status === 3).length, [list]);

  // Tab Filtering
  const filteredByTab = useMemo(() => {
    if (activeTab === 'pending') return list.filter((c) => c.claim_status === 1);
    if (activeTab === 'approved') return list.filter((c) => c.claim_status === 2);
    if (activeTab === 'rejected') return list.filter((c) => c.claim_status === 3);
    return list;
  }, [list, activeTab]);

  // Search Filter
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByTab;

    return filteredByTab.filter((item) => {
      const claimId = (item.claim_id || `JK-CLM-${item.id}`).toLowerCase();
      const vName = (item.vendor_name || '').toLowerCase();
      const dist = (item.district || '').toLowerCase();
      const vol = (item.volume || '').toLowerCase();

      return (
        claimId.includes(q) ||
        vName.includes(q) ||
        dist.includes(q) ||
        vol.includes(q)
      );
    });
  }, [filteredByTab, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 50 });

  // Export Columns definition
  const exportCols: ExportColumn<SslClaimDeskItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SslClaimDeskItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'JAMMU & KASHMIR' },
      { header: 'Claim ID', accessor: (r: SslClaimDeskItem) => r.claim_id || `JK-CLM-${r.id}` },
      { header: 'Vendor Name', accessor: (r: SslClaimDeskItem) => r.vendor_name },
      { header: 'Volume / Scheme', accessor: (r: SslClaimDeskItem) => r.volume || '—' },
      { header: 'District', accessor: (r: SslClaimDeskItem) => r.district || '—' },
      { header: 'Claimed Lights Count', accessor: (r: SslClaimDeskItem) => r.claim_site_count },
      { header: 'Claim Amount (₹)', accessor: (r: SslClaimDeskItem) => `₹${num(r.claim_amount)}` },
      { header: 'Submission Date', accessor: (r: SslClaimDeskItem) => r.claim_raised_date || '—' },
      {
        header: 'Claim Status',
        accessor: (r: SslClaimDeskItem) => (r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Pending Audit'),
      },
      { header: 'Audit Remarks', accessor: (r: SslClaimDeskItem) => r.audit_remarks || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_Claims_${activeTab}`;
  const fileTitle = `Jammu SSL Claim Requests (${activeTab.toUpperCase()})`;

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
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${listData.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(listData: T[], columns: ExportColumn<T>[], title: string) => {
    if (!listData.length || !columns.length) return;
    const body = listData.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
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

      <PageHead
        title="Jammu SSL Claim Request Desk"
        subtitle="Verification and audit desk for solar street light vendor installation invoices, milestone claims, and CA certificates"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu SSL', href: '/vendor-management/jammu/installation/ssl/dashboard' },
          { label: 'Claim Request' },
        ]}
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

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
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
          label="Total Claims"
          value={totalClaimsCount}
          sub="Total claim files submitted"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Claimed Sites"
          value={num(claimedSitesTotal)}
          sub="Verified lights claimed"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Audit"
          value={pendingAuditCount}
          sub="Awaiting finance audit"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Claims Approved"
          value={approvedClaimsCount}
          sub="Approved for disbursement"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="violet"
          label="Claims Rejected"
          value={rejectedClaimsCount}
          sub="Rejected during CA/audit"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Claims
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {list.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Audit
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingAuditCount}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Claims
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {approvedClaimsCount}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Claims
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {rejectedClaimsCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Pending Audit SSL Installation Claims' : activeTab === 'approved' ? 'Approved SSL Installation Claims' : activeTab === 'rejected' ? 'Rejected SSL Claims' : 'All Jammu SSL Claim Requests'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} claim record{filteredList.length === 1 ? '' : 's'} with vendor invoice & CA certificate verification
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
                placeholder="Search claim ID, vendor, district..."
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

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1550 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Claim ID</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">Scheme / Volume</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th ax-table__th--num">Claimed Sites</th>
                <th className="ax-table__th ax-table__th--num">Claim Amount (₹)</th>
                <th className="ax-table__th">Submission Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Tax Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>CA Certificate</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading claim request records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <TableEmptyState
                      title="No claim requests found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: SslClaimDeskItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.claim_status === 2;
                  const isRejected = row.claim_status === 3;
                  const invFile = row.claim_invoice;
                  const caFile = row.ca_certificate;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU & KASHMIR</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#2559bf', fontFamily: 'monospace' }}>
                        {row.claim_id || `JK-CLM-${row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name}
                      </td>
                      <td className="ax-table__td">{row.volume || 'Phase I'}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {num(row.claim_site_count)} Units
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{num(row.claim_amount)}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {row.claim_raised_date || '—'}
                      </td>

                      {/* Invoice Document */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {invFile ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(invFile))}
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
                              fontWeight: 700,
                              color: '#2559bf',
                            }}
                            title="Click to view invoice"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Invoice
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* CA Certificate */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {caFile ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(caFile))}
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
                              fontWeight: 700,
                              color: '#0891b2',
                            }}
                            title="Click to view CA Certificate"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            CA Cert
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 170, fontSize: 11, lineHeight: 1.3 }}>
                        {row.remarks && (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Vendor: </span>
                            <span>{row.remarks}</span>
                          </div>
                        )}
                        {row.audit_remarks && (
                          <div style={{ marginTop: row.remarks ? 3 : 0, color: '#b45309' }}>
                            <span style={{ fontWeight: 600 }}>Audit: </span>
                            <span>{row.audit_remarks}</span>
                          </div>
                        )}
                        {!row.remarks && !row.audit_remarks && (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending Audit
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDetails(row)}
                            style={{
                              padding: '4px 8px',
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
                            title="View full claim details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClaimForAudit(row);
                              setAuditStatus(row.claim_status === 3 ? '3' : '2');
                              setAuditRemarks(row.audit_remarks || '');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#2559bf',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Audit
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

      {/* ── Comprehensive Claim Details Modal ── */}
      <Modal
        open={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title="Jammu SSL Installation Claim Details"
        subtitle={
          selectedDetails
            ? `Claim ID: ${selectedDetails.claim_id || 'JK-CLM-' + selectedDetails.id} • Vendor: ${selectedDetails.vendor_name}`
            : ''
        }
        maxWidth={780}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedDetails && (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedDetails;
                    setSelectedDetails(null);
                    setSelectedClaimForAudit(c);
                    setAuditStatus(c.claim_status === 3 ? '3' : '2');
                    setAuditRemarks(c.audit_remarks || '');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#2559bf',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Audit This Claim
                </button>
              )}
            </div>
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
            {/* Overview Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Claim Reference</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2559bf', fontFamily: 'monospace', marginTop: 2 }}>
                  {selectedDetails.claim_id || `JK-CLM-${selectedDetails.id}`}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Vendor Agency</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {selectedDetails.vendor_name}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Claim Amount</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                  ₹{num(selectedDetails.claim_amount)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Claimed Lights</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  {selectedDetails.claim_site_count} Verified Poles
                </div>
              </div>
            </div>

            {/* Geographic & Scheme */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Scope & Allocation
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>State:</span>
                <span style={{ fontWeight: 600 }}>JAMMU & KASHMIR</span>

                <span style={{ color: '#64748b' }}>District:</span>
                <span>{selectedDetails.district || '—'}</span>

                <span style={{ color: '#64748b' }}>Scheme Volume:</span>
                <span>{selectedDetails.volume || 'Phase I'}</span>

                <span style={{ color: '#64748b' }}>Submission Date:</span>
                <span>{selectedDetails.claim_raised_date || '—'}</span>
              </div>
            </div>

            {/* Attached Invoices & CA Documents */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12, letterSpacing: '0.04em' }}>
                Attached Claim Documents
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Tax Invoice (GST)</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Vendor signed invoice</div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--xs"
                    onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(selectedDetails.claim_invoice || 'invoice.pdf'))}
                  >
                    View ↗
                  </button>
                </div>

                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>CA Audit Certificate</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Chartered Accountant signoff</div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--xs"
                    onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(selectedDetails.ca_certificate || 'ca_cert.pdf'))}
                  >
                    View ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Remarks & Audit Log */}
            {(selectedDetails.remarks || selectedDetails.audit_remarks) && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Audit & Review Notes
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
                  {selectedDetails.remarks && (
                    <>
                      <span style={{ color: '#64748b' }}>Vendor Notes:</span>
                      <span>{selectedDetails.remarks}</span>
                    </>
                  )}
                  {selectedDetails.audit_remarks && (
                    <>
                      <span style={{ color: '#64748b' }}>Auditor Notes:</span>
                      <span style={{ fontWeight: 600, color: '#b45309' }}>{selectedDetails.audit_remarks}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Audit Decision ── */}
      <Modal
        open={Boolean(selectedClaimForAudit)}
        onClose={() => {
          if (!submittingAudit) setSelectedClaimForAudit(null);
        }}
        title="Audit Vendor Claim Request"
        subtitle={
          selectedClaimForAudit
            ? `Claim: ${selectedClaimForAudit.claim_id || 'JK-CLM-' + selectedClaimForAudit.id} • Vendor: ${selectedClaimForAudit.vendor_name} • Amount: ₹${num(selectedClaimForAudit.claim_amount)}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedClaimForAudit(null)}
              disabled={submittingAudit}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-button ax-button--primary"
              onClick={handleAuditSubmit}
              disabled={submittingAudit}
              style={{ padding: '6px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submittingAudit && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Submit Decision
            </button>
          </>
        }
      >
        <form onSubmit={handleAuditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Audit Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={auditStatus}
              onChange={(e) => setAuditStatus(e.target.value as '2' | '3')}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="2">Approve Claim for Payment</option>
              <option value="3">Reject Claim / Require Rectification</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Audit Remarks & Reason
            </label>
            <textarea
              rows={3}
              value={auditRemarks}
              onChange={(e) => setAuditRemarks(e.target.value)}
              placeholder="Enter audit signoff notes or rejection reasons..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Document Lightbox Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Document Preview"
        maxWidth={800}
        footer={
          <button
            type="button"
            className="ax-button ax-button--secondary"
            onClick={() => setLightboxUrl(null)}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            Close
          </button>
        }
      >
        {lightboxUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            {lightboxUrl.endsWith('.pdf') ? (
              <iframe src={lightboxUrl} title="PDF Preview" style={{ width: '100%', height: 500, border: 0 }} />
            ) : (
              <img src={lightboxUrl} alt="Inspection Preview" style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SslClaimRequest;
