import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  getJammuSwpMediaCandidates,
  type JammuSwpAssignItem,
  type JammuSwpApplicant,
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

  /* Modal Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: var(--ax-space-4, 16px);
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
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
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`} style={{ fontWeight: 600 }}>{children}</span>
);

/* ───────── Top Metric KPI Card Component ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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
  const [y, m, day] = datePart.split('-');
  return y && m && day ? `${day}-${m}-${y}` : datePart || trimmed;
};

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const isImage = (url?: string | null) =>
  Boolean(url && /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(String(url)));

const getFileExt = (url?: string | null) => {
  if (!url) return 'FILE';
  const clean = url.split('?')[0];
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  return ext ? ext.toUpperCase() : 'FILE';
};

/* ── Lightbox Thumbnail & Preview Modal ── */
function InstallationThumbnail({
  src,
  alt = 'Site Photo',
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt?: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const [candIdx, setCandIdx] = useState(0);
  const candidates = useMemo(() => getJammuSwpMediaCandidates(src), [src]);
  const currentUrl = candidates[candIdx] || resolveJammuSwpMediaUrl(src);

  if (!src) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        margin: '0 auto',
      }}
    >
      <img
        src={currentUrl}
        alt={alt}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          objectFit: 'cover',
          cursor: 'zoom-in',
          border: '1px solid var(--ax-border, #cbd5e1)',
          background: 'var(--ax-surface-subtle, #f8fafc)',
          display: 'block',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.14)';
          e.currentTarget.style.borderColor = 'var(--asw-primary, #2563eb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = 'var(--ax-border, #cbd5e1)';
        }}
        onError={() => setCandIdx((prev) => prev + 1)}
        onClick={() => onPreview(currentUrl, alt)}
        title="Click to preview photograph"
      />
    </div>
  );
}

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_STEPS[zoomIdx];

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 100000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: 900,
          width: '92%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="ax-modal__header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
            <span className="ax-badge ax-badge--soft" style={{ fontSize: 11 }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              onClick={() => setZoomIdx((i) => (i + 1) % ZOOM_STEPS.length)}
              title="Toggle Zoom"
              style={{ fontSize: 12 }}
            >
              🔍 Zoom
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              style={{ fontSize: 12 }}
              title="Open full image in new tab"
            >
              ↗ Open
            </a>
            <button
              type="button"
              className="ax-modal__close"
              onClick={onClose}
              aria-label="Close image preview"
              style={{
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              {X_ICON}
            </button>
          </div>
        </div>
        <div
          className="ax-modal__body"
          style={{
            padding: 20,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            minHeight: 320,
          }}
        >
          <img
            src={url}
            alt={title}
            style={{
              maxWidth: zoom === 1 ? '100%' : 'none',
              maxHeight: zoom === 1 ? '70vh' : 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
              borderRadius: 6,
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Helper to extract structured applicants from an assign batch ── */
interface ParsedApplicant {
  name: string;
  fatherName: string;
  deadline: string;
  block: string;
  village: string;
  id: string | number;
}

function getApplicants(row: JammuSwpAssignItem): ParsedApplicant[] {
  const list: any[] =
    row.Names && row.Names.length > 0
      ? row.Names
      : row.site_details && row.site_details.length > 0
      ? row.site_details
      : row.names && row.names.length > 0
      ? row.names
      : [];

  if (list.length > 0) {
    return list.map((item: any, idx: number) => ({
      name:
        item.f_farmer_name ||
        item.farmer_name ||
        item.applicant_name ||
        item.name ||
        `Site #${item.id || idx + 1}`,
      fatherName:
        item.f_father_name ||
        item.father_name ||
        item.father ||
        item.f_father_or_husband_name ||
        '—',
      deadline: formatDate(
        item.inst_deadline ||
        item.deadline_date ||
        item.deadline ||
        row.deadline_date ||
        row.deadline
      ),
      block: item.block || item.f_block || row.block || '—',
      village: item.village || item.f_village || row.village || '—',
      id: item.id || idx + 1,
    }));
  }

  // Fallback to site_id list
  const siteIds = Array.isArray(row.site_id) ? row.site_id : [row.site_id].filter(Boolean);
  if (siteIds.length > 0) {
    return siteIds.map((sid, idx) => ({
      name: `Site #${sid}`,
      fatherName: '—',
      deadline: formatDate(row.deadline_date || row.deadline || row.inst_deadline),
      block: row.block || '—',
      village: row.village || '—',
      id: sid || idx + 1,
    }));
  }

  return [];
}

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
    if (vendorMeta?.vendor?.name) return vendorMeta.vendor.name;
    if (vendorMeta?.vendor_name) return vendorMeta.vendor_name;
    if (vendorMeta?.name) return vendorMeta.name;

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
    (rowVendor?: string | number | null, rowVendorName?: string | null) => {
      if (rowVendorName && String(rowVendorName).trim()) return String(rowVendorName).trim();
      if (loginVendorName) return loginVendorName;
      if (rowVendor) {
        if (typeof rowVendor === 'string' && isNaN(Number(rowVendor))) {
          return rowVendor;
        }
        return `Vendor #${rowVendor}`;
      }
      return 'App Testing';
    },
    [loginVendorName]
  );

  // Direct Accept loading tracking
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Detail Modal State & search
  const [detailModalItem, setDetailModalItem] = useState<JammuSwpAssignItem | null>(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Image lightbox preview
  const [previewImg, setPreviewImg] = useState<{ url: string; title: string } | null>(null);

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
        const vendorDisplay = getVendorDisplay(r.vendor, r.vendor_name);
        const vendorMatch = String(vendorDisplay).toLowerCase().includes(q) || String(r.vendor ?? '').toLowerCase().includes(q);
        const distMatch = r.district?.toLowerCase().includes(q);
        const stateMatch = r.state?.toLowerCase().includes(q);
        const sitesMatch = r.site_id?.some((s) => String(s).toLowerCase().includes(q));
        const remarksMatch = (r.remarks || r.remark || '').toLowerCase().includes(q);
        const applicants = getApplicants(r);
        const applicantMatch = applicants.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.fatherName.toLowerCase().includes(q) ||
            a.block.toLowerCase().includes(q) ||
            a.village.toLowerCase().includes(q)
        );
        return idMatch || vendorMatch || distMatch || stateMatch || sitesMatch || remarksMatch || applicantMatch;
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
  const totalSites = records.reduce((sum, r) => {
    const n = Number(r.site_count || r.count || (r.Names?.length) || (r.site_id?.length) || 1);
    return sum + (isNaN(n) || n <= 0 ? 1 : n);
  }, 0);
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

  // Open batch detail modal
  const handleOpenDetailModal = async (row: JammuSwpAssignItem) => {
    setDetailModalItem(row);
    setModalSearch('');
    setLoadingBatchDetail(true);
    try {
      const detail = await jammuSwpService.getAssignedSiteDetails(row.id);
      if (detail) {
        setDetailModalItem((prev) => ({
          ...(prev || row),
          ...detail,
          // Preserve Names if detail didn't return them
          Names: detail.Names && detail.Names.length > 0 ? detail.Names : prev?.Names || row.Names,
          site_details: detail.site_details && detail.site_details.length > 0 ? detail.site_details : prev?.site_details || row.site_details,
        }));
      }
    } catch (err) {
      console.warn('[Jammu SWP] batch detail load error, using row data:', err);
    } finally {
      setLoadingBatchDetail(false);
    }
  };

  // Filtered applicants for modal popup
  const modalApplicants = useMemo(() => {
    if (!detailModalItem) return [];
    const all = getApplicants(detailModalItem);
    const q = modalSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.fatherName.toLowerCase().includes(q) ||
        a.block.toLowerCase().includes(q) ||
        a.village.toLowerCase().includes(q) ||
        a.deadline.toLowerCase().includes(q) ||
        String(a.id).includes(q)
    );
  }, [detailModalItem, modalSearch]);

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
                placeholder="Search vendor, district, farmer…"
                size="sm"
                ariaLabel="Search assigned SWP sites"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        getVendorDisplay(r.vendor, r.vendor_name),
                        formatDate(r.assign_date || r.created_at),
                        (r.state || 'Jammu & Kashmir').toUpperCase(),
                        r.district || '—',
                        getApplicants(r).map((a) => `${a.name} (${a.deadline})`).join('; ') || (r.site_id || []).join('; '),
                        r.site_count || r.count || getApplicants(r).length || r.site_id?.length || 1,
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
                        `"${i + 1}","${getVendorDisplay(r.vendor, r.vendor_name)}","${formatDate(r.assign_date || r.created_at)}","${(r.state || 'Jammu').toUpperCase()}","${r.district || ''}","${getApplicants(r).map((a) => `${a.name} (${a.deadline})`).join('; ') || (r.site_id || []).join('; ')}","${r.site_count || r.count || getApplicants(r).length || r.site_id?.length || 1}","${r.file || ''}","${r.remarks || r.remark || ''}","${Number(r.status) === 2 ? 'Accepted' : 'Assigned'}"`
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
                        `"${i + 1}","${getVendorDisplay(r.vendor, r.vendor_name)}","${formatDate(r.assign_date || r.created_at)}","${(r.state || 'Jammu').toUpperCase()}","${r.district || ''}","${getApplicants(r).map((a) => `${a.name} (${a.deadline})`).join('; ') || (r.site_id || []).join('; ')}","${r.site_count || r.count || getApplicants(r).length || r.site_id?.length || 1}","${r.file || ''}","${r.remarks || r.remark || ''}","${Number(r.status) === 2 ? 'Accepted' : 'Assigned'}"`
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

        {/* ── Main Table matching requested columns:
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
                  const assignedDate = formatDate(row.assign_date || row.created_at);
                  const remarksText = row.remarks || row.remark || '—';
                  const rowId = Number(row.id);
                  const vendorName = getVendorDisplay(row.vendor, row.vendor_name);
                  const applicants = getApplicants(row);
                  const count = Number(row.site_count || row.count || applicants.length || row.site_id?.length || 1);
                  const fileUrl = row.file ? resolveJammuSwpMediaUrl(row.file) : '';
                  const fileExt = getFileExt(row.file);
                  const isImg = isImage(row.file);

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {vendorName}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        {assignedDate}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {(row.state || 'Jammu & Kashmir').toUpperCase()}
                      </td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>

                      {/* Applicant Name - Deadline Column */}
                      <td className="ax-table__td" style={{ maxWidth: 360, whiteSpace: 'normal', fontSize: '12px' }}>
                        {applicants.length === 0 && <span style={{ color: 'var(--ax-text-muted)' }}>—</span>}
                        {applicants.slice(0, 2).map((app, sIdx) => (
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
                            <b style={{ color: 'var(--ax-text-strong)' }}>{app.name}</b>
                            {app.deadline && app.deadline !== '—' && (
                              <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 4 }}>
                                ({app.deadline})
                              </span>
                            )}
                          </div>
                        ))}
                        {applicants.length > 2 && (
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
                            +{applicants.length - 2} more · View all &rarr;
                          </button>
                        )}
                      </td>

                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {count}
                      </td>

                      {/* View Button Column */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => handleOpenDetailModal(row)}
                          title="View assigned sites list"
                          style={{ padding: '3px 10px', fontSize: 12 }}
                        >
                          View
                        </button>
                      </td>

                      {/* File Column (Thumbnail if Image, link if Document) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.file && isImg ? (
                          <InstallationThumbnail
                            src={row.file}
                            alt={`${vendorName} - File Photo`}
                            onPreview={(url, title) => setPreviewImg({ url, title })}
                            size={34}
                          />
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ color: 'var(--asw-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download Assigned Site File"
                          >
                            📎 {fileExt} ↗
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
                          <Badge tone="success">✓ Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600 }}
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
                            <Badge tone="success">✓ Done</Badge>
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
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── View Batch Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="swp-assigned-batch-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 960, width: '92%' }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="swp-assigned-batch-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <span>Assignment Details · #{detailModalItem.id}</span>
                <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11, fontWeight: 600 }}>
                  SWP Batch
                </span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Top metadata info summary card */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 16,
                      padding: '12px 18px',
                      background: 'var(--ax-surface-subtle, #f8fafc)',
                      borderRadius: 8,
                      border: '1px solid var(--ax-border, #e2e8f0)',
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span>
                      <b>{getVendorDisplay(detailModalItem.vendor, detailModalItem.vendor_name)}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>District: </span>
                      <b>{detailModalItem.district || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>State: </span>
                      <b>{(detailModalItem.state || 'Jammu & Kashmir').toUpperCase()}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Assign Date: </span>
                      <b>{formatDate(detailModalItem.assign_date || detailModalItem.created_at)}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Deadline: </span>
                      <b>{formatDate(detailModalItem.deadline_date || detailModalItem.deadline || detailModalItem.inst_deadline)}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
                      <Badge tone={Number(detailModalItem.status) === 2 ? 'success' : 'warning'}>
                        {Number(detailModalItem.status) === 2 ? '✓ Accepted' : 'Pending Accept'}
                      </Badge>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Total Sites: </span>
                      <b style={{ color: 'var(--asw-primary, #2563eb)' }}>
                        {detailModalItem.site_count || modalApplicants.length || 1}
                      </b>
                    </div>
                  </div>

                  {/* Search filter above popup table */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label
                      htmlFor="modal_swp_search"
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}
                    >
                      Search:
                    </label>
                    <input
                      id="modal_swp_search"
                      type="text"
                      className="ax-input ax-input--sm"
                      style={{ width: 300, height: 32 }}
                      placeholder="Search applicant, father name, block, village…"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                    />
                    {modalSearch && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => setModalSearch('')}
                        style={{ height: 30, padding: '0 8px', fontSize: '12px' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Popup Table: Sr. No. | Assign Date | State | District | Block | Village | Applicant Name | Father Name | Deadline Date */}
                  <div className="ax-table-wrap" style={{ maxHeight: '55vh', overflow: 'auto' }}>
                    <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                      <thead className="ax-table__head">
                        <tr>
                          <th className="ax-table__th" style={{ textAlign: 'center', width: 50 }}>Sr. No.</th>
                          <th className="ax-table__th">Assign Date</th>
                          <th className="ax-table__th">State</th>
                          <th className="ax-table__th">District</th>
                          <th className="ax-table__th">Block</th>
                          <th className="ax-table__th">Village</th>
                          <th className="ax-table__th">Applicant Name</th>
                          <th className="ax-table__th">Father Name</th>
                          <th className="ax-table__th">Deadline Date</th>
                        </tr>
                      </thead>
                      <tbody className="ax-table__body">
                        {modalApplicants.map((app, idx) => (
                          <tr key={idx} className="ax-table__row">
                            <td className="ax-table__td ax-num" style={{ textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                              {idx + 1}
                            </td>
                            <td className="ax-table__td" style={{ fontSize: 12.5 }}>
                              {formatDate(detailModalItem.assign_date || detailModalItem.created_at)}
                            </td>
                            <td className="ax-table__td" style={{ fontWeight: 600 }}>
                              {(detailModalItem.state || 'Jammu & Kashmir').toUpperCase()}
                            </td>
                            <td className="ax-table__td">
                              <b>{detailModalItem.district || '—'}</b>
                            </td>
                            <td className="ax-table__td">{app.block || '—'}</td>
                            <td className="ax-table__td">{app.village || '—'}</td>
                            <td className="ax-table__td">
                              <strong style={{ color: 'var(--ax-text-strong)' }}>{app.name}</strong>
                            </td>
                            <td className="ax-table__td">{app.fatherName || '—'}</td>
                            <td className="ax-table__td" style={{ fontSize: 12.5 }}>
                              {app.deadline || '—'}
                            </td>
                          </tr>
                        ))}
                        {modalApplicants.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' }}>
                              No applicant records found matching your query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks & Attachment if present */}
                  {(detailModalItem.remarks || detailModalItem.remark || detailModalItem.file) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 10 }}>
                      {(detailModalItem.remarks || detailModalItem.remark) && (
                        <div style={{ fontSize: 12.5 }}>
                          <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Remarks: </span>
                          <span>{detailModalItem.remarks || detailModalItem.remark}</span>
                        </div>
                      )}
                      {detailModalItem.file && (
                        <div style={{ fontSize: 12.5 }}>
                          <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>File Attachment: </span>
                          <a
                            href={resolveJammuSwpMediaUrl(detailModalItem.file)}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', padding: '2px 8px' }}
                          >
                            📄 View File ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {Number(detailModalItem.status) !== 2 ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={acceptingId === Number(detailModalItem.id)}
                  onClick={async () => {
                    await handleDirectAccept(detailModalItem.id);
                    setDetailModalItem(null);
                  }}
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

      {/* ── Image Lightbox Preview Modal ── */}
      {previewImg && (
        <ImagePreviewModal
          url={previewImg.url}
          title={previewImg.title}
          onClose={() => setPreviewImg(null)}
        />
      )}
    </div>
  );
}

export default SWPInstallationRequest;
