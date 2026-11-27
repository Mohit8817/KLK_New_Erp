import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
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
  goaAdminService,
  resolveGoaMediaUrl,
} from '../../goa-services';

/* ───────── Responsive Page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
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
  @media (max-width: 1200px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
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
  }
`;

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file || file === '—') {
    return <span style={{ color: 'var(--ax-text-muted, #64748b)', fontSize: 12 }}>—</span>;
  }

  const url = resolveGoaMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isHeic = /\.heic($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt="Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '10px';
              span.style.fontWeight = '700';
              span.style.color = '#2563eb';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

// User Exact Columns:
// Sr. No. | State | District | Site Name | Claim Raised Date | Claim Invoice | Claim Amount | Claim Update Date | Claim Update by | Claim Status | Installation Inspection | Document Status | Generation Image | Loger Image | Payment 3 verification Status
export interface GoaClaimItem {
  id: number;
  state: string;
  district: string;
  site_name: string;
  claim_raised_date: string;
  claim_invoice: string;
  claim_amount: number;
  claim_update_date: string;
  claim_update_by: string;
  claim_status: string; // Approved, In Review, Pending
  installation_inspection: string; // Passed, Pending
  document_status: string; // Complete, Pending
  generation_image: string | null;
  logger_image: string | null;
  payment3_verification_status: string;
}

export function GoaSRTInstallationViewClaim() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await goaAdminService.getViewClaim();
      if (Array.isArray(data)) {
        const mapped = data.map((c: any) => ({
          ...c,
          claim_raised_date: c.inst_claim_date || '—',
          claim_invoice: c.inst_claim_invoice || '—',
          claim_amount: Number(c.inst_claim_amount || c.claim_amount || 0),
          claim_update_date: c.inst_claim_update_date || '—',
          claim_update_by: c.inst_claim_update_by || '—',
          claim_status: Number(c.inst_claim_status) === 2 ? 'Approved' : Number(c.inst_claim_status) === 1 ? 'Raised' : 'Not Raised',
          installation_inspection: Number(c.inst_inspection) === 1 ? 'Approved' : Number(c.inst_inspection) === 2 ? 'Rejected' : 'Pending',
          document_status: Number(c.inst_doc_submit) === 2 ? 'Approved' : Number(c.inst_doc_submit) === 1 ? 'Submitted' : 'Pending',
          generation_image: c.inst_gen_image || c.generation_image || null,
          logger_image: c.inst_rms_loger_image || c.loger_image || c.logger_image || null,
          payment3_verification_status: Number(c.inst_pay3_raised_status) === 2 ? 'Approved' : Number(c.inst_pay3_raised_status) === 1 ? 'Raised' : 'Pending',
        }));
        setClaims(mapped);
      } else {
        setClaims([]);
      }
    } catch (err: any) {
      console.error('Fetch Goa SRT Claims error:', err);
      setError(err?.message || 'Failed to fetch claim requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleUpdateClaim = async (id: number, status: 1 | 2) => {
    setUpdatingId(id);
    try {
      await goaAdminService.updateClaimStatus(id, status);
      await fetchClaims();
    } catch (err: any) {
      alert(err?.message || 'Failed to update claim status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((c) => {
      return (
        c.site_name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.claim_invoice.toLowerCase().includes(q) ||
        c.claim_status.toLowerCase().includes(q)
      );
    });
  }, [claims, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 100 });

  const exportCols: ExportColumn<GoaClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: GoaClaimItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r: GoaClaimItem) => r.state },
      { header: 'District', accessor: (r: GoaClaimItem) => r.district },
      { header: 'Site Name', accessor: (r: GoaClaimItem) => r.site_name },
      { header: 'Claim Raised Date', accessor: (r: GoaClaimItem) => r.claim_raised_date },
      { header: 'Claim Invoice', accessor: (r: GoaClaimItem) => r.claim_invoice },
      { header: 'Claim Amount', accessor: (r: GoaClaimItem) => `₹${Number(r.claim_amount || 0).toLocaleString('en-IN')}` },
      { header: 'Claim Update Date', accessor: (r: GoaClaimItem) => r.claim_update_date },
      { header: 'Claim Update by', accessor: (r: GoaClaimItem) => r.claim_update_by },
      { header: 'Claim Status', accessor: (r: GoaClaimItem) => r.claim_status },
      { header: 'Installation Inspection', accessor: (r: GoaClaimItem) => r.installation_inspection },
      { header: 'Document Status', accessor: (r: GoaClaimItem) => r.document_status },
      { header: 'Payment 3 verification Status', accessor: (r: GoaClaimItem) => r.payment3_verification_status },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Goa_SRT_Claim_Request';
  const fileTitle = 'Goa SRT Claim Request Register';

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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:5px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:8mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="Goa SRT Claim Request"
        subtitle="Review vendor installation claim invoices, verify generation telemetry, and authorize disbursements"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'View Claim' },
        ]}
      />

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SRT Claim Request</h2>
            <p className="ax-card__subtitle">Showing {filtered.length} invoice claim submissions in Goa</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search invoice, site, status..."
                size="sm"
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

        {/* ── Responsive Horizontal Scroll Table (Exact user columns) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Claim Raised Date</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Update Date</th>
                <th className="ax-table__th">Claim Update by</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Installation Inspection</th>
                <th className="ax-table__th">Document Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Generation Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Payment 3 verification Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading claim requests...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No claim requests recorded yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: GoaClaimItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{row.state}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district}</td>
                      <td
                        className="ax-table__td"
                        style={{ fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                        onClick={() => setSelectedClaim(row)}
                        title="Click to view full claim details"
                      >
                        {row.site_name}
                      </td>
                      <td className="ax-table__td">{row.claim_raised_date}</td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail file={row.claim_invoice} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{Number(row.claim_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td">{row.claim_update_date}</td>
                      <td className="ax-table__td">{row.claim_update_by}</td>
                      <td className="ax-table__td">
                        <span
                          className="ax-badge"
                          style={{
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: row.claim_status === 'Approved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                            color: row.claim_status === 'Approved' ? '#16a34a' : '#d97706',
                          }}
                        >
                          {row.claim_status}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: row.installation_inspection === 'Passed' ? '#16a34a' : '#b45309' }}>
                          {row.installation_inspection}
                        </span>
                      </td>
                      <td className="ax-table__td">{row.document_status}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={row.generation_image} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={row.logger_image} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: '#2559bf' }}>{row.payment3_verification_status}</span>
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

      {/* ── Claim Details Modal ── */}
      <Modal
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        title="Goa SRT Claim Details"
        subtitle={selectedClaim ? `${selectedClaim.claim_invoice} • ${selectedClaim.site_name}` : ''}
        maxWidth={640}
        footer={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedClaim && selectedClaim.claim_status !== 'Approved' && (
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                disabled={updatingId === selectedClaim.id}
                onClick={async () => {
                  await handleUpdateClaim(selectedClaim.id, 2);
                  setSelectedClaim(null);
                }}
                style={{ padding: '6px 18px', fontSize: 13 }}
              >
                {updatingId === selectedClaim.id ? 'Approving...' : 'Approve Claim'}
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedClaim(null)}
              style={{ padding: '6px 18px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Invoice Number</span>
                <strong style={{ fontSize: 13, fontFamily: 'monospace', color: '#2559bf' }}>{selectedClaim.claim_invoice}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Claim Amount</span>
                <strong style={{ fontSize: 14, color: '#16a34a' }}>₹{Number(selectedClaim.claim_amount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Raised Date</span>
                <strong style={{ fontSize: 13 }}>{selectedClaim.claim_raised_date}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Status</span>
                <strong style={{ fontSize: 13, color: '#2559bf' }}>{selectedClaim.claim_status}</strong>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 6 }}>
                Site & Verification Overview
              </div>
              <div>Site: <strong>{selectedClaim.site_name}</strong> ({selectedClaim.district}, Goa)</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>Installation Inspection: <strong>{selectedClaim.installation_inspection}</strong></div>
              <div style={{ marginTop: 4, fontSize: 12 }}>Documents Status: <strong>{selectedClaim.document_status}</strong></div>
              <div style={{ marginTop: 4, fontSize: 12 }}>Payment 3 Verification: <strong>{selectedClaim.payment3_verification_status}</strong></div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                Updated on {selectedClaim.claim_update_date} by {selectedClaim.claim_update_by}
              </div>
            </div>

            {/* Photographic proofs in modal */}
            {(selectedClaim.generation_image || selectedClaim.logger_image) && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                  Photographic Proofs
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {selectedClaim.generation_image && (
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(resolveGoaMediaUrl(selectedClaim.generation_image))}
                        style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 4, background: '#fff', cursor: 'pointer' }}
                      >
                        <img
                          src={resolveGoaMediaUrl(selectedClaim.generation_image)}
                          alt="Generation"
                          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6 }}
                        />
                      </button>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 4 }}>Generation Image</div>
                    </div>
                  )}
                  {selectedClaim.logger_image && (
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(resolveGoaMediaUrl(selectedClaim.logger_image))}
                        style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 4, background: '#fff', cursor: 'pointer' }}
                      >
                        <img
                          src={resolveGoaMediaUrl(selectedClaim.logger_image)}
                          alt="Logger"
                          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6 }}
                        />
                      </button>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 4 }}>Logger Image</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Image Lightbox Modal ── */}
      {lightboxUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                fontWeight: 'bold',
                fontSize: 16,
              }}
              aria-label="Close Preview"
            >
              ✕
            </button>
            <img
              src={lightboxUrl}
              alt="Enlarged Preview"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GoaSRTInstallationViewClaim;
