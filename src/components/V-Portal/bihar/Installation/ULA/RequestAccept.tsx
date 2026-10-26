import { useState, useMemo, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
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

/* ── Styles: same KPI cards + single-line responsive header (Search + Export) ── */
const VIEW_CSS = `
.bsv-page {
  --bsv-card-radius: var(--ax-radius-lg);
}
.bsv-page .ax-dash-grid {
  align-items: stretch;
  gap: var(--ax-space-4);
}
.bsv-kpi {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ax-border);
  border-radius: var(--bsv-card-radius);
  background: var(--ax-bg-surface, var(--ax-surface-solid));
  box-shadow: var(--ax-shadow-sm);
  transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
}
.bsv-kpi:hover {
  box-shadow: var(--ax-shadow-md);
  border-color: var(--ax-border);
  transform: translateY(-1px);
}
.bsv-kpi::before { display: none; }
.bsv-kpi__body {
  height: 100%;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bsv-kpi__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}
.bsv-kpi__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bsv-kpi__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--ax-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--bsv-accent);
  background: color-mix(in srgb, var(--bsv-accent) 12%, transparent);
}
.bsv-kpi__icon svg { width: 16px; height: 16px; }
.bsv-kpi__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--ax-text-muted);
}
.bsv-kpi__caption {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ax-text-muted);
}
.bsv-kpi__head > .ax-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 6px;
}
.bsv-kpi__value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}
.bsv-kpi__value {
  font-family: var(--ax-font-display);
  font-size: 1.35rem;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ax-text-strong);
  font-variant-numeric: tabular-nums;
}
.bsv-kpi__unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted);
}

.bsv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  padding-top: 7px;
  border-top: 1px solid var(--ax-border-subtle);
}
.bsv-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--ax-text-muted);
}
.bsv-legend__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--c);
}
.bsv-legend__num {
  font-weight: 700;
  color: var(--ax-text-strong);
  font-variant-numeric: tabular-nums;
}

/* ── Card & Table Header (Exact pattern from SRT RequestAccept / ViewInstallation) ── */
.bsv-page .ax-card { min-width: 0; }

.bsv-page .ax-card__header {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: var(--ax-space-4) var(--ax-space-6);
  background: var(--ax-surface-subtle);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.bsv-page .ax-card__titles {
  flex: 1 1 220px;
  min-width: 220px;
  max-width: 100%;
}
.bsv-page .ax-card__title,
.bsv-page .ax-card__eyebrow,
.bsv-page .ax-card__subtitle {
  max-width: none;
  word-break: normal;
  overflow-wrap: normal;
  hyphens: none;
}
.bsv-page .ax-card__subtitle { line-height: 1.45; }

.bsv-page .ax-card__actions {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 8px;
}
.bsv-page .ax-card__actions .ax-cluster {
  flex-wrap: nowrap !important;
  min-width: 0;
  justify-content: flex-end;
  gap: var(--ax-space-2, 8px);
}
.bsv-page .ax-card__actions .ax-search,
.bsv-page .ax-card__actions [class*="search"] {
  flex: 1 1 160px;
  min-width: 200px;
  max-width: 260px;
}
.bsv-page .ax-card__actions input { min-width: 0; width: 100%; }
.bsv-page .ax-card__actions .ax-export-toolbar,
.bsv-page .ax-card__actions [class*="export-toolbar"] {
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 4px;
}
.bsv-page .ax-export-toolbar__button {
  padding-inline: 8px !important;
  min-width: 0;
}

.bsv-page .ax-table-wrap {
  width: 100%;
  overflow: auto;
  scrollbar-width: thin;
}
.bsv-page .ax-table {
  min-width: 1100px;
}
.bsv-page .ax-table__th {
  font-size: var(--ax-text-2xs);
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--ax-text-muted);
  background: var(--ax-surface-subtle);
  white-space: nowrap;
}
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); vertical-align: middle; }
.bsv-page .bsv-benef {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--ax-text-strong);
}
.bsv-page .ax-alert { border-radius: var(--ax-radius-md); }

@media (max-width: 1100px) {
  .bsv-page .ax-export-toolbar__button {
    font-size: 0;
    gap: 0;
    padding: 0 8px !important;
    justify-content: center;
  }
  .bsv-page .ax-export-toolbar__button svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .bsv-page .ax-card__actions .ax-search,
  .bsv-page .ax-card__actions [class*="search"] { max-width: 200px; }
}

@media (max-width: 900px) {
  .bsv-kpi__body { padding: 11px 12px; }
  .bsv-kpi__value { font-size: 1.25rem; }
}

@media (max-width: 760px) {
  .bsv-page .ax-card__header {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 10px;
  }
  .bsv-page .ax-card__titles {
    flex: 0 0 auto;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
  .bsv-page .ax-card__title {
    font-family: var(--ax-font-display);
    font-size: var(--ax-text-md);
    line-height: var(--ax-leading-md);
  }
  .bsv-page .ax-card__actions {
    flex: 0 0 auto;
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .bsv-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important;
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
  }
  .bsv-page .ax-card__actions .ax-search,
  .bsv-page .ax-card__actions [class*="search"] {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .bsv-page .ax-card__actions .ax-export-toolbar,
  .bsv-page .ax-card__actions [class*="export-toolbar"] {
    flex: 1 1 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
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

interface Segment { label: string; count: number; color: string }

function KpiCard({
  accent, icon, label, caption, value, unit, badge, segments,
}: {
  accent: string; icon: ReactNode; label: string; caption: string;
  value: ReactNode; unit?: string; badge?: ReactNode; segments?: Segment[];
}) {
  return (
    <div className="bsv-kpi ax-col--4" role="region" aria-label={label} style={{ ['--bsv-accent' as string]: accent } as CSSProperties}>
      <div className="bsv-kpi__body">
        <div className="bsv-kpi__head">
          <div className="bsv-kpi__title-wrap">
            <span className="bsv-kpi__icon"><svg {...ICON_PROPS}>{icon}</svg></span>
            <div>
              <div className="bsv-kpi__label">{label}</div>
              <div className="bsv-kpi__caption">{caption}</div>
            </div>
          </div>
          {badge}
        </div>

        <div className="bsv-kpi__value-row">
          <span className="bsv-kpi__value">{value}</span>
          {unit && <span className="bsv-kpi__unit">{unit}</span>}
        </div>

        {segments && (
          <div className="bsv-legend">
            {segments.map((s) => (
              <span key={s.label} className="bsv-legend__item" style={{ ['--c' as string]: s.color } as CSSProperties}>
                <span className="bsv-legend__dot" />
                {s.label} <span className="bsv-legend__num">{s.count}</span>
              </span>
            ))}
          </div>
        )}
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  const pendingCount = assignments.filter((a) => Number(a.status) === 1).length;
  const acceptedCount = assignments.filter((a) => Number(a.status) === 2).length;
  const acceptedPct = totalAssignments > 0 ? Math.round((acceptedCount / totalAssignments) * 100) : 0;
  const pendingPct = totalAssignments > 0 ? Math.round((pendingCount / totalAssignments) * 100) : 0;

  const warn = 'var(--ax-warning-500)';
  const ok = 'var(--ax-accent)';
  const accent = 'var(--ax-accent)';

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
    <div className="ax-page bsv-page">
      <style>{VIEW_CSS}</style>

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
        {/* ── KPI 1: Total Assignments ── */}
        <KpiCard
          accent={accent}
          label="Total Assignments"
          caption="Batches allocated by state admin"
          value={totalAssignments}
          unit="batches"
          badge={<span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">All Batches</span>}
          icon={<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>}
          segments={[
            { label: 'Accepted', count: acceptedCount, color: ok },
            { label: 'Pending', count: pendingCount, color: warn },
          ]}
        />

        {/* ── KPI 2: Pending Acceptance ── */}
        <KpiCard
          accent={warn}
          label="Pending Acceptance"
          caption="Action required to begin installation"
          value={pendingCount}
          unit="pending"
          badge={<span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">{pendingPct}%</span>}
          icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
          segments={[
            { label: 'Pending', count: pendingCount, color: warn },
            { label: 'Others', count: totalAssignments - pendingCount, color: 'var(--ax-border)' },
          ]}
        />

        {/* ── KPI 3: Accepted ── */}
        <KpiCard
          accent={ok}
          label="Accepted Assignments"
          caption="Ready for structure erection"
          value={`${acceptedPct}%`}
          unit="accepted"
          badge={<span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{acceptedCount} / ${totalAssignments}</span>}
          icon={<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>}
          segments={[
            { label: 'Accepted', count: acceptedCount, color: ok },
            { label: 'Pending', count: pendingCount, color: warn },
          ]}
        />

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Batches">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">INSTALLATION WORK ORDERS</span>
              <h2 className="ax-card__title">Assigned Installation Batches</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredAssignments.length} of {assignments.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search beneficiary, vendor, ID, district…"
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
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
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
                pageSizeOptions={[10, 20, 50, 100]}
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
