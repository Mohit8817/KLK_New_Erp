import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
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
import {
  karnatakaAdminService,
  type DispatchMaterialRecord,
} from '../../karnataka-services';

type Row = DispatchMaterialRecord;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const vendorOf = (r: Row) => r.vendor_name || r.vendors?.name || `Vendor #${r.vendor_id}`;
const materialsOf = (r?: Row | null) => (r?.material || r?.Material || []) as NonNullable<Row['material']>;
const isDelivered = (r: Row) => Boolean(r.received_date) || String(r.status).toLowerCase() === 'delivered';

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return String(val).slice(0, 10);
};

/* ───────── Responsive page CSS (same as Verify Document reference) ───────── */
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

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
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
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
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

export function ViewDispatchMaterial() {
  const [dispatches, setDispatches] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected consignment for items modal
  const [selected, setSelected] = useState<Row | null>(null);

  // GET /view-material-dispatch
  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await karnatakaAdminService.getViewMaterialDispatch();
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch material dispatch data:', err);
      setErrorMsg(err?.message || 'Failed to fetch material dispatch records.');
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dispatches;
    return dispatches.filter((d) =>
      [d.vendor_name || d.vendors?.name, d.truck_no, d.challan_no, d.warehouse_name, d.product, d.driver_no]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [dispatches, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state || 'Karnataka' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendors?.name || DASH },
      { header: 'Vendor Contact', accessor: (r) => r.vendor_contact || r.vendors?.phone || DASH },
      { header: 'Site Count', accessor: (r) => r.site_count || 1 },
      { header: 'Dispatch Date', accessor: (r) => fmtDate(r.dispatch_date) },
      { header: 'Truck Number', accessor: (r) => r.truck_no || DASH },
      { header: 'Challan Number', accessor: (r) => r.challan_no || DASH },
      { header: 'Driver Number', accessor: (r) => r.driver_no || DASH },
      { header: 'Warehouse Name', accessor: (r) => r.warehouse_name || DASH },
      { header: 'Product', accessor: (r) => r.product || materialsOf(r)[0]?.product || DASH },
      { header: 'Unit', accessor: (r) => r.unit || materialsOf(r)[0]?.unit || 'Nos' },
      { header: 'Quantity', accessor: (r) => r.quantity || materialsOf(r)[0]?.quantity || DASH },
      { header: 'Status', accessor: (r) => r.status || (isDelivered(r) ? 'Delivered' : 'In Transit') },
      { header: 'Received Date', accessor: (r) => fmtDate(r.received_date) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Karnataka_Material_Dispatches', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Karnataka_Material_Dispatches', filtered, exportCols);
  const handlePdf = () => printTableData('Karnataka Material Dispatch Data', filtered, exportCols);

  const colCount = 16;
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');
  const deliveredCount = dispatches.filter(isDelivered).length;
  const inTransitCount = dispatches.length - deliveredCount;
  const sitesCatered = dispatches.reduce((acc, d) => acc + Number(d.site_count || 0), 0);

  const selectedMats = materialsOf(selected);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Material Dispatch Details"
        subtitle="Track material consignments dispatched to vendors for Karnataka SWP sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'SWP Installation Data', href: '/vendor-management/karnataka/swp/dashboard' },
          { label: 'View Material Dispatch' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchDispatches} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/vendor-management/karnataka/swp/material-dispatch" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Dispatch Material</span>
            </Link>
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
          <>
            <KpiCard
              tone="accent"
              label="Total Dispatches"
              value={num(dispatches.length)}
              sub="material consignments"
              icon={svgIcon(
                <>
                  <rect x="1" y="3" width="15" height="13" />
                  <path d="M16 8h4l3 3v5h-7z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Sites Catered"
              value={num(sitesCatered)}
              sub="across all dispatches"
              icon={svgIcon(
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M16 11l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="In Transit"
              value={num(inTransitCount)}
              sub="awaiting delivery"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Delivered"
              value={num(deliveredCount)}
              sub="received by vendors"
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Material dispatch">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Karnataka Material Dispatch Data</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{dispatches.length}</span> material consignments
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
                  placeholder="Search vendor, truck, challan, product…"
                  size="sm"
                  ariaLabel="Search dispatches"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Material dispatch</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th" scope="col">Vendor Contact</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col">Dispatch Date</th>
                  <th className="ax-table__th" scope="col">Truck Number</th>
                  <th className="ax-table__th" scope="col">Challan Number</th>
                  <th className="ax-table__th" scope="col">Driver Number</th>
                  <th className="ax-table__th" scope="col">Warehouse Name</th>
                  <th className="ax-table__th" scope="col">Product</th>
                  <th className="ax-table__th" scope="col">Unit</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Quantity</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col">Received Date</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading material dispatches from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No dispatches found"
                        message={hasFilters ? 'No dispatches match your search. Try clearing the search term.' : 'No material dispatch consignments created yet.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const mats = materialsOf(row);
                    const firstProduct = row.product || mats[0]?.product || 'Pumps & Hardware';
                    const firstUnit = row.unit || mats[0]?.unit || 'Nos';
                    const firstQty = row.quantity || mats[0]?.quantity || row.site_count || 1;
                    const delivered = isDelivered(row);
                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{row.state || 'Karnataka'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{vendorOf(row)}</td>
                        <td className="ax-table__td">{txt(row.vendor_contact || row.vendors?.phone)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span className="ax-num" style={{ fontWeight: 600 }}>{row.site_count ?? 0} Sites</span>
                        </td>
                        <td className="ax-table__td">{fmtDate(row.dispatch_date)}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>{txt(row.truck_no)}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{txt(row.challan_no)}</td>
                        <td className="ax-table__td">{txt(row.driver_no)}</td>
                        <td className="ax-table__td">{txt(row.warehouse_name)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{firstProduct}</span>
                          {mats.length > 1 && (
                            <span style={{ fontSize: 11, color: 'var(--ax-accent)', marginLeft: 4 }}>
                              (+{mats.length - 1} more items)
                            </span>
                          )}
                        </td>
                        <td className="ax-table__td">{firstUnit}</td>
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 700 }}>{firstQty}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${delivered ? 'success' : 'warning'}`}>
                            <span className="ax-badge__dot" />
                            {delivered ? 'Delivered' : 'In Transit'}
                          </span>
                        </td>
                        <td className="ax-table__td">{fmtDate(row.received_date)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" title="View consignment products" onClick={() => setSelected(row)}>
                              Items
                            </button>
                            {delivered ? (
                              <button
                                type="button"
                                disabled
                                title="Consignment Delivered (Locked for editing)"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#f1f5f9',
                                  color: '#94a3b8',
                                  border: '1px solid #cbd5e1',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'not-allowed',
                                }}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Locked
                              </button>
                            ) : (
                              <Link to={`/vendor-management/karnataka/swp/material-dispatch?id=${row.id}`} className="ax-btn ax-btn--secondary ax-btn--sm" title="Edit consignment">
                                Edit
                              </Link>
                            )}
                          </div>
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

      {/* ── Modal: Consignment Items ── */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        labelledBy="kswp-dispatch-items-title"
        title={`Consignment Items${selected ? ` - Challan ${txt(selected.challan_no)}` : ''}`}
        subtitle={selected ? `Truck: ${txt(selected.truck_no)} · Warehouse: ${txt(selected.warehouse_name)} · Vendor: ${vendorOf(selected)}` : undefined}
        dialogStyle={{ maxWidth: 700 }}
        footer={
          <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setSelected(null)}>Close</button>
        }
      >
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">#</th>
                <th className="ax-table__th" scope="col">Product Description</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Unit</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {selectedMats.length > 0 ? (
                selectedMats.map((m, mIdx) => (
                  <tr key={m.id ?? mIdx} className="ax-table__row">
                    <td className="ax-table__td ax-num">{mIdx + 1}</td>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(m.product)}</td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>{txt(m.unit)}</td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ax-accent)' }}>{txt(m.quantity)}</td>
                  </tr>
                ))
              ) : (
                <tr className="ax-table__row">
                  <td className="ax-table__td ax-num">1</td>
                  <td className="ax-table__td" style={{ fontWeight: 600 }}>{selected?.product || 'Solar Submersible Pump Equipment'}</td>
                  <td className="ax-table__td" style={{ textAlign: 'center' }}>{selected?.unit || 'Nos'}</td>
                  <td className="ax-table__td ax-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ax-accent)' }}>
                    {selected?.quantity || selected?.site_count || 1}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

export default ViewDispatchMaterial;