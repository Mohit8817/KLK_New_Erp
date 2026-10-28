import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSrtInstallationService,
  getSrtInstallationImageCandidates,
  type SrtViewInstallSummary,
  type SrtInstalledSiteItem,
} from '../../bihar-services/biharSrtInstallationService';
import {
  Pagination,
  usePagination,
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

const txt = (row: SrtInstalledSiteItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const claimRaised = (row: SrtInstalledSiteItem): boolean =>
  Number((row as Record<string, any>).inst_claim_status ?? (row as Record<string, any>).claim_status ?? 0) === 1;

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
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
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal ───────── */
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
    <Modal open onClose={onClose} labelledBy="srt-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="srt-preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS) ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 34,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getSrtInstallationImageCandidates(src), [src]);
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
      title="Click to preview"
    />
  );
}

/* ───────── Overlay CSS (modals; global because they render in <body>) ───────── */
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

  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-full { grid-column: 1 / -1; }
  .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }

  @media (max-width: 560px) {
    .ula-m-grid { grid-template-columns: 1fr; }
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive page CSS (same as ULA view) ───────── */
const PAGE_CSS = `
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── Tabs (one page, two datasets; URL hash: #Completed / #Payment) ───────── */
type TabKey = 'completed' | 'payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'completed', label: 'Completed SRT Data', hash: '#Completed' },
  { key: 'payment', label: 'Payment SRT Data', hash: '#Payment' },
];

// Columns shared by both tabs, in the requested order
const COMMON_HEADERS = [
  'Sr. No.', 'State', 'District', 'Site Name', 'Contact Person', 'Contact Number', 'CA No.',
  'Solar Meter No.', 'Inverter No.', 'Net/Smart Meter No.', 'Loger No.',
  'System Image', 'Inverter Image', 'Panel Image', 'Net Meter/Smart Meter Image', 'Loger Image',
  'Latitude', 'Longitude', 'Remark',
];

export function Bihar_Installation_SRT_ViewInstallation() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'payment' : 'completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };

  const [searchParams] = useSearchParams();
  const [data, setData] = useState<SrtViewInstallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('district') || searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [hiddenByTab, setHiddenByTab] = useState<Record<TabKey, string[]>>({ completed: [], payment: [] });

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSrtInstallationService.getViewInstalledSites();
      setData(res);
    } catch (err: any) {
      console.error('[SRT ViewInstallation] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Two datasets from the same API response
  const completeSites: SrtInstalledSiteItem[] = useMemo(
    () => (Array.isArray(data?.completesite) ? data!.completesite : []),
    [data]
  );
  const paymentSites: SrtInstalledSiteItem[] = useMemo(
    () => (Array.isArray(data?.paymentsite) ? data!.paymentsite : []),
    [data]
  );
  const activeSites = tab === 'completed' ? completeSites : paymentSites;
  const isCompleted = tab === 'completed';

  // Filtered (verify-status filter applies to the Completed tab only)
  const filteredSites = useMemo(() => {
    let list = activeSites;
    if (isCompleted) {
      if (statusFilter === 'approved') list = list.filter((s) => s.inst_verify_status === 1);
      else if (statusFilter === 'rejected') list = list.filter((s) => s.inst_verify_status === 2);
      else if (statusFilter === 'pending') list = list.filter((s) => !s.inst_verify_status || s.inst_verify_status === 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        String(s.id).includes(q) ||
        txt(s, 'state').toLowerCase().includes(q) ||
        txt(s, 'district').toLowerCase().includes(q) ||
        String(s.site_name || '').toLowerCase().includes(q) ||
        String(s.contact_person || '').toLowerCase().includes(q) ||
        String(s.contact_number || '').toLowerCase().includes(q) ||
        String(s.ca_no || '').toLowerCase().includes(q) ||
        String(s.solarmeter_no || '').toLowerCase().includes(q) ||
        String(s.inverter_no || '').toLowerCase().includes(q) ||
        String(s.nm_sm_no || '').toLowerCase().includes(q) ||
        String(s.loger_no || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeSites, isCompleted, search, statusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, tab]);

  const hasFilters = search.trim() !== '' || (isCompleted && statusFilter !== 'all');
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Summary counts (API totals, fall back to list)
  const approvedCount = data?.approvedsite ?? completeSites.filter((s) => s.inst_verify_status === 1).length;
  const pendingCount = data?.verifypending ?? completeSites.filter((s) => !s.inst_verify_status || s.inst_verify_status === 0).length;
  const rejectedCount = data?.rejectsite ?? completeSites.filter((s) => s.inst_verify_status === 2).length;
  const paymentCount = paymentSites.length;

  // Export Columns (per tab)
  const exportCols: ExportColumn<SrtInstalledSiteItem>[] = useMemo(() => {
    const common: ExportColumn<SrtInstalledSiteItem>[] = [
      { header: 'Sr. No.', accessor: (_r: SrtInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r) => txt(r, 'state') || 'Bihar' },
      { header: 'District', accessor: (r) => txt(r, 'district') },
      { header: 'Site Name', accessor: (r) => r.site_name || '' },
      { header: 'Contact Person', accessor: (r) => r.contact_person || '' },
      { header: 'Contact Number', accessor: (r) => r.contact_number || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || '' },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || '' },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || '' },
      { header: 'Loger No.', accessor: (r) => r.loger_no || '' },
      { header: 'System Image', accessor: (r) => r.system_image || '' },
      { header: 'Inverter Image', accessor: (r) => r.inverter_image || '' },
      { header: 'Panel Image', accessor: (r) => r.panel_image || '' },
      { header: 'Net Meter/Smart Meter Image', accessor: (r) => r.nm_sm_image || '' },
      { header: 'Loger Image', accessor: (r) => r.loger_image || '' },
      { header: 'Latitude', accessor: (r) => txt(r, 'inst_latitude') },
      { header: 'Longitude', accessor: (r) => txt(r, 'inst_longitude') },
      { header: 'Remark', accessor: (r) => r.inst_remarks || '' },
    ];
    if (tab === 'payment') return common;
    return [
      ...common,
      {
        header: 'Verify Status',
        accessor: (r) =>
          r.inst_verify_status === 1 ? 'Approved' : r.inst_verify_status === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Claim Status', accessor: (r) => (claimRaised(r) ? 'Raised' : 'Not Raised') },
    ];
  }, [tab]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'Bihar_SRT_Completed' : 'Bihar_SRT_Payment';
  const fileTitle = isCompleted ? 'Bihar SRT Completed Data' : 'Bihar SRT Payment Data';

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
    const out = [
      columns.map((c) => c.header),
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
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
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

  const hiddenColumns = hiddenByTab[tab];
  const activeCols = exportCols.filter((c, i) => !hiddenColumns.includes(`${c.header}-${i}`));

  const headers = isCompleted ? [...COMMON_HEADERS, 'Verify Status', 'Claim Status', 'Action'] : COMMON_HEADERS;
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Bihar SRT Installation"
        subtitle="Master register of completed solar rooftop installations, payment sites, verification evidence, and compliance documents"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/srt/installationsite" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
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

      <div className="ax-dash-grid">
        {/* ── Tabs: Completed SRT Data / Payment SRT Data ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="SRT data" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              const count = t.key === 'completed' ? completeSites.length : paymentCount;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`srt-tab-${t.key}`}
                  aria-selected={active}
                  aria-controls="srt-tabpanel"
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => setTab(t.key)}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" id="srt-tabpanel" role="tabpanel" aria-labelledby={`srt-tab-${tab}`}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{isCompleted ? 'Completed SRT Data' : 'Payment SRT Data'}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{activeSites.length}</span> installations
                {isCompleted && (
                  <>
                    {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
                  </>
                )}
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {isCompleted && (
                  <select
                    id="srt_status_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by verify status"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                )}

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
                  onChange={setSearch}
                  placeholder="Search site, CA no, person, meter…"
                  size="sm"
                  ariaLabel="Search installed sites"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredSites, activeCols)}
                  onExportCSV={() => exportToCSV(filteredSites, activeCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredSites, activeCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredSites, activeCols, fileTitle)}

                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: isCompleted ? 2900 : 2500 }}
            >
              <caption className="ax-visually-hidden">{isCompleted ? 'Completed SRT Data' : 'Payment SRT Data'}</caption>
              <thead className="ax-table__head">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="ax-table__th"
                      scope="col"
                      style={h === 'Action' ? { textAlign: 'center' } : undefined}
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
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={isCompleted ? 'No completed installation records found' : 'No payment records found'}
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : isCompleted
                            ? 'Completed sites will appear here once installation work is recorded.'
                            : 'Payment sites will appear here once payments are processed.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, index) => {
                    const lat = txt(row, 'inst_latitude');
                    const lng = txt(row, 'inst_longitude');
                    const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                    const siteLabel = row.site_name || 'Site';

                    return (
                      <tr key={row.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td">{txt(row, 'state') || 'Bihar'}</td>
                        <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                        <td className="ax-table__td">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name || DASH}</span>
                        </td>
                        <td className="ax-table__td">{row.contact_person || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.contact_number || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.ca_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.solarmeter_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.inverter_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.nm_sm_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.loger_no || DASH}</td>

                        <td className="ax-table__td">
                          <InstallationThumbnail src={row.system_image} alt={`${siteLabel} - Complete System`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={row.inverter_image} alt={`${siteLabel} - Inverter Photo`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={row.panel_image} alt={`${siteLabel} - Panel Photo`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={row.nm_sm_image} alt={`${siteLabel} - Net/Smart Meter Photo`} onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={row.loger_image} alt={`${siteLabel} - Loger Photo`} onPreview={openPreview} />
                        </td>

                        <td className="ax-table__td">
                          {hasGeo ? (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
                              title="Open in Google Maps"
                            >
                              {lat}
                            </a>
                          ) : (
                            lat || DASH
                          )}
                        </td>
                        <td className="ax-table__td">{lng || DASH}</td>

                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                          {row.inst_remarks || DASH}
                        </td>

                        {isCompleted && (
                          <>
                            <td className="ax-table__td">
                              <VerifyBadge value={Number(row.inst_verify_status)} />
                            </td>
                            <td className="ax-table__td">
                              {claimRaised(row) ? <Badge tone="success">Raised</Badge> : <Badge tone="neutral">Not Raised</Badge>}
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              {Number(row.inst_verify_status) === 1 ? (
                                <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                              ) : (
                                <Link
                                  to={`/v/srt/installationsite?id=${row.id}`}
                                  state={{ site: row, mode: 'edit' }}
                                  className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                  title="Edit Installation Details"
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>Edit</span>
                                </Link>
                              )}
                            </td>
                          </>
                        )}
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
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export default Bihar_Installation_SRT_ViewInstallation;