import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoSurveyService,
  resolveJammuSurveyMediaUrl,
  getJammuSurveyMediaCandidates,
  type JammuRescoSurveyItem,
  type JammuRescoSurveyStats,
  type JammuRescoBosProductItem,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../../../common';

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
function SurveyThumbnail({
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
  const candidates = useMemo(() => getJammuSurveyMediaCandidates(src, 'resco_image'), [src]);
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

export const RESCO_SURVEY_HEADERS = [
  'Sr. No.',
  'Unique ID',
  'State',
  'District',
  'Division',
  'Sub Division',
  'Department',
  'Site Name',
  'Site Address',
  'CA No.',
  'Survey Address',
  'Nearest Landmark',
  'Agency Contact Person Name',
  'Agency Contact Number',
  'Nodal Person',
  'Nodal Person Contact',
  'Latitude',
  'Longitude',
  'Load Type',
  'Connection Phase',
  'Meter Connection Type',
  'Meter Number',
  'Meter Type',
  'Sanction Load (KW/KVA)',
  'Connected Load (KW)',
  'Grid Power Availability',
  'Three-Phase Availability',
  'Missing Phase',
  'LTDB Present',
  'Roof Condition',
  'Total Roof Area (Sq.Feet)',
  'Free Space for Solar Installation (in Sq.Feet)',
  'Free Space for Control Room/Inverter (in Sq.Feet)',
  'Earth Pit Position',
  'Age of Building',
  'Access to the Roof (Availability of Staircase)',
  'Rooftop Height (Feet)',
  'Parapet Height (Feet)',
  'No. of Floors (G+...)',
  'Water Source for Cleaning',
  'Access to Site',
  'Distance of Site from Main Road (km)',
  'Building Image',
  'Roof Image',
  'Control Room',
  'Meter',
  'Other Image',
  'PDF',
  'BOS Status',
  'BOS File',
  'BOS Remarks',
  'Action',
];

interface BosProductRow {
  product_id: number | '';
  quantity: number | '';
  unit: string;
  remarks: string;
}

export function View_Survey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<JammuRescoSurveyItem[]>([]);
  const [stats, setStats] = useState<JammuRescoSurveyStats>({ total: 0, complete: 0, pending: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [feasibleFilter, setFeasibleFilter] = useState('all');

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Modals state
  const [detailModalItem, setDetailModalItem] = useState<JammuRescoSurveyItem | null>(null);
  const [lightboxPreview, setLightboxPreview] = useState<{ url: string; title: string } | null>(null);

  // BOS File Upload Modal state (API 9: POST /jk/resco-bos-submit)
  const [bosModalItem, setBosModalItem] = useState<JammuRescoSurveyItem | null>(null);
  const [bosFile, setBosFile] = useState<File | null>(null);
  const [bosRemarks, setBosRemarks] = useState<string>('');
  const [submittingBos, setSubmittingBos] = useState(false);
  const bosFileInputRef = useRef<HTMLInputElement>(null);

  // BOS Products Modal state (API 10 & 11: GET & POST /jk/view-resco-survey-bos-product...)
  const [bosProductModalItem, setBosProductModalItem] = useState<JammuRescoSurveyItem | null>(null);
  const [availableProducts, setAvailableProducts] = useState<JammuRescoBosProductItem[]>([]);
  const [productRows, setProductRows] = useState<BosProductRow[]>([]);
  const [bosRequiredDate, setBosRequiredDate] = useState<string>('');
  const [bosSiteName, setBosSiteName] = useState<string>('');
  const [bosSiteLoad, setBosSiteLoad] = useState<string>('');
  const [bosVendorName, setBosVendorName] = useState<string>('');
  const [bosHeaderRemarks, setBosHeaderRemarks] = useState<string>('');
  const [loadingBosProducts, setLoadingBosProducts] = useState(false);
  const [savingBosProducts, setSavingBosProducts] = useState(false);

  // Download BOS PDF tracking
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  // Load Survey Records from API 5: GET /jk/view-resco-survey
  const loadSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await jammuRescoSurveyService.viewSurveys();
      setSurveys(Array.isArray(resp.resco) ? resp.resco : []);
      if (resp.$survey_detail || resp.survey_detail) {
        setStats(resp.$survey_detail || resp.survey_detail || { total: 0, complete: 0, pending: 0 });
      }
    } catch (err: any) {
      console.error('[Jammu Resco ViewSurveys] load error:', err);
      setSurveys([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load completed survey records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  // Unique Districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    surveys.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [surveys]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = surveys;

    if (districtFilter !== 'all') {
      list = list.filter((r) => (r.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    if (feasibleFilter !== 'all') {
      list = list.filter((r) => {
        const feas = (r.site_feasible || '').toLowerCase();
        if (feasibleFilter === 'feasible') return feas.includes('feasible') && !feas.includes('not');
        if (feasibleFilter === 'not_feasible') return feas.includes('not');
        return true;
      });
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
        const remarks = (r.survey_remarks || r.remarks || '').toLowerCase();
        return (
          idStr.includes(q) ||
          uidStr.toLowerCase().includes(q) ||
          site.includes(q) ||
          dist.includes(q) ||
          dept.includes(q) ||
          ca.includes(q) ||
          remarks.includes(q)
        );
      });
    }

    return list;
  }, [surveys, search, districtFilter, feasibleFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, feasibleFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || feasibleFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setFeasibleFilter('all');
    setPage(1);
  };

  // Top metric counts
  const bosSubmittedCount = surveys.filter((r) => Number(r.bos_status) === 1).length;

  // BOS File Submission (API 9: POST /jk/resco-bos-submit)
  const handleBosSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bosModalItem?.id) return;
    if (!bosFile) {
      setToastMsg({ type: 'danger', text: 'Please select a BOS file to upload.' });
      return;
    }

    try {
      setSubmittingBos(true);
      const fd = new FormData();
      fd.append('site_id', String(bosModalItem.id));
      fd.append('bos_file', bosFile);
      if (bosRemarks.trim()) {
        fd.append('bos_remarks', bosRemarks.trim());
      }

      const res = await jammuRescoSurveyService.submitBos(fd);
      setToastMsg({ type: 'success', text: res.message || 'BOS Submit Successfully!!!' });

      // Update locally
      setSurveys((prev) =>
        prev.map((item) => (item.id === bosModalItem.id ? { ...item, bos_status: 1, bos_remarks: bosRemarks } : item))
      );
      setBosModalItem(null);
      setBosFile(null);
      setBosRemarks('');
    } catch (err: any) {
      console.error('[View_Survey] submitBos error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to submit BOS file.' });
    } finally {
      setSubmittingBos(false);
    }
  };

  // Open BOS Products Modal (API 10: GET /jk/view-resco-survey-bos-product/{id})
  const handleOpenBosProducts = async (item: JammuRescoSurveyItem) => {
    setBosProductModalItem(item);
    setLoadingBosProducts(true);
    setProductRows([]);
    setBosRequiredDate('');
    setBosHeaderRemarks('');
    setBosSiteName(item.site_name || '');
    setBosSiteLoad(String(item.sanction_load || item.connected_load || ''));
    setBosVendorName(String(item.vendor_name || 'utkarsh'));

    try {
      const data = await jammuRescoSurveyService.getBosProductData(item.id);
      setAvailableProducts(Array.isArray(data.products) ? data.products : []);

      if (data.resco) {
        if (data.resco.site_name) setBosSiteName(data.resco.site_name);
        if (data.resco.sanction_load) setBosSiteLoad(String(data.resco.sanction_load));
      }

      // If existing materials in resco_bos
      if (data.resco_bos && Array.isArray(data.resco_bos.materials) && data.resco_bos.materials.length > 0) {
        setProductRows(
          data.resco_bos.materials.map((m: any) => ({
            product_id: m.product_id || (m.product?.id ?? ''),
            quantity: m.quantity || '',
            unit: m.unit || '',
            remarks: m.remarks || '',
          }))
        );
        if (data.resco_bos.req_date || data.resco_bos.required_date) {
          setBosRequiredDate(String(data.resco_bos.req_date || data.resco_bos.required_date).split('T')[0]);
        }
        if (data.resco_bos.remarks) {
          setBosHeaderRemarks(data.resco_bos.remarks);
        }
        if (data.resco_bos.vendor_name) {
          setBosVendorName(data.resco_bos.vendor_name);
        }
        if (data.resco_bos.site_name) {
          setBosSiteName(data.resco_bos.site_name);
        }
      } else {
        // Start with one empty row
        setProductRows([{ product_id: '', quantity: '', unit: '', remarks: '' }]);
      }
    } catch (err: any) {
      console.error('[View_Survey] getBosProductData error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load BOS product details.' });
      setProductRows([{ product_id: '', quantity: '', unit: '', remarks: '' }]);
    } finally {
      setLoadingBosProducts(false);
    }
  };

  // Save BOS Products (API 11: POST /jk/view-resco-survey-bos-product-store)
  const handleSaveBosProducts = async (e: FormEvent) => {
    e.preventDefault();
    if (!bosProductModalItem?.id) return;

    // Filter valid rows
    const validRows = productRows.filter((r) => r.product_id !== '' && Number(r.quantity) > 0);
    if (validRows.length === 0) {
      setToastMsg({ type: 'danger', text: 'Please add at least one product with quantity.' });
      return;
    }

    // Check duplicate products
    const pIds = validRows.map((r) => Number(r.product_id));
    if (new Set(pIds).size !== pIds.length) {
      setToastMsg({ type: 'danger', text: 'Duplicate products selected. Each product must be selected only once.' });
      return;
    }

    try {
      setSavingBosProducts(true);
      const payload = {
        site_id: bosProductModalItem.id,
        site_name: bosSiteName || bosProductModalItem.site_name,
        vendor_name: bosVendorName || undefined,
        required_date: bosRequiredDate || undefined,
        remarks: bosHeaderRemarks || undefined,
        products: validRows.map((r) => Number(r.product_id)),
        quantities: validRows.map((r) => Number(r.quantity)),
        units: validRows.map((r) => r.unit || 'Nos'),
        product_remarks: validRows.map((r) => r.remarks || ''),
      };

      const res = await jammuRescoSurveyService.storeBosProducts(payload);
      setToastMsg({ type: 'success', text: res.message || 'BOS Products Saved Successfully!' });
      setBosProductModalItem(null);
    } catch (err: any) {
      console.error('[View_Survey] storeBosProducts error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to save BOS products.' });
    } finally {
      setSavingBosProducts(false);
    }
  };

  // Download BOS PDF (API 12: GET /jk/view-resco-survey-bos-product-download/{id})
  const handleDownloadPdf = async (item: JammuRescoSurveyItem) => {
    if (downloadingPdfId === item.id) return;
    setDownloadingPdfId(item.id);
    try {
      await jammuRescoSurveyService.downloadBosPdf(item.id, item.site_name || `Site_${item.id}`);
      setToastMsg({ type: 'success', text: `Downloaded BOS PDF for ${item.site_name || item.id}` });
    } catch (err: any) {
      console.error('[View_Survey] downloadBosPdf error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to download BOS PDF. Ensure BOS is submitted.' });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO: View Completed Surveys"
        subtitle="Review certified rooftop solar surveys, manage Bill of Quantities (BOS), and download engineering PDF dossiers"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: 'View Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadSurveys}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/survey/resco/pending-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Conduct Survey</span>
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
          label="Total Survey Sites"
          value={(stats.total || surveys.length).toLocaleString('en-IN')}
          sub="Scope of RESCO projects"
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
          value={(stats.complete || surveys.length).toLocaleString('en-IN')}
          sub="Verified feasibility reports"
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
          label="BOS Submitted"
          value={bosSubmittedCount.toLocaleString('en-IN')}
          sub="Bill of materials enabled"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Completed RESCO Surveys Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Resco Survey Information</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{surveys.length}</span> records
              {' '}· Completed surveys across Jammu districts
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

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={feasibleFilter}
                onChange={(e) => setFeasibleFilter(e.target.value)}
              >
                <option value="all">All Feasibility</option>
                <option value="feasible">Feasible</option>
                <option value="not_feasible">Not Feasible</option>
              </select>

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
                placeholder="Search site, UID, dept…"
                size="sm"
                ariaLabel="Search surveys"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((r, i) =>
                      [
                        i + 1,
                        r.uid || r.srt_id || (r.id ? `RESCO-${r.id}` : '—'),
                        r.state || 'Jammu',
                        cleanText(r.district) || '—',
                        cleanText(r.division) || '—',
                        cleanText(r.sub_division) || '—',
                        cleanText(r.dept_name || r.department) || '—',
                        cleanText(r.site_name) || '—',
                        cleanText(r.site_address || r.address) || '—',
                        cleanText(r.ca_no) || '—',
                        cleanText(r.survey_site_address || r.site_address || r.address) || '—',
                        cleanText(r.near_landmark || r.landmark) || '—',
                        cleanText(r.agency_person_name || r.agency_contact_person) || '—',
                        cleanText(r.agency_person_contact || r.agency_contact_no) || '—',
                        cleanText(r.nodal_person) || '—',
                        cleanText(r.contact_nodal || r.nodal_person_contact) || '—',
                        cleanText(r.latitude) || '—',
                        cleanText(r.longitude) || '—',
                        cleanText(r.load_type) || '—',
                        cleanText(r.connection_phase) || '—',
                        cleanText(r.meter_connection || r.meter_connection_type) || '—',
                        cleanText(r.meter_number || r.meter_no) || '—',
                        cleanText(r.meter_type) || '—',
                        cleanText(r.sanction_load) || '—',
                        cleanText(r.connected_load || r.instantaneous_load) || '—',
                        cleanText(r.grid_power || r.grid_availability) || '—',
                        cleanText(r.all_3_phase_ltdb || r.three_phase_available) || '—',
                        cleanText(r.missing_phase) || '—',
                        cleanText(r.ltdb_present || r.ltdb_status) || '—',
                        cleanText(r.roof_condition) || '—',
                        cleanText(r.area_roof || r.roof_area) || '—',
                        cleanText(r.free_space_solar || r.solar_free_space) || '—',
                        cleanText(r.free_space_inverter || r.control_room_free_space) || '—',
                        cleanText(r.earth_pit || r.earth_pit_position) || '—',
                        cleanText(r.building_age) || '—',
                        cleanText(r.roof_access) || '—',
                        cleanText(r.rooftop_height) || '—',
                        cleanText(r.parapet_height) || '—',
                        cleanText(r.floors_number || r.number_of_floors) || '—',
                        cleanText(r.water_source) || '—',
                        cleanText(r.site_access) || '—',
                        cleanText(r.site_distance) || '—',
                        r.building_image ? resolveJammuSurveyMediaUrl(r.building_image, 'resco_image') : '—',
                        r.roof_image ? resolveJammuSurveyMediaUrl(r.roof_image, 'resco_image') : '—',
                        r.control_room_image ? resolveJammuSurveyMediaUrl(r.control_room_image, 'resco_image') : '—',
                        (r.image4 || r.meter_image) ? resolveJammuSurveyMediaUrl(r.image4 || r.meter_image, 'resco_image') : '—',
                        (r.image5 || r.other_image) ? resolveJammuSurveyMediaUrl(r.image5 || r.other_image, 'resco_image') : '—',
                        r.pdf ? resolveJammuSurveyMediaUrl(r.pdf, 'resco_pdf') : '—',
                        Number(r.bos_status) === 1 ? 'BOS Done' : 'BOS Pending',
                        r.bos_file ? resolveJammuSurveyMediaUrl(r.bos_file, 'resco_bos') : '—',
                        cleanText(r.bos_remarks) || '—',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    RESCO_SURVEY_HEADERS.filter((h) => h !== 'Action').join(','),
                    ...filtered.map((r, i) =>
                      [
                        `"${i + 1}"`,
                        `"${r.uid || r.srt_id || (r.id ? `RESCO-${r.id}` : '')}"`,
                        `"${r.state || 'Jammu'}"`,
                        `"${cleanText(r.district)}"`,
                        `"${cleanText(r.division)}"`,
                        `"${cleanText(r.sub_division)}"`,
                        `"${cleanText(r.dept_name || r.department)}"`,
                        `"${cleanText(r.site_name)}"`,
                        `"${cleanText(r.site_address || r.address)}"`,
                        `"${cleanText(r.ca_no)}"`,
                        `"${cleanText(r.survey_site_address || r.site_address || r.address)}"`,
                        `"${cleanText(r.near_landmark || r.landmark)}"`,
                        `"${cleanText(r.agency_person_name || r.agency_contact_person)}"`,
                        `"${cleanText(r.agency_person_contact || r.agency_contact_no)}"`,
                        `"${cleanText(r.nodal_person)}"`,
                        `"${cleanText(r.contact_nodal || r.nodal_person_contact)}"`,
                        `"${cleanText(r.latitude)}"`,
                        `"${cleanText(r.longitude)}"`,
                        `"${cleanText(r.load_type)}"`,
                        `"${cleanText(r.connection_phase)}"`,
                        `"${cleanText(r.meter_connection || r.meter_connection_type)}"`,
                        `"${cleanText(r.meter_number || r.meter_no)}"`,
                        `"${cleanText(r.meter_type)}"`,
                        `"${cleanText(r.sanction_load)}"`,
                        `"${cleanText(r.connected_load || r.instantaneous_load)}"`,
                        `"${cleanText(r.grid_power || r.grid_availability)}"`,
                        `"${cleanText(r.all_3_phase_ltdb || r.three_phase_available)}"`,
                        `"${cleanText(r.missing_phase)}"`,
                        `"${cleanText(r.ltdb_present || r.ltdb_status)}"`,
                        `"${cleanText(r.roof_condition)}"`,
                        `"${cleanText(r.area_roof || r.roof_area)}"`,
                        `"${cleanText(r.free_space_solar || r.solar_free_space)}"`,
                        `"${cleanText(r.free_space_inverter || r.control_room_free_space)}"`,
                        `"${cleanText(r.earth_pit || r.earth_pit_position)}"`,
                        `"${cleanText(r.building_age)}"`,
                        `"${cleanText(r.roof_access)}"`,
                        `"${cleanText(r.rooftop_height)}"`,
                        `"${cleanText(r.parapet_height)}"`,
                        `"${cleanText(r.floors_number || r.number_of_floors)}"`,
                        `"${cleanText(r.water_source)}"`,
                        `"${cleanText(r.site_access)}"`,
                        `"${cleanText(r.site_distance)}"`,
                        `"${r.building_image || ''}"`,
                        `"${r.roof_image || ''}"`,
                        `"${r.control_room_image || ''}"`,
                        `"${r.image4 || r.meter_image || ''}"`,
                        `"${r.image5 || r.other_image || ''}"`,
                        `"${r.pdf || ''}"`,
                        `"${Number(r.bos_status) === 1 ? 'BOS Done' : 'BOS Pending'}"`,
                        `"${r.bos_file || ''}"`,
                        `"${cleanText(r.bos_remarks)}"`,
                      ].join(',')
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'View_Resco_Survey_Information.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    RESCO_SURVEY_HEADERS.filter((h) => h !== 'Action').join('\t'),
                    ...filtered.map((r, i) =>
                      [
                        i + 1,
                        r.uid || r.srt_id || (r.id ? `RESCO-${r.id}` : '—'),
                        r.state || 'Jammu',
                        cleanText(r.district) || '—',
                        cleanText(r.division) || '—',
                        cleanText(r.sub_division) || '—',
                        cleanText(r.dept_name || r.department) || '—',
                        cleanText(r.site_name) || '—',
                        cleanText(r.site_address || r.address) || '—',
                        cleanText(r.ca_no) || '—',
                        cleanText(r.survey_site_address || r.site_address || r.address) || '—',
                        cleanText(r.near_landmark || r.landmark) || '—',
                        cleanText(r.agency_person_name || r.agency_contact_person) || '—',
                        cleanText(r.agency_person_contact || r.agency_contact_no) || '—',
                        cleanText(r.nodal_person) || '—',
                        cleanText(r.contact_nodal || r.nodal_person_contact) || '—',
                        cleanText(r.latitude) || '—',
                        cleanText(r.longitude) || '—',
                        cleanText(r.load_type) || '—',
                        cleanText(r.connection_phase) || '—',
                        cleanText(r.meter_connection || r.meter_connection_type) || '—',
                        cleanText(r.meter_number || r.meter_no) || '—',
                        cleanText(r.meter_type) || '—',
                        cleanText(r.sanction_load) || '—',
                        cleanText(r.connected_load || r.instantaneous_load) || '—',
                        cleanText(r.grid_power || r.grid_availability) || '—',
                        cleanText(r.all_3_phase_ltdb || r.three_phase_available) || '—',
                        cleanText(r.missing_phase) || '—',
                        cleanText(r.ltdb_present || r.ltdb_status) || '—',
                        cleanText(r.roof_condition) || '—',
                        cleanText(r.area_roof || r.roof_area) || '—',
                        cleanText(r.free_space_solar || r.solar_free_space) || '—',
                        cleanText(r.free_space_inverter || r.control_room_free_space) || '—',
                        cleanText(r.earth_pit || r.earth_pit_position) || '—',
                        cleanText(r.building_age) || '—',
                        cleanText(r.roof_access) || '—',
                        cleanText(r.rooftop_height) || '—',
                        cleanText(r.parapet_height) || '—',
                        cleanText(r.floors_number || r.number_of_floors) || '—',
                        cleanText(r.water_source) || '—',
                        cleanText(r.site_access) || '—',
                        cleanText(r.site_distance) || '—',
                        r.building_image || '—',
                        r.roof_image || '—',
                        r.control_room_image || '—',
                        r.image4 || r.meter_image || '—',
                        r.image5 || r.other_image || '—',
                        r.pdf || '—',
                        Number(r.bos_status) === 1 ? 'BOS Done' : 'BOS Pending',
                        r.bos_file || '—',
                        cleanText(r.bos_remarks) || '—',
                      ].join('\t')
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'View_Resco_Survey_Information.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                {RESCO_SURVEY_HEADERS.map((h) => (
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
                  <td colSpan={RESCO_SURVEY_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading survey records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={RESCO_SURVEY_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={hasFilters ? 'No records match your filters. Try clearing your query.' : 'No completed survey records found.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const uidDisplay = row.uid || row.srt_id || (row.id ? `RESCO-${row.id}` : '—');
                  const hasBos = Number(row.bos_status) === 1;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
                        {uidDisplay}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu'}</td>
                      <td className="ax-table__td"><b>{cleanText(row.district) || '—'}</b></td>
                      <td className="ax-table__td">{cleanText(row.division) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.sub_division) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.dept_name || row.department) || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {cleanText(row.site_name) || `Site #${row.id}`}
                      </td>
                      <td className="ax-table__td">{cleanText(row.site_address || row.address) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.ca_no) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.survey_site_address || row.site_address || row.address) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.near_landmark || row.landmark) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.agency_person_name || row.agency_contact_person) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.agency_person_contact || row.agency_contact_no) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.nodal_person) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.contact_nodal || row.nodal_person_contact) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.latitude) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.longitude) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.load_type) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.connection_phase) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.meter_connection || row.meter_connection_type) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.meter_number || row.meter_no) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.meter_type) || '—'}</td>
                      <td className="ax-table__td">{row.sanction_load ? `${row.sanction_load} kW` : '—'}</td>
                      <td className="ax-table__td">{row.connected_load ? `${row.connected_load} kW` : (row.instantaneous_load ? `${row.instantaneous_load} kW` : '—')}</td>
                      <td className="ax-table__td">{cleanText(row.grid_power || row.grid_availability) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.all_3_phase_ltdb || row.three_phase_available) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.missing_phase) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.ltdb_present || row.ltdb_status) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.roof_condition) || '—'}</td>
                      <td className="ax-table__td">{row.area_roof ? `${row.area_roof} sq.ft` : (row.roof_area ? `${row.roof_area} sq.ft` : '—')}</td>
                      <td className="ax-table__td">{row.free_space_solar ? `${row.free_space_solar} sq.ft` : (row.solar_free_space ? `${row.solar_free_space} sq.ft` : '—')}</td>
                      <td className="ax-table__td">{row.free_space_inverter ? `${row.free_space_inverter} sq.ft` : (row.control_room_free_space ? `${row.control_room_free_space} sq.ft` : '—')}</td>
                      <td className="ax-table__td">{cleanText(row.earth_pit || row.earth_pit_position) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.building_age) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.roof_access) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.rooftop_height) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.parapet_height) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.floors_number || row.number_of_floors) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.water_source) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.site_access) || '—'}</td>
                      <td className="ax-table__td">{cleanText(row.site_distance) || '—'}</td>

                      {/* Building Image */}
                      <td className="ax-table__td">
                        {row.building_image ? (
                          <SurveyThumbnail
                            src={row.building_image}
                            alt={`Building ${row.site_name}`}
                            onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                          />
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Roof Image */}
                      <td className="ax-table__td">
                        {row.roof_image ? (
                          <SurveyThumbnail
                            src={row.roof_image}
                            alt={`Roof ${row.site_name}`}
                            onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                          />
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Control Room */}
                      <td className="ax-table__td">
                        {row.control_room_image ? (
                          <SurveyThumbnail
                            src={row.control_room_image}
                            alt={`Control Room ${row.site_name}`}
                            onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                          />
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Meter */}
                      <td className="ax-table__td">
                        {(row.image4 || row.meter_image) ? (
                          <SurveyThumbnail
                            src={row.image4 || row.meter_image}
                            alt={`Meter ${row.site_name}`}
                            onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                          />
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Other Image */}
                      <td className="ax-table__td">
                        {(row.image5 || row.other_image) ? (
                          <SurveyThumbnail
                            src={row.image5 || row.other_image}
                            alt={`Other ${row.site_name}`}
                            onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                          />
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* PDF Report */}
                      <td className="ax-table__td">
                        {row.pdf ? (
                          <a
                            href={resolveJammuSurveyMediaUrl(row.pdf, 'resco_pdf')}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', padding: '2px 8px', fontSize: 11 }}
                            title="View Survey PDF"
                          >
                            📄 PDF
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* BOS Status */}
                      <td className="ax-table__td">
                        {hasBos ? (
                          <Badge tone="success">BOS Done</Badge>
                        ) : (
                          <Badge tone="warning">BOS Pending</Badge>
                        )}
                      </td>

                      {/* BOS File */}
                      <td className="ax-table__td">
                        {row.bos_file ? (
                          <a
                            href={resolveJammuSurveyMediaUrl(row.bos_file, 'resco_bos')}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', padding: '2px 8px', fontSize: 11 }}
                            title="View BOS File"
                          >
                            📁 File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* BOS Remarks */}
                      <td className="ax-table__td">{cleanText(row.bos_remarks) || '—'}</td>

                      {/* Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setDetailModalItem(row)}
                            title="View full survey details"
                            style={{ padding: '3px 7px', fontSize: 11 }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => navigate(`/v/jammu/survey/resco/pending-survey?editId=${row.id}`)}
                            title="Edit survey record"
                            style={{ padding: '3px 7px', fontSize: 11 }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => {
                              setBosModalItem(row);
                              setBosFile(null);
                              setBosRemarks(row.bos_remarks || '');
                            }}
                            title="Upload BOS document"
                            style={{ padding: '3px 7px', fontSize: 11 }}
                          >
                            BOS File
                          </button>

                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => handleOpenBosProducts(row)}
                            title="Configure BOS products"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            BOS Items
                          </button>

                          {hasBos && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              disabled={downloadingPdfId === row.id}
                              onClick={() => handleDownloadPdf(row)}
                              title="Download official BOS PDF dossier"
                              style={{ padding: '3px 7px', fontSize: 11, color: '#16a34a' }}
                            >
                              {downloadingPdfId === row.id ? '...' : 'PDF ⬇'}
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

      {/* ── View Survey Detail Modal ── */}
      {detailModalItem && (
        <Modal open onClose={() => setDetailModalItem(null)} labelledBy="survey-details-title" dialogClass="ax-modal__dialog--lg">
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="survey-details-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>RESCO Survey Dossier: {detailModalItem.site_name}</span>
              <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11 }}>
                #{detailModalItem.id}
              </span>
            </h2>
            <button type="button" className="ax-modal__close" onClick={() => setDetailModalItem(null)} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px', fontSize: 13, marginBottom: 16 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site UID</span>
                <b>{detailModalItem.uid || `RESCO-${detailModalItem.id}`}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State / District</span>
                <b>{detailModalItem.state || 'Jammu'} · {detailModalItem.district || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                <b>{cleanText(detailModalItem.dept_name || detailModalItem.department) || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Division / Sub-division</span>
                <b>{cleanText(detailModalItem.division)} / {cleanText(detailModalItem.sub_division)}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                <b>{cleanText(detailModalItem.ca_no) || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Survey Date</span>
                <b>{formatDate(detailModalItem.survey_date || detailModalItem.created_at)}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Agency Engineer</span>
                <b>{cleanText(detailModalItem.agency_person_name)} ({cleanText(detailModalItem.agency_person_contact)})</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Nodal Officer</span>
                <b>{cleanText(detailModalItem.nodal_person)} ({cleanText(detailModalItem.contact_nodal)})</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>GPS Coordinates</span>
                <b>{detailModalItem.latitude || '—'}, {detailModalItem.longitude || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Load Type / Phase</span>
                <b>{detailModalItem.load_type || '—'} / {detailModalItem.connection_phase || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction / Connected</span>
                <b>{detailModalItem.sanction_load || '—'} kW / {detailModalItem.connected_load || '—'} kW</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Meter No. & Type</span>
                <b>{cleanText(detailModalItem.meter_number)} ({cleanText(detailModalItem.meter_type)})</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Roof Area / Space</span>
                <b>{detailModalItem.area_roof || '—'} sq.ft (Solar: {detailModalItem.free_space_solar || '—'})</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Roof Condition & Access</span>
                <b>{detailModalItem.roof_condition || '—'} · {detailModalItem.roof_access || '—'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Feasibility Verdict</span>
                <Badge tone={!detailModalItem.site_feasible || !detailModalItem.site_feasible.toLowerCase().includes('not') ? 'success' : 'danger'}>
                  {detailModalItem.site_feasible || 'Feasible'}
                </Badge>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Remarks & Observations</span>
                <p style={{ margin: '4px 0 0 0', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  {cleanText(detailModalItem.survey_remarks || detailModalItem.remarks) || 'No remarks recorded.'}
                </p>
              </div>
            </div>

            {/* Photos Preview Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                Survey Photographic Documentation
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Building Front', src: detailModalItem.building_image },
                  { label: 'Rooftop Area', src: detailModalItem.roof_image },
                  { label: 'Control Room / LTDB', src: detailModalItem.control_room_image },
                  { label: 'Meter Photo', src: detailModalItem.image4 },
                  { label: 'Cable Routing', src: detailModalItem.image5 },
                ]
                  .filter((item) => item.src)
                  .map((item) => {
                    const u = resolveJammuSurveyMediaUrl(item.src, 'resco_image');
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
                const id = detailModalItem.id;
                setDetailModalItem(null);
                navigate(`/v/jammu/survey/resco/pending-survey?editId=${id}`);
              }}
            >
              Edit Survey ✎
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setDetailModalItem(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── BOS File Upload Modal (API 9: POST /jk/resco-bos-submit) ── */}
      {bosModalItem && (
        <Modal open onClose={() => setBosModalItem(null)} labelledBy="bos-modal-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleBosSubmit}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="bos-modal-title" style={{ fontSize: 15, fontWeight: 700 }}>
                Upload BOS Document for {bosModalItem.site_name}
              </h2>
              <button type="button" className="ax-modal__close" onClick={() => setBosModalItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Upload the certified Bill of Quantities (BOS) spreadsheet, PDF drawing, or signed schedule for Site #{bosModalItem.id}.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  BOS File Attachment (PDF, XLS, XLSX, JPG, PNG - Max 10MB) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  ref={bosFileInputRef}
                  type="file"
                  accept=".pdf,.xls,.xlsx,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setBosFile(e.target.files?.[0] || null)}
                />
                <div
                  onClick={() => bosFileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: 8,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                  }}
                >
                  {bosFile ? (
                    <div style={{ color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
                      📄 {bosFile.name} ({(bosFile.size / 1024).toFixed(0)} KB)
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>Click to select BOS file</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Accepted: PDF, Excel (.xls/.xlsx), Images</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  BOS Remarks
                </label>
                <textarea
                  className="ax-input"
                  style={{ width: '100%', height: 70, resize: 'vertical' }}
                  placeholder="Enter remarks or component notes…"
                  value={bosRemarks}
                  onChange={(e) => setBosRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setBosModalItem(null)}>
                Cancel
              </button>
              <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={submittingBos || !bosFile}>
                {submittingBos ? 'Submitting BOS…' : 'Submit BOS File'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── BOS Products Modal (API 10 & 11) ── */}
      {bosProductModalItem && (
        <Modal open onClose={() => setBosProductModalItem(null)} labelledBy="bos-product-modal-title" dialogClass="ax-modal__dialog--lg">
          <form onSubmit={handleSaveBosProducts}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="bos-product-modal-title" style={{ fontSize: 15, fontWeight: 700 }}>
                Configure BOS Products: {bosProductModalItem.site_name}
              </h2>
              <button type="button" className="ax-modal__close" onClick={() => setBosProductModalItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingBosProducts ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#2563eb' }}>
                  <span className="ax-spinner" /> Fetching available BOS product catalog & site materials…
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, margin: 0 }}>
                    * marked fields must be filled.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Product Required Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="ax-input"
                        style={{ width: '100%', height: 36 }}
                        value={bosRequiredDate}
                        onChange={(e) => setBosRequiredDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Site Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        style={{ width: '100%', height: 36 }}
                        placeholder="Site Name"
                        value={bosSiteName}
                        onChange={(e) => setBosSiteName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Site Load <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        style={{ width: '100%', height: 36 }}
                        placeholder="Site Load"
                        value={bosSiteLoad}
                        onChange={(e) => setBosSiteLoad(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        style={{ width: '100%', height: 36 }}
                        placeholder="Vendor Name"
                        value={bosVendorName}
                        onChange={(e) => setBosVendorName(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Remarks
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        style={{ width: '100%', height: 36 }}
                        placeholder="Remarks"
                        value={bosHeaderRemarks}
                        onChange={(e) => setBosHeaderRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        Products List ({productRows.length})
                      </span>
                      <button
                        type="button"
                        className="ax-btn ax-btn--secondary ax-btn--xs"
                        onClick={() =>
                          setProductRows((prev) => [...prev, { product_id: '', quantity: '', unit: '', remarks: '' }])
                        }
                      >
                        + Add Row
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <table className="ax-table" style={{ fontSize: 12, margin: 0 }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th style={{ minWidth: 220, padding: '8px 10px' }}>Product *</th>
                            <th style={{ width: 120, padding: '8px 10px' }}>Quantity *</th>
                            <th style={{ width: 140, padding: '8px 10px' }}>Unit *</th>
                            <th style={{ minWidth: 160, padding: '8px 10px' }}>Remarks</th>
                            <th style={{ width: 60, textAlign: 'center', padding: '8px 10px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productRows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td style={{ padding: '6px 10px' }}>
                                <select
                                  className="ax-input ax-input--sm"
                                  style={{ width: '100%', height: 32 }}
                                  value={row.product_id}
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setProductRows((prev) =>
                                      prev.map((r, i) => (i === rIdx ? { ...r, product_id: val } : r))
                                    );
                                  }}
                                  required
                                >
                                  <option value="">Select...</option>
                                  {availableProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  className="ax-input ax-input--sm"
                                  style={{ width: '100%', height: 32 }}
                                  placeholder="Quantity"
                                  value={row.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setProductRows((prev) =>
                                      prev.map((r, i) => (i === rIdx ? { ...r, quantity: val } : r))
                                    );
                                  }}
                                  required
                                />
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <select
                                  className="ax-input ax-input--sm"
                                  style={{ width: '100%', height: 32 }}
                                  value={row.unit}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductRows((prev) =>
                                      prev.map((r, i) => (i === rIdx ? { ...r, unit: val } : r))
                                    );
                                  }}
                                  required
                                >
                                  <option value="">Select Unit</option>
                                  <option value="Nos">Nos</option>
                                  <option value="Mtr">Mtr</option>
                                  <option value="Kg">Kg</option>
                                  <option value="Set">Set</option>
                                  <option value="Ltr">Ltr</option>
                                  <option value="Box">Box</option>
                                  <option value="Roll">Roll</option>
                                  <option value="Pkt">Pkt</option>
                                </select>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  className="ax-input ax-input--sm"
                                  style={{ width: '100%', height: 32 }}
                                  placeholder="Remarks"
                                  value={row.remarks}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductRows((prev) =>
                                      prev.map((r, i) => (i === rIdx ? { ...r, remarks: val } : r))
                                    );
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--ghost ax-btn--xs"
                                  style={{ color: '#ef4444', padding: '2px 6px' }}
                                  onClick={() => setProductRows((prev) => prev.filter((_, i) => i !== rIdx))}
                                  disabled={productRows.length <= 1}
                                  title="Delete row"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setBosProductModalItem(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingBosProducts || loadingBosProducts}
              >
                {savingBosProducts ? 'Saving BOS Products…' : 'Save BOS Products'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default View_Survey;
