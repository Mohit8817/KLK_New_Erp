import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtInstalledSiteItem,
} from '../../goa-services/goaSrtInstallationService';
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

/* ───────── Field helpers (API field-name mismatch fix) ───────── */
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

// Page key -> possible API keys (first non-empty wins)
const ALIASES: Record<string, string[]> = {
  solar_meter_no: ['solar_meter_no', 'solarmeter_no'],
  net_smart_meter_no: ['net_smart_meter_no', 'nm_sm_no'],
  latitude: ['latitude', 'inst_latitude'],
  longitude: ['longitude', 'inst_longitude'],
  remark: ['remark', 'inst_remarks'],
  district: ['district', 'District'],
};

const txt = (row: GoaSrtInstalledSiteItem, key: string): string => {
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

/* ── Robust Table Image: NO BORDER RADIUS ── */
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

  const candidates = useMemo(() => getGoaSrtInstallationImageCandidates(path), [path]);

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

/* ───────── KPI Card (same as Claim Request) ───────── */
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

/* ───────── Responsive page CSS (same as Claim Request) ───────── */
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

/* ── Lightbox with Zoom (same as Claim Request) ── */
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
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 860, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
      >
        <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
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
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
}

const STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All assigned rooftop sites', tone: 'accent' },
  { key: 'complete', label: 'Installed', sub: 'Completed installations', tone: 'emerald' },
  { key: 'pending', label: 'Pending', sub: 'Pending field installations', tone: 'amber' },
  { key: 'verify-pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', tone: 'amber' },
  { key: 'verify-approved', label: 'Verify Approved', sub: 'Approved by departmental audit', tone: 'cyan' },
  { key: 'verify-reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', tone: 'red' },
  { key: 'claim-applicable', label: 'Claim Applicable', sub: 'Sites eligible for claim', tone: 'violet' },
  { key: 'claim-raised', label: 'Claim Raised', sub: 'Vendor invoices submitted', tone: 'accent' },
  { key: 'inst-pay1', label: 'Payment 1', sub: '1st 70% disbursement sites', tone: 'cyan' },
  { key: 'inst-pay2', label: 'Payment 2', sub: '2nd 15% disbursement sites', tone: 'amber' },
  { key: 'inst-pay3', label: 'Payment 3', sub: '3rd 15% disbursement sites', tone: 'violet' },
];

