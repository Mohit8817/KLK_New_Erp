import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  normalizeRescoStatus,
  type JammuRescoInstalledSiteItem,
} from '../../jammu-services';
import { getJammuMediaCandidates } from '../../jammu-services/jammuSrt70mwService';
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
  remark: ['remark', 'remarks', 'inst_remarks'],
  district: ['district', 'District'],
};

const txt = (row: any, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

const verifyOf = (r: any) => pickNum(r, 'inst_verify_status', 'verify_status');
const docOf = (r: any) => pickNum(r, 'inst_doc_status', 'document_status');

/* ───────── Status Badges ───────── */
const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved' || r === 'complete') {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  }
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') {
    return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>;
  if (s === 3) return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  if (s === 1) return <span className="ax-badge ax-badge--soft ax-badge--info">Pending</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Submitted</span>;
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
        border: '1px solid var(--ax-border, #e2e8f0)',
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
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777' },
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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
  gap: 'var(--ax-space-2, 8px)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── Status Categories for RESCO ───────── */
export interface StatusOption {
  key: string;
  label: string;
  sub: string;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';
}

const RESCO_STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All allocated RESCO sites', tone: 'accent' },
  { key: 'complete', label: 'Installed', sub: 'Completed installations', tone: 'emerald' },
  { key: 'pending', label: 'Pending', sub: 'Pending field installations', tone: 'amber' },
  { key: 'verify_approved', label: 'Verify Approved', sub: 'Approved by departmental audit', tone: 'emerald' },
  { key: 'verify_pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', tone: 'amber' },
  { key: 'verify_reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', tone: 'pink' },
  { key: 'claim1_approved', label: 'Claim 1 Approved', sub: 'Milestone 1 sanctioned', tone: 'emerald' },
  { key: 'claim2_approved', label: 'Claim 2 Approved', sub: 'Milestone 2 sanctioned', tone: 'cyan' },
  { key: 'claim3_approved', label: 'Claim 3 Approved', sub: 'Milestone 3 sanctioned', tone: 'violet' },
];

