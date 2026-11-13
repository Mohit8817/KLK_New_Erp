import { useState, useMemo, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
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
import { biharAdminService } from '../../bihar-services/biharAdminService';

export interface BiharSSLClaimItem {
  id: number;
  state: string;
  vendor_name: string;
  claim_raised_date: string;
  site_count: number;
  claim_invoice: string;
  claim_amount: string;
  claim_update_date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

type FilterKey = 'all' | BiharSSLClaimItem['status'];

const DASH = '—';

const statusTone = (s: BiharSSLClaimItem['status']): 'success' | 'danger' | 'warning' =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning';

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Modal Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff; border-radius: 16px;
    border: 1px solid var(--ax-border, #e2e8f0); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--ax-text-muted, #64748b);
  }
  .ax-modal__body { padding: 0; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 14px 20px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }

  /* Image thumbnails */
  .solar-erp-page .kswp-thumb {
    display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--ax-border, #e2e8f0); background: var(--ax-surface-subtle, #f8fafc);
    overflow: hidden; cursor: pointer; transition: transform 0.15s ease;
  }
  .solar-erp-page .kswp-thumb:hover { transform: scale(1.08); }
  .solar-erp-page .kswp-thumb img { width: 100%; height: 100%; object-fit: cover; }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
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

const ICONS = {
  doc: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>),
  check: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>),
  shield: svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  cross: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></>),
  coin: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M10 8c4 0 4 4 0 4l4 4" /></>),
};
type IconKey = keyof typeof ICONS;

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub?: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open, onClose, labelledBy, title, subtitle, children, footer, dialogStyle,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  dialogStyle?: CSSProperties;
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
        <div className="ax-modal__header">
          <div>
            <h2 className="ax-modal__title" id={labelledBy} style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const REFRESH_ICON = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
];

export function BiharSSLInstallationClaimRequest() {
  const [claims, setClaims] = useState<BiharSSLClaimItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Details modal
  const [detailItem, setDetailItem] = useState<BiharSSLClaimItem | null>(null);

  const loadClaims = useCallback(() => {
    setLoading(true);
    setErrorMsg('');
    biharAdminService
      .getViewSslClaims()
      .then((res: any) => {
        const raw =
          res?.data?.claims ||
          res?.data?.list ||
          res?.data ||
          (Array.isArray(res) ? res : []);

        const list: BiharSSLClaimItem[] = Array.isArray(raw)
          ? raw.map((r: any, idx: number) => ({
              id: r.id || idx + 1,
              state: r.state || 'Bihar',
              vendor_name: r.vendor_name || r.vendor || 'Vendor',
              claim_raised_date: r.claim_raised_date || r.claim_date || r.created_at || '—',
              site_count: Number(r.site_count || r.sitecount || 1),
              claim_invoice: r.claim_invoice || r.invoice || `INV-${r.id || idx + 1}`,
              claim_amount: r.claim_amount ? (String(r.claim_amount).startsWith('₹') ? r.claim_amount : `₹ ${Number(r.claim_amount).toLocaleString('en-IN')}`) : '—',
              claim_update_date: r.claim_update_date || r.updated_at || '—',
              status: r.status === 1 || r.status === 'Approved' ? 'Approved' : r.status === 2 || r.status === 'Rejected' ? 'Rejected' : 'Pending',
            }))
          : [];

        setClaims(list);
      })
      .catch((err: any) => {
        console.warn('Failed to load SSL claims:', err);
        setErrorMsg(err?.message || 'Failed to connect to SSL view-claim API.');
        setClaims([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.vendor_name, r.state, r.claim_invoice, r.status, r.claim_amount].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      );
    });
  }, [claims, search, statusFilter]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<BiharSSLClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name },
      { header: 'Claim Raised Date', accessor: (r) => r.claim_raised_date },
      { header: 'Site Count', accessor: (r) => r.site_count },
      { header: 'Claim Invoice', accessor: (r) => r.claim_invoice },
      { header: 'Claim Amount', accessor: (r) => r.claim_amount },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date },
      { header: 'Status', accessor: (r) => r.status },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SSL_Claim_Request', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SSL_Claim_Request', filtered, exportCols);
  const handlePdf = () => printTableData('View Bihar SSL Claim Request', filtered, exportCols);

  const colCount = 10;
  const tabCount = (k: FilterKey) => (k === 'all' ? claims.length : claims.filter((c) => c.status === k).length);

  const kpiCards: { label: string; value: number; tone: KpiTone; icon: IconKey; sub: string }[] = [
    { label: 'Total Claims', value: claims.length, tone: 'accent', icon: 'doc', sub: 'claim requests raised' },
    { label: 'Claim Approved', value: tabCount('Approved'), tone: 'emerald', icon: 'check', sub: 'approved claims' },
    { label: 'Claim Pending', value: tabCount('Pending'), tone: 'amber', icon: 'clock', sub: 'awaiting decision' },
    { label: 'Claim Rejected', value: tabCount('Rejected'), tone: 'cyan', icon: 'cross', sub: 'rejected claims' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Bihar SSL Claim Request"
        subtitle="Review claim requests raised by vendors for Bihar SSL installations"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: 'View Bihar SSL Claim Request' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadClaims} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          kpiCards.map((k) => (
            <KpiCard key={k.label} tone={k.tone} label={k.label} value={k.value.toLocaleString('en-IN')} sub={k.sub} icon={ICONS[k.icon]} />
          ))
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Claim status tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === statusFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL claim requests">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Bihar SSL Claim Request</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claim records
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, invoice, amount…"
                  size="sm"
                  ariaLabel="Search claims"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SSL claim requests</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th" scope="col">Claim Raised Date</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col">Claim Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Claim Update Date</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Bihar SSL claims from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No claim requests found"
                        message={hasFilters ? 'No claims match your search. Try clearing the search term.' : 'No claim requests found under this category.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((r, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={r.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{r.state}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.vendor_name}</td>
                        <td className="ax-table__td">{r.claim_raised_date}</td>
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 600 }}>{r.site_count}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                          {r.claim_invoice}
                        </td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{r.claim_amount}</td>
                        <td className="ax-table__td">{r.claim_update_date}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusTone(r.status)}`}>
                            <span className="ax-badge__dot" />
                            {r.status}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailItem(r)}>
                            Details
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
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal: Claim Details ── */}
      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        labelledBy="bssl-claim-detail-title"
        title="Claim Details"
        subtitle={detailItem ? `Vendor: ${detailItem.vendor_name} · Invoice: ${detailItem.claim_invoice}` : undefined}
        dialogStyle={{ maxWidth: 560 }}
        footer={
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailItem(null)}>
            Close
          </button>
        }
      >
        {detailItem && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)', padding: 12, borderRadius: 8 }}>
              <div><b>State:</b> {detailItem.state}</div>
              <div><b>Vendor:</b> {detailItem.vendor_name}</div>
              <div><b>Claim Raised Date:</b> {detailItem.claim_raised_date}</div>
              <div><b>Claim Update Date:</b> {detailItem.claim_update_date}</div>
              <div><b>Site Count:</b> {detailItem.site_count}</div>
              <div><b>Claim Invoice:</b> {detailItem.claim_invoice}</div>
              <div><b>Claim Amount:</b> {detailItem.claim_amount}</div>
              <div>
                <b>Status:</b>{' '}
                <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusTone(detailItem.status)}`}>
                  <span className="ax-badge__dot" />
                  {detailItem.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BiharSSLInstallationClaimRequest;