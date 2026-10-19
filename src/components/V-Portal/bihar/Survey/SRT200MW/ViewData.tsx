import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
  type SurveyDetailKpis,
} from '../../../../../services/biharSrt200mwService';
import {
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import '../../bihar-srt200mw.css';

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
  const [kpis, setKpis] = useState<SurveyDetailKpis>(DEFAULT_KPIS);
  const [sites, setSites] = useState<BiharSrtSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Column Visibility state
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [colMenuOpen, setColMenuOpen] = useState(false);

  // Fetch API data on load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await biharSrt200mwService.getViewSurveyData();
        if (mounted) {
          setKpis(resp.data.survey_detail || DEFAULT_KPIS);
          setSites(resp.data.srt200mw || []);
        }
      } catch (err) {
        console.error('[Bihar SRT 200MW] Failed to load survey data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
  const totalPages = Math.ceil(filteredSites.length / pageSize) || 1;
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

  const toggleCol = (header: string) => {
    setHiddenCols((prev) =>
      prev.includes(header) ? prev.filter((c) => c !== header) : [...prev, header]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bihar-srt-page">
      {/* ── Top Header matching screenshot ── */}
      <div className="bihar-srt-head">
        <div className="bihar-srt-head__titles">
          <span className="bihar-srt-head__eyebrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Welcome to,
          </span>
          <h1 className="bihar-srt-head__title">Bihar SRT 200 MW Survey</h1>
        </div>
        <div className="bihar-srt-head__breadcrumbs">
          <Link to="/v-dashboard">Home</Link> / <span>View Bihar SRT 200 MW Survey</span>
        </div>
      </div>

      {/* ── 3 KPI Cards matching screenshot ── */}
      <div className="bihar-srt-kpis">
        {/* Card 1: Blue - Total Assign */}
        <div className="bihar-kpi-card bihar-kpi-card--blue">
          <div className="bihar-kpi-card__icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="bihar-kpi-card__content">
            <span className="bihar-kpi-card__label">Total Assign</span>
            <span className="bihar-kpi-card__val">{kpis.total}</span>
          </div>
        </div>

        {/* Card 2: Pink/Magenta - Survey Status */}
        <div className="bihar-kpi-card bihar-kpi-card--pink">
          <div className="bihar-kpi-card__icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
            </svg>
          </div>
          <div className="bihar-kpi-card__content">
            <span className="bihar-kpi-card__label">Survey Status</span>
            <span className="bihar-kpi-card__val">
              {kpis.complete} / {kpis.pending}
            </span>
            <span className="bihar-kpi-card__sub">Complete / Pending</span>
          </div>
        </div>

        {/* Card 3: Green - Survey Verify Status */}
        <div className="bihar-kpi-card bihar-kpi-card--green">
          <div className="bihar-kpi-card__icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="bihar-kpi-card__content">
            <span className="bihar-kpi-card__label">Survey Verify Status</span>
            <span className="bihar-kpi-card__val">
              {kpis.verify_pending} / {kpis.verify_complete} / {kpis.verify_reject}
            </span>
            <span className="bihar-kpi-card__sub">Pending / Verify / Reject</span>
          </div>
        </div>
      </div>

      {/* ── Purple Header Table Card ── */}
      <div className="bihar-table-card">
        {/* Banner header */}
        <div className="bihar-table-card__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span>View Bihar SRT 200 MW Survey Information</span>
        </div>

        {/* Toolbar */}
        <div className="bihar-table-card__toolbar">
          <div className="bihar-table-card__export-group">
            {/* Copy */}
            <button
              type="button"
              className="bihar-export-btn"
              title="Copy to clipboard"
              onClick={() => copyTableDataToClipboard(filteredSites, activeExportCols)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            {/* CSV */}
            <button
              type="button"
              className="bihar-export-btn"
              title="Export CSV"
              onClick={() => exportDataToCSV('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </button>
            {/* Excel */}
            <button
              type="button"
              className="bihar-export-btn"
              title="Export Excel"
              onClick={() => exportDataToExcel('Bihar_SRT_200MW_Survey', filteredSites, activeExportCols)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M8 13l3 4" />
                <path d="M11 13l-3 4" />
                <path d="M14 13h3v4h-3z" />
              </svg>
            </button>
            {/* PDF */}
            <button
              type="button"
              className="bihar-export-btn"
              title="Export PDF"
              onClick={() => printTableData('Bihar SRT 200MW Survey', filteredSites, activeExportCols)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M9 15h2a1.5 1.5 0 0 0 0-3H9v6" />
                <path d="M17 12h-3v6" />
              </svg>
            </button>
            {/* Print */}
            <button
              type="button"
              className="bihar-export-btn"
              title="Print"
              onClick={() => printTableData('Bihar SRT 200MW Survey', filteredSites, activeExportCols)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
            {/* Column visibility dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="bihar-export-btn"
                title="Column visibility"
                onClick={() => setColMenuOpen(!colMenuOpen)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              {colMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 40,
                    marginTop: 4,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                    padding: '8px 12px',
                    maxHeight: 280,
                    overflowY: 'auto',
                    minWidth: 220,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6, color: '#334155' }}>
                    Toggle Columns
                  </div>
                  {exportCols.map((col) => (
                    <label
                      key={col.header}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: '3px 0',
                        color: '#475569',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenCols.includes(col.header)}
                        onChange={() => toggleCol(col.header)}
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Link to Add Survey */}
            <button
              type="button"
              className="bihar-btn bihar-btn--primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}
              onClick={() => navigate('/v/bihar/srt200mw-survey')}
            >
              + Add Survey
            </button>
          </div>

          {/* Search Input */}
          <div className="bihar-table-card__search-wrap">
            <label htmlFor="survey-search">Search:</label>
            <input
              id="survey-search"
              type="text"
              className="bihar-table-card__search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in records..."
            />
          </div>
        </div>

        {/* ── Table with 51 columns ── */}
        <div className="bihar-table-wrap">
          <table className="bihar-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Unique ID</th>
                <th>State</th>
                <th>District</th>
                <th>Division</th>
                <th>Sub Division</th>
                <th>Department</th>
                <th>Site Name</th>
                <th>Site Address</th>
                <th>CA No.</th>
                <th>Survey Address</th>
                <th>Nearest Landmark</th>
                <th>Agency Contact Person Name</th>
                <th>Agency Contact Number</th>
                <th>Nodal Person</th>
                <th>Nodal Person Contact</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Load Type</th>
                <th>Connection Phase</th>
                <th>Meter Connection Type</th>
                <th>Meter Number</th>
                <th>Meter Type</th>
                <th>Sanction Load (KW/KVA)</th>
                <th>Connected Load (KW)</th>
                <th>Grid Power Availability</th>
                <th>Three-Phase Availability</th>
                <th>Missing Phase</th>
                <th>LTDB Present</th>
                <th>Roof Condition</th>
                <th>Total Roof Area (Sq.Feet)</th>
                <th>Free Space Solar (Sq.Feet)</th>
                <th>Free Space Inverter (Sq.Feet)</th>
                <th>Earth Pit Position</th>
                <th>Age of Building</th>
                <th>Access to Roof</th>
                <th>Rooftop Height (Feet)</th>
                <th>Parapet Height (Feet)</th>
                <th>No. of Floors (G+...)</th>
                <th>Water Source for Cleaning</th>
                <th>Access to Site</th>
                <th>Distance of Site from Main Road (km)</th>
                <th>Building Image</th>
                <th>Roof Image</th>
                <th>Control Room</th>
                <th>Other Image</th>
                <th>PDF</th>
                <th>Survey Status</th>
                <th>Verify Status</th>
                <th>Verify Remarks</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={51} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="ax-spinner" style={{ width: 18, height: 18 }} />
                      Loading Bihar SRT 200MW Survey records...
                    </div>
                  </td>
                </tr>
              ) : pagedSites.length === 0 ? (
                <tr>
                  <td colSpan={51} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No survey records found.
                  </td>
                </tr>
              ) : (
                pagedSites.map((item, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id || idx}>
                      <td>{srNo}</td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{item.uid || '-'}</td>
                      <td>{item.state || 'Bihar'}</td>
                      <td>{item.district || '-'}</td>
                      <td>{item.division || '-'}</td>
                      <td>{item.sub_division || '-'}</td>
                      <td>{item.department || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{item.site_name || '-'}</td>
                      <td>{item.address || '-'}</td>
                      <td>{item.ca_no || '-'}</td>
                      <td>{item.survey_address || '-'}</td>
                      <td>{item.near_landmark || '-'}</td>
                      <td>{item.agency_person_name || '-'}</td>
                      <td>{item.agency_person_contact || '-'}</td>
                      <td>{item.nodal_person || '-'}</td>
                      <td>{item.contact_nodal || '-'}</td>
                      <td>{item.latitude || '-'}</td>
                      <td>{item.longitude || '-'}</td>
                      <td>{item.load_type || '-'}</td>
                      <td>{item.connection_phase || '-'}</td>
                      <td>{item.meter_connection || '-'}</td>
                      <td>{item.meter_number || '-'}</td>
                      <td>{item.meter_type || '-'}</td>
                      <td>{item.sanction_load || '-'}</td>
                      <td>{item.connected_load || '-'}</td>
                      <td>{item.grid_power || '-'}</td>
                      <td>{item.all_3_phase_ltdb || '-'}</td>
                      <td>{item.missing_phase || '-'}</td>
                      <td>{item.ltdb_present || '-'}</td>
                      <td>{item.roof_condition || '-'}</td>
                      <td>{item.area_roof || '-'}</td>
                      <td>{item.free_space_solar || '-'}</td>
                      <td>{item.free_space_inverter || '-'}</td>
                      <td>{item.earth_pit || '-'}</td>
                      <td>{item.building_age || '-'}</td>
                      <td>{item.roof_access || '-'}</td>
                      <td>{item.rooftop_height || '-'}</td>
                      <td>{item.parapet_height || '-'}</td>
                      <td>{item.floors_number || '-'}</td>
                      <td>{item.water_source || '-'}</td>
                      <td>{item.site_access || '-'}</td>
                      <td>{item.site_distance || '-'}</td>

                      {/* Building Image */}
                      <td>
                        {item.image1 ? (
                          <img
                            src={item.image1.startsWith('http') ? item.image1 : `/${item.image1}`}
                            alt="Building"
                            className="bihar-thumb"
                            onClick={() =>
                              setPreviewImg(item.image1!.startsWith('http') ? item.image1! : `/${item.image1}`)
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Roof Image */}
                      <td>
                        {item.image2 ? (
                          <img
                            src={item.image2.startsWith('http') ? item.image2 : `/${item.image2}`}
                            alt="Roof"
                            className="bihar-thumb"
                            onClick={() =>
                              setPreviewImg(item.image2!.startsWith('http') ? item.image2! : `/${item.image2}`)
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Control Room Image */}
                      <td>
                        {item.image3 ? (
                          <img
                            src={item.image3.startsWith('http') ? item.image3 : `/${item.image3}`}
                            alt="Control Room"
                            className="bihar-thumb"
                            onClick={() =>
                              setPreviewImg(item.image3!.startsWith('http') ? item.image3! : `/${item.image3}`)
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Other Image */}
                      <td>
                        {item.image4 ? (
                          <img
                            src={item.image4.startsWith('http') ? item.image4 : `/${item.image4}`}
                            alt="Other"
                            className="bihar-thumb"
                            onClick={() =>
                              setPreviewImg(item.image4!.startsWith('http') ? item.image4! : `/${item.image4}`)
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* PDF */}
                      <td>
                        {item.pdf_file ? (
                          <a
                            href={item.pdf_file.startsWith('http') ? item.pdf_file : `/${item.pdf_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            PDF
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Survey Status */}
                      <td>
                        {item.survey_status === 1 ? (
                          <span className="bihar-badge bihar-badge--green">Complete</span>
                        ) : (
                          <span className="bihar-badge bihar-badge--amber">Pending</span>
                        )}
                      </td>

                      {/* Verify Status */}
                      <td>
                        {item.survey_verify_status === 1 ? (
                          <span className="bihar-badge bihar-badge--green">Approved</span>
                        ) : item.survey_verify_status === 2 ? (
                          <span className="bihar-badge bihar-badge--red">Rejected</span>
                        ) : (
                          <span className="bihar-badge bihar-badge--amber">Pending</span>
                        )}
                      </td>

                      {/* Verify Remarks */}
                      <td>{item.verify_remarks || '-'}</td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="bihar-btn bihar-btn--secondary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                          title="Edit Survey"
                          onClick={() => navigate(`/v/bihar/srt200mw-survey?id=${item.id}`)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <th>Sr. No.</th>
                <th>Unique ID</th>
                <th>State</th>
                <th>District</th>
                <th>Division</th>
                <th>Sub Division</th>
                <th>Department</th>
                <th>Site Name</th>
                <th>Site Address</th>
                <th>CA No.</th>
                <th>Survey Address</th>
                <th>Nearest Landmark</th>
                <th>Agency Contact Person Name</th>
                <th>Agency Contact Number</th>
                <th>Nodal Person</th>
                <th>Nodal Person Contact</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Load Type</th>
                <th>Connection Phase</th>
                <th>Meter Connection Type</th>
                <th>Meter Number</th>
                <th>Meter Type</th>
                <th>Sanction Load (KW/KVA)</th>
                <th>Connected Load (KW)</th>
                <th>Grid Power Availability</th>
                <th>Three-Phase Availability</th>
                <th>Missing Phase</th>
                <th>LTDB Present</th>
                <th>Roof Condition</th>
                <th>Total Roof Area (Sq.Feet)</th>
                <th>Free Space Solar (Sq.Feet)</th>
                <th>Free Space Inverter (Sq.Feet)</th>
                <th>Earth Pit Position</th>
                <th>Age of Building</th>
                <th>Access to Roof</th>
                <th>Rooftop Height (Feet)</th>
                <th>Parapet Height (Feet)</th>
                <th>No. of Floors (G+...)</th>
                <th>Water Source for Cleaning</th>
                <th>Access to Site</th>
                <th>Distance of Site from Main Road (km)</th>
                <th>Building Image</th>
                <th>Roof Image</th>
                <th>Control Room</th>
                <th>Other Image</th>
                <th>PDF</th>
                <th>Survey Status</th>
                <th>Verify Status</th>
                <th>Verify Remarks</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer info & pagination */}
        <div className="bihar-table-footer">
          <div>
            Showing {filteredSites.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>Show:</span>
              <select
                className="bihar-select"
                style={{ width: 'auto', padding: '0.2rem 0.5rem' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'inline-flex', gap: 4 }}>
              <button
                type="button"
                className="bihar-btn bihar-btn--secondary"
                style={{ padding: '0.25rem 0.65rem' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="bihar-btn bihar-btn--secondary"
                style={{ padding: '0.25rem 0.65rem' }}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setPreviewImg(null)}
        >
          <div
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: 12,
              padding: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImg(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Survey Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Survey_SRT200MW_ViewData;