export function RescoStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawInitial = searchParams.get('status') || 'total';
  const initialStatus = normalizeRescoStatus(rawInitial);
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);
  const [data, setData] = useState<JammuRescoInstalledSiteItem[]>([]);
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
    const norm = normalizeRescoStatus(currentStatus);
    return (
      RESCO_STATUS_CATALOG.find((s) => s.key === norm || s.key === currentStatus) || {
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
      const norm = normalizeRescoStatus(s);
      if (norm !== currentStatus) setCurrentStatus(norm);
    }
    if (d && d !== districtFilter) setDistrictFilter(d);
  }, [searchParams]);

  // Load status sites via API 22 or 23
  const loadStatusData = useCallback(async (statusKey: string, district: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const targetStatus = normalizeRescoStatus(statusKey);
      let items: JammuRescoInstalledSiteItem[] = [];

      if (district && district !== 'all' && district !== 'All') {
        items = await jammuRescoService.getDistrictWiseData(targetStatus, district);
      } else {
        items = await jammuRescoService.getStatusWiseData(targetStatus);
      }

      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('[Jammu Resco StatusView] API error:', err);
      setData([]);
      setError(err?.message || 'Failed to load RESCO status records from server');
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
        txt(row, 'contact_person'),
        txt(row, 'contact_number'),
        txt(row, 'inverter_no'),
        txt(row, 'meter_no'),
        txt(row, 'district'),
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
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'District', accessor: (r: any) => txt(r, 'district') || DASH },
      { header: 'Site Name', accessor: (r: any) => txt(r, 'site_name') || DASH },
      { header: 'Contact Person', accessor: (r: any) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r: any) => txt(r, 'contact_number') || DASH },
      { header: 'Inverter No.', accessor: (r: any) => txt(r, 'inverter_no') || DASH },
      { header: 'Solar Meter No.', accessor: (r: any) => txt(r, 'meter_no') || DASH },
      { header: 'Net Meter No.', accessor: (r: any) => txt(r, 'nm_sm_no') || DASH },
      { header: 'Logger No.', accessor: (r: any) => txt(r, 'loger_no') || DASH },
      { header: 'Latitude', accessor: (r: any) => txt(r, 'latitude') || DASH },
      { header: 'Longitude', accessor: (r: any) => txt(r, 'longitude') || DASH },
      { header: 'Remark', accessor: (r: any) => txt(r, 'remark') || DASH },
      {
        header: 'Verify Status',
        accessor: (r: any) => {
          const st = verifyOf(r);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      {
        header: 'Document Status',
        accessor: (r: any) => {
          const st = docOf(r);
          return st === 2 ? 'Complete' : st === 3 ? 'Rejected' : 'Pending';
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
        title={`Jammu RESCO Sites: ${activeMeta.label}`}
        subtitle={`${activeMeta.sub} • Showing ${num(filteredRows.length)} of ${num(data.length)} loaded sites`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'RESCO', href: '/v/jammu/installation/resco/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2, 8px)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, districtFilter, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation/resco/dashboard" className="ax-btn ax-btn--ghost ax-btn--sm">
              ← Back to Dashboard
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4, 16px)' }}>
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
              sub="Approved by audit inspection"
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
      <div className="ax-card" style={{ marginTop: 'var(--ax-space-4, 16px)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {RESCO_STATUS_CATALOG.map((cat) => {
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
      <div className="ax-card" style={{ marginTop: 'var(--ax-space-4, 16px)' }}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">RESCO Installation Dossier &amp; Serial Ledger</h2>
            <p className="ax-card__subtitle">
              Detailed technical records for status: <b style={{ color: 'var(--ax-accent, #2563eb)' }}>{activeMeta.label}</b>
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

              <SearchInput value={search} onChange={setSearch} placeholder="Search site, serial..." size="sm" />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportDataToCSV(filteredRows, exportCols, `Jammu_RESCO_Status_${currentStatus}`)}
                onExportExcel={() => exportDataToExcel(filteredRows, exportCols, `Jammu_RESCO_Status_${currentStatus}`)}
                onExportPDF={() => printTableData(filteredRows, exportCols, `Jammu RESCO Status: ${activeMeta.label}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr.</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Equipment Serials</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photos</th>
                <th className="ax-table__th">Verification</th>
                <th className="ax-table__th">Document</th>
                <th className="ax-table__th">Claim Status (1 / 2 / 3)</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data.length ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                    <span className="ax-spinner" /> Loading status sites…
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <TableEmptyState title="No sites found" message="No installation records matched the selected status and filters." />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const siteName = txt(r, 'site_name') || `Site #${r.id}`;
                  const district = txt(r, 'district');
                  const contactPerson = txt(r, 'contact_person');
                  const contactNumber = txt(r, 'contact_number');
                  const invNo = txt(r, 'inverter_no');
                  const mtrNo = txt(r, 'meter_no');
                  const nmNo = txt(r, 'nm_sm_no');
                  const logNo = txt(r, 'loger_no');

                  const c1 = Number(r.inst_claim1_status ?? 0);
                  const c2 = Number(r.inst_claim2_status ?? 0);
                  const c3 = Number(r.inst_claim3_status ?? 0);

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td">{srNo}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">{district || DASH}</span>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</div>
                      </td>
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
                        {nmNo && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: 'var(--ax-text-muted)' }}>Net:</span> {nmNo}
                          </div>
                        )}
                        {logNo && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: 'var(--ax-text-muted)' }}>Log:</span> {logNo}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <RobustImage path={r.system_image} alt={`${siteName} System`} onClick={(u) => openPreview(u, `${siteName} - System BOS`)} />
                          <RobustImage path={r.inverter_image} alt={`${siteName} Inverter`} onClick={(u) => openPreview(u, `${siteName} - Inverter`)} />
                          <RobustImage path={r.panel_image} alt={`${siteName} Panel`} onClick={(u) => openPreview(u, `${siteName} - Solar Panels`)} />
                          <RobustImage path={r.nm_sm_image} alt={`${siteName} Meter`} onClick={(u) => openPreview(u, `${siteName} - Meter`)} />
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <VerifyBadge value={verifyOf(r)} raw={r.inst_verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <DocBadge status={docOf(r)} />
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span className={`ax-badge ax-badge--soft ${c1 === 2 ? 'ax-badge--success' : c1 === 1 ? 'ax-badge--info' : 'ax-badge--neutral'}`} title="Milestone 1">
                            C1: {c1 === 2 ? 'Approved' : c1 === 1 ? 'Raised' : 'Pending'}
                          </span>
                          <span className={`ax-badge ax-badge--soft ${c2 === 2 ? 'ax-badge--success' : c2 === 1 ? 'ax-badge--info' : 'ax-badge--neutral'}`} title="Milestone 2">
                            C2: {c2 === 2 ? 'Approved' : c2 === 1 ? 'Raised' : 'Pending'}
                          </span>
                          <span className={`ax-badge ax-badge--soft ${c3 === 2 ? 'ax-badge--success' : c3 === 1 ? 'ax-badge--info' : 'ax-badge--neutral'}`} title="Milestone 3">
                            C3: {c3 === 2 ? 'Approved' : c3 === 1 ? 'Raised' : 'Pending'}
                          </span>
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
        <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: '12px 16px' }}>
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

export default RescoStatusView;
