import { useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

interface NormalizedAssignedSite {
  id: number;
  vendor: string;
  state: string;
  district: string;
  block: string;
  village: string;
  assign_date: string;
  deadline_date: string;
  site_count: number;
  file: string;
  remarks: string;
  status: number;
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

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

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const parseVillages = (v: unknown): string => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s;
    }
  }
  return '';
};

const fmtState = (s?: string | null): string => {
  const clean = (s || '').trim();
  if (!clean) return 'Uttar Pradesh';
  if (clean.toLowerCase() === 'up') return 'UP';
  return clean;
};

const normalizeRecord = (r: any): NormalizedAssignedSite => ({
  id: Number(r.id) || 0,
  vendor: r.vendor ? String(r.vendor) : '',
  state: fmtState(r.state),
  district: r.district ? String(r.district) : '',
  block: r.block ? String(r.block) : '',
  village: parseVillages(r.village ?? r.panchayat),
  assign_date: r.assign_date ?? r.start_date ?? r.sdate ?? '',
  deadline_date: r.deadline_date ?? r.end_date ?? r.ldate ?? '',
  site_count: Number(r.site_count ?? r.sitecount) || 0,
  file: r.file ?? r.uid_file ?? r.image ?? r.photo ?? r.site_image ?? '',
  remarks: r.remarks ?? r.remark ?? '',
  status: Number(r.status) || 0,
});

const fmtDate = (d?: string | null) => {
  if (!d) return DASH;
  const datePart = String(d).trim().split(/[ T]/)[0];
  const [y, m, day] = datePart.split('-');
  return y && m && day ? `${day}-${m}-${y}` : datePart;
};

const isImage = (url?: string | null) =>
  Boolean(url && /\.(jpe?g|png|webp|gif|svg|bmp|tiff|avif)(\?.*)?$/i.test(String(url).trim()));

const getImageForLight = (item: any): string | null => {
  if (!item) return null;
  const candidates = [
    item.file,
    item.image,
    item.photo,
    item.site_image,
    item.uid_file,
    item.assigned_file,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && isImage(c)) {
      return c.trim();
    }
  }
  return null;
};

const getFileExt = (url?: string | null) => {
  if (!url) return 'FILE';
  const clean = url.split('?')[0];
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  return ext ? ext.toUpperCase() : 'FILE';
};

