import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  karnatakaAdminService,
  normalizeKarnatakaDashboardStatus,
  type SiteInstallationItem,
} from '../../karnataka-services';
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

type Row = SiteInstallationItem;
type VerifyFilter = 'all' | 'approved' | 'pending' | 'rejected';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const applicantOf = (r: Row) => r.applicant_name || r.farmer_name || `Farmer #${r.id}`;
const isInstalled = (r: Row) => Number(r.inst_status) === 1;
const verifyState = (r: Row): 'approved' | 'rejected' | 'pending' => {
  const v = Number(r.inst_verify_status ?? 0);
  return v === 1 ? 'approved' : v === 2 ? 'rejected' : 'pending';
};
const verifyLabel = (s: 'approved' | 'rejected' | 'pending') => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const verifyTone = (s: 'approved' | 'rejected' | 'pending') => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

/* ───────── Responsive page CSS (same as Arunachal SHL reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
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

export function StatusView() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'total';
  const districtParam = searchParams.get('district');
  const vendorParam = searchParams.get('vendor');

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const normalizedStatus = normalizeKarnatakaDashboardStatus(statusParam);

  const pageTitle = useMemo(() => {
    let t = `Karnataka SWP Sites: ${statusParam.replace(/-/g, ' ').toUpperCase()}`;
    if (districtParam) t += ` (${districtParam})`;
    if (vendorParam) t += ` (Vendor #${vendorParam})`;
    return t;
  }, [statusParam, districtParam, vendorParam]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: any[] = [];
      if (districtParam) {
        data = await karnatakaAdminService.getDistrictWiseData(normalizedStatus, districtParam);
      } else if (vendorParam) {
        data = await karnatakaAdminService.getVendorWiseData(normalizedStatus, vendorParam);
      } else {
        data = await karnatakaAdminService.getViewDashboardData(normalizedStatus);
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('StatusView load error:', err);
      setErrorMsg(err?.message || 'Failed to load status drilldown records.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [normalizedStatus, districtParam, vendorParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI summary (derived from real data) ── */
  const summary = useMemo(() => {
    const total = items.length;
    const installed = items.filter(isInstalled).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    return { total, installed, notInstalled: total - installed, vApp, vRej, vPend: total - vApp - vRej };
  }, [items]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (selectedDistrict !== 'all' && String(r.district || '').trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (!q) return true;
      return [applicantOf(r), r.vendor_name, r.district, r.application_no, r.tehsil, r.village, r.imei_no, r.controller_no]
        .some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter, selectedDistrict]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || verifyFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state || 'Karnataka' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Tehsil', accessor: (r) => r.tehsil || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'Applicant Name', accessor: (r) => applicantOf(r) },
      { header: 'Application No.', accessor: (r) => r.application_no || DASH },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || DASH },
      { header: 'IMEI No.', accessor: (r) => r.imei_no || DASH },
      { header: 'Controller No.', accessor: (r) => r.controller_no || DASH },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Karnataka_SWP_Status_Drilldown', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Karnataka_SWP_Status_Drilldown', filtered, exportCols);
  const handlePdf = () => printTableData(pageTitle, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title={pageTitle}
        subtitle="Detailed status drilldown of Karnataka SWP site records"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Karnataka SWP Dashboard', href: '/vendor-management/karnataka/swp/dashboard' },
          { label: 'Status Drilldown' },
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
            <Link to="/vendor-management/karnataka/swp/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
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
              label="Total Records"
              value={summary.total.toLocaleString('en-IN')}
              sub={`${summary.installed} installed · ${summary.notInstalled} pending`}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Installed"
              value={summary.installed.toLocaleString('en-IN')}
              sub={`${summary.notInstalled} installation pending`}
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Verify Approved"
              value={summary.vApp.toLocaleString('en-IN')}
              sub={`${summary.vPend} pending · ${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Verify Pending"
              value={summary.vPend.toLocaleString('en-IN')}
              sub={`${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Karnataka SWP status drilldown">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Status Drilldown Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{items.length}</span> sites
                {' '}· Installed <b className="ax-num">{summary.installed}</b> · Verified <b className="ax-num">{summary.vApp}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as VerifyFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

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
                  placeholder="Search applicant, app no, vendor…"
                  size="sm"
                  ariaLabel="Search sites"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Karnataka SWP status drilldown</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Tehsil</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Applicant Name</th>
                  <th className="ax-table__th" scope="col">Application No.</th>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th" scope="col">IMEI No.</th>
                  <th className="ax-table__th" scope="col">Controller No.</th>
                  <th className="ax-table__th" scope="col">Install Status</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading drilldown records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No records found"
                        message={hasFilters ? 'No sites match your filters. Try clearing filters or search term.' : errorMsg || 'No sites matched this status or filter query.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const installed = isInstalled(row);
                    const vs = verifyState(row);
                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{row.state || 'Karnataka'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.district)}</td>
                        <td className="ax-table__td">{txt(row.tehsil)}</td>
                        <td className="ax-table__td">{txt(row.village)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{applicantOf(row)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                          {row.application_no || `KA-${row.id}`}
                        </td>
                        <td className="ax-table__td">{txt(row.vendor_name)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(row.imei_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(row.controller_no)}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${installed ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                            <span className="ax-badge__dot" />
                            {installed ? 'Installed' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${verifyTone(vs)}`}>
                            <span className="ax-badge__dot" />
                            {verifyLabel(vs)}
                          </span>
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
    </div>
  );
}

export default StatusView;