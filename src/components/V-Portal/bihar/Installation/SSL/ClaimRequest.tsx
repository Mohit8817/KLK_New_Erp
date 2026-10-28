import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  type SslClaimRaisedItem,
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
`;

export function Bihar_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<SslClaimRaisedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const raiseFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [eligibleSiteIds, setEligibleSiteIds] = useState<number[]>([]);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [siteIdsInput, setSiteIdsInput] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);
  const [raiseError, setRaiseError] = useState<string | null>(null);
  const [raiseSuccess, setRaiseSuccess] = useState<string | null>(null);

  // Edit Claim Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<SslClaimRaisedItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
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
      const [claimList, installedData] = await Promise.all([
        biharSslInstallationService.getViewClaimDetails(),
        biharSslInstallationService.getViewInstalledLights(),
      ]);
      setClaims(Array.isArray(claimList) ? claimList : []);
      if (installedData?.claimed_applicable_ids) {
        setEligibleSiteIds(installedData.claimed_applicable_ids);
        setSiteIdsInput(installedData.claimed_applicable_ids.join(', '));
      }
    } catch (err: any) {
      console.error('[ClaimRequest] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered claims
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return claims.filter((c) => {
      if (q) {
        const matches =
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
          (c.vendor && c.vendor.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          String(c.claim_amount).includes(q) ||
          String(c.claim_site_count).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && String(c.claim_status) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [claims, deferredQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalClaims = claims.length;
    let totalClaimAmount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    claims.forEach((c) => {
      totalClaimAmount += Number(c.claim_amount) || 0;
      if (c.claim_status === 1) approvedCount++;
      else if (c.claim_status === 0) pendingCount++;
    });

    return {
      totalClaims,
      totalClaimAmount,
      approvedCount,
      pendingCount,
      eligibleSitesCount: eligibleSiteIds.length,
    };
  }, [claims, eligibleSiteIds]);

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

  // Handle Raise Claim Submit
  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRaiseError(null);
    setRaiseSuccess(null);

    const cleanSites = siteIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleanSites.length < 100) {
      setRaiseError(`Minimum 100 eligible sites required to raise a claim. Currently provided: ${cleanSites.length}`);
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setRaiseError('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setRaiseError('Please select a claim invoice file.');
      return;
    }

    setRaiseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('claim_amount', claimAmount.trim());
      fd.append('claim_invoice', claimInvoiceFile);
      fd.append('site_ids', cleanSites.join(','));

      const res = await biharSslInstallationService.raiseClaim(fd);
      setRaiseSuccess(res.message || 'Claim Raised Successfully!!!');
      setToastMsg({ type: 'success', text: 'Claim Raised Successfully!' });
      await loadData();
      setTimeout(() => {
        setRaiseModalOpen(false);
        setClaimAmount('');
        setClaimInvoiceFile(null);
      }, 1000);
    } catch (err: any) {
      console.error('[Raise Claim] error:', err);
      setRaiseError(err.message || 'Failed to raise claim request.');
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // Open Edit Claim Modal
  const handleOpenEdit = (claim: SslClaimRaisedItem) => {
    setEditingClaim(claim);
    setEditAmount(String(claim.claim_amount || ''));
    setEditInvoiceFile(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Handle Update Claim Submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    setEditError(null);
    if (!editAmount || Number(editAmount) <= 0) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_ids', String(editingClaim.id));
      fd.append('claim_amount', editAmount.trim());
      if (editInvoiceFile) {
        fd.append('claim_invoice', editInvoiceFile);
      }

      await biharSslInstallationService.updateClaimRaised(fd);
      setToastMsg({ type: 'success', text: 'Claim updated successfully!' });
      await loadData();
      setEditModalOpen(false);
      setEditingClaim(null);
    } catch (err: any) {
      console.error('[Update Claim] error:', err);
      setEditError(err.message || 'Failed to update claim raised.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async (claimId: number) => {
    try {
      const blob = await biharSslInstallationService.downloadClaimPdf(claimId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bihar_SSL_Claim_${claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: `Could not download PDF: ${err.message}` });
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslClaimRaisedItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SslClaimRaisedItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || DASH },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'Claim Raised Date', accessor: (r) => r.claim_raised_date || DASH },
      { header: 'Site Count', accessor: (r) => String(r.claim_site_count || 0) },
      { header: 'Claim Amount', accessor: (r) => String(r.claim_amount || 0) },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date || DASH },
      {
        header: 'Claim Status',
        accessor: (r) => (r.claim_status === 1 ? 'Approved' : r.claim_status === 2 ? 'Rejected' : 'Pending'),
      },
      { header: 'Payment Status', accessor: (r) => r.payment_status || DASH },
      { header: 'Payment Date', accessor: (r) => r.payment_date || DASH },
      { header: 'Payment Amount', accessor: (r) => (r.payment_amount ? String(r.payment_amount) : DASH) },
      { header: 'Payment Remark', accessor: (r) => r.payment_remark || DASH },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_SSL_Claims';
  const fileTitle = 'Bihar SSL Claim Requests Register';

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

  const HEADERS = [
    'Sr. No.',
    'Vendor Name',
    'State',
    'Claim Raised Date',
    'Site Count',
    'Claim Invoice',
    'Claim Amount',
    'Claim Update Date',
    'Claim Status',
    'Payment Status',
    'Payment Date',
    'Payment Amount',
    'Payment Remark',
    'Action',
  ];
  const TOTAL_COLUMNS = HEADERS.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{MODAL_FIELD_STYLES}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Claim Request"
        subtitle="Manage vendor installation payment claims and billing certifications (Min. 100 Sites)"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setRaiseError(null);
                setRaiseSuccess(null);
                setRaiseModalOpen(true);
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1={12} y1={5} x2={12} y2={19} />
                <line x1={5} y1={12} x2={19} y2={12} />
              </svg>
              <span>Raise Claim</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh claims"
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
          label="Total Claims Raised"
          value={num(metrics.totalClaims)}
          sub="Submitted invoices"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Total Claim Amount"
          value={cur(metrics.totalClaimAmount)}
          sub="Combined billing value"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Claims Approved"
          value={num(metrics.approvedCount)}
          sub={`${num(metrics.pendingCount)} pending approval`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <KpiCard
          tone={metrics.eligibleSitesCount >= 100 ? 'cyan' : 'amber'}
          label="Eligible Sites Available"
          value={num(metrics.eligibleSitesCount)}
          sub={metrics.eligibleSitesCount >= 100 ? 'Eligible to raise claim' : 'Min 100 sites needed'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
            </svg>
          }
        />
      </div>

      {/* ── Status Tabs ABOVE Table (per requirement) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Claim request status tabs" style={{ gap: 'var(--ax-space-2)' }}>
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
            <span className="ax-btn__label">All Claims ({claims.length})</span>
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
            <span className="ax-btn__label">Pending ({metrics.pendingCount})</span>
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
            <span className="ax-btn__label">Approved ({metrics.approvedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Main Table Card (exact reference design) ── */}
      <section className="ax-card ax-col--12" id="ssl-claim-tabpanel" role="tabpanel" aria-label="Claim Request">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Claim Request Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Total Claim Amount <b className="ax-num">{cur(metrics.totalClaimAmount)}</b> · Approved <b className="ax-num">{num(metrics.approvedCount)}</b> · Pending <b className="ax-num">{num(metrics.pendingCount)}</b>
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
                placeholder="Search vendor, amount…"
                size="sm"
                ariaLabel="Search claim requests"
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
            style={{ whiteSpace: 'nowrap', minWidth: 1350 }}
          >
            <caption className="ax-visually-hidden">Completed Claim Request Data</caption>
            <thead className="ax-table__head">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action' || h === 'Claim Invoice' || h === 'Claim Status' || h === 'Payment Status'
                        ? { textAlign: 'center' }
                        : h === 'Site Count' || h === 'Claim Amount' || h === 'Payment Amount'
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim requests from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claims found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'No claim requests available.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, index) => {
                  const invoiceUrl = getMediaUrl(r.claim_invoice);
                  const isApproved = r.claim_status === 1;
                  const isRejected = r.claim_status === 2;
                  const isPaid = r.payment_status === 1 || String(r.payment_status).toLowerCase() === 'paid';

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
                        {r.claim_raised_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {num(r.claim_site_count)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {invoiceUrl ? (
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--asw-primary)' }}
                            title="View claim invoice"
                          >
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span>Invoice</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {cur(r.claim_amount)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.claim_update_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Badge tone={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}>
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Badge tone={isPaid ? 'success' : 'warning'}>
                          {r.payment_status || (isPaid ? 'Paid' : 'Pending')}
                        </Badge>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.payment_date || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {r.payment_amount ? cur(r.payment_amount) : DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }} title={r.payment_remark || ''}>
                        {r.payment_remark || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => handleOpenEdit(r)}
                            title="Update claim details"
                          >
                            Edit
                          </button>
                          {r.id && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => handleDownloadPdf(r.id)}
                              title="Download claim summary PDF"
                            >
                              PDF
                            </button>
                          )}
                        </div>
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

      {/* ── Raise Claim Modal (Minimum 100 Sites Rule) ── */}
      {raiseModalOpen && (
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
            if (!raiseSubmitting) setRaiseModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 600,
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
                  Raise SSL Installation Claim
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Minimum 100 verified eligible sites required by policy
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  if (!raiseSubmitting) setRaiseModalOpen(false);
                }}
                disabled={raiseSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24 }}>
              {raiseSuccess && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600, border: '1px solid #a7f3d0' }}>
                  ✓ {raiseSuccess}
                </div>
              )}
              {raiseError && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ✕ {raiseError}
                </div>
              )}

              <form onSubmit={handleRaiseSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Claim Amount */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="rc-claim-amount">
                      <span>Claim Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="rc-claim-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        placeholder="e.g. 250000.00"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Claim Invoice Document */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Claim Invoice Document (PDF / Image)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      ref={raiseFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                    />
                    {!claimInvoiceFile ? (
                      <div
                        className="ax-modern-dropzone"
                        onClick={() => raiseFileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ax-modern-dropzone__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--asw-primary)' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1={12} y1={3} x2={12} y2={15} />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload signed invoice document
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            PDF, JPG, PNG or WEBP (Max 5 MB)
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
                              {claimInvoiceFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(claimInvoiceFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setClaimInvoiceFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Eligible Site IDs Input */}
                  <div className="ax-modern-field">
                    <div className="ax-modern-label">
                      <span>Eligible Site IDs (Comma separated)</span>
                      <span style={{ fontSize: 11.5, color: eligibleSiteIds.length >= 100 ? '#059669' : '#d97706', fontWeight: 700 }}>
                        {eligibleSiteIds.length} Eligible Available
                      </span>
                    </div>
                    <textarea
                      className="ax-modern-textarea"
                      rows={4}
                      value={siteIdsInput}
                      onChange={(e) => setSiteIdsInput(e.target.value)}
                      placeholder="e.g. 101, 102, 103..."
                      required
                    />
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                      Total IDs provided: <b>{siteIdsInput.split(',').filter((s) => s.trim()).length}</b> (Minimum 100 required)
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setRaiseModalOpen(false)}
                    disabled={raiseSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={raiseSubmitting}
                  >
                    {raiseSubmitting ? 'Raising Claim…' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Claim Modal ── */}
      {editModalOpen && editingClaim && (
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
                  Edit Claim Raised (#{editingClaim.id})
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Update claim amount or replace invoice document
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
                  {/* Claim Amount */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="ec-claim-amount">
                      <span>Claim Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="ec-claim-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Replace Invoice */}
                  <div className="ax-modern-field">
                    <div className="ax-modern-label">
                      <span>Replace Invoice Document</span>
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>(Optional)</span>
                    </div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                    />
                    {!editInvoiceFile ? (
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
                            <line x1={12} y1={3} x2={12} y2={15} />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload replacement invoice
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            {editingClaim.claim_invoice ? 'Existing invoice already attached. Upload only to replace.' : 'PDF or Image (Max 5 MB)'}
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
                              <line x1={16} y1="13" x2="8" y2="13" />
                              <line x1={16} y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {editInvoiceFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(editInvoiceFile.size / 1024).toFixed(1)} KB (New file)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setEditInvoiceFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
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

export default Bihar_Installation_SSL_ClaimRequest;
