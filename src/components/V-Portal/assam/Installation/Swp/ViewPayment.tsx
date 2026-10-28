import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  assamSwpService,
  resolveAssamMediaUrl,
  type ClaimItem,
  type ClaimEligibleSite,
} from '../../assam-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
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

  /* Multi-select site picker */
  .asw-site-select-box {
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-md, 8px);
    padding: 8px 12px;
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .asw-site-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 6px 8px;
    border-radius: var(--ax-radius-sm, 4px);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .asw-site-item:hover {
    background: var(--ax-surface-solid, #ffffff);
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
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: var(--ax-surface-solid, #fff);
    border-radius: var(--ax-radius-lg, 12px); border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); overflow: hidden;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    border: none; background: transparent; cursor: pointer; padding: 4px;
    border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted);
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong); }
  .ax-modal__body { padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 12px 20px; border-top: 1px solid var(--ax-border-subtle, #f1f5f9);
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

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
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
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
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component (matching Bihar SRT / ULA reference) ── */
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

const fmtMoney = (val?: string | number) => {
  const n = Number(val || 0);
  return '₹' + n.toLocaleString('en-IN');
};

const fmtDate = (s?: string) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return s.slice(0, 10);
};

const renderClaimStatusBadge = (status: number) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Raised (Pending)</Badge>;
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const parseSiteIds = (val?: any): (number | string)[] => {
  if (val === null || val === undefined || val === '') return [];
  if (typeof val === 'number') return [val];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
        const n = Number(item);
        return isNaN(n) ? String(item).trim() : n;
      })
      .filter((x) => x !== '' && x !== null && x !== undefined);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
            const n = Number(item);
            return isNaN(n) ? String(item).trim() : n;
          })
          .filter((x) => x !== '' && x !== null && x !== undefined);
      }
      if (typeof parsed === 'number') return [parsed];
    } catch {}
    const parts = trimmed
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.map((p) => {
        const n = Number(p);
        return isNaN(n) ? p : n;
      });
    }
    return [trimmed];
  }
  return [];
};

