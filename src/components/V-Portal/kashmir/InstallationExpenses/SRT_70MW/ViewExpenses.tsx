import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirExpenseItem,
} from '../../kashmir-services';
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
const TOTAL_COLUMNS = 14;

type ClaimFilter = 'all' | '1' | '2' | '3';

/* Safe getter: API field names pehle match karte hain jo mile wahi use hota hai */
const pick = (r: KashmirExpenseItem, ...keys: string[]): string => {
  const o = r as unknown as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
};

/**
 * Claim Status mapping:
 * 1: Pending  (yellow)
 * 2: Approved (green)
 * 3: Reject   (red)
 */
const isClaimApproved = (status: unknown): boolean => Number(status) === 2;

const getClaimStatusMeta = (status: unknown): { label: string; badgeClass: string } => {
  const raw = String(status ?? '').trim().toLowerCase();
  const num = Number(status);

  if (num === 2 || raw === 'approved') {
    return { label: 'Approved', badgeClass: 'ax-badge--success' }; // green
  }
  if (num === 3 || raw === 'reject' || raw === 'rejected') {
    return { label: 'Rejected', badgeClass: 'ax-badge--danger' }; // red
  }
  // 1 / pending / unknown
  return { label: 'Pending', badgeClass: 'ax-badge--warning' }; // yellow
};

const getClaimStatusVal = (r: KashmirExpenseItem): number => {
  const v = r.claim_status !== undefined && r.claim_status !== null ? r.claim_status : r.status;
  return Number(v);
};

const getSiteName = (r: KashmirExpenseItem): string => {
  const s = (r as any).site_name;
  if (s && typeof s === 'object') {
    return s.site_name || s.name || (r.site_id ? String(r.site_id) : DASH);
  }
  if (typeof s === 'string' && s.trim() && s.trim() !== '[object Object]') {
    return s.trim();
  }
  const alt = (r as any).site || (r as any).srt70mw || (r as any).site_details;
  if (alt && typeof alt === 'object') {
    const name = alt.site_name || alt.name;
    if (typeof name === 'string' && name.trim() && name.trim() !== '[object Object]') {
      return name.trim();
    }
  }
  return r.site_id ? String(r.site_id) : DASH;
};

