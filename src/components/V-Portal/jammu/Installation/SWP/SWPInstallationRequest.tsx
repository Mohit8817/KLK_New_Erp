import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../../../common';
import {
  jammuSwpService,
  resolveJammuSwpMediaUrl,
  type JammuSwpAssignItem,
} from '../../jammu-services';

/* ───────── Responsive page CSS (Matching Reference Design) ───────── */
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

/* ── Top KPI Card Component ── */
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

export function SWPInstallationRequest() {
  const navigate = useNavigate();
  const { user, rawResponse } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<JammuSwpAssignItem[]>([]);
  const [vendorMeta, setVendorMeta] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

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

    if (vendorMeta?.loginName) return vendorMeta.loginName;

    if (user) {
      const fromUser =
        getCleanString((user as any).vendor_name) ||
        getCleanString((user as any).name) ||
        getCleanString((user as any).company_name) ||
        getCleanString((user as any).vendor) ||
        getCleanString((user as any).vendor_id) ||
        getCleanString((user as any).username);
      if (fromUser) return fromUser;
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name);
      if (fromRaw) return fromRaw;
    }

    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.name) ||
          getCleanString(session.company_name);
        if (fromSession) return fromSession;
      }
    } catch {}

    return '';
  }, [user, rawResponse, vendorMeta]);

  const getVendorDisplay = useCallback(
    (rowVendor?: string | number | null) => {
      if (loginVendorName) return loginVendorName;
      if (rowVendor) return `Vendor #${rowVendor}`;
      return 'ABC Solar Pvt Ltd';
    },
    [loginVendorName]
  );

  // Direct Accept loading tracking
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected item for full details view modal (via Endpoint 14)
  const [detailModalItem, setDetailModalItem] = useState<JammuSwpAssignItem | null>(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState(false);

  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load from Live API 1 (/jammu/swp/installation-view-assign-sites)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { assigns, vendorMeta: meta } = await jammuSwpService.getAssignedSites();
      setRecords(Array.isArray(assigns) ? assigns : []);
      if (meta) setVendorMeta(meta);
    } catch (err: any) {
      console.error('[Jammu SWP AssignedSites] load error:', err);
      setRecords([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned SWP installation sites.' });
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
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = records;
    if (statusFilter === 'pending') list = list.filter((r) => Number(r.status) !== 2);
    else if (statusFilter === 'accepted') list = list.filter((r) => Number(r.status) === 2);

    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district?.trim().toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const idMatch = String(r.id).includes(q);
        const vendorDisplay = getVendorDisplay(r.vendor);
        const vendorMatch = String(vendorDisplay).toLowerCase().includes(q) || String(r.vendor ?? '').toLowerCase().includes(q);
        const distMatch = r.district?.toLowerCase().includes(q);
        const stateMatch = r.state?.toLowerCase().includes(q);
        const sitesMatch = r.site_id?.some((s) => String(s).toLowerCase().includes(q));
        const remarksMatch = (r.remarks || r.remark || '').toLowerCase().includes(q);
        return idMatch || vendorMatch || distMatch || stateMatch || sitesMatch || remarksMatch;
      });
    }
    return list;
  }, [records, search, statusFilter, districtFilter, getVendorDisplay]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Metrics
  const totalBatches = records.length;
  const acceptedBatches = records.filter((r) => Number(r.status) === 2).length;
  const pendingBatches = records.filter((r) => Number(r.status) !== 2).length;
  const totalSites = records.reduce((sum, r) => sum + (Array.isArray(r.site_id) ? r.site_id.length : 1), 0);
  const acceptRate = totalBatches > 0 ? Math.round((acceptedBatches / totalBatches) * 100) : 0;

  // Direct Accept handler (Endpoint 2: GET jammu/swp/accept-installation?id={id})
  const handleDirectAccept = async (id: number | string) => {
    const numId = Number(id);
    if (!numId) return;
    setAcceptingId(numId);
    try {
      const res = await jammuSwpService.acceptAssignment(numId);
      setToastMsg({ type: 'success', text: res.message || 'Accept Successfully!!!' });

      // Update local state immediately
      setRecords((prev) =>
        prev.map((r) => (Number(r.id) === numId ? { ...r, status: 2 } : r))
      );
      if (detailModalItem && Number(detailModalItem.id) === numId) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 2 } : null));
      }

      await loadData();
    } catch (err: any) {
      console.error('[Jammu SWP] accept error:', err);
      const errMsg = err?.message || 'Failed to accept assignment.';
      if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('invalid')) {
        await loadData();
      }
      setToastMsg({ type: 'danger', text: errMsg });
    } finally {
      setAcceptingId(null);
    }
  };

  // Open batch detail modal (Endpoint 14: GET jammu/swp/installation-view-assigned-site-details?assign_id={assign_id})
  const handleOpenDetailModal = async (row: JammuSwpAssignItem) => {
    setDetailModalItem(row);
    setLoadingBatchDetail(true);
    try {
      const detail = await jammuSwpService.getAssignedSiteDetails(row.id);
      if (detail) {
        setDetailModalItem((prev) => ({
          ...(prev || row),
          ...detail,
        }));
      }
    } catch (err) {
      console.warn('[Jammu SWP] batch detail load error, using row data:', err);
    } finally {
      setLoadingBatchDetail(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned SWP Site"
        subtitle="Review allocated Jammu Solar Water Pump (SWP) batches, farmer site allocations, and accept ready installations"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Installation Request' },
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
            <Link to="/v/jammu/installation/swp/installation-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Site</span>
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
          label="Total Batches"
          value={totalBatches.toLocaleString('en-IN')}
          sub={`${totalSites.toLocaleString('en-IN')} total allocated pumps`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Acceptance"
          value={pendingBatches.toLocaleString('en-IN')}
          sub="Awaiting vendor acceptance"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Batches"
          value={acceptedBatches.toLocaleString('en-IN')}
          sub="Ready for field installation"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Acceptance Rate"
          value={`${acceptRate}%`}
          sub={`${acceptedBatches} of ${totalBatches} batches`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned SWP Site Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned SWP Site</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> batches
              {' '}· Accepted <b className="ax-num">{acceptedBatches}</b> · Pending <b className="ax-num">{pendingBatches}</b>
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

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                ariaLabel="Search assigned SWP sites"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        getVendorDisplay(r.vendor),
                        formatDate(r.created_at),
                        r.state || 'Jammu & Kashmir',
                        r.district || '—',
                        (r.site_id || []).join('; '),
                        r.site_id?.length || 1,
                        r.file || '',
                        r.remarks || r.remark || '',
                        Number(r.status) === 2 ? 'Accepted' : 'Assigned',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Vendor,Assign Date,State,District,Applicant Name - Deadline,Count,File,Remarks,Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${getVendorDisplay(r.vendor)}","${formatDate(r.created_at)}","${r.state || 'Jammu'}","${r.district || ''}","${(r.site_id || []).join('; ')}","${r.site_id?.length || 1}","${r.file || ''}","${r.remarks || r.remark || ''}","${Number(r.status) === 2 ? 'Accepted' : 'Assigned'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_SWP_Assigned_Sites.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Vendor,Assign Date,State,District,Applicant Name - Deadline,Count,File,Remarks,Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${getVendorDisplay(r.vendor)}","${formatDate(r.created_at)}","${r.state || 'Jammu'}","${r.district || ''}","${(r.site_id || []).join('; ')}","${r.site_id?.length || 1}","${r.file || ''}","${r.remarks || r.remark || ''}","${Number(r.status) === 2 ? 'Accepted' : 'Assigned'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_SWP_Assigned_Sites.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table matching requested columns:
            Sr. No. | Vendor | Assign Date | State | District | Applicant Name - Deadline | Count | View | File | Remarks | Status | Action ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">Assign Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Applicant Name - Deadline</th>
                <th className="ax-table__th" scope="col">Count</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>View</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned SWP installations from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned SWP site batches found"
                      message={hasFilters ? 'No records match your filters. Try clearing your query.' : 'No SWP site allocations currently assigned.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isAccepted = Number(row.status) === 2;
                  const assignedDate = row.created_at ? formatDate(row.created_at) : '—';
                  const deadline = row.deadline || row.inst_deadline ? formatDate(row.deadline || row.inst_deadline) : '—';
                  const remarksText = row.remarks || row.remark || '—';
                  const rowId = Number(row.id);
                  const siteList = Array.isArray(row.site_id) ? row.site_id : [row.site_id].filter(Boolean);

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {getVendorDisplay(row.vendor)}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        {assignedDate}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>
                      <td className="ax-table__td" style={{ maxWidth: 360, whiteSpace: 'normal', fontSize: '12px' }}>
                        {siteList.length === 0 && <span style={{ color: 'var(--ax-text-muted)' }}>—</span>}
                        {siteList.slice(0, 2).map((s, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              display: 'inline-block',
                              background: 'var(--ax-surface-subtle, #f8fafc)',
                              border: '1px solid var(--ax-border, #e2e8f0)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              margin: '2px 4px 2px 0',
                            }}
                          >
                            <b>{String(s)}</b>
                            {deadline !== '—' && (
                              <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 4 }}>
                                ({deadline})
                              </span>
                            )}
                          </div>
                        ))}
                        {siteList.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(row)}
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              margin: '2px 0 2px 2px',
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#2563eb',
                              background: 'rgba(37, 99, 235, 0.08)',
                              borderRadius: 4,
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              cursor: 'pointer',
                              lineHeight: 1.4,
                              verticalAlign: 'middle',
                            }}
                            title="Click to view Batch Assignment Details"
                          >
                            +{siteList.length - 2} more · View more
                          </button>
                        )}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {siteList.length || 1}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => handleOpenDetailModal(row)}
                          title="View full batch details"
                          style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                        >
                          👁️ View
                        </button>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.file ? (
                          <a
                            href={resolveJammuSwpMediaUrl(row.file)}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '2px 6px', fontSize: 11, color: '#2563eb' }}
                            title="View attachment file"
                          >
                            📄 File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '12px' }}>
                        {remarksText}
                      </td>
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Assigned</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600 }}
                              disabled={acceptingId === rowId}
                              onClick={() => handleDirectAccept(rowId)}
                            >
                              {acceptingId === rowId ? (
                                <>
                                  <span className="ax-spinner" style={{ width: 12, height: 12, marginRight: 4 }} />
                                  Accepting…
                                </>
                              ) : (
                                'Accept'
                              )}
                            </button>
                          ) : (
                            <Link
                              to="/v/jammu/installation/swp/installation-site"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                              title="Go to SWP installation form"
                            >
                              Install Site ➔
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

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── View Batch Detail Modal (API 14: jammu/swp/installation-view-assigned-site-details) ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="swp-assigned-batch-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 650 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="swp-assigned-batch-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>SWP Batch Assignment Details</span>
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
              {loadingBatchDetail ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#2563eb' }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assignment site details...
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13, marginBottom: 16 }}>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Batch ID</span>
                      <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>#{detailModalItem.id}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor</span>
                      <b>{getVendorDisplay(detailModalItem.vendor)}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                      <b>{detailModalItem.state || 'Jammu & Kashmir'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                      <b>{detailModalItem.district || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Count</span>
                      <b style={{ color: '#16a34a' }}>{detailModalItem.site_id?.length || 1}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Assigned Date</span>
                      <b>{formatDate(detailModalItem.created_at)}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                      {Number(detailModalItem.status) === 2 ? (
                        <Badge tone="success">Accepted</Badge>
                      ) : (
                        <Badge tone="warning">Assigned (Pending Accept)</Badge>
                      )}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Remarks</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                        {detailModalItem.remarks || detailModalItem.remark || 'No remarks provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Allocated sites in this batch */}
                  <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                      Allocated Farmers / Sites in this Batch ({detailModalItem.site_details?.length || detailModalItem.site_id?.length || 0})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(detailModalItem.site_details && detailModalItem.site_details.length > 0
                        ? detailModalItem.site_details
                        : (detailModalItem.site_id || []).map((name, i) => ({ id: i + 1, f_farmer_name: String(name) }))
                      ).map((s, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            padding: '10px 14px',
                            background: 'var(--ax-surface-subtle, #f8fafc)',
                            border: '1px solid var(--ax-border, #e2e8f0)',
                            borderRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <b style={{ color: 'var(--ax-text-strong)', display: 'block' }}>{s.f_farmer_name}</b>
                            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                              Site ID: #{s.id} {detailModalItem.district ? `• District: ${detailModalItem.district}` : ''}
                            </span>
                          </div>
                          {detailModalItem.deadline && (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral">
                              Deadline: {formatDate(detailModalItem.deadline)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document attachments if present */}
                  {detailModalItem.file && (
                    <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginTop: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                        Work Order / File Attachment
                      </span>
                      <a
                        href={resolveJammuSwpMediaUrl(detailModalItem.file)}
                        target="_blank"
                        rel="noreferrer"
                        className="ax-btn ax-btn--secondary ax-btn--xs"
                      >
                        📄 View Work Order File
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="ax-modal__footer">
              {Number(detailModalItem.status) !== 2 ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={acceptingId === Number(detailModalItem.id)}
                  onClick={() => handleDirectAccept(detailModalItem.id)}
                >
                  {acceptingId === Number(detailModalItem.id) ? 'Accepting…' : 'Accept Assignment'}
                </button>
              ) : (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    setDetailModalItem(null);
                    navigate('/v/jammu/installation/swp/installation-site');
                  }}
                >
                  Install Site ➔
                </button>
              )}
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

export default SWPInstallationRequest;
