import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirAssignSiteItem,
} from '../../kashmir-services';

/* ───────── Responsive page CSS (Exact Karnataka SWP style) ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  /* Responsive 4 KPI cards in 1 row */
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
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

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
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
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const X_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ width: 18, height: 18 }}
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 780,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top Metric KPI Card Component (matching Karnataka SWP style) ── */
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

// Helper to extract numeric assignment ID
const getAssignId = (item?: any): number => {
  if (!item) return 0;
  if (typeof item === 'number') return Number.isFinite(item) && item > 0 ? Math.floor(item) : 0;
  if (typeof item === 'string') {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  const candidate =
    item.assign_srt?.id ??
    item.assign_id ??
    item.assignment_id ??
    item.id;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
};

// Date formatter
const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const cleanStr = String(val).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

// Site list extractor for batch
const getBatchSites = (item: KashmirAssignSiteItem): any[] => {
  if (Array.isArray(item.jammu_srt70mws) && item.jammu_srt70mws.length > 0) {
    return item.jammu_srt70mws;
  }
  const raw = item.assign_srt?.site_name;
  if (Array.isArray(raw)) {
    return raw.map((s, idx) => ({ id: s, site_name: `Site #${s}` }));
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s, idx) => (typeof s === 'object' ? s : { id: idx + 1, site_name: String(s) }));
      }
    } catch {}
    if (raw.includes(',')) {
      return raw.split(',').map((s, idx) => ({ id: idx + 1, site_name: s.trim() }));
    }
    return [{ id: 1, site_name: raw }];
  }
  return [{ id: item.assign_srt?.id || 1, site_name: `Site #${item.assign_srt?.id || 1}` }];
};

// Site count helper
const getSiteCount = (item: KashmirAssignSiteItem): number => {
  const n = Number(item.assign_srt?.sitecount);
  if (!isNaN(n) && n > 0) return n;
  if (item.jammu_srt70mws?.length) return item.jammu_srt70mws.length;
  const sites = getBatchSites(item);
  return sites.length;
};

// Check if site batch is accepted
const isSiteAccepted = (item: KashmirAssignSiteItem): boolean => {
  const status = item.assign_srt?.status ?? (item as any).status;
  return Number(status) === 2 || String(status) === '2' || String(status).toLowerCase() === 'accepted';
};

