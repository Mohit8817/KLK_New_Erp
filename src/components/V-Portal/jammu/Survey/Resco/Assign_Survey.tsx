import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useAuth } from '../../../../../context/AuthContext';
import { authService } from '../../../../../services/authService';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../../../common';
import {
  jammuRescoSurveyService,
  type JammuRescoAssignedSurveyItem,
} from '../../jammu-services';

/* ───────── Responsive Page CSS (Solar ERP Reference) ───────── */
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

const cleanText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '—') return '';
  return s;
};

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
  const navigate = useNavigate();
  const { user, rawResponse } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<JammuRescoAssignedSurveyItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Vendor resolution
  const loginVendorName = useMemo(() => {
    const getCleanString = (val: any): string => {
      if (
        typeof val === 'string' &&
        val.trim() &&
        val.trim().toLowerCase() !== '[object object]' &&
        val.trim().toLowerCase() !== 'null' &&
        val.trim().toLowerCase() !== 'undefined'
      ) {
        return val.trim();
      }
      return '';
    };

    if (user) {
      const fromUser =
        getCleanString((user as any).vendor_name) ||
        getCleanString((user as any).name) ||
        getCleanString((user as any).company_name) ||
        getCleanString((user as any).vendor) ||
        getCleanString((user as any).vendor_id) ||
        getCleanString((user as any).username) ||
        getCleanString((user as any).email);
      if (fromUser) return fromUser;
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.user?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name) ||
        getCleanString(rawResponse?.data?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor) ||
        getCleanString(rawResponse?.data?.name);
      if (fromRaw) return fromRaw;
    }

    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.name) ||
          getCleanString(session.company_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.vendor_id);
        if (fromSession) return fromSession;
      }
    } catch {}

    return '';
  }, [user, rawResponse]);

  const getVendorDisplay = useCallback((row: JammuRescoAssignedSurveyItem) => {
    if (row.vendors?.name && String(row.vendors.name).trim()) {
      return String(row.vendors.name).trim();
    }
    if (row.vendor && String(row.vendor).trim() && isNaN(Number(row.vendor))) {
      return String(row.vendor).trim();
    }
    if (loginVendorName) return loginVendorName;
    if (row.vendor) return `Vendor ${row.vendor}`;
    return '—';
  }, [loginVendorName]);

  // Modal item for details preview
  const [detailModalItem, setDetailModalItem] = useState<JammuRescoAssignedSurveyItem | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  // Load from Live API 8: GET /jk/view-assigned-resco-survey
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await jammuRescoSurveyService.getAssignedSurveys();
      setRecords(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Jammu Resco AssignedSurveys] load error:', err);
      setRecords([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned RESCO surveys.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      list = list.filter((r) => (r.district || '').toLowerCase() === districtFilter.toLowerCase());
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const vName = getVendorDisplay(r).toLowerCase();
        const idStr = String(r.id);
        const dist = (r.district || '').toLowerCase();
        const site = (r.site_name || '').toLowerCase();
        const ca = (r.ca_no || '').toLowerCase();
        const dept = (r.dept_name || '').toLowerCase();
        const purpose = (r.purpose || '').toLowerCase();
        return (
          vName.includes(q) ||
          idStr.includes(q) ||
          dist.includes(q) ||
          site.includes(q) ||
          ca.includes(q) ||
          dept.includes(q) ||
          purpose.includes(q)
        );
      });
    }
    return list;
  }, [records, search, districtFilter, getVendorDisplay]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setPage(1);
  };

  // Top metric stats
  const totalBatches = records.length;
  const activeDistricts = districts.length;
  const totalSitesAllocated = records.reduce(
    (sum, r) => sum + (Number(r.sitecount ?? r.site_count ?? r.count) || 1),
    0
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO: Assign Survey"
        subtitle="Manage assigned rooftop solar survey batches, review site allocations, and conduct feasibility audits"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: 'Assign Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg
                className="ax-btn__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/survey/resco/pending-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Conduct Survey</span>
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
          label="Total Survey Batches"
          value={totalBatches.toLocaleString('en-IN')}
          sub="Allocated to vendor"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Allocated Sites"
          value={totalSitesAllocated.toLocaleString('en-IN')}
          sub="Sites ready for survey"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Active Districts"
          value={activeDistricts.toLocaleString('en-IN')}
          sub="Coverage across J&K"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Project Type"
          value="RESCO"
          sub="Rooftop Solar Program"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned RESCO Surveys">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Resco Site</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> records
              {' '}· State: <b className="ax-num">Jammu & Kashmir</b>
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
                placeholder="Search vendor, district…"
                size="sm"
                ariaLabel="Search assigned surveys"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        getVendorDisplay(r),
                        formatDate(r.assign_date || r.created_at),
                        r.state || 'Jammu',
                        cleanText(r.district) || '—',
                        cleanText(r.site_name) || (r.sites ? (Array.isArray(r.sites) ? r.sites.join(', ') : String(r.sites)) : `Batch #${r.id}`),
                        r.sitecount ?? r.site_count ?? r.count ?? 1,
                        r.file || r.document || '—',
                        cleanText(r.remarks || r.remark) || '—',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Vendor,Assign Date,State,District,Site Name,Site Count,File,Remarks',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${getVendorDisplay(r)}","${formatDate(r.assign_date || r.created_at)}","${r.state || 'Jammu'}","${cleanText(r.district)}","${cleanText(r.site_name) || (r.sites ? (Array.isArray(r.sites) ? r.sites.join(', ') : String(r.sites)) : `Batch #${r.id}`)}","${r.sitecount ?? r.site_count ?? r.count ?? 1}","${r.file || r.document || '—'}","${cleanText(r.remarks || r.remark) || '—'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Assigned_Resco_Site.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Vendor,Assign Date,State,District,Site Name,Site Count,File,Remarks',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${getVendorDisplay(r)}","${formatDate(r.assign_date || r.created_at)}","${r.state || 'Jammu'}","${cleanText(r.district)}","${cleanText(r.site_name) || (r.sites ? (Array.isArray(r.sites) ? r.sites.join(', ') : String(r.sites)) : `Batch #${r.id}`)}","${r.sitecount ?? r.site_count ?? r.count ?? 1}","${r.file || r.document || '—'}","${cleanText(r.remarks || r.remark) || '—'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Assigned_Resco_Site.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">Assign Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Site Count</th>
                <th className="ax-table__th" scope="col">File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned survey batches from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={hasFilters ? 'No records match your filters. Try clearing your search.' : 'No survey batches currently assigned to your vendor account.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const vendorName = getVendorDisplay(row);
                  const siteDisplay = cleanText(row.site_name) || (row.sites ? (Array.isArray(row.sites) ? row.sites.join(', ') : String(row.sites)) : `Batch #${row.id}`);
                  const assignedDate = formatDate(row.assign_date || row.created_at);
                  const siteCount = row.sitecount ?? row.site_count ?? row.count ?? 1;
                  const fileUrl = row.file || row.document || (row as any).file_url;
                  const remarksText = cleanText(row.remarks || row.remark) || '—';

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {vendorName}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{assignedDate}</td>
                      <td className="ax-table__td">{row.state || 'Jammu'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {siteDisplay}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{siteCount}</td>
                      <td className="ax-table__td">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', padding: '2px 8px', fontSize: 11 }}
                            title="Open file in new tab"
                          >
                            View File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">{remarksText}</td>
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
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── View Batch Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="assigned-resco-batch-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 620 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="assigned-resco-batch-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Jammu RESCO Survey Assignment Details</span>
                {detailModalItem.id && (
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11, fontWeight: 600 }}>
                    #{detailModalItem.id}
                  </span>
                )}
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
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Assignment ID</span>
                  <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{detailModalItem.id}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor Name</span>
                  <b>{getVendorDisplay(detailModalItem)}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                  <b>{detailModalItem.state || 'Jammu'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                  <b>{cleanText(detailModalItem.district) || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                  <b>{cleanText(detailModalItem.dept_name) || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Name</span>
                  <b>{cleanText(detailModalItem.site_name) || `Batch #${detailModalItem.id}`}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                  <b>{cleanText(detailModalItem.ca_no) || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Assigned Date</span>
                  <b>{formatDate(detailModalItem.created_at || detailModalItem.assign_date)}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Type / Purpose</span>
                  <b>{detailModalItem.type || 'RESCO'} · {detailModalItem.purpose || 'Survey'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                  <Badge tone="warning">Assigned (Survey Pending)</Badge>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Remarks</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {cleanText(detailModalItem.remarks || detailModalItem.remark) || 'No remarks provided.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => {
                  setDetailModalItem(null);
                  navigate(`/v/jammu/survey/resco/pending-survey?siteId=${detailModalItem.id}`);
                }}
              >
                Conduct Survey ➔
              </button>
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
