import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type AssignSiteItem,
  type AssignedBeneficiarySite,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  KpiSkeleton,
  type ExportColumn,
} from '../../../../../common';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getUlaFileCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/ula/installation/assignsite/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/ula/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/ula/installation/assignsite/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

const resolveFileUrl = (path?: string | null): string => {
  if (!path) return '';
  const candidates = getUlaFileCandidates(path);
  return candidates[0] || '';
};

/* ───────── Responsive page CSS (Exact from Installation Details) ───────── */
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
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }
`;
const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const ICON_PROPS = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_CHECK = (
  <svg className="ax-btn__icon" {...ICON_PROPS} strokeWidth={2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_EYE = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

/* ───────── KPI Card (exact same as Survey/SRT200MW/ViewData.tsx & SRT Request Accept) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const DASH = '—';

/* ── Response field helpers ── */
const readField = (item: AssignSiteItem, key: string): unknown =>
  (item as unknown as Record<string, unknown>)[key];

/**
 * Beneficiary Name formatted with unique_id:
 * e.g. "Anil Kumar - 1006" as per user design requirement
 */
const getBeneficiaryDisplay = (item: AssignSiteItem): string => {
  const sites = Array.isArray(item.sites) ? item.sites : [];
  if (sites.length > 0) {
    const list = sites
      .map((s) => {
        const name = (s.beneficiary_name || '').trim();
        const uid =
          s.unique_id !== undefined && s.unique_id !== null && String(s.unique_id).trim() !== ''
            ? String(s.unique_id).trim()
            : '';
        if (name && uid) return `${name} - ${uid}`;
        return name || uid;
      })
      .filter(Boolean);
    if (list.length > 0) return list.join(', ');
  }

  const name = (readField(item, 'beneficiary_name') as string || '').trim();
  const uid = (readField(item, 'unique_id') as string || '').trim();
  if (name && uid) return `${name} - ${uid}`;
  return name || uid || DASH;
};

// Site count from the response
const getSiteCount = (item: AssignSiteItem): number => {
  const raw = readField(item, 'site_count');
  if (raw !== null && raw !== undefined && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  if (Array.isArray(item.sites) && item.sites.length > 0) return item.sites.length;
  if (typeof item.site_id === 'string') {
    try {
      const parsed = JSON.parse(item.site_id);
      if (Array.isArray(parsed)) return parsed.length;
    } catch {
      // ignore
    }
  }
  return 1;
};

// Attachment URL from the response
const getFileUrl = (item: AssignSiteItem): string => {
  const v = readField(item, 'file');
  return typeof v === 'string' ? v.trim() : '';
};

// Generic text/number field from the response
const getText = (item: AssignSiteItem, key: string): string => {
  const v = readField(item, key);
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  return '';
};

const getVendor = (item: AssignSiteItem): string =>
  item.vendors?.name || getText(item, 'vendor') || getText(item, 'vendor_name');
const getAssignDate = (item: AssignSiteItem): string => getText(item, 'assign_date');
const getState = (item: AssignSiteItem): string => getText(item, 'state');
const getBlock = (item: AssignSiteItem): string => getText(item, 'block');

export function Bihar_Installation_ULA_RequestAccept() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // File Preview Modal State
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    candidates: string[];
    candidateIndex: number;
    title: string;
  } | null>(null);

  // Load assignments
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewAssignSites();
      setAssignments(data || []);
    } catch (err: any) {
      console.error('[ULA Installation] Error loading assigned sites:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Accept
  const handleAccept = async (id: number) => {
    if (!window.confirm(`Are you sure you want to accept assignment #${id}?`)) return;
    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await biharUlaInstallationService.acceptAssignSite(id);
      setFeedbackMsg({
        type: 'success',
        text: res.message || 'Installation Assignment Accepted Successfully!',
      });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'danger',
        text: err?.message || 'Failed to accept installation assignment.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Navigate to Dedicated Site Details Page
  const handleViewDetail = (item: AssignSiteItem) => {
    const isV = location.pathname.startsWith('/v/') || location.pathname.startsWith('v/');
    const target = isV ? '/v/bihar/ula-installation-view-assign-site-detail' : '/bihar/ula-installation-view-assign-site-detail';
    navigate(`${target}?id=${item.id}`, { state: { assignment: item } });
  };

  // KPI calculations
  const totalAssignments = assignments.length;
  const totalSites = useMemo(() => assignments.reduce((acc, a) => acc + getSiteCount(a), 0), [assignments]);
  const acceptedCount = useMemo(() => assignments.filter((a) => Number(a.status) === 2).length, [assignments]);
  const pendingCount = totalAssignments - acceptedCount;
  const acceptedPct = totalAssignments > 0 ? Math.round((acceptedCount / totalAssignments) * 100) : 0;
  const pendingPct = totalAssignments > 0 ? Math.round((pendingCount / totalAssignments) * 100) : 0;

  const districts = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      const d = (a.district || a.block || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [assignments]);

  // Filtered
  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter((a) => {
      const idMatch = String(a.id).includes(q);
      const vendorMatch = getVendor(a).toLowerCase().includes(q);
      const extraMatch = [getAssignDate(a), getState(a), getBlock(a)].some((t) => t.toLowerCase().includes(q));
      const beneficiaryMatch = getBeneficiaryDisplay(a).toLowerCase().includes(q);
      const remarkMatch = a.remarks?.toLowerCase().includes(q);
      const deadlineMatch = a.deadline_date?.toLowerCase().includes(q);
      const sitesMatch = a.sites?.some((s) =>
        s.beneficiary_name?.toLowerCase().includes(q) ||
        String(s.unique_id || '').toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.ca_no?.toLowerCase().includes(q)
      );
      return idMatch || vendorMatch || extraMatch || beneficiaryMatch || remarkMatch || deadlineMatch || sitesMatch;
    });
  }, [assignments, search]);

  // Paginated
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Export Columns (Cleaned - Unique ID merged into Beneficiary Name as per user requirement)
  const exportCols: ExportColumn<AssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'Assign ID', accessor: (r) => `#${r.id}` },
      { header: 'Vendor', accessor: (r) => getVendor(r) },
      { header: 'Assign Date', accessor: (r) => getAssignDate(r) },
      { header: 'State', accessor: (r) => getState(r) },
      { header: 'Block', accessor: (r) => getBlock(r) },
      { header: 'Beneficiary Name', accessor: (r) => getBeneficiaryDisplay(r) },
      { header: 'Site Count', accessor: (r) => getSiteCount(r) },
      { header: 'Deadline Date', accessor: (r) => r.deadline_date || '' },
      { header: 'Remarks', accessor: (r) => r.remarks || '' },
      { header: 'File', accessor: (r) => getFileUrl(r) },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Pending Acceptance') },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filteredAssignments, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_ULA_Installation_Assignments', filteredAssignments, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_ULA_Installation_Assignments', filteredAssignments, exportCols);
  const handlePdf = () => printTableData('Bihar ULA Installation Assignments', filteredAssignments, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="ULA-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Request Accept' },
        ]}
        actions={
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
            {ICON_REFRESH}
            <span className="ax-btn__label">Refresh</span>
          </button>
        }
      />

      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedbackMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedbackMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Assignments"
              value={totalAssignments.toLocaleString('en-IN')}
              sub={`${acceptedCount} accepted · ${pendingCount} pending`}
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Pending Acceptance"
              value={pendingCount.toLocaleString('en-IN')}
              sub={`${pendingPct}% of total · Action required`}
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Accepted Batches"
              value={acceptedCount.toLocaleString('en-IN')}
              sub={`${acceptedPct}% accepted · Ready to install`}
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="cyan"
              label="Total Allocated Sites"
              value={totalSites.toLocaleString('en-IN')}
              sub="Cumulative allocated installations"
              icon={svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)}
            />
          </>
        )}

        {/* ── Tabs Cluster (All / Pending / Accepted) ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Batch status tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {[
              { key: 'all' as const, label: 'All Batches', count: totalAssignments },
              { key: 'pending' as const, label: 'Pending Acceptance', count: pendingCount },
              { key: 'accepted' as const, label: 'Accepted Batches', count: acceptedCount },
            ].map((t) => {
              const active = t.key === tabFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => { setTabFilter(t.key); setCurrentPage(1); }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : t.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card (Card Header matches InstallationDetail.tsx) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Batches">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {tabFilter === 'all' ? 'All Assigned Batches' : tabFilter === 'pending' ? 'Pending Acceptance Batches' : 'Accepted Batches'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredAssignments.length}</span> of <span className="ax-num">{assignments.length}</span> records
                {' '}· Total <b className="ax-num">{totalAssignments}</b> · Pending <b className="ax-num">{pendingCount}</b> · Accepted <b className="ax-num">{acceptedCount}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district/block"
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Locations</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                {(search || districtFilter !== 'all' || tabFilter !== 'all') && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => { setSearch(''); setDistrictFilter('all'); setTabFilter('all'); setCurrentPage(1); }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search beneficiary, vendor, ID, district…"
                  size="sm"
                  ariaLabel="Search assignments"
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
                Loading assigned installation batches…
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <TableEmptyState
              title="No installation assignments found"
              message={
                search
                  ? 'No assignments match your search filter. Try clearing your query.'
                  : 'Assigned installation requests will appear here once allocated.'
              }
              onClear={search ? () => setSearch('') : undefined}
              clearLabel="Clear search"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
                  <caption className="ax-visually-hidden">Assigned Installation Batches</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      <th className="ax-table__th" scope="col">Assign ID</th>
                      <th className="ax-table__th" scope="col">Vendor</th>
                      <th className="ax-table__th" scope="col">Assign Date</th>
                      <th className="ax-table__th" scope="col">State</th>
                      <th className="ax-table__th" scope="col">Block</th>
                      <th className="ax-table__th" scope="col">Beneficiary Name</th>
                      <th className="ax-table__th" scope="col">Site Count</th>
                      <th className="ax-table__th" scope="col">Deadline Date</th>
                      <th className="ax-table__th" scope="col">Remarks</th>
                      <th className="ax-table__th" scope="col">File</th>
                      <th className="ax-table__th" scope="col">Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((a, index) => {
                      const isAccepted = Number(a.status) === 2;
                      const isActioning = actionLoadingId === a.id;
                      const beneficiaryDisplay = getBeneficiaryDisplay(a);
                      const siteCount = getSiteCount(a);
                      const rawFile = getFileUrl(a);
                      const fileCandidates = getUlaFileCandidates(rawFile);
                      const primaryFileUrl = fileCandidates[0] || resolveFileUrl(rawFile);

                      return (
                        <tr key={a.id} className="ax-table__row">
                          <td className="ax-table__td">{(currentPage - 1) * pageSize + index + 1}</td>
                          <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}>#{a.id}</td>
                          <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)' as any }}>
                            {getVendor(a) || DASH}
                          </td>
                          <td className="ax-table__td">{getAssignDate(a) || DASH}</td>
                          <td className="ax-table__td">{getState(a) || DASH}</td>
                          <td className="ax-table__td">{getBlock(a) || DASH}</td>
                          <td className="ax-table__td bsv-benef" title={beneficiaryDisplay}>
                            {beneficiaryDisplay}
                          </td>
                          <td className="ax-table__td">
                            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                              {siteCount} {siteCount === 1 ? 'Site' : 'Sites'}
                            </span>
                          </td>
                          <td className="ax-table__td">{a.deadline_date || DASH}</td>
                          <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.remarks || DASH}
                          </td>
                          <td className="ax-table__td">
                            {rawFile ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--secondary ax-btn--xs"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                  }}
                                  onClick={() =>
                                    setPreviewFile({
                                      url: primaryFileUrl,
                                      candidates: fileCandidates,
                                      candidateIndex: 0,
                                      title: `Batch #${a.id} File - ${a.district || 'Bihar'}`,
                                    })
                                  }
                                >
                                  📄 View File
                                </button>
                                <a
                                  href={primaryFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ax-btn ax-btn--ghost ax-btn--xs"
                                  title="Open file in new tab"
                                  style={{ padding: '2px 5px', fontSize: '11px', textDecoration: 'none' }}
                                >
                                  ↗
                                </a>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                            )}
                          </td>
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ax-badge--pill ${isAccepted ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                              <span className="ax-badge__dot" />
                              {isAccepted ? 'Accepted' : 'Pending Accept'}
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => handleViewDetail(a)}>
                                {ICON_EYE}
                                <span className="ax-btn__label">View Sites</span>
                              </button>
                              {!isAccepted && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  disabled={isActioning}
                                  onClick={() => handleAccept(a.id)}
                                >
                                  {isActioning ? <span className="ax-spinner" /> : ICON_CHECK}
                                  <span className="ax-btn__label">Accept</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                total={filteredAssignments.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[100,200,300]}
              />
            </>
          )}
        </section>
      </div>

      {/* ── File Preview Modal ── */}
      {previewFile && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--ax-surface-solid, #ffffff)',
              padding: 16,
              borderRadius: 'var(--ax-radius-lg, 12px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                paddingBottom: 10,
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                {previewFile.title}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  style={{ textDecoration: 'none' }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--xs"
                  onClick={() => setPreviewFile(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/\.pdf($|\?)/i.test(previewFile.url) ? (
              <iframe
                src={previewFile.url}
                title={previewFile.title}
                style={{ width: '80vw', height: '70vh', border: 'none' }}
              />
            ) : (
              <img
                src={previewFile.url}
                alt={previewFile.title}
                style={{
                  maxWidth: '85vw',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 0,
                  border: '1px solid var(--ax-border)',
                }}
                onError={() => {
                  const nextIdx = previewFile.candidateIndex + 1;
                  if (nextIdx < previewFile.candidates.length) {
                    setPreviewFile((prev) =>
                      prev ? { ...prev, url: prev.candidates[nextIdx], candidateIndex: nextIdx } : null
                    );
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_RequestAccept;
