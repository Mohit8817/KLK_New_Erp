import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSslService,
  normalizeJammuSslStatus,
  resolveJammuSslMediaUrl,
  getJammuSslMediaCandidates,
  type JammuSslStatusSiteItem,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const InstBadge = ({ status, raw }: { status?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const s = Number(status ?? 0);
  if (s === 1 || r === '1' || r === 'installed' || r === 'complete') return <Badge tone="success">Installed</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  children,
  dialogClass = '',
  dialogStyle,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Lightbox Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="status-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="status-preview-title">{title || 'Image Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>
          )}
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

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Interactive Image Thumbnail ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getJammuSslMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview light image"
    />
  );
}

/* ───────── Styles ───────── */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 820px; }
  .ax-modal__header {
    padding: 18px 24px;
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
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
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
const monoCell = { fontFamily: 'var(--ax-font-mono, monospace)', fontSize: '12px' } as const;

// Status dropdown options
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Street Lights (Total)', value: 'total' },
  { label: 'Completed Lights', value: 'completed' },
  { label: 'Pending Lights', value: 'pending' },
  { label: 'Verification Approved', value: 'verify-approved' },
  { label: 'Verification Pending', value: 'verify-pending' },
  { label: 'Verification Rejected', value: 'verify-reject' },
  { label: 'Claim Applicable', value: 'claim-applicable' },
  { label: 'Claims Raised', value: 'claim-raised' },
  { label: 'Claims Approved', value: 'claim-approved' },
  { label: 'Payment Done', value: 'pay-done' },
  { label: 'Partial Payment', value: 'pay-partially' },
  { label: 'Payment Pending', value: 'pay-pending' },
];

