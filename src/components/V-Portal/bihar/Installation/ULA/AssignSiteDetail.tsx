import { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type AssignSiteItem,
} from '../../../../../services/biharUlaInstallationService';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_BACK = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const fmtDate = (v: unknown) => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v ?? '') || DASH;
};
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : DASH);

interface SiteRow {
  id: string | number;
  assignDate: string;
  state: string;
  district: string;
  block: string;
  village: string;
  beneficiary: string;
  deadline: string;
}

// Export ke liye row (Sr. No. ke saath)
interface ExportRow extends SiteRow {
  srNo: string;
}

/* ───────── Responsive CSS (Bihar AMC view jaisa) ───────── */
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
  .solar-erp-page .ax-card__subtitle {
    max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 240px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--wide { min-width: 900px; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }

    .solar-erp-page .ula-sticky-first th:first-child,
    .solar-erp-page .ula-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1;
      background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
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

export function Bihar_Installation_ULA_AssignSiteDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const assignId = searchParams.get('id') || (location.state as any)?.assignment?.id || '';

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignSiteItem | null>(
    (location.state as any)?.assignment || null
  );
  const [sites, setSites] = useState<any[]>(
    (location.state as any)?.assignment?.sites || []
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [q, setQ] = useState('');

  // Load detailed assignment data
  const loadDetail = useCallback(async () => {
    if (!assignId) {
      setErrorMsg('No assignment ID specified in request URL.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const data: any = await biharUlaInstallationService.getAssignSiteDetail(assignId);
      if (data) {
        setAssignment(data);
        const rawSites = data.sites || data;
        setSites(Array.isArray(rawSites) ? rawSites : [rawSites]);
      } else {
        setErrorMsg(`Unable to load details for assignment #${assignId}.`);
      }
    } catch (err: any) {
      console.error('[AssignSiteDetail] fetch error:', err);
      setErrorMsg(err?.message || 'Failed to load assignment site details.');
    } finally {
      setLoading(false);
    }
  }, [assignId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Rows (sirf required columns)
  const data = useMemo<SiteRow[]>(
    () =>
      sites.map((s, i) => ({
        id: s.id ?? i,
        assignDate: fmtDate(s.inst_assign_date || assignment?.created_at),
        state: cap(String(s.state || 'Bihar')),
        district: String(s.district || DASH),
        block: String(s.block || DASH),
        village: String(s.village || DASH),
        beneficiary: String(s.beneficiary_name || DASH),
        deadline: fmtDate(s.inst_deadline || assignment?.deadline_date),
      })),
    [sites, assignment]
  );

  const deferredQ = useDeferredValue(q);

  const filtered = useMemo(() => {
    const s = deferredQ.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (r) =>
        r.assignDate.toLowerCase().includes(s) ||
        r.state.toLowerCase().includes(s) ||
        r.district.toLowerCase().includes(s) ||
        r.block.toLowerCase().includes(s) ||
        r.village.toLowerCase().includes(s) ||
        r.beneficiary.toLowerCase().includes(s) ||
        r.deadline.toLowerCase().includes(s)
    );
  }, [data, deferredQ]);

  /* ───────── Pagination (common) ───────── */
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* ───────── Export ───────── */
  // Poora filtered data (saari pages), Sr. No. ke saath
  const exportRows = useMemo<ExportRow[]>(
    () => filtered.map((r, i) => ({ ...r, srNo: String(i + 1) })),
    [filtered]
  );

  const exportCols: ExportColumn<ExportRow>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: 'srNo' },
      { header: 'Assign Date', accessor: 'assignDate' },
      { header: 'State', accessor: 'state' },
      { header: 'District', accessor: 'district' },
      { header: 'Block', accessor: 'block' },
      { header: 'Village', accessor: 'village' },
      { header: 'Beneficiary Name', accessor: 'beneficiary' },
      { header: 'Deadline Date', accessor: 'deadline' },
    ],
    []
  );

  const exportBase = `ula_assignment_${assignId}_sites`;

  // Data na ho to export na chale
  const guardExport = (fn: () => void) => () => {
    if (!exportRows.length) {
      window.alert('No site data available to export.');
      return;
    }
    fn();
  };

  const handleCopy = guardExport(() => copyTableDataToClipboard(exportRows, exportCols));
  const handleCSV = guardExport(() => exportDataToCSV(exportRows, exportCols, `${exportBase}.csv`));
  const handleExcel = guardExport(() => exportDataToExcel(exportRows, exportCols, `${exportBase}.xlsx`));
  const handlePrint = guardExport(() => printTableData(exportRows, exportCols, `ULA Assignment #${assignId} Sites`));

  const COLS = 8;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Assign Site Detail"
        subtitle="All sites included in this installation assignment."
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Request Accept', href: '/v/bihar/ula-installation-view-assign-site' },
          { label: `Batch #${assignId}` },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => navigate('/v/bihar/ula-installation-view-assign-site')}
            >
              {ICON_BACK}
              <span className="ax-btn__label">Back to Requests</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
              onClick={loadDetail}
              disabled={loading}
              title="Refresh"
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="View Assign Site Detail">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Sites in Assignment #{assignId}</h2>
              <p className="ax-card__subtitle"><span className="ax-num">{filtered.length}</span> sites.</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={q} onChange={setQ} placeholder="Search…" size="sm" />
                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCSV}
                  onExportExcel={handleExcel}
                  onPrint={handlePrint}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
              <caption className="ax-visually-hidden">View Assign Site Detail</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Deadline Date</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && <tr><td className="ax-table__td" colSpan={COLS} style={centerCell}>Loading…</td></tr>}
                {!loading && errorMsg && (
                  <tr><td className="ax-table__td" colSpan={COLS} style={{ ...centerCell, color: 'var(--ax-danger-500)' }}>{errorMsg}</td></tr>
                )}
                {!loading && !errorMsg && !paginatedData.length && (
                  <tr><td className="ax-table__td" colSpan={COLS} style={centerCell}>No Site Found</td></tr>
                )}
                {paginatedData.map((r, i) => (
                  <tr key={r.id} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="ax-table__td ax-num">{r.assignDate}</td>
                    <td className="ax-table__td">{r.state}</td>
                    <td className="ax-table__td">{r.district}</td>
                    <td className="ax-table__td">{r.block}</td>
                    <td className="ax-table__td">{r.village}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.beneficiary}</td>
                    <td className="ax-table__td ax-num">{r.deadline}</td>
                  </tr>
                ))}
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
                pageSizeOptions={[10, 20, 40]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_AssignSiteDetail;