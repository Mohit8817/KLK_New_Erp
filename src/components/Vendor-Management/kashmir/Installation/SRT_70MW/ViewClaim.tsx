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
  kashmirAdminService,
  resolveKashmirMediaUrl,
  type ClaimRecord,
} from '../../kashmir-services';

type Row = ClaimRecord;
type ClaimState = 'approved' | 'rejected' | 'pending' | 'not_raised';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const claimState = (r: Row): ClaimState => {
  const s = Number(r.inst_claim_status ?? 0);
  if (s === 2) return 'approved';
  if (s === 3) return 'rejected';
  if (s === 1) return 'pending';
  return 'not_raised';
};

const claimStatusLabel = (s: ClaimState) => {
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  if (s === 'pending') return 'Pending';
  return 'Not Raised';
};

const docStatusLabel = (s?: number) => {
  const n = Number(s ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Rejected';
  if (n === 1) return 'Submitted';
  return 'Not Submitted';
};

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {}
  return String(val).slice(0, 10);
};

const fmtMoney = (val?: string | number | null): string => {
  if (!val) return DASH;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return String(val);
  return `₹ ${n.toLocaleString('en-IN')}`;
};

/* ───────── Responsive page CSS (Exact Assam SWP / Bihar SRT reference, all columns scrollable) ───────── */
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

