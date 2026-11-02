import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSslService,
  getJammuSslMediaCandidates,
  type JammuSslCompletedSiteItem,
  type JammuSslCompleteSiteData,
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

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

const ClaimBadge = ({ status, raw }: { status?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const s = Number(status ?? 0);
  if (s === 2 || r === '2' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (s === 3 || r === '3' || r === 'rejected') return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || r === '1' || r === 'raised') return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ status, raw }: { status?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const s = Number(status ?? 0);
  if (s === 1 || r === '1' || r === 'done' || r === 'paid') return <Badge tone="success">Disbursed</Badge>;
  return <Badge tone="warning">Pending</Badge>;
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

/* ───────── Image Preview Modal (Lightbox Zoom) ───────── */
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
    <Modal open onClose={onClose} labelledBy="jammu-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="jammu-preview-title">{title || 'Media Preview'}</h2>
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
  size = 34,
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
      title="Click to preview light photo"
    />
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
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

  .ax-modern-field { display: flex; flex-direction: column; gap: 6px; }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req { color: #ef4444; font-weight: 700; margin-left: 3px; }
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

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-4, 16px);
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

// Exactly matching user's requested columns
const SSL_DETAIL_HEADERS = [
  'Sr. No.',
  'Beneficiary Name',
  'Contact Number',
  'Site ID',
  'Ward No',
  'Pole No',
  'IMEI No.',
  'Battery No.',
  'Panel No',
  'Sim No.',
  'Light',
  'Status',
  'Action',
];

export function SSLInstallationDetails() {
  const [tab, setTab] = useState<'completed' | 'payment'>('completed');
  const [summaryData, setSummaryData] = useState<JammuSslCompleteSiteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Lightbox Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // View Details Modal State
  const [detailModalItem, setDetailModalItem] = useState<JammuSslCompletedSiteItem | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Edit Modal State (API 7 & API 8)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    ward_no: '',
    pole_no: '',
    beneficiary_name: '',
    contact_no: '',
    imei_no: '',
    battery_serial_no: '',
    module_no: '',
    sim_no: '',
    latitude: '',
    longitude: '',
    remark: '',
  });
  const [editLightFile, setEditLightFile] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load live data from API 6: GET jammu/ssl/installation/view-complete-site
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSslService.getViewCompleteSites();
      setSummaryData({
        ...data,
        completesite: data?.completesite || [],
        paymentsite: data?.paymentsite || [],
      });
    } catch (err: any) {
      console.error('[Jammu SSL InstallationDetails] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active records based on tab
  const currentRecords = useMemo(() => {
    if (!summaryData) return [];
    return tab === 'completed' ? (summaryData.completesite || []) : (summaryData.paymentsite || []);
  }, [summaryData, tab]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const list = currentRecords.map((r) => r.district).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [currentRecords]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = currentRecords;

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district?.toLowerCase() === districtFilter.toLowerCase());
    }

    if (statusFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'approved');
    } else if (statusFilter === 'rejected') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'rejected');
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'pending');
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        return (
          String(s.id).includes(q) ||
          txt(s, 'district').toLowerCase().includes(q) ||
          txt(s, 'block').toLowerCase().includes(q) ||
          txt(s, 'village').toLowerCase().includes(q) ||
          txt(s, 'beneficiary_name').toLowerCase().includes(q) ||
          txt(s, 'contact_no').toLowerCase().includes(q) ||
          txt(s, 'imei_no').toLowerCase().includes(q) ||
          txt(s, 'sim_no').toLowerCase().includes(q) ||
          txt(s, 'battery_serial_no').toLowerCase().includes(q) ||
          txt(s, 'battery_no').toLowerCase().includes(q) ||
          txt(s, 'module_no').toLowerCase().includes(q) ||
          txt(s, 'panel_no').toLowerCase().includes(q) ||
          txt(s, 'latitude').toLowerCase().includes(q) ||
          txt(s, 'longitude').toLowerCase().includes(q) ||
          txt(s, 'remark').toLowerCase().includes(q) ||
          txt(s, 'inst_remark').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [currentRecords, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, tab, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Open Edit Modal (API 7: GET jammu/ssl/installation/update-site?ssl_id={id})
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError(null);
    setEditLightFile(null);
    try {
      const res = await jammuSslService.getUpdateSiteLoad(id);
      const light = res?.jammussl;
      if (light) {
        setEditForm({
          ward_no: light.ward_no ? String(light.ward_no) : '',
          pole_no: light.pole_no ? String(light.pole_no) : '',
          beneficiary_name: light.beneficiary_name || '',
          contact_no: light.contact_no ? String(light.contact_no) : '',
          imei_no: light.imei_no || '',
          battery_serial_no: light.battery_serial_no || (light as any).battery_no || '',
          module_no: light.module_no || (light as any).panel_no || '',
          sim_no: light.sim_no || '',
          latitude: light.latitude || '',
          longitude: light.longitude || '',
          remark: light.remark || light.inst_remark || '',
        });
      } else {
        const target = currentRecords.find((c) => c.id === id);
        setEditForm({
          ward_no: target?.ward_no ? String(target.ward_no) : '',
          pole_no: target?.pole_no ? String(target.pole_no) : '',
          beneficiary_name: target?.beneficiary_name || '',
          contact_no: target?.contact_no ? String(target.contact_no) : '',
          imei_no: target?.imei_no || '',
          battery_serial_no: target?.battery_serial_no || (target as any)?.battery_no || '',
          module_no: target?.module_no || (target as any)?.panel_no || '',
          sim_no: target?.sim_no || '',
          latitude: target?.latitude || '',
          longitude: target?.longitude || '',
          remark: target?.remark || target?.inst_remark || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading edit site data:', err);
      setEditError(err?.message || 'Failed to load site details for editing.');
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit Form (API 8: POST jammu/ssl/installation/update-site-store)
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append('ssl_id', String(editingId));
      fd.append('beneficiary_name', editForm.beneficiary_name.trim());
      fd.append('contact_no', editForm.contact_no.replace(/\D/g, '').trim());
      fd.append('imei_no', editForm.imei_no.trim());
      fd.append('battery_serial_no', editForm.battery_serial_no.trim());
      fd.append('module_no', editForm.module_no.trim());
      fd.append('sim_no', editForm.sim_no.trim());
      fd.append('latitude', editForm.latitude.trim());
      fd.append('longitude', editForm.longitude.trim());
      if (editForm.ward_no.trim()) fd.append('ward_no', editForm.ward_no.trim());
      if (editForm.pole_no.trim()) fd.append('pole_no', editForm.pole_no.trim());
      if (editForm.remark.trim()) fd.append('remark', editForm.remark.trim());
      if (editLightFile) fd.append('light_file', editLightFile);

      const res = await jammuSslService.updateSiteStore(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Details Updated Successfully!!!',
      });
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SSL Edit] submit error:', err);
      setEditError(err?.message || 'Failed to update installation details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuSslCompletedSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuSslCompletedSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'state') || 'Jammu' },
      { header: 'Phase', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'phase') || '1' },
      { header: 'District', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'district') },
      { header: 'Block', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'block') },
      { header: 'Village', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'village') },
      { header: 'Beneficiary Name', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'beneficiary_name') },
      { header: 'Beneficiary Contact', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'contact_no') },
      { header: 'Latitude', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'latitude') },
      { header: 'Longitude', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'longitude') },
      { header: 'IMEI No.', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'imei_no') },
      { header: 'Sim No.', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'sim_no') },
      { header: 'Battery No.', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'battery_serial_no') || txt(r, 'battery_no') },
      { header: 'Panel No.', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'module_no') || txt(r, 'panel_no') },
      { header: 'Light Image', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'light_file') || txt(r, 'light_image') },
      { header: 'Remark', accessor: (r: JammuSslCompletedSiteItem) => txt(r, 'remark') || txt(r, 'inst_remark') },
      {
        header: 'Verify Status',
        accessor: (r: JammuSslCompletedSiteItem) => {
          const v = Number(r.inst_verify_status ?? r.verify_status);
          if (v === 1) return 'Approved';
          if (v === 2) return 'Rejected';
          return 'Pending';
        },
      },
      {
        header: 'Claim Status',
        accessor: (r: JammuSslCompletedSiteItem) => {
          const s = Number(r.inst_claim_status ?? r.claim_status);
          if (s === 2) return 'Approved';
          if (s === 3) return 'Rejected';
          if (s === 1) return 'Raised';
          return 'Not Raised';
        },
      },
      {
        header: 'Payment Status',
        accessor: (r: JammuSslCompletedSiteItem) => (Number(r.inst_pay_status ?? r.payment_status) === 1 ? 'Disbursed' : 'Pending'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_${tab === 'completed' ? 'Completed' : 'Payment'}_Sites`;
  const fileTitle = `Jammu SSL ${tab === 'completed' ? 'Completed' : 'Payment'} Installation Register`;

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

  // Header metric counts directly from API 6 response
  const totalAssignedLights = summaryData?.totalsite ?? 0;
  const totalLights = summaryData?.totalsite ?? 0;
  const vendorComplete = summaryData?.complete ?? 0;
  const vendorPending = summaryData?.pendingsite ?? 0;
  const vendorClaimRequest = summaryData?.claimedapplicable ?? 0;
  const vendorPaymentDone = summaryData?.paymentsitecount ?? summaryData?.paymentsite?.length ?? 0;
  const approvedPayment = summaryData?.approvedsite ?? 0;
  const rejectPayment = summaryData?.rejectsite ?? 0;
  const vendorTotalClaimAmount = useMemo(() => {
    return (summaryData?.paymentsite || []).reduce(
      (sum, s) => sum + (Number(s.payment_amount ?? s.claim_amount) || 0),
      0
    );
  }, [summaryData]);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Jammu SSL Install Site"
        subtitle="Review street light installations, track verification statuses, payment states, and edit site details"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'View Jammu SSL Install Site' },
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
            <Link to="/v/jammu/installation/ssl/install-lights" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
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

      {/* ── Top Metric KPI Cards (Row 1) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Lights"
          value={totalLights.toLocaleString('en-IN')}
          sub="Allocated street light poles"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Vendor Complete"
          value={vendorComplete.toLocaleString('en-IN')}
          sub="Installed in field"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Vendor Pending"
          value={vendorPending.toLocaleString('en-IN')}
          sub="Accepted awaiting installation"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Vendor Claim Request"
          value={vendorClaimRequest.toLocaleString('en-IN')}
          sub="Eligible for payment claim"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Top Metric KPI Cards (Row 2) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="emerald"
          label="Vendor Payment Done"
          value={vendorPaymentDone.toLocaleString('en-IN')}
          sub="Settled & disbursed"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Approved Payment"
          value={approvedPayment.toLocaleString('en-IN')}
          sub="Verified by inspector"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          tone="red"
          label="Reject Payment"
          value={rejectPayment.toLocaleString('en-IN')}
          sub="Inspection rejected"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />

        <KpiCard
          tone="accent"
          label="Vendor Total Claim Amount"
          value={`₹ ${vendorTotalClaimAmount.toLocaleString('en-IN')}`}
          sub="Total disbursement volume"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v12M15 9.5H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9" />
            </svg>
          }
        />
      </div>

      {/* ── Report Wise Bifurcation Tabs ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installation report bifurcation tabs" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'completed'}
            className={`ax-btn ax-btn--sm ${tab === 'completed' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => setTab('completed')}
          >
            <span className="ax-btn__label">
              Lights Completed ({summaryData?.completesite?.length || 0})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'payment'}
            className={`ax-btn ax-btn--sm ${tab === 'payment' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => setTab('payment')}
          >
            <span className="ax-btn__label">
              Payment Lights ({summaryData?.paymentsite?.length || 0})
            </span>
          </button>
        </div>
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="view-ssl-install-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="view-ssl-install-table-title" className="ax-card__title">
                {tab === 'completed' ? 'Lights Completed' : 'Payment Lights'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> installations found
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {distinctDistricts.length > 0 && (
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
                    {distinctDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  id="ssl_status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by verify status"
                >
                  <option value="all">All Verification</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
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
                  value={search}
                  onChange={setSearch}
                  placeholder="Search district, IMEI, SIM, beneficiary…"
                  size="sm"
                  ariaLabel="Search installed street lights"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredSites, exportCols)}
                  onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2400 }}
            >
              <caption className="ax-visually-hidden">Jammu SSL {tab === 'completed' ? 'Completed' : 'Payment'} Data</caption>
              <thead className="ax-table__head">
                <tr>
                  {SSL_DETAIL_HEADERS.map((h) => (
                    <th key={h} className="ax-table__th" scope="col" style={h === 'Action' ? { textAlign: 'center' } : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={SSL_DETAIL_HEADERS.length} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={SSL_DETAIL_HEADERS.length} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : tab === 'completed'
                            ? 'Completed street light sites will appear here once installation details are submitted.'
                            : 'No payment stage sites available.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, index) => {
                    const lat = txt(row, 'latitude');
                    const lng = txt(row, 'longitude');
                    const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                    const imgUrl = row.light_file || row.light_image;
                    const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                    const rawVerify = row.inst_verify_status ?? row.verify_status;
                    const isVerifyApproved = vStatus === 1 || String(rawVerify).toLowerCase() === 'approved' || String(rawVerify).toLowerCase() === '1';
                    const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);
                    const pStatus = Number(row.inst_pay_status ?? row.payment_status ?? 0);

                    return (
                      <tr key={row.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {txt(row, 'beneficiary_name') || DASH}
                        </td>
                        <td className="ax-table__td" style={monoCell}>{txt(row, 'contact_no') || DASH}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                          {row.id}
                        </td>
                        <td className="ax-table__td">{txt(row, 'ward_no') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'pole_no') || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{txt(row, 'imei_no') || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{txt(row, 'battery_serial_no') || txt(row, 'battery_no') || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{txt(row, 'module_no') || txt(row, 'panel_no') || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{txt(row, 'sim_no') || DASH}</td>

                        {/* Light Image Thumbnail */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={imgUrl}
                            alt={`Light #${row.id} - ${txt(row, 'village')}`}
                            onPreview={openPreview}
                          />
                        </td>

                        {/* Status (Verify Status) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <VerifyBadge value={vStatus} raw={rawVerify} />
                        </td>

                        {/* Action: View and Edit */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              onClick={() => setDetailModalItem(row)}
                              title="View full site details"
                              style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: 3 }}>
                                <circle cx="12" cy="12" r="2" />
                                <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
                              </svg>
                              View
                            </button>

                            {isVerifyApproved ? (
                              <span
                                className="ax-badge ax-badge--soft"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--ax-text-muted, #64748b)',
                                  background: 'var(--ax-surface-subtle, #f1f5f9)',
                                  border: '1px solid var(--ax-border, #cbd5e1)',
                                  borderRadius: 6,
                                }}
                                title="Verified & Approved. Locked against modification."
                              >
                                🔒 Locked
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => handleOpenEdit(row.id)}
                                title="Edit installation details"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: 3 }}>
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
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

          {/* ── Table Footer ── */}
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
      </div>

      {/* ── Photo Preview Lightbox Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Site Details Modal (API 7 & API 8) ── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="jammu-ssl-edit-title" dialogClass="ax-modal__dialog--lg">
        <form onSubmit={handleSaveEdit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="jammu-ssl-edit-title">
                Edit Light Installation Details
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Light ID: <b>#{editingId}</b> · Resets verification status to pending upon update
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24 }}>
            {editError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editError}
              </div>
            )}

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading light details for edit…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Beneficiary & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Beneficiary Name</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.beneficiary_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, beneficiary_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Beneficiary Contact</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="tel"
                      className="ax-input"
                      value={editForm.contact_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_no: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Ward Number</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.ward_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, ward_no: e.target.value }))}
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Pole Number</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.pole_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, pole_no: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Equipment Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>IMEI Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.imei_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, imei_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Battery Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.battery_serial_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, battery_serial_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Panel Number (Module No)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.module_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, module_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>SIM Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.sim_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, sim_no: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Coordinates & Remarks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Latitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.latitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Longitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.longitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field" style={{ gridColumn: 'span 2' }}>
                    <label className="ax-modern-label">
                      <span>Remarks</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.remark}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, remark: e.target.value }))}
                      placeholder="Enter update remarks..."
                    />
                  </div>
                </div>

                {/* Optional Replace Light Photo */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Replace Light Image (Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="ax-input"
                    onChange={(e) => setEditLightFile(e.target.files?.[0] || null)}
                  />
                  {editLightFile && (
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                      Selected: {editLightFile.name} ({(editLightFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEdit || editLoading}
            >
              {submittingEdit ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Details Modal ── */}
      {detailModalItem && (
        <Modal
          open={!!detailModalItem}
          onClose={() => setDetailModalItem(null)}
          labelledBy="view-site-details-title"
          dialogClass="ax-modal__dialog--lg"
        >
          <div className="ax-modal__header">
            <div>
              <h3 className="ax-modal__title" id="view-site-details-title" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                SSL Site Information & Installation Details
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Unique Site #{detailModalItem.id} {detailModalItem.village ? `· ${detailModalItem.village}` : ''}
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setDetailModalItem(null)}
              aria-label="Close dialog"
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Section 1: Information */}
            <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 16, borderRadius: 12, border: '1px solid var(--ax-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Site Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Vendor Name</span><b>{txt(detailModalItem, 'vendor_name') || txt(detailModalItem, 'vendor') || 'App Testing'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>State</span><b>{txt(detailModalItem, 'state') || 'Jammu'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>District</span><b>{txt(detailModalItem, 'district') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Block</span><b>{txt(detailModalItem, 'block') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Village</span><b>{txt(detailModalItem, 'village') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Phase</span><b>{txt(detailModalItem, 'phase') || '1'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Address</span><b>{txt(detailModalItem, 'address') || txt(detailModalItem, 'village') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Serial No.</span><b>#{detailModalItem.id}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Supply</span><b>Complete</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Material Inspection</span><b>Verified</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Installation</span><b>Completed</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Date of Installation</span><b>{detailModalItem.created_at ? new Date(detailModalItem.created_at).toLocaleDateString('en-IN') : DASH}</b></div>
              </div>
            </div>

            {/* Section 2: Form Details */}
            <div style={{ background: '#ffffff', padding: 16, borderRadius: 12, border: '1px solid var(--ax-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Installation Form Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Ward Number</span><b>{txt(detailModalItem, 'ward_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Pole Number</span><b>{txt(detailModalItem, 'pole_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Beneficiary Name</span><b>{txt(detailModalItem, 'beneficiary_name') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Beneficiary Contact</span><b style={monoCell}>{txt(detailModalItem, 'contact_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>IMEI Number</span><b style={monoCell}>{txt(detailModalItem, 'imei_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Battery Number</span><b style={monoCell}>{txt(detailModalItem, 'battery_serial_no') || txt(detailModalItem, 'battery_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Panel Number</span><b style={monoCell}>{txt(detailModalItem, 'module_no') || txt(detailModalItem, 'panel_no') || DASH}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>SIM Number</span><b style={monoCell}>{txt(detailModalItem, 'sim_no') || DASH}</b></div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Coordinates</span>
                  {detailModalItem.latitude && detailModalItem.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${detailModalItem.latitude},${detailModalItem.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {detailModalItem.latitude}, {detailModalItem.longitude} ↗
                    </a>
                  ) : (
                    <b>{DASH}</b>
                  )}
                </div>
                <div><span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11 }}>Remarks</span><b>{txt(detailModalItem, 'remark') || txt(detailModalItem, 'inst_remark') || DASH}</b></div>
              </div>

              {/* Light Photo Preview */}
              {(detailModalItem.light_file || detailModalItem.light_image) && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, marginBottom: 6 }}>Light Image</span>
                  <InstallationThumbnail
                    src={detailModalItem.light_file || detailModalItem.light_image}
                    alt={`Light #${detailModalItem.id}`}
                    onPreview={openPreview}
                    size={64}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setDetailModalItem(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => {
                const id = detailModalItem.id;
                setDetailModalItem(null);
                handleOpenEdit(id);
              }}
            >
              Edit Details
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SSLInstallationDetails;
