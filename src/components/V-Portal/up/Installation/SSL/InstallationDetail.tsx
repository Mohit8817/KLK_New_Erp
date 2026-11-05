import { useState, useMemo, useEffect, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wInstalledLightItem,
  type UpSsl18wInstallDetailsCount,
  type UpSsl18wLightDetail,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

type Row = UpSsl18wInstalledLightItem;
type TabFilter = 'completed' | 'payment';
type VerifyStatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ── Status helpers ── */
const isVerified = (r: Row) => Number(r.verify_status) === 1;
const isVerifyRejected = (r: Row) => Number(r.verify_status) === 2;
const isLocked = (r: Row) => isVerified(r);

/* ───────── Responsive page CSS (Exact Arunachal / Solar ERP Reference) ───────── */
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

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-4, 16px);
  }
  @media (max-width: 1200px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 500px) {
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

  /* Modal & Lightbox Styles */
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
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 16px 20px;
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
  .ax-modal__body {
    padding: 0; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: #0f172a;
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: 'var(--ax-viz-cyan, #0891b2)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: 'var(--ax-viz-emerald, #16a34a)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: 'var(--ax-viz-amber, #d97706)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: 'var(--ax-viz-violet, #7c3aed)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 15, height: 15 }}>{children}</svg>
);

interface KpiPart {
  label: string;
  value: number | string;
  onClick?: () => void;
}

function KpiCard({
  icon,
  tone,
  label,
  parts,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  parts: KpiPart[];
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card"
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
            {icon}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ax-text-muted, #64748b)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={label}
          >
            {label}
          </span>
        </div>

        <div
          style={{
            fontSize: parts.length > 2 ? '1.25rem' : '1.4rem',
            fontWeight: 800,
            color: t.fg,
            fontFamily: 'var(--ax-font-display, inherit)',
            whiteSpace: 'nowrap',
            lineHeight: 1.15,
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'nowrap',
          }}
        >
          {parts.map((p, idx) => (
            <span key={p.label || idx} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
              {idx > 0 && (
                <span
                  style={{
                    color: 'var(--ax-text-muted, #94a3b8)',
                    fontWeight: 500,
                    margin: '0 4px',
                    fontSize: '0.9em',
                  }}
                >
                  /
                </span>
              )}
              {p.onClick ? (
                <button
                  type="button"
                  onClick={p.onClick}
                  title={`Click to filter by ${p.label}: ${p.value}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    borderBottom: '1.5px dotted transparent',
                    transition: 'border-color 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = t.fg;
                    e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = 'transparent';
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
                </button>
              ) : (
                <span title={`${p.label}: ${p.value}`}>
                  {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--ax-text-muted, #64748b)',
          marginTop: 6,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={sub}
      >
        {sub}
      </div>
    </div>
  );
}

/* ── X icon ── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ── Image Preview Modal with zoom ── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="up-ssl-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="up-ssl-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Installation Photograph'}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && (
              <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>
            )}
            {status === 'error' && (
              <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>
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
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          </div>
        </div>

        <div className="ax-modal__footer">
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Installation Thumbnail ── */
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
  const resolvedUrl = useMemo(() => (src ? resolveUpMediaUrl(src) : ''), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed || !resolvedUrl) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(resolvedUrl, alt)}
      title="Click to preview photograph"
    />
  );
}

/* ── Filter Tabs ── */
const FILTER_TABS: { key: TabFilter; label: string }[] = [
  { key: 'completed', label: 'Lights Completed' },
  { key: 'payment', label: 'Payment Lights' },
];

/* ── Table Export Columns ── */
const EXPORT_COLS: ExportColumn<Row>[] = [
  { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
  { header: 'UID', accessor: (r) => r.uid || DASH },
  { header: 'Installation Date', accessor: (r) => r.installation_date || r.inst_date || DASH },
  { header: 'State', accessor: (r) => r.state || 'UP' },
  { header: 'Phase', accessor: (r) => r.phase || DASH },
  { header: 'District', accessor: (r) => r.district || DASH },
  { header: 'Block', accessor: (r) => r.block || DASH },
  { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
  { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
  { header: 'Pole No.', accessor: (r) => r.pole_no || DASH },
  { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
  { header: 'Contact', accessor: (r) => r.beneficiary_contact || DASH },
  { header: 'Latitude', accessor: (r) => r.latitude || DASH },
  { header: 'Longitude', accessor: (r) => r.longitude || DASH },
  { header: 'Light No.', accessor: (r) => r.light_no || DASH },
  { header: 'UUID No.', accessor: (r) => r.uuid_no || DASH },
  { header: 'Battery No.', accessor: (r) => r.battery_serial_no || DASH },
  { header: 'Panel No.', accessor: (r) => r.panel_no || DASH },
  { header: 'Remark', accessor: (r) => r.remark || r.inst_remarks || DASH },
  {
    header: 'Verify Status',
    accessor: (r) => (Number(r.verify_status) === 1 ? 'Approved' : Number(r.verify_status) === 2 ? 'Rejected' : 'Pending'),
  },
  {
    header: 'Claim Status',
    accessor: (r) => (Number(r.claim_status || r.inst_claim_status) === 2 ? 'Approved' : Number(r.claim_status || r.inst_claim_status) === 3 ? 'Rejected' : Number(r.claim_status || r.inst_claim_status) === 1 ? 'Raised' : 'Not Raised'),
  },
  {
    header: 'Payment Status',
    accessor: (r) => (Number(r.payment_status || r.inst_pay_status) === 1 ? 'Paid' : 'Pending'),
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function UP_Installation_SSL_InstallationDetail() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('completed');

  // KPI counts
  const [counts, setCounts] = useState<UpSsl18wInstallDetailsCount>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_submit: 0,
    claim_not_applicable: 0,
    claim_verify_approved: 0,
    claim_verify_pending: 0,
    claim_verify_reject: 0,
    payment_complete: 0,
    payment_pending: 0,
  });

  const [completedSites, setCompletedSites] = useState<Row[]>([]);
  const [paymentSites, setPaymentSites] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerifyStatusFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // View Detail modal
  const [detailModalItem, setDetailModalItem] = useState<Row | null>(null);

  // Edit Modal
  const [editLightModal, setEditLightModal] = useState<UpSsl18wLightDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(editDialogRef, !!editLightModal);

  // Edit form state
  const [editWard, setEditWard] = useState('');
  const [editPole, setEditPole] = useState('');
  const [editBenName, setEditBenName] = useState('');
  const [editBenContact, setEditBenContact] = useState('');
  const [editUuid, setEditUuid] = useState('');
  const [editBattery, setEditBattery] = useState('');
  const [editPanel, setEditPanel] = useState('');
  const [editLightNo, setEditLightNo] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getSsl18wInstalledLights();
      setCounts(res.install_details);
      setCompletedSites(res.completed_sites || []);
      setPaymentSites(res.payment_sites || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Active items based on tab
  const activeItems = activeTab === 'completed' ? completedSites : paymentSites;

  // Unique districts
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [activeItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (statusFilter === 'approved' && !isVerified(item)) return false;
      if (statusFilter === 'rejected' && !isVerifyRejected(item)) return false;
      if (statusFilter === 'pending' && (isVerified(item) || isVerifyRejected(item))) return false;
      if (selectedDistrict !== 'all' && item.district?.trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (q) {
        const hay = [
          item.uid, item.id, item.beneficiary_name, item.beneficiary_contact, item.district,
          item.block, item.panchayat, item.ward_no, item.pole_no, item.light_no,
          item.uuid_no, item.panel_no, item.battery_serial_no,
        ];
        if (!hay.some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [activeItems, search, statusFilter, selectedDistrict]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const hasFilters = !!search || statusFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = async (id: number) => {
    setEditLoading(true);
    setEditLightModal(null);
    try {
      const details = await upInstallationService.getSsl18wInstalledLightForEdit(id);
      if (details) {
        setEditLightModal(details);
        setEditWard(details.ward_no || '');
        setEditPole(details.pole_no || '');
        setEditBenName(details.beneficiary_name || '');
        setEditBenContact(details.beneficiary_contact || '');
        setEditUuid(details.uuid_no || '');
        setEditBattery(details.battery_serial_no || '');
        setEditPanel(details.panel_no || '');
        setEditLightNo(details.light_no || '');
        setEditLat(String(details.latitude || ''));
        setEditLng(String(details.longitude || ''));
        setEditRemark(details.inst_remarks || details.remark || '');
        setEditFile(null);
      } else {
        alert('Could not fetch light details for editing.');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to load edit details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editLightModal) return;

    setEditSubmitting(true);
    const fd = new FormData();
    fd.append('ssl_id', String(editLightModal.id));
    fd.append('uuid_no', editUuid);
    fd.append('light_no', editLightNo);
    fd.append('panel_no', editPanel);
    fd.append('battery_serial_no', editBattery);
    fd.append('latitude', editLat);
    fd.append('longitude', editLng);
    fd.append('beneficiary_name', editBenName);
    fd.append('beneficiary_contact', editBenContact);
    if (editWard) fd.append('ward_no', editWard);
    if (editPole) fd.append('pole_no', editPole);
    if (editRemark) fd.append('remark', editRemark);
    if (editFile) fd.append('light_file', editFile);

    try {
      const res = await upInstallationService.updateSsl18wInstallation(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Installation details updated successfully!' });
        setEditLightModal(null);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Update failed.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while saving changes.' });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Escape key for edit modal
  useEffect(() => {
    if (!editLightModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditLightModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editLightModal]);

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filteredItems, EXPORT_COLS);
  const handleCsv = () => exportDataToCSV('UP_SSL_18W_Installations', filteredItems, EXPORT_COLS);
  const handleExcel = () => exportDataToExcel('UP_SSL_18W_Installations', filteredItems, EXPORT_COLS);
  const handlePdf = () => printTableData('UP SSL 18W Installation Report', filteredItems, EXPORT_COLS);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="UP SSL 18W Installation Detail"
        subtitle="View installed solar street lights, verification reports, and payment status breakdown"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Install Light</span>
            </Link>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{toast.message}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── KPI Row (5 Cards) ── */}
      {loading ? (
        <div style={{ marginBottom: 16 }}>
          <KpiSkeleton count={5} />
        </div>
      ) : (
        <div className="asw-cards-row">
          <KpiCard
            tone="accent"
            label="Lights"
            parts={[
              {
                label: 'Total',
                value: counts.total ?? 0,
                onClick: () => {
                  setActiveTab('completed');
                  setStatusFilter('all');
                  setSelectedDistrict('all');
                  setSearch('');
                  setCurrentPage(1);
                },
              },
              {
                label: 'Installed',
                value: counts.complete ?? 0,
                onClick: () => {
                  setActiveTab('completed');
                  setStatusFilter('all');
                  setSelectedDistrict('all');
                  setSearch('');
                  setCurrentPage(1);
                },
              },
              {
                label: 'Pending',
                value: counts.pending ?? 0,
              },
            ]}
            sub="Total / Installed / Pending"
            icon={svgIcon(
              <>
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                <circle cx="12" cy="12" r="4" />
              </>
            )}
          />

          <KpiCard
            tone="emerald"
            label="Verification Status"
            parts={[
              {
                label: 'Approved',
                value: counts.verify_approved ?? 0,
                onClick: () => {
                  setActiveTab('completed');
                  setStatusFilter('approved');
                  setCurrentPage(1);
                },
              },
              {
                label: 'Pending',
                value: counts.verify_pending ?? 0,
                onClick: () => {
                  setActiveTab('completed');
                  setStatusFilter('pending');
                  setCurrentPage(1);
                },
              },
              {
                label: 'Rejected',
                value: counts.verify_reject ?? 0,
                onClick: () => {
                  setActiveTab('completed');
                  setStatusFilter('rejected');
                  setCurrentPage(1);
                },
              },
            ]}
            sub="Approved / Pending / Rejected"
            icon={svgIcon(
              <>
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />

          <KpiCard
            tone="cyan"
            label="Claim Status"
            parts={[
              {
                label: 'Applicable',
                value: counts.claim_applicable ?? 0,
              },
              {
                label: 'Submit',
                value: counts.claim_submit ?? counts.claim_raised ?? 0,
              },
              {
                label: 'Not Applicable',
                value: counts.claim_not_applicable ?? 0,
              },
            ]}
            sub="Applicable / Submit / Not Applicable"
            icon={svgIcon(
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </>
            )}
          />

          <KpiCard
            tone="amber"
            label="Claim Verify Status"
            parts={[
              {
                label: 'Approved',
                value: counts.claim_verify_approved ?? 0,
              },
              {
                label: 'Pending',
                value: counts.claim_verify_pending ?? 0,
              },
              {
                label: 'Rejected',
                value: counts.claim_verify_reject ?? 0,
              },
            ]}
            sub="Approved / Pending / Rejected"
            icon={svgIcon(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />

          <KpiCard
            tone="violet"
            label="Payment Status"
            parts={[
              {
                label: 'Complete',
                value: counts.payment_complete ?? 0,
                onClick: () => {
                  setActiveTab('payment');
                  setCurrentPage(1);
                },
              },
              {
                label: 'Pending',
                value: counts.payment_pending ?? 0,
                onClick: () => {
                  setActiveTab('payment');
                  setCurrentPage(1);
                },
              },
            ]}
            sub="Complete / Pending"
            icon={svgIcon(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            )}
          />
        </div>
      )}

      <div className="ax-dash-grid">

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installation filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === activeTab;
              const count = t.key === 'completed' ? completedSites.length : paymentSites.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setCurrentPage(1);
                    setSearch('');
                    setStatusFilter('all');
                    setSelectedDistrict('all');
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP SSL 18W Installation Details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Report Wise Bifurcation</span>
              <h2 className="ax-card__title">
                {activeTab === 'completed' ? 'Completed SSL Installations' : 'Payment Ready Installations'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredItems.length}</span> of <span className="ax-num">{activeItems.length}</span> installations
                {' '}· Total <b className="ax-num">{counts.total}</b> · Verified <b className="ax-num">{counts.verify_approved}</b> · Paid <b className="ax-num">{counts.payment_complete}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as VerifyStatusFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search UID, name, contact…"
                  size="sm"
                  ariaLabel="Search installations"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">UP SSL 18W Installation Details</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">UID</th>
                  <th className="ax-table__th" scope="col">Installation Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Ward No.</th>
                  <th className="ax-table__th" scope="col">Pole No.</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Contact</th>
                  <th className="ax-table__th" scope="col">UUID No.</th>
                  <th className="ax-table__th" scope="col">Light No.</th>
                  <th className="ax-table__th" scope="col">Battery No.</th>
                  {activeTab === 'payment' && <th className="ax-table__th" scope="col">Panel No.</th>}
                  <th className="ax-table__th" scope="col">Light Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  {activeTab === 'payment' && <th className="ax-table__th" scope="col">Claim Status</th>}
                  <th className="ax-table__th" scope="col">Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={24} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading UP SSL 18W installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={24} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No installations match your filters. Try clearing filters or search term.'
                            : 'No SSL 18W installations recorded yet.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagedItems.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const locked = isLocked(item);
                    const isRejected = isVerifyRejected(item);
                    const claimStatus = Number(item.claim_status || item.inst_claim_status);
                    const isClaimApproved = claimStatus === 2;
                    const isClaimRaised = claimStatus === 1;
                    const isClaimRejected = claimStatus === 3;
                    const isPaid = Number(item.payment_status || item.inst_pay_status) === 1;

                    return (
                      <tr key={item.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                          {item.uid || `UP-SSL-${item.id}`}
                        </td>
                        <td className="ax-table__td">{txt(item.installation_date || item.inst_date)}</td>
                        <td className="ax-table__td">{txt(item.state ? item.state.toUpperCase() : 'UP')}</td>
                        <td className="ax-table__td">{txt(item.phase)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>
                        <td className="ax-table__td">{txt(item.block)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(item.panchayat)}
                        </td>
                        <td className="ax-table__td">{txt(item.ward_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.pole_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {txt(item.beneficiary_name)}
                        </td>
                        <td className="ax-table__td">{txt(item.beneficiary_contact)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.uuid_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.light_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.battery_serial_no)}</td>
                        {activeTab === 'payment' && (
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.panel_no)}</td>
                        )}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={item.light_file}
                            alt={`Light photo for ${item.uid || item.id}`}
                            onPreview={openPreview}
                          />
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.latitude)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.longitude)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(item.remark || item.inst_remarks)}
                        </td>

                        {/* Verify Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              locked
                                ? 'ax-badge--success'
                                : isRejected
                                ? 'ax-badge--danger'
                                : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {locked ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>

                        {/* Claim Status Badge (payment tab only) */}
                        {activeTab === 'payment' && (
                          <td className="ax-table__td">
                            <span
                              className={`ax-badge ax-badge--soft ax-badge--pill ${
                                isClaimApproved
                                  ? 'ax-badge--success'
                                  : isClaimRejected
                                  ? 'ax-badge--danger'
                                  : isClaimRaised
                                  ? 'ax-badge--info'
                                  : 'ax-badge--neutral'
                              }`}
                            >
                              <span className="ax-badge__dot" />
                              {isClaimApproved ? 'Approved' : isClaimRejected ? 'Rejected' : isClaimRaised ? 'Raised' : 'Not Raised'}
                            </span>
                          </td>
                        )}

                        {/* Payment Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>

                        {/* Action: View + Edit/Locked */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => setDetailModalItem(item)}
                              title="View installation details"
                              style={{ padding: '0 8px' }}
                            >
                              View
                            </button>
                            {locked ? (
                              <span
                                className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11.5, cursor: 'not-allowed' }}
                                title="Light verified & approved — edit locked"
                              >
                                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="10" rx="2" />
                                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                                Locked
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => handleOpenEdit(item.id)}
                                disabled={editLoading}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer & Left-aligned Pagination ── */}
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredItems.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Lightbox Photo Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── View Light Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ssl-view-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 640 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="ssl-view-detail-title" style={{ fontSize: 15, fontWeight: 600 }}>
                Installation Detail: {detailModalItem.uid || `UP-SSL-${detailModalItem.id}`}
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
            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>UID:</span> <b>{detailModalItem.uid || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Installation Date:</span> <b>{detailModalItem.installation_date || detailModalItem.inst_date || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{detailModalItem.state ? detailModalItem.state.toUpperCase() : 'UP'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Phase:</span> <b>{detailModalItem.phase || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{detailModalItem.district || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Block:</span> <b>{detailModalItem.block || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Panchayat:</span> <b>{detailModalItem.panchayat || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Ward No:</span> <b>{detailModalItem.ward_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Pole No:</span> <b>{detailModalItem.pole_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary:</span> <b>{detailModalItem.beneficiary_name || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact:</span> <b>{detailModalItem.beneficiary_contact || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>UUID:</span> <b>{detailModalItem.uuid_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Light No:</span> <b>{detailModalItem.light_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Panel No:</span> <b>{detailModalItem.panel_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Battery No:</span> <b>{detailModalItem.battery_serial_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{detailModalItem.latitude || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{detailModalItem.longitude || '—'}</b></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remark:</span> <b>{detailModalItem.remark || detailModalItem.inst_remarks || '—'}</b></div>
              </div>

              {detailModalItem.light_file && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>
                    Installation Photograph:
                  </span>
                  <img
                    src={resolveUpMediaUrl(detailModalItem.light_file)}
                    alt="Installation evidence"
                    style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                    onClick={() => openPreview(resolveUpMediaUrl(detailModalItem.light_file), 'Installation Photograph')}
                  />
                </div>
              )}
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              {!isLocked(detailModalItem) && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    const id = detailModalItem.id;
                    setDetailModalItem(null);
                    handleOpenEdit(id);
                  }}
                >
                  Edit Light
                </button>
              )}
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailModalItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Light Modal ── */}
      {editLightModal &&
        createPortal(
          <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ssl-edit-light-title">
            <div className="ax-modal__backdrop" onClick={() => setEditLightModal(null)} />
            <div ref={editDialogRef} className="ax-modal__dialog" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="ax-modal__header">
                <h2 className="ax-modal__title" id="ssl-edit-light-title" style={{ fontSize: 15, fontWeight: 600 }}>
                  Edit Installed Light ({editLightModal.uid})
                </h2>
                <button type="button" className="ax-modal__close" onClick={() => setEditLightModal(null)} aria-label="Close dialog">
                  {X_ICON}
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="ax-modal__body" style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Ward No.</label>
                      <input type="text" className="ax-input" value={editWard} onChange={(e) => setEditWard(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Pole No.</label>
                      <input type="text" className="ax-input" value={editPole} onChange={(e) => setEditPole(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Beneficiary Name *</label>
                      <input type="text" required className="ax-input" value={editBenName} onChange={(e) => setEditBenName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Contact Number *</label>
                      <input type="tel" required className="ax-input" value={editBenContact} onChange={(e) => setEditBenContact(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>UUID No. *</label>
                      <input type="text" required className="ax-input" value={editUuid} onChange={(e) => setEditUuid(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Light No. *</label>
                      <input type="text" required className="ax-input" value={editLightNo} onChange={(e) => setEditLightNo(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Panel No. *</label>
                      <input type="text" required className="ax-input" value={editPanel} onChange={(e) => setEditPanel(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Battery No. *</label>
                      <input type="text" required className="ax-input" value={editBattery} onChange={(e) => setEditBattery(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Latitude *</label>
                      <input type="text" required className="ax-input" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Longitude *</label>
                      <input type="text" required className="ax-input" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Change Photo (Optional)</label>
                      <input type="file" accept="image/*,.pdf" className="ax-input" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Remarks</label>
                      <textarea rows={2} className="ax-textarea" value={editRemark} onChange={(e) => setEditRemark(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditLightModal(null)} disabled={editSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={editSubmitting}>
                    {editSubmitting ? 'Saving Changes…' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_SSL_InstallationDetail;