function MediaFileThumbnail({
  file,
  alt = 'Invoice Preview',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const fullUrl = resolveKashmirMediaUrl(file);
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <button
      type="button"
      onClick={() => onClick(fullUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      title={`Click to preview: ${file.split('/').pop()}`}
    >
      {!imgError && (isDirectImage || ext === 'heic') ? (
        <img
          src={fullUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#f1f5f9',
            borderRadius: 4,
            padding: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: 1 }}>
            {ext || 'DOC'}
          </span>
        </div>
      )}
    </button>
  );
}

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 520,
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function ViewClaim() {
  const [claims, setClaims] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search input
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Claim status update modal
  const [claimTarget, setClaimTarget] = useState<Row | null>(null);
  const [newClaimStatus, setNewClaimStatus] = useState<'2' | '3'>('2');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Doc status update modal
  const [docTarget, setDocTarget] = useState<Row | null>(null);
  const [newDocStatus, setNewDocStatus] = useState<'2' | '3'>('2');
  const [docRemarks, setDocRemarks] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const [modalError, setModalError] = useState('');

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await kashmirAdminService.getViewClaim();
      const list = res?.data || [];
      setClaims(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      setErrorMsg(err?.message || 'Failed to fetch claim requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  // Top KPI calculations
  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c) => Number(c.inst_claim_status) === 2).length;
  const rejectedClaims = claims.filter((c) => Number(c.inst_claim_status) === 3).length;
  const pendingClaims = claims.filter((c) => Number(c.inst_claim_status) === 1 || !c.inst_claim_status).length;

  const handleUpdateClaimStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTarget) return;
    if (newClaimStatus === '3' && !claimRemarks.trim()) {
      setModalError('Remarks are required when rejecting a claim.');
      return;
    }
    setSubmittingClaim(true);
    setModalError('');
    try {
      const statusNum = Number(newClaimStatus);
      const res = await kashmirAdminService.updateClaimStatus(claimTarget.id, statusNum, claimRemarks);
      setSuccessMsg(res?.message || 'Claim status updated successfully');
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimTarget.id
            ? { ...c, inst_claim_status: statusNum, inst_claim_update_date: new Date().toISOString() }
            : c
        )
      );
      setClaimTarget(null);
      setClaimRemarks('');
      await fetchClaims();
    } catch (err: any) {
      console.error('Update claim status error:', err);
      setModalError(err?.message || 'Failed to update claim status.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleUpdateDocStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTarget) return;
    if (newDocStatus === '3' && !docRemarks.trim()) {
      setModalError('Remarks are required when rejecting documents.');
      return;
    }
    setSubmittingDoc(true);
    setModalError('');
    try {
      const statusNum = Number(newDocStatus);
      const res = await kashmirAdminService.verifyDocStatus(docTarget.id, statusNum, docRemarks);
      setSuccessMsg(res?.message || 'Document status updated successfully');
      setClaims((prev) =>
        prev.map((c) =>
          c.id === docTarget.id
            ? { ...c, inst_doc_submit: statusNum }
            : c
        )
      );
      setDocTarget(null);
      setDocRemarks('');
      await fetchClaims();
    } catch (err: any) {
      console.error('Update doc status error:', err);
      setModalError(err?.message || 'Failed to update document status.');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Filtered claims
  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((r) => {
      return (
        String(r.state || '').toLowerCase().includes(q) ||
        String(r.district || '').toLowerCase().includes(q) ||
        String(r.site_name || '').toLowerCase().includes(q) ||
        String(r.inst_claim_amount || '').toLowerCase().includes(q) ||
        String(r.inst_claim_update_by || '').toLowerCase().includes(q) ||
        String(r.id || '').includes(q)
      );
    });
  }, [claims, searchQuery]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r: Row, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r: Row) => fmtDate(r.inst_claim_date) },
      { header: 'District', accessor: (r: Row) => r.district || DASH },
      { header: 'Site Name', accessor: (r: Row) => r.site_name || DASH },
      { header: 'Invoice', accessor: (r: Row) => r.inst_claim_invoice || '—' },
      { header: 'Amount', accessor: (r: Row) => `₹ ${Number(r.inst_claim_amount || 0).toLocaleString('en-IN')}` },
      { header: 'Updated Date', accessor: (r: Row) => fmtDate(r.inst_claim_update_date) },
      { header: 'Updated By', accessor: (r: Row) => txt(r.inst_claim_update_by) },
      { header: 'Claim Status', accessor: (r: Row) => claimStatusLabel(claimState(r)) },
      { header: 'Document Status', accessor: (r: Row) => docStatusLabel(r.inst_doc_submit) },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Kashmir_SRT_70MW_Claim_Request';
  const fileTitle = 'Kashmir SRT 70MW Claim Request Register';

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

      <PageHead
        title="Kashmir SRT 70MW Claim Request"
        subtitle="Review claim invoices and update claim and document status for Kashmir SRT 70MW sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Kashmir SRT 70MW', href: '/vendor-management/kashmir/srt70mw/dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchClaims} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
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

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="accent"
          label="Total Request"
          value={totalClaims}
          sub="Claims filed by vendors"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Approved Claims"
          value={approvedClaims}
          sub="Authorized for payment disbursement"
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
          label="Rejected Claims"
          value={rejectedClaims}
          sub="Ineligible or deficient documentation"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Claims"
          value={pendingClaims}
          sub="Awaiting finance audit approval"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Kashmir SRT 70MW Claim Request</h2>
            <p className="ax-card__subtitle">
              Showing {filteredClaims.length} claim record{filteredClaims.length === 1 ? '' : 's'}
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
                placeholder="Search site, district, amount..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportToCSV(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredClaims, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1100 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Invoice</th>
                <th className="ax-table__th">Amount</th>
                <th className="ax-table__th">Updated Date</th>
                <th className="ax-table__th">Updated By</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Document Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading claims...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState
                      title="No claims found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No claims have been submitted by vendors yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: Row, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const cState = claimState(row);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_date)}</td>
                      <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(row.site_name)}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail file={row.inst_claim_invoice} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {fmtMoney(row.inst_claim_amount)}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_update_date)}</td>
                      <td className="ax-table__td">{txt(row.inst_claim_update_by)}</td>
                      <td className="ax-table__td">
                        {cState === 'approved' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : cState === 'rejected' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Raised
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {Number(row.inst_doc_submit) === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : Number(row.inst_doc_submit) === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : Number(row.inst_doc_submit) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Submitted
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)' }}>
                            Not Submitted
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                          {cState === 'approved' || cState === 'rejected' ? (
                            <button
                              type="button"
                              disabled
                              title={`Claim has been ${claimStatusLabel(cState)} (Locked)`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setClaimTarget(row);
                                setNewClaimStatus('2');
                                setClaimRemarks('');
                                setModalError('');
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Verify Status
                            </button>
                          )}

                          {Number(row.inst_doc_submit) === 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocTarget(row);
                                setNewDocStatus('2');
                                setDocRemarks('');
                                setModalError('');
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: '#2563eb',
                                border: '1px solid rgba(37, 99, 235, 0.25)',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Verify Doc
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

      {/* ── Modal: Claim Verification Status ── */}
      <Modal
        open={Boolean(claimTarget)}
        onClose={() => {
          if (!submittingClaim) setClaimTarget(null);
        }}
        title="Verify Installation Claim"
        subtitle={
          claimTarget
            ? `Site: ${txt(claimTarget.site_name)} • District: ${txt(claimTarget.district)}`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setClaimTarget(null)}
              disabled={submittingClaim}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateClaimStatus}
              disabled={submittingClaim}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: newClaimStatus === '2' ? '#2563eb' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingClaim && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Save Claim Status
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateClaimStatus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modalError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {modalError}
            </div>
          )}

          {claimTarget && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Claim Summary</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                >
                  {fmtMoney(claimTarget.inst_claim_amount)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Site Name</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(claimTarget.site_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>District</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(claimTarget.district)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Claim Raised Date</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{fmtDate(claimTarget.inst_claim_date)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Current Status</div>
                  <div style={{ marginTop: 2 }}>
                    <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${claimState(claimTarget) === 'approved' ? 'success' : claimState(claimTarget) === 'rejected' ? 'danger' : 'warning'}`}>
                      {claimStatusLabel(claimState(claimTarget))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Claim Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={newClaimStatus}
              onChange={(e) => setNewClaimStatus(e.target.value as '2' | '3')}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="2">Approved</option>
              <option value="3">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks {newClaimStatus === '3' && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              rows={3}
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              placeholder={newClaimStatus === '3' ? 'Reason for rejecting claim (required)...' : 'Enter verification remarks...'}
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Document Verification Status ── */}
      <Modal
        open={Boolean(docTarget)}
        onClose={() => {
          if (!submittingDoc) setDocTarget(null);
        }}
        title="Verify Installation Documents"
        subtitle={
          docTarget
            ? `Site: ${txt(docTarget.site_name)} • District: ${txt(docTarget.district)}`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setDocTarget(null)}
              disabled={submittingDoc}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateDocStatus}
              disabled={submittingDoc}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: newDocStatus === '2' ? '#2563eb' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingDoc && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Save Document Status
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateDocStatus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modalError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {modalError}
            </div>
          )}

          {docTarget && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Document Review Details</span>
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                  Submitted
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Site Name</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(docTarget.site_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>District</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(docTarget.district)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Claim Amount</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{fmtMoney(docTarget.inst_claim_amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Claim Date</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{fmtDate(docTarget.inst_claim_date)}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Document Verification Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={newDocStatus}
              onChange={(e) => setNewDocStatus(e.target.value as '2' | '3')}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="2">Approve Documents</option>
              <option value="3">Reject Documents</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks {newDocStatus === '3' && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              rows={3}
              value={docRemarks}
              onChange={(e) => setDocRemarks(e.target.value)}
              placeholder={newDocStatus === '3' ? 'Reason for rejecting documents (required)...' : 'Enter document review remarks...'}
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Document / Invoice Lightbox Preview Modal (Exact Assam SWP Style) ── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                Invoice Document Preview
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                  }}
                >
                  Open Original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minWidth: 320,
                minHeight: 240,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : /\.(heic|docx?|xlsx?)($|\?)/i.test(lightboxUrl) ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Direct preview not supported for this file format in browser.
                  </p>
                  <a
                    href={lightboxUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#2563eb',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Download / Open File
                  </a>
                </div>
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Invoice Preview"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewClaim;
