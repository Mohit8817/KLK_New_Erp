import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharAdminService,
  resolveBiharMediaUrl,
} from '../../bihar-services/biharAdminService';
import { BIHAR_DISTRICTS } from '../../bihar-types';
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

interface Srt200mwStatusRecord {
  id: number | string;
  site_name?: string;
  district?: string;
  division?: string;
  site_address?: string;
  survey_address?: string;
  vendor_display?: string;
  vendor_name?: string;
  vendor?: string;
  agency_person_name?: string;
  agency_person_contact?: string;
  ca_no?: string;
  uid?: string;
  sanction_load?: string | number;
  connected_load?: string | number;
  load_type?: string;
  connection_phase?: string;
  meter_connection?: string;
  meter_number?: string;
  roof_condition?: string;
  area_roof?: string | number;
  free_space_solar?: string | number;
  all_3_phase_ltdb?: string;
  building_age?: string | number;
  water_source?: string;
  site_feasible?: string;
  feasible?: string | number;
  verify_status?: string;
  survey_verify_status?: number;
  survey_verify_remarks?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  pdf_file?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

type Row = Srt200mwStatusRecord;
type VerifyFilter = 'all' | 'approved' | 'pending' | 'rejected';
type FeasibleFilter = 'all' | 'feasible' | 'not_feasible';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const siteNameOf = (r: Row) => r.site_name || `Rooftop Site #${r.id}`;

const vendorNameOf = (r: Row) => r.vendor_display || r.vendor_name || r.vendor || 'Vendor Partner';

const isFeasible = (r: Row): boolean => {
  const f = String(r.site_feasible ?? r.feasible ?? '').toLowerCase().trim();
  if (f === 'feasible' || f === 'yes' || f === '1' || f === 'approved & feasible') return true;
  if (f === 'not feasible' || f === 'no' || f === '0') return false;
  return true; // default feasible in survey
};

const verifyState = (r: Row): 'approved' | 'rejected' | 'pending' => {
  if (r.survey_verify_status === 1 || String(r.verify_status).toLowerCase() === 'approved') return 'approved';
  if (r.survey_verify_status === 2 || String(r.verify_status).toLowerCase() === 'rejected') return 'rejected';
  return 'pending';
};

const verifyLabel = (s: 'approved' | 'rejected' | 'pending') => {
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

const verifyTone = (s: 'approved' | 'rejected' | 'pending') => {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
};

/* ───────── Responsive page CSS (Exact Karnataka SWP Standard) ───────── */
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

  /* Modal Dialog */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .ax-modal__backdrop {
    position: absolute; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px);
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: var(--ax-bg-surface, #ffffff); border-radius: 14px;
    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.3); border: 1px solid var(--ax-border, #e2e8f0);
    width: 100%; max-width: 820px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0); display: flex;
    justify-content: space-between; align-items: center; background: var(--ax-bg-subtle, #f8fafc);
  }
  .ax-modal__close {
    border: none; background: transparent; cursor: pointer; font-size: 18px; color: var(--ax-text-muted, #64748b);
    display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px;
  }
  .ax-modal__close:hover { background: var(--ax-border, #e2e8f0); color: var(--ax-text-strong, #0f172a); }
  .ax-modal__body { padding: 20px; overflow-y: auto; }
  .ax-modal__footer {
    padding: 12px 20px; border-top: 1px solid var(--ax-border, #e2e8f0); display: flex; justify-content: space-between;
    align-items: center; background: var(--ax-bg-subtle, #f8fafc); gap: 10px;
  }

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

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb, 37, 99, 235), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #0891b2) 14%, transparent)', fg: 'var(--ax-viz-cyan, #0891b2)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: 'var(--ax-viz-emerald, #10b981)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: 'var(--ax-viz-amber, #f59e0b)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '100%', height: '100%' }}>{children}</svg>
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

export function BiharSRT200MWSurveyStatusView() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'complete';
  const districtParam = searchParams.get('district');
  const vendorParam = searchParams.get('vendor');

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [feasibleFilter, setFeasibleFilter] = useState<FeasibleFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState(districtParam || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<Row | null>(null);

  const pageTitle = useMemo(() => {
    let t = `Bihar SRT 200MW Surveys: ${statusParam.replace(/-/g, ' ').toUpperCase()}`;
    if (districtParam && districtParam !== 'All') t += ` (${districtParam})`;
    if (vendorParam) t += ` (Vendor #${vendorParam})`;
    return t;
  }, [statusParam, districtParam, vendorParam]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let res: any;
      if (districtParam && districtParam !== 'All') {
        res = await biharAdminService.getSrt200mwDistrictWiseData(statusParam, districtParam);
      } else if (vendorParam) {
        res = await biharAdminService.getSrt200mwVendorWiseData(statusParam, String(vendorParam));
      } else {
        res = await biharAdminService.getSrt200mwViewDashboard(statusParam);
      }
      const raw = res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setItems(list);
    } catch (err: any) {
      console.error('Bihar SRT 200MW StatusView load error:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar SRT 200MW status records from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusParam, districtParam, vendorParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI summary derived from actual data ── */
  const summary = useMemo(() => {
    const total = items.length;
    const feasibleCount = items.filter(isFeasible).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    return { total, feasibleCount, vApp, vRej, vPend };
  }, [items]);

  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    BIHAR_DISTRICTS.forEach((d) => set.add(d));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (feasibleFilter === 'feasible' && !isFeasible(r)) return false;
      if (feasibleFilter === 'not_feasible' && isFeasible(r)) return false;
      if (selectedDistrict !== 'all' && String(r.district || '').trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (!q) return true;
      return [
        siteNameOf(r),
        vendorNameOf(r),
        r.district,
        r.ca_no,
        r.uid,
        r.sanction_load,
        r.connected_load,
        r.site_address,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter, feasibleFilter, selectedDistrict]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || verifyFilter !== 'all' || feasibleFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setFeasibleFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: () => 'Bihar' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Rooftop Site Name', accessor: (r) => siteNameOf(r) },
      { header: 'CA Number / UID', accessor: (r) => r.ca_no || r.uid || DASH },
      { header: 'Sanction Load (KW)', accessor: (r) => (r.sanction_load || r.connected_load ? `${r.sanction_load || r.connected_load} KW` : DASH) },
      { header: 'Vendor Agency', accessor: (r) => vendorNameOf(r) },
      { header: 'Roof Condition', accessor: (r) => r.roof_condition === '1' ? 'Feasible / Good' : (r.roof_condition || DASH) },
      { header: 'Feasibility', accessor: (r) => (isFeasible(r) ? 'Feasible' : 'Not Feasible') },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_200MW_Status_View', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_200MW_Status_View', filtered, exportCols);
  const handlePdf = () => printTableData(pageTitle, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title={pageTitle}
        subtitle="Solar Rooftop (SRT 200MW) survey operations and feasibility register"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'SRT 200MW Survey', href: '/vendor-management/bihar/srt200mw/survey/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/vendor-management/bihar/srt200mw/survey/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
              sub={`${summary.feasibleCount} feasible · ${summary.vApp} approved`}
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
              label="Feasible Rooftops"
              value={summary.feasibleCount.toLocaleString('en-IN')}
              sub={`${summary.total - summary.feasibleCount} non-feasible`}
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
              sub="Quality clearance granted"
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
              sub={`${summary.vRej} rejected / rework`}
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
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT 200MW status records table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Bihar SRT 200MW Status Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{items.length}</span> surveys
                {' '}· Feasible <b className="ax-num">{summary.feasibleCount}</b> · Verified <b className="ax-num">{summary.vApp}</b> · In Audit <b className="ax-num">{summary.vPend}</b>
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
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by feasibility"
                  value={feasibleFilter}
                  onChange={(e) => {
                    setFeasibleFilter(e.target.value as FeasibleFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Feasibility</option>
                  <option value="feasible">Feasible Only</option>
                  <option value="not_feasible">Non-Feasible</option>
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
                  placeholder="Search site, CA no, vendor…"
                  size="sm"
                  ariaLabel="Search SRT sites"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SRT 200MW Status Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Rooftop Site Name</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">CA Number / UID</th>
                  <th className="ax-table__th" scope="col">Sanction Load (KW)</th>
                  <th className="ax-table__th" scope="col">Vendor Agency</th>
                  <th className="ax-table__th" scope="col">Roof Condition</th>
                  <th className="ax-table__th" scope="col">Feasibility</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Bihar SRT 200MW status records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No records found"
                        message={hasFilters ? 'No survey sites match your filters. Try clearing filters or search term.' : errorMsg || 'No survey sites found for this status query.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const feasible = isFeasible(row);
                    const vs = verifyState(row);
                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {siteNameOf(row)}
                          {row.site_address && (
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 400 }}>
                              {row.site_address}
                            </span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.district)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                          {row.ca_no || row.uid || DASH}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          {row.sanction_load || row.connected_load ? `${row.sanction_load || row.connected_load} KW` : DASH}
                        </td>
                        <td className="ax-table__td">{vendorNameOf(row)}</td>
                        <td className="ax-table__td">
                          {row.roof_condition === '1' ? 'Good / RCC' : txt(row.roof_condition)}
                        </td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${feasible ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                            <span className="ax-badge__dot" />
                            {feasible ? 'Feasible' : 'Not Feasible'}
                          </span>
                        </td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${verifyTone(vs)}`}>
                            <span className="ax-badge__dot" />
                            {verifyLabel(vs)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setSelectedRecord(row)}
                          >
                            View Audit
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

      {/* ── Detail Modal for Site Technical Audit ── */}
      {selectedRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setSelectedRecord(null)} />
          <div className="ax-modal__dialog">
            <div className="ax-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  {siteNameOf(selectedRecord)}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  CA: {selectedRecord.ca_no || selectedRecord.uid || 'N/A'} · District: {selectedRecord.district || 'Bihar'} · Division: {selectedRecord.division || '—'}
                </span>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Vendor Partner</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{vendorNameOf(selectedRecord)}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Sanction Load</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: 'var(--ax-accent)' }}>
                    {selectedRecord.sanction_load || selectedRecord.connected_load ? `${selectedRecord.sanction_load || selectedRecord.connected_load} KW` : 'N/A'}
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Roof Condition</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    {selectedRecord.roof_condition === '1' ? 'Feasible / Good' : (selectedRecord.roof_condition || 'RCC Flat')}
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Feasibility Status</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: isFeasible(selectedRecord) ? 'var(--ax-viz-emerald, #10b981)' : 'var(--ax-viz-red, #ef4444)' }}>
                    {isFeasible(selectedRecord) ? 'Feasible for Rooftop Solar' : 'Non-Feasible'}
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>3-Phase Grid Connection</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    {selectedRecord.all_3_phase_ltdb === '1' || selectedRecord.all_3_phase_ltdb === 'Yes' ? 'Available (3-Phase)' : '1-Phase'}
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Water Source For Cleaning</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedRecord.water_source || 'Available Onsite'}</div>
                </div>
              </div>

              {/* Photo Evidence Section */}
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Geo-Tagged Feasibility Images & Drawing
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Building Photo', img: selectedRecord.image1 },
                  { label: 'Roof Area', img: selectedRecord.image2 },
                  { label: 'Control Room / LTDB', img: selectedRecord.image3 },
                  { label: 'Survey Drawing / Meter', img: selectedRecord.image4 },
                ].map((item, i) => (
                  <div key={i} style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 8, textAlign: 'center', background: 'var(--ax-bg-subtle, #f8fafc)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'var(--ax-text-muted)' }}>{item.label}</div>
                    {item.img ? (
                      <>
                        <img
                          src={resolveBiharMediaUrl(item.img)}
                          alt={item.label}
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={resolveBiharMediaUrl(item.img)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          style={{ marginTop: 6 }}
                        >
                          Full Size
                        </a>
                      </>
                    ) : (
                      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
                        Not Uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="ax-modal__footer">
              {selectedRecord.pdf_file ? (
                <a
                  href={resolveBiharMediaUrl(selectedRecord.pdf_file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                >
                  View Survey PDF Document ↗
                </a>
              ) : <span />}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedRecord(null)}
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

export default BiharSRT200MWSurveyStatusView;
