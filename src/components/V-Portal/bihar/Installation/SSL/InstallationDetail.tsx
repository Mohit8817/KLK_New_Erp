import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSslInstallationService,
  getMediaUrl,
  type InstalledLightsSummary,
  type InstalledLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const vStatusOf = (r: InstalledLightItem) => Number(r.inst_verify_status ?? r.verify_status ?? 0);
const cStatusOf = (r: InstalledLightItem) => Number(r.inst_claim_status ?? r.claim_status ?? 0);
const pStatusOf = (r: InstalledLightItem) => Number(r.inst_pay_status ?? r.payment_status ?? 0);
const lightImageOf = (r: InstalledLightItem) => getMediaUrl(r.light_image || r.light_file) || '';

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
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
    <Modal open onClose={onClose} labelledBy="ssl-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ssl-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
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

/* ───────── Image thumbnail (NO BORDER RADIUS) ───────── */
function LightThumbnail({ url, alt, onPreview }: { url: string; alt: string; onPreview: (url: string, title: string) => void }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!url || failed) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: 34,
        height: 34,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Overlay CSS (modals) ───────── */
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

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive page CSS (Exact Bihar reference) ───────── */
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

/* ───────── Tabs (URL hash: #Completed / #Payment) ───────── */
type TabKey = 'Completed' | 'Payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'Completed', label: 'Lights Completed', hash: '#Completed' },
  { key: 'Payment', label: 'Payment Lights', hash: '#Payment' },
];

/* ───────── Column config ───────── */
interface Col {
  header: string;
  text: (r: InstalledLightItem) => string;
  render?: (r: InstalledLightItem, ctx: { preview: (url: string, title: string) => void }) => ReactNode;
  strong?: boolean;
  mono?: boolean;
  wrap?: boolean;
}

const commonCols: Col[] = [
  { header: 'UID', text: (r) => r.unique_id || r.uid || `#${r.id}`, strong: true },
  { header: 'State', text: (r) => r.state || 'Bihar' },
  { header: 'Phase', text: (r) => String(r.phase ?? '') },
  { header: 'District', text: (r) => r.district || '', strong: true },
  { header: 'Block', text: (r) => r.block || '' },
  { header: 'Panchayat', text: (r) => r.panchayat || r.panchyat || '' },
  { header: 'Ward No.', text: (r) => String(r.ward_no ?? '') },
  { header: 'Pole No.', text: (r) => String(r.pole_no ?? '') },
  { header: 'Beneficiary Name', text: (r) => r.beneficiary_name || '', strong: true },
  { header: 'Beneficiary Contact', text: (r) => r.contact_no || '', mono: true },
  { header: 'Latitude', text: (r) => String(r.latitude ?? '') },
  { header: 'Longitude', text: (r) => String(r.longitude ?? '') },
];

