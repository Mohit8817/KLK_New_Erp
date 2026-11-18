import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
  type SurveyDetailKpis,
} from '../../bihar-services';
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

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const DEFAULT_KPIS: SurveyDetailKpis = {
  total: 0,
  complete: 0,
  pending: 0,
  verify_pending: 0,
  verify_complete: 0,
  verify_reject: 0,
};

/* ── Row type: API fields (dept_name, survey_verify_remarks) ke saath ── */
type Row = BiharSrtSiteItem & {
  dept_name?: string | null;
  survey_verify_remarks?: string | null;
};

/* ── Helpers: API field + purana field fallback ── */
const getDept = (r: Row) => r.dept_name ?? (r as any).department;
const getVerifyRemarks = (r: Row) => r.survey_verify_remarks ?? (r as any).verify_remarks;
const isSurveyDone = (r: Row) => Number(r.survey_status) === 1;
const verifyStatusNum = (r: Row) => Number(r.survey_verify_status ?? (r as any).verify_status);

/* ───────── Shared icon constants (Kashmir pattern) ───────── */
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── KPI Card (Static / Non-clickable, matching View Bihar SRT Installation) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'danger';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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
  sub?: string;
}) {
  const t = TONE[tone];

  return (
    <div
      className="ax-card"
      style={{
        padding: '12px 14px',
        borderRadius: 10,
        minWidth: 0,
        cursor: 'default',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface, #ffffff)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={label}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 2, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ax-text-muted)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={sub}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ───────── Responsive page CSS (Exact View Bihar SRT Installation pattern) ───────── */
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
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  .solar-erp-page .srt-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
    margin-top: 4px;
  }
  @media (max-width: 1400px) {
    .solar-erp-page .srt-kpi-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 960px) {
    .solar-erp-page .srt-kpi-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
    .solar-erp-page .srt-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 420px) {
    .solar-erp-page .srt-kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;

/* ───────── Overlay / Modal CSS (separated like Kashmir) ───────── */
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

/* ───────── Shared style constants (Kashmir pattern) ───────── */
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

/* ───────── Reusable Modal Component (Kashmir pattern) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal with Zoom (Kashmir pattern) ───────── */
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
    <Modal open onClose={onClose} labelledBy="srt200mw-survey-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="srt200mw-survey-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Image URL resolution ───────── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getSurveyImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/srt200mw/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/srt200mw/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/survey/srt/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

function resolveSurveyFileUrl(path?: string | null): string {
  if (!path) return '';
  const clean = path.trim();
  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  const normalized = clean.replace(/^\/+/, '');
  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
    return `${BACKEND_BASE}/${normalized}`;
  }
  const filename = normalized.split('/').pop() || normalized;
  return `${BACKEND_BASE}/uploads/bihar/survey/srt/${filename}`;
}

/* ───────── Survey Thumbnail (Kashmir pattern — size 34, zoom-in) ───────── */
function SurveyThumbnail({
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
  const candidates = useMemo(() => getSurveyImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        cursor: 'zoom-in',
        display: 'block',
        margin: '0 auto',
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

/* ── Table column config ── */
interface TextCol { key: string; th: string; get: (r: Row) => ReactNode; style?: CSSProperties }

const TEXT_COLS_BEFORE_MEDIA: TextCol[] = [
  { key: 'Unique ID', th: 'Unique ID', get: (r) => txt(r.uid), style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  { key: 'State', th: 'State', get: (r) => r.state || 'Bihar' },
  { key: 'District', th: 'District', get: (r) => txt(r.district), style: { fontWeight: 600 } },
  { key: 'Division', th: 'Division', get: (r) => txt(r.division) },
  { key: 'Sub Division', th: 'Sub Division', get: (r) => txt(r.sub_division) },
  { key: 'Department', th: 'Department', get: (r) => txt(getDept(r)) },
  { key: 'Site Name', th: 'Site Name', get: (r) => txt(r.site_name), style: { fontWeight: 600, color: 'var(--ax-text-strong)' } },
  { key: 'Site Address', th: 'Site Address', get: (r) => txt(r.address) },
  { key: 'CA No.', th: 'CA No.', get: (r) => txt(r.ca_no) },
  { key: 'Survey Address', th: 'Survey Address', get: (r) => txt(r.survey_address) },
  { key: 'Nearest Landmark', th: 'Nearest Landmark', get: (r) => txt(r.near_landmark) },
  { key: 'Agency Contact Person', th: 'Agency Contact Person', get: (r) => txt(r.agency_person_name) },
  { key: 'Agency Contact Number', th: 'Agency Contact Number', get: (r) => txt(r.agency_person_contact) },
  { key: 'Nodal Person', th: 'Nodal Person', get: (r) => txt(r.nodal_person) },
  { key: 'Nodal Contact', th: 'Nodal Person Contact', get: (r) => txt(r.contact_nodal) },
  { key: 'Latitude', th: 'Latitude', get: (r) => txt(r.latitude), style: { fontFamily: 'var(--ax-font-mono)', fontSize: '11px' } },
  { key: 'Longitude', th: 'Longitude', get: (r) => txt(r.longitude), style: { fontFamily: 'var(--ax-font-mono)', fontSize: '11px' } },
  { key: 'Load Type', th: 'Load Type', get: (r) => txt(r.load_type) },
  { key: 'Connection Phase', th: 'Connection Phase', get: (r) => txt(r.connection_phase) },
  { key: 'Meter Connection Type', th: 'Meter Connection Type', get: (r) => txt(r.meter_connection) },
  { key: 'Meter Number', th: 'Meter Number', get: (r) => txt(r.meter_number) },
  { key: 'Meter Type', th: 'Meter Type', get: (r) => txt(r.meter_type) },
  { key: 'Sanction Load', th: 'Sanction Load (KW/KVA)', get: (r) => txt(r.sanction_load) },
  { key: 'Connected Load', th: 'Connected Load (KW)', get: (r) => txt(r.connected_load) },
  { key: 'Grid Power Availability', th: 'Grid Power Availability', get: (r) => txt(r.grid_power) },
  { key: 'Three-Phase Availability', th: 'Three-Phase Availability', get: (r) => txt(r.all_3_phase_ltdb) },
  { key: 'Missing Phase', th: 'Missing Phase', get: (r) => txt(r.missing_phase) },
  { key: 'LTDB Present', th: 'LTDB Present', get: (r) => txt(r.ltdb_present) },
  { key: 'Roof Condition', th: 'Roof Condition', get: (r) => txt(r.roof_condition) },
  { key: 'Total Roof Area (Sq.Ft)', th: 'Total Roof Area (Sq.Ft)', get: (r) => txt(r.area_roof) },
  { key: 'Free Space Solar (Sq.Ft)', th: 'Free Space Solar (Sq.Ft)', get: (r) => txt(r.free_space_solar) },
  { key: 'Free Space Inverter (Sq.Ft)', th: 'Free Space Inverter (Sq.Ft)', get: (r) => txt(r.free_space_inverter) },
  { key: 'Earth Pit Position', th: 'Earth Pit Position', get: (r) => txt(r.earth_pit) },
  { key: 'Age of Building', th: 'Age of Building', get: (r) => txt(r.building_age) },
  { key: 'Roof Access', th: 'Access to Roof', get: (r) => txt(r.roof_access) },
  { key: 'Rooftop Height', th: 'Rooftop Height (Feet)', get: (r) => txt(r.rooftop_height) },
  { key: 'Parapet Height', th: 'Parapet Height (Feet)', get: (r) => txt(r.parapet_height) },
  { key: 'No. of Floors', th: 'No. of Floors (G+...)', get: (r) => txt(r.floors_number) },
  { key: 'Water Source', th: 'Water Source for Cleaning', get: (r) => txt(r.water_source) },
  { key: 'Access to Site', th: 'Access to Site', get: (r) => txt(r.site_access) },
  { key: 'Distance from Road', th: 'Distance from Main Road (km)', get: (r) => txt(r.site_distance) },
];

const MEDIA_COLS: { th: string; alt: string; field: 'image1' | 'image2' | 'image3' | 'image4' }[] = [
  { th: 'Building Image', alt: 'Building', field: 'image1' },
  { th: 'Roof Image', alt: 'Roof', field: 'image2' },
  { th: 'Control Room', alt: 'Control Room', field: 'image3' },
  { th: 'Other Image', alt: 'Other', field: 'image4' },
];

/* ───────── Main Component ───────── */
export function Bihar_Survey_SRT200MW_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<SurveyDetailKpis>(DEFAULT_KPIS);
  const [sites, setSites] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  /* Feedback alert (Kashmir pattern — auto-dismiss) */
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  /* Column Visibility */
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (header: string) => !hiddenCols.includes(header);

  /* Load survey view data */
  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const resp = await biharSrt200mwService.getViewSurveyData();
      setKpis(resp.data.survey_detail || DEFAULT_KPIS);
      setSites((resp.data.srt200mw || []) as Row[]);
    } catch (err: any) {
      console.error('[Bihar SRT 200MW] Failed to load data:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load survey records from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Districts list for filter dropdown */
  const districts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district) set.add(String(s.district).trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  /* Filtered sites (district + verify status + search) */
  const filteredSites = useMemo(() => {
    let list = sites;

    if (districtFilter !== 'all') {
      list = list.filter((s) => String(s.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => {
        const v = verifyStatusNum(s);
        if (statusFilter === 'approved') return v === 1;
        if (statusFilter === 'rejected') return v === 2;
        if (statusFilter === 'pending') return v !== 1 && v !== 2;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) =>
        Object.values(item).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [sites, search, districtFilter, statusFilter]);

  /* Pagination */
  const pagedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  /* Export column definitions */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Unique ID', accessor: (r) => r.uid ?? '' },
      { header: 'State', accessor: (r) => r.state ?? '' },
      { header: 'District', accessor: (r) => r.district ?? '' },
      { header: 'Division', accessor: (r) => r.division ?? '' },
      { header: 'Sub Division', accessor: (r) => r.sub_division ?? '' },
      { header: 'Department', accessor: (r) => getDept(r) ?? '' },
      { header: 'Site Name', accessor: (r) => r.site_name ?? '' },
      { header: 'Site Address', accessor: (r) => r.address ?? '' },
      { header: 'CA No.', accessor: (r) => r.ca_no ?? '' },
      { header: 'Survey Address', accessor: (r) => r.survey_address ?? '' },
      { header: 'Nearest Landmark', accessor: (r) => r.near_landmark ?? '' },
      { header: 'Agency Contact Person', accessor: (r) => r.agency_person_name ?? '' },
      { header: 'Agency Contact Number', accessor: (r) => r.agency_person_contact ?? '' },
      { header: 'Nodal Person', accessor: (r) => r.nodal_person ?? '' },
      { header: 'Nodal Contact', accessor: (r) => r.contact_nodal ?? '' },
      { header: 'Latitude', accessor: (r) => r.latitude ?? '' },
      { header: 'Longitude', accessor: (r) => r.longitude ?? '' },
      { header: 'Load Type', accessor: (r) => r.load_type ?? '' },
      { header: 'Connection Phase', accessor: (r) => r.connection_phase ?? '' },
      { header: 'Meter Connection Type', accessor: (r) => r.meter_connection ?? '' },
      { header: 'Meter Number', accessor: (r) => r.meter_number ?? '' },
      { header: 'Meter Type', accessor: (r) => r.meter_type ?? '' },
      { header: 'Sanction Load', accessor: (r) => r.sanction_load ?? '' },
      { header: 'Connected Load', accessor: (r) => r.connected_load ?? '' },
      { header: 'Grid Power Availability', accessor: (r) => r.grid_power ?? '' },
      { header: 'Three-Phase Availability', accessor: (r) => r.all_3_phase_ltdb ?? '' },
      { header: 'Missing Phase', accessor: (r) => r.missing_phase ?? '' },
      { header: 'LTDB Present', accessor: (r) => r.ltdb_present ?? '' },
      { header: 'Roof Condition', accessor: (r) => r.roof_condition ?? '' },
      { header: 'Total Roof Area (Sq.Ft)', accessor: (r) => r.area_roof ?? '' },
      { header: 'Free Space Solar (Sq.Ft)', accessor: (r) => r.free_space_solar ?? '' },
      { header: 'Free Space Inverter (Sq.Ft)', accessor: (r) => r.free_space_inverter ?? '' },
      { header: 'Earth Pit Position', accessor: (r) => r.earth_pit ?? '' },
      { header: 'Age of Building', accessor: (r) => r.building_age ?? '' },
      { header: 'Roof Access', accessor: (r) => r.roof_access ?? '' },
      { header: 'Rooftop Height', accessor: (r) => r.rooftop_height ?? '' },
      { header: 'Parapet Height', accessor: (r) => r.parapet_height ?? '' },
      { header: 'No. of Floors', accessor: (r) => r.floors_number ?? '' },
      { header: 'Water Source', accessor: (r) => r.water_source ?? '' },
      { header: 'Access to Site', accessor: (r) => r.site_access ?? '' },
      { header: 'Distance from Road', accessor: (r) => r.site_distance ?? '' },
      { header: 'Survey Status', accessor: (r) => (isSurveyDone(r) ? 'Done' : 'Pending') },
      {
        header: 'Verify Status',
        accessor: (r) =>
          verifyStatusNum(r) === 1 ? 'Approved' : verifyStatusNum(r) === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => getVerifyRemarks(r) ?? '' },
    ],
    []
  );

  const activeExportCols = useMemo(
    () => exportCols.filter((col) => !hiddenCols.includes(col.header)),
    [exportCols, hiddenCols]
  );

  const handleCopy = () => copyTableDataToClipboard(filteredSites, activeExportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols);
  const handlePdf = () => printTableData('Bihar SRT 200MW Survey', filteredSites, activeExportCols);

  const visibleTextCols = TEXT_COLS_BEFORE_MEDIA.filter((c) => isVisible(c.key));
  const surveyDonePct = kpis.total > 0 ? Math.round((kpis.complete / kpis.total) * 100) : 0;
  const verifyDonePct = kpis.total > 0 ? Math.round((kpis.verify_complete / kpis.total) * 100) : 0;

  /* Total column count for empty / loading rows */
  const colCount =
    1 + visibleTextCols.length + MEDIA_COLS.length + 1 +
    (isVisible('Survey Status') ? 1 : 0) +
    (isVisible('Verify Status') ? 1 : 0) +
    (isVisible('Verify Remarks') ? 1 : 0) + 1;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Bihar SRT 200 MW Survey"
        subtitle="View and manage Bihar 200MW Solar Rooftop site survey information"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'SRT 200MW' },
          { label: 'Survey Records' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/bihar/srt200mw-survey')}>
              <span className="ax-btn__label">+ Add Survey</span>
            </button>
          </div>
        }
      />

      {/* ── Feedback Alert ── */}
      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{feedbackMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedbackMsg.text}</div>
        </div>
      )}

      {/* ── 6 KPI Stat Cards (Static / Non-clickable, matching View Bihar SRT Installation) ── */}
      <div className="srt-kpi-grid">
        <KpiCard
          tone="accent"
          label="Total Assigned"
          value={loading ? '…' : kpis.total.toLocaleString('en-IN')}
          sub="Total assigned rooftop sites"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald"
          label="Survey Completed"
          value={loading ? '…' : kpis.complete.toLocaleString('en-IN')}
          sub="Survey work completed"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />
        <KpiCard
          tone="amber"
          label="Survey Pending"
          value={loading ? '…' : kpis.pending.toLocaleString('en-IN')}
          sub="Awaiting site survey"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KpiCard
          tone="cyan"
          label="Approve Sites"
          value={loading ? '…' : kpis.verify_complete.toLocaleString('en-IN')}
          sub="Verified & approved"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
        <KpiCard
          tone="danger"
          label="Reject Sites"
          value={loading ? '…' : kpis.verify_reject.toLocaleString('en-IN')}
          sub="Inspection rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
        <KpiCard
          tone="amber"
          label="Verify Pending"
          value={loading ? '…' : kpis.verify_pending.toLocaleString('en-IN')}
          sub="Awaiting verification"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact reference design) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT 200MW Survey Records">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Bihar SRT 200 MW Survey Records</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> records
              {' '}· Completed <b className="ax-num">{kpis.complete}</b> / {kpis.total} · Approved <b className="ax-num">{kpis.verify_complete}</b> · Pending Verify <b className="ax-num">{kpis.verify_pending}</b> · Rejected <b className="ax-num">{kpis.verify_reject}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="srt_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                id="srt_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by verification status"
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
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search site, CA no, person, meter…"
                size="sm"
                ariaLabel="Search survey records"
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

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SRT 200MW Survey Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  {visibleTextCols.map((c) => (
                    <th key={c.key} className="ax-table__th" scope="col">{c.th}</th>
                  ))}
                  {MEDIA_COLS.map((m) => (
                    <th key={m.field} className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>{m.th}</th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>PDF</th>
                  {isVisible('Survey Status') && <th className="ax-table__th" scope="col">Survey Status</th>}
                  {isVisible('Verify Status') && <th className="ax-table__th" scope="col">Verify Status</th>}
                  {isVisible('Verify Remarks') && <th className="ax-table__th" scope="col">Verify Remarks</th>}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading survey records…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={hasFilters ? 'No matching survey records' : 'No survey records found'}
                        message={
                          hasFilters
                            ? 'No survey records match your filters or search. Try clearing your query.'
                            : 'No survey records available.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagedSites.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>

                        {visibleTextCols.map((c) => (
                          <td key={c.key} className="ax-table__td" style={c.style}>{c.get(item)}</td>
                        ))}

                        {/* Images */}
                        {MEDIA_COLS.map((m) => (
                          <td key={m.field} className="ax-table__td" style={{ textAlign: 'center' }}>
                            <SurveyThumbnail
                              src={item[m.field]}
                              alt={m.alt}
                              onPreview={(url, title) =>
                                setPreviewImage({ url, title: `${item.site_name || item.uid || ''} - ${title}` })
                              }
                            />
                          </td>
                        ))}

                        {/* PDF */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.pdf_file ? (
                            <a
                              href={resolveSurveyFileUrl(item.pdf_file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              PDF ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>

                        {/* Survey Status */}
                        {isVisible('Survey Status') && (
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ${isSurveyDone(item) ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                              {isSurveyDone(item) ? 'Complete' : 'Pending'}
                            </span>
                          </td>
                        )}

                        {/* Verify Status */}
                        {isVisible('Verify Status') && (
                          <td className="ax-table__td">
                            <span
                              className={`ax-badge ax-badge--soft ${
                                verifyStatusNum(item) === 1
                                  ? 'ax-badge--success'
                                  : verifyStatusNum(item) === 2
                                  ? 'ax-badge--danger'
                                  : 'ax-badge--warning'
                              }`}
                            >
                              {verifyStatusNum(item) === 1 ? 'Approved' : verifyStatusNum(item) === 2 ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                        )}

                        {/* Verify Remarks */}
                        {isVisible('Verify Remarks') && <td className="ax-table__td">{getVerifyRemarks(item) || DASH}</td>}

                        {/* Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {verifyStatusNum(item) === 1 ? (
                            <span
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                fontWeight: 600,
                                opacity: 0.6,
                                cursor: 'not-allowed',
                              }}
                              title="Approved — editing is locked"
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Locked</span>
                            </span>
                          ) : (
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
                              onClick={() => navigate(`/v/bihar/srt200mw-survey?id=${item.id}`)}
                              title="Edit Survey Details"
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              <span>Edit</span>
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
                totalItems={filteredSites.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>

      {/* ── Image Preview Modal ── */}
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

export default Bihar_Survey_SRT200MW_ViewData;