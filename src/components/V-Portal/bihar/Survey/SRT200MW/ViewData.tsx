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

/* ── Styles: professional KPI cards + light table polish ── */
const VIEW_CSS = `
.bsv-kpi { position: relative; overflow: hidden; border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); }
.bsv-kpi:hover { box-shadow: var(--ax-shadow-md); transform: translateY(-1px); }
.bsv-kpi::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: var(--bsv-accent); }
.bsv-kpi__body { padding: var(--ax-space-5) var(--ax-space-5) var(--ax-space-4); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.bsv-kpi__head { display: flex; align-items: center; justify-content: space-between; gap: var(--ax-space-3); }
.bsv-kpi__title-wrap { display: flex; align-items: center; gap: var(--ax-space-3); min-width: 0; }
.bsv-kpi__icon { width: 40px; height: 40px; flex-shrink: 0; border-radius: var(--ax-radius-lg); display: inline-flex; align-items: center; justify-content: center; color: var(--bsv-accent); background: color-mix(in srgb, var(--bsv-accent) 12%, var(--ax-surface-solid)); }
.bsv-kpi__icon svg { width: 20px; height: 20px; }
.bsv-kpi__label { font-size: var(--ax-text-xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted); }
.bsv-kpi__caption { font-size: var(--ax-text-xs); color: var(--ax-text-subtle); margin-top: 2px; }
.bsv-kpi__value-row { display: flex; align-items: baseline; gap: var(--ax-space-2); flex-wrap: wrap; }
.bsv-kpi__value { font-size: 2rem; line-height: 1.1; font-weight: 700; color: var(--ax-text-strong); font-variant-numeric: tabular-nums; }
.bsv-kpi__unit { font-size: var(--ax-text-sm); color: var(--ax-text-muted); }
.bsv-bar { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: var(--ax-surface-subtle); border: 1px solid var(--ax-border-subtle); }
.bsv-bar__seg { height: 100%; transition: width .4s var(--ax-ease-standard); }
.bsv-legend { display: flex; flex-wrap: wrap; gap: var(--ax-space-2) var(--ax-space-4); padding-top: var(--ax-space-3); border-top: 1px dashed var(--ax-border); }
.bsv-legend__item { display: inline-flex; align-items: center; gap: 6px; font-size: var(--ax-text-xs); color: var(--ax-text-muted); }
.bsv-legend__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
.bsv-legend__num { font-weight: 700; color: var(--ax-text-strong); font-variant-numeric: tabular-nums; }

.bsv-page .ax-card__header { background: var(--ax-surface-subtle); border-bottom: 1px solid var(--ax-border-subtle); }
.bsv-page .ax-table__th { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted); background: var(--ax-surface-subtle); }
.bsv-page .ax-table__td { font-size: var(--ax-text-sm); }
`;

const ICON_PROPS = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

interface Segment { label: string; count: number; color: string }