const resolveFileUrl = (file?: string | null) => {
  if (!file) return '';
  if (/^https?:\/\//i.test(file)) return file;
  return resolveUpMediaUrl(file) || '';
};

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function ImagePlaceholder({
  size = 36,
  label = 'No photo uploaded',
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="ax-img-placeholder"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '1px dashed var(--ax-border, #cbd5e1)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ax-text-muted, #94a3b8)',
        flexShrink: 0,
        cursor: 'default',
        userSelect: 'none',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 0.18s ease',
      }}
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.max(14, Math.round(size * 0.48))}
        height={Math.max(14, Math.round(size * 0.48))}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: 0.7 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
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
        style={{ maxWidth: 840, width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title || 'Image Preview'}</h3>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div
          className="ax-modal__body"
          style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            overflow: 'auto',
            minHeight: 360,
          }}
        >
          <img
            src={url}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '65vh',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
              borderRadius: 6,
            }}
          />
        </div>
        <div
          className="ax-modal__footer"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {ZOOM_STEPS.map((z, idx) => (
              <button
                key={z}
                type="button"
                className={`ax-btn ax-btn--sm ${zoomIdx === idx ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => setZoomIdx(idx)}
              >
                {z}x
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Open original ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getUpMediaCandidates(src), [src]);
  const [candIdx, setCandIdx] = useState(0);

  useEffect(() => {
    setCandIdx(0);
  }, [src]);

  if (!src || candidates.length === 0 || candIdx >= candidates.length) {
    return <ImagePlaceholder size={size} label={`No image — ${alt}`} />;
  }

  const currentUrl = candidates[candIdx];

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
          e.currentTarget.style.borderColor = 'var(--ax-primary-default, #2563eb)';
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

/* ───────── Responsive page CSS (matching Bihar Assigned Lights design) ───────── */
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

/* ───────── Modal ───────── */

function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
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
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--sm">
        {children}
      </div>
    </div>,
    document.body
  );
}

export function UP_Installation_SSL_AssignedLights() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<NormalizedAssignedSite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NormalizedAssignedSite | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Interactive Lightbox Modal
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => {
    setLightbox({ url, title });
  }, []);

  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getSsl18wAssignSites();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRecords(data.map(normalizeRecord));
    } catch (err: any) {
      console.error('[UP SSL AssignedLights] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned lights.' });
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
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.village && r.village.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter: 1 = Pending, 2 = Accepted
      if (statusFilter === 'pending' && r.status === 2) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;

      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let totalSites = 0;
    let pendingCount = 0;
    let acceptedCount = 0;

    records.forEach((r) => {
      totalSites += Number(r.site_count) || 0;
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
    });

    return { totalBatches, totalSites, pendingCount, acceptedCount };
  }, [records]);

  // Universal Pagination with 100 items by default
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, districtFilter, setPage]);

  const hasFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Export Columns
  const exportCols: ExportColumn<NormalizedAssignedSite>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendor || '' },
      { header: 'State', accessor: (r) => r.state || 'Uttar Pradesh' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date) },
      { header: 'Deadline', accessor: (r) => fmtDate(r.deadline_date) },
      { header: 'Site Count', accessor: (r) => String(r.site_count || 0) },
      { header: 'Remarks', accessor: (r) => r.remarks || '' },
      {
        header: 'Status',
        accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Acceptance'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'UP_SSL_18W_Assigned_Lights';
  const fileTitle = 'UP SSL 18W Assigned Lights Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out: string[][] = [
      columns.map((c) => escapeExportValue(c.header)),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Trigger Accept
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await upInstallationService.acceptSsl18wInstallation(selectedItem.id);
      if (res && res.status === false) {
        setToastMsg({ type: 'danger', text: res.message || 'Failed to accept light assignment.' });
      } else {
        setToastMsg({ type: 'success', text: res?.message || 'Light assignment accepted successfully!' });
        setAcceptModalOpen(false);
        setSelectedItem(null);
        await loadData();
      }
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to accept light assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const HEADERS = [
    'Sr. No.',
    'Vendor',
    'State',
    'District',
    'Block',
    'Village',
    'Assign Date',
    'Deadline',
    'Site Count',
    'File',
    'Remarks',
    'Status',
    'Action',
  ];
  const TOTAL_COLUMNS = HEADERS.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Lights"
        subtitle="Manage and accept 18W Solar Street Light installation site allocations in Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W', href: '/v/up/ssl-18w-installation-dashboard' },
          { label: 'Assigned Lights' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh list"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Batches"
          value={num(metrics.totalBatches)}
          sub="Assigned work orders"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Total Allocated Sites"
          value={num(metrics.totalSites)}
          sub="Cumulative light points"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Acceptance"
          value={num(metrics.pendingCount)}
          sub="Requires vendor action"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Batches"
          value={num(metrics.acceptedCount)}
          sub="Ready for installation"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* ── Status Tabs ABOVE Table ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Assigned lights status tabs" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">All ({metrics.totalBatches})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'pending'}
            className={`ax-btn ax-btn--sm ${statusFilter === 'pending' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('pending');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">Pending ({metrics.pendingCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'accepted'}
            className={`ax-btn ax-btn--sm ${statusFilter === 'accepted' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => {
              setStatusFilter('accepted');
              setPage(1);
            }}
          >
            <span className="ax-btn__label">Accepted ({metrics.acceptedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="up-ssl-assigned-tabpanel" role="tabpanel" aria-label="Assigned Lights">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Lights Records</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> batches
              {' '}· Total Allocated Sites <b className="ax-num">{num(metrics.totalSites)}</b> · Pending <b className="ax-num">{num(metrics.pendingCount)}</b> · Accepted <b className="ax-num">{num(metrics.acceptedCount)}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="up_assigned_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
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
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, block…"
                size="sm"
                ariaLabel="Search assigned lights"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: 1200 }}
          >
            <caption className="ax-visually-hidden">Assigned 18W SSL Lights Data</caption>
            <thead className="ax-table__head">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action' || h === 'Status' || h === 'File'
                        ? { textAlign: 'center' }
                        : h === 'Site Count'
                        ? { textAlign: 'right' }
                        : h === 'Village'
                        ? { maxWidth: 240, width: 240 }
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned lights from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned lights found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'No 18W SSL lights currently assigned.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, index) => {
                  const isAccepted = r.status === 2;
                  const imageSrc = getImageForLight(r);
                  const isImg = Boolean(imageSrc || (r.file && isImage(r.file)));
                  const fileUrl = resolveFileUrl(imageSrc || r.file);
                  const fileExt = getFileExt(r.file);

                  return (
                    <tr key={r.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{r.vendor || DASH}</span>
                      </td>
                      <td className="ax-table__td">{r.state || 'Uttar Pradesh'}</td>
                      <td className="ax-table__td"><b>{r.district || DASH}</b></td>
                      <td className="ax-table__td">{r.block || DASH}</td>
                      <td
                        className="ax-table__td"
                        style={{
                          maxWidth: 240,
                          width: 240,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                        title={r.village || ''}
                      >
                        <div
                          style={{
                            maxWidth: 240,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: 12,
                            lineHeight: 1.4,
                          }}
                        >
                          {r.village || DASH}
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{fmtDate(r.assign_date)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{fmtDate(r.deadline_date)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {num(r.site_count)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isImg ? (
                          <InstallationThumbnail
                            src={imageSrc || r.file}
                            alt={`${r.vendor || 'Light'} File Photo`}
                            onPreview={openPreview}
                            size={36}
                          />
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--asw-primary)' }}
                            title="View / Download File"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1={12} y1={18} x2={12} y2={12} />
                              <line x1={9} y1={15} x2={12} y2={18} />
                              <line x1={15} y1={15} x2={12} y2={18} />
                            </svg>
                            <span>{fileExt}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }} title={r.remarks || ''}>
                        {r.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Badge tone={isAccepted ? 'success' : 'warning'}>
                          {isAccepted ? 'Accepted' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isAccepted ? (
                          <Badge tone="success">Done</Badge>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => {
                              setSelectedItem(r);
                              setAcceptModalOpen(true);
                            }}
                          >
                            Accept
                          </button>
                        )}
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
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Accept Confirmation Modal ── */}
      <Modal open={acceptModalOpen && !!selectedItem} onClose={() => !submitting && setAcceptModalOpen(false)} labelledBy="up-assigned-accept-title">
        {selectedItem && (
          <div>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="up-assigned-accept-title">Accept Light Assignment</h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => !submitting && setAcceptModalOpen(false)}
                disabled={submitting}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
                Are you sure you want to accept this assigned 18W solar street light batch for installation?
              </p>

              <div
                style={{
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1px solid var(--ax-border, #e2e8f0)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Vendor:</strong> {selectedItem.vendor || DASH}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>District:</strong> {selectedItem.district || DASH}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Block:</strong> {selectedItem.block || DASH}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Village:</strong> {selectedItem.village || DASH}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Period:</strong>{' '}
                  {fmtDate(selectedItem.assign_date)} — {fmtDate(selectedItem.deadline_date)}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Site Count:</strong>{' '}
                  <span style={{ color: 'var(--asw-primary)', fontWeight: 700 }}>{num(selectedItem.site_count)}</span>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setAcceptModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={handleConfirmAccept}
                disabled={submitting}
              >
                {submitting ? 'Accepting…' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Interactive Image Preview Lightbox ── */}
      {lightbox && (
        <ImagePreviewModal
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default UP_Installation_SSL_AssignedLights;