export function Kashmir_Installation_AssignSite() {
  const navigate = useNavigate();

  const [data, setData] = useState<KashmirAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Details Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<KashmirAssignSiteItem | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Accept Action state
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptSuccessMsg, setAcceptSuccessMsg] = useState<string | null>(null);
  const [acceptErrorMsg, setAcceptErrorMsg] = useState<string | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await kashmirSrtService.getAssignSites();
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load Kashmir assigned installation sites:', err);
      setError(err?.message || 'Failed to load assigned installation sites from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle View Details
  const handleViewDetail = (item: KashmirAssignSiteItem) => {
    setActiveItem(item);
    setModalSearch('');
    setDetailModalOpen(true);
  };

  // Handle Accept
  const handleAccept = async (item: KashmirAssignSiteItem): Promise<boolean> => {
    const aId = getAssignId(item);
    if (!aId || acceptingId !== null) return false;
    if (!window.confirm(`Are you sure you want to accept Assignment Batch #${aId}?`)) return false;

    setAcceptingId(aId);
    setAcceptErrorMsg(null);
    setAcceptSuccessMsg(null);
    try {
      const res = await kashmirSrtService.acceptAssignment(aId);
      setAcceptSuccessMsg(res.message || 'Status Updated Successfully!!!');
      setData((prev) =>
        prev.map((r) =>
          getAssignId(r) === aId
            ? { ...r, assign_srt: { ...r.assign_srt, status: 2 } }
            : r
        )
      );
      if (activeItem && getAssignId(activeItem) === aId) {
        setActiveItem((prev) =>
          prev ? { ...prev, assign_srt: { ...prev.assign_srt, status: 2 } } : null
        );
      }
      return true;
    } catch (err: any) {
      setAcceptErrorMsg(err?.message || 'Failed to accept assignment batch.');
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // KPI Metrics
  const summary = useMemo(() => {
    const accepted = data.filter((r) => isSiteAccepted(r)).length;
    return {
      total: data.length,
      accepted,
      pending: data.length - accepted,
    };
  }, [data]);

  const totalSitesCount = useMemo(() => {
    return data.reduce((sum, r) => sum + getSiteCount(r), 0);
  }, [data]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = r.assign_srt?.district;
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const a = r.assign_srt || ({} as any);
      const accepted = isSiteAccepted(r);

      if (statusFilter === 'pending' && accepted) return false;
      if (statusFilter === 'accepted' && !accepted) return false;

      if (districtFilter !== 'all' && (a.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(a.id || '').includes(q) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.state && a.state.toLowerCase().includes(q)) ||
        (r.vendor_name && r.vendor_name.toLowerCase().includes(q)) ||
        (a.remarks && String(a.remarks).toLowerCase().includes(q)) ||
        (r.jammu_srt70mws && r.jammu_srt70mws.some((s) => s.site_name?.toLowerCase().includes(q)))
      );
    });
  }, [data, search, districtFilter, statusFilter]);

  const totalItems = filtered.length;
  const paginatedData = useMemo(() => {
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

  // Filtered sites inside Details Modal
  const modalSites = useMemo(() => {
    if (!activeItem) return [];
    return getBatchSites(activeItem);
  }, [activeItem]);

  const filteredModalSites = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return modalSites;
    return modalSites.filter((s: any) => {
      const name = (s.site_name || s.name || '').toLowerCase();
      const sId = String(s.id || '').toLowerCase();
      const deadline = (s.inst_deadline || s.deadline_date || '').toLowerCase();
      const dist = (s.district || activeItem?.assign_srt?.district || '').toLowerCase();
      return name.includes(q) || sId.includes(q) || deadline.includes(q) || dist.includes(q);
    });
  }, [modalSites, modalSearch, activeItem]);

  // Export Columns (13 Columns matching Karnataka table headers)
  const exportCols: ExportColumn<KashmirAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => String(idx + 1) },
      { header: 'Vendor', accessor: (r) => r.vendor_name || String(r.assign_srt?.vendor || '') },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_srt?.assign_date || r.assign_srt?.created_at) },
      { header: 'State', accessor: (r) => (r.assign_srt?.state || 'Kashmir').toUpperCase() },
      { header: 'District', accessor: (r) => r.assign_srt?.district || '—' },
      {
        header: 'Site Name - Deadline',
        accessor: (r) => {
          const list = getBatchSites(r);
          return list
            .map((s) => `${s.site_name}${s.inst_deadline ? ` (${s.inst_deadline})` : ''}`)
            .join('; ') || '—';
        },
      },
      { header: 'Count', accessor: (r) => String(getSiteCount(r)) },
      {
        header: 'Deadline Date',
        accessor: (r) => fmtDate(r.jammu_srt70mws?.[0]?.inst_deadline || r.assign_srt?.deadline_date),
      },
      { header: 'File', accessor: (r) => r.assign_srt?.file || '—' },
      { header: 'Remarks', accessor: (r) => r.assign_srt?.remarks || '—' },
      { header: 'Status', accessor: (r) => (isSiteAccepted(r) ? 'Accepted' : 'Pending Accept') },
    ],
    []
  );

  const headers = [
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Site Name - Deadline',
    'Count',
    'Deadline Date',
    'File',
    'View',
    'Remarks',
    'Status',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact Karnataka pattern) ── */}
      <PageHead
        title="View Assigned SRT Installation"
        subtitle="Manage assigned installation batches and accept assignments for site execution in Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'View Assigned SRT Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/kashmir/srt/70mw/installation/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Installation Site</span>
            </Link>
          </div>
        }
      />

      {/* Success notification */}
      {acceptSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{acceptSuccessMsg}</div>
        </div>
      )}

      {/* Error notification */}
      {acceptErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Accept Error</div>
          <div className="ax-alert__text">{acceptErrorMsg}</div>
        </div>
      )}

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Assignments</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row - exact Karnataka SWP pattern) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assignments"
          value={summary.total.toLocaleString('en-IN')}
          sub={`${summary.accepted} accepted · ${summary.pending} pending`}
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
          value={summary.pending.toLocaleString('en-IN')}
          sub="Action required by vendor"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Batches"
          value={summary.accepted.toLocaleString('en-IN')}
          sub="Accepted & ready to install"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Total Allocated Sites"
          value={totalSitesCount.toLocaleString('en-IN')}
          sub="Cumulative SRT installation sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact reference layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Sites">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Installation Batches</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> assignments
              {' '}· Accepted <b className="ax-num">{summary.accepted}</b> · Pending <b className="ax-num">{summary.pending}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  id="kash_dist_filter"
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
                id="kash_req_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                aria-label="Filter by assignment status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Accept</option>
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
                placeholder="Search vendor, site, ID…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('Kashmir_Assigned_Batches', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('Kashmir_Assigned_Batches', filtered, exportCols)}
                onExportPDF={() => printTableData('Assigned SRT Installation Batches', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1550 }}
          >
            <caption className="ax-visually-hidden">Assigned Installation Batches</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action'
                        ? { textAlign: 'right', minWidth: 160 }
                        : h === 'Count' || h === 'View' || h === 'File' || h === 'Sr. No.'
                        ? { textAlign: 'center' }
                        : h === 'Vendor'
                        ? { minWidth: 220, maxWidth: 280, width: 250 }
                        : h === 'Site Name - Deadline'
                        ? { minWidth: 260, maxWidth: 360, width: 300 }
                        : undefined
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned batches from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No installation assignments found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No installation batches have been assigned yet by the administration.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((item, index) => {
                  const a = item.assign_srt || ({} as any);
                  const isAccepted = isSiteAccepted(item);
                  const count = getSiteCount(item);
                  const sitesList = getBatchSites(item);
                  const firstDeadline = (item.jammu_srt70mws && item.jammu_srt70mws[0]?.inst_deadline) || a.deadline_date;

                  return (
                    <tr key={a.id || index} className="ax-table__row">
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Vendor */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 220, maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)', wordBreak: 'break-word' }}>
                          {item.vendor_name ? (
                            item.vendor_name
                          ) : a.vendor ? (
                            <>
                              {a.vendor}
                          
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                        
                          {sitesList.length > 0 && (
                            <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                              {sitesList.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => handleViewDetail(item)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontSize: '11px',
                                    color: 'var(--asw-primary, #2563eb)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontWeight: 500,
                                  }}
                                >
                                  View all
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(a.assign_date || a.created_at)}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {(a.state || 'Kashmir').toUpperCase()}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <b>{a.district || '—'}</b>
                        {a.volume && (
                          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            Vol: {a.volume}
                          </div>
                        )}
                      </td>

                      {/* 6. Site Name - Deadline */}
                      <td
                        className="ax-table__td"
                        style={{ minWidth: 260, maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {sitesList.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {sitesList.slice(0, 2).map((s: any, i: number) => {
                              const deadlineStr = s.inst_deadline || a.deadline_date;
                              return (
                                <div key={i} style={{ fontSize: '12px', lineHeight: 1.35 }}>
                                  <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                                    {s.site_name || `Site #${s.id || i + 1}`}
                                  </span>
                                  {deadlineStr && (
                                    <span style={{ color: 'var(--ax-text-muted)', marginLeft: 6, fontSize: '11px' }}>
                                      ({fmtDate(deadlineStr)})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {sitesList.length > 2 && (
                              <button
                                type="button"
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  padding: 0,
                                  fontSize: '11px',
                                  color: 'var(--asw-primary, #2563eb)',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  marginTop: 2,
                                  fontWeight: 600,
                                }}
                                onClick={() => handleViewDetail(item)}
                              >
                                +{sitesList.length - 2} more sites (View details &rarr;)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* 7. Count */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 700 }}>
                          {count}
                        </span>
                      </td>

                      {/* 8. Deadline Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(firstDeadline)}
                      </td>

                      {/* 9. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {a.file ? (
                          <a
                            href={getKashmirMediaUrl(a.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ color: 'var(--asw-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download Assignment File"
                          >
                            📎 File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 10. View */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => handleViewDetail(item)}
                        >
                          View
                        </button>
                      </td>

                      {/* 11. Remarks */}
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 160, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={a.remarks || ''}
                      >
                        {a.remarks || '—'}
                      </td>

                      {/* 12. Status */}
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">✓ Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleAccept(item)}
                              disabled={acceptingId === a.id}
                            >
                              {acceptingId === a.id ? 'Accepting…' : 'Accept'}
                            </button>
                          ) : (
                            <Badge tone="success">Done</Badge>
                          )}
                        </div>
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
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Assignment Details Modal (exact Karnataka SWP pattern) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details · #${activeItem.assign_srt?.id || activeItem.id}` : 'Assignment Details'}
        subtitle="Individual site and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isSiteAccepted(activeItem) ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={async () => {
                  const ok = await handleAccept(activeItem);
                  if (ok) setDetailModalOpen(false);
                }}
                disabled={acceptingId === (activeItem.assign_srt?.id || activeItem.id)}
              >
                {acceptingId === (activeItem.assign_srt?.id || activeItem.id) ? 'Accepting…' : 'Accept Assignment'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              {activeItem && (
                <Link
                  to={`/v/kashmir/srt/70mw/installation/site?assign_id=${activeItem.assign_srt?.id || activeItem.id}`}
                  className="ax-btn ax-btn--primary"
                  onClick={() => setDetailModalOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  + Install Site
                </Link>
              )}
            </div>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top Info Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              padding: '12px 16px',
              background: 'var(--ax-surface-subtle, #f8fafc)',
              borderRadius: 8,
              border: '1px solid var(--ax-border, #e2e8f0)',
              fontSize: '13px',
            }}
          >
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span>
              <strong>{activeItem?.vendor_name || `${activeItem?.assign_srt?.vendor || '—'}`}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span>
              <strong>{fmtDate(activeItem?.assign_srt?.assign_date || activeItem?.assign_srt?.created_at)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>State: </span>
              <strong>{(activeItem?.assign_srt?.state || 'Kashmir').toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>District: </span>
              <strong>{activeItem?.assign_srt?.district || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
              {activeItem && isSiteAccepted(activeItem) ? (
                <Badge tone="success">✓ Accepted</Badge>
              ) : (
                <Badge tone="warning">Pending Accept</Badge>
              )}
            </div>
          </div>

          {/* Search filter above popup table */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label
              htmlFor="modal_site_search"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}
            >
              Search:
            </label>
            <input
              id="modal_site_search"
              type="text"
              className="ax-input ax-input--sm"
              style={{ width: 280, height: 32 }}
              placeholder="Search site name, deadline, ID…"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
            />
            {modalSearch && (
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setModalSearch('')}
                style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Popup Table */}
          <div className="ax-table-wrap" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" style={{ textAlign: 'center', width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th">Site ID</th>
                  <th className="ax-table__th">Site Name</th>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Deadline Date</th>
                  <th className="ax-table__th">Assign Date</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody className="ax-table__body">
                {filteredModalSites.map((site: any, idx: number) => {
                  const assignDate = site.assign_date || activeItem?.assign_srt?.assign_date || activeItem?.assign_srt?.created_at;
                  const deadlineDate = site.inst_deadline || site.deadline_date || activeItem?.assign_srt?.deadline_date;
                  const districtVal = site.district || activeItem?.assign_srt?.district || '—';
                  const siteId = site.id || site.site_id || idx + 1;
                  const siteName = site.site_name || site.name || `Site #${siteId}`;

                  return (
                    <tr key={site.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {idx + 1}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        #{siteId}
                      </td>
                      <td className="ax-table__td">
                        <strong style={{ color: 'var(--ax-text-strong)' }}>{siteName}</strong>
                      </td>
                      <td className="ax-table__td">
                        <b>{districtVal}</b>
                      </td>
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(deadlineDate)}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(assignDate)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <Link
                          to={`/v/kashmir/srt/70mw/installation/site?site=${encodeURIComponent(siteName)}&assign_id=${activeItem?.assign_srt?.id || ''}`}
                          className="ax-btn ax-btn--primary ax-btn--xs"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setDetailModalOpen(false)}
                        >
                          Install Site &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Kashmir_Installation_AssignSite;