export default function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'total';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [data, setData] = useState<GoaSrtInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filters & pagination
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
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
    if (s && s !== currentStatus) {
      setCurrentStatus(s);
    }
  }, [searchParams]);

  // Load status sites
  const loadStatusData = useCallback(async (statusKey: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const items = await goaSrtInstallationService.getDashboardViewData(statusKey);
      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('[Goa StatusView] load error:', err);
      setError(err?.message || 'Failed to load installation status records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatusData(currentStatus);
  }, [currentStatus, loadStatusData]);

  const handleSelectStatus = (key: string) => {
    setCurrentStatus(key);
    setSearchParams({ status: key });
    setDistrictFilter('all');
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
      if (districtFilter !== 'all' && dist.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (!q) return true;
      const haystack = [
        txt(row, 'site_name'),
        txt(row, 'farmer_name'),
        txt(row, 'ca_no'),
        txt(row, 'contact_person'),
        txt(row, 'contact_number'),
        txt(row, 'solar_meter_no'),
        txt(row, 'inverter_no'),
        txt(row, 'net_smart_meter_no'),
        txt(row, 'loger_no'),
        txt(row, 'district'),
        txt(row, 'sanction_load'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, districtFilter, search]);

  // Pagination (defaults to 100 rows per page)
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // KPIs (real loaded data only)
  const totalSites = data.length;
  const verifyApproved = data.filter((r) => verifyOf(r) === 1).length;
  const verifyRejected = data.filter((r) => verifyOf(r) === 2).length;
  const verifyPending = totalSites - verifyApproved - verifyRejected;
  const claimRaised = data.filter((r) => claimOf(r) >= 1).length;

  // Export columns (same as table headers)
  const exportCols: ExportColumn<GoaSrtInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'State', accessor: (r) => txt(r, 'state') || 'Goa' },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') || txt(r, 'farmer_name') || DASH },
      { header: 'CA No.', accessor: (r) => txt(r, 'ca_no') || DASH },
      { header: 'Sanction Load', accessor: (r) => txt(r, 'sanction_load') || DASH },
      { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r) => txt(r, 'contact_number') || DASH },
      { header: 'Solar Meter No.', accessor: (r) => txt(r, 'solar_meter_no') || DASH },
      { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') || DASH },
      { header: 'Net / Smart Meter No.', accessor: (r) => txt(r, 'net_smart_meter_no') || DASH },
      { header: 'Logger No.', accessor: (r) => txt(r, 'loger_no') || DASH },
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
        title={`Goa SRT Sites: ${activeMeta.label}`}
        subtitle={`${activeMeta.sub} • Showing ${num(filteredRows.length)} of ${num(data.length)} loaded sites`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/srt/installation/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/goa/srt/installation/dashboard" className="ax-btn ax-btn--ghost ax-btn--sm">
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
              tone="cyan"
              label="Claim Raised"
              value={claimRaised.toLocaleString('en-IN')}
              sub="Vendor invoices submitted"
              icon={svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="status-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">INSTALLATION STATUS</span>
              <h2 id="status-table-title" className="ax-card__title">View {activeMeta.label} Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredRows.length} of {data.length} site records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={currentStatus}
                  onChange={(e) => handleSelectStatus(e.target.value)}
                  aria-label="Filter by status category"
                >
                  {STATUS_CATALOG.map((st) => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                  {!STATUS_CATALOG.some((s) => s.key === currentStatus) && (
                    <option value={currentStatus}>{activeMeta.label}</option>
                  )}
                </select>

                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {(search || districtFilter !== 'all') && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearch('');
                      setDistrictFilter('all');
                      setCurrentPage(1);
                    }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                  placeholder="Search site, CA, contact, meter…"
                  size="sm"
                  ariaLabel="Search status records"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                  onExportCSV={() => exportDataToCSV(`Goa_SRT_Status_${currentStatus}`, filteredRows, exportCols)}
                  onExportExcel={() => exportDataToExcel(`Goa_SRT_Status_${currentStatus}`, filteredRows, exportCols)}
                  onExportPDF={() => printTableData(`Goa SRT Installation - ${activeMeta.label}`, filteredRows, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2400 }}
            >
              <caption className="ax-visually-hidden">View {activeMeta.label} Information</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Sanction Load</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Logger No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>System Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Inverter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Panel Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Net Meter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Logger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="ax-table__td" colSpan={22} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" /> Loading {activeMeta.label} sites...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={22} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState
                        title="No sites found"
                        message={
                          search
                            ? 'No records match your search keyword.'
                            : `No sites available for status category "${activeMeta.label}".`
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const siteTitle = txt(row, 'site_name') || txt(row, 'farmer_name') || 'Site';
                    const netMeterImg = row.nm_sm_image || (row as any).net_smart_meter_image;
                    return (
                      <tr key={row.id ?? `${(row as any).site_id ?? ''}-${idx}`}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{txt(row, 'state') || 'Goa'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row, 'district') || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={siteTitle}>
                          {txt(row, 'site_name') || txt(row, 'farmer_name') || DASH}
                        </td>
                        <td className="ax-table__td">
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">{txt(row, 'ca_no') || DASH}</span>
                        </td>
                        <td className="ax-table__td">{txt(row, 'sanction_load') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'contact_number') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'solar_meter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'inverter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'net_smart_meter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'loger_no') || DASH}</td>

                        {/* Image cells with zoom preview (NO border radius) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={row.system_image} alt="System" onClick={(url) => openPreview(url, `${siteTitle} - System Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={row.inverter_image} alt="Inverter" onClick={(url) => openPreview(url, `${siteTitle} - Inverter Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={row.panel_image} alt="Panel" onClick={(url) => openPreview(url, `${siteTitle} - Panel Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={netMeterImg} alt="Net Meter" onClick={(url) => openPreview(url, `${siteTitle} - Net / Smart Meter Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={row.loger_image} alt="Logger" onClick={(url) => openPreview(url, `${siteTitle} - Logger Image`)} />
                        </td>

                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'latitude') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'longitude') || DASH}</td>
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={txt(row, 'remark')}>
                          {txt(row, 'remark') || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <VerifyBadge value={verifyOf(row)} raw={(row as any).verify} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <ClaimBadge status={claimOf(row)} raw={(row as any).claim} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredRows.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal with Zoom ── */}
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