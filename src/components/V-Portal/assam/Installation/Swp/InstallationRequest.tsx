import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  assamSwpService,
  resolveAssamMediaUrl,
  type AssignedSiteItem,
  type AssignSiteDetailResponse,
  type AssignSiteDetailName,
} from '../../assam-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
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

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
<<<<<<< HEAD
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
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
=======
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: var(--ax-surface-solid, #fff);
    border-radius: var(--ax-radius-lg, 12px); border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); overflow: hidden;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    border: none; background: transparent; cursor: pointer; padding: 4px;
    border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted);
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong); }
  .ax-modal__body { padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 12px 20px; border-top: 1px solid var(--ax-border-subtle, #f1f5f9);
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
    background: var(--ax-surface-subtle, #f8fafc);
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 780,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component (matching Bihar SRT / ULA reference) ── */
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

<<<<<<< HEAD
const parseSiteIds = (val?: any): number[] => {
  if (val === null || val === undefined) return [];
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? [Math.floor(val)] : [];
  }
  if (Array.isArray(val)) {
    const list: number[] = [];
    for (const v of val) {
      if (typeof v === 'object' && v !== null) {
        const id = Number((v as any).id ?? (v as any).site_id);
        if (Number.isFinite(id) && id > 0) list.push(Math.floor(id));
      } else {
        list.push(...parseSiteIds(v));
      }
    }
    return Array.from(new Set(list));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    // Robust extraction: matches integers in '["1018"]', '[1018]', '1018', etc.
    const matches = trimmed.match(/\d+/g);
    if (matches && matches.length > 0) {
      return Array.from(new Set(matches.map(Number).filter((n) => Number.isFinite(n) && n > 0).map(Math.floor)));
=======
const parseSiteIds = (val?: string | number[]): number[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter((n) => !isNaN(n));
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !isNaN(n));
    } catch {
      return val.replace(/[[\]"]/g, '').split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
    }
  }
  return [];
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Helper to extract numeric assignment ID (assigns table id)
const getAssignId = (item?: any): number => {
  if (!item) return 0;
  if (typeof item === 'number') return Number.isFinite(item) && item > 0 ? Math.floor(item) : 0;
  if (typeof item === 'string') {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  const candidate =
    item.assign_id ??
    item.assignment_id ??
    item.assignId ??
    item.assign?.id ??
    item.id;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
};

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

export function InstallationRequest() {
  const navigate = useNavigate();

  const [data, setData] = useState<AssignedSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  // Details Modal search filter
  const [modalSearch, setModalSearch] = useState('');

<<<<<<< HEAD
  // Persisted accepted IDs (handles cases where backend returns 200 OK for site_id but assigns table status lags)
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('assam_swp_accepted_ids');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr.map(Number));
      }
    } catch {}
    return new Set<number>();
  });

  // Dynamic server-based status: driven by API data (1 = Pending, 2 = Accepted) or confirmed acceptance
  const isSiteAccepted = useCallback((item: AssignedSiteItem) => {
    const aId = getAssignId(item) || item.id;
=======
  // Dynamic server-based status: strictly driven by API data (1 = Pending, 2 = Accepted)
  // Backend spec: Effect: assigns.status = 2 set hota hai aur us assign ki sabhi sites me assam_swps.inst_accept = 1 ho jata hai.
  const isSiteAccepted = useCallback((item: AssignedSiteItem) => {
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
    return (
      Number(item.status) === 2 ||
      String(item.status) === '2' ||
      Number((item as any).inst_accept) === 1 ||
      String((item as any).inst_accept) === '1' ||
<<<<<<< HEAD
      String(item.status).toLowerCase() === 'accepted' ||
      acceptedIds.has(Number(item.id)) ||
      (aId > 0 && acceptedIds.has(Number(aId)))
    );
  }, [acceptedIds]);
=======
      String(item.status).toLowerCase() === 'accepted'
    );
  }, []);
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476

  // Detail Modal state (API 2)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AssignSiteDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<AssignedSiteItem | null>(null);

  // Filtered names inside the details modal based on modalSearch
  const filteredModalNames = useMemo(() => {
    const list = detailData?.Names || [];
    const q = modalSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s: AssignSiteDetailName) => {
      const fn = (s.farmer_name || '').toLowerCase();
      const fath = (s.father_name || '').toLowerCase();
      const st = (s.state || detailData?.state || activeItem?.state || '').toLowerCase();
      const dist = (s.district || detailData?.district || activeItem?.district || '').toLowerCase();
      const blk = (s.block || s.tehsil || '').toLowerCase();
      const vil = (s.village || '').toLowerCase();
      return fn.includes(q) || fath.includes(q) || st.includes(q) || dist.includes(q) || blk.includes(q) || vil.includes(q);
    });
  }, [detailData, activeItem, modalSearch]);

  // Accept Action state (API 3)
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptSuccessMsg, setAcceptSuccessMsg] = useState<string | null>(null);
  const [acceptErrorMsg, setAcceptErrorMsg] = useState<string | null>(null);

  // Load Data (API 1)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await assamSwpService.getAssignedInstallationSites();
      setData(list);
    } catch (err: any) {
      console.error('Failed to load assigned installation sites:', err);
      setError(err?.message || 'Failed to load assigned installation sites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle View Details (API 2)
  const handleViewDetail = async (item: AssignedSiteItem) => {
    setActiveItem(item);
    setModalSearch('');
    setDetailModalOpen(true);
    setDetailError(null);

    const assignId = getAssignId(item);

    // If item already has Names from list response, pre-populate instantly
    if (item.Names && item.Names.length > 0) {
      setDetailData({
        id: assignId || item.id,
        site_id: item.site_id,
        status: item.status,
        Names: item.Names,
        state: item.state,
        district: item.district,
        assign_date: item.assign_date || item.created_at,
        deadline_date: item.deadline_date,
      });
      setDetailLoading(false);
    } else {
      setDetailData(null);
      setDetailLoading(true);
    }

    try {
      const res = await assamSwpService.getAssignSiteDetail(assignId || item.id);
      const detailPayload = (res as any)?.data || res;
      if (detailPayload && (detailPayload.Names || detailPayload.id)) {
        setDetailData(detailPayload);
      }
    } catch (err: any) {
      if (!item.Names || item.Names.length === 0) {
        setDetailError(err?.message || 'Failed to load assignment site details');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Accept (API 3). Returns true on success so callers (e.g. the modal) can react.
  // Backend spec:
  // GET /assam/swp-assign-installation-accept?id=12
  // Request: id (integer): required (assign ka id; backend validation: exists:assigns,id)
  // Effect: assigns.status = 2 set hota hai aur us assign ki sabhi sites me assam_swps.inst_accept = 1 ho jata hai.
  const handleAccept = async (
    item: AssignedSiteItem,
    extraDetail?: AssignSiteDetailResponse | null
  ): Promise<boolean> => {
    const assignId = getAssignId(item) || getAssignId(extraDetail) || (activeItem ? getAssignId(activeItem) : 0);

    // Collect candidate site IDs (assam_swps.id)
<<<<<<< HEAD
    let siteIds = Array.from(
=======
    const siteIds = Array.from(
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
      new Set([
        ...parseSiteIds(item?.site_id),
        ...parseSiteIds(extraDetail?.site_id),
        ...parseSiteIds(activeItem?.site_id),
        ...((item?.Names || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
        ...((extraDetail?.Names || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
      ])
    );

<<<<<<< HEAD
    // If siteIds is empty and we have an assignId, prefetch details to discover site ID
    if (siteIds.length === 0 && assignId > 0) {
      try {
        const fetched = await assamSwpService.getAssignSiteDetail(assignId);
        const payload = (fetched as any)?.data || fetched;
        if (payload) {
          const fetchedSites = Array.from(
            new Set([
              ...parseSiteIds(payload.site_id),
              ...((payload.Names || []).map((n: any) => Number(n?.id)).filter((n: number) => Number.isFinite(n) && n > 0)),
            ])
          );
          if (fetchedSites.length > 0) {
            siteIds = fetchedSites;
          }
        }
      } catch {
        // prefetch silent
      }
    }

    if (!assignId && siteIds.length === 0) {
      setAcceptErrorMsg('Could not determine a valid assignment or site id for this row.');
=======
    if (!assignId && siteIds.length === 0) {
      setAcceptErrorMsg('Could not determine a valid assignment or site id for this row. A valid assign id is required.');
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
      setTimeout(() => setAcceptErrorMsg(null), 6000);
      return false;
    }

<<<<<<< HEAD
    const confirmMsg =
      siteIds.length > 0
        ? `Are you sure you want to accept SWP Installation Assignment #${assignId || siteIds[0]} (Site #${siteIds.join(', ')})?`
        : `Are you sure you want to accept SWP Installation Assignment #${assignId}?`;

    if (!window.confirm(confirmMsg)) {
      return false;
    }

    const rowKeyId = item?.id ?? assignId ?? siteIds[0];
=======
    const displayId = assignId || siteIds[0];
    if (!window.confirm(`Are you sure you want to accept SWP Installation Assignment #${displayId}?`)) {
      return false;
    }

    const rowKeyId = item?.id ?? displayId;
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
    setAcceptingId(rowKeyId);
    setAcceptErrorMsg(null);
    setAcceptSuccessMsg(null);

    try {
      let res: ApiResponse | null = null;
<<<<<<< HEAD
      let usedId = siteIds[0] || assignId;
      let accepted = false;

      // NOTE: The live Assam SWP backend currently validates: 'id' => 'required|exists:assam_swps,id'
      // (The API docs state: "id (integer): required (assign ka id; fix ke baad exists:assigns,id honi chahiye)")
      // Therefore, passing the SITE ID (e.g. 1018) succeeds (200 OK), whereas passing assignId (8222) fails with 422!

      // 1. Prioritize Site IDs first (matches current live server validation: exists:assam_swps,id)
      if (siteIds.length > 0) {
        for (const sId of siteIds) {
          try {
            res = await assamSwpService.acceptInstallation(sId, assignId);
            usedId = sId;
            accepted = true;
            break; // Calling accept on a site marks the entire assignment as accepted (status = 2) in backend
          } catch (siteErr: any) {
            console.warn(`[Accept Installation] Site ID #${sId} failed:`, siteErr);
          }
        }
      }

      // 2. If site ID didn't succeed (or no site ID found), fallback to assignId
      if (!accepted && assignId > 0) {
        try {
          res = await assamSwpService.acceptInstallation(assignId);
          usedId = assignId;
          accepted = true;
        } catch (assignErr: any) {
          console.warn(`[Accept Installation] Assign ID #${assignId} failed:`, assignErr);
          throw assignErr;
        }
      }

      if (!accepted) {
        throw new Error('Failed to accept installation assignment with available IDs.');
=======
      let usedId = assignId;

      // 1. Try with assignId first (official backend spec: exists:assigns,id)
      if (assignId > 0) {
        try {
          res = await assamSwpService.acceptInstallation(assignId);
        } catch (err: any) {
          const errMsg = String(err?.message || '');
          // If server failed with Laravel validation "The selected id is invalid."
          // and we have site IDs, the backend may currently be checking exists:assam_swps,id
          if (errMsg.toLowerCase().includes('selected id is invalid') && siteIds.length > 0) {
            console.warn(
              `[Accept Installation] Assign ID #${assignId} failed validation ("The selected id is invalid"). Retrying with site ID(s):`,
              siteIds
            );
            let siteSuccess = false;
            let lastSiteError = null;
            for (const sId of siteIds) {
              try {
                res = await assamSwpService.acceptInstallation(sId);
                usedId = sId;
                siteSuccess = true;
              } catch (siteErr: any) {
                lastSiteError = siteErr;
                console.warn(`[Accept Installation] Site ID #${sId} failed:`, siteErr);
              }
            }
            if (!siteSuccess) {
              throw lastSiteError || err;
            }
          } else {
            throw err;
          }
        }
      } else if (siteIds.length > 0) {
        for (const sId of siteIds) {
          res = await assamSwpService.acceptInstallation(sId);
          usedId = sId;
        }
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
      }

      setAcceptSuccessMsg(res?.message || 'Installation Accept Successfully!!!');

<<<<<<< HEAD
      // Persist accepted status locally
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        if (rowKeyId) next.add(Number(rowKeyId));
        if (assignId) next.add(Number(assignId));
        if (item?.id) next.add(Number(item.id));
        try {
          localStorage.setItem('assam_swp_accepted_ids', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });

=======
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
      // Optimistically mark as accepted locally
      setData((prev) =>
        prev.map((r) => {
          const rAssignId = getAssignId(r);
          const rSiteIds = parseSiteIds(r.site_id);
          const matches =
            r.id === rowKeyId ||
            (assignId > 0 && rAssignId === assignId) ||
            siteIds.some((s) => rSiteIds.includes(s));
          if (matches) {
            return { ...r, status: 2, inst_accept: 1 };
          }
          return r;
        })
      );

      // Re-fetch fresh live data directly from the server API
      await loadData();
      if (detailModalOpen) {
        try {
          const detailQueryId = assignId || usedId;
          const updatedDetail = await assamSwpService.getAssignSiteDetail(detailQueryId);
          const detailPayload = (updatedDetail as any)?.data || updatedDetail;
          setDetailData(detailPayload);
        } catch {}
      }
      setTimeout(() => setAcceptSuccessMsg(null), 4000);
      return true;
    } catch (err: any) {
      console.error('Accept error:', err);
      const rawMsg = err?.message || 'Error occurred while accepting installation';
      let friendlyMsg = rawMsg;
      if (rawMsg.toLowerCase().includes('selected id is invalid')) {
<<<<<<< HEAD
        friendlyMsg = `The selected ID is invalid on the server. Backend note: API currently validates site ID against 'assam_swps' table. Site ID: ${siteIds.join(', ') || 'N/A'}, Assign ID: ${assignId || 'N/A'}.`;
=======
        friendlyMsg = `The selected ID (#${assignId || siteIds.join(', ')}) is invalid on the server. Backend note: API requires 'exists:assigns,id' for assign ID. Please verify with backend team that this assignment entry exists in 'assigns' table on the live database.`;
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
      }
      setAcceptErrorMsg(friendlyMsg);
      setTimeout(() => setAcceptErrorMsg(null), 8000);
      return false;
    } finally {
      setAcceptingId(null);
    }
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = data;
    if (statusFilter === 'pending') {
      list = list.filter((item) => !isSiteAccepted(item));
    } else if (statusFilter === 'accepted') {
      list = list.filter((item) => isSiteAccepted(item));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const vendorName = item.vendors?.name || '';
        const state = item.state || '';
        const district = item.district || (item.Names && item.Names[0]?.district) || '';
        const remarks = item.remarks || '';
        const assignDate = item.assign_date || item.created_at || '';
        const deadlineDate = item.deadline_date || '';
        const purpose = item.purpose || '';
        const namesStr = (item.Names || []).map((n) => `${n.farmer_name} ${n.father_name}`).join(' ');
        const siteIds = parseSiteIds(item.site_id).join(' ');
        const assignIdStr = String(getAssignId(item) || '');
        return (
          String(item.id).includes(q) ||
          (assignIdStr && assignIdStr.includes(q)) ||
          vendorName.toLowerCase().includes(q) ||
          state.toLowerCase().includes(q) ||
          district.toLowerCase().includes(q) ||
          remarks.toLowerCase().includes(q) ||
          assignDate.toLowerCase().includes(q) ||
          deadlineDate.toLowerCase().includes(q) ||
          purpose.toLowerCase().includes(q) ||
          namesStr.toLowerCase().includes(q) ||
          siteIds.includes(q)
        );
      });
    }
    return list;
  }, [data, search, statusFilter, isSiteAccepted]);

  // Pagination hook
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // KPI Calculations
  const totalAssignments = data.length;
  const pendingAcceptance = data.filter((x) => !isSiteAccepted(x)).length;
  const acceptedCount = data.filter((x) => isSiteAccepted(x)).length;
  const totalSitesCount = data.reduce((sum, item) => {
    const ids = parseSiteIds(item.site_id);
    return sum + (ids.length || item.Names?.length || 0);
  }, 0);

  // Export Columns definition
  const exportCols: ExportColumn<AssignedSiteItem>[] = useMemo(() => [
    { header: 'Sr. No.', accessor: (_r: AssignedSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
    { header: 'Vendor', accessor: (r: AssignedSiteItem) => r.vendors?.name || `Vendor #${r.vendor || r.company_id}` },
    { header: 'Assign Date', accessor: (r: AssignedSiteItem) => fmtDate(r.assign_date || r.created_at) },
    { header: 'State', accessor: (r: AssignedSiteItem) => r.state?.toUpperCase() || 'ASSAM' },
    { header: 'District', accessor: (r: AssignedSiteItem) => r.district || (r.Names && r.Names[0]?.district) || '—' },
    {
      header: 'Farmer Name - Father Name',
      accessor: (r: AssignedSiteItem) =>
        (r.Names || []).map((n) => `${n.farmer_name || 'Farmer'} - ${n.father_name || '—'}`).join(', ') || '—',
    },
    {
      header: 'Count',
      accessor: (r: AssignedSiteItem) => r.site_count || parseSiteIds(r.site_id).length || r.Names?.length || 0,
    },
    { header: 'Deadline Date', accessor: (r: AssignedSiteItem) => fmtDate(r.deadline_date) },
    { header: 'File', accessor: (r: AssignedSiteItem) => r.file || '—' },
    { header: 'Remarks', accessor: (r: AssignedSiteItem) => r.remarks || '—' },
    {
      header: 'Status',
      accessor: (r: AssignedSiteItem) => (isSiteAccepted(r) ? 'Accepted' : 'Pending Accept'),
    },
  ], [isSiteAccepted]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Assam_SWP_Assignments';
  const fileTitle = 'Assam SWP Assigned Installation Register';

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
      alert('Assignment data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Assignment data copied to clipboard!');
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
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const headers = [
    'Sr. No.',
    'Vendor',
    'Assign Date',
    'State',
    'District',
    'Farmer Name - Father Name',
    'Count',
    'Deadline Date',
    'File',
    'View',
    'Remarks',
    'Status',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact Bihar pattern, NO refresh button) ── */}
      <PageHead
        title="SWP-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution in Assam"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Request Accept' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/assam/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Installation Site</span>
            </Link>
          </div>
        }
      />

      {/* Success notification */}
      {acceptSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{acceptSuccessMsg}</div>
        </div>
      )}

      {/* Error notification */}
      {acceptErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Accept Error</div>
          <div className="ax-alert__text">{acceptErrorMsg}</div>
        </div>
      )}

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Assignments</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assignments"
          value={totalAssignments.toLocaleString('en-IN')}
          sub={`${acceptedCount} accepted · ${pendingAcceptance} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Acceptance"
          value={pendingAcceptance.toLocaleString('en-IN')}
          sub="Action required by vendor"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Batches"
          value={acceptedCount.toLocaleString('en-IN')}
          sub="Accepted & ready to install"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Total Allocated Sites"
          value={totalSitesCount.toLocaleString('en-IN')}
          sub="Cumulative solar pump sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact Bihar SRT table card layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Sites">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Installation Batches</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> assignments
              {' '}· Accepted <b className="ax-num">{acceptedCount}</b> · Pending <b className="ax-num">{pendingAcceptance}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="swp_req_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                aria-label="Filter by assignment status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Accept</option>
                <option value="accepted">Accepted</option>
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
                placeholder="Search vendor, farmer, ID…"
                size="sm"
                ariaLabel="Search assigned installation batches"
              />

              {/* TableExportToolbar without columns toggle */}
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1550 }}
          >
            <caption className="ax-visually-hidden">Assigned Installation Batches</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action'
                        ? { textAlign: 'right' }
                        : h === 'Count' || h === 'View' || h === 'File' || h === 'Sr. No.'
                        ? { textAlign: 'center' }
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned batches from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No installation assignments found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No installation batches have been assigned yet by the administration.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((item, index) => {
                  const siteIds = parseSiteIds(item.site_id);
                  const count = item.site_count || siteIds.length || item.Names?.length || 0;
                  const isAccepted = isSiteAccepted(item);
                  const districtVal = item.district || (item.Names && item.Names[0]?.district) || '—';

                  return (
                    <tr key={item.id} className="ax-table__row">
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Vendor */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {item.vendors?.name || (item.vendor ? `Vendor #${item.vendor}` : (item.company_id || '—'))}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                          Assign #{getAssignId(item) || item.id}
                          {siteIds.length > 0 && ` · Sites: [${siteIds.join(', ')}]`}
                        </div>
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(item.assign_date || item.created_at)}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {(item.state || 'Assam').toUpperCase()}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <b>{districtVal}</b>
                      </td>

                      {/* 6. Farmer Name - Father Name */}
                      <td className="ax-table__td">
                        {item.Names && item.Names.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {item.Names.slice(0, 3).map((f, i) => (
                              <div key={i} style={{ fontSize: '12px' }}>
                                <b>{f.farmer_name || 'Farmer'}</b> - {f.father_name || '—'}
                              </div>
                            ))}
                            {item.Names.length > 3 && (
                              <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                                +{item.Names.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* 7. Count */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 700 }}>
                          {count}
                        </span>
                      </td>

                      {/* 8. Deadline Date */}
                      <td className="ax-table__td" style={{ fontSize: '13px' }}>
                        {fmtDate(item.deadline_date)}
                      </td>

                      {/* 9. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {item.file ? (
                          <a
                            href={resolveAssamMediaUrl(item.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ color: 'var(--asw-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                            title="View / Download Assignment File"
                          >
                            📎 File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 10. View */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => handleViewDetail(item)}
                        >
                          View
                        </button>
                      </td>

                      {/* 11. Remarks */}
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 160, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={item.remarks || ''}
                      >
                        {item.remarks || '—'}
                      </td>

                      {/* 12. Status */}
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">✓ Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          {!isAccepted ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleAccept(item)}
                              disabled={acceptingId === item.id || (getAssignId(item) > 0 && acceptingId === getAssignId(item))}
                            >
                              {acceptingId === item.id || (getAssignId(item) > 0 && acceptingId === getAssignId(item)) ? 'Accepting…' : 'Accept'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ color: 'var(--asw-primary)', fontWeight: 600 }}
                              onClick={() => navigate('/v/assam/installation/swp/site')}
                            >
                              Install Site &rarr;
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

        {/* ── Table Footer (exact Bihar pagination structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Assignment Details Modal (API 2) ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={activeItem ? `Assignment Details · #${getAssignId(activeItem) || activeItem.id}` : 'Assignment Details'}
        subtitle="Individual beneficiary and assignment configuration details"
        maxWidth={1100}
        footer={
          activeItem && !isSiteAccepted(activeItem) && detailData ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={async () => {
                  // Close the modal only after a successful accept, so errors stay visible/retryable
                  const ok = await handleAccept(activeItem, detailData);
                  if (ok) setDetailModalOpen(false);
                }}
                disabled={acceptingId === activeItem.id || (getAssignId(activeItem) > 0 && acceptingId === getAssignId(activeItem))}
              >
                {acceptingId === activeItem.id || (getAssignId(activeItem) > 0 && acceptingId === getAssignId(activeItem)) ? 'Accepting…' : 'Accept Assignment'}
              </button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <span className="ax-spinner" />
            <p style={{ marginTop: 8, color: 'var(--ax-text-muted)' }}>Fetching site details from server...</p>
          </div>
        ) : detailError ? (
          <div className="ax-alert ax-alert--danger">
            {detailError}
          </div>
        ) : !detailData?.Names || detailData.Names.length === 0 ? (
          <p style={{ color: 'var(--ax-text-muted)', textAlign: 'center', margin: '20px 0' }}>
            No specific site detail entries found for this assignment batch.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search filter above the popup table */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label
                htmlFor="modal_site_search"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}
              >
                Search:
              </label>
              <input
                id="modal_site_search"
                type="text"
                className="ax-input ax-input--sm"
                style={{ width: 280, height: 32 }}
                placeholder="Search farmer, block, village, district…"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
              {modalSearch && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setModalSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Popup Table: Sr. No., Assign Date, State, District, Block, Village, Farmer Name, Father Name, Deadline Date */}
            <div className="ax-table-wrap" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Sr. No.</th>
                    <th className="ax-table__th">Assign Date</th>
                    <th className="ax-table__th">State</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Block</th>
                    <th className="ax-table__th">Village</th>
                    <th className="ax-table__th">Farmer Name</th>
                    <th className="ax-table__th">Father Name</th>
                    <th className="ax-table__th">Deadline Date</th>
                  </tr>
                </thead>
                <tbody className="ax-table__body">
                  {filteredModalNames.length === 0 ? (
                    <tr>
                      <td className="ax-table__td" colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'var(--ax-text-muted)' }}>
                        No records match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredModalNames.map((site: AssignSiteDetailName, idx: number) => {
                      const assignDate = site.assign_date || detailData?.assign_date || activeItem?.assign_date || activeItem?.created_at;
                      const deadlineDate = site.deadline_date || detailData?.deadline_date || activeItem?.deadline_date;
                      const stateVal = site.state || detailData?.state || activeItem?.state || 'Assam';
                      const districtVal = site.district || detailData?.district || activeItem?.district || '—';
                      const blockVal = site.block || site.tehsil || '—';
                      const villageVal = site.village || '—';

                      return (
                        <tr key={site.id || idx} className="ax-table__row">
                          <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                            {idx + 1}
                          </td>
                          <td className="ax-table__td" style={{ fontSize: '13px' }}>
                            {fmtDate(assignDate)}
                          </td>
                          <td className="ax-table__td" style={{ fontSize: '13px', fontWeight: 500 }}>
                            {stateVal.toUpperCase()}
                          </td>
                          <td className="ax-table__td">
                            <b>{districtVal}</b>
                          </td>
                          <td className="ax-table__td">
                            {blockVal}
                          </td>
                          <td className="ax-table__td">
                            {villageVal}
                          </td>
                          <td className="ax-table__td">
                            <strong style={{ color: 'var(--ax-text-strong)' }}>{site.farmer_name || '—'}</strong>
                          </td>
                          <td className="ax-table__td">{site.father_name || '—'}</td>
                          <td className="ax-table__td" style={{ fontSize: '13px' }}>
                            {fmtDate(deadlineDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InstallationRequest;