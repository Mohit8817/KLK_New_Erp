import { useState, useMemo, useEffect, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wClaimItem,
} from '../../up-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ───────── Responsive page CSS (Exact Arunachal / Solar ERP Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }

  /* Modal & Lightbox Styles */
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
    padding: 16px 20px;
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
  .ax-modal__body {
    padding: 0; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
`;

/* ── Close icon ── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI Card (Exact from Arunachal reference) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Modal Helper (Arunachal Pattern) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogStyle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogStyle?: React.CSSProperties;
  children: ReactNode;
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Status Filter Type ── */
type ClaimStatusFilter = 'all' | 'submitted' | 'approved' | 'rejected';

/* ── Export Columns ── */
const EXPORT_COLS: ExportColumn<UpSsl18wClaimItem>[] = [
  { header: 'S.No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
  { header: 'Vendor', accessor: (r) => r.vendor || DASH },
  { header: 'Date', accessor: (r) => r.date || DASH },
  { header: 'State', accessor: (r) => r.state || 'UP' },
  { header: 'Light Count', accessor: (r) => String(r.light_count ?? r.site_id ?? DASH) },
  { header: 'Amount', accessor: (r) => (r.amount || r.claim_amount ? `₹${Number(r.amount || r.claim_amount).toLocaleString('en-IN')}` : DASH) },
  { header: 'Remarks', accessor: (r) => r.remarks || DASH },
  { header: 'Claim Status', accessor: (r) => (r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Submitted') },
  { header: 'Payment Amount', accessor: (r) => (r.payment_amount ? `₹${Number(r.payment_amount).toLocaleString('en-IN')}` : DASH) },
  { header: 'Payment Balance', accessor: (r) => (r.payment_balance ? `₹${Number(r.payment_balance).toLocaleString('en-IN')}` : DASH) },
  { header: 'Payment Date', accessor: (r) => r.payment_date || DASH },
  { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || DASH },
  { header: 'Payment Status', accessor: (r) => (r.payment_status === 1 ? 'Complete' : 'Pending') },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */
export function UP_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<UpSsl18wClaimItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Claim Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fetchingEligible, setFetchingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [eligibleIds, setEligibleIds] = useState<number[]>([]);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [claimInvoice, setClaimInvoice] = useState<File | null>(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Claim Modal
  const [editClaim, setEditClaim] = useState<UpSsl18wClaimItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editInvoice, setEditInvoice] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  /* ── Auto-dismiss toast ── */
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      const vendorId = user?.id || user?.vendor_id;
      const res = await upInstallationService.getSsl18wClaims(vendorId);
      setClaims(res || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to fetch claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Open Add Modal & Fetch eligible lights ── */
  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setClaimAmount('');
    setClaimRemarks('');
    setClaimInvoice(null);
    setFetchingEligible(true);

    try {
      const eligible = await upInstallationService.getSsl18wClaimApplicableLights();
      setEligibleCount(eligible.count);
      setEligibleIds(eligible.ids);
    } catch (err: any) {
      console.error('Failed to load eligible lights:', err);
      setEligibleCount(0);
      setEligibleIds([]);
    } finally {
      setFetchingEligible(false);
    }
  };

  /* ── Submit Add Claim ── */
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimAmount.trim()) {
      alert('Please enter Claim Amount');
      return;
    }
    if (!claimInvoice) {
      alert('Please attach Claim Invoice file');
      return;
    }

    setSubmittingAdd(true);
    const fd = new FormData();
    fd.append('claim_amount', claimAmount);
    fd.append('claim_invoice', claimInvoice);
    fd.append('light_count', String(eligibleCount));
    fd.append('light_ids', eligibleIds.join(','));
    if (claimRemarks) fd.append('remarks', claimRemarks);

    try {
      const res = await upInstallationService.storeSsl18wClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Claim submitted successfully!' });
        setAddModalOpen(false);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while submitting claim.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  /* ── Open Edit Modal ── */
  const handleOpenEdit = (c: UpSsl18wClaimItem) => {
    setEditClaim(c);
    setEditAmount(String(c.amount || c.claim_amount || ''));
    setEditRemarks(c.remarks || '');
    setEditInvoice(null);
  };

  /* ── Submit Edit Claim ── */
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editClaim) return;

    setSubmittingEdit(true);
    const fd = new FormData();
    fd.append('claim_id', String(editClaim.id));
    if (editAmount) fd.append('amount', editAmount);
    if (editRemarks) fd.append('remarks', editRemarks);
    if (editInvoice) fd.append('claim_invoice', editInvoice);

    try {
      const res = await upInstallationService.updateSsl18wClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Claim updated successfully!' });
        setEditClaim(null);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to update claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error updating claim.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  /* ── KPI Counts ── */
  const kpiCounts = useMemo(() => {
    const total = claims.length;
    const approved = claims.filter((c) => c.claim_status === 2).length;
    const rejected = claims.filter((c) => c.claim_status === 3).length;
    const pending = total - approved - rejected;
    return { total, approved, rejected, pending };
  }, [claims]);

  /* ── Filter + Search ── */
  const filteredClaims = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (statusFilter === 'approved' && c.claim_status !== 2) return false;
      if (statusFilter === 'rejected' && c.claim_status !== 3) return false;
      if (statusFilter === 'submitted' && (c.claim_status === 2 || c.claim_status === 3)) return false;
      if (q) {
        return Object.values(c).some(
          (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [claims, search, statusFilter]);

  const hasFilters = !!search || statusFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  /* ── Pagination ── */
  const pagedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filteredClaims, EXPORT_COLS);
  const handleCsv = () => exportDataToCSV('UP_SSL_18W_Claims', filteredClaims, EXPORT_COLS);
  const handleExcel = () => exportDataToExcel('UP_SSL_18W_Claims', filteredClaims, EXPORT_COLS);
  const handlePdf = () => printTableData('UP SSL 18W Claim Requests', filteredClaims, EXPORT_COLS);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="UP SSL 18w Claim Request"
        subtitle="Submit payment claims for verified 18W solar street light installations and track disbursement"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={handleOpenAddModal}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Add Claim</span>
            </button>
          </div>
        }
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{toast.message}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Claims"
              value={kpiCounts.total.toLocaleString('en-IN')}
              sub="All claims raised"
              icon={svgIcon(
                <>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Approved Claims"
              value={kpiCounts.approved.toLocaleString('en-IN')}
              sub="Claims approved for payment"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Pending Claims"
              value={kpiCounts.pending.toLocaleString('en-IN')}
              sub="Under review"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Rejected Claims"
              value={kpiCounts.rejected.toLocaleString('en-IN')}
              sub="Claims rejected"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15 9l-6 6" />
                  <path d="M9 9l6 6" />
                </>
              )}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP SSL 18W Claim Requests">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">UP SSL 18W</span>
              <h2 className="ax-card__title">Claim Request Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredClaims.length}</span> of <span className="ax-num">{claims.length}</span> claims
                {' '}· Approved <b className="ax-num">{kpiCounts.approved}</b> · Pending <b className="ax-num">{kpiCounts.pending}</b> · Rejected <b className="ax-num">{kpiCounts.rejected}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by claim status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ClaimStatusFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Claim Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, amount…"
                  size="sm"
                  ariaLabel="Search claims"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">UP SSL 18W Claim Request Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">S.No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Light Count</th>
                  <th className="ax-table__th" scope="col">Invoice</th>
                  <th className="ax-table__th" scope="col">Amount</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment Amount</th>
                  <th className="ax-table__th" scope="col">Payment Balance</th>
                  <th className="ax-table__th" scope="col">Payment Date</th>
                  <th className="ax-table__th" scope="col">Payment Remarks</th>
                  <th className="ax-table__th" scope="col">Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={15} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading UP SSL 18W claim records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No claim records found"
                        message={
                          hasFilters
                            ? 'No claims match your filters. Try clearing filters or search term.'
                            : 'No claims raised yet. Click "Add Claim" to get started.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagedClaims.map((c, idx) => {
                    const sr = (currentPage - 1) * pageSize + idx + 1;
                    const invoiceUrl = c.file ? resolveUpMediaUrl(c.file) : '';
                    const isApproved = c.claim_status === 2;
                    const isRejected = c.claim_status === 3;
                    const isPaid = c.payment_status === 1;

                    return (
                      <tr key={c.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{sr}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(c.vendor)}</td>
                        <td className="ax-table__td">{txt(c.date)}</td>
                        <td className="ax-table__td">{c.state ? c.state.toUpperCase() : 'UP'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, textAlign: 'center' }}>{txt(c.light_count ?? c.site_id)}</td>
                        <td className="ax-table__td">
                          {invoiceUrl ? (
                            <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--xs">
                              View Invoice
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>
                          {c.amount || c.claim_amount ? `₹${Number(c.amount || c.claim_amount).toLocaleString('en-IN')}` : DASH}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(c.remarks)}</td>

                        {/* Claim Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isApproved
                                ? 'ax-badge--success'
                                : isRejected
                                ? 'ax-badge--danger'
                                : 'ax-badge--info'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Submitted'}
                          </span>
                        </td>

                        <td className="ax-table__td">{c.payment_amount ? `₹${Number(c.payment_amount).toLocaleString('en-IN')}` : DASH}</td>
                        <td className="ax-table__td">{c.payment_balance ? `₹${Number(c.payment_balance).toLocaleString('en-IN')}` : DASH}</td>
                        <td className="ax-table__td">{txt(c.payment_date)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 140, whiteSpace: 'normal', fontSize: 12 }}>{txt(c.payment_remarks)}</td>

                        {/* Payment Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isPaid ? 'Complete' : 'Pending'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => handleOpenEdit(c)}
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

          {/* ── Left-aligned Pagination ── */}
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredClaims.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════ Add Claim Modal ═══════════ */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        labelledBy="add-claim-modal-title"
        dialogStyle={{ maxWidth: 560 }}
      >
        <div className="ax-modal__header">
          <h2 id="add-claim-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Raise Installation Claim
          </h2>
          <button type="button" className="ax-modal__close" onClick={() => setAddModalOpen(false)} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <form onSubmit={handleAddSubmit}>
          <div className="ax-modal__body" style={{ padding: 20 }}>
            {fetchingEligible ? (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <span className="ax-spinner" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: 'middle' }} />
                Checking claim-applicable lights…
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-cyan) 10%, transparent)', borderRadius: 8, fontSize: 13, border: '1px solid color-mix(in oklab, var(--ax-viz-cyan) 25%, transparent)' }}>
                <b>Eligible Lights for Claim:</b>{' '}
                <span style={{ color: 'var(--ax-viz-cyan)', fontWeight: 700 }}>{eligibleCount}</span> lights verified & ready.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  className="ax-input"
                  placeholder="e.g. 250000"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Claim Invoice (PDF or Image) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  className="ax-input"
                  onChange={(e) => setClaimInvoice(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Remarks
                </label>
                <textarea
                  rows={3}
                  className="ax-textarea"
                  placeholder="e.g. Milestone 1 claim for verified lights"
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setAddModalOpen(false)} disabled={submittingAdd}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingAdd || fetchingEligible}>
              {submittingAdd ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════ Edit Claim Modal ═══════════ */}
      <Modal
        open={!!editClaim}
        onClose={() => setEditClaim(null)}
        labelledBy="edit-claim-modal-title"
        dialogStyle={{ maxWidth: 540 }}
      >
        <div className="ax-modal__header">
          <h2 id="edit-claim-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Edit Claim #{editClaim?.id}
          </h2>
          <button type="button" className="ax-modal__close" onClick={() => setEditClaim(null)} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <form onSubmit={handleEditSubmit}>
          <div className="ax-modal__body" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Claim Amount (₹)
                </label>
                <input
                  type="number"
                  className="ax-input"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Update Invoice File (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="ax-input"
                  onChange={(e) => setEditInvoice(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Remarks
                </label>
                <textarea
                  rows={3}
                  className="ax-textarea"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditClaim(null)} disabled={submittingEdit}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingEdit}>
              {submittingEdit ? 'Saving…' : 'Update Claim'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UP_Installation_SSL_ClaimRequest;