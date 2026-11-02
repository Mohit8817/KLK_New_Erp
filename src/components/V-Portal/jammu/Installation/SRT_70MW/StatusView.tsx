import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSrt70mwService,
  getJammuMediaCandidates,
  normalizeJammuStatus,
  type JammuStatusSiteItem,
} from '../../jammu-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  KpiSkeleton,
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
  meter_no: ['meter_no', 'solar_meter_no', 'solarmeter_no'],
  inverter_no: ['inverter_no'],
  latitude: ['latitude', 'inst_latitude'],
  longitude: ['longitude', 'inst_longitude'],
  remark: ['remark', 'inst_remarks'],
  district: ['district', 'District'],
};

const txt = (row: JammuStatusSiteItem, key: string): string => {
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

  const candidates = useMemo(() => getJammuMediaCandidates(path), [path]);

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
  { key: 'total', label: 'Total Sites', sub: 'All allocated rooftop sites', tone: 'accent' },
  { key: 'inst-complete', label: 'Installed', sub: 'Completed installations', tone: 'emerald' },
  { key: 'inst-pending', label: 'Pending', sub: 'Pending field installations', tone: 'amber' },
  { key: 'material-dispatch', label: 'Material Dispatched', sub: 'Materials on site', tone: 'cyan' },
  { key: 'material-pending', label: 'Material Pending', sub: 'Awaiting dispatch', tone: 'amber' },
  { key: 'verify-approved', label: 'Verify Approved', sub: 'Approved by departmental audit', tone: 'emerald' },
  { key: 'verify-pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', tone: 'amber' },
  { key: 'verify-reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', tone: 'pink' },
  { key: 'claim-applicable', label: 'Claim Applicable', sub: 'Sites eligible for claim', tone: 'violet' },
  { key: 'claim-raised', label: 'Claim Raised', sub: 'Vendor invoices submitted', tone: 'accent' },
  { key: 'claim-approved', label: 'Claim Approved', sub: 'Claims sanctioned', tone: 'emerald' },
  { key: 'inst-pay80-done', label: '80% Payment Done', sub: '80% stage disbursement sites', tone: 'emerald' },
  { key: 'inst-pay20-done', label: '20% Final Payment Done', sub: '20% final disbursement sites', tone: 'cyan' },
];

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawInitial = searchParams.get('status') || 'total';
  const initialStatus = normalizeJammuStatus(rawInitial);
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);
  const [data, setData] = useState<JammuStatusSiteItem[]>([]);
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
    const norm = normalizeJammuStatus(currentStatus);
    return (
      STATUS_CATALOG.find((s) => s.key === norm || s.key === currentStatus) || {
        key: norm,
        label: norm.replace(/[-_]/g, ' ').toUpperCase(),
        sub: `Filtered by ${norm}`,
        tone: 'accent' as const,
      }
    );
  }, [currentStatus]);

  // Sync state from query param
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    if (s) {
      const norm = normalizeJammuStatus(s);
      if (norm !== currentStatus) setCurrentStatus(norm);
    }
    if (d && d !== districtFilter) setDistrictFilter(d);
  }, [searchParams]);

  // Load status sites via API 13 or 14
  const loadStatusData = useCallback(async (statusKey: string, district: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const targetStatus = normalizeJammuStatus(statusKey);
      let items: JammuStatusSiteItem[] = [];
      if (district && district !== 'all' && district !== 'All') {
        const res = await jammuSrt70mwService.getDistrictwiseByStatus(targetStatus, district);
        items = res.data;
      } else {
        const res = await jammuSrt70mwService.getDashboardByStatus(targetStatus);
        items = res.data;
      }

      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('[Jammu StatusView] API error:', err);
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
        txt(row, 'site_name'),
        txt(row, 'ca_no'),
        txt(row, 'contact_person'),
        txt(row, 'contact_number'),
        txt(row, 'meter_no'),
        txt(row, 'inverter_no'),
        txt(row, 'district'),
        txt(row, 'sanction_load'),
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
  const exportCols: ExportColumn<JammuStatusSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') || DASH },
      { header: 'CA No.', accessor: (r) => txt(r, 'ca_no') || DASH },
      { header: 'Sanction Load', accessor: (r) => txt(r, 'sanction_load') || DASH },
      { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r) => txt(r, 'contact_number') || DASH },
      { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') || DASH },
      { header: 'Meter No.', accessor: (r) => txt(r, 'meter_no') || DASH },
      { header: 'Latitude', accessor: (r) => txt(r, 'latitude') || DASH },
      { header: 'Longitude', accessor: (r) => txt(r, 'longitude') || DASH },
      { header: 'Remark', accessor: (r) => txt(r, 'remark') || DASH },
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
        title={`Jammu SRT 70MW Sites: ${activeMeta.label}`}
        subtitle={`${activeMeta.sub} • Showing ${num(filteredRows.length)} of ${num(data.length)} loaded sites`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW', href: '/v/jammu/installation/srt-70mw/dashboard' },
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
            <Link to="/v/jammu/installation/srt-70mw/dashboard" className="ax-btn ax-btn--ghost ax-btn--sm">
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
      <div className="ax-dash-grid">
        {loading && !data.length ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Sites"
              value={totalSites.toLocaleString('en-IN')}
              sub={`Loaded for ${activeMeta.label}`}
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Verify Approved"
              value={verifyApproved.toLocaleString('en-IN')}
              sub="Approved by departmental audit"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Verify Pending"
              value={verifyPending.toLocaleString('en-IN')}
              sub="Awaiting inspection audit"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="pink"
              label="Verify Rejected"
              value={verifyRejected.toLocaleString('en-IN')}
              sub="Requires vendor rectification"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>)}
            />
          </>
        )}
      </div>

      {/* ── Status Category Pills Navigation ── */}
      <div className="ax-card" style={{ marginTop: 'var(--ax-space-4)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {STATUS_CATALOG.map((cat) => {
            const isActive = cat.key === currentStatus;
            return (
              <button
                key={cat.key}
                type="button"
                className={`ax-btn ax-btn--sm ${isActive ? 'ax-btn--primary' : 'ax-btn--ghost'}`}
                style={{ borderRadius: 9999, whiteSpace: 'nowrap' }}
                onClick={() => handleSelectStatus(cat.key)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Master Sites Table ── */}
      <div className="ax-card" style={{ marginTop: 'var(--ax-space-4)' }}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Installation Dossier &amp; Serial Ledger</h2>
            <p className="ax-card__subtitle">
              Detailed technical records for status: <b style={{ color: 'var(--ax-accent)' }}>{activeMeta.label}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
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

              <SearchInput value={search} onChange={setSearch} placeholder="Search site, CA, meter..." size="sm" />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportDataToCSV(filteredRows, exportCols, `Jammu_SRT_Status_${currentStatus}`)}
                onExportExcel={() => exportDataToExcel(filteredRows, exportCols, `Jammu_SRT_Status_${currentStatus}`)}
                onExportPDF={() => printTableData(filteredRows, exportCols, `Jammu SRT Status: ${activeMeta.label}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr.</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name &amp; CA No.</th>
                <th className="ax-table__th">Sanction</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Inverter / Meter</th>
                <th className="ax-table__th">Panel Serials</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photos</th>
                <th className="ax-table__th">Verification</th>
                <th className="ax-table__th">Claim</th>
                <th className="ax-table__th">Disbursements</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data.length ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '32px' }}>
                    <span className="ax-spinner" /> Loading status sites…
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <TableEmptyState title="No sites found" message="No installation records matched the selected status and filters." />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const siteName = txt(r, 'site_name') || `Site #${r.id}`;
                  const caNo = txt(r, 'ca_no');
                  const district = txt(r, 'district');
                  const sLoad = txt(r, 'sanction_load') || (r.plant_sc ? `${r.plant_sc} kW` : DASH);
                  const contactPerson = txt(r, 'contact_person');
                  const contactNumber = txt(r, 'contact_number');
                  const invNo = txt(r, 'inverter_no');
                  const mtrNo = txt(r, 'meter_no');

                  // Extract panel serials
                  let panels: string[] = [];
                  if (Array.isArray(r.panel_serial_no)) {
                    panels = r.panel_serial_no;
                  } else if (typeof r.panel_serial_no === 'string') {
                    try {
                      panels = JSON.parse(r.panel_serial_no);
                    } catch {
                      panels = r.panel_serial_no ? [r.panel_serial_no] : [];
                    }
                  } else if (Array.isArray(r.panel_no)) {
                    panels = r.panel_no;
                  }

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td">{srNo}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">{district || DASH}</span>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</div>
                        {caNo && <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>CA: {caNo}</div>}
                      </td>
                      <td className="ax-table__td">{sLoad}</td>
                      <td className="ax-table__td">
                        <div>{contactPerson || DASH}</div>
                        {contactNumber && <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>{contactNumber}</div>}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Inv:</span> {invNo || DASH}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Mtr:</span> {mtrNo || DASH}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        {panels.length > 0 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--accent" title={panels.join(', ')}>
                            {panels.length} Panels
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <RobustImage path={r.panel_image} alt={`${siteName} Panel`} onClick={(u) => openPreview(u, `${siteName} - Solar Panels`)} />
                          <RobustImage path={r.system_image} alt={`${siteName} System`} onClick={(u) => openPreview(u, `${siteName} - System BOS`)} />
                          <RobustImage path={r.inverter_image} alt={`${siteName} Inverter`} onClick={(u) => openPreview(u, `${siteName} - Inverter`)} />
                          <RobustImage path={r.meter_image} alt={`${siteName} Meter`} onClick={(u) => openPreview(u, `${siteName} - Meter`)} />
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <VerifyBadge value={verifyOf(r)} raw={r.verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={claimOf(r)} raw={r.claim_status} />
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                          <span>80%: {r.inst_pay80_status === 1 ? <b style={{ color: '#16a34a' }}>Paid</b> : <span style={{ color: '#94a3b8' }}>Pending</span>}</span>
                          <span>20%: {r.inst_pay20_status === 1 ? <b style={{ color: '#16a34a' }}>Paid</b> : <span style={{ color: '#94a3b8' }}>Pending</span>}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with left-aligned pagination */}
        <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border)', padding: '12px 16px' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRows.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </div>

      {/* Image Preview Lightbox */}
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

export default StatusView;
