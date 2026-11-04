import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wAssignSiteItem,
} from '../../up-services';
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

const DASH = '—';

/* ───────── API helpers ───────── */

// API se status string ("2") aata hai, local update ke baad number (2) — dono handle karo
const isAcceptedStatus = (status: number | string | null | undefined) => Number(status) === 2;

// village: '["Bhartapur"]' -> 'Bhartapur'
const parseVillages = (v?: string | null): string => {
  if (!v) return '';
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p.map(String).filter(Boolean).join(', ') : String(p);
  } catch {
    return v;
  }
};

// '2026-11-04 12:51:16' -> '2026-11-04'
const fmtDate = (d?: string | null) => (d ? d.split(/[ T]/)[0] : '');

/* ───────── KPI Card ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
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
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
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

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  children: ReactNode;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Main Component ───────── */
const TOTAL_COLUMNS = 12;

export function UP_Installation_SSL_AssignedLights() {
  const [sites, setSites] = useState<UpSsl18wAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Detail modal
  const [viewItem, setViewItem] = useState<UpSsl18wAssignSiteItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getSsl18wAssignSites();
      setSites(res.data || []);
    } catch (err: any) {
      console.warn('[UP SSL AssignedLights] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load assigned installation sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  /* ── Accept handler ── */
  const handleAccept = async (id: number) => {
    if (actionLoadingId !== null) return;
    if (!window.confirm(`Are you sure you want to accept this installation assignment #${id}?`)) return;

    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await upInstallationService.acceptSsl18wInstallation(id);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Installation assignment accepted successfully!' });
        setSites((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 2 } : item))
        );
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to accept installation.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to accept assignment. Please try again.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Summary counts ── */
  const summary = useMemo(() => {
    const accepted = sites.filter((s) => isAcceptedStatus(s.status)).length;
    return { total: sites.length, accepted, pending: sites.length - accepted };
  }, [sites]);

  /* ── Distinct districts ── */
  const districts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district && s.district.trim()) set.add(s.district.trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  /* ── Filtered data ── */
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (statusFilter === 'pending' && isAcceptedStatus(s.status)) return false;
      if (statusFilter === 'accepted' && !isAcceptedStatus(s.status)) return false;

      if (districtFilter !== 'all' && (s.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          String(s.id),
          s.vendor || '',
          s.state || '',
          s.district || '',
          s.block || '',
          parseVillages(s.village),
          s.remarks || '',
          s.assign_date || '',
          s.deadline_date || '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [sites, statusFilter, districtFilter, search]);

  /* ── Paginated slice ── */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const setStatus = (s: 'all' | 'pending' | 'accepted') => {
    setStatusFilter(s);
    setCurrentPage(1);
  };

  /* ── Export columns ── */
  const exportCols: ExportColumn<UpSsl18wAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'Vendor', accessor: (r) => r.vendor || DASH },
      { header: 'State', accessor: (r) => (r.state ? r.state.toUpperCase() : 'UP') },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Village', accessor: (r) => parseVillages(r.village) || DASH },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date) || DASH },
      { header: 'Deadline', accessor: (r) => fmtDate(r.deadline_date) || DASH },
      { header: 'Site Count', accessor: (r) => String(r.site_count ?? DASH) },
      { header: 'File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (isAcceptedStatus(r.status) ? 'Accepted' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Assigned SSL 18W Installation"
        subtitle="Welcome to, View and accept assigned 18W solar street light installations across Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL Install 18w Light' },
          { label: 'Assigned Lights' },
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
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              Install Light
            </Link>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards (click to filter) ── */}
      {!loading && (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <KpiCard
            tone="accent"
            label="Total Assigned"
            value={summary.total.toLocaleString('en-IN')}
            sub="All assigned batches"
            active={statusFilter === 'all'}
            onClick={() => setStatus('all')}
            icon={svg(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />
          <KpiCard
            tone="amber"
            label="Pending"
            value={summary.pending.toLocaleString('en-IN')}
            sub="Waiting for acceptance"
            active={statusFilter === 'pending'}
            onClick={() => setStatus('pending')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </>
            )}
          />
          <KpiCard
            tone="emerald"
            label="Accepted"
            value={summary.accepted.toLocaleString('en-IN')}
            sub="Accepted by vendor"
            active={statusFilter === 'accepted'}
            onClick={() => setStatus('accepted')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned SSL Light Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">ASSIGNED SITES</span>
              <h2 className="ax-card__title">View Assign SSL Light</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSites.length} of {sites.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value as 'all' | 'pending' | 'accepted')}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={resetFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search vendor, district, block…"
                  size="sm"
                  ariaLabel="Search assigned lights"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                  onExportCSV={() => exportDataToCSV('UP_SSL_18w_Assigned_Lights', filteredSites, exportCols)}
                  onExportExcel={() => exportDataToExcel('UP_SSL_18w_Assigned_Lights', filteredSites, exportCols)}
                  onExportPDF={() => printTableData('UP SSL 18W Assigned Lights', filteredSites, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1400 }}
            >
              <caption className="ax-visually-hidden">View Assigned SSL 18W Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">Deadline</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>File</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ width: 110 }}>Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned lights…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No 18W SSL batches currently assigned.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((item, index) => {
                    const accepted = isAcceptedStatus(item.status);
                    const fileUrl = item.file ? resolveUpMediaUrl(item.file) : '';

                    return (
                      <tr key={item.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {item.vendor || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                          {item.state || 'UP'}
                        </td>
                        <td className="ax-table__td">{item.district || DASH}</td>
                        <td className="ax-table__td">{item.block || DASH}</td>
                        <td className="ax-table__td">{parseVillages(item.village) || DASH}</td>
                        <td className="ax-table__td">{fmtDate(item.assign_date) || DASH}</td>
                        <td className="ax-table__td">{fmtDate(item.deadline_date) || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px',
                              borderRadius: 'var(--ax-radius-pill, 9999px)',
                              background: 'rgba(var(--ax-accent-rgb, 73, 146, 255), 0.1)',
                              color: 'var(--ax-accent)',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {item.site_count ?? DASH}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              View File
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {item.remarks || DASH}
                        </td>
                        <td className="ax-table__td">
                          {accepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                              Accepted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-badge ax-badge--soft ax-badge--warning"
                              style={{ fontWeight: 600, cursor: 'pointer', border: 'none' }}
                              onClick={() => handleAccept(item.id)}
                              disabled={actionLoadingId !== null}
                              title="Click to accept assignment"
                            >
                              {actionLoadingId === item.id ? 'Accepting…' : 'Pending'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredSites.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Detail Modal ── */}
      {viewItem && (
        <Modal
          open={!!viewItem}
          onClose={() => setViewItem(null)}
          labelledBy="ssl-detail-modal-title"
          dialogStyle={{ maxWidth: 620 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <h3 id="ssl-detail-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Assignment #{viewItem.id} Details
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                District: <b>{viewItem.district || 'UP'}</b> · Vendor: <b>{viewItem.vendor || DASH}</b>
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setViewItem(null)}
              aria-label="Close modal"
            >
              {X_ICON}
            </button>
          </div>
          <div className="ax-modal__body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span><strong>{viewItem.vendor || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{(viewItem.state || 'UP').toUpperCase()}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{viewItem.district || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Block: </span><strong>{viewItem.block || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Village: </span><strong>{parseVillages(viewItem.village) || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span><strong>{fmtDate(viewItem.assign_date) || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Deadline: </span><strong>{fmtDate(viewItem.deadline_date) || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Count: </span><strong>{viewItem.site_count ?? DASH}</strong></div>
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span><strong>{viewItem.remarks || DASH}</strong></div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
                {isAcceptedStatus(viewItem.status) ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Accepted</span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                )}
              </div>
            </div>
          </div>
          <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setViewItem(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UP_Installation_SSL_AssignedLights;