import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../common';
import {
  vendorCommonService,
  type VendorProgressItem,
} from '../common-services/vendorCommonService';

/* ───────── Responsive page CSS (Matching Reference Code) ───────── */
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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* Modal Details Styles */
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
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
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
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
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

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return '—';

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}

  const datePart = trimmed.split(/[ T]/)[0];
  return datePart || trimmed;
};

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const getDefaultStartDate = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().slice(0, 10);
};

const getDefaultEndDate = () => {
  return new Date().toISOString().slice(0, 10);
};

export function DailyReport() {
  const [searchParams] = useSearchParams();

  const [startDate, setStartDate] = useState<string>(
    () => searchParams.get('start_date') || getDefaultStartDate()
  );
  const [tillDate, setTillDate] = useState<string>(
    () => searchParams.get('till_date') || getDefaultEndDate()
  );
  const [vendorFilter, setVendorFilter] = useState<string>(
    () => searchParams.get('vendor') || ''
  );

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<VendorProgressItem[]>([]);
  const [vendorList, setVendorList] = useState<Array<{ created_by: number | string; name?: string }>>([]);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected report modal item
  const [detailModalItem, setDetailModalItem] = useState<VendorProgressItem | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load daily progress reports from API A4
  const loadData = useCallback(async () => {
    if (!startDate || !tillDate) {
      setToastMsg({ type: 'danger', text: 'Please select both start date and till date.' });
      return;
    }
    if (new Date(tillDate) < new Date(startDate)) {
      setToastMsg({ type: 'danger', text: 'Till Date must be a date after or equal to Start Date.' });
      return;
    }

    setLoading(true);
    try {
      const isNumeric = vendorFilter && /^\d+$/.test(vendorFilter.trim());
      const res = await vendorCommonService.getDailyProgressReports({
        start_date: startDate,
        till_date: tillDate,
        vendor: isNumeric ? vendorFilter.trim() : undefined,
      });

      let woList = Array.isArray(res.wo) ? res.wo : [];

      // If user filtered by a vendor (either numeric or username string like "mohit"),
      // filter client-side to ensure accurate results even if the server only accepts integer IDs
      if (vendorFilter) {
        const target = vendorFilter.trim().toLowerCase();
        woList = woList.filter((r) => {
          const c = String(r.created_by ?? '').trim().toLowerCase();
          return c === target;
        });
      }

      setReports(woList);

      // Build deduplicated vendor list combining res.vendor and any creators found in raw wo
      const vendorMap = new Map<string, { created_by: number | string; name?: string }>();
      if (Array.isArray(res.vendor)) {
        for (const v of res.vendor) {
          if (v && v.created_by != null) {
            vendorMap.set(String(v.created_by).trim().toLowerCase(), v);
          }
        }
      }
      if (Array.isArray(res.wo)) {
        for (const r of res.wo) {
          if (r && r.created_by != null) {
            const k = String(r.created_by).trim().toLowerCase();
            if (!vendorMap.has(k)) {
              vendorMap.set(k, { created_by: r.created_by });
            }
          }
        }
      }
      if (vendorMap.size > 0) {
        setVendorList(Array.from(vendorMap.values()));
      }
    } catch (err: any) {
      console.error('[DailyReport] load error:', err);
      setReports([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load daily progress reports.' });
    } finally {
      setLoading(false);
    }
  }, [startDate, tillDate, vendorFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered by Search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;

    return reports.filter((r) => {
      const idMatch = String(r.id).includes(q);
      const woMatch = String(r.workorder || '').toLowerCase().includes(q);
      const qtyMatch = String(r.quantity || '').toLowerCase().includes(q);
      const dateMatch = String(r.r_date || '').toLowerCase().includes(q);
      const creatorMatch = String(r.created_by || '').toLowerCase().includes(q);
      const stateMatch = String(r.state || '').toLowerCase().includes(q);
      const distMatch = String(r.district || '').toLowerCase().includes(q);
      return idMatch || woMatch || qtyMatch || dateMatch || creatorMatch || stateMatch || distMatch;
    });
  }, [reports, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  // Metrics
  const totalReportsCount = reports.length;
  const totalQuantitySum = reports.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const uniqueWorkOrders = new Set(reports.map((r) => r.workorder)).size;
  const uniqueVendors = new Set(reports.map((r) => r.created_by).filter(Boolean)).size;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Daily Progress Reports"
        subtitle="Track daily work-order progress entries by date range, quantity achievements, and vendor allocations"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Reports' },
          { label: 'Daily Report' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/reports/add-report" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Report</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top KPI Metrics ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Entries"
          value={totalReportsCount.toLocaleString('en-IN')}
          sub={`${uniqueWorkOrders} distinct work orders`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Quantity Done"
          value={totalQuantitySum.toLocaleString('en-IN')}
          sub="Cumulative installation progress"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Reporting Date Span"
          value={`${formatDate(startDate)}`}
          sub={`Till ${formatDate(tillDate)}`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Active Creators"
          value={uniqueVendors.toLocaleString('en-IN')}
          sub="Contributing vendor accounts"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* ── Filter Form Card ── */}
      <div className="ax-card" style={{ marginBottom: 'var(--ax-space-4)', padding: '16px 20px', borderRadius: 12 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label htmlFor="daily_start_date" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>
              Start Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="daily_start_date"
              type="date"
              className="ax-input ax-input--sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ height: 34 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label htmlFor="daily_till_date" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>
              Till Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="daily_till_date"
              type="date"
              className="ax-input ax-input--sm"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              required
              style={{ height: 34 }}
            />
          </div>

          {vendorList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
              <label htmlFor="daily_vendor_filter" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>
                Filter by Vendor
              </label>
              <select
                id="daily_vendor_filter"
                className="ax-input ax-input--sm"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                style={{ height: 34 }}
              >
                <option value="">All Vendors</option>
                {vendorList.map((v) => {
                  const val = String(v.created_by);
                  const isNum = /^\d+$/.test(val);
                  const label = v.name
                    ? `${v.name} (${val})`
                    : isNum
                    ? `Vendor #${val}`
                    : `Vendor: ${val}`;
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={loading} style={{ height: 34 }}>
              {loading ? 'Searching…' : 'Filter Reports'}
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => {
                setStartDate(getDefaultStartDate());
                setTillDate(getDefaultEndDate());
                setVendorFilter('');
              }}
              style={{ height: 34 }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* ── Main Data Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Daily Progress Reports Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Daily Work Order Progress</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{reports.length}</span> entries
              {' '}· Total Progress: <b className="ax-num">{totalQuantitySum.toLocaleString('en-IN')}</b> units
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search work order, qty, vendor…"
                size="sm"
                ariaLabel="Search daily reports"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        r.id,
                        r.workorder,
                        r.quantity,
                        formatDate(r.r_date),
                        r.created_by ?? '—',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Report ID,Work Order,Quantity Done,Report Date,Created By',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.workorder}","${r.quantity}","${formatDate(r.r_date)}","${r.created_by ?? '—'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Daily_Progress_Reports_${startDate}_to_${tillDate}.csv`;
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Report ID,Work Order,Quantity Done,Report Date,Created By',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.workorder}","${r.quantity}","${formatDate(r.r_date)}","${r.created_by ?? '—'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Daily_Progress_Reports_${startDate}_to_${tillDate}.xls`;
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Report ID</th>
                <th className="ax-table__th" scope="col">Work Order</th>
                <th className="ax-table__th" scope="col">Quantity Done</th>
                <th className="ax-table__th" scope="col">Report Date</th>
                <th className="ax-table__th" scope="col">Created By (Vendor)</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={7} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading daily progress reports…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No progress reports found"
                      message="No reports match your selected date range or search query. Try broadening your criteria."
                      onClear={() => {
                        setSearch('');
                        setStartDate(getDefaultStartDate());
                        setTillDate(getDefaultEndDate());
                        setVendorFilter('');
                      }}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--asw-primary)' }}>
                        #{row.id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.workorder}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.quantity} units
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.r_date)}
                      </td>
                      <td className="ax-table__td">
                        {row.created_by != null && String(row.created_by).trim() !== '' ? (
                          <Badge tone="neutral">
                            {/^\d+$/.test(String(row.created_by)) ? `Vendor #${row.created_by}` : `Vendor: ${row.created_by}`}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setDetailModalItem(row)}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          View Details
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
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── View Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="daily-progress-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 540 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="daily-progress-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Daily Progress Report #{detailModalItem.id}</span>
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailModalItem(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 18px', fontSize: 13, marginBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Report ID</span>
                  <b style={{ color: '#2563eb' }}>#{detailModalItem.id}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Work Order</span>
                  <b>{detailModalItem.workorder}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Quantity Completed</span>
                  <b style={{ color: '#16a34a' }}>{detailModalItem.quantity} units</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Report Date</span>
                  <b>{formatDate(detailModalItem.r_date)}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Created By</span>
                  <b>
                    {detailModalItem.created_by != null && String(detailModalItem.created_by).trim() !== ''
                      ? /^\d+$/.test(String(detailModalItem.created_by))
                        ? `Vendor #${detailModalItem.created_by}`
                        : `Vendor: ${detailModalItem.created_by}`
                      : '—'}
                  </b>
                </div>
                {detailModalItem.state && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                    <b>{detailModalItem.state}</b>
                  </div>
                )}
                {detailModalItem.district && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                    <b>{detailModalItem.district}</b>
                  </div>
                )}
                {detailModalItem.order_qty && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total Order Qty</span>
                    <b>{detailModalItem.order_qty} units</b>
                  </div>
                )}
              </div>

              {detailModalItem.report && (
                <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                    Progress Report Remarks / Notes
                  </span>
                  <p style={{ margin: 0, fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {detailModalItem.report}
                  </p>
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReport;
