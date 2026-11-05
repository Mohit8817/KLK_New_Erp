import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirSurveyItem,
  type KashmirSurveyDetailKpis,
} from '../../kashmir-services';
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

const DEFAULT_KPIS: KashmirSurveyDetailKpis = {
  total: 0,
  complete: 0,
  pending: 0,
};

type Row = KashmirSurveyItem;

/* ───────── KPI Card (same style as View Assigned SRT Installation) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

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
  sub: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--4" style={{ padding: '16px 20px', borderRadius: 12, transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  /* Image preview stage */
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component ───────── */
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
    <Modal open onClose={onClose} labelledBy="preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS, size 34) ── */
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  const url = getKashmirMediaUrl(src);

  return (
    <img
      src={url}
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
        margin: '0 auto',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── API value normalisers ─────────
 * Real API (GET survey view) mixes formats between records:
 *   - state is lowercase ("kashmir")
 *   - flags come as "1"/"0" in some rows and "Yes"/"No" in others
 *   - connection_type is "3" in some rows and "3 Phase" in others
 *   - roof_condition / roof_access / earth_pit: "0"/"1" or text
 *   - DG flag key is `existing_dg_set`, earth pit key is `earth_pit`, address key is `address`
 *   - survey_date is YYYY-MM-DD
 */
const norm = (v: unknown) => String(v ?? '').trim();

const cap = (v: unknown) => {
  const s = norm(v);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

// 1 / 0 / Yes / No  ->  Yes / No
const yn = (v: unknown) => {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'yes') return 'Yes';
  if (s === '0' || s === 'no') return 'No';
  return norm(v);
};

// "3" -> "3 Phase", "3 Phase" -> "3 Phase"
const phaseLabel = (v: unknown) => {
  const s = norm(v);
  return s === '1' || s === '3' ? `${s} Phase` : s;
};

const roofCondLabel = (v: unknown) => {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'feasiable' || s === 'feasible') return 'Feasible';
  if (s === '0' || s === 'not feasiable' || s === 'not feasible') return 'Not Feasible';
  return norm(v);
};

const earthPitLabel = (v: unknown) => {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'ok') return 'Ok';
  if (s === '0' || s === 'not ok') return 'Not Ok';
  return norm(v);
};

const roofAccessLabel = (v: unknown) => {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'available') return 'Available';
  if (s === '0' || s === 'not available') return 'Not Available';
  return norm(v);
};

const fmtDate = (v: unknown) => {
  const m = norm(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : norm(v);
};

const isDgYes = (r: Row) => yn((r as any).existing_dg_set ?? r.dg_set_available) || 'No';

/* ───────── Text columns (used for both table and export) ───────── */
type TextCol = { h: string; e: string; v: (r: Row) => string | number | null | undefined; minWidth?: number };

const TEXT_COLS: TextCol[] = [
  { h: 'State', e: 'State', v: (r) => cap(r.state) || 'Kashmir' },
  { h: 'District', e: 'District', v: (r) => r.district },
  { h: 'Department', e: 'Department', v: (r) => r.dept_name || r.department },
  { h: 'Site Name', e: 'Site Name', v: (r) => r.site_name, minWidth: 160 },
  { h: 'Site Address', e: 'Site Address', v: (r) => (r as any).address || r.site_address, minWidth: 180 },
  { h: 'CA No.', e: 'CA No.', v: (r) => r.ca_no },
  { h: 'Survey Address', e: 'Survey Address', v: (r) => r.survey_site_address, minWidth: 180 },
  { h: 'Nearest Landmark', e: 'Nearest Landmark', v: (r) => r.near_landmark },
  { h: 'Name Of Current Contact Person', e: 'Contact Person', v: (r) => r.contact_person },
  { h: 'Contact No', e: 'Contact No', v: (r) => r.contact_no },
  { h: 'Proposed Capacity (In KW)', e: 'Proposed Capacity (KW)', v: (r) => r.proposed_capacity },
  { h: 'Latitude', e: 'Latitude', v: (r) => r.latitude },
  { h: 'Longitude', e: 'Longitude', v: (r) => r.longitude },
  { h: 'Load Type', e: 'Load Type', v: (r) => r.load_type },
  { h: 'Connection Phase', e: 'Connection Phase', v: (r) => phaseLabel(r.connection_type) },
  { h: 'Meter Connection Type', e: 'Meter Connection Type', v: (r) => r.meter_connection_type },
  { h: 'Meter Number', e: 'Meter Number', v: (r) => r.meter_no || r.meter_number },
  { h: 'Sanction Load (KW/KVA)', e: 'Sanction Load (KW/KVA)', v: (r) => r.sanction_load },
  { h: 'Instantaneous/Corrected Load (KW)', e: 'Instantaneous Load (KW)', v: (r) => r.instantaneous_load },
  { h: 'Grid Availability', e: 'Grid Availability', v: (r) => yn(r.grid_availability) },
  { h: 'Is All Three Phase Available In LTDB', e: '3 Phase in LTDB', v: (r) => yn(r.three_phase_available) },
  { h: 'Missing Phase', e: 'Missing Phase', v: (r) => r.missing_phase },
  { h: 'LTDB Present', e: 'LTDB Present', v: (r) => yn(r.ltdb_status) },
  { h: 'Is Existing DG SET', e: 'Existing DG SET', v: (r) => isDgYes(r) },
  { h: 'Dg SET Capacity', e: 'DG SET Capacity', v: (r) => r.dg_set_capacity },
  { h: 'Dg SET Make', e: 'DG SET Make', v: (r) => r.dg_set_make },
  { h: 'Roof Condition', e: 'Roof Condition', v: (r) => roofCondLabel(r.roof_condition) },
  { h: 'Total Roof Area (Sq.Feet)', e: 'Total Roof Area (Sq.Feet)', v: (r) => r.roof_area },
  { h: 'Free Space for Solar Installation (in Sq.Feet)', e: 'Free Space Solar (Sq.Feet)', v: (r) => r.solar_free_space },
  { h: 'Free Space for Control Room/Inverter (in Sq.Feet)', e: 'Free Space Control Room', v: (r) => r.control_room_free_space },
  { h: 'Earth Pit Position', e: 'Earth Pit Position', v: (r) => earthPitLabel((r as any).earth_pit ?? r.earth_pit_position) },
  { h: 'Routing of AC Cable from System Area (mtr)', e: 'Routing AC Cable (mtr)', v: (r) => r.ac_cable_routing },
  { h: 'Type of Roof', e: 'Type of Roof', v: (r) => r.roof_type },
  { h: 'Type of Structure Required', e: 'Structure Required', v: (r) => r.structure_type },
  { h: 'Age Of Building', e: 'Age Of Building', v: (r) => r.building_age },
  { h: 'Access To The Roof', e: 'Access To Roof', v: (r) => roofAccessLabel(r.roof_access) },
  { h: 'Rooftop Height (mtr)', e: 'Rooftop Height (mtr)', v: (r) => r.rooftop_height },
  { h: 'Parapet Height (mtr)', e: 'Parapet Height (mtr)', v: (r) => r.parapet_height },
  { h: 'No. of Floors (G+...)', e: 'No. of Floors', v: (r) => r.number_of_floors },
  { h: 'Access To Site', e: 'Access To Site', v: (r) => r.site_access },
  { h: 'Distance Of Site From Main Road(km)', e: 'Distance From Main Road (km)', v: (r) => r.site_distance },
  { h: 'Survey Date', e: 'Survey Date', v: (r) => fmtDate((r as any).survey_date) },
];

// Sr. No. + Unique ID + text cols + 4 images + PDF + Action
const TOTAL_COLUMNS = 2 + TEXT_COLS.length + 4 + 1 + 1;

export function Kashmir_Survey_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [kpis, setKpis] = useState<KashmirSurveyDetailKpis>(DEFAULT_KPIS);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await kashmirSrtService.getSurveyView();
      setRows(resp.surveys || []);
      setKpis(resp.survey_detail || DEFAULT_KPIS);
    } catch (err: any) {
      console.error('Failed to load Kashmir surveys:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load survey data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.district && r.district.trim()) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (districtFilter !== 'all' && (r.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.uid && r.uid.toLowerCase().includes(q)) ||
        (r.site_name && r.site_name.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.ca_no && r.ca_no.toLowerCase().includes(q)) ||
        (r.contact_person && r.contact_person.toLowerCase().includes(q)) ||
        (r.contact_no && r.contact_no.includes(q))
      );
    });
  }, [rows, search, districtFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setCurrentPage(1);
  };

  // Running serial number (same as shown in table) for export
  const srMap = useMemo(() => new Map(filtered.map((r, i) => [r.id, i + 1])), [filtered]);

  // Export columns
  const exportColumns: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (r) => srMap.get(r.id) ?? '' },
      { header: 'Unique ID', accessor: (r) => r.uid || String(r.id) },
      ...TEXT_COLS.map((c) => ({ header: c.e, accessor: (r: Row) => String(c.v(r) ?? '') })),
    ],
    [srMap]
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Kashmir SRT 70MW Survey"
        subtitle="View Kashmir SRT Survey Information"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Survey' },
          { label: 'SRT 70MW Survey' },
          { label: 'View Data' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/kashmir/srt70mw/survey-add" className="ax-btn ax-btn--primary ax-btn--sm">
              <svg className="ax-btn__icon" {...ICON_PROPS}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="ax-btn__label">Add Survey</span>
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Surveys"
              value={Number(kpis.total || 0).toLocaleString('en-IN')}
              sub="All surveyed & assigned sites"
              icon={svg(
                <>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="2" />
                  <path d="M9 14l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Complete Surveys"
              value={Number(kpis.complete || 0).toLocaleString('en-IN')}
              sub="Survey data saved successfully"
              icon={svg(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Pending Surveys"
              value={Number(kpis.pending || 0).toLocaleString('en-IN')}
              sub="Survey pending submission"
              icon={svg(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </>
              )}
            />
          </>
        )}
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Kashmir SRT Survey Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">SURVEY RECORDS</span>
              <h2 className="ax-card__title">View Kashmir SRT Survey Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filtered.length} of {rows.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search site, UID, district…"
                  size="sm"
                  ariaLabel="Search surveys"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filtered, exportColumns)}
                  onExportCSV={() => exportDataToCSV('Kashmir_SRT_70MW_Surveys', filtered, exportColumns)}
                  onExportExcel={() => exportDataToExcel('Kashmir_SRT_70MW_Surveys', filtered, exportColumns)}
                  onExportPDF={() => printTableData('Kashmir SRT 70MW Survey Records', filtered, exportColumns)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 6000 }}
            >
              <caption className="ax-visually-hidden">View Kashmir SRT Survey Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Unique ID</th>
                  {TEXT_COLS.map((c) => (
                    <th
                      key={c.h}
                      className="ax-table__th"
                      scope="col"
                      style={c.minWidth ? { minWidth: c.minWidth } : undefined}
                    >
                      {c.h}
                    </th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Building Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Roof Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Control Room</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Other Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>PDF</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading survey data…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No Kashmir SRT 70MW survey records found.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => {
                    const pdf = r.pdf || r.pdf_file;
                    return (
                      <tr key={r.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.uid || String(r.id)}</td>
                        {TEXT_COLS.map((c) => {
                          const val = c.v(r);
                          const display = val === null || val === undefined || val === '' ? DASH : val;
                          return (
                            <td
                              key={c.h}
                              className="ax-table__td"
                              style={c.h === 'Site Name' ? { fontWeight: 600 } : undefined}
                            >
                              {display}
                            </td>
                          );
                        })}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={r.building_image || r.image1}
                            alt={`${r.site_name} - Building`}
                            onPreview={(url, title) => setPreview({ url, title })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={r.roof_image || r.image2}
                            alt={`${r.site_name} - Roof`}
                            onPreview={(url, title) => setPreview({ url, title })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={r.control_room_image || r.image3}
                            alt={`${r.site_name} - Control Room`}
                            onPreview={(url, title) => setPreview({ url, title })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={r.other_image || r.image4}
                            alt={`${r.site_name} - Other Photo`}
                            onPreview={(url, title) => setPreview({ url, title })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {pdf ? (
                            <a
                              href={getKashmirMediaUrl(pdf)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              PDF ↗
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ padding: '2px 10px', fontSize: 12 }}
                            onClick={() => navigate(`/v/kashmir/srt70mw/survey-add?id=${r.id}`)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Punjab-style: pagination only) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Image Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

export default Kashmir_Survey_ViewData;