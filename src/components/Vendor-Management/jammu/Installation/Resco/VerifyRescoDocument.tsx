import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  getJammuMediaCandidates,
  type JammuRescoInstalledSiteItem,
} from '../../../../V-Portal/jammu/jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const DocBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Under Review</Badge>;
  return <Badge tone="neutral">Not Uploaded</Badge>;
};

const VerifyBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Verified</Badge>;
  if (s === 2) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  children,
  dialogClass = '',
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Document & Media Preview Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function DocPreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf ? 'ready' : 'loading');
  }, [url, isPdf]);

  return (
    <Modal open onClose={onClose} labelledBy="doc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="doc-preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Document Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading document…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Document could not be previewed inline. Try opening it in a new tab.</div>
          )}

          {isPdf ? (
            <iframe
              src={url}
              title={title || 'PDF Document Preview'}
              style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
            />
          ) : (
            <img
              key={url}
              src={url}
              alt={title || 'Document'}
              onLoad={() => setStatus('ready')}
              onError={() => setStatus('error')}
              style={{
                display: status === 'ready' ? 'block' : 'none',
                margin: 'auto',
                borderRadius: 0,
                ...(zoom === 1
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          )}
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        {!isPdf ? (
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
        ) : <div />}
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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

/* ───────── Styles ───────── */
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
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Modals */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

export const VerifyRescoDocument: React.FC = () => {
  const [sites, setSites] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [docFilter, setDocFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Review Audit Modal State
  const [auditModalItem, setAuditModalItem] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [docStatusVal, setDocStatusVal] = useState<string>('2');
  const [docRemarksVal, setDocRemarksVal] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState<boolean>(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Installed Sites with documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getViewInstalledSites();
      setSites(res.sites || []);
    } catch (err: any) {
      console.error('[Admin Verify Document] load error:', err);
      setSites([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load document records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Unique Districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    sites.forEach((r) => {
      if (r.district) s.add(r.district);
    });
    return Array.from(s).sort();
  }, [sites]);

  // Metrics
  const totalSites = sites.length;
  const approvedDocs = useMemo(
    () => sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 2).length,
    [sites]
  );
  const rejectedDocs = useMemo(
    () => sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 3).length,
    [sites]
  );
  const pendingDocs = Math.max(0, totalSites - approvedDocs - rejectedDocs);

  // Filtered
  const filtered = useMemo(() => {
    return sites.filter((r) => {
      if (districtFilter !== 'all' && r.district !== districtFilter) return false;

      const dStatus = Number(r.inst_doc_status ?? r.document_status ?? 0);
      if (docFilter === 'complete' && dStatus !== 2) return false;
      if (docFilter === 'rejected' && dStatus !== 3) return false;
      if (docFilter === 'pending' && (dStatus === 2 || dStatus === 3)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sName = String(r.site_name || '').toLowerCase();
        const d = String(r.district || '').toLowerCase();
        const cp = String(r.contact_person || '').toLowerCase();
        const ca = String(r.ca_no || '').toLowerCase();
        const rem = String(r.inst_doc_remarks || r.doc_remarks || '').toLowerCase();
        if (!sName.includes(q) && !d.includes(q) && !cp.includes(q) && !ca.includes(q) && !rem.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sites, districtFilter, docFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filtered,
    initialPageSize: 10,
  });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, docFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || docFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setDocFilter('all');
    setPage(1);
  };

  // Save Document Audit Decision
  const handleSaveDocAudit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auditModalItem) return;
    setSavingAudit(true);
    try {
      const fd = new FormData();
      fd.append('id', String(auditModalItem.id));
      fd.append('inst_doc_status', docStatusVal);
      fd.append('inst_doc_remarks', docRemarksVal);

      await jammuRescoService.updateInstallation(auditModalItem.id, fd);

      setToastMsg({
        type: 'success',
        text: `Document audit updated to ${docStatusVal === '2' ? 'Complete' : 'Rejected'} successfully!`,
      });

      // Update state optimistically
      setSites((prev) =>
        prev.map((s) =>
          s.id === auditModalItem.id
            ? { ...s, inst_doc_status: Number(docStatusVal), inst_doc_remarks: docRemarksVal }
            : s
        )
      );
      setAuditModalItem(null);
    } catch (err: any) {
      console.error('[Admin Verify Document] audit error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update document audit.' });
    } finally {
      setSavingAudit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Installation Date', accessor: (r) => txt(r, 'inst_date') || txt(r, 'created_at') },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Consumer CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Document Status', accessor: (r) => (Number(r.inst_doc_status ?? r.document_status) === 2 ? 'Complete' : Number(r.inst_doc_status ?? r.document_status) === 3 ? 'Reject' : 'Pending') },
      { header: 'Document Remarks', accessor: (r) => r.inst_doc_remarks || r.doc_remarks || DASH },
      { header: 'Verify Status', accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Complete' : 'Pending') },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Verify Documents"
        subtitle="Review and verify CEIG inspection clearance, net-metering synchronization certificates, and plant commissioning documents"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Verify Documents' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Installation
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/view-claim" className="ax-btn ax-btn--primary ax-btn--sm">
              View Claims
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Plant Documents"
          value={totalSites.toLocaleString('en-IN')}
          sub="Installed site records"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Documents Approved"
          value={approvedDocs.toLocaleString('en-IN')}
          sub="CEIG & sync authorized"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Review"
          value={pendingDocs.toLocaleString('en-IN')}
          sub="Awaiting document audit"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Documents Rejected"
          value={rejectedDocs.toLocaleString('en-IN')}
          sub="Requires resubmission"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Verify Resco Document Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Commissioning Document Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> site records
              {' '}· Approved <b className="ax-num">{approvedDocs}</b> · Pending <b className="ax-num">{pendingDocs}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                aria-label="Filter by doc status"
              >
                <option value="all">All Document Status</option>
                <option value="complete">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, CA no, remarks…"
                size="sm"
                ariaLabel="Search documents"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Document_Verification')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Document_Verification')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Document Verification Register')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Installation Date</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Consumer CA No.</th>
                <th className="ax-table__th" scope="col">Contact Person</th>
                <th className="ax-table__th" scope="col">Contact Number</th>
                <th className="ax-table__th" scope="col">Document Status</th>
                <th className="ax-table__th" scope="col">Document File</th>
                <th className="ax-table__th" scope="col">Document Remarks</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading commissioning documents from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No document records found"
                      message={hasFilters ? 'No sites match your current filters.' : 'No commissioning documents found.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const instDate = txt(row, 'inst_date') || txt(row, 'created_at') || DASH;
                  const docUrl = row.inst_doc_file ? resolveJammuMediaUrl(row.inst_doc_file) : null;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{instDate}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || `Site #${row.site_id || row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td">{row.contact_person || DASH}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.contact_number || DASH}</td>

                      {/* Document Status */}
                      <td className="ax-table__td">
                        <DocBadge status={row.inst_doc_status ?? row.document_status} />
                      </td>

                      {/* Document File Link */}
                      <td className="ax-table__td">
                        {docUrl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => openPreview(docUrl, `Document: ${row.site_name || row.id}`)}
                              style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                            >
                              Preview Doc
                            </button>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ height: 26, padding: '0 6px', fontSize: 11 }}
                              title="Open in new window"
                            >
                              ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>No Document</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.inst_doc_remarks || row.doc_remarks || DASH}
                      </td>

                      <td className="ax-table__td">
                        <VerifyBadge status={row.inst_verify_status ?? row.verify_status} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => {
                            setAuditModalItem(row);
                            setDocStatusVal(String(row.inst_doc_status ?? '2'));
                            setDocRemarksVal(row.inst_doc_remarks || '');
                          }}
                          style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                        >
                          Review Doc
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>

      {/* ── Review Document Audit Modal ── */}
      {auditModalItem && (
        <Modal open onClose={() => setAuditModalItem(null)} labelledBy="audit-doc-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSaveDocAudit}>
            <div className="ax-modal__header">
              <div>
                <h3 id="audit-doc-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Audit Commissioning Document
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{auditModalItem.site_name}</b> · District: <b>{auditModalItem.district}</b> · CA No: <b>{auditModalItem.ca_no || DASH}</b>
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setAuditModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {auditModalItem.inst_doc_file && (
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Attached File</span>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{auditModalItem.inst_doc_file.split('/').pop()}</span>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={() => openPreview(resolveJammuMediaUrl(auditModalItem.inst_doc_file!)!, `Document: ${auditModalItem.site_name}`)}
                      style={{ height: 26, fontSize: 11 }}
                    >
                      Inspect File
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Document Audit Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={docStatusVal}
                  onChange={(e) => setDocStatusVal(e.target.value)}
                  required
                >
                  <option value="2">Approve Document (Complete & Valid)</option>
                  <option value="3">Reject Document (Discrepancy / Resubmission Required)</option>
                  <option value="1">Keep Under Review / Pending</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Audit Remarks / Findings
                </label>
                <textarea
                  className="ax-input"
                  rows={4}
                  style={{ width: '100%', height: 'auto', padding: '10px 12px' }}
                  value={docRemarksVal}
                  onChange={(e) => setDocRemarksVal(e.target.value)}
                  placeholder="Enter certificate validity, CEIG inspector notes, or reason for rejection…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setAuditModalItem(null)}
                disabled={savingAudit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingAudit}
              >
                {savingAudit ? 'Saving Audit…' : 'Save Document Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Document Lightbox Preview Modal ── */}
      {preview && (
        <DocPreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default VerifyRescoDocument;
