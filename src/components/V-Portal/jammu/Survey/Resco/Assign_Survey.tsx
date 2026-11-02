import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../../../common';
import {
  getStoredAssignedSites,

  type AssignedRescoSite,
} from './rescoSurveyData';

/* ───────── Responsive Page CSS (Matching Karnataka / Solar ERP Reference) ───────── */
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
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
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

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const X_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ width: 16, height: 16 }}
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export function Assign_Survey() {

  const [records, setRecords] = useState<AssignedRescoSite[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modal item for details preview
  const [detailModalItem, setDetailModalItem] = useState<AssignedRescoSite | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  useEffect(() => {
    setRecords(getStoredAssignedSites());
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = records;
    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district.toLowerCase() === districtFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.surveyStatus === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          r.vendor.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.siteName.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.caNo.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [records, search, districtFilter, statusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 8 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Top metric stats
  const totalAssignedSites = records.length;
  const completedCount = records.filter((r) => r.surveyStatus === 'completed').length;
  const pendingCount = records.filter((r) => r.surveyStatus === 'pending').length;
  const totalSiteCount = records.reduce((s, r) => s + (r.siteCount || 1), 0);

  /* ───────── Export Actions ───────── */
  const EXPORT_HEADERS = [
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Site Name',
    'Site Count',
    'File',
    'Remarks',
    'Status',
  ];

  const handleCopy = () => {
    if (!filtered.length) return;
    const lines = [
      EXPORT_HEADERS.join('\t'),
      ...filtered.map((r, i) =>
        [
          i + 1,
          r.vendor,
          r.assignDate,
          r.state,
          r.district,
          r.siteName,
          r.siteCount,
          r.fileUrl,
          r.remarks,
          r.surveyStatus === 'completed' ? 'Survey Completed' : 'Pending Survey',
        ].join('\t')
      ),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setToastMsg({ type: 'success', text: `Copied ${filtered.length} assigned RESCO sites to clipboard!` });
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const lines = [
      EXPORT_HEADERS.map((h) => `"${h}"`).join(','),
      ...filtered.map((r, i) =>
        [
          i + 1,
          `"${r.vendor}"`,
          `"${r.assignDate}"`,
          `"${r.state}"`,
          `"${r.district}"`,
          `"${r.siteName.replace(/"/g, '""')}"`,
          r.siteCount,
          `"${r.fileUrl}"`,
          `"${r.remarks.replace(/"/g, '""')}"`,
          `"${r.surveyStatus === 'completed' ? 'Survey Completed' : 'Pending Survey'}"`,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jammu_Assigned_Resco_Sites_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'CSV assigned sites file exported successfully!' });
  };

  const handleExportExcel = () => {
    if (!filtered.length) return;
    const headerRow = `<tr>${EXPORT_HEADERS.map((h) => `<th style="background:#2563eb;color:#fff;padding:6px;border:1px solid #ccc;">${h}</th>`).join('')}</tr>`;
    const dataRows = filtered
      .map(
        (r, i) =>
          `<tr>
            <td style="border:1px solid #ccc;padding:4px 8px;">${i + 1}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.vendor}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.assignDate}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.state}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.district}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.siteName}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;text-align:center;">${r.siteCount}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.fileUrl}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.remarks}</td>
            <td style="border:1px solid #ccc;padding:4px 8px;">${r.surveyStatus === 'completed' ? 'Survey Completed' : 'Pending Survey'}</td>
          </tr>`
      )
      .join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"/></head><body><table border="1">${headerRow}${dataRows}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jammu_Assigned_Resco_Sites_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'Excel assigned sites file exported successfully!' });
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Resco Site"
        subtitle="Review institutional and government rooftop solar sites allocated under the RESCO model across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: 'Assigned Resco Site' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => {
                setRecords(getStoredAssignedSites());
                setToastMsg({ type: 'success', text: 'Assigned RESCO sites reloaded!' });
              }}
              title="Refresh assigned sites"
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/survey/resco/pending-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Conduct Feasibility Survey</span>
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

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assigned Sites"
          value={totalAssignedSites.toLocaleString('en-IN')}
          sub={`${totalSiteCount} total site units`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Feasibility"
          value={pendingCount.toLocaleString('en-IN')}
          sub="Awaiting engineer site visit"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Completed Surveys"
          value={completedCount.toLocaleString('en-IN')}
          sub="Feasibility reports registered"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Covered Districts"
          value={`${districts.length} Districts`}
          sub="Across Jammu Division"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned RESCO sites table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Resco Sites</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> sites
              {' '}· Completed <b className="ax-num">{completedCount}</b> · Pending <b className="ax-num">{pendingCount}</b>
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
                  aria-label="Filter by District"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by Survey Status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Survey</option>
                <option value="completed">Completed Survey</option>
              </select>

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
                placeholder="Search vendor, site, CA, district…"
                size="sm"
                ariaLabel="Search assigned RESCO sites"
              />

              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with exact user columns: Sr. No., Vendor, Assign Date, State, District, Site Name, Site Count, File, Remarks ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--ax-surface-subtle, #f8fafc)' }}>
              <tr>
                <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center', position: 'sticky', left: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12 }}>
                  Sr. No.
                </th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">Assign Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned RESCO sites found"
                      message={hasFilters ? 'No sites match your current filters. Try resetting search.' : 'No RESCO survey assignments registered.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isCompleted = row.surveyStatus === 'completed';

                  return (
                    <tr key={row.id} className="ax-table__row">
                      {/* Sr. No. */}
                      <td
                        className="ax-table__td ax-num"
                        style={{
                          textAlign: 'center',
                          position: 'sticky',
                          left: 0,
                          background: 'var(--ax-surface-solid)',
                          zIndex: 6,
                        }}
                      >
                        {serialNumber}
                      </td>

                      {/* Vendor */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor}
                      </td>

                      {/* Assign Date */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.assignDate}
                      </td>

                      {/* State */}
                      <td className="ax-table__td">{row.state}</td>

                      {/* District */}
                      <td className="ax-table__td">
                        <b>{row.district}</b>
                      </td>

                      {/* Site Name */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 280, whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>{row.siteName}</span>
                          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{row.id} · {row.caNo}</span>
                        </div>
                      </td>

                      {/* Site Count */}
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">
                          {row.siteCount}
                        </span>
                      </td>

                      {/* File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setToastMsg({ type: 'success', text: `Work Order document downloaded for ${row.siteName}` })}
                          style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                          title="Download Work Order PDF"
                        >
                          📄 View File
                        </button>
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 260, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.remarks}
                      </td>

                      {/* Action */}
                      <td
                        className="ax-table__td"
                        style={{
                          textAlign: 'center',
                          position: 'sticky',
                          right: 0,
                          background: 'var(--ax-surface-solid)',
                          zIndex: 6,
                          boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setDetailModalItem(row)}
                            title="View allocation details"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            Details
                          </button>

                          {!isCompleted ? (
                            <Link
                              to={`/v/jammu/survey/resco/pending-survey?siteId=${row.id}`}
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600 }}
                            >
                              Conduct Survey ➔
                            </Link>
                          ) : (
                            <Link
                              to="/v/jammu/survey/resco/view-survey"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11, color: '#16a34a' }}
                            >
                              ✓ Surveyed
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 8, 15, 25, 50]}
            />
          </div>
        </div>
      </section>

      {/* ── View Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="assigned-site-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 640 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="assigned-site-detail-title" style={{ fontSize: 15, fontWeight: 700 }}>
                RESCO Allocation Details: {detailModalItem.id}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13, marginBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Unique ID</span>
                  <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{detailModalItem.id}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor</span>
                  <b>{detailModalItem.vendor}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Name</span>
                  <b>{detailModalItem.siteName}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                  <b>{detailModalItem.department}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District &amp; Division</span>
                  <b>{detailModalItem.district} · {detailModalItem.division}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sub Division</span>
                  <b>{detailModalItem.subDivision}</b>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Location &amp; Address</span>
                  <b>{detailModalItem.location}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                  <b style={{ fontFamily: 'monospace' }}>{detailModalItem.caNo}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                  {detailModalItem.surveyStatus === 'completed' ? (
                    <Badge tone="success">Survey Completed</Badge>
                  ) : (
                    <Badge tone="warning">Pending Feasibility</Badge>
                  )}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Remarks</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {detailModalItem.remarks}
                  </p>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <Link
                to={`/v/jammu/survey/resco/pending-survey?siteId=${detailModalItem.id}`}
                className="ax-btn ax-btn--primary ax-btn--sm"
              >
                Go to Feasibility Form ➔
              </Link>
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

export default Assign_Survey;