export function ViewPayment() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [eligibleSites, setEligibleSites] = useState<ClaimEligibleSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3'>('all');

  // Add Claim Modal (API 12)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addSelectedSites, setAddSelectedSites] = useState<number[]>([]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addRemarks, setAddRemarks] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Update Claim Modal (API 13)
  const [editClaim, setEditClaim] = useState<ClaimItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSelectedSites, setEditSelectedSites] = useState<(number | string)[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Load Claims Data (API 11)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assamSwpService.getViewClaims();
      setClaims(res.data || []);
      setEligibleSites(res.sites || []);
    } catch (err: any) {
      console.error('Failed to load installation claims:', err);
      setError(err?.message || 'Failed to load installation claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Claim Submit (API 12)
  const handleAddClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) < 1) {
      setAddError('Please enter a valid claim amount (minimum 1).');
      return;
    }
    if (addSelectedSites.length === 0) {
      setAddError('Please select at least one eligible installation site.');
      return;
    }
    if (!addFile) {
      setAddError('Invoice document is required.');
      return;
    }
    if (!addRemarks.trim()) {
      setAddError('Claim remarks are required.');
      return;
    }

    setAddSubmitting(true);
    setAddError(null);
    try {
      const formData = new FormData();
      formData.append('amount', addAmount.trim());
      addSelectedSites.forEach((id) => {
        formData.append('site_id[]', String(id));
      });
      formData.append('file', addFile);
      formData.append('remarks', addRemarks.trim());

      const res = await assamSwpService.addClaim(formData);
      setAddSuccess(res.message || 'Payment claim raised successfully!');
      setTimeout(() => {
        setAddModalOpen(false);
        setAddAmount('');
        setAddSelectedSites([]);
        setAddFile(null);
        setAddRemarks('');
        setAddSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to raise payment claim:', err);
      setAddError(err?.message || 'Failed to raise payment claim');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (c: ClaimItem) => {
    setEditClaim(c);
    setEditAmount(String(c.amount || ''));
    setEditRemarks(c.remarks || '');
    setEditFile(null);
    setEditError(null);
    setEditSuccess(null);

    let siteIds: (number | string)[] = parseSiteIds(c.site_id);
    if (siteIds.length > 0) {
      siteIds = siteIds.map((sid) => {
        if (typeof sid === 'string' && isNaN(Number(sid))) {
          const match = eligibleSites.find(
            (s) => s.farmer_name && s.farmer_name.trim().toLowerCase() === sid.trim().toLowerCase()
          );
          return match ? match.id : sid;
        }
        return sid;
      });
    } else if (c.site_id) {
      const match = eligibleSites.find(
        (s) => s.farmer_name && s.farmer_name.trim().toLowerCase() === String(c.site_id).trim().toLowerCase()
      );
      siteIds = match ? [match.id] : [c.site_id as any];
    }
    setEditSelectedSites(siteIds);
  };

  // Handle Update Claim Submit (API 13)
  const handleUpdateClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClaim) return;
    if (!editAmount || Number(editAmount) < 1) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    // Determine sites to send: fallback to existing claim site(s) if selection array is empty
    let sitesToSend = editSelectedSites;
    if (sitesToSend.length === 0) {
      sitesToSend = parseSiteIds(editClaim.site_id);
    }
    if (sitesToSend.length === 0 && editClaim.site_id) {
      sitesToSend = [editClaim.site_id as any];
    }
    if (sitesToSend.length === 0 && (editClaim as any).site) {
      sitesToSend = [(editClaim as any).site];
    }

    if (sitesToSend.length === 0) {
      setEditError('Please select at least one site.');
      return;
    }
    if (!editRemarks.trim()) {
      setEditError('Claim remarks are required.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const formData = new FormData();
      // Backend validates: 'update_id' => 'required'
      formData.append('update_id', String(editClaim.id));
      formData.append('id', String(editClaim.id));
      formData.append('amount', editAmount.trim());
      // Backend validates: 'site_id' => 'required|array'
      // Must only append array items with 'site_id[]'
      sitesToSend.forEach((sid) => {
        formData.append('site_id[]', String(sid));
      });
      if (editFile) {
        formData.append('file', editFile);
      }
      formData.append('remarks', editRemarks.trim());

      const res = await assamSwpService.updateClaim(formData);
      setEditSuccess(res.message || 'Payment claim updated successfully!');
      setTimeout(() => {
        setEditClaim(null);
        setEditAmount('');
        setEditSelectedSites([]);
        setEditFile(null);
        setEditRemarks('');
        setEditSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update payment claim:', err);
      setEditError(err?.message || 'Failed to update payment claim');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      const st = Number(statusFilter);
      list = list.filter((c) => c.claim_status === st);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const idStr = String(c.id);
        const amountStr = String(c.amount || '');
        const remarksStr = (c.remarks || '').toLowerCase();
        const dateStr = (c.date || '').toLowerCase();
        const siteStr = String(c.site_id || '').toLowerCase();
        return (
          idStr.includes(q) ||
          amountStr.includes(q) ||
          remarksStr.includes(q) ||
          dateStr.includes(q) ||
          siteStr.includes(q)
        );
      });
    }
    return list;
  }, [claims, search, statusFilter]);

  // Pagination hook
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // KPI Calculations
  const totalClaimsCount = claims.length;
  const approvedClaims = claims.filter((c) => c.claim_status === 2).length;
  const pendingClaims = claims.filter((c) => c.claim_status === 1).length;
  const totalAmountSum = claims.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const eligibleSitesCount = eligibleSites.length;

  // Export Columns definition
  const exportCols: ExportColumn<ClaimItem>[] = useMemo(() => [
    { header: 'Submission Date', accessor: (r: ClaimItem) => fmtDate(r.date) },
    { header: 'Covered Sites', accessor: (r: ClaimItem) => String(r.site_id || '—') },
    { header: 'Claim Amount', accessor: (r: ClaimItem) => fmtMoney(r.amount) },
    { header: 'Invoice File', accessor: (r: ClaimItem) => (r.file ? resolveAssamMediaUrl(r.file) : '—') },
    { header: 'Remarks', accessor: (r: ClaimItem) => r.remarks || '—' },
    {
      header: 'Status',
      accessor: (r: ClaimItem) =>
        r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Raised (Pending)',
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Assam_SWP_Claims';
  const fileTitle = 'Assam SWP Vendor Claims & Invoice Register';

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
      alert('Claims data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Claims data copied to clipboard!');
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

  const headers = ['S.no', 'Submission Date', 'Covered Sites / Farmers', 'Claim Amount', 'Invoice Document', 'Remarks', 'Status', 'Action'];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact Bihar pattern, NO refresh button) ── */}
      <PageHead
        title="Assam SWP Claims & Payments"
        subtitle="Track vendor installation claims, invoice submission, and disbursement status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'SWP' },
          { label: 'Claims & Payments' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => setAddModalOpen(true)}
            >
              <span className="ax-btn__label">+ Raise New Claim</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Claims</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims Raised"
          value={totalClaimsCount.toLocaleString('en-IN')}
          sub={`${approvedClaims} approved · ${pendingClaims} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Claimed Amount"
          value={fmtMoney(totalAmountSum)}
          sub="Disbursement requests"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Claims"
          value={pendingClaims.toLocaleString('en-IN')}
          sub="Under review by administration"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Eligible Unclaimed"
          value={eligibleSitesCount.toLocaleString('en-IN')}
          sub="Sites ready to claim"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2l4 -4" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact Bihar SRT table card layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Vendor Claims & Invoice Registry">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Claims & Invoice Registry</h2>
            <p className="ax-card__subtitle">
              Listing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Approved <b className="ax-num">{approvedClaims}</b> · Pending <b className="ax-num">{pendingClaims}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="swp_claim_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="1">Raised (Pending)</option>
                <option value="2">Approved</option>
                <option value="3">Rejected</option>
              </select>

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
                value={search}
                onChange={setSearch}
                placeholder="Search claim, amount, site…"
                size="sm"
                ariaLabel="Search vendor claims"
              />

              {/* TableExportToolbar without columns toggle (F 1I Columns section removed) */}
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1050 }}
          >
            <caption className="ax-visually-hidden">Vendor Claims & Invoice Registry</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' ? { textAlign: 'right' } : undefined}
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claim records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No claims have been submitted yet. Click "+ Raise New Claim" to submit your first claim.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((c, index) => {
                  const invoiceUrl = resolveAssamMediaUrl(c.file);
                  return (
                    <tr key={c.id} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
       
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {fmtDate(c.date)}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {String(c.site_id || '—')}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <strong style={{ fontSize: '14px', color: 'var(--asw-primary)' }}>
                          {fmtMoney(c.amount)}
                        </strong>
                      </td>
                      <td className="ax-table__td">
                        {invoiceUrl ? (
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: 'var(--asw-primary)', fontWeight: 600 }}
                          >
                            View Invoice ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)', maxWidth: 220, display: 'inline-block' }}>
                          {c.remarks || '—'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        {renderClaimStatusBadge(c.claim_status)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => openEditModal(c)}
                          >
                            Edit Claim
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (exact Bihar pagination structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Add Claim Modal (API 12) ── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Raise Installation Payment Claim"
        subtitle="Submit payment invoice for verified & doc-approved Assam SWP sites"
        maxWidth={620}
      >
        {addSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {addSuccess}</span>
          </div>
        )}

        {addError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{addError}</span>
          </div>
        )}

        <form onSubmit={handleAddClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ax-field">
            <label className="ax-label" htmlFor="add_amount">
              Claim Amount (₹) <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              id="add_amount"
              type="number"
              className="ax-input"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
              min={1}
            />
          </div>

          <div className="ax-field">
            <label className="ax-label">
              Select Eligible Completed Sites <span style={{ color: 'red' }}>*</span> ({addSelectedSites.length} selected)
            </label>
            {eligibleSites.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--ax-text-muted)', padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6 }}>
                No unclaimed eligible sites available (Sites must be verified and doc-approved).
              </div>
            ) : (
              <div className="asw-site-select-box">
                {eligibleSites.map((site) => {
                  const isChecked = addSelectedSites.includes(site.id);
                  return (
                    <label key={site.id} className="asw-site-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setAddSelectedSites((prev) => prev.filter((id) => id !== site.id));
                          } else {
                            setAddSelectedSites((prev) => [...prev, site.id]);
                          }
                        }}
                      />
                      <span>
                        <b>{site.farmer_name || 'Farmer'}</b> {site.district ? `(${site.district})` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ax-field">
            <label className="ax-label" htmlFor="add_file">
              Invoice / Bill File (PDF / JPG / PNG) <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              id="add_file"
              type="file"
              className="ax-input"
              accept=".pdf,image/*"
              required
              onChange={(e) => setAddFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="ax-field">
            <label className="ax-label" htmlFor="add_remarks">
              Claim Remarks / Description <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              id="add_remarks"
              className="ax-input"
              rows={3}
              value={addRemarks}
              onChange={(e) => setAddRemarks(e.target.value)}
              placeholder="Enter remarks or invoice details..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setAddModalOpen(false)}
              disabled={addSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={addSubmitting || eligibleSites.length === 0}
            >
              {addSubmitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Claim Modal (API 13) ── */}
      <Modal
        open={!!editClaim}
        onClose={() => setEditClaim(null)}
        title="Edit Claim"
        subtitle="Update claim amount, remarks, or replace invoice document"
        maxWidth={620}
      >
        {editSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {editSuccess}</span>
          </div>
        )}

        {editError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{editError}</span>
          </div>
        )}

        {editClaim && (
          <form onSubmit={handleUpdateClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ax-field">
              <label className="ax-label" htmlFor="edit_amount">
                Claim Amount (₹) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="edit_amount"
                type="number"
                className="ax-input"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
                min={1}
              />
            </div>

            <div className="ax-field">
              <label className="ax-label">
                Included Sites ({editSelectedSites.length > 0 ? editSelectedSites.length : 1} selected) <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ fontSize: '13px', color: 'var(--ax-text-muted)', padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, marginBottom: eligibleSites.length > 0 ? 8 : 0 }}>
                Sites in this claim:{' '}
                <b>
                  {(() => {
                    const names = editSelectedSites
                      .map((id) => {
                        const match = eligibleSites.find((s) => String(s.id) === String(id));
                        return match ? match.farmer_name : String(id);
                      })
                      .filter(Boolean);
                    if (names.length > 0) return names.join(', ');
                    return String(editClaim.site_id || 'Included Site');
                  })()}
                </b>
              </div>
              {eligibleSites.length > 0 && (
                <div className="asw-site-select-box" style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {eligibleSites.map((site) => {
                    const isChecked = editSelectedSites.some((id) => String(id) === String(site.id));
                    return (
                      <label key={site.id} className="asw-site-item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSelectedSites((prev) => [...prev, site.id]);
                            } else {
                              setEditSelectedSites((prev) => prev.filter((id) => String(id) !== String(site.id)));
                            }
                          }}
                        />
                        <span>#{site.id} — {site.farmer_name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ax-field">
              <label className="ax-label" htmlFor="edit_file">
                Replace Invoice File (Optional, leave blank to keep existing)
              </label>
              <input
                id="edit_file"
                type="file"
                className="ax-input"
                accept=".pdf,image/*"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
              />
              {editClaim.file && (
                <div style={{ marginTop: 4, fontSize: '12px' }}>
                  Current invoice: <a href={resolveAssamMediaUrl(editClaim.file)} target="_blank" rel="noopener noreferrer">View Current ↗</a>
                </div>
              )}
            </div>

            <div className="ax-field">
              <label className="ax-label" htmlFor="edit_remarks">
                Claim Remarks / Description <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="edit_remarks"
                className="ax-input"
                rows={3}
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setEditClaim(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={editSubmitting}
              >
                {editSubmitting ? 'Updating…' : 'Update Claim'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default ViewPayment;