const tailCols: Col[] = [
  { header: 'Battery No.', text: (r) => r.battery_no || r.battery_serial_no || '', mono: true },
  { header: 'Panel No.', text: (r) => r.panel_no || r.module_no || '', mono: true },
  {
    header: 'Light Image',
    text: (r) => lightImageOf(r),
    render: (r, { preview }) => (
      <LightThumbnail url={lightImageOf(r)} alt={`${r.unique_id || r.uid || `#${r.id}`} - Light Photo`} onPreview={preview} />
    ),
  },
  { header: 'Remark', text: (r) => r.remark || r.inst_remark || '', wrap: true },
];

const paymentStatusCol: Col = {
  header: 'Payment Status',
  text: (r) => (pStatusOf(r) === 1 ? 'Paid' : 'Pending'),
  render: (r) => (pStatusOf(r) === 1 ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Pending</Badge>),
};

const COMPLETED_COLS: Col[] = [
  ...commonCols,
  { header: 'Light No.', text: (r) => r.light_no || '', mono: true },
  { header: 'UUID No.', text: (r) => r.uuid_no || '', mono: true },
  ...tailCols,
  {
    header: 'Verify Status',
    text: (r) => (vStatusOf(r) === 1 ? 'Approved' : vStatusOf(r) === 2 ? 'Rejected' : 'Pending'),
    render: (r) => {
      const v = vStatusOf(r);
      return v === 1 ? <Badge tone="success">Approved</Badge> : v === 2 ? <Badge tone="danger">Rejected</Badge> : <Badge tone="warning">Pending</Badge>;
    },
  },
  {
    header: 'Claim Status',
    text: (r) => (cStatusOf(r) === 1 ? 'Raised' : 'Not Raised'),
    render: (r) => (cStatusOf(r) === 1 ? <Badge tone="info">Raised</Badge> : <Badge tone="neutral">Not Raised</Badge>),
  },
  paymentStatusCol,
];

const PAYMENT_COLS: Col[] = [
  ...commonCols,
  { header: 'IMEI No.', text: (r) => r.imei_no || '', mono: true },
  { header: 'Sim No.', text: (r) => r.sim_no || '', mono: true },
  ...tailCols,
  paymentStatusCol,
];

/* =========================================================================
 * Main Component
 * ========================================================================= */
export function Bihar_Installation_SSL_InstallationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'Payment' : 'Completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };
  const isCompleted = tab === 'Completed';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InstalledLightsSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<InstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<InstalledLightItem[]>([]);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState(() => searchParams.get('district') || 'all');
  const [verifyFilter, setVerifyFilter] = useState(() => searchParams.get('verify') || searchParams.get('status') || 'all');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstalledLights();
      if (res) {
        setSummary(res.install_detail || null);
        setCompleteLights(Array.isArray(res.complete_lights) ? res.complete_lights : []);
        setPaymentLights(Array.isArray(res.payment_lights) ? res.payment_lights : []);
      }
    } catch (err: any) {
      console.error('[InstallationDetail] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = isCompleted ? completeLights : paymentLights;

  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return currentList.filter((r) => {
      if (q) {
        const fields = [
          r.unique_id, r.uid, r.beneficiary_name, r.contact_no, r.district, r.block,
          r.panchayat, r.panchyat, r.uuid_no, r.light_no, r.battery_no, r.panel_no,
        ];
        if (!fields.some((f) => f && String(f).toLowerCase().includes(q))) return false;
      }
      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (isCompleted && verifyFilter !== 'all' && String(vStatusOf(r)) !== verifyFilter) return false;
      return true;
    });
  }, [currentList, deferredQuery, districtFilter, verifyFilter, isCompleted]);

  // Universal Pagination with 100 items by default
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, districtFilter, verifyFilter, tab, setPage]);

  const hasFilters = searchQuery.trim() !== '' || districtFilter !== 'all' || (isCompleted && verifyFilter !== 'all');
  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    setPage(1);
  };

  /* ───────── Export ───────── */
  const cols = isCompleted ? COMPLETED_COLS : PAYMENT_COLS;

  const exportCols: ExportColumn<InstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: InstalledLightItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      ...cols.map((c) => ({ header: c.header, accessor: (r: InstalledLightItem) => c.text(r) })),
    ],
    [cols]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'Bihar_SSL_Completed_Lights' : 'Bihar_SSL_Payment_Lights';
  const fileTitle = isCompleted ? 'Bihar SSL Completed Lights' : 'Bihar SSL Payment Lights';

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

  const TOTAL_COLUMNS = 1 + cols.length + (isCompleted ? 1 : 0);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Installation Details"
        subtitle="View installed lights and payment status for Bihar Solar Street Light sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
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

      {/* ── Tabs ABOVE Table (per requirement) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installed lights tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = t.key === 'Completed' ? completeLights.length : paymentLights.length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`ssl-tab-${t.key}`}
                aria-selected={active}
                aria-controls="ssl-tabpanel"
                className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => setTab(t.key)}
              >
                <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Table Card (exact reference design) ── */}
      <section className="ax-card ax-col--12" id="ssl-tabpanel" role="tabpanel" aria-labelledby={`ssl-tab-${tab}`}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{currentList.length}</span> lights
              {summary && isCompleted && (
                <>
                  {' '}· Completed <b className="ax-num">{num(summary.complete)}</b> / {num(summary.total)} · Approved <b className="ax-num">{num(summary.verify_approved)}</b> · Verify pending <b className="ax-num">{num(summary.verify_pending)}</b> · Claims raised <b className="ax-num">{num(summary.claim_raised)}</b> / {num(summary.claim_applicable)}
                </>
              )}
              {summary && !isCompleted && (
                <>
                  {' '}· Payment complete <b className="ax-num">{num(summary.payment_complete)}</b> · Pending <b className="ax-num">{num(summary.payment_pending)}</b>
                </>
              )}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="ssl_district_filter"
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

              {isCompleted && (
                <select
                  id="ssl_verify_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by verification"
                >
                  <option value="all">All Verification</option>
                  <option value="1">Approved</option>
                  <option value="0">Pending</option>
                  <option value="2">Rejected</option>
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
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search UID, contact, pole…"
                size="sm"
                ariaLabel="Search installed lights"
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
            style={{ whiteSpace: 'nowrap', minWidth: isCompleted ? 2600 : 2200 }}
          >
            <caption className="ax-visually-hidden">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                {cols.map((c) => (
                  <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                ))}
                {isCompleted && <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed lights from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed lights found' : 'No payment lights found'}
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : isCompleted
                          ? 'Lights will appear here once installation is completed.'
                          : 'Lights will appear here once they reach the payment stage.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, idx) => (
                  <tr key={r.id || idx} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                    {cols.map((c) => {
                      const content = c.render ? c.render(r, { preview: openPreview }) : c.text(r) || DASH;
                      return (
                        <td
                          key={c.header}
                          className="ax-table__td"
                          title={c.wrap ? c.text(r) : undefined}
                          style={{
                            ...(c.strong ? { fontWeight: 600, color: 'var(--ax-text-strong)' } : null),
                            ...(c.mono ? { fontFamily: 'var(--ax-font-mono)', fontSize: 12 } : null),
                            ...(c.wrap ? { maxWidth: 200, whiteSpace: 'normal', fontSize: 12 } : null),
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                    {isCompleted && (
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Edit installed light details"
                          onClick={() => navigate(`/v/ssl/update-ssl-site-deatils?id=${r.id}&edit=true`)}
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
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

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;
