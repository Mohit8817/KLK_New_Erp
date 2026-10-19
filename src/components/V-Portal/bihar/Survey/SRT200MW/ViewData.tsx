import { useEffect, useMemo, useState } from 'react';
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

  return (
    <div className="ax-page">
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
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate('/v/bihar/srt200mw-survey')}
            >
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
        {/* ── KPI Box 1: Total Assign ── */}
        <div className="ax-card ax-kpi ax-col--4" role="region" aria-label="Total Assigned Sites">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--neutral">Assigned</span>
            </div>
            <div className="ax-kpi__label">Total Assign</div>
            <div className="ax-kpi__value ax-num">{kpis.total}</div>
            <div className="ax-kpi__caption">Assigned survey sites</div>
          </div>
        </div>

        {/* ── KPI Box 2: Survey Status ── */}
        <div className="ax-card ax-kpi ax-col--4" role="region" aria-label="Survey Status">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                </svg>
              </span>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-1)' }}>
                <span className="ax-badge ax-badge--soft ax-badge--success">Complete: {kpis.complete}</span>
                <span className="ax-badge ax-badge--soft ax-badge--warning">Pending: {kpis.pending}</span>
              </div>
            </div>
            <div className="ax-kpi__label">Survey Status</div>
            <div className="ax-kpi__value ax-num">
              {kpis.complete}{' '}
              <span style={{ fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-muted)', fontWeight: 'var(--ax-weight-normal)' }}>
                / {kpis.pending}
              </span>
            </div>
            <div className="ax-kpi__caption">Complete / Pending</div>
          </div>
        </div>

        {/* ── KPI Box 3: Survey Verify Status ── */}
        <div className="ax-card ax-kpi ax-col--4" role="region" aria-label="Survey Verify Status">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15l2 2 4-4" />
                </svg>
              </span>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-1)' }}>
                <span className="ax-badge ax-badge--soft ax-badge--success">Verify: {kpis.verify_complete}</span>
                <span className="ax-badge ax-badge--soft ax-badge--warning">Pending: {kpis.verify_pending}</span>
                <span className="ax-badge ax-badge--soft ax-badge--danger">Reject: {kpis.verify_reject}</span>
              </div>
            </div>
            <div className="ax-kpi__label">Survey Verify Status</div>
            <div className="ax-kpi__value ax-num">
              {kpis.verify_complete}{' '}
              <span style={{ fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-muted)', fontWeight: 'var(--ax-weight-normal)' }}>
                / {kpis.verify_pending} / {kpis.verify_reject}
              </span>
            </div>
            <div className="ax-kpi__caption">Verify / Pending / Reject</div>
          </div>
        </div>

        {/* ── Main Table Card (Template DataTables pattern) ── */}
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
                      {isVisible('Unique ID') && <th className="ax-table__th" scope="col">Unique ID</th>}
                      {isVisible('State') && <th className="ax-table__th" scope="col">State</th>}
                      {isVisible('District') && <th className="ax-table__th" scope="col">District</th>}
                      {isVisible('Division') && <th className="ax-table__th" scope="col">Division</th>}
                      {isVisible('Sub Division') && <th className="ax-table__th" scope="col">Sub Division</th>}
                      {isVisible('Department') && <th className="ax-table__th" scope="col">Department</th>}
                      {isVisible('Site Name') && <th className="ax-table__th" scope="col">Site Name</th>}
                      {isVisible('Site Address') && <th className="ax-table__th" scope="col">Site Address</th>}
                      {isVisible('CA No.') && <th className="ax-table__th" scope="col">CA No.</th>}
                      {isVisible('Survey Address') && <th className="ax-table__th" scope="col">Survey Address</th>}
                      {isVisible('Nearest Landmark') && <th className="ax-table__th" scope="col">Nearest Landmark</th>}
                      {isVisible('Agency Contact Person') && <th className="ax-table__th" scope="col">Agency Contact Person</th>}
                      {isVisible('Agency Contact Number') && <th className="ax-table__th" scope="col">Agency Contact Number</th>}
                      {isVisible('Nodal Person') && <th className="ax-table__th" scope="col">Nodal Person</th>}
                      {isVisible('Nodal Contact') && <th className="ax-table__th" scope="col">Nodal Person Contact</th>}
                      {isVisible('Latitude') && <th className="ax-table__th" scope="col">Latitude</th>}
                      {isVisible('Longitude') && <th className="ax-table__th" scope="col">Longitude</th>}
                      {isVisible('Load Type') && <th className="ax-table__th" scope="col">Load Type</th>}
                      {isVisible('Connection Phase') && <th className="ax-table__th" scope="col">Connection Phase</th>}
                      {isVisible('Meter Connection Type') && <th className="ax-table__th" scope="col">Meter Connection Type</th>}
                      {isVisible('Meter Number') && <th className="ax-table__th" scope="col">Meter Number</th>}
                      {isVisible('Meter Type') && <th className="ax-table__th" scope="col">Meter Type</th>}
                      {isVisible('Sanction Load') && <th className="ax-table__th" scope="col">Sanction Load (KW/KVA)</th>}
                      {isVisible('Connected Load') && <th className="ax-table__th" scope="col">Connected Load (KW)</th>}
                      {isVisible('Grid Power Availability') && <th className="ax-table__th" scope="col">Grid Power Availability</th>}
                      {isVisible('Three-Phase Availability') && <th className="ax-table__th" scope="col">Three-Phase Availability</th>}
                      {isVisible('Missing Phase') && <th className="ax-table__th" scope="col">Missing Phase</th>}
                      {isVisible('LTDB Present') && <th className="ax-table__th" scope="col">LTDB Present</th>}
                      {isVisible('Roof Condition') && <th className="ax-table__th" scope="col">Roof Condition</th>}
                      {isVisible('Total Roof Area (Sq.Ft)') && <th className="ax-table__th" scope="col">Total Roof Area (Sq.Ft)</th>}
                      {isVisible('Free Space Solar (Sq.Ft)') && <th className="ax-table__th" scope="col">Free Space Solar (Sq.Ft)</th>}
                      {isVisible('Free Space Inverter (Sq.Ft)') && <th className="ax-table__th" scope="col">Free Space Inverter (Sq.Ft)</th>}
                      {isVisible('Earth Pit Position') && <th className="ax-table__th" scope="col">Earth Pit Position</th>}
                      {isVisible('Age of Building') && <th className="ax-table__th" scope="col">Age of Building</th>}
                      {isVisible('Roof Access') && <th className="ax-table__th" scope="col">Access to Roof</th>}
                      {isVisible('Rooftop Height') && <th className="ax-table__th" scope="col">Rooftop Height (Feet)</th>}
                      {isVisible('Parapet Height') && <th className="ax-table__th" scope="col">Parapet Height (Feet)</th>}
                      {isVisible('No. of Floors') && <th className="ax-table__th" scope="col">No. of Floors (G+...)</th>}
                      {isVisible('Water Source') && <th className="ax-table__th" scope="col">Water Source for Cleaning</th>}
                      {isVisible('Access to Site') && <th className="ax-table__th" scope="col">Access to Site</th>}
                      {isVisible('Distance from Road') && <th className="ax-table__th" scope="col">Distance from Main Road (km)</th>}
                      <th className="ax-table__th" scope="col">Building Image</th>
                      <th className="ax-table__th" scope="col">Roof Image</th>
                      <th className="ax-table__th" scope="col">Control Room</th>
                      <th className="ax-table__th" scope="col">Other Image</th>
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
                          {isVisible('Unique ID') && (
                            <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                              {item.uid || '—'}
                            </td>
                          )}
                          {isVisible('State') && <td className="ax-table__td">{item.state || 'Bihar'}</td>}
                          {isVisible('District') && <td className="ax-table__td">{item.district || '—'}</td>}
                          {isVisible('Division') && <td className="ax-table__td">{item.division || '—'}</td>}
                          {isVisible('Sub Division') && <td className="ax-table__td">{item.sub_division || '—'}</td>}
                          {isVisible('Department') && <td className="ax-table__td">{item.department || '—'}</td>}
                          {isVisible('Site Name') && (
                            <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)' }}>
                              {item.site_name || '—'}
                            </td>
                          )}
                          {isVisible('Site Address') && <td className="ax-table__td">{item.address || '—'}</td>}
                          {isVisible('CA No.') && <td className="ax-table__td">{item.ca_no || '—'}</td>}
                          {isVisible('Survey Address') && <td className="ax-table__td">{item.survey_address || '—'}</td>}
                          {isVisible('Nearest Landmark') && <td className="ax-table__td">{item.near_landmark || '—'}</td>}
                          {isVisible('Agency Contact Person') && <td className="ax-table__td">{item.agency_person_name || '—'}</td>}
                          {isVisible('Agency Contact Number') && <td className="ax-table__td">{item.agency_person_contact || '—'}</td>}
                          {isVisible('Nodal Person') && <td className="ax-table__td">{item.nodal_person || '—'}</td>}
                          {isVisible('Nodal Contact') && <td className="ax-table__td">{item.contact_nodal || '—'}</td>}
                          {isVisible('Latitude') && <td className="ax-table__td">{item.latitude || '—'}</td>}
                          {isVisible('Longitude') && <td className="ax-table__td">{item.longitude || '—'}</td>}
                          {isVisible('Load Type') && <td className="ax-table__td">{item.load_type || '—'}</td>}
                          {isVisible('Connection Phase') && <td className="ax-table__td">{item.connection_phase || '—'}</td>}
                          {isVisible('Meter Connection Type') && <td className="ax-table__td">{item.meter_connection || '—'}</td>}
                          {isVisible('Meter Number') && <td className="ax-table__td">{item.meter_number || '—'}</td>}
                          {isVisible('Meter Type') && <td className="ax-table__td">{item.meter_type || '—'}</td>}
                          {isVisible('Sanction Load') && <td className="ax-table__td">{item.sanction_load || '—'}</td>}
                          {isVisible('Connected Load') && <td className="ax-table__td">{item.connected_load || '—'}</td>}
                          {isVisible('Grid Power Availability') && <td className="ax-table__td">{item.grid_power || '—'}</td>}
                          {isVisible('Three-Phase Availability') && <td className="ax-table__td">{item.all_3_phase_ltdb || '—'}</td>}
                          {isVisible('Missing Phase') && <td className="ax-table__td">{item.missing_phase || '—'}</td>}
                          {isVisible('LTDB Present') && <td className="ax-table__td">{item.ltdb_present || '—'}</td>}
                          {isVisible('Roof Condition') && <td className="ax-table__td">{item.roof_condition || '—'}</td>}
                          {isVisible('Total Roof Area (Sq.Ft)') && <td className="ax-table__td">{item.area_roof || '—'}</td>}
                          {isVisible('Free Space Solar (Sq.Ft)') && <td className="ax-table__td">{item.free_space_solar || '—'}</td>}
                          {isVisible('Free Space Inverter (Sq.Ft)') && <td className="ax-table__td">{item.free_space_inverter || '—'}</td>}
                          {isVisible('Earth Pit Position') && <td className="ax-table__td">{item.earth_pit || '—'}</td>}
                          {isVisible('Age of Building') && <td className="ax-table__td">{item.building_age || '—'}</td>}
                          {isVisible('Roof Access') && <td className="ax-table__td">{item.roof_access || '—'}</td>}
                          {isVisible('Rooftop Height') && <td className="ax-table__td">{item.rooftop_height || '—'}</td>}
                          {isVisible('Parapet Height') && <td className="ax-table__td">{item.parapet_height || '—'}</td>}
                          {isVisible('No. of Floors') && <td className="ax-table__td">{item.floors_number || '—'}</td>}
                          {isVisible('Water Source') && <td className="ax-table__td">{item.water_source || '—'}</td>}
                          {isVisible('Access to Site') && <td className="ax-table__td">{item.site_access || '—'}</td>}
                          {isVisible('Distance from Road') && <td className="ax-table__td">{item.site_distance || '—'}</td>}

                          {/* Building Image */}
                          <td className="ax-table__td">
                            {item.image1 ? (
                              <img
                                src={item.image1.startsWith('http') ? item.image1 : `/${item.image1}`}
                                alt="Building"
                                style={{ width: 34, height: 34, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                                onClick={() => setPreviewImg(item.image1!.startsWith('http') ? item.image1! : `/${item.image1}`)}
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                            )}
                          </td>

                          {/* Roof Image */}
                          <td className="ax-table__td">
                            {item.image2 ? (
                              <img
                                src={item.image2.startsWith('http') ? item.image2 : `/${item.image2}`}
                                alt="Roof"
                                style={{ width: 34, height: 34, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                                onClick={() => setPreviewImg(item.image2!.startsWith('http') ? item.image2! : `/${item.image2}`)}
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                            )}
                          </td>

                          {/* Control Room Image */}
                          <td className="ax-table__td">
                            {item.image3 ? (
                              <img
                                src={item.image3.startsWith('http') ? item.image3 : `/${item.image3}`}
                                alt="Control Room"
                                style={{ width: 34, height: 34, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                                onClick={() => setPreviewImg(item.image3!.startsWith('http') ? item.image3! : `/${item.image3}`)}
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                            )}
                          </td>

                          {/* Other Image */}
                          <td className="ax-table__td">
                            {item.image4 ? (
                              <img
                                src={item.image4.startsWith('http') ? item.image4 : `/${item.image4}`}
                                alt="Other"
                                style={{ width: 34, height: 34, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                                onClick={() => setPreviewImg(item.image4!.startsWith('http') ? item.image4! : `/${item.image4}`)}
                              />
                            ) : (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                            )}
                          </td>

                          {/* PDF */}
                          <td className="ax-table__td">
                            {item.pdf_file ? (
                              <a
                                href={item.pdf_file.startsWith('http') ? item.pdf_file : `/${item.pdf_file}`}
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
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  item.survey_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                                }`}
                              >
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
                                {item.survey_verify_status === 1
                                  ? 'Approved'
                                  : item.survey_verify_status === 2
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Remarks */}
                          {isVisible('Verify Remarks') && (
                            <td className="ax-table__td">{item.verify_remarks || '—'}</td>
                          )}

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

              {/* Template Pagination */}
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

      {/* ── Image Preview Modal (Professional Template Style) ── */}
      {previewImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ax-space-4)',
          }}
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="ax-card"
            style={{
              position: 'relative',
              padding: 'var(--ax-space-4)',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>
                Document Preview
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                onClick={() => setPreviewImg(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImg}
              alt="Survey Preview"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Survey_SRT200MW_ViewData;