export function SSLStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status') || 'total';
  const currentStatus = normalizeJammuSslStatus(rawStatus);
  const currentDistrict = searchParams.get('district') || '';

  const [records, setRecords] = useState<JammuSslStatusSiteItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Selected item for full view modal
  const [detailItem, setDetailItem] = useState<JammuSslStatusSiteItem | null>(null);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Load from API 12 or API 13
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (currentDistrict && currentDistrict.trim() !== '' && currentDistrict.toLowerCase() !== 'all') {
        res = await jammuSslService.getDashboardViewDistrictwise(currentStatus, currentDistrict);
      } else {
        res = await jammuSslService.getDashboardViewByStatus(currentStatus);
      }

      setRecords(Array.isArray(res?.swp) ? res.swp : []);
      setTotalCount(res?.count || (Array.isArray(res?.swp) ? res.swp.length : 0));
    } catch (err: any) {
      console.error('[Jammu SSL StatusView] load error:', err);
      setRecords([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct districts from records
  const distinctDistricts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered
  const filtered = useMemo(() => {
    let list = records;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          String(r.id).includes(q) ||
          txt(r, 'district').toLowerCase().includes(q) ||
          txt(r, 'block').toLowerCase().includes(q) ||
          txt(r, 'village').toLowerCase().includes(q) ||
          txt(r, 'beneficiary_name').toLowerCase().includes(q) ||
          txt(r, 'contact_no').toLowerCase().includes(q) ||
          txt(r, 'imei_no').toLowerCase().includes(q) ||
          txt(r, 'sim_no').toLowerCase().includes(q) ||
          txt(r, 'battery_serial_no').toLowerCase().includes(q) ||
          txt(r, 'module_no').toLowerCase().includes(q) ||
          txt(r, 'latitude').toLowerCase().includes(q) ||
          txt(r, 'longitude').toLowerCase().includes(q) ||
          txt(r, 'remark').toLowerCase().includes(q) ||
          txt(r, 'inst_remark').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [records, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, currentStatus, currentDistrict, setPage]);

  // Handle status filter change
  const handleStatusChange = (newStatus: string) => {
    const q: Record<string, string> = { status: newStatus };
    if (currentDistrict) q.district = currentDistrict;
    setSearchParams(q);
  };

  // Handle district filter change
  const handleDistrictChange = (newDistrict: string) => {
    const q: Record<string, string> = { status: currentStatus };
    if (newDistrict && newDistrict !== 'all') q.district = newDistrict;
    setSearchParams(q);
  };

  // Current status label
  const statusLabel = useMemo(() => {
    const found = STATUS_OPTIONS.find((s) => s.value === currentStatus);
    return found ? found.label : currentStatus;
  }, [currentStatus]);

  // Export Columns
  const exportCols: ExportColumn<JammuSslStatusSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuSslStatusSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Light ID', accessor: (r: JammuSslStatusSiteItem) => r.id },
      { header: 'State', accessor: (r: JammuSslStatusSiteItem) => r.state || 'Jammu' },
      { header: 'District', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'district') },
      { header: 'Block', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'block') },
      { header: 'Village', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'village') },
      { header: 'Beneficiary Name', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'beneficiary_name') },
      { header: 'Beneficiary Contact', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'contact_no') },
      { header: 'Latitude', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'latitude') },
      { header: 'Longitude', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'longitude') },
      { header: 'IMEI No.', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'imei_no') },
      { header: 'Sim No.', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'sim_no') },
      { header: 'Battery No.', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'battery_serial_no') },
      { header: 'Panel No.', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'module_no') },
      {
        header: 'Verify Status',
        accessor: (r: JammuSslStatusSiteItem) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending'),
      },
      {
        header: 'Installation Status',
        accessor: (r: JammuSslStatusSiteItem) => (Number(r.inst_status) === 1 ? 'Installed' : 'Pending'),
      },
      { header: 'Remark', accessor: (r: JammuSslStatusSiteItem) => txt(r, 'remark') || txt(r, 'inst_remark') },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SSL Status Details"
        subtitle={`Audit list of street lights under category: ${statusLabel}${currentDistrict ? ` in District: ${currentDistrict}` : ''}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Dashboard', href: '/v/jammu/installation/ssl/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/installation/ssl/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              ← Back to Dashboard
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="SSL Status Detail Sites">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{statusLabel}</span>
              <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11, fontWeight: 700 }}>
                {totalCount} Total
              </span>
              {currentDistrict && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                  District: {currentDistrict}
                </span>
              )}
            </h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filtered.length}</span> sites matching current status filter
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher */}
              <select
                id="ssl_status_view_filter"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter status category"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* District Switcher */}
              <select
                id="ssl_district_view_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentDistrict || 'all'}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter district"
              >
                <option value="all">All Districts</option>
                {distinctDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search district, IMEI, village…"
                size="sm"
                ariaLabel="Search sites"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        r.id,
                        r.state || 'Jammu',
                        txt(r, 'district'),
                        txt(r, 'block'),
                        txt(r, 'village'),
                        txt(r, 'beneficiary_name'),
                        txt(r, 'contact_no'),
                        txt(r, 'latitude'),
                        txt(r, 'longitude'),
                        txt(r, 'imei_no'),
                        txt(r, 'sim_no'),
                        txt(r, 'battery_serial_no'),
                        txt(r, 'module_no'),
                        Number(r.inst_verify_status) === 1 ? 'Approved' : 'Pending',
                        Number(r.inst_status) === 1 ? 'Installed' : 'Pending',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Light ID,State,District,Block,Village,Beneficiary Name,Contact No,Latitude,Longitude,IMEI No,Sim No,Battery No,Panel No,Verify Status,Installation Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.state || 'Jammu'}","${txt(r, 'district')}","${txt(r, 'block')}","${txt(r, 'village')}","${txt(r, 'beneficiary_name')}","${txt(r, 'contact_no')}","${txt(r, 'latitude')}","${txt(r, 'longitude')}","${txt(r, 'imei_no')}","${txt(r, 'sim_no')}","${txt(r, 'battery_serial_no')}","${txt(r, 'module_no')}","${Number(r.inst_verify_status) === 1 ? 'Approved' : 'Pending'}","${Number(r.inst_status) === 1 ? 'Installed' : 'Pending'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SSL_Status_${currentStatus}.csv`;
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Light ID,State,District,Block,Village,Beneficiary Name,Contact No,Latitude,Longitude,IMEI No,Sim No,Battery No,Panel No,Verify Status,Installation Status',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.id}","${r.state || 'Jammu'}","${txt(r, 'district')}","${txt(r, 'block')}","${txt(r, 'village')}","${txt(r, 'beneficiary_name')}","${txt(r, 'contact_no')}","${txt(r, 'latitude')}","${txt(r, 'longitude')}","${txt(r, 'imei_no')}","${txt(r, 'sim_no')}","${txt(r, 'battery_serial_no')}","${txt(r, 'module_no')}","${Number(r.inst_verify_status) === 1 ? 'Approved' : 'Pending'}","${Number(r.inst_status) === 1 ? 'Installed' : 'Pending'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SSL_Status_${currentStatus}.xls`;
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Light ID</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Village</th>
                <th className="ax-table__th" scope="col">Beneficiary Name</th>
                <th className="ax-table__th" scope="col">Contact No.</th>
                <th className="ax-table__th" scope="col">Latitude</th>
                <th className="ax-table__th" scope="col">Longitude</th>
                <th className="ax-table__th" scope="col">IMEI No.</th>
                <th className="ax-table__th" scope="col">Sim No.</th>
                <th className="ax-table__th" scope="col">Battery No.</th>
                <th className="ax-table__th" scope="col">Panel No.</th>
                <th className="ax-table__th" scope="col">Light Image</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col">Installation Status</th>
                <th className="ax-table__th" scope="col">Remark</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={19} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading status sites from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={19} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found for this status"
                      message="No street lights match the selected status category or search query."
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const lat = txt(row, 'latitude');
                  const lng = txt(row, 'longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const imgUrl = row.light_file || (row as any).light_image;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2563eb' }}>
                        #{row.id}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">{txt(row, 'block') || DASH}</td>
                      <td className="ax-table__td">{txt(row, 'village') || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row, 'beneficiary_name') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'contact_no') || DASH}</td>

                      {/* Coordinates */}
                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                            title="Open in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={monoCell}>{txt(row, 'imei_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'sim_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'battery_serial_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'module_no') || DASH}</td>

                      {/* Light Image */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={imgUrl}
                          alt={`Light #${row.id}`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <VerifyBadge value={row.inst_verify_status} />
                      </td>

                      {/* Installation Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstBadge status={row.inst_status} />
                      </td>

                      {/* Remark */}
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {txt(row, 'remark') || txt(row, 'inst_remark') || DASH}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => setDetailItem(row)}
                          title="View light details"
                        >
                          View
                        </button>
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
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Lightbox Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Light Detail Modal ── */}
      {detailItem && (
        <Modal open onClose={() => setDetailItem(null)} labelledBy="light-detail-modal-title" dialogClass="ax-modal__dialog--md">
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="light-detail-modal-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Street Light Details</span>
              <span className="ax-badge ax-badge--soft ax-badge--accent">#{detailItem.id}</span>
            </h2>
            <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>
          <div className="ax-modal__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 16px', fontSize: 13, marginBottom: 14 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Light ID</span>
                <b>#{detailItem.id}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State / District</span>
                <b>{detailItem.state || 'Jammu'} / {txt(detailItem, 'district') || DASH}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Block / Village</span>
                <b>{txt(detailItem, 'block') || DASH} / {txt(detailItem, 'village') || DASH}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Beneficiary</span>
                <b>{txt(detailItem, 'beneficiary_name') || DASH} ({txt(detailItem, 'contact_no') || DASH})</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>IMEI Number</span>
                <span style={monoCell}>{txt(detailItem, 'imei_no') || DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>SIM Number</span>
                <span style={monoCell}>{txt(detailItem, 'sim_no') || DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Battery Number</span>
                <span style={monoCell}>{txt(detailItem, 'battery_serial_no') || DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Panel Number</span>
                <span style={monoCell}>{txt(detailItem, 'module_no') || DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Coordinates</span>
                <span>{txt(detailItem, 'latitude')}, {txt(detailItem, 'longitude')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Verify Status</span>
                <VerifyBadge value={detailItem.inst_verify_status} />
              </div>
            </div>

            {/* Light Photo */}
            {(detailItem.light_file || (detailItem as any).light_image) && (
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Installation Photograph
                </span>
                <img
                  src={resolveJammuSslMediaUrl(detailItem.light_file || (detailItem as any).light_image)}
                  alt={`Light #${detailItem.id}`}
                  style={{ width: '100%', maxHeight: 240, objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>
          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailItem(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SSLStatusView;
