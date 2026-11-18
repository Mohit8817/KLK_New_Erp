import { useEffect, useMemo, useState, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
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
} from '../../../../../common';
import {
  jammuSrtSurveyService,
  resolveJammuSurveyMediaUrl,
  getJammuSurveyMediaCandidates,
  type JammuSrtSurveyItem,
  type JammuSrtSurveyStats,
} from '../../jammu-services';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return '—';

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}

  const datePart = trimmed.split(/[ T]/)[0];
  return datePart || trimmed;
};

const cleanText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '—') return '';
  return s;
};

/* ───────── Modal Shell Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Lightbox Zoom Modal ───────── */
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
    <Modal open onClose={onClose} labelledBy="img-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="img-preview-title">{title || 'Survey Photograph'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div style={{ position: 'relative', display: 'flex', overflow: 'auto', height: 'min(66vh, 600px)', background: '#f1f5f9' }}>
          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
              <span className="ax-spinner" /> Loading photograph…
            </div>
          )}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              Photograph could not be displayed directly. Click "Open in new tab" below.
            </div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Survey photo'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            style={{
              display: status === 'ready' ? 'block' : 'none',
              margin: 'auto',
              ...(zoom === 1
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0}>−</button>
          <span style={{ fontSize: 12, color: '#64748b', minWidth: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1}>+</button>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Photo Thumbnail with Candidates Fallback ───────── */
function SrtThumbnail({
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
  const candidates = useMemo(() => getJammuSurveyMediaCandidates(src, 'srt_image'), [src]);
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
        borderRadius: 4,
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
      title="Click to preview photograph"
    />
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';
const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Styles ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* Modals */
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
  .ax-modal__dialog--md { max-width: 600px; }
  .ax-modal__dialog--lg { max-width: 960px; }
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
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

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

export function ViewData() {
  const navigate = useNavigate();
  const [data, setData] = useState<JammuSrtSurveyItem[]>([]);
  const [stats, setStats] = useState<JammuSrtSurveyStats>({ total: 0, complete: 0, pending: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Modals state
  const [activeRecord, setActiveRecord] = useState<JammuSrtSurveyItem | null>(null);
  const [lightboxPreview, setLightboxPreview] = useState<{ url: string; title: string } | null>(null);

  // Load survey records from API 1: GET /jammu/srt70mw/view-survey
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await jammuSrtSurveyService.viewSurveys();
      setData(Array.isArray(resp.surveys) ? resp.surveys : []);
      if (resp.survey_detail) {
        setStats(resp.survey_detail);
      }
    } catch (err: any) {
      console.error('[Jammu SRT ViewSurvey] load error:', err);
      setData([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load Jammu SRT 70MW surveys.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct filter options
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const dp = r.dept_name || r.department;
      if (dp) set.add(dp.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = data;

    if (districtFilter !== 'all') {
      list = list.filter((r) => (r.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    if (deptFilter !== 'all') {
      list = list.filter((r) => (r.dept_name || r.department || '').toLowerCase() === deptFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const idStr = String(r.id);
        const uidStr = String(r.uid || '');
        const site = (r.site_name || '').toLowerCase();
        const dist = (r.district || '').toLowerCase();
        const dept = (r.dept_name || r.department || '').toLowerCase();
        const ca = (r.ca_no || '').toLowerCase();
        const meter = (r.meter_no || '').toLowerCase();
        const contact = (r.contact_person_name || r.contact_person || '').toLowerCase();
        const contactDesig = (r.contact_person_designation || '').toLowerCase();
        const contactNo = String(r.contact_person_mobile || r.contact_no || '');
        const addr = (r.survey_site_address || r.address || '').toLowerCase();
        const landmark = (r.near_landmark || '').toLowerCase();
        const createdBy = String(r.created_by || '').toLowerCase();
        return (
          idStr.includes(q) ||
          uidStr.toLowerCase().includes(q) ||
          site.includes(q) ||
          dist.includes(q) ||
          dept.includes(q) ||
          ca.includes(q) ||
          meter.includes(q) ||
          contact.includes(q) ||
          contactDesig.includes(q) ||
          contactNo.includes(q) ||
          addr.includes(q) ||
          landmark.includes(q) ||
          createdBy.includes(q)
        );
      });
    }

    return list;
  }, [data, search, districtFilter, deptFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, deptFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || deptFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setDeptFilter('all');
    setPage(1);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SRT 70MW: View Surveys"
        subtitle="Review technical feasibility surveys for the 70MW Solar Rooftop (SRT) program across Jammu districts"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'SRT 70MW' },
          { label: 'View 70MW SRT' },
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
            <Link to="/v/jammu/survey/srt-70mw/add-srt" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add 70MW SRT</span>
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

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total SRT Surveys"
          value={(stats.total || data.length).toLocaleString('en-IN')}
          sub="Scope of 70MW program"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Surveys Completed"
          value={(stats.complete || data.length).toLocaleString('en-IN')}
          sub="Feasibility reports submitted"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Surveys Pending"
          value={(stats.pending ?? 0).toLocaleString('en-IN')}
          sub="Awaiting field inspection"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Active Districts"
          value={districts.length.toLocaleString('en-IN')}
          sub="Coverage across Jammu region"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu SRT 70MW Surveys Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed 70MW SRT Surveys</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> records
              {' '}· Verified rooftop surveys for 70MW project
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {departments.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((dp) => (
                    <option key={dp} value={dp}>{dp}</option>
                  ))}
                </select>
              )}

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, UID, CA…"
                size="sm"
                ariaLabel="Search surveys"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        r.uid ? `SRT-${r.uid}` : `SRT-${r.id}`,
                        cleanText(r.site_name) || DASH,
                        cleanText(r.district) || DASH,
                        cleanText(r.dept_name || r.department) || DASH,
                        cleanText(r.survey_site_address || r.address) || DASH,
                        cleanText(r.near_landmark) || DASH,
                        r.proposed_capacity ? `${r.proposed_capacity} kW` : DASH,
                        r.sanction_load ? `${r.sanction_load} kW` : DASH,
                        r.instantaneous_load ? `${r.instantaneous_load} kW` : DASH,
                        cleanText(r.ca_no) || DASH,
                        cleanText(r.meter_no) || DASH,
                        cleanText(r.meter_connection_type) || DASH,
                        cleanText(r.load_type) || DASH,
                        cleanText(r.connection_type) || DASH,
                        cleanText(r.grid_availability) || DASH,
                        cleanText(r.three_phase_available) || DASH,
                        cleanText(r.existing_dg_set) || DASH,
                        cleanText(r.roof_type) || DASH,
                        cleanText(r.structure_type) || DASH,
                        cleanText(r.roof_condition) || DASH,
                        r.roof_area ? `${r.roof_area} sq.ft` : DASH,
                        r.solar_free_space ? `${r.solar_free_space} sq.ft` : DASH,
                        cleanText(r.number_of_floors) || DASH,
                        cleanText(r.latitude) || DASH,
                        cleanText(r.longitude) || DASH,
                        cleanText(r.contact_person_name || r.contact_person) || DASH,
                        cleanText(r.contact_person_mobile || r.contact_no) || DASH,
                        formatDate(r.survey_date || r.created_at),
                        Number(r.survey_verify_status) === 1 ? 'Verified' : 'Verify Pending',
                        cleanText(r.created_by) || DASH,
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,UID,Site Name,District,Department,Address,Landmark,Proposed Capacity,Sanction Load,Instant Load,CA No,Meter No,Meter Conn Type,Load Type,Conn Type,Grid Available,Three Phase,DG Set,Roof Type,Structure Type,Roof Condition,Roof Area,Solar Free Space,Floors,Latitude,Longitude,Contact Person,Contact Mobile,Survey Date,Verify Status,Created By',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.uid ? `SRT-${r.uid}` : `SRT-${r.id}`}","${cleanText(r.site_name)}","${cleanText(r.district)}","${cleanText(r.dept_name || r.department)}","${cleanText(r.survey_site_address || r.address)}","${cleanText(r.near_landmark)}","${r.proposed_capacity || ''}","${r.sanction_load || ''}","${r.instantaneous_load || ''}","${cleanText(r.ca_no)}","${cleanText(r.meter_no)}","${cleanText(r.meter_connection_type)}","${cleanText(r.load_type)}","${cleanText(r.connection_type)}","${cleanText(r.grid_availability)}","${cleanText(r.three_phase_available)}","${cleanText(r.existing_dg_set)}","${cleanText(r.roof_type)}","${cleanText(r.structure_type)}","${cleanText(r.roof_condition)}","${r.roof_area || ''}","${r.solar_free_space || ''}","${cleanText(r.number_of_floors)}","${cleanText(r.latitude)}","${cleanText(r.longitude)}","${cleanText(r.contact_person_name || r.contact_person)}","${cleanText(r.contact_person_mobile || r.contact_no)}","${formatDate(r.survey_date || r.created_at)}","${Number(r.survey_verify_status) === 1 ? 'Verified' : 'Verify Pending'}","${cleanText(r.created_by)}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_SRT_70MW_Surveys.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,UID,Site Name,District,Department,Address,Landmark,Proposed Capacity,Sanction Load,Instant Load,CA No,Meter No,Meter Conn Type,Load Type,Conn Type,Grid Available,Three Phase,DG Set,Roof Type,Structure Type,Roof Condition,Roof Area,Solar Free Space,Floors,Latitude,Longitude,Contact Person,Contact Mobile,Survey Date,Verify Status,Created By',
                    ...filtered.map(
                      (r, i) =>
                        `"${i + 1}","${r.uid ? `SRT-${r.uid}` : `SRT-${r.id}`}","${cleanText(r.site_name)}","${cleanText(r.district)}","${cleanText(r.dept_name || r.department)}","${cleanText(r.survey_site_address || r.address)}","${cleanText(r.near_landmark)}","${r.proposed_capacity || ''}","${r.sanction_load || ''}","${r.instantaneous_load || ''}","${cleanText(r.ca_no)}","${cleanText(r.meter_no)}","${cleanText(r.meter_connection_type)}","${cleanText(r.load_type)}","${cleanText(r.connection_type)}","${cleanText(r.grid_availability)}","${cleanText(r.three_phase_available)}","${cleanText(r.existing_dg_set)}","${cleanText(r.roof_type)}","${cleanText(r.structure_type)}","${cleanText(r.roof_condition)}","${r.roof_area || ''}","${r.solar_free_space || ''}","${cleanText(r.number_of_floors)}","${cleanText(r.latitude)}","${cleanText(r.longitude)}","${cleanText(r.contact_person_name || r.contact_person)}","${cleanText(r.contact_person_mobile || r.contact_no)}","${formatDate(r.survey_date || r.created_at)}","${Number(r.survey_verify_status) === 1 ? 'Verified' : 'Verify Pending'}","${cleanText(r.created_by)}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_SRT_70MW_Surveys.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with all 27 comprehensive response fields ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">UID</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Department</th>
                <th className="ax-table__th" scope="col" style={{ minWidth: 220 }}>Address & Landmark</th>
                <th className="ax-table__th" scope="col">Proposed Cap.</th>
                <th className="ax-table__th" scope="col">Sanction Load</th>
                <th className="ax-table__th" scope="col">Instant Load</th>
                <th className="ax-table__th" scope="col">CA Number</th>
                <th className="ax-table__th" scope="col">Meter No & Type</th>
                <th className="ax-table__th" scope="col">Load & Connection</th>
                <th className="ax-table__th" scope="col">Grid & Phase</th>
                <th className="ax-table__th" scope="col">DG Set Backup</th>
                <th className="ax-table__th" scope="col">Roof & Structure</th>
                <th className="ax-table__th" scope="col">Roof Area & Free Space</th>
                <th className="ax-table__th" scope="col">Building Specs & Heights</th>
                <th className="ax-table__th" scope="col">Earth Pit & Routing</th>
                <th className="ax-table__th" scope="col">Site Access & Distance</th>
                <th className="ax-table__th" scope="col">GPS Coordinates</th>
                <th className="ax-table__th" scope="col">Contact Person & Mobile</th>
                <th className="ax-table__th" scope="col">Survey Date</th>
                <th className="ax-table__th" scope="col">Photos (1-4)</th>
                <th className="ax-table__th" scope="col">Report (PDF)</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col">Created By</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={27} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading 70MW SRT surveys from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={27} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Jammu 70MW SRT surveys found"
                      message={hasFilters ? 'No records match your filters. Try clearing your search.' : 'No SRT survey records found. Click "+ Add 70MW SRT" to create one.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const uidDisplay = row.uid ? `SRT-${row.uid}` : `SRT-${row.id}`;
                  const surveyDate = formatDate(row.survey_date || row.created_at);
                  const photo1 = row.image1 || row.building_image;
                  const photo2 = row.image2 || row.roof_image;
                  const photo3 = row.image3 || row.control_room_image;
                  const photo4 = row.image4;
                  const pdfFileUrl = row.pdf_file || row.pdf;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2559bf' }}>
                        {uidDisplay}
                      </td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setActiveRecord(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            fontWeight: 600,
                            color: '#2559bf',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                          title="Click to view full survey dossier"
                        >
                          {row.site_name || DASH}
                        </button>
                      </td>
                      <td className="ax-table__td"><b>{cleanText(row.district) || DASH}</b></td>
                      <td className="ax-table__td">{cleanText(row.dept_name || row.department) || DASH}</td>

                      {/* Address & Landmark */}
                      <td className="ax-table__td" style={{ minWidth: 220, maxWidth: 300, whiteSpace: 'normal', fontSize: 12 }}>
                        <div>{cleanText(row.survey_site_address || row.address) || DASH}</div>
                        {row.near_landmark && (
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            Near: <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{cleanText(row.near_landmark)}</span>
                          </div>
                        )}
                      </td>

                      {/* Capacity & Loads */}
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.proposed_capacity ? `${row.proposed_capacity} kW` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2559bf' }}>
                        {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.instantaneous_load ? `${row.instantaneous_load} kW` : DASH}
                      </td>

                      {/* CA & Meter */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {cleanText(row.ca_no) || DASH}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{cleanText(row.meter_no) || DASH}</div>
                        {row.meter_connection_type && (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontSize: 10, marginTop: 2 }}>
                            {cleanText(row.meter_connection_type)}
                          </span>
                        )}
                      </td>

                      {/* Load & Connection */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><span style={{ color: '#64748b' }}>Load:</span> {cleanText(row.load_type) || DASH}</div>
                        <div><span style={{ color: '#64748b' }}>Conn:</span> {cleanText(row.connection_type) || DASH}</div>
                      </td>

                      {/* Grid & Phase */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><span style={{ color: '#64748b' }}>Grid:</span> {cleanText(row.grid_availability) || DASH} · <span style={{ color: '#64748b' }}>3-Ph:</span> {cleanText(row.three_phase_available) || DASH}</div>
                        <div><span style={{ color: '#64748b' }}>Missing:</span> {cleanText(row.missing_phase) || 'None'} · <span style={{ color: '#64748b' }}>LTDB:</span> {cleanText(row.ltdb_status) || DASH}</div>
                      </td>

                      {/* DG Set Backup */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {row.existing_dg_set || row.dg_set_capacity || row.dg_set_make ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{cleanText(row.existing_dg_set)}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {cleanText(row.dg_set_capacity)} {cleanText(row.dg_set_make) ? `(${cleanText(row.dg_set_make)})` : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Roof & Structure */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><b>{cleanText(row.roof_type) || DASH}</b> ({cleanText(row.structure_type) || DASH})</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Cond: {cleanText(row.roof_condition) || DASH}</div>
                      </td>

                      {/* Roof Area & Free Space */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><span style={{ color: '#64748b' }}>Roof:</span> {row.roof_area ? `${row.roof_area} sq.ft` : DASH}</div>
                        <div><span style={{ color: '#64748b' }}>Solar:</span> {row.solar_free_space ? `${row.solar_free_space} sq.ft` : DASH} · <span style={{ color: '#64748b' }}>CR:</span> {cleanText(row.control_room_free_space) || DASH}</div>
                      </td>

                      {/* Building Specs & Heights */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><span style={{ color: '#64748b' }}>Floors:</span> {cleanText(row.number_of_floors) || DASH} · <span style={{ color: '#64748b' }}>Age:</span> {row.building_age ? `${row.building_age} yrs` : DASH}</div>
                        <div><span style={{ color: '#64748b' }}>Height:</span> {row.rooftop_height ? `${row.rooftop_height} ft` : DASH} · <span style={{ color: '#64748b' }}>Parapet:</span> {row.parapet_height ? `${row.parapet_height} ft` : DASH}</div>
                      </td>

                      {/* Earth Pit & Routing */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div><span style={{ color: '#64748b' }}>Pit:</span> {cleanText(row.earth_pit || row.earth_pit_position) || DASH}</div>
                        <div><span style={{ color: '#64748b' }}>Cable:</span> {cleanText(row.ac_cable_routing) || DASH}</div>
                      </td>

                      {/* Site Access & Distance */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div>{cleanText(row.site_access) || DASH}</div>
                        {row.site_distance && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>Dist: {row.site_distance} km</div>
                        )}
                      </td>

                      {/* GPS Coordinates */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {row.latitude && row.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2559bf', fontWeight: 600, textDecoration: 'none' }}
                            title="Open in Google Maps"
                          >
                            {row.latitude}, {row.longitude} ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Contact Person & Mobile */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{cleanText(row.contact_person_name || row.contact_person) || DASH}</div>
                        {row.contact_person_designation && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>{cleanText(row.contact_person_designation)}</div>
                        )}
                        {(row.contact_person_mobile || row.contact_no) && (
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#2559bf' }}>
                            {cleanText(row.contact_person_mobile || row.contact_no)}
                          </div>
                        )}
                      </td>

                      {/* Survey Date */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{surveyDate}</td>

                      {/* Photos Thumbnails (All 4 supported) */}
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {photo1 && (
                            <SrtThumbnail
                              src={photo1}
                              alt={`Building ${row.site_name}`}
                              onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                            />
                          )}
                          {photo2 && (
                            <SrtThumbnail
                              src={photo2}
                              alt={`Roof ${row.site_name}`}
                              onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                            />
                          )}
                          {photo3 && (
                            <SrtThumbnail
                              src={photo3}
                              alt={`Control Room ${row.site_name}`}
                              onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                            />
                          )}
                          {photo4 && (
                            <SrtThumbnail
                              src={photo4}
                              alt={`Additional ${row.site_name}`}
                              onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                            />
                          )}
                          {!photo1 && !photo2 && !photo3 && !photo4 && (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </div>
                      </td>

                      {/* PDF Report */}
                      <td className="ax-table__td">
                        {pdfFileUrl ? (
                          <a
                            href={resolveJammuSurveyMediaUrl(pdfFileUrl, 'srt_pdf')}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2559bf', padding: '2px 8px', fontSize: 11, fontWeight: 600 }}
                            title="View Survey PDF"
                          >
                            PDF ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {Number(row.survey_verify_status) === 1 ? (
                            <Badge tone="success">Verified</Badge>
                          ) : Number(row.survey_verify_status) === 2 ? (
                            <Badge tone="danger">Rejected</Badge>
                          ) : (
                            <Badge tone="warning">Verify Pending</Badge>
                          )}
                          {row.survey_verify_date && (
                            <span style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>
                              {formatDate(row.survey_verify_date)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {cleanText(row.created_by) || DASH}
                      </td>

                      {/* Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setActiveRecord(row)}
                            title="View complete survey dossier"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => navigate(`/v/jammu/survey/srt-70mw/add-srt?id=${row.id}`)}
                            title="Edit survey record"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            Edit
                          </button>
                        </div>
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
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Lightbox Zoom Modal ── */}
      {lightboxPreview && (
        <ImagePreviewModal
          url={lightboxPreview.url}
          title={lightboxPreview.title}
          onClose={() => setLightboxPreview(null)}
        />
      )}

      {/* ── View Comprehensive Survey Detail Modal ── */}
      {activeRecord && (
        <Modal open onClose={() => setActiveRecord(null)} labelledBy="srt-survey-detail-title" dialogClass="ax-modal__dialog--lg">
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="srt-survey-detail-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Jammu SRT 70MW Survey Dossier: {activeRecord.site_name}</span>
              <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11 }}>
                #{activeRecord.id}
              </span>
            </h2>
            <button type="button" className="ax-modal__close" onClick={() => setActiveRecord(null)} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body">
            {/* Grid of All Response Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px', fontSize: 13, marginBottom: 16 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Survey UID</span>
                <b>{activeRecord.uid ? `SRT-${activeRecord.uid}` : `SRT-${activeRecord.id}`}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Company ID</span>
                <b style={{ color: '#2559bf' }}>{activeRecord.company_id || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                <b>{activeRecord.state || 'Jammu'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                <b>{activeRecord.district || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                <b>{cleanText(activeRecord.dept_name || activeRecord.department) || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Proposed Capacity</span>
                <b style={{ color: '#16a34a' }}>{activeRecord.proposed_capacity ? `${activeRecord.proposed_capacity} kW` : '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                <b>{cleanText(activeRecord.ca_no) || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Meter Number</span>
                <b>{cleanText(activeRecord.meter_no) || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction / Instantaneous Load</span>
                <b>{activeRecord.sanction_load || '—'} kW / {activeRecord.instantaneous_load || '—'} kW</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Load Type / Connection</span>
                <b>{activeRecord.load_type || '—'} / {activeRecord.connection_type || 'LT'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Meter Connection Type</span>
                <b>{activeRecord.meter_connection_type || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Grid Availability</span>
                <b>{activeRecord.grid_availability || 'Yes'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Three Phase / Missing Phase</span>
                <b>3-Phase: {activeRecord.three_phase_available || 'Yes'} · Missing: {activeRecord.missing_phase || 'No'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>LTDB Status</span>
                <b>{activeRecord.ltdb_status || 'Available'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>DG Set Backup</span>
                <b>
                  {String(activeRecord.existing_dg_set ?? activeRecord.dg_set_available) === '1'
                    ? `Yes (${activeRecord.dg_set_capacity || ''} - ${activeRecord.dg_set_make || ''})`
                    : 'No'}
                </b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</span>
                <b>
                  {cleanText(activeRecord.contact_person_name || activeRecord.contact_person) || DASH}
                  {activeRecord.contact_person_designation ? ` (${cleanText(activeRecord.contact_person_designation)})` : ''}
                  {activeRecord.contact_person_mobile || activeRecord.contact_no ? ` - ${cleanText(activeRecord.contact_person_mobile || activeRecord.contact_no)}` : ''}
                </b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>GPS Coordinates</span>
                <b>{activeRecord.latitude || '—'}, {activeRecord.longitude || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Survey Date</span>
                <b>{formatDate(activeRecord.survey_date || activeRecord.created_at)}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Roof Area / Space</span>
                <b>{activeRecord.roof_area || '—'} sq.ft (Solar: {activeRecord.solar_free_space || '—'} sq.ft)</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Control Room Free Space</span>
                <b>{activeRecord.control_room_free_space || '—'} sq.ft</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Earth Pit & AC Routing</span>
                <b>{cleanText(activeRecord.earth_pit || activeRecord.earth_pit_position)} · {cleanText(activeRecord.ac_cable_routing)}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Roof Type & Structure</span>
                <b>{activeRecord.roof_type || 'RCC'} · {activeRecord.structure_type || 'Elevated'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Roof Condition & Access</span>
                <b>{activeRecord.roof_condition || 'Good'} · {activeRecord.roof_access || 'Permanent Staircase'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Height & Parapet</span>
                <b>{activeRecord.rooftop_height || '—'} ft (Parapet: {activeRecord.parapet_height || '—'} ft)</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Floors & Building Age</span>
                <b>{activeRecord.number_of_floors || '—'} Floors · Age: {activeRecord.building_age || '—'} yrs</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Access & Distance</span>
                <b>{cleanText(activeRecord.site_access)} ({activeRecord.site_distance || '0'} km from main road)</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Audit Verification</span>
                <b>
                  {Number(activeRecord.survey_verify_status) === 1
                    ? 'Verified'
                    : Number(activeRecord.survey_verify_status) === 2
                    ? 'Rejected'
                    : 'Verify Pending'}
                  {activeRecord.survey_verify_by ? ` by #${activeRecord.survey_verify_by}` : ''}
                  {activeRecord.survey_verify_date ? ` (${formatDate(activeRecord.survey_verify_date)})` : ''}
                </b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor / Created By</span>
                <b>Vendor ID #{activeRecord.survey_vendor || DASH} · Created by: {activeRecord.created_by || DASH}</b>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Full Address & Landmark</span>
                <p style={{ margin: '4px 0 0 0', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  {cleanText(activeRecord.survey_site_address || activeRecord.address)}
                  {activeRecord.near_landmark ? ` (Near ${activeRecord.near_landmark})` : ''}
                </p>
              </div>
            </div>

            {/* Photos Preview Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                Photographic Evidence Documentation
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Building Overview', src: activeRecord.image1 || activeRecord.building_image },
                  { label: 'Rooftop Area', src: activeRecord.image2 || activeRecord.roof_image },
                  { label: 'Control Room / LTDB', src: activeRecord.image3 || activeRecord.control_room_image },
                  { label: 'Additional Photo', src: activeRecord.image4 },
                ]
                  .filter((item) => item.src)
                  .map((item) => {
                    const u = resolveJammuSurveyMediaUrl(item.src, 'srt_image');
                    return (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <img
                          src={u}
                          alt={item.label}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'zoom-in' }}
                          onClick={() => setLightboxPreview({ url: u, title: item.label })}
                        />
                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>{item.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => {
                const id = activeRecord.id;
                setActiveRecord(null);
                navigate(`/v/jammu/survey/srt-70mw/add-srt?id=${id}`);
              }}
            >
              Edit Survey
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setActiveRecord(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ViewData;

