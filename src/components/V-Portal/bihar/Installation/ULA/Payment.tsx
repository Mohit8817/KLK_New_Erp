import { useState, useMemo, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type PaymentClaimItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  usePagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_EYE = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

const inr = (v: unknown) => `₹${Number(v || 0).toLocaleString('en-IN')}`;


type KpiTone = 'blue' | 'cyan' | 'emerald' | 'amber';

const KPI_TONE: Record<KpiTone, { bg: string; fg: string }> = {
  blue: { bg: 'color-mix(in srgb, var(--ax-accent) 12%, transparent)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in srgb, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in srgb, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in srgb, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const KPI_ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function PaymentKpiCard({
  icon, tone, label, value, unit, sub, badge,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  badge: string;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className="bsv-payment-kpi ax-col--3" role="region" aria-label={label}>
      <div className="bsv-payment-kpi__body">
        <div className="bsv-payment-kpi__head">
          <div className="bsv-payment-kpi__title-wrap">
            <span className="bsv-payment-kpi__icon" style={{ background: t.bg, color: t.fg }}>
              <svg {...KPI_ICON_PROPS}>{icon}</svg>
            </span>
            <span className="bsv-payment-kpi__label">{label}</span>
          </div>
          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill bsv-payment-kpi__badge">
            {badge}
          </span>
        </div>
        <div className="bsv-payment-kpi__value-row">
          <span className="bsv-payment-kpi__value">{value}</span>
          {unit && <span className="bsv-payment-kpi__unit">{unit}</span>}
        </div>
        <div className="bsv-payment-kpi__caption">{sub}</div>
      </div>
    </div>
  );
}

/* ───────── Responsive CSS (Bihar AMC view jaisa) ───────── */
/* ───────── Responsive page CSS (Exact from Installation Details) ───────── */
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

export function Bihar_Installation_ULA_Payment() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<PaymentClaimItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal State
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaimItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewPayments();
      setClaims(data || []);
    } catch (err: any) {
      console.error('Failed to load payment claims:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract site count
  const getSiteCount = (item: PaymentClaimItem) => {
    if (Array.isArray(item.sites) && item.sites.length > 0) return item.sites.length;
    if (typeof item.site_id === 'string') {
      try {
        const parsed = JSON.parse(item.site_id);
        if (Array.isArray(parsed)) return parsed.length;
      } catch {
        // ignore
      }
    }
    return 1;
  };

  // KPIs
  const totalClaims = claims.length;
  const totalClaimAmount = claims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPaidAmount = claims.reduce((sum, c) => sum + (Number(c.payment_amount) || 0), 0);
  const totalBalanceAmount = claims.reduce((sum, c) => sum + (Number(c.payment_balance) || 0), 0);

  // Filtered
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchType = selectedTypeFilter === 'All' || String(c.payment_type) === selectedTypeFilter;
      let matchStatus = true;
      if (selectedStatusFilter === 'Approved') matchStatus = Number(c.claim_status) === 1;
      else if (selectedStatusFilter === 'Pending') matchStatus = Number(c.claim_status) === 0;
      else if (selectedStatusFilter === 'Paid') matchStatus = Number(c.payment_status) === 1;

      if (!matchType || !matchStatus) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(c.id).includes(q) ||
        c.remarks?.toLowerCase().includes(q) ||
        c.payment_remarks?.toLowerCase().includes(q) ||
        c.sites?.some((s) => s.beneficiary_name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q))
      );
    });
  }, [claims, selectedTypeFilter, selectedStatusFilter, search]);

  /* ───────── Pagination (common) ───────── */
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredClaims, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedTypeFilter, selectedStatusFilter]);

  const hasFilters = selectedTypeFilter !== 'All' || selectedStatusFilter !== 'All' || !!search;

  // Export Cols
  const exportCols: ExportColumn<PaymentClaimItem>[] = useMemo(
    () => [
      { header: 'Claim ID', accessor: (r) => `#${r.id}` },
      { header: 'Claim Date', accessor: (r) => r.created_at || '—' },
      { header: 'Type', accessor: (r) => `${r.payment_type || 50}% Claim` },
      { header: 'Sites Count', accessor: (r) => getSiteCount(r) },
      { header: 'Claim Amount', accessor: (r) => inr(r.amount) },
      { header: 'Claim Status', accessor: (r) => (Number(r.claim_status) === 1 ? 'Approved' : Number(r.claim_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Paid Amount', accessor: (r) => inr(r.payment_amount) },
      { header: 'Balance', accessor: (r) => inr(r.payment_balance) },
      { header: 'Payment Date', accessor: (r) => r.payment_date || '—' },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || '—' },
    ],
    []
  );

  const COLS = 13;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Payment Claims"
        subtitle="Track submitted invoices, claim approvals, and disbursement balances"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Payment Claims' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
    
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI Summary Cards — same card structure as Bihar_Survey_SRT200MW_ViewData */}
        <PaymentKpiCard
          tone="blue"
          label="Total Claims Raised"
          value={totalClaims}
          sub="Batches submitted for payout"
          badge="All Claims"
          icon={<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>}
        />
        <PaymentKpiCard
          tone="cyan"
          label="Total Claim Amount"
          value={inr(totalClaimAmount)}
          sub="Cumulative invoice claims"
          badge="Invoiced"
          icon={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>}
        />
        <PaymentKpiCard
          tone="emerald"
          label="Total Paid Amount"
          value={inr(totalPaidAmount)}
          sub="Amount credited to vendor"
          badge="Disbursed"
          icon={<><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></>}
        />
        <PaymentKpiCard
          tone="amber"
          label="Disbursement Balance"
          value={inr(totalBalanceAmount)}
          sub="Awaiting bank settlement"
          badge="Pending Balance"
          icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
        />

        {/* Tabs Row for quick filter */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Claims filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {[
              { key: 'All', label: 'All Claims', count: claims.length },
              { key: 'Approved', label: 'Approved', count: claims.filter((c) => Number(c.claim_status) === 1).length },
              { key: 'Pending', label: 'Pending Approval', count: claims.filter((c) => Number(c.claim_status) === 0).length },
              { key: 'Paid', label: 'Disbursed', count: claims.filter((c) => Number(c.payment_status) === 1).length },
            ].map((t) => {
              const active = t.key === selectedStatusFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => setSelectedStatusFilter(t.key)}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : t.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Claims Table */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="claim-table-title">
          {/* Header: title (left) | filters + search + export in ONE line (right) */}
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="claim-table-title" className="ax-card__title">Payment Claims History</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredClaims.length}</span> of <span className="ax-num">{claims.length}</span> claims
                {' '}· Invoiced <b className="ax-num">{inr(totalClaimAmount)}</b> · Paid <b className="ax-num">{inr(totalPaidAmount)}</b> · Balance <b className="ax-num">{inr(totalBalanceAmount)}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  id="stage_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  aria-label="Filter by claim type"
                >
                  <option value="All">All Types</option>
                  <option value="50">50% Advance</option>
                  <option value="30">30% Final</option>
                </select>

                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Claim Approved</option>
                  <option value="Pending">Claim Pending</option>
                  <option value="Paid">Payment Disbursed</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSelectedTypeFilter('All');
                      setSelectedStatusFilter('All');
                      setSearch('');
                    }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search claim ID, remarks…"
                  size="sm"
                  ariaLabel="Search payment claims"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredClaims, exportCols)}
                  onExportCSV={() => exportDataToCSV(filteredClaims, exportCols, 'bihar_ula_payment_claims.csv')}
                  onExportExcel={() => exportDataToExcel(filteredClaims, exportCols, 'bihar_ula_payment_claims.xlsx')}
                  onExportPDF={() => printTableData('Bihar ULA Payment Claims', filteredClaims, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
              <caption className="ax-visually-hidden">Payment Claims History</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Claim ID</th>
                  <th className="ax-table__th" scope="col">Stage</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">Sites Count</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Paid Amount</th>
                  <th className="ax-table__th" scope="col">Balance</th>
                  <th className="ax-table__th" scope="col">Payment Date &amp; UTR</th>
                  <th className="ax-table__th" scope="col">Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr><td className="ax-table__td" colSpan={COLS} style={centerCell}><span className="ax-spinner" /> Loading payment claims…</td></tr>
                )}
                {!loading && !paginatedData.length && (
                  <tr>
                    <td className="ax-table__td" colSpan={COLS}>
                      <TableEmptyState title="No payment claims found" message="Submitted payment claims will appear here." />
                    </td>
                  </tr>
                )}
                {!loading && paginatedData.map((c, index) => {
                  const isClaimApproved = Number(c.claim_status) === 1;
                  const isClaimRejected = Number(c.claim_status) === 2;
                  const isPayDone = Number(c.payment_status) === 1;

                  return (
                    <tr key={c.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>#{c.id}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">{c.payment_type || 50}%</span>
                      </td>
                      <td className="ax-table__td ax-num">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          className="ax-badge ax-badge--soft ax-badge--neutral"
                          style={{ cursor: 'pointer', border: 'none' }}
                          onClick={() => setSelectedClaim(c)}
                        >
                          {getSiteCount(c)} Sites
                        </button>
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{inr(c.amount)}</td>
                      <td className="ax-table__td">
                        {c.file ? (
                          <a href={c.file} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
                            View Inv
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="ax-table__td">
                        {isClaimApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : isClaimRejected ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-success)' }}>
                        {inr(c.payment_amount)}
                      </td>
                      <td className="ax-table__td ax-num" style={{ color: Number(c.payment_balance) > 0 ? 'var(--ax-warning)' : 'inherit' }}>
                        {inr(c.payment_balance)}
                      </td>
                      <td className="ax-table__td">
                        <div className="ax-num">{c.payment_date || '—'}</div>
                        {c.payment_remarks && (
                          <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                            {c.payment_remarks}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {isPayDone ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                        ) : Number(c.payment_amount) > 0 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Partial</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => setSelectedClaim(c)}
                        >
                          <span className="ax-btn__label">Download</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>


    </div>
  );
}

export default Bihar_Installation_ULA_Payment;