const getDistrict = (r: KashmirExpenseItem): string => {
  if (typeof r.district === 'string' && r.district.trim() && r.district.trim() !== '[object Object]') {
    return r.district.trim();
  }
  const s = (r as any).site_name;
  if (s && typeof s === 'object' && typeof s.district === 'string' && s.district.trim() && s.district.trim() !== '[object Object]') {
    return s.district.trim();
  }
  const alt = (r as any).site || (r as any).srt70mw || (r as any).site_details;
  if (alt && typeof alt === 'object') {
    const d = alt.district;
    if (typeof d === 'string' && d.trim() && d.trim() !== '[object Object]') {
      return d.trim();
    }
  }
  return DASH;
};

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
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

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: var(--ax-radius-pill, 9999px); cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 6px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible {
    background: var(--ax-surface-subtle, #f1f5f9) !important;
    outline: none;
  }
  .ula-menu__item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

/* ── Action Dropdown (Portal rendered menu) ── */
const MENU_W = 180;
const MENU_H = 88;

interface RowActionDropdownProps {
  row: KashmirExpenseItem;
  isApproved: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onViewDetails: () => void;
  downloading: boolean;
}

function RowActionDropdown({
  isApproved,
  onEdit,
  onDownload,
  onViewDetails,
  downloading,
}: RowActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < MENU_H + 8 && r.top > MENU_H + 8 ? r.top - MENU_H - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    setPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
      >
        <span>Action</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 12,
            height: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            {/* If approved: show Download Claim PDF. If NOT approved: show Edit Claim */}
            {isApproved ? (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                disabled={downloading}
                onClick={() => {
                  setOpen(false);
                  onDownload();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 14, height: 14, color: '#059669', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{downloading ? 'Downloading…' : 'Download Claim PDF'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 14, height: 14, color: '#2563eb', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Edit Claim</span>
              </button>
            )}

            {/* Second button in dropdown: View Details */}
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 14, height: 14, color: '#64748b', flexShrink: 0 }}
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>View Details</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export function Kashmir_Expenses_ViewExpenses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KashmirExpenseItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ClaimFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<KashmirExpenseItem | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await kashmirSrtService.getExpenses();
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load expenses.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Download PDF handler
  const handleDownloadPdf = async (row: KashmirExpenseItem) => {
    if (downloadingId) return;
    setDownloadingId(row.id);
    try {
      const res = await kashmirSrtService.downloadExpenseClaimPdf(row.id, getSiteName(row));
      if (!res.success) {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to download claim PDF.' });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Claim PDF for #${row.id} (${getSiteName(row)}) downloaded successfully.`,
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Error downloading claim PDF.' });
    } finally {
      setDownloadingId(null);
    }
  };

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = getDistrict(r);
      if (d && d !== DASH) set.add(d);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all') {
        const val = getClaimStatusVal(r);
        if (val !== Number(statusFilter)) return false;
      }

      if (districtFilter !== 'all' && getDistrict(r).toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.purpose && r.purpose.toLowerCase().includes(q)) ||
        getSiteName(r).toLowerCase().includes(q) ||
        getDistrict(r).toLowerCase().includes(q) ||
        pick(r, 'project', 'project_name').toLowerCase().includes(q)
      );
    });
  }, [rows, search, districtFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export columns (same as table headers)
  const exportCols: ExportColumn<KashmirExpenseItem>[] = useMemo(
    () => [
      { header: 'Date', accessor: (r) => r.date || DASH },
      { header: 'State', accessor: (r) => pick(r, 'state') || 'Kashmir' },
      { header: 'Project', accessor: (r) => pick(r, 'project', 'project_name') || DASH },
      { header: 'Type', accessor: (r) => pick(r, 'type', 'expense_type') || DASH },
      { header: 'District', accessor: (r) => getDistrict(r) },
      { header: 'Site Name', accessor: (r) => getSiteName(r) },
      { header: 'Purpose', accessor: (r) => r.purpose || DASH },
      { header: 'Claim Amount', accessor: (r) => String(r.amount ?? '') },
      { header: 'Invoice File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => pick(r, 'remarks', 'remark') || DASH },
      { header: 'Claim Status', accessor: (r) => getClaimStatusMeta(getClaimStatusVal(r)).label },
      { header: 'Claim Status Remarks', accessor: (r) => pick(r, 'claim_remarks', 'approved_remarks') || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Installation Expenses"
        subtitle="Welcome to, View Installation Expenses"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Expenses' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadExpenses}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
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

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Installation Expense Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">EXPENSE CLAIMS</span>
              <h2 className="ax-card__title">View Installation Expenses</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filtered.length} of {rows.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
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
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ClaimFilter);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by claim status"
                >
                  <option value="all">All Status</option>
                  <option value="1">Pending</option>
                  <option value="2">Approved</option>
                  <option value="3">Reject</option>
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
                  placeholder="Search site, purpose, district…"
                  size="sm"
                  ariaLabel="Search expenses"
                />

                <TableExportToolbar
                  onCopy={() => { void copyTableDataToClipboard(filtered, exportCols); }}
                  onExportCSV={() => exportDataToCSV('Kashmir_SRT_70MW_Expenses', filtered, exportCols)}
                  onExportExcel={() => exportDataToExcel('Kashmir_SRT_70MW_Expenses', filtered, exportCols)}
                  onExportPDF={() => printTableData('Kashmir SRT 70MW Expenses', filtered, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2000 }}
            >
              <caption className="ax-visually-hidden">View Installation Expenses Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr No</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Project</th>
                  <th className="ax-table__th" scope="col">Type</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Purpose</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Invoice File</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Claim Approved Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading expenses…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No expense claims submitted yet.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td">{r.date || DASH}</td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{pick(r, 'state') || 'Kashmir'}</td>
                      <td className="ax-table__td">{pick(r, 'project', 'project_name') || DASH}</td>
                      <td className="ax-table__td">{pick(r, 'type', 'expense_type') || DASH}</td>
                      <td className="ax-table__td">{getDistrict(r)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>{getSiteName(r)}</td>
                      <td className="ax-table__td">{r.purpose || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.file ? (
                          <a
                            href={getKashmirMediaUrl(r.file)}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                          >
                            View File ↗
                          </a>
                        ) : (
                          DASH
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {pick(r, 'remarks', 'remark') || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {(() => {
                          const meta = getClaimStatusMeta(getClaimStatusVal(r));
                          return (
                            <span
                              className={`ax-badge ax-badge--soft ${meta.badgeClass}`}
                              style={{ fontWeight: 600, padding: '3px 10px', borderRadius: 9999, fontSize: 11 }}
                            >
                              {meta.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {pick(r, 'approved_remarks', 'claim_remark', 'claim_remarks') || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          row={r}
                          isApproved={isClaimApproved(getClaimStatusVal(r))}
                          onEdit={() => navigate(`/v/kashmir/srt70mw/installation-expenses-create?edit=1&claim_id=${r.id}`)}
                          onDownload={() => void handleDownloadPdf(r)}
                          onViewDetails={() => setSelectedDetail(r)}
                          downloading={downloadingId === r.id}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Punjab-style: pagination only) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
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

      {/* ── View Details Modal ── */}
      {selectedDetail && (
        <div
          className="ax-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="ax-modal"
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              borderRadius: 'var(--ax-radius-lg, 12px)',
              border: '1px solid var(--ax-border, #e2e8f0)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-detail-title"
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 id="claim-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Expense Claim Details #{selectedDetail.id}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-subtle)' }}>
                  {getSiteName(selectedDetail)} • {getDistrict(selectedDetail)}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedDetail(null)}
                style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Site Name</div>
                  <div style={{ fontWeight: 600 }}>{getSiteName(selectedDetail)}</div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>District & State</div>
                  <div style={{ fontWeight: 600 }}>{getDistrict(selectedDetail)} • {pick(selectedDetail, 'state') || 'Kashmir'}</div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Project & Type</div>
                  <div style={{ fontWeight: 600 }}>{pick(selectedDetail, 'project', 'project_name') || 'SRT-70MW'} • {pick(selectedDetail, 'type', 'expense_type') || DASH}</div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Purpose</div>
                  <div style={{ fontWeight: 600 }}>{selectedDetail.purpose || DASH}</div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Claim Amount</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ax-accent, #0284c7)' }}>
                    ₹{Number(selectedDetail.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedDetail.date || DASH}</div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Claim Status</div>
                  <div>
                    {(() => {
                      const meta = getClaimStatusMeta(getClaimStatusVal(selectedDetail));
                      return (
                        <span className={`ax-badge ax-badge--soft ${meta.badgeClass}`} style={{ fontWeight: 600 }}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 2 }}>Invoice File</div>
                  <div>
                    {selectedDetail.file ? (
                      <a
                        href={getKashmirMediaUrl(selectedDetail.file)}
                        target="_blank"
                        rel="noreferrer"
                        className="ax-btn ax-btn--secondary ax-btn--xs"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span>Open Invoice File</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--ax-text-subtle)' }}>No file attached</span>
                    )}
                  </div>
                </div>
              </div>

             
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 12, borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 4 }}>Vendor Remarks:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{pick(selectedDetail, 'remarks', 'remark') || DASH}</div>
              </div>

              {/* Approval Remarks */}
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 12, borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--ax-text-subtle)', marginBottom: 4 }}>Approval / Status Remarks:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{pick(selectedDetail, 'approved_remarks', 'claim_remark', 'claim_remarks') || DASH}</div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              {isClaimApproved(getClaimStatusVal(selectedDetail)) ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={downloadingId === selectedDetail.id}
                  onClick={() => void handleDownloadPdf(selectedDetail)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{downloadingId === selectedDetail.id ? 'Downloading…' : 'Download Claim PDF'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => {
                    const id = selectedDetail.id;
                    setSelectedDetail(null);
                    navigate(`/v/kashmir/srt70mw/installation-expenses-create?edit=1&claim_id=${id}`);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit Claim</span>
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedDetail(null)}
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

export default Kashmir_Expenses_ViewExpenses;