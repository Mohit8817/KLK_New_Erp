import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  type ColumnDef,
} from '../../../../../common';

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
// API se survey_status string ("1") aa sakta hai, isliye Number() use kiya
const isSurveyDone = (r: Row) => Number(r.survey_status) === 1;
const verifyStatusNum = (r: Row) => Number(r.survey_verify_status);

/* ───────── KPI Card (same as SRT Claim Request) ───────── */
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

/* ───────── Responsive page CSS (same as SRT Claim Request) ───────── */
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

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

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

/* ───────── Image preview modal with zoom ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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

/* ── Table column config (same columns / order as before) ── */
interface TextCol { key: string; th: string; get: (r: Row) => ReactNode; style?: CSSProperties }

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

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

/* ── Robust Table Image: strict NO BORDER RADIUS ── */
function SurveyThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const candidates = useMemo(() => getSurveyImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border)',
        cursor: 'pointer',
        display: 'inline-block',
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

export function Bihar_Survey_SRT200MW_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpis, setKpis] = useState<SurveyDetailKpis>(DEFAULT_KPIS);
  const [sites, setSites] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Column Visibility
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (header: string) => !hiddenCols.includes(header);

  // Load survey view data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const resp = await biharSrt200mwService.getViewSurveyData();
      setKpis(resp.data.survey_detail || DEFAULT_KPIS);
      setSites((resp.data.srt200mw || []) as Row[]);
      if (!resp.data.srt200mw?.length) {
        setErrorMsg('No survey records found from server.');
      }
    } catch (err: any) {
      console.error('[Bihar SRT 200MW] Failed to load data:', err);
      setErrorMsg(err?.message || 'Failed to load survey records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Districts list for filter dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district) set.add(String(s.district).trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered sites (district + verify status + search)
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

  // Pagination
  const pagedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  // Export column definitions
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

  const toolbarColumns: ColumnDef[] = useMemo(
    () =>
      exportCols.map((c) => ({
        key: c.header,
        label: c.header,
        visible: !hiddenCols.includes(c.header),
      })),
    [exportCols, hiddenCols]
  );

  const toggleColumn = (key: string) => {
    setHiddenCols((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleCopy = () => copyTableDataToClipboard(filteredSites, activeExportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols);
  const handlePdf = () => printTableData('Bihar SRT 200MW Survey', filteredSites, activeExportCols);

  const visibleTextCols = TEXT_COLS_BEFORE_MEDIA.filter((c) => isVisible(c.key));
  const surveyDonePct = kpis.total > 0 ? Math.round((kpis.complete / kpis.total) * 100) : 0;
  const verifyDonePct = kpis.total > 0 ? Math.round((kpis.verify_complete / kpis.total) * 100) : 0;

  // Total column count for empty / loading rows
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
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/bihar/srt200mw-survey')}>
              {ICON_PLUS}
              <span className="ax-btn__label">Add Survey</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Summary Grid ── */}
      <div className="ax-dash-grid">
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Assigned"
              value={kpis.total.toLocaleString('en-IN')}
              sub={`${kpis.complete} surveyed · ${kpis.pending} remaining`}
              icon={svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Survey Completed"
              value={kpis.complete.toLocaleString('en-IN')}
              sub={`${surveyDonePct}% done · ${kpis.pending} pending`}
              icon={svg(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 13l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Verification Approved"
              value={kpis.verify_complete.toLocaleString('en-IN')}
              sub={`${verifyDonePct}% verified · ${kpis.verify_pending} pending`}
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="pink"
              label="Verification Rejected"
              value={kpis.verify_reject.toLocaleString('en-IN')}
              sub="Need re-survey / correction"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT 200MW Survey Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">SITE SURVEY</span>
              <h2 className="ax-card__title">Bihar SRT 200 MW Survey Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSites.length} of {sites.length} records
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
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
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by verification status"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {(search || districtFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearch('');
                      setDistrictFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
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
                  placeholder="Search site, district, UID..."
                  size="sm"
                  ariaLabel="Search survey records"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SRT 200MW Survey Records</caption>
              <thead>
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  {visibleTextCols.map((c) => (
                    <th key={c.key} className="ax-table__th" scope="col">{c.th}</th>
                  ))}
                  {MEDIA_COLS.map((m) => (
                    <th key={m.field} className="ax-table__th" scope="col">{m.th}</th>
                  ))}
                  <th className="ax-table__th" scope="col">PDF</th>
                  {isVisible('Survey Status') && <th className="ax-table__th" scope="col">Survey Status</th>}
                  {isVisible('Verify Status') && <th className="ax-table__th" scope="col">Verify Status</th>}
                  {isVisible('Verify Remarks') && <th className="ax-table__th" scope="col">Verify Remarks</th>}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      Loading survey records...
                    </td>
                  </tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState
                        title="No survey records found"
                        message={
                          search || districtFilter !== 'all' || statusFilter !== 'all'
                            ? 'No survey records match your filters. Try clearing them.'
                            : errorMsg || 'No survey records available.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagedSites.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.id || idx}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>

                        {visibleTextCols.map((c) => (
                          <td key={c.key} className="ax-table__td" style={c.style}>{c.get(item)}</td>
                        ))}

                        {/* Images (NO BORDER RADIUS) */}
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
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              📄 View PDF
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
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
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => navigate(`/v/bihar/srt200mw-survey?id=${item.id}`)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filteredSites.length}
                onChange={setCurrentPage}
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

      {/* ── Image Preview Modal with Zoom ── */}
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