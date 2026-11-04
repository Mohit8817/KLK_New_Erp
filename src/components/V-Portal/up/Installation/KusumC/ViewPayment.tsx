import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpKusumCClaimPaymentItem,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Constants ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

type TabFilter = 'claims' | 'claimable';
type Row = UpKusumCClaimPaymentItem;

/* ───────── Responsive page CSS (Exact Arunachal / Bihar Reference) ───────── */
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
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: #0f172a;
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
`;

/* ───────── KPI card (Exact from Arunachal reference) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

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

/* ── Filter Tabs ── */
const FILTER_TABS: { key: TabFilter; label: string }[] = [
  { key: 'claims', label: 'Claims Raised' },
  { key: 'claimable', label: 'Claim-Eligible Sites' },
];

/* ── Table Export Columns ── */
const EXPORT_COLS: ExportColumn<Row>[] = [
  { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
  { header: 'Claim ID', accessor: (r) => String(r.id) },
  { header: 'Project', accessor: (r) => r.project || 'kusum-c' },
  { header: 'Claim Amount (₹)', accessor: (r) => `₹${Number(r.amount || 0).toLocaleString('en-IN')}` },
  { header: 'Sites In Claim', accessor: (r) => String(r.site_id) },
  { header: 'Status', accessor: (r) => (r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Pending Review') },
  { header: 'Remarks', accessor: (r) => r.remarks || DASH },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function UP_Installation_KusumC_ViewPayment() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<UpKusumCClaimPaymentItem[]>([]);
  const [claimableSites, setClaimableSites] = useState<{ id: number; f_farmer_name: string; inst_doc_status: number }[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('claims');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Add Claim Modal
  const [openAddModal, setOpenAddModal] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Edit Claim Modal
  const [editClaimItem, setEditClaimItem] = useState<UpKusumCClaimPaymentItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSiteIds, setEditSiteIds] = useState<number[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [updatingClaim, setUpdatingClaim] = useState(false);

  // Modal refs for focus trap
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(addModalRef, openAddModal);
  useFocusTrap(editModalRef, !!editClaimItem);

  /* ── Data Loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getKusumCClaims();
      setPayments(res.payments || []);
      setClaimableSites(res.sites || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load Kusum-C claims.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  /* ── Escape key for modals ── */
  useEffect(() => {
    if (!openAddModal && !editClaimItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editClaimItem) setEditClaimItem(null);
        else if (openAddModal) setOpenAddModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAddModal, editClaimItem]);

  /* ── Add Claim Submit ── */
  const handleAddClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSiteIds.length === 0) {
      alert('Please select at least one eligible site.');
      return;
    }
    if (!claimFile) {
      alert('Invoice file is required.');
      return;
    }

    setSubmittingClaim(true);
    const fd = new FormData();
    fd.append('amount', claimAmount);
    selectedSiteIds.forEach((id) => fd.append('site_id[]', String(id)));
    fd.append('file', claimFile);
    fd.append('remarks', claimRemarks);

    try {
      const res = await upInstallationService.storeKusumCClaim(fd);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Payment claim raised successfully!' });
        setOpenAddModal(false);
        setClaimAmount('');
        setSelectedSiteIds([]);
        setClaimFile(null);
        setClaimRemarks('');
        loadData();
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to raise payment claim.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Server error raising claim.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  /* ── Open Edit Claim Modal ── */
  const handleOpenEditClaim = (claim: UpKusumCClaimPaymentItem) => {
    setEditClaimItem(claim);
    setEditAmount(String(claim.amount || ''));
    setEditRemarks(claim.remarks || '');
    let parsed: number[] = [];
    if (typeof claim.site_id === 'string') {
      try {
        parsed = JSON.parse(claim.site_id);
      } catch {
        parsed = claim.site_id.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
      }
    }
    setEditSiteIds(parsed);
    setEditFile(null);
  };

  /* ── Edit Claim Submit ── */
  const handleEditClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClaimItem) return;

    setUpdatingClaim(true);
    const fd = new FormData();
    fd.append('update_id', String(editClaimItem.id));
    fd.append('amount', editAmount);
    editSiteIds.forEach((id) => fd.append('site_id[]', String(id)));
    if (editFile) fd.append('file', editFile);
    if (editRemarks) fd.append('remarks', editRemarks);

    try {
      const res = await upInstallationService.updateKusumCClaim(fd);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Payment claim updated successfully!' });
        setEditClaimItem(null);
        setEditFile(null);
        loadData();
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to update payment claim.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Server error updating claim.' });
    } finally {
      setUpdatingClaim(false);
    }
  };

  const toggleSelectSite = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllClaimable = () => {
    if (selectedSiteIds.length === claimableSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(claimableSites.map((s) => s.id));
    }
  };

  /* ── Filtering claims ── */
  const filteredClaims = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((p) => {
      return (
        String(p.id).includes(q) ||
        String(p.amount).includes(q) ||
        String(p.remarks || '').toLowerCase().includes(q) ||
        String(p.site_id).includes(q)
      );
    });
  }, [payments, search]);

  /* ── Pagination ── */
  const pagedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  /* ── KPI derived counts ── */
  const approvedCount = useMemo(() => payments.filter((p) => p.claim_status === 2).length, [payments]);
  const pendingCount = useMemo(() => payments.filter((p) => p.claim_status === 1 || p.claim_status === 0).length, [payments]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filteredClaims, EXPORT_COLS);
  const handleCsv = () => exportDataToCSV('UP_KusumC_Claims', filteredClaims, EXPORT_COLS);
  const handleExcel = () => exportDataToExcel('UP_KusumC_Claims', filteredClaims, EXPORT_COLS);
  const handlePdf = () => printTableData('UP Kusum-C Claims', filteredClaims, EXPORT_COLS);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Kusum-C Installation Claims & Payments"
        subtitle="Submit stage payment invoices and manage claims for verified Kusum-C solar pump installations"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'View Payment' },
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
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => setOpenAddModal(true)}
              disabled={claimableSites.length === 0}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">ADD CLAIM ({claimableSites.length} eligible)</span>
            </button>
          </div>
        }
      />

      {/* ── Feedback Alert ── */}
      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setFeedbackMsg(null)}>
            {X_ICON}
          </button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row (4 Cards) ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Claims"
              value={payments.length}
              sub="Claims raised to date"
              icon={svgIcon(
                <>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Eligible Sites"
              value={claimableSites.length}
              sub="HOC approved, ready for claim"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Approved Claims"
              value={approvedCount}
              sub="Payment approved"
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Pending Claims"
              value={pendingCount}
              sub="Under review"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Kusum-C claim filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === activeTab;
              const count = t.key === 'claims' ? payments.length : claimableSites.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setSearch('');
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab 1: Claims Raised ── */}
        {activeTab === 'claims' && (
          <section className="ax-card ax-col--12" role="region" aria-label="Raised Payment Claims">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">UP KUSUM-C</span>
                <h2 className="ax-card__title">Raised Payment Claims</h2>
                <p className="ax-card__subtitle">
                  <span className="ax-num">{filteredClaims.length}</span> of <span className="ax-num">{payments.length}</span> claims
                  {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b>
                </p>
              </div>

              <div className="ax-card__actions">
                <div className="ax-cluster" style={actionsRowStyle}>
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
                    placeholder="Search claim ID, amount…"
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

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 900 }}>
                <caption className="ax-visually-hidden">UP Kusum-C Raised Payment Claims</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                    <th className="ax-table__th" scope="col" style={{ width: 90 }}>Claim ID</th>
                    <th className="ax-table__th" scope="col">Claim Amount</th>
                    <th className="ax-table__th" scope="col">Included Site IDs</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Invoice</th>
                    <th className="ax-table__th" scope="col">Remarks</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 120 }}>Action</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading}>
                  {loading && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                        <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                        Loading Kusum-C claim records from server…
                      </td>
                    </tr>
                  )}
                  {!loading && filteredClaims.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <TableEmptyState
                          title="No claims found"
                          message={
                            hasFilters
                              ? 'No claims match your search. Try clearing the filter.'
                              : 'Raised payment claims will appear here.'
                          }
                          onClear={hasFilters ? clearFilters : undefined}
                          clearLabel="Clear filters"
                        />
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    pagedClaims.map((item, idx) => {
                      const srNo = (currentPage - 1) * pageSize + idx + 1;
                      const invoiceUrl = item.file ? resolveUpMediaUrl(item.file) : null;
                      const isApproved = item.claim_status === 2;
                      const isRejected = item.claim_status === 3;

                      return (
                        <tr key={item.id} className="ax-table__row">
                          <td className="ax-table__td ax-num">{srNo}</td>
                          <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>#{item.id}</td>
                          <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>
                            ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                            {txt(item.site_id)}
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {invoiceUrl ? (
                              <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--xs">
                                View Invoice
                              </a>
                            ) : DASH}
                          </td>
                          <td className="ax-table__td">{txt(item.remarks)}</td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <span
                              className={`ax-badge ax-badge--soft ax-badge--pill ${
                                isApproved
                                  ? 'ax-badge--success'
                                  : isRejected
                                  ? 'ax-badge--danger'
                                  : 'ax-badge--warning'
                              }`}
                            >
                              <span className="ax-badge__dot" />
                              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleOpenEditClaim(item)}
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
        )}

        {/* ── Tab 2: Claimable Sites ── */}
        {activeTab === 'claimable' && (
          <section className="ax-card ax-col--12" role="region" aria-label="Claim-Eligible Sites">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">UP KUSUM-C</span>
                <h2 className="ax-card__title">Sites Eligible for Claim</h2>
                <p className="ax-card__subtitle">
                  Verified sites with approved HOC that have not been claimed yet ·{' '}
                  <span className="ax-num">{claimableSites.length}</span> sites available
                </p>
              </div>

              <div className="ax-card__actions">
                <div className="ax-cluster" style={actionsRowStyle}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => setOpenAddModal(true)}
                    disabled={selectedSiteIds.length === 0}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5l0 14" />
                      <path d="M5 12l14 0" />
                    </svg>
                    <span className="ax-btn__label">Raise Claim ({selectedSiteIds.length} selected)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 700 }}>
                <caption className="ax-visually-hidden">Sites Eligible for Kusum-C Claims</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedSiteIds.length > 0 && selectedSiteIds.length === claimableSites.length}
                        onChange={selectAllClaimable}
                        aria-label="Select all sites"
                      />
                    </th>
                    <th className="ax-table__th" scope="col" style={{ width: 80 }}>Site ID</th>
                    <th className="ax-table__th" scope="col">Farmer Name</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>HOC Status</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading}>
                  {claimableSites.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <TableEmptyState
                          title="No claim-eligible sites"
                          message="Sites will appear here after verification and HOC approval."
                        />
                      </td>
                    </tr>
                  ) : (
                    claimableSites.map((s) => (
                      <tr key={s.id} className="ax-table__row">
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.includes(s.id)}
                            onChange={() => toggleSelectSite(s.id)}
                            aria-label={`Select site ${s.id}`}
                          />
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 700, fontFamily: 'var(--ax-font-mono, monospace)' }}>#{s.id}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{s.f_farmer_name}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success">
                            <span className="ax-badge__dot" />
                            HOC Approved
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => {
                              setSelectedSiteIds([s.id]);
                              setOpenAddModal(true);
                            }}
                          >
                            Claim This Site
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         ADD CLAIM MODAL (createPortal + useFocusTrap)
         ═══════════════════════════════════════════════════════════════════ */}
      {openAddModal &&
        createPortal(
          <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="kusumc-add-claim-title">
            <div className="ax-modal__backdrop" onClick={() => setOpenAddModal(false)} />
            <div ref={addModalRef} className="ax-modal__dialog" style={{ maxWidth: 560 }}>
              <div className="ax-modal__header">
                <h2 className="ax-modal__title" id="kusumc-add-claim-title" style={{ fontSize: 15, fontWeight: 700 }}>
                  Raise Kusum-C Installation Payment Claim
                </h2>
                <button type="button" className="ax-modal__close" onClick={() => setOpenAddModal(false)} aria-label="Close dialog">
                  {X_ICON}
                </button>
              </div>

              <form onSubmit={handleAddClaimSubmit}>
                <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Selected Sites for Claim ({selectedSiteIds.length}) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ maxHeight: 130, overflowY: 'auto', border: '1px solid var(--ax-border)', borderRadius: 6, padding: 8 }}>
                      {claimableSites.map((s) => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.includes(s.id)}
                            onChange={() => toggleSelectSite(s.id)}
                          />
                          <span><strong>#{s.id}</strong> — {s.f_farmer_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Total Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="ax-input"
                      placeholder="e.g. 150000"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Invoice Document (PDF/JPG, max 5MB) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*,application/pdf"
                      className="ax-input"
                      onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Remarks <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      className="ax-textarea"
                      rows={2}
                      required
                      placeholder="e.g. Installation payment claim for verified sites"
                      value={claimRemarks}
                      onChange={(e) => setClaimRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setOpenAddModal(false)} disabled={submittingClaim}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingClaim}>
                    {submittingClaim ? 'Submitting…' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════════════════════════════════════════════════════════════
         EDIT CLAIM MODAL (createPortal + useFocusTrap)
         ═══════════════════════════════════════════════════════════════════ */}
      {editClaimItem &&
        createPortal(
          <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="kusumc-edit-claim-title">
            <div className="ax-modal__backdrop" onClick={() => setEditClaimItem(null)} />
            <div ref={editModalRef} className="ax-modal__dialog" style={{ maxWidth: 540 }}>
              <div className="ax-modal__header">
                <h2 className="ax-modal__title" id="kusumc-edit-claim-title" style={{ fontSize: 15, fontWeight: 700 }}>
                  Edit Claim #{editClaimItem.id}
                </h2>
                <button type="button" className="ax-modal__close" onClick={() => setEditClaimItem(null)} aria-label="Close dialog">
                  {X_ICON}
                </button>
              </div>

              <form onSubmit={handleEditClaimSubmit}>
                <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      className="ax-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      New Invoice File (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="ax-input"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Remarks
                    </label>
                    <textarea
                      className="ax-textarea"
                      rows={2}
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditClaimItem(null)} disabled={updatingClaim}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={updatingClaim}>
                    {updatingClaim ? 'Updating…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_KusumC_ViewPayment;