function KpiCard({
  accent, icon, label, caption, value, unit, badge, segments,
}: {
  accent: string; icon: ReactNode; label: string; caption: string;
  value: ReactNode; unit?: string; badge?: ReactNode; segments?: Segment[];
}) {
  const sum = (segments || []).reduce((a, s) => a + s.count, 0);
  return (
    <div className="bsv-kpi ax-col--4" role="region" aria-label={label} style={{ ['--bsv-accent' as string]: accent } as CSSProperties}>
      <div className="bsv-kpi__body">
        <div className="bsv-kpi__head">
          <div className="bsv-kpi__title-wrap">
            <span className="bsv-kpi__icon"><svg {...ICON_PROPS}>{icon}</svg></span>
            <div>
              <div className="bsv-kpi__label">{label}</div>
              <div className="bsv-kpi__caption">{caption}</div>
            </div>
          </div>
          {badge}
        </div>

        <div className="bsv-kpi__value-row">
          <span className="bsv-kpi__value">{value}</span>
          {unit && <span className="bsv-kpi__unit">{unit}</span>}
        </div>

        {segments && (
          <>
            <div className="bsv-bar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.count}`).join(', ')}>
              {sum > 0 && segments.map((s) => (
                <div key={s.label} className="bsv-bar__seg" style={{ width: `${(s.count / sum) * 100}%`, background: s.color }} />
              ))}
            </div>
            <div className="bsv-legend">
              {segments.map((s) => (
                <span key={s.label} className="bsv-legend__item" style={{ ['--c' as string]: s.color } as CSSProperties}>
                  <span className="bsv-legend__dot" />
                  {s.label} <span className="bsv-legend__num">{s.count}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Table column config (same columns / order as before) ── */
type Row = BiharSrtSiteItem;
interface TextCol { key: string; th: string; get: (r: Row) => ReactNode; style?: CSSProperties }

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const TEXT_COLS_BEFORE_MEDIA: TextCol[] = [
  { key: 'Unique ID', th: 'Unique ID', get: (r) => txt(r.uid), style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  { key: 'State', th: 'State', get: (r) => r.state || 'Bihar' },
  { key: 'District', th: 'District', get: (r) => txt(r.district) },
  { key: 'Division', th: 'Division', get: (r) => txt(r.division) },
  { key: 'Sub Division', th: 'Sub Division', get: (r) => txt(r.sub_division) },
  { key: 'Department', th: 'Department', get: (r) => txt(r.department) },
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

const fileUrl = (p: string) => (p.startsWith('http') ? p : `/${p}`);

export function Bihar_Survey_SRT200MW_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpis, setKpis] = useState<SurveyDetailKpis>(DEFAULT_KPIS);
  const [sites, setSites] = useState<BiharSrtSiteItem[]>([]);
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
      setSites(resp.data.srt200mw || []);
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
  const exportCols: ExportColumn<BiharSrtSiteItem>[] = useMemo(
    () => [
      { header: 'Unique ID', accessor: (r) => r.uid ?? '' },
      { header: 'State', accessor: (r) => r.state ?? '' },
      { header: 'District', accessor: (r) => r.district ?? '' },
      { header: 'Division', accessor: (r) => r.division ?? '' },
      { header: 'Sub Division', accessor: (r) => r.sub_division ?? '' },
      { header: 'Department', accessor: (r) => r.department ?? '' },
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
      { header: 'Survey Status', accessor: (r) => (r.survey_status === 1 ? 'Done' : 'Pending') },
      {
        header: 'Verify Status',
        accessor: (r) =>
          r.survey_verify_status === 1 ? 'Approved' : r.survey_verify_status === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks ?? '' },
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

  const warn = 'var(--ax-warning-500, #f59e0b)';
  const ok = 'var(--ax-success-500)';
  const bad = 'var(--ax-danger-500)';
  const accent = 'var(--ax-accent)';

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
          accent={accent}
          label="Total Assigned"
          caption="Assigned survey sites"
          value={kpis.total}
          unit="sites"
          badge={<span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">All Sites</span>}
          icon={<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>}
          segments={[
            { label: 'Surveyed', count: kpis.complete, color: ok },
            { label: 'Remaining', count: kpis.pending, color: warn },
          ]}
        />

        {/* ── KPI 2: Survey Status ── */}
        <KpiCard
          accent={ok}
          label="Survey Status"
          caption="Complete vs Pending"
          value={`${surveyDonePct}%`}
          unit="completed"
          badge={<span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{kpis.complete} / {kpis.total}</span>}
          icon={<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 13l2 2 4-4" /></>}
          segments={[
            { label: 'Complete', count: kpis.complete, color: ok },
            { label: 'Pending', count: kpis.pending, color: warn },
          ]}
        />

        {/* ── KPI 3: Verify Status ── */}
        <KpiCard
          accent={warn}
          label="Survey Verification"
          caption="Approved / Pending / Rejected"
          value={`${verifyDonePct}%`}
          unit="verified"
          badge={<span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">{kpis.verify_pending} pending</span>}
          icon={<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>}
          segments={[
            { label: 'Approved', count: kpis.verify_complete, color: ok },
            { label: 'Pending', count: kpis.verify_pending, color: warn },
            { label: 'Rejected', count: kpis.verify_reject, color: bad },
          ]}
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
                                {path ? (
                                  <img
                                    src={fileUrl(path)}
                                    alt={m.alt}
                                    style={{ width: 34, height: 34, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                                    onClick={() => setPreviewImg(fileUrl(path))}
                                  />
                                ) : (
                                  <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                                )}
                              </td>
                            );
                          })}

                          {/* PDF */}
                          <td className="ax-table__td">
                            {item.pdf_file ? (
                              <a
                                href={fileUrl(item.pdf_file)}
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
                              <span className={`ax-badge ax-badge--soft ax-badge--pill ${item.survey_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                                <span className="ax-badge__dot" />
                                {item.survey_status === 1 ? 'Complete' : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Status */}
                          {isVisible('Verify Status') && (
                            <td className="ax-table__td">
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  item.survey_verify_status === 1
                                    ? 'ax-badge--success'
                                    : item.survey_verify_status === 2
                                    ? 'ax-badge--danger'
                                    : 'ax-badge--warning'
                                }`}
                              >
                                <span className="ax-badge__dot" />
                                {item.survey_verify_status === 1 ? 'Approved' : item.survey_verify_status === 2 ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Remarks */}
                          {isVisible('Verify Remarks') && <td className="ax-table__td">{item.verify_remarks || '—'}</td>}

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