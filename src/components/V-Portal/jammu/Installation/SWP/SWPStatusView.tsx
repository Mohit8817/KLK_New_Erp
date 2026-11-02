import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSwpService,
  getJammuSwpMediaCandidates,
  type JammuSwpStatusSiteItem,
} from '../../jammu-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

/* ───────── Field helpers ───────── */
const pick = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

const pickNum = (row: any, ...keys: string[]): number => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }
  }
  return 0;
};

const ALIASES: Record<string, string[]> = {
  f_farmer_name: ['f_farmer_name', 'farmer_name', 'applicant_name', 'name'],
  motor_no: ['mt_motor_no', 'motor_no'],
  pump_no: ['mt_pump_no', 'pump_no'],
  vfd_no: ['vfd_no', 'vfd_serial_no'],
  district: ['district', 'District'],
  tehsil: ['tehsil', 'Tehsil'],
  village: ['village', 'Village'],
};

const txt = (row: JammuSwpStatusSiteItem, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

const verifyOf = (r: any) => pickNum(r, 'verify_status', 'inst_verify_status');
const claimOf = (r: any) => pickNum(r, 'claim_status', 'inst_claim_status');

/* ───────── Status Badges ───────── */
const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

const ClaimBadge = ({ status, raw }: { status?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (status === 2 || r === '2' || r === 'approved') return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (status === 3 || r === '3' || r === 'rejected') return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  if (status === 1 || r === '1' || r === 'raised') return <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Raised</span>;
};

/* ── Robust Table Image: Strict NO BORDER RADIUS ── */
function RobustImage({
  path,
  alt,
  onClick,
}: {
  path?: string | null;
  alt: string;
  onClick?: (url: string) => void;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(() => getJammuSwpMediaCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
      }}
      onClick={() => onClick?.(currentSrc)}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((prev) => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

/* ───────── KPI Card ───────── */
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

/* ───────── Responsive page CSS ───────── */
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
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

/* ── Lightbox with Zoom ── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 860,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="ax-modal__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title || 'Media Preview'}</h4>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
            <img
              key={url}
              src={url}
              alt={title || 'Preview'}
              onLoad={() => setStatus('ready')}
              onError={() => setStatus('error')}
              style={{
                display: status === 'ready' ? 'block' : 'none',
                margin: 'auto',
                borderRadius: 0,
                ...(zoom === 1
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          </div>
        </div>

        <div
          className="ax-modal__footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">Open Full</a>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── Status Categories ───────── */
export interface StatusOption {
  key: string;
  label: string;
  sub: string;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';
}

const STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All allocated solar water pump sites', tone: 'accent' },
  { key: 'inst-complete', label: 'Installed', sub: 'Completed installations', tone: 'emerald' },
  { key: 'inst-pending', label: 'Pending', sub: 'Pending field installations', tone: 'amber' },
  { key: 'vendor-assigned', label: 'Vendor Assigned', sub: 'Assigned to vendor', tone: 'cyan' },
  { key: 'vendor-not-assigned', label: 'Vendor Not Assigned', sub: 'Awaiting allocation', tone: 'amber' },
  { key: 'verify-approved', label: 'Verify Approved', sub: 'Approved by departmental audit', tone: 'emerald' },
  { key: 'verify-pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', tone: 'amber' },
  { key: 'verify-reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', tone: 'pink' },
  { key: 'doc-submitted', label: 'HOC Submitted', sub: 'HOC documentation submitted', tone: 'cyan' },
  { key: 'doc-pending', label: 'HOC Pending', sub: 'Awaiting HOC submission', tone: 'amber' },
  { key: 'claim-applicable', label: 'Claim Applicable', sub: 'Sites eligible for claim', tone: 'violet' },
  { key: 'claim-raised', label: 'Claim Raised', sub: 'Payment claim raised', tone: 'accent' },
  { key: 'claim-approved', label: 'Claim Approved', sub: 'Claims sanctioned', tone: 'emerald' },
  { key: 'pay-done', label: 'Payment Done', sub: 'Payment fully disbursed', tone: 'emerald' },
  { key: 'pay-partially', label: 'Payment Partially Done', sub: 'Partially disbursed', tone: 'cyan' },
  { key: 'pay-pending', label: 'Payment Pending', sub: 'Payment settlement pending', tone: 'amber' },
];

export function SWPStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawInitial = searchParams.get('status') || 'total';
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(rawInitial);
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);
  const [data, setData] = useState<JammuSwpStatusSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const activeMeta = useMemo(() => {
    return (
      STATUS_CATALOG.find((s) => s.key === currentStatus) || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        sub: `Filtered by ${currentStatus}`,
        tone: 'accent' as const,
      }
    );
  }, [currentStatus]);

  // Sync state from query param
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    if (s && s !== currentStatus) {
      setCurrentStatus(s);
    }
    if (d && d !== districtFilter) setDistrictFilter(d);
  }, [searchParams]);

  // Load status sites via API 16 or 17
  const loadStatusData = useCallback(async (statusKey: string, district: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let items: JammuSwpStatusSiteItem[] = [];
      if (district && district !== 'all' && district !== 'All') {
        const res = await jammuSwpService.getDashboardDistrictwise(statusKey, district);
        items = res.data;
      } else {
        const res = await jammuSwpService.getDashboardByStatus(statusKey);
        items = res.data;
      }

      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('[Jammu SWP StatusView] API error:', err);
      setData([]);
      setError(err?.message || 'Failed to load installation status records from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatusData(currentStatus, districtFilter);
  }, [currentStatus, districtFilter, loadStatusData]);

  const handleSelectStatus = (key: string) => {
    setCurrentStatus(key);
    setSearchParams(districtFilter !== 'all' ? { status: key, district: districtFilter } : { status: key });
    setSearch('');
    setCurrentPage(1);
  };

  const handleSelectDistrict = (dist: string) => {
    setDistrictFilter(dist);
    setSearchParams(dist !== 'all' ? { status: currentStatus, district: dist } : { status: currentStatus });
    setSearch('');
    setCurrentPage(1);
  };

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = txt(r, 'district');
      if (d) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      const dist = txt(row, 'district').trim();
      if (districtFilter !== 'all' && districtFilter !== 'All' && dist.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        txt(row, 'f_farmer_name'),
        txt(row, 'district'),
        txt(row, 'tehsil'),
        txt(row, 'village'),
        txt(row, 'vfd_no'),
        txt(row, 'motor_no'),
        txt(row, 'pump_no'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, districtFilter, search]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // KPIs
  const totalSites = data.length;
  const verifyApproved = data.filter((r) => verifyOf(r) === 1).length;
  const verifyRejected = data.filter((r) => verifyOf(r) === 2).length;
  const verifyPending = totalSites - verifyApproved - verifyRejected;

  // Export columns
  const exportCols: ExportColumn<JammuSwpStatusSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'Site ID', accessor: (r) => r.id },
      { header: 'Applicant Name', accessor: (r) => txt(r, 'f_farmer_name') || DASH },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Tehsil', accessor: (r) => txt(r, 'tehsil') || DASH },
      { header: 'Village', accessor: (r) => txt(r, 'village') || DASH },
      { header: 'VFD No.', accessor: (r) => txt(r, 'vfd_no') || DASH },
      { header: 'Motor No.', accessor: (r) => txt(r, 'motor_no') || DASH },
      { header: 'Pump No.', accessor: (r) => txt(r, 'pump_no') || DASH },
      {
        header: 'Installation Status',
        accessor: (r) => (Number(r.inst_status) === 1 ? 'Installed' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) => {
          const st = verifyOf(r);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      {
        header: 'Claim Status',
        accessor: (r) => {
          const st = claimOf(r);
          return st === 2 ? 'Approved' : st === 3 ? 'Rejected' : st === 1 ? 'Raised' : 'Not Raised';
        },
      },
    ],
    []
  );

  const openPreview = (url: string, title: string) => setPreviewImage({ url, title });

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={`Jammu SWP Sites: ${activeMeta.label}`}
        subtitle={`${activeMeta.sub} • Showing ${num(filteredRows.length)} of ${num(data.length)} loaded sites`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP', href: '/v/jammu/installation/swp/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, districtFilter, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation/swp/dashboard" className="ax-btn ax-btn--ghost ax-btn--sm">
              ← Back to Dashboard
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__content">{error}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards (4 Cards) ── */}
      <div className="asw-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        <KpiCard
          tone={activeMeta.tone}
          icon={svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />)}
          label={activeMeta.label}
          value={loading ? '…' : num(totalSites)}
          sub="Sites currently listed"
        />

        <KpiCard
          tone="emerald"
          icon={svg(<path d="M7 12l5 5l10 -10" />)}
          label="Verify Approved"
          value={loading ? '…' : num(verifyApproved)}
          sub="Audited and approved"
        />

        <KpiCard
          tone="amber"
          icon={svg(<circle cx="12" cy="12" r="9" />)}
          label="Verify Pending"
          value={loading ? '…' : num(verifyPending)}
          sub="Awaiting review"
        />

        <KpiCard
          tone="pink"
          icon={svg(<path d="M18 6l-12 12M6 6l12 12" />)}
          label="Verify Rejected"
          value={loading ? '…' : num(verifyRejected)}
          sub="Flagged for correction"
        />
      </div>

      {/* ── Category Pill Navigation ── */}
      <div
        className="ax-card"
        style={{
          marginBottom: 'var(--ax-space-4)',
          padding: '12px 16px',
          overflowX: 'auto',
          background: 'var(--ax-surface-subtle, #f8fafc)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', marginRight: 4 }}>
            Status Categories:
          </span>
          {STATUS_CATALOG.map((c) => {
            const isActive = c.key === currentStatus;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => handleSelectStatus(c.key)}
                className={`ax-btn ax-btn--xs ${isActive ? 'ax-btn--primary' : 'ax-btn--ghost'}`}
                style={{
                  height: 28,
                  padding: '0 10px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="SWP Status Sites Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeMeta.label} ({num(filteredRows.length)})
            </h2>
            <p className="ax-card__subtitle">
              {districtFilter !== 'all' ? `Filtered by ${districtFilter} District` : 'All Jammu & Kashmir Districts'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter Dropdown */}
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => handleSelectDistrict(e.target.value)}
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {districtFilter !== 'all' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => handleSelectDistrict('all')}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Clear District
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search applicant, serial, district…"
                size="sm"
                ariaLabel="Search status sites"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filteredRows
                    .map((r, i) =>
                      [
                        i + 1,
                        r.id,
                        txt(r, 'f_farmer_name'),
                        txt(r, 'district'),
                        txt(r, 'tehsil'),
                        txt(r, 'village'),
                        txt(r, 'vfd_no'),
                        txt(r, 'motor_no'),
                        txt(r, 'pump_no'),
                        Number(r.inst_status) === 1 ? 'Installed' : 'Pending',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  alert('Copied to clipboard!');
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Site ID,Applicant Name,District,Tehsil,Village,VFD No.,Motor No.,Pump No.,Installation Status',
                    ...filteredRows.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${txt(r, 'f_farmer_name')}","${txt(r, 'district')}","${txt(r, 'tehsil')}","${txt(r, 'village')}","${txt(r, 'vfd_no')}","${txt(r, 'motor_no')}","${txt(r, 'pump_no')}","${Number(r.inst_status) === 1 ? 'Installed' : 'Pending'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SWP_${currentStatus}_Sites.csv`;
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Site ID,Applicant Name,District,Tehsil,Village,VFD No.,Motor No.,Pump No.,Installation Status',
                    ...filteredRows.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${txt(r, 'f_farmer_name')}","${txt(r, 'district')}","${txt(r, 'tehsil')}","${txt(r, 'village')}","${txt(r, 'vfd_no')}","${txt(r, 'motor_no')}","${txt(r, 'pump_no')}","${Number(r.inst_status) === 1 ? 'Installed' : 'Pending'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SWP_${currentStatus}_Sites.xls`;
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
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Site ID</th>
                <th className="ax-table__th">Applicant / Farmer Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Tehsil</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">VFD No.</th>
                <th className="ax-table__th">Motor No.</th>
                <th className="ax-table__th">Pump No.</th>
                <th className="ax-table__th">Install Status</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading sites from server…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found for this status"
                      message="No records match your selected criteria or search term."
                      onClear={search ? () => setSearch('') : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedRows.map((row, idx) => (
                  <tr key={row.id || idx} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>#{row.id}</td>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      {txt(row, 'f_farmer_name') || DASH}
                    </td>
                    <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                    <td className="ax-table__td">{txt(row, 'tehsil') || DASH}</td>
                    <td className="ax-table__td">{txt(row, 'village') || DASH}</td>
                    <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{txt(row, 'vfd_no') || DASH}</td>
                    <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{txt(row, 'motor_no') || DASH}</td>
                    <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{txt(row, 'pump_no') || DASH}</td>
                    <td className="ax-table__td">
                      {Number(row.inst_status) === 1 ? (
                        <span className="ax-badge ax-badge--soft ax-badge--success">Installed</span>
                      ) : (
                        <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                      )}
                    </td>
                    <td className="ax-table__td">
                      <VerifyBadge value={verifyOf(row)} raw={row.inst_verify_status} />
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <Link
                        to={`/v/jammu/installation/swp/installation-site?site_id=${row.id}`}
                        className="ax-btn ax-btn--primary ax-btn--xs"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                      >
                        Open Form ➔
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: '12px 16px' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRows.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Image Preview Lightbox ── */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export default SWPStatusView;
