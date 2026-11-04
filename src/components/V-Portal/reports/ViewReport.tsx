import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
  resolveCommonMediaUrl,
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

export function ViewReport() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<VendorProgressItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected report modal item
  const [detailModalItem, setDetailModalItem] = useState<VendorProgressItem | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  // Lightbox Zoom state
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load progress reports (A3: GET /vendor-view-progress)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorCommonService.getMyProgressReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[ViewReport] load error:', err);
      setReports([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load progress reports.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts for filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = reports;
    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district?.trim().toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const idMatch = String(r.id).includes(q);
        const woMatch = String(r.workorder || '').toLowerCase().includes(q);
        const stateMatch = String(r.state || '').toLowerCase().includes(q);
        const distMatch = String(r.district || '').toLowerCase().includes(q);
        const qtyMatch = String(r.quantity || '').toLowerCase().includes(q);
        const reportMatch = String(r.report || '').toLowerCase().includes(q);
        const dateMatch = String(r.r_date || '').toLowerCase().includes(q);
        return idMatch || woMatch || stateMatch || distMatch || qtyMatch || reportMatch || dateMatch;
      });
    }
    return list;
  }, [reports, search, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setPage(1);
  };

  // Metrics
  const totalReportsCount = reports.length;
  const totalQuantitySum = reports.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const uniqueWorkOrders = new Set(reports.map((r) => r.workorder)).size;
  const uniqueDistricts = districts.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="My Progress Reports"
        subtitle="Review work order execution milestones, cumulative quantity completed, site photographs, and progress logs"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Reports' },
          { label: 'View Report' },
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
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top KPI Metrics ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Progress Reports"
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
          label="Total Completed Qty"
          value={totalQuantitySum.toLocaleString('en-IN')}
          sub="Cumulative executed units"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Districts Covered"
          value={uniqueDistricts.toLocaleString('en-IN')}
          sub="Geographic span"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Work Orders"
          value={uniqueWorkOrders.toLocaleString('en-IN')}
          sub="Active project contracts"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Progress Reports Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Progress Register</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{reports.length}</span> reports
              {' '}· Executed: <b className="ax-num">{totalQuantitySum.toLocaleString('en-IN')}</b> units
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

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
                placeholder="Search work order, district…"
                size="sm"
                ariaLabel="Search progress reports"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        r.id,
                        r.workorder,
                        r.state || '—',
                        r.district || '—',
                        r.order_qty ?? '—',
                        r.quantity,
                        formatDate(r.r_date),
                        r.report || '—',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Report ID,Work Order,State,District,Order Qty,Quantity Done,Report Date,Remarks',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.workorder}","${r.state || ''}","${r.district || ''}","${r.order_qty ?? ''}","${r.quantity}","${formatDate(r.r_date)}","${(r.report || '').replace(/"/g, '""')}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Progress_Reports.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Report ID,Work Order,State,District,Order Qty,Quantity Done,Report Date,Remarks',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.workorder}","${r.state || ''}","${r.district || ''}","${r.order_qty ?? ''}","${r.quantity}","${formatDate(r.r_date)}","${(r.report || '').replace(/"/g, '""')}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Progress_Reports.xls';
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
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Order Qty</th>
                <th className="ax-table__th" scope="col">Qty Done</th>
                <th className="ax-table__th" scope="col">Report Date</th>
                <th className="ax-table__th" scope="col">Photos</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading progress reports…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No progress reports found"
                      message={hasFilters ? 'No records match your filters. Try clearing your search.' : 'You have not submitted any progress reports yet.'}
                      onClear={hasFilters ? resetFilters : undefined}
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
                      <td className="ax-table__td">{row.state || '—'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>
                      <td className="ax-table__td ax-num">{row.order_qty ?? '—'}</td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.quantity}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.r_date)}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', gap: 6 }}>
                          {row.img1 && (
                            <img
                              src={resolveCommonMediaUrl(row.img1)}
                              alt="Photo 1"
                              style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, cursor: 'zoom-in', border: '1px solid var(--ax-border, #e2e8f0)' }}
                              onClick={() => setPreviewPhoto({ url: resolveCommonMediaUrl(row.img1), title: `Report #${row.id} - Photo 1` })}
                              title="Click to zoom Photo 1"
                            />
                          )}
                          {row.img2 && (
                            <img
                              src={resolveCommonMediaUrl(row.img2)}
                              alt="Photo 2"
                              style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, cursor: 'zoom-in', border: '1px solid var(--ax-border, #e2e8f0)' }}
                              onClick={() => setPreviewPhoto({ url: resolveCommonMediaUrl(row.img2), title: `Report #${row.id} - Photo 2` })}
                              title="Click to zoom Photo 2"
                            />
                          )}
                          {!row.img1 && !row.img2 && <span style={{ color: 'var(--ax-text-muted)' }}>—</span>}
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.report || '—'}
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
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="view-report-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 580 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="view-report-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Progress Report #{detailModalItem.id} Details</span>
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
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                  <b>{detailModalItem.state || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                  <b>{detailModalItem.district || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total Order Quantity</span>
                  <b>{detailModalItem.order_qty ?? '—'} units</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Quantity Completed</span>
                  <b style={{ color: '#16a34a' }}>{detailModalItem.quantity} units</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Report Date</span>
                  <b>{formatDate(detailModalItem.r_date)}</b>
                </div>
              </div>

              {detailModalItem.report && (
                <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                    Execution Report / Remarks
                  </span>
                  <p style={{ margin: 0, fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {detailModalItem.report}
                  </p>
                </div>
              )}

              {/* Photos */}
              {(detailModalItem.img1 || detailModalItem.img2) && (
                <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                    Site Photographs
                  </span>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {detailModalItem.img1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <img
                          src={resolveCommonMediaUrl(detailModalItem.img1)}
                          alt="Photo 1"
                          style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                          onClick={() => setPreviewPhoto({ url: resolveCommonMediaUrl(detailModalItem.img1), title: `Report #${detailModalItem.id} - Photo 1` })}
                        />
                        <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', textAlign: 'center' }}>Photograph 1</span>
                      </div>
                    )}
                    {detailModalItem.img2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <img
                          src={resolveCommonMediaUrl(detailModalItem.img2)}
                          alt="Photo 2"
                          style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                          onClick={() => setPreviewPhoto({ url: resolveCommonMediaUrl(detailModalItem.img2), title: `Report #${detailModalItem.id} - Photo 2` })}
                        />
                        <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', textAlign: 'center' }}>Photograph 2</span>
                      </div>
                    )}
                  </div>
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

      {/* ── Photo Lightbox Modal ── */}
      {previewPhoto && (
        <div className="ax-modal" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setPreviewPhoto(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 700 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" style={{ fontSize: 14, fontWeight: 700 }}>
                {previewPhoto.title}
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setPreviewPhoto(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 12, textAlign: 'center', background: '#0f172a' }}>
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <a href={previewPhoto.url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
                Open in new tab ↗
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setPreviewPhoto(null)}
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

export default ViewReport;
