import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  arunachalShlInstallationService,
  resolveArunachalMediaUrl,
  type ArunachalAssignedLightItem,
} from '../../arunachal-services';

/* ───────── Responsive page CSS (Matching Punjab & Bihar reference) ───────── */
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

const parsePanchayat = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s;
    }
  }
  return '';
};

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      if (d.includes('T')) {
        return dt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
      return d;
    }
    return d;
  } catch {
    return d;
  }
};

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export function Arunachal_Installation_SHL_AssignedLights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ArunachalAssignedLightItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Direct Accept loading tracking
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected item for full details view modal
  const [detailModalItem, setDetailModalItem] = useState<ArunachalAssignedLightItem | null>(null);

  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await arunachalShlInstallationService.getAssignedLights();
      setRecords(
        Array.isArray(data)
          ? data.map((r: any) => ({
              ...r,
              panchayat: parsePanchayat(r.panchayat),
              status: Number(r.status) || 0,
              sitecount: Number(r.sitecount ?? r.site_count ?? 0),
            }))
          : []
      );
    } catch (err: any) {
      console.error('[Arunachal SHL AssignedLights] load error:', err);
      setToastMsg({ type: 'danger', text: 'Failed to load Arunachal assigned lights.' });
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
    if (statusFilter === 'pending') list = list.filter((r) => r.status !== 2);
    else if (statusFilter === 'accepted') list = list.filter((r) => r.status === 2);

    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district?.trim().toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          String(r.id).includes(q) ||
          (r.company_id && String(r.company_id).toLowerCase().includes(q)) ||
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.volume && String(r.volume).toLowerCase().includes(q)) ||
          (r.created_by && r.created_by.toLowerCase().includes(q)) ||
          (r.sdate && r.sdate.toLowerCase().includes(q)) ||
          (r.ldate && r.ldate.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q)) ||
          (r.remark && r.remark.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [records, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 50 });

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
  const acceptedBatches = records.filter((r) => r.status === 2).length;
  const pendingBatches = records.filter((r) => r.status !== 2).length;
  const totalSites = records.reduce((sum, r) => sum + (Number(r.sitecount ?? r.site_count) || 0), 0);
  const acceptRate = totalBatches > 0 ? Math.round((acceptedBatches / totalBatches) * 100) : 0;

  // Direct Accept handler (API 2)
  const handleDirectAccept = async (id: number) => {
    setAcceptingId(id);
    try {
      const res = await arunachalShlInstallationService.acceptAssignedLight(id);
      setToastMsg({ type: 'success', text: res.message || 'Light assignment accepted successfully!' });
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 2 } : r))
      );
      if (detailModalItem && detailModalItem.id === id) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 2 } : null));
      }
      await loadData();
    } catch (err: any) {
      console.error('[Arunachal SHL] accept error:', err);
      setToastMsg({ type: 'danger', text: err.message || 'Failed to accept assignment.' });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Lights"
        subtitle="Review allocated Arunachal Pradesh Solar Home Light (SHL) batches, district assignments, and accept ready site tasks"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Arunachal Pradesh' },
          { label: 'Installation' },
          { label: 'SHL' },
          { label: 'Assigned Lights' },
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
            <Link to="/v/arunachal/shl/installation/install-light" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
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
          sub={`${totalSites.toLocaleString('en-IN')} total allocated sites`}
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
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned lights table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Arunachal Pradesh SHL Light Batches</h2>
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
                placeholder="Search vendor, ID, district…"
                size="sm"
                ariaLabel="Search assigned lights"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        `#${r.id}`,
                        r.company_id || '',
                        r.vendor || '',
                        r.state || 'Arunachal Pradesh',
                        r.district || '',
                        r.block || '',
                        r.panchayat || '',
                        r.volume || '—',
                        r.sitecount ?? r.site_count ?? '',
                        r.sdate || r.start_date || '—',
                        r.ldate || r.end_date || '—',
                        r.created_by || '—',
                        formatDate(r.created_at),
                        r.remark || r.remarks || '',
                        r.status === 2 ? 'Accepted' : 'Assigned',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Batch ID,Company ID,Vendor,State,District,Block,Panchayat,Volume,Site Count,Start Date,End Date,Created By,Assigned On,Remarks,Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.company_id || ''}","${r.vendor || ''}","${r.state || 'Arunachal'}","${r.district || ''}","${r.block || ''}","${r.panchayat || ''}","${r.volume || '—'}","${r.sitecount ?? r.site_count ?? ''}","${r.sdate || r.start_date || '—'}","${r.ldate || r.end_date || '—'}","${r.created_by || '—'}","${formatDate(r.created_at)}","${r.remark || r.remarks || ''}","${r.status === 2 ? 'Accepted' : 'Assigned'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Arunachal_SHL_Assigned_Batches.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Batch ID,Company ID,Vendor,State,District,Block,Panchayat,Volume,Site Count,Start Date,End Date,Created By,Assigned On,Remarks,Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.company_id || ''}","${r.vendor || ''}","${r.state || 'Arunachal'}","${r.district || ''}","${r.block || ''}","${r.panchayat || ''}","${r.volume || '—'}","${r.sitecount ?? r.site_count ?? ''}","${r.sdate || r.start_date || '—'}","${r.ldate || r.end_date || '—'}","${r.created_by || '—'}","${formatDate(r.created_at)}","${r.remark || r.remarks || ''}","${r.status === 2 ? 'Accepted' : 'Assigned'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Arunachal_SHL_Assigned_Batches.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with all actual response fields ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Batch ID</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Panchayat</th>
                <th className="ax-table__th" scope="col">Volume</th>
                <th className="ax-table__th" scope="col">Site Count</th>
                <th className="ax-table__th" scope="col">Start Date</th>
                <th className="ax-table__th" scope="col">End Date</th>
                <th className="ax-table__th" scope="col">Created By</th>
                <th className="ax-table__th" scope="col">Assigned On</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned light sites from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={16} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned SHL light batches found"
                      message={hasFilters ? 'No records match your filters. Try clearing your query.' : 'No assigned lights currently allocated.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isAccepted = row.status === 2;
                  const startDate = row.sdate || row.start_date || '—';
                  const endDate = row.ldate || row.end_date || '—';
                  const assignedDate = row.created_at ? formatDate(row.created_at) : '—';

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 700, color: '#2563eb' }}>
                        #{row.id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor || '—'}
                      </td>
                      <td className="ax-table__td">{row.state || 'Arunachal'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>
                      <td className="ax-table__td">{row.block || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 240, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.panchayat || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">
                          {row.volume ?? '—'}
                        </span>
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {row.sitecount ?? row.site_count ?? '1'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {startDate}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {endDate}
                      </td>
                      <td className="ax-table__td">
                        {row.created_by || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        {assignedDate}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.remark || row.remarks || '—'}
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
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setDetailModalItem(row)}
                            title="View full batch details"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            View
                          </button>

                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600 }}
                              disabled={acceptingId === row.id}
                              onClick={() => handleDirectAccept(row.id)}
                            >
                              {acceptingId === row.id ? (
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
                              to="/v/arunachal/shl/installation/install-light"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                              title="Go to installation form"
                            >
                              Install Light ➔
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

      {/* ── View Batch Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="assigned-batch-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 650 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="assigned-batch-detail-title" style={{ fontSize: 15, fontWeight: 700 }}>
                Batch Assignment Details: #{detailModalItem.id}
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
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Batch ID</span>
                  <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>#{detailModalItem.id}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Company ID</span>
                  <b>{detailModalItem.company_id || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor</span>
                  <b>{detailModalItem.vendor || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                  <b>{detailModalItem.state || 'Arunachal'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                  <b>{detailModalItem.district || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Block</span>
                  <b>{detailModalItem.block || '—'}</b>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Panchayat</span>
                  <b>{detailModalItem.panchayat || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Volume</span>
                  <b>{detailModalItem.volume ?? '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Count</span>
                  <b style={{ color: '#16a34a' }}>{detailModalItem.sitecount ?? detailModalItem.site_count ?? '1'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Start Date (sdate)</span>
                  <b>{detailModalItem.sdate || detailModalItem.start_date || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>End Date (ldate)</span>
                  <b>{detailModalItem.ldate || detailModalItem.end_date || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Inspection Code</span>
                  <b>{detailModalItem.insp_code || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Material Matched</span>
                  <b>{detailModalItem.match_material === 1 ? 'Yes (Matched)' : detailModalItem.match_material === 0 ? 'No' : '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Created By</span>
                  <b>{detailModalItem.created_by || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Created On</span>
                  <b>{formatDate(detailModalItem.created_at)}</b>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Remarks</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {detailModalItem.remark || detailModalItem.remarks || 'No remarks provided.'}
                  </p>
                </div>
              </div>

              {/* Document attachments if present */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  Batch File Attachments
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {detailModalItem.uid_file && (
                    <a href={resolveArunachalMediaUrl(detailModalItem.uid_file)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--xs">
                      📄 UID File
                    </a>
                  )}
                  {detailModalItem.battery_no_file && (
                    <a href={resolveArunachalMediaUrl(detailModalItem.battery_no_file)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--xs">
                      📄 Battery File
                    </a>
                  )}
                  {detailModalItem.panel_no_file && (
                    <a href={resolveArunachalMediaUrl(detailModalItem.panel_no_file)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--xs">
                      📄 Panel File
                    </a>
                  )}
                  {detailModalItem.sim_no_file && (
                    <a href={resolveArunachalMediaUrl(detailModalItem.sim_no_file)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--xs">
                      📄 SIM File
                    </a>
                  )}
                  {detailModalItem.imei_no_file && (
                    <a href={resolveArunachalMediaUrl(detailModalItem.imei_no_file)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--xs">
                      📄 IMEI File
                    </a>
                  )}
                  {!detailModalItem.uid_file &&
                    !detailModalItem.battery_no_file &&
                    !detailModalItem.panel_no_file &&
                    !detailModalItem.sim_no_file &&
                    !detailModalItem.imei_no_file && (
                      <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        No file attachments uploaded for this batch.
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              {detailModalItem.status !== 2 ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={acceptingId === detailModalItem.id}
                  onClick={() => handleDirectAccept(detailModalItem.id)}
                >
                  {acceptingId === detailModalItem.id ? 'Accepting…' : 'Accept Assignment'}
                </button>
              ) : (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    setDetailModalItem(null);
                    navigate('/v/arunachal/shl/installation/install-light');
                  }}
                >
                  Install Light ➔
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

export default Arunachal_Installation_SHL_AssignedLights;
