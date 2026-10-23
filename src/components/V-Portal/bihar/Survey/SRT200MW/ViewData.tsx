import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
  type SurveyDetailKpis,
} from '../../../../../services/biharSrt200mwService';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
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

/* ── Styles: light table polish only ── */
const VIEW_CSS = `
.bsv-page .ax-card__header { background: var(--ax-surface-subtle); border-bottom: 1px solid var(--ax-border-subtle); }
.bsv-page .ax-table__th { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted); background: var(--ax-surface-subtle); }
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); }
`;

/* ───────── KPI card (same as ULA Dashboard) ───────── */
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
  icon, tone, label, value, unit, sub, badge,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; unit?: string; sub: string; badge?: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card ax-col--4"
      role="region"
      aria-label={label}
      style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
            {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Table column config (same columns / order as before) ── */
interface TextCol { key: string; th: string; get: (r: Row) => ReactNode; style?: CSSProperties }

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const TEXT_COLS_BEFORE_MEDIA: TextCol[] = [
  { key: 'Unique ID', th: 'Unique ID', get: (r) => txt(r.uid), style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  { key: 'State', th: 'State', get: (r) => r.state || 'Bihar' },
  { key: 'District', th: 'District', get: (r) => txt(r.district) },
  { key: 'Division', th: 'Division', get: (r) => txt(r.division) },
  { key: 'Sub Division', th: 'Sub Division', get: (r) => txt(r.sub_division) },
  { key: 'Department', th: 'Department', get: (r) => txt(getDept(r)) },
  { key: 'Site Name', th: 'Site Name', get: (r) => txt(r.site_name), style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Site Address', th: 'Site Address', get: (r) => txt(r.address) },
  { key: 'CA No.', th: 'CA No.', get: (r) => txt(r.ca_no) },
  { key: 'Survey Address', th: 'Survey Address', get: (r) => txt(r.survey_address) },
  { key: 'Nearest Landmark', th: 'Nearest Landmark', get: (r) => txt(r.near_landmark) },
  { key: 'Agency Contact Person', th: 'Agency Contact Person', get: (r) => txt(r.agency_person_name) },
  { key: 'Agency Contact Number', th: 'Agency Contact Number', get: (r) => txt(r.agency_person_contact) },
  { key: 'Nodal Person', th: 'Nodal Person', get: (r) => txt(r.nodal_person) },
  { key: 'Nodal Contact', th: 'Nodal Person Contact', get: (r) => txt(r.contact_nodal) },
  { key: 'Latitude', th: 'Latitude', get: (r) => txt(r.latitude) },
  { key: 'Longitude', th: 'Longitude', get: (r) => txt(r.longitude) },
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

function getSurveyImageCandidates(path?: string | null, moduleType: 'ula' | 'srt' = 'srt'): string[] {
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

function resolveSurveyFileUrl(path?: string | null, moduleType: 'ula' | 'srt' = 'srt'): string {
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

function SurveyThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string) => void;
}) {
  const candidates = useMemo(() => getSurveyImageCandidates(src, 'srt'), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: 34,
        height: 34,

        objectFit: 'cover',
        cursor: 'pointer',
        border: '1px solid var(--ax-border)',
        background: 'var(--ax-surface-subtle)',
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl)}
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

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

  // Filtered sites based on search string
  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((item) =>
      Object.values(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [sites, search]);

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

  return (
    <div className="ax-page bsv-page">
      <style>{VIEW_CSS}</style>

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
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/bihar/srt200mw-survey')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Add Survey</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── KPI 1: Total Assigned ── */}
        <KpiCard
          tone="accent"
          label="Total Assigned"
          value={kpis.total}
          unit="sites"
          sub={`${kpis.complete} surveyed · ${kpis.pending} remaining`}
          badge="All Sites"
          icon={svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)}
        />

        {/* ── KPI 2: Survey Status ── */}
        <KpiCard
          tone="emerald"
          label="Survey Status"
          value={`${surveyDonePct}%`}
          unit="completed"
          sub={`${kpis.pending} pending`}
          badge={`${kpis.complete} / ${kpis.total}`}
          icon={svg(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 13l2 2 4-4" /></>)}
        />

        {/* ── KPI 3: Verify Status ── */}
        <KpiCard
          tone="amber"
          label="Survey Verification"
          value={`${verifyDonePct}%`}
          unit="verified"
          sub={`${kpis.verify_complete} approved · ${kpis.verify_pending} pending · ${kpis.verify_reject} rejected`}
          badge={`${kpis.verify_pending} pending`}
          icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
        />

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT 200MW Survey Records">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Bihar SRT 200 MW Survey Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSites.length} of {sites.length} records
              </p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search records…"
                ariaLabel="Search records"
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
                Loading Bihar SRT 200MW Survey records…
              </p>
            </div>
          ) : filteredSites.length === 0 ? (
            <TableEmptyState
              title="No records found"
              message={
                search
                  ? 'No survey records match your search filter. Try clearing your query.'
                  : errorMsg || 'No survey records available.'
              }
              onClear={search ? () => setSearch('') : undefined}
              clearLabel="Clear search"
            />
          ) : (
            <>
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
                    {pagedSites.map((item, idx) => {
                      const srNo = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={item.id || idx} className="ax-table__row">
                          <td className="ax-table__td">{srNo}</td>

                          {visibleTextCols.map((c) => (
                            <td key={c.key} className="ax-table__td" style={c.style}>{c.get(item)}</td>
                          ))}

                          {/* Images */}
                          {MEDIA_COLS.map((m) => {
                            const path = item[m.field];
                            return (
                              <td key={m.field} className="ax-table__td">
                                <SurveyThumbnail
                                  src={path}
                                  alt={m.alt}
                                  onPreview={setPreviewImg}
                                />
                              </td>
                            );
                          })}

                          {/* PDF */}
                          <td className="ax-table__td">
                            {item.pdf_file ? (
                              <a
                                href={resolveSurveyFileUrl(item.pdf_file, 'srt')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ax-badge ax-badge--soft ax-badge--neutral"
                                style={{ textDecoration: 'none', cursor: 'pointer' }}
                              >
                                PDF ↗
                              </a>
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                            )}
                          </td>

                          {/* Survey Status */}
                          {isVisible('Survey Status') && (
                            <td className="ax-table__td">
                              <span className={`ax-badge ax-badge--soft ax-badge--pill ${isSurveyDone(item) ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                                <span className="ax-badge__dot" />
                                {isSurveyDone(item) ? 'Complete' : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Status */}
                          {isVisible('Verify Status') && (
                            <td className="ax-table__td">
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  verifyStatusNum(item) === 1
                                    ? 'ax-badge--success'
                                    : verifyStatusNum(item) === 2
                                    ? 'ax-badge--danger'
                                    : 'ax-badge--warning'
                                }`}
                              >
                                <span className="ax-badge__dot" />
                                {verifyStatusNum(item) === 1 ? 'Approved' : verifyStatusNum(item) === 2 ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Remarks */}
                          {isVisible('Verify Remarks') && <td className="ax-table__td">{getVerifyRemarks(item) || '—'}</td>}

                          {/* Action */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => navigate(`/v/bihar/srt200mw-survey?id=${item.id}`)}
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

              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filteredSites.length}
                onChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </section>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImg && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--ax-space-4)' }}
          onClick={() => setPreviewImg(null)}
        >
          <div className="ax-card" style={{ position: 'relative', padding: 'var(--ax-space-4)', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>
                Document Preview
              </h4>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setPreviewImg(null)} aria-label="Close preview">
                ✕
              </button>
            </div>
            <img src={previewImg} alt="Survey Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Survey_SRT200MW_ViewData;