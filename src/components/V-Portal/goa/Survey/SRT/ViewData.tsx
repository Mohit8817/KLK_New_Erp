import React, { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtSurveyService,
  getGoaSrtSurveyImageCandidates,
  type GoaSrtSurveyRecord,
  type GoaSrtSurveySummary,
} from '../../goa-services';
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

/* ───────── KPI Card (exact Bihar ULA Survey style) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' |'pink';

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
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',

        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
        {sub}
      </div>
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

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Dialog ───────── */
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

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="goa-survey-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="goa-survey-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading…</div>}
          {status === 'error' && <div className="ula-m-stage__msg">File could not be loaded. Try opening it in a new tab.</div>}
          {url.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={url}
              title={title}
              style={{ width: '100%', height: '100%', minHeight: 480, border: 'none' }}
              onLoad={() => setStatus('ready')}
              onError={() => setStatus('error')}
            />
          ) : (
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
          )}
        </div>
      </div>

      <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

/* ── Strict Table Thumbnail (NO BORDER RADIUS, same as Bihar ULA) ── */
function SurveyThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const candidates = useMemo(() => getGoaSrtSurveyImageCandidates(src), [src]);
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
      onClick={() => onPreview(currentUrl, alt)}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function Goa_Survey_SRT_ViewData() {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GoaSrtSurveySummary>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_pending: 0,
    verify_complete: 0,
    verify_reject: 0,
  });
  const [surveyList, setSurveyList] = useState<GoaSrtSurveyRecord[]>([]);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal preview states
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);
  const [selectedSurveyDetail, setSelectedSurveyDetail] = useState<GoaSrtSurveyRecord | null>(null);

  // Load survey data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goaSrtSurveyService.viewSurvey();
      setSummary(data.survey_detail);
      setSurveyList(data.srt);
    } catch (err: any) {
      console.warn('Error fetching survey data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // District list
  const districts = useMemo(() => {
    const set = new Set<string>();
    surveyList.forEach((item) => {
      if (item.district) set.add(item.district);
    });
    return Array.from(set).sort();
  }, [surveyList]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = surveyList;

    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district === districtFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'complete') {
        list = list.filter((r) => r.survey_status === 1);
      } else if (statusFilter === 'pending') {
        list = list.filter((r) => r.survey_status !== 1);
      } else if (statusFilter === 'approved') {
        list = list.filter((r) => r.survey_verify_status === 1);
      } else if (statusFilter === 'rejected') {
        list = list.filter((r) => r.survey_verify_status === 2);
      } else if (statusFilter === 'verify-pending') {
        list = list.filter((r) => r.survey_verify_status === 0 || r.survey_verify_status === null || r.survey_verify_status === undefined);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        return (
          String(item.id).toLowerCase().includes(q) ||
          (item.uid && item.uid.toLowerCase().includes(q)) ||
          (item.site_name && item.site_name.toLowerCase().includes(q)) ||
          (item.dept_name && item.dept_name.toLowerCase().includes(q)) ||
          (item.district && item.district.toLowerCase().includes(q)) ||
          (item.division && item.division.toLowerCase().includes(q)) ||
          (item.sub_division && item.sub_division.toLowerCase().includes(q)) ||
          (item.address && item.address.toLowerCase().includes(q)) ||
          (item.survey_address && item.survey_address.toLowerCase().includes(q)) ||
          (item.near_landmark && item.near_landmark.toLowerCase().includes(q)) ||
          (item.ca_no && item.ca_no.toLowerCase().includes(q)) ||
          (item.agency_person_name && item.agency_person_name.toLowerCase().includes(q)) ||
          (item.agency_person_contact && item.agency_person_contact.toLowerCase().includes(q)) ||
          (item.nodal_person && item.nodal_person.toLowerCase().includes(q)) ||
          (item.contact_nodal && item.contact_nodal.toLowerCase().includes(q)) ||
          (item.meter_number && item.meter_number.toLowerCase().includes(q)) ||
          (item.sanction_load && item.sanction_load.toLowerCase().includes(q)) ||
          (item.connected_load && item.connected_load.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [surveyList, districtFilter, statusFilter, searchQuery]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Export Columns
  const exportColumns: ExportColumn[] = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'uid', label: 'Unique ID' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'division', label: 'Division' },
    { key: 'sub_division', label: 'Sub Division' },
    { key: 'dept_name', label: 'Department' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'address', label: 'Site Address' },
    { key: 'ca_no', label: 'CA No.' },
    { key: 'survey_address', label: 'Survey Address' },
    { key: 'near_landmark', label: 'Nearest Landmark' },
    { key: 'agency_person_name', label: 'Agency Contact Person Name' },
    { key: 'agency_person_contact', label: 'Agency Contact Number' },
    { key: 'nodal_person', label: 'Nodal Person' },
    { key: 'contact_nodal', label: 'Nodal Person Contact' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'load_type', label: 'Load Type' },
    { key: 'connection_phase', label: 'Connection Phase' },
    { key: 'meter_connection', label: 'Meter Connection Type' },
    { key: 'meter_number', label: 'Meter Number' },
    { key: 'meter_type', label: 'Meter Type' },
    { key: 'sanction_load', label: 'Sanction Load (KW/KVA)' },
    { key: 'connected_load', label: 'Connected Load (KW)' },
    { key: 'grid_power', label: 'Grid Power Availability' },
    { key: 'all_3_phase_ltdb', label: 'Three-Phase Availability' },
    { key: 'missing_phase', label: 'Missing Phase' },
    { key: 'ltdb_present', label: 'LTDB Present' },
    { key: 'roof_condition', label: 'Roof Condition' },
    { key: 'area_roof', label: 'Total Roof Area (Sq.Feet)' },
    { key: 'free_space_solar', label: 'Free Space for Solar Installation (in Sq.Feet)' },
    { key: 'free_space_inverter', label: 'Free Space for Control Room/Inverter (in Sq.Feet)' },
    { key: 'earth_pit', label: 'Earth Pit Position' },
    { key: 'building_age', label: 'Age of Building' },
    { key: 'roof_access', label: 'Access to the Roof (Availability of Staircase)' },
    { key: 'rooftop_height', label: 'Rooftop Height (Feet)' },
    { key: 'parapet_height', label: 'Parapet Height (Feet)' },
    { key: 'floors_number', label: 'No. of Floors (G+...)' },
    { key: 'water_source', label: 'Water Source for Cleaning' },
    { key: 'site_access', label: 'Access to Site' },
    { key: 'site_distance', label: 'Distance of Site from Main Road (km)' },
    { key: 'survey_status_label', label: 'Survey Status' },
    { key: 'verify_status_label', label: 'Verify Status' },
    { key: 'verify_remarks', label: 'Verify Remarks' },
  ];

  const exportData = useMemo(() => {
    return filteredRows.map((r, idx) => ({
      srNo: idx + 1,
      uid: r.uid || DASH,
      state: r.state || 'Goa',
      district: r.district || DASH,
      division: r.division || DASH,
      sub_division: r.sub_division || DASH,
      dept_name: r.dept_name || DASH,
      site_name: r.site_name || DASH,
      address: r.address || DASH,
      ca_no: r.ca_no || DASH,
      survey_address: r.survey_address || DASH,
      near_landmark: r.near_landmark || DASH,
      agency_person_name: r.agency_person_name || DASH,
      agency_person_contact: r.agency_person_contact || DASH,
      nodal_person: r.nodal_person || DASH,
      contact_nodal: r.contact_nodal || DASH,
      latitude: r.latitude ?? DASH,
      longitude: r.longitude ?? DASH,
      load_type: r.load_type || DASH,
      connection_phase: r.connection_phase || DASH,
      meter_connection: r.meter_connection || DASH,
      meter_number: r.meter_number || DASH,
      meter_type: r.meter_type || DASH,
      sanction_load: r.sanction_load || DASH,
      connected_load: r.connected_load || DASH,
      grid_power: r.grid_power || DASH,
      all_3_phase_ltdb: r.all_3_phase_ltdb || DASH,
      missing_phase: r.missing_phase || DASH,
      ltdb_present: r.ltdb_present || DASH,
      roof_condition: r.roof_condition || DASH,
      area_roof: r.area_roof || DASH,
      free_space_solar: r.free_space_solar || DASH,
      free_space_inverter: r.free_space_inverter || DASH,
      earth_pit: r.earth_pit || DASH,
      building_age: r.building_age || DASH,
      roof_access: r.roof_access || DASH,
      rooftop_height: r.rooftop_height || DASH,
      parapet_height: r.parapet_height || DASH,
      floors_number: r.floors_number || DASH,
      water_source: r.water_source || DASH,
      site_access: r.site_access || DASH,
      site_distance: r.site_distance || DASH,
      survey_status_label: r.survey_status === 1 ? 'Done' : 'Pending',
      verify_status_label:
        r.survey_verify_status === 1 ? 'Approved' : r.survey_verify_status === 2 ? 'Rejected' : 'Pending',
      verify_remarks: r.verify_remarks || DASH,
    }));
  }, [filteredRows]);

  const hasFilters = searchQuery || districtFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const openPreview = (url: string, title: string) => setPreviewMedia({ url, title });

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Welcome to, Goa SRT Survey"
        subtitle="View Goa SRT Survey Information"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Survey' },
          { label: 'View Goa SRT Survey' },
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/goa/srt-survey')}>
              {ICON_PLUS}
              <span className="ax-btn__label">+ Add Survey</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards (matching Goa Survey portal: Total Assign | Survey Status | Survey Verify Status) */}
      {loading ? (
        <KpiSkeleton count={3} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          {/* Card 1: Total Assign */}
          <KpiCard
            tone="accent"
            label="Total Assign"
            value={
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  role="button"
                  tabIndex={0}
                  title="Show all records"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'all' ? 'var(--ax-accent)' : 'inherit',

                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.total.toLocaleString('en-IN')}
                </span>
              </div>
            }
            sub={
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'all' ? 700 : 500,
                    color: statusFilter === 'all' ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
                  }}
                >
                  All Assigned Sites
                </span>
              </div>
            }
            active={statusFilter === 'all'}
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            icon={svg(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />

          {/* Card 2: Survey Status: Complete / Pending */}
          <KpiCard
            tone="emerald"
            label="Survey Status"
            value={
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  role="button"
                  tabIndex={0}
                  title="Filter by Complete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('complete');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'complete' ? 'var(--ax-viz-emerald, #10b981)' : 'inherit',

                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.complete.toLocaleString('en-IN')}
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', fontWeight: 400, opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  title="Filter by Pending"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('pending');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'pending' ? 'var(--ax-viz-amber, #f59e0b)' : 'inherit',

                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.pending.toLocaleString('en-IN')}
                </span>
              </div>
            }
            sub={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('complete');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'complete' ? 700 : 500,
                    color: statusFilter === 'complete' ? 'var(--ax-viz-emerald, #10b981)' : 'var(--ax-text-muted)',
                  }}
                >
                  Complete
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('pending');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'pending' ? 700 : 500,
                    color: statusFilter === 'pending' ? 'var(--ax-viz-amber, #f59e0b)' : 'var(--ax-text-muted)',
                  }}
                >
                  Pending
                </span>
              </div>
            }
            active={statusFilter === 'complete' || statusFilter === 'pending'}
            onClick={() => {
              if (statusFilter !== 'complete' && statusFilter !== 'pending') {
                setStatusFilter('complete');
                setCurrentPage(1);
              }
            }}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />

          {/* Card 3: Survey Verify Status: Pending / Verify / Reject */}
          <KpiCard
            tone="amber"
            label="Survey Verify Status"
            value={
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  role="button"
                  tabIndex={0}
                  title="Filter by Pending Verification"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('verify-pending');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'verify-pending' ? 'var(--ax-viz-amber, #f59e0b)' : 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.verify_pending.toLocaleString('en-IN')}
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', fontWeight: 400, opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  title="Filter by Verified (Approved)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('approved');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'approved' ? 'var(--ax-viz-emerald, #10b981)' : 'inherit',

                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.verify_complete.toLocaleString('en-IN')}
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', fontWeight: 400, opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  title="Filter by Rejected"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('rejected');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: statusFilter === 'rejected' ? 'var(--ax-viz-pink, #ef4444)' : 'inherit',

                    transition: 'all 0.15s ease',
                  }}
                >
                  {summary.verify_reject.toLocaleString('en-IN')}
                </span>
              </div>
            }
            sub={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('verify-pending');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'verify-pending' ? 700 : 500,
                    color: statusFilter === 'verify-pending' ? 'var(--ax-viz-amber, #f59e0b)' : 'var(--ax-text-muted)',
                  }}
                >
                  Pending
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('approved');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'approved' ? 700 : 500,
                    color: statusFilter === 'approved' ? 'var(--ax-viz-emerald, #10b981)' : 'var(--ax-text-muted)',
                  }}
                >
                  Verify
                </span>
                <span style={{ color: 'var(--ax-text-subtle)', opacity: 0.5 }}>/</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('rejected');
                    setCurrentPage(1);
                  }}
                  style={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'rejected' ? 700 : 500,
                    color: statusFilter === 'rejected' ? 'var(--ax-viz-pink, #ef4444)' : 'var(--ax-text-muted)',
                  }}
                >
                  Reject
                </span>
              </div>
            }
            active={statusFilter === 'verify-pending' || statusFilter === 'approved' || statusFilter === 'rejected'}
            onClick={() => {
              if (statusFilter !== 'verify-pending' && statusFilter !== 'approved' && statusFilter !== 'rejected') {
                setStatusFilter('verify-pending');
                setCurrentPage(1);
              }
            }}
            icon={svg(
              <>
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />
        </div>
      )}

      {/* Main Table Card */}
      <section className="ax-card ax-col--12" role="region" aria-label="Goa SRT Survey Records">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">SITE SURVEY</span>
            <h2 className="ax-card__title">View Goa SRT Survey Information</h2>
            <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filteredRows.length} of {surveyList.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
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
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="complete">Survey Done</option>
                <option value="pending">Survey Pending</option>
                <option value="approved">Verify Approved</option>
                <option value="verify-pending">Verify Pending</option>
                <option value="rejected">Verify Rejected</option>
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
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                size="sm"
                ariaLabel="Search survey records"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(exportColumns, exportData)}
                onExportCSV={() => exportDataToCSV(exportColumns, exportData, 'Goa_SRT_Survey_List.csv')}
                onExportExcel={() => exportDataToExcel(exportColumns, exportData, 'Goa_SRT_Survey_List.xlsx')}
                onExportPDF={() => printTableData(exportColumns, exportData, 'View Goa SRT Survey Information')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <caption className="ax-visually-hidden">View Goa SRT Survey Information</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Unique ID</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Division</th>
                <th className="ax-table__th" scope="col">Sub Division</th>
                <th className="ax-table__th" scope="col">Department</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Site Address</th>
                <th className="ax-table__th" scope="col">CA No.</th>
                <th className="ax-table__th" scope="col">Survey Address</th>
                <th className="ax-table__th" scope="col">Nearest Landmark</th>
                <th className="ax-table__th" scope="col">Agency Contact Person Name</th>
                <th className="ax-table__th" scope="col">Agency Contact Number</th>
                <th className="ax-table__th" scope="col">Nodal Person</th>
                <th className="ax-table__th" scope="col">Nodal Person Contact</th>
                <th className="ax-table__th" scope="col">Latitude</th>
                <th className="ax-table__th" scope="col">Longitude</th>
                <th className="ax-table__th" scope="col">Load Type</th>
                <th className="ax-table__th" scope="col">Connection Phase</th>
                <th className="ax-table__th" scope="col">Meter Connection Type</th>
                <th className="ax-table__th" scope="col">Meter Number</th>
                <th className="ax-table__th" scope="col">Meter Type</th>
                <th className="ax-table__th" scope="col">Sanction Load (KW/KVA)</th>
                <th className="ax-table__th" scope="col">Connected Load (KW)</th>
                <th className="ax-table__th" scope="col">Grid Power Availability</th>
                <th className="ax-table__th" scope="col">Three-Phase Availability</th>
                <th className="ax-table__th" scope="col">Missing Phase</th>
                <th className="ax-table__th" scope="col">LTDB Present</th>
                <th className="ax-table__th" scope="col">Roof Condition</th>
                <th className="ax-table__th" scope="col">Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th" scope="col">Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th" scope="col">Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th" scope="col">Earth Pit Position</th>
                <th className="ax-table__th" scope="col">Age of Building</th>
                <th className="ax-table__th" scope="col">Access to the Roof (Availability of Staircase)</th>
                <th className="ax-table__th" scope="col">Rooftop Height (Feet)</th>
                <th className="ax-table__th" scope="col">Parapet Height (Feet)</th>
                <th className="ax-table__th" scope="col">No. of Floors (G+...)</th>
                <th className="ax-table__th" scope="col">Water Source for Cleaning</th>
                <th className="ax-table__th" scope="col">Access to Site</th>
                <th className="ax-table__th" scope="col">Distance of Site from Main Road (km)</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th" scope="col">Survey Status</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col">Verify Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={51} style={{ textAlign: 'center', padding: 32 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading survey records…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={51} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={hasFilters ? 'No records match your query. Try clearing filters.' : 'Survey records will appear here.'}
                      query={searchQuery}
                      onClear={resetFilters}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                pagedRows.map((row, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.uid || DASH}</td>
                      <td className="ax-table__td">{row.state || 'Goa'}</td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.division || DASH}</td>
                      <td className="ax-table__td">{row.sub_division || DASH}</td>
                      <td className="ax-table__td">{row.dept_name || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.address || DASH}</td>
                      <td className="ax-table__td">{row.ca_no || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.survey_address || DASH}</td>
                      <td className="ax-table__td">{row.near_landmark || DASH}</td>
                      <td className="ax-table__td">{row.agency_person_name || DASH}</td>
                      <td className="ax-table__td">{row.agency_person_contact || DASH}</td>
                      <td className="ax-table__td">{row.nodal_person || DASH}</td>
                      <td className="ax-table__td">{row.contact_nodal || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{row.latitude ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{row.longitude ?? DASH}</td>
                      <td className="ax-table__td">{row.load_type || DASH}</td>
                      <td className="ax-table__td">{row.connection_phase || DASH}</td>
                      <td className="ax-table__td">{row.meter_connection || DASH}</td>
                      <td className="ax-table__td">{row.meter_number || DASH}</td>
                      <td className="ax-table__td">{row.meter_type || DASH}</td>
                      <td className="ax-table__td">{row.sanction_load || DASH}</td>
                      <td className="ax-table__td">{row.connected_load || DASH}</td>
                      <td className="ax-table__td">{row.grid_power || DASH}</td>
                      <td className="ax-table__td">{row.all_3_phase_ltdb || DASH}</td>
                      <td className="ax-table__td">{row.missing_phase || DASH}</td>
                      <td className="ax-table__td">{row.ltdb_present || DASH}</td>
                      <td className="ax-table__td">{row.roof_condition || DASH}</td>
                      <td className="ax-table__td">{row.area_roof || DASH}</td>
                      <td className="ax-table__td">{row.free_space_solar || DASH}</td>
                      <td className="ax-table__td">{row.free_space_inverter || DASH}</td>
                      <td className="ax-table__td">{row.earth_pit || DASH}</td>
                      <td className="ax-table__td">{row.building_age || DASH}</td>
                      <td className="ax-table__td">{row.roof_access || DASH}</td>
                      <td className="ax-table__td">{row.rooftop_height || DASH}</td>
                      <td className="ax-table__td">{row.parapet_height || DASH}</td>
                      <td className="ax-table__td">{row.floors_number || DASH}</td>
                      <td className="ax-table__td">{row.water_source || DASH}</td>
                      <td className="ax-table__td">{row.site_access || DASH}</td>
                      <td className="ax-table__td">{row.site_distance || DASH}</td>

                      {/* Photo Columns (Strict NO BORDER RADIUS) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail
                          src={row.image1}
                          alt={`${row.site_name} - Building Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail
                          src={row.image2}
                          alt={`${row.site_name} - Roof Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail
                          src={row.image3}
                          alt={`${row.site_name} - Control Room Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail
                          src={row.image4}
                          alt={`${row.site_name} - Other Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.pdf_file ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openPreview(getGoaSrtSurveyImageCandidates(row.pdf_file)[0] || row.pdf_file!, `${row.site_name} - PDF`)}
                          >
                            📄 PDF
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)', fontSize: '11px' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Survey Status */}
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ${row.survey_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {row.survey_status === 1 ? 'Done' : 'Pending'}
                        </span>
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td">
                        <span
                          className={`ax-badge ax-badge--soft ${
                            row.survey_verify_status === 1
                              ? 'ax-badge--success'
                              : row.survey_verify_status === 2
                              ? 'ax-badge--danger'
                              : 'ax-badge--warning'
                          }`}
                        >
                          {row.survey_verify_status === 1 ? 'Approved' : row.survey_verify_status === 2 ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      <td className="ax-table__td">{row.verify_remarks || DASH}</td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setSelectedSurveyDetail(row)}
                          >
                            View
                          </button>
                          <Link
                            to={`/v/goa/srt-survey?id=${row.id}`}
                            className="ax-btn ax-btn--primary ax-btn--xs"
                          >
                            Edit
                          </Link>
                        </div>
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
              totalPages={totalPages}
              totalItems={filteredRows.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </section>

      {/* Image Preview Modal */}
      {previewMedia && (
        <ImagePreviewModal
          url={previewMedia.url}
          title={previewMedia.title}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {/* Detail Modal */}
      {selectedSurveyDetail && (
        <Modal
          open
          onClose={() => setSelectedSurveyDetail(null)}
          labelledBy="goa-survey-detail-title"
          dialogClass="ax-modal__dialog--lg"
        >
          <div className="ax-modal__header">
            <div>
              <h3 className="ax-modal__title" id="goa-survey-detail-title">
                {selectedSurveyDetail.site_name}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                UID: {selectedSurveyDetail.uid || DASH} · CA No: {selectedSurveyDetail.ca_no || DASH}
              </p>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setSelectedSurveyDetail(null)} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13 }}>
              <div><strong>State:</strong> {selectedSurveyDetail.state || 'Goa'}</div>
              <div><strong>District:</strong> {selectedSurveyDetail.district || DASH}</div>
              <div><strong>Division:</strong> {selectedSurveyDetail.division || DASH}</div>
              <div><strong>Sub Division:</strong> {selectedSurveyDetail.sub_division || DASH}</div>
              <div><strong>Department:</strong> {selectedSurveyDetail.dept_name || DASH}</div>
              <div><strong>Site Address:</strong> {selectedSurveyDetail.address || DASH}</div>
              <div><strong>Survey Address:</strong> {selectedSurveyDetail.survey_address || DASH}</div>
              <div><strong>Nearest Landmark:</strong> {selectedSurveyDetail.near_landmark || DASH}</div>
              <div><strong>Agency Contact:</strong> {selectedSurveyDetail.agency_person_name} ({selectedSurveyDetail.agency_person_contact})</div>
              <div><strong>Nodal Contact:</strong> {selectedSurveyDetail.nodal_person} ({selectedSurveyDetail.contact_nodal})</div>
              <div><strong>Coordinates:</strong> {selectedSurveyDetail.latitude}, {selectedSurveyDetail.longitude}</div>
              <div><strong>Load Type:</strong> {selectedSurveyDetail.load_type}</div>
              <div><strong>Phase:</strong> {selectedSurveyDetail.connection_phase}</div>
              <div><strong>Meter Connection:</strong> {selectedSurveyDetail.meter_connection}</div>
              <div><strong>Meter Number:</strong> {selectedSurveyDetail.meter_number}</div>
              <div><strong>Meter Type:</strong> {selectedSurveyDetail.meter_type}</div>
              <div><strong>Sanction Load:</strong> {selectedSurveyDetail.sanction_load}</div>
              <div><strong>Connected Load:</strong> {selectedSurveyDetail.connected_load}</div>
              <div><strong>Grid Power:</strong> {selectedSurveyDetail.grid_power}</div>
              <div><strong>3-Phase Available:</strong> {selectedSurveyDetail.all_3_phase_ltdb}</div>
              <div><strong>Missing Phase:</strong> {selectedSurveyDetail.missing_phase}</div>
              <div><strong>LTDB Present:</strong> {selectedSurveyDetail.ltdb_present}</div>
              <div><strong>Roof Condition:</strong> {selectedSurveyDetail.roof_condition}</div>
              <div><strong>Roof Area:</strong> {selectedSurveyDetail.area_roof} Sq.Ft.</div>
              <div><strong>Free Solar Space:</strong> {selectedSurveyDetail.free_space_solar} Sq.Ft.</div>
              <div><strong>Free Inverter Space:</strong> {selectedSurveyDetail.free_space_inverter} Sq.Ft.</div>
              <div><strong>Earth Pit:</strong> {selectedSurveyDetail.earth_pit}</div>
              <div><strong>Building Age:</strong> {selectedSurveyDetail.building_age}</div>
              <div><strong>Roof Access:</strong> {selectedSurveyDetail.roof_access}</div>
              <div><strong>Rooftop Height:</strong> {selectedSurveyDetail.rooftop_height} Ft.</div>
              <div><strong>Parapet Height:</strong> {selectedSurveyDetail.parapet_height} Ft.</div>
              <div><strong>Floors:</strong> {selectedSurveyDetail.floors_number}</div>
              <div><strong>Water Source:</strong> {selectedSurveyDetail.water_source}</div>
              <div><strong>Site Access:</strong> {selectedSurveyDetail.site_access}</div>
              <div><strong>Distance from Road:</strong> {selectedSurveyDetail.site_distance} km</div>
              <div><strong>Site Feasible:</strong> {selectedSurveyDetail.site_feasible}</div>
              <div><strong>Survey Date:</strong> {selectedSurveyDetail.survey_date || DASH}</div>
              <div style={{ gridColumn: 'span 3' }}><strong>Survey Remarks:</strong> {selectedSurveyDetail.survey_remarks || DASH}</div>
            </div>
          </div>

          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedSurveyDetail(null)}>Close</button>
            <Link to={`/v/goa/srt-survey?id=${selectedSurveyDetail.id}`} className="ax-btn ax-btn--primary">
              Edit Survey
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Goa_Survey_SRT_ViewData;