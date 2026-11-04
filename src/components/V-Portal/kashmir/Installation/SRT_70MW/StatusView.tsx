import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { kashmirSrtService } from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Constants ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Status options ───────── */
const STATUS_OPTIONS: { key: string; label: string; tone: string }[] = [
  { key: 'total', label: 'All Sites (Total)', tone: 'neutral' },
  { key: 'material-dispatch', label: 'Material Dispatched', tone: 'accent' },
  { key: 'material-pending', label: 'Material Pending', tone: 'warning' },
  { key: 'inst-complete', label: 'Installation Complete', tone: 'success' },
  { key: 'inst-pending', label: 'Installation Pending', tone: 'warning' },
  { key: 'verify-pending', label: 'Verify Pending', tone: 'warning' },
  { key: 'verify-approved', label: 'Verify Approved', tone: 'success' },
  { key: 'verify-reject', label: 'Verify Rejected', tone: 'danger' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'info' },
  { key: 'claim-raised', label: 'Claim Raised', tone: 'info' },
  { key: 'claim-approved', label: 'Claim Approved', tone: 'success' },
  { key: 'inst-pay80-done', label: '80% Payment Disbursed', tone: 'success' },
  { key: 'inst-pay20-done', label: '20% Payment Disbursed', tone: 'success' },
  { key: 'inst-pay80-pending', label: '80% Payment Pending', tone: 'warning' },
  { key: 'inst-pay20-pending', label: '20% Payment Pending', tone: 'warning' },
];

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

  /* ── Status Pills ── */
  .solar-erp-page .status-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }
  .solar-erp-page .status-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text, #334155);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .solar-erp-page .status-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
    background: rgba(37, 99, 235, 0.04);
  }
  .solar-erp-page .status-pill-btn.active {
    background: var(--ax-accent, #2563eb);
    border-color: var(--ax-accent, #2563eb);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }
`;

/* ───────── Badge helper ───────── */
function StatusBadge({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; children: React.ReactNode }) {
  return (
    <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${tone}`}>
      <span className="ax-badge__dot" />
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export function Kashmir_Installation_StatusView() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const currentStatus = params.status || searchParams.get('status') || 'total';
  const currentDistrict = params.district || searchParams.get('district') || '';

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState(currentDistrict);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync route param changes to state
  useEffect(() => {
    setDistrictFilter(currentDistrict);
  }, [currentDistrict]);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (districtFilter) {
        const list = await kashmirSrtService.getDashboardDistrictwise(currentStatus, districtFilter);
        setSites(Array.isArray(list) ? list : []);
      } else {
        const list = await kashmirSrtService.getDashboardByStatus(currentStatus);
        setSites(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      console.warn('Failed to load status sites:', err);
      setApiError(err?.message || 'Failed to load status drilldown records from server.');
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, districtFilter]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Distinct districts from site records
  const allDistricts = useMemo(() => {
    const s = new Set<string>();
    sites.forEach((r) => {
      if (r.district && String(r.district).trim()) {
        s.add(String(r.district).trim());
      }
    });
    return Array.from(s).sort();
  }, [sites]);

  // Filtered sites
  const filtered = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => {
      const idStr = String(s.id || '');
      const uidStr = String(s.uid || '').toLowerCase();
      const siteStr = String(s.site_name || '').toLowerCase();
      const distStr = String(s.district || '').toLowerCase();
      const contactStr = String(s.contact_person || '').toLowerCase();
      const phoneStr = String(s.contact_number || '').toLowerCase();
      const invStr = String(s.inverter_no || '').toLowerCase();
      const meterStr = String(s.solarmeter_no || '').toLowerCase();

      return (
        idStr.includes(q) ||
        uidStr.includes(q) ||
        siteStr.includes(q) ||
        distStr.includes(q) ||
        contactStr.includes(q) ||
        phoneStr.includes(q) ||
        invStr.includes(q) ||
        meterStr.includes(q)
      );
    });
  }, [sites, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Active status meta
  const activeMeta = useMemo(() => {
    return STATUS_OPTIONS.find((o) => o.key === currentStatus) || {
      key: currentStatus,
      label: currentStatus.replace(/-/g, ' ').toUpperCase(),
      tone: 'accent',
    };
  }, [currentStatus]);

  // Filter helpers
  const hasFilters = !!search || !!districtFilter;
  const clearFilters = () => {
    setSearch('');
    setDistrictFilter('');
    setPage(1);
    if (currentStatus) {
      navigate(`/v/kashmir/srt/70mw-installation-view-dashboard/${currentStatus}`);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Site ID', accessor: (r) => r.uid || `#${r.id}` },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Installation Date', accessor: (r) => r.inst_date || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      {
        header: 'Installation Status',
        accessor: (r) => (Number(r.site_inst_status) === 1 ? 'Installed' : 'Pending'),
      },
      {
        header: 'Verification Status',
        accessor: (r) =>
          Number(r.inst_verify_status) === 1
            ? 'Approved'
            : Number(r.inst_verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      {
        header: 'Claim Status',
        accessor: (r) =>
          Number(r.inst_claim_status) === 2
            ? 'Approved'
            : Number(r.inst_claim_status) === 1
            ? 'Raised'
            : 'Not Raised',
      },
      {
        header: '80% Payment',
        accessor: (r) =>
          Number(r.inst_pay80_status) === 1
            ? 'Done'
            : Number(r.inst_pay80_status) === 2
            ? 'Partially'
            : 'Pending',
      },
      {
        header: '20% Payment',
        accessor: (r) =>
          Number(r.inst_pay20_status) === 1
            ? 'Done'
            : Number(r.inst_pay20_status) === 2
            ? 'Partially'
            : 'Pending',
      },
    ],
    []
  );

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Kashmir_SRT_${currentStatus}_sites`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Kashmir_SRT_${currentStatus}_sites`, filtered, exportCols);
  const handlePdf = () => printTableData(`Kashmir SRT ${activeMeta.label}`, filtered, exportCols);

  const handleStatusChange = (newStatus: string) => {
    if (districtFilter) {
      navigate(`/v/kashmir/srt/70mw-installation-districtwise/${newStatus}/${encodeURIComponent(districtFilter)}`);
    } else {
      navigate(`/v/kashmir/srt/70mw-installation-view-dashboard/${newStatus}`);
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrictFilter(newDist);
    setPage(1);
    if (newDist) {
      navigate(`/v/kashmir/srt/70mw-installation-districtwise/${currentStatus}/${encodeURIComponent(newDist)}`);
    } else {
      navigate(`/v/kashmir/srt/70mw-installation-view-dashboard/${currentStatus}`);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={`Kashmir SRT 70MW: ${activeMeta.label}`}
        subtitle={
          <span>
            Drilldown view of SRT installation sites for status: <b>{activeMeta.label}</b>
            {districtFilter ? <> in district: <b>{districtFilter}</b></> : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'Dashboard', href: '/v/kashmir/srt/70mw/installation/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <Link to="/v/kashmir/srt/70mw/installation/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="ax-btn__label">Dashboard</span>
            </Link>
            <Link to="/v/kashmir/srt/70mw/installation/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Install Site</span>
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadSites}
              disabled={loading}
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── Error Alert ── */}
      {apiError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="ax-alert__content">{apiError}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setApiError(null)}
            aria-label="Dismiss error"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── Status Pills Selector ── */}
      <div className="ax-card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span className="ax-card__eyebrow" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Filter by Status
          </span>
          <div className="status-pills">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`status-pill-btn ${currentStatus === opt.key ? 'active' : ''}`}
                onClick={() => handleStatusChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Sites Table Card ── */}
      <section className="ax-card" role="region" aria-label="Kashmir SRT 70MW Status View">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">Kashmir SRT 70MW</span>
            <h2 className="ax-card__title">{activeMeta.label}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> sites
              {districtFilter && <> in <b>{districtFilter}</b></>}
              {' '}· List of SRT installation sites matching status criteria
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                aria-label="Filter by district"
                value={districtFilter}
                onChange={(e) => handleDistrictChange(e.target.value)}
                style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
              >
                <option value="">All Districts</option>
                {allDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
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
                  setPage(1);
                }}
                placeholder="Search site, CA, meter…"
                size="sm"
                ariaLabel="Search installations"
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
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
            <caption className="ax-visually-hidden">Kashmir SRT 70MW Status View</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th" scope="col">Site ID</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Contact</th>
                <th className="ax-table__th" scope="col">Install Date</th>
                <th className="ax-table__th" scope="col">Install Status</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col">Claim Status</th>
                <th className="ax-table__th" scope="col">80% Pay</th>
                <th className="ax-table__th" scope="col">20% Pay</th>
                <th className="ax-table__th" scope="col" style={{ width: 140, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                    Loading Kashmir SRT installation sites…
                  </td>
                </tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found matching criteria"
                      message={
                        search
                          ? 'Try clearing or adjusting your search keyword.'
                          : `No sites currently in "${activeMeta.label}".`
                      }
                      onClear={hasFilters ? clearFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginated.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const isInstalled = Number(r.site_inst_status) === 1;
                  const vStatus = Number(r.inst_verify_status ?? 0);
                  const cStatus = Number(r.inst_claim_status ?? 0);
                  const p80 = Number(r.inst_pay80_status ?? 0);
                  const p20 = Number(r.inst_pay20_status ?? 0);

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                        {r.uid || `#${r.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(r.site_name)}
                      </td>
                      <td className="ax-table__td">{txt(r.district)}</td>
                      <td className="ax-table__td">
                        {r.contact_person ? (
                          <div style={{ fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>{r.contact_person}</div>
                            {r.contact_number && (
                              <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginTop: 1 }}>{r.contact_number}</div>
                            )}
                          </div>
                        ) : (
                          DASH
                        )}
                      </td>
                      <td className="ax-table__td">{txt(r.inst_date)}</td>

                      {/* Install Status */}
                      <td className="ax-table__td">
                        {isInstalled ? (
                          <StatusBadge tone="success">Installed</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">Pending</StatusBadge>
                        )}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td">
                        {vStatus === 1 ? (
                          <StatusBadge tone="success">Approved</StatusBadge>
                        ) : vStatus === 2 ? (
                          <StatusBadge tone="danger">Rejected</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">Pending</StatusBadge>
                        )}
                      </td>

                      {/* Claim Status */}
                      <td className="ax-table__td">
                        {cStatus === 2 ? (
                          <StatusBadge tone="success">Approved</StatusBadge>
                        ) : cStatus === 1 ? (
                          <StatusBadge tone="info">Raised</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Not Raised</StatusBadge>
                        )}
                      </td>

                      {/* 80% Payment */}
                      <td className="ax-table__td">
                        {p80 === 1 ? (
                          <StatusBadge tone="success">Done</StatusBadge>
                        ) : p80 === 2 ? (
                          <StatusBadge tone="warning">Partial</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Pending</StatusBadge>
                        )}
                      </td>

                      {/* 20% Payment */}
                      <td className="ax-table__td">
                        {p20 === 1 ? (
                          <StatusBadge tone="success">Done</StatusBadge>
                        ) : p20 === 2 ? (
                          <StatusBadge tone="warning">Partial</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Pending</StatusBadge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                          {!isInstalled ? (
                            <Link
                              to={`/v/kashmir/srt/70mw/installation/site?srt_id=${r.id}`}
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <svg style={{ width: 12, height: 12, marginRight: 3, verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 5l0 14" />
                                <path d="M5 12l14 0" />
                              </svg>
                              Install
                            </Link>
                          ) : (
                            <>
                              <Link
                                to={`/v/kashmir/srt/70mw/installation/site?edit=1&srt_id=${r.id}`}
                                className="ax-btn ax-btn--ghost ax-btn--xs"
                                title="Edit installation data"
                              >
                                Edit
                              </Link>
                              <Link
                                to={`/v/kashmir/srt/70mw/view-install-sites`}
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                title="View in installation details"
                              >
                                View
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              pageSizeOptions={[50, 100, 200]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Kashmir_Installation_StatusView;