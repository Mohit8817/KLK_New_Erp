import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
              ↻ Refresh
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate('/v/bihar/srt200mw-survey')}
            >
              + Add Survey
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── 3 KPI Cards matching template structure ── */}
        {/* Card 1: Total Assign */}
        <section
          className="ax-card ax-col--4"
          style={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <div
            className="ax-card__body"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ax-space-4)',
              padding: 'var(--ax-space-5)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 'var(--ax-text-xs)', opacity: 0.9, fontWeight: 500 }}>Total Assign</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>{kpis.total}</div>
            </div>
          </div>
        </section>

        {/* Card 2: Survey Status */}
        <section
          className="ax-card ax-col--4"
          style={{
            background: 'linear-gradient(135deg, #d81b60 0%, #c2185b 100%)',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <div
            className="ax-card__body"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ax-space-4)',
              padding: 'var(--ax-space-5)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 'var(--ax-text-xs)', opacity: 0.9, fontWeight: 500 }}>Survey Status</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>
                {kpis.complete} / {kpis.pending}
              </div>
              <div style={{ fontSize: 'var(--ax-text-2xs)', opacity: 0.85, marginTop: 2 }}>Complete / Pending</div>
            </div>
          </div>
        </section>

        {/* Card 3: Survey Verify Status */}
        <section
          className="ax-card ax-col--4"
          style={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <div
            className="ax-card__body"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ax-space-4)',
              padding: 'var(--ax-space-5)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 'var(--ax-text-xs)', opacity: 0.9, fontWeight: 500 }}>Survey Verify Status</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>
                {kpis.verify_pending} / {kpis.verify_complete} / {kpis.verify_reject}
              </div>
              <div style={{ fontSize: 'var(--ax-text-2xs)', opacity: 0.85, marginTop: 2 }}>Pending / Verify / Reject</div>
            </div>
          </div>
        </section>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT 200MW Survey Records">
          {/* Card Header matching screenshot color */}
          <div
            className="ax-card__header"
            style={{
              background: '#3b0764',
              color: '#ffffff',
              flexWrap: 'wrap',
              gap: 'var(--ax-space-3)',
              borderRadius: 'var(--ax-radius-xl) var(--ax-radius-xl) 0 0',
            }}
          >
            <div className="ax-card__titles">
              <h2 className="ax-card__title" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                View Bihar SRT 200 MW Survey Information
              </h2>
              <p className="ax-card__subtitle" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {filteredSites.length} total records
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

          {/* Table Container */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head" style={{ background: '#3b0764' }}>
                <tr>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Sr. No.</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Unique ID</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>State</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>District</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Division</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Sub Division</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Department</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Site Name</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Site Address</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>CA No.</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Survey Address</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Nearest Landmark</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Agency Contact Person Name</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Agency Contact Number</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Nodal Person</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Nodal Person Contact</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Latitude</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Longitude</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Load Type</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Connection Phase</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Meter Connection Type</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Meter Number</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Meter Type</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Sanction Load (KW/KVA)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Connected Load (KW)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Grid Power Availability</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Three-Phase Availability</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Missing Phase</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>LTDB Present</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Roof Condition</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Total Roof Area (Sq.Feet)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Free Space Solar (Sq.Feet)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Free Space Inverter (Sq.Feet)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Earth Pit Position</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Age of Building</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Access to Roof</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Rooftop Height (Feet)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Parapet Height (Feet)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>No. of Floors (G+...)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Water Source for Cleaning</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Access to Site</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Distance of Site from Main Road (km)</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Building Image</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Roof Image</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Control Room</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Other Image</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>PDF</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Survey Status</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Verify Status</th>
                  <th className="ax-table__th" style={{ color: '#ffffff' }}>Verify Remarks</th>
                  <th className="ax-table__th" style={{ color: '#ffffff', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={51} className="ax-table__td" style={{ textAlign: 'center', padding: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 18, height: 18, marginRight: 8 }} />
                      Loading Bihar SRT 200MW Survey records...
                    </td>
                  </tr>
                ) : pagedSites.length === 0 ? (
                  <tr>
                    <td colSpan={51} className="ax-table__td" style={{ textAlign: 'center', padding: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>
                      No survey records available.
                    </td>
                  </tr>
                ) : (
                  pagedSites.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.id || idx} className="ax-table__row">
                        <td className="ax-table__td">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{item.uid || '—'}</td>
                        <td className="ax-table__td">{item.state || 'Bihar'}</td>
                        <td className="ax-table__td">{item.district || '—'}</td>
                        <td className="ax-table__td">{item.division || '—'}</td>
                        <td className="ax-table__td">{item.sub_division || '—'}</td>
                        <td className="ax-table__td">{item.department || '—'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{item.site_name || '—'}</td>
                        <td className="ax-table__td">{item.address || '—'}</td>
                        <td className="ax-table__td">{item.ca_no || '—'}</td>
                        <td className="ax-table__td">{item.survey_address || '—'}</td>
                        <td className="ax-table__td">{item.near_landmark || '—'}</td>
                        <td className="ax-table__td">{item.agency_person_name || '—'}</td>
                        <td className="ax-table__td">{item.agency_person_contact || '—'}</td>
                        <td className="ax-table__td">{item.nodal_person || '—'}</td>
                        <td className="ax-table__td">{item.contact_nodal || '—'}</td>
                        <td className="ax-table__td">{item.latitude || '—'}</td>
                        <td className="ax-table__td">{item.longitude || '—'}</td>
                        <td className="ax-table__td">{item.load_type || '—'}</td>
                        <td className="ax-table__td">{item.connection_phase || '—'}</td>
                        <td className="ax-table__td">{item.meter_connection || '—'}</td>
                        <td className="ax-table__td">{item.meter_number || '—'}</td>
                        <td className="ax-table__td">{item.meter_type || '—'}</td>
                        <td className="ax-table__td">{item.sanction_load || '—'}</td>
                        <td className="ax-table__td">{item.connected_load || '—'}</td>
                        <td className="ax-table__td">{item.grid_power || '—'}</td>
                        <td className="ax-table__td">{item.all_3_phase_ltdb || '—'}</td>
                        <td className="ax-table__td">{item.missing_phase || '—'}</td>
                        <td className="ax-table__td">{item.ltdb_present || '—'}</td>
                        <td className="ax-table__td">{item.roof_condition || '—'}</td>
                        <td className="ax-table__td">{item.area_roof || '—'}</td>
                        <td className="ax-table__td">{item.free_space_solar || '—'}</td>
                        <td className="ax-table__td">{item.free_space_inverter || '—'}</td>
                        <td className="ax-table__td">{item.earth_pit || '—'}</td>
                        <td className="ax-table__td">{item.building_age || '—'}</td>
                        <td className="ax-table__td">{item.roof_access || '—'}</td>
                        <td className="ax-table__td">{item.rooftop_height || '—'}</td>
                        <td className="ax-table__td">{item.parapet_height || '—'}</td>
                        <td className="ax-table__td">{item.floors_number || '—'}</td>
                        <td className="ax-table__td">{item.water_source || '—'}</td>
                        <td className="ax-table__td">{item.site_access || '—'}</td>
                        <td className="ax-table__td">{item.site_distance || '—'}</td>

                        {/* Building Image */}
                        <td className="ax-table__td">
                          {item.image1 ? (
                            <img
                              src={item.image1.startsWith('http') ? item.image1 : `/${item.image1}`}
                              alt="Building"
                              style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                              onClick={() => setPreviewImg(item.image1!.startsWith('http') ? item.image1! : `/${item.image1}`)}
                            />
                          ) : '—'}
                        </td>

                        {/* Roof Image */}
                        <td className="ax-table__td">
                          {item.image2 ? (
                            <img
                              src={item.image2.startsWith('http') ? item.image2 : `/${item.image2}`}
                              alt="Roof"
                              style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                              onClick={() => setPreviewImg(item.image2!.startsWith('http') ? item.image2! : `/${item.image2}`)}
                            />
                          ) : '—'}
                        </td>

                        {/* Control Room Image */}
                        <td className="ax-table__td">
                          {item.image3 ? (
                            <img
                              src={item.image3.startsWith('http') ? item.image3 : `/${item.image3}`}
                              alt="Control Room"
                              style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                              onClick={() => setPreviewImg(item.image3!.startsWith('http') ? item.image3! : `/${item.image3}`)}
                            />
                          ) : '—'}
                        </td>

                        {/* Other Image */}
                        <td className="ax-table__td">
                          {item.image4 ? (
                            <img
                              src={item.image4.startsWith('http') ? item.image4 : `/${item.image4}`}
                              alt="Other"
                              style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ax-border)' }}
                              onClick={() => setPreviewImg(item.image4!.startsWith('http') ? item.image4! : `/${item.image4}`)}
                            />
                          ) : '—'}
                        </td>

                        {/* PDF */}
                        <td className="ax-table__td">
                          {item.pdf_file ? (
                            <a
                              href={item.pdf_file.startsWith('http') ? item.pdf_file : `/${item.pdf_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-badge ax-badge--soft ax-badge--danger"
                              style={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                              PDF ↗
                            </a>
                          ) : '—'}
                        </td>

                        {/* Survey Status */}
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

                        {/* Verify Status */}
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

                        {/* Verify Remarks */}
                        <td className="ax-table__td">{item.verify_remarks || '—'}</td>

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
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredSites.length}
            onChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </section>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ax-space-4)',
          }}
          onClick={() => setPreviewImg(null)}
        >
          <div
            style={{
              position: 'relative',
              background: 'var(--ax-surface)',
              borderRadius: 'var(--ax-radius-xl)',
              padding: 'var(--ax-space-3)',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
              onClick={() => setPreviewImg(null)}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Survey Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Survey_SRT200MW_ViewData;
