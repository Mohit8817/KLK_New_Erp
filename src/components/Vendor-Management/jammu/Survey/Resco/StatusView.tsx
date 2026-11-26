import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSurveyAdminService,
  resolveJammuSurveyMediaUrl,
  type JKRescoSurveyItem,
} from '../jammuSurveyAdminService';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
  actionsRowStyle,
  footerStyle,
  centerCell,
  Modal,
  KpiCard,
  MediaFileThumbnail,
  MediaLightbox,
  StatusFeedbackBanners,
  fmtDate,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

export const JAMMU_RESCO_SURVEY_STATUS_OPTIONS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assigned', label: 'Assigned Sites' },
  { key: 'not-assigned', label: 'Unassigned Sites' },
  { key: 'survey-done', label: 'Survey Conducted' },
  { key: 'survey-pending', label: 'Pending Survey' },
  { key: 'survey-verify-complete', label: 'Verify Approved' },
  { key: 'survey-verify-pending', label: 'In Audit Review' },
  { key: 'survey-verify-reject', label: 'Survey Rejected' },
];

export const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'not-assigned', label: 'Unassigned' },
  { key: 'survey-done', label: 'Conducted' },
  { key: 'survey-pending', label: 'Pending' },
  { key: 'survey-verify-complete', label: 'Approved' },
  { key: 'survey-verify-pending', label: 'In Audit' },
  { key: 'survey-verify-reject', label: 'Rejected' },
];

function getSurveyStatusLabel(status: unknown): string {
  return Number(status ?? 0) === 1 ? 'Conducted' : 'Pending';
}

function getVerifyStatusLabel(item: JKRescoSurveyItem): string {
  const n = Number(item.survey_verify_status ?? item.verify_status ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Rejected';
  return 'In Review';
}

function getBosStatusLabel(item: JKRescoSurveyItem): string {
  if (Number(item.bos_verify_status ?? item.bos_status ?? 0) === 1 || Boolean(item.bos_file)) {
    return 'Cleared';
  }
  return 'Pending';
}

function getMaterialStatusLabel(item: JKRescoSurveyItem): string {
  return Number(item.material_status ?? 0) === 1 ? 'Dispatched' : 'Pending';
}

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || searchParams.get('district') || searchParams.get('vendor') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<JKRescoSurveyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Site detail preview modal & Media Lightbox
  const [detailModalSite, setDetailModalSite] = useState<JKRescoSurveyItem | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  // Fetch live rows from backend (zero fake data)
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: JKRescoSurveyItem[] = [];
      const backendStatus =
        status && status !== 'total' && status !== 'all' ? status.replace(/_/g, '-') : 'all';

      if (mode === 'vendor' && value) {
        data = await jammuSurveyAdminService.getRescoSurveyVendorwiseData(backendStatus, value);
      } else if (mode === 'district' && value) {
        data = await jammuSurveyAdminService.getRescoSurveyDistrictwiseData(backendStatus, value);
      } else {
        data = await jammuSurveyAdminService.getRescoSurveyViewDashboard(backendStatus);
      }

      // If drilldown returned 0 items on total/all, gracefully check view-survey
      if ((!data || data.length === 0) && (!backendStatus || backendStatus === 'total' || backendStatus === 'all')) {
        try {
          const vRes = await jammuSurveyAdminService.viewRescoSurvey();
          const p = vRes.pending || [];
          const v = vRes.verify || [];
          data = [...p, ...v];
        } catch {}
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('StatusView fetch error, fallback to view-survey:', err);
      try {
        const vRes = await jammuSurveyAdminService.viewRescoSurvey();
        const p = vRes.pending || [];
        const v = vRes.verify || [];
        setRows([...p, ...v]);
      } catch {
        setRows([]);
        setErrorMsg(err?.message || 'Failed to load Jammu RESCO survey status drill-down data.');
      }
    } finally {
      setLoading(false);
    }
  }, [status, mode, value]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Distinct districts for local quick filtering
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = String(r.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (districtFilter !== 'all') {
      list = list.filter((r) => String(r.district || '').trim().toLowerCase() === districtFilter.toLowerCase());
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.id,
        r.uid,
        r.unique_id,
        r.state,
        r.dept_name,
        r.district,
        r.phase,
        r.site_name,
        r.ca_no,
        r.vendor_name,
        r.vendor,
        r.survey_vendor,
        r.contact_person,
        r.contact_number,
        r.agency_person_name,
        r.agency_person_contact,
        r.nodal_person,
        r.contact_nodal,
        r.meter_number,
        r.meter_type,
        r.survey_remarks,
        r.survey_date,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, districtFilter, searchQuery]);

  const pagination = usePagination(filteredRows, { initialPageSize: 50 });

  // KPI metrics calculated from current dataset
  const metrics = useMemo(() => {
    let conducted = 0;
    let pendingSurvey = 0;
    let verifyApproved = 0;
    let verifyPending = 0;
    let verifyReject = 0;
    let assigned = 0;
    let notAssigned = 0;
    let bosCleared = 0;

    rows.forEach((r) => {
      const isDone = Number(r.survey_status) === 1;
      if (isDone) conducted += 1;
      else pendingSurvey += 1;

      const vs = Number(r.survey_verify_status ?? r.verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 2) verifyReject += 1;
      else if (isDone) verifyPending += 1;

      if (r.survey_vendor && r.survey_vendor !== '0' && r.survey_vendor !== 'NA') {
        assigned += 1;
      } else {
        notAssigned += 1;
      }

      if (Number(r.bos_verify_status ?? r.bos_status ?? 0) === 1 || Boolean(r.bos_file)) {
        bosCleared += 1;
      }
    });

    return {
      total: rows.length,
      conducted,
      pendingSurvey,
      verifyApproved,
      verifyPending,
      verifyReject,
      assigned,
      notAssigned,
      bosCleared,
    };
  }, [rows]);

  const exportCols = useMemo<ExportColumn<JKRescoSurveyItem>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: JKRescoSurveyItem, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU & KASHMIR' },
      { header: 'ID', accessor: (r) => r.id },
      { header: 'UID', accessor: (r) => r.uid || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Department', accessor: (r) => r.dept_name || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Volume', accessor: (r) => r.volume || '1' },
      { header: 'Phase', accessor: (r) => r.phase || DASH },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || (r.survey_vendor && r.survey_vendor !== '0' ? `Vendor #${r.survey_vendor}` : 'Unassigned') },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load || r.connected_load || r.connected ? `${r.sanction_load || r.connected_load || r.connected} kW` : DASH) },
      { header: 'Contact Person', accessor: (r) => r.contact_person || r.agency_person_name || DASH },
      { header: 'Contact Phone', accessor: (r) => r.contact_number || r.agency_person_contact || DASH },
      { header: 'Meter No.', accessor: (r) => r.meter_number || DASH },
      { header: 'Meter Type', accessor: (r) => r.meter_type || DASH },
      { header: 'Connection Phase', accessor: (r) => r.connection_phase || DASH },
      { header: 'Roof Condition', accessor: (r) => r.roof_condition || DASH },
      { header: 'Roof Area', accessor: (r) => (r.area_roof || r.total_roof_area ? `${r.area_roof || r.total_roof_area} Sq. Ft.` : DASH) },
      { header: 'Solar Free Space', accessor: (r) => (r.free_space_solar ? `${r.free_space_solar} Sq. Ft.` : DASH) },
      { header: 'Feasibility', accessor: (r) => r.site_feasible || DASH },
      { header: 'Survey Date', accessor: (r) => fmtDate(r.survey_date) },
      { header: 'Survey Status', accessor: (r) => getSurveyStatusLabel(r.survey_status) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.survey_verify_date ?? r.verify_date) },
      { header: 'BOS Status', accessor: (r) => getBosStatusLabel(r) },
      { header: 'Material Status', accessor: (r) => getMaterialStatusLabel(r) },
      { header: 'Remarks', accessor: (r) => r.survey_remarks || DASH },
    ],
    []
  );

  const handleStatusChange = (nextStatus: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', nextStatus);
    next.delete('label');
    setSearchParams(next);
    setDistrictFilter('all');
    pagination.setPage(1);
  };

  const clearDrillMode = () => {
    const next = new URLSearchParams();
    next.set('status', status);
    setSearchParams(next);
  };

  const titleLabel =
    customLabel ||
    JAMMU_RESCO_SURVEY_STATUS_OPTIONS.find(
      (o) => o.key === status || o.key === status.replace(/-/g, '_') || o.key === status.replace(/_/g, '-')
    )?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu RESCO Survey"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `Jammu & Kashmir RESCO Solar Survey Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'RESCO Survey Dashboard', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'View Jammu RESCO Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={fetchRows}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <Link to="/vendor-management/jammu/survey/resco/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              ← Back to Dashboard
            </Link>
          </div>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg=""
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => {}}
      />

      {/* Top KPI Summary Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" /></svg>}
          tone="accent"
          label="Total Records"
          value={fmtNum(metrics.total)}
          sub={filteredRows.length !== metrics.total ? `${fmtNum(filteredRows.length)} matching filters` : titleLabel}
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Survey Status"
          value={`${fmtNum(metrics.conducted)} / ${fmtNum(metrics.pendingSurvey)}`}
          sub="Conducted / Pending"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
          tone="cyan"
          label="Verification Status"
          value={`${fmtNum(metrics.verifyApproved)} / ${fmtNum(metrics.verifyPending)}`}
          sub={`${fmtNum(metrics.verifyReject)} Rejected`}
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          tone="violet"
          label="Allocated & BOS"
          value={`${fmtNum(metrics.assigned)} / ${fmtNum(metrics.bosCleared)}`}
          sub="Assigned / BOS Cleared"
        />
      </div>

      {/* Status Switcher Pills */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Status Filter:</span>
        {QUICK_STATUS_PILLS.map((pill) => {
          const isActive = status === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              className={`asw-pill-btn ${isActive ? 'active ax-btn--primary' : ''}`}
              onClick={() => handleStatusChange(pill.key)}
            >
              {pill.label}
            </button>
          );
        })}
        {mode && value && (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={clearDrillMode}
            style={{ marginLeft: 'auto', color: '#dc2626', fontWeight: 600 }}
          >
            Clear {mode}: {value} ×
          </button>
        )}
      </div>

      {/* Main Status View Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Jammu RESCO Survey</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{rows.length}</span> site survey record(s) · {titleLabel}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtOptions.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 155, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    pagination.setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              <select
                className="ax-input ax-input--sm"
                style={{ width: 185, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Select status view"
              >
                {JAMMU_RESCO_SURVEY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <SearchInput
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  pagination.setPage(1);
                }}
                placeholder="Search vendor, site, code, CA..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_Jammu_RESCO_Survey_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_Jammu_RESCO_Survey_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Jammu RESCO Survey — ${titleLabel}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">ID</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Volume / Phase</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Connection Phase</th>
                <th className="ax-table__th">Meter No. & Type</th>
                <th className="ax-table__th">Roof Area & Specs</th>
                <th className="ax-table__th">Feasibility</th>
                <th className="ax-table__th">Building Photo</th>
                <th className="ax-table__th">Roof Photo</th>
                <th className="ax-table__th">Control Room Photo</th>
                <th className="ax-table__th">Other Photo</th>
                <th className="ax-table__th">Single Line Diagram</th>
                <th className="ax-table__th">Survey Remarks</th>
                <th className="ax-table__th">Survey Date</th>
                <th className="ax-table__th">Survey Status</th>
                <th className="ax-table__th">Verify Date</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">BOS Status</th>
                <th className="ax-table__th">Material Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={28} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu RESCO survey records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={28} style={centerCell}>
                    <TableEmptyState title="No survey sites found" description="No Jammu RESCO survey sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isDone = Number(row.survey_status) === 1;
                  const verifyCode = Number(row.survey_verify_status ?? row.verify_status ?? 0);
                  const isBosCleared = Number(row.bos_verify_status ?? row.bos_status ?? 0) === 1 || Boolean(row.bos_file);
                  const isMatDispatched = Number(row.material_status ?? 0) === 1;

                  const buildingImg = row.image1 || row.building_image;
                  const roofImg = row.image2 || row.roof_image;
                  const controlImg = row.image3 || row.control_room_image;
                  const otherImg = row.image4 || row.image5 || row.other_image;
                  const pdfDoc = row.pdf_file || row.pdf;

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>#{row.id}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.uid || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || (row.survey_vendor && row.survey_vendor !== '0' ? `Vendor #${row.survey_vendor}` : 'Unassigned')}
                      </td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.dept_name || DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                        {row.site_name || DASH}
                      </td>
                      <td className="ax-table__td">
                        Vol {row.volume || '1'} {row.phase ? `· ${row.phase}` : ''}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.sanction_load || row.connected_load || row.connected ? `${row.sanction_load || row.connected_load || row.connected} kW` : DASH}
                      </td>
                      <td className="ax-table__td">{row.connection_phase || DASH}</td>
                      <td className="ax-table__td">
                        <div>{row.meter_number || DASH}</div>
                        {row.meter_type && <div style={{ fontSize: 11, color: '#64748b' }}>{row.meter_type}</div>}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.roof_condition || DASH}</div>
                        {(row.area_roof || row.total_roof_area) && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>{row.area_roof || row.total_roof_area} Sq. Ft.</div>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">
                          {row.site_feasible || 'Feasible'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={buildingImg ? resolveJammuSurveyMediaUrl(buildingImg, 'resco_image') : null}
                          alt="Building Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Building Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={roofImg ? resolveJammuSurveyMediaUrl(roofImg, 'resco_image') : null}
                          alt="Roof Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Roof Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={controlImg ? resolveJammuSurveyMediaUrl(controlImg, 'resco_image') : null}
                          alt="Control Room Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Control Room Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={otherImg ? resolveJammuSurveyMediaUrl(otherImg, 'resco_image') : null}
                          alt="Other Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Other Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={pdfDoc ? resolveJammuSurveyMediaUrl(pdfDoc, 'resco_pdf') : null}
                          alt="Single Line Diagram"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Single Line Diagram' })}
                        />
                      </td>
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={row.survey_remarks || ''}
                      >
                        {row.survey_remarks || DASH}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.survey_date)}</td>
                      <td className="ax-table__td">
                        {isDone ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Conducted</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.survey_verify_date ?? row.verify_date)}</td>
                      <td className="ax-table__td">
                        {verifyCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : verifyCode === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">In Review</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {isBosCleared ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Cleared</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {isMatDispatched ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Dispatched</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--xs ax-btn--secondary"
                          onClick={() => setDetailModalSite(row)}
                        >
                          Inspect Site
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Comprehensive Site Feasibility Inspection Modal */}
      {detailModalSite && (
        <Modal
          open={Boolean(detailModalSite)}
          onClose={() => setDetailModalSite(null)}
          title={`Technical Feasibility Audit: ${detailModalSite.site_name || `Site #${detailModalSite.id}`}`}
          subtitle={`Site ID: #${detailModalSite.id} · UID: ${detailModalSite.uid || DASH} · District: ${detailModalSite.district || DASH}`}
          maxWidth={820}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Verification Status:{' '}
                <b>{getVerifyStatusLabel(detailModalSite)}</b> · Survey Status:{' '}
                <b>{getSurveyStatusLabel(detailModalSite.survey_status)}</b>
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  to="/vendor-management/jammu/survey/resco/verify"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => setDetailModalSite(null)}
                >
                  Open in Verification Desk →
                </Link>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setDetailModalSite(null)}
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Grid 1: Basic & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                  Location &amp; Administrative Data
                </h4>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><b>Department:</b> {detailModalSite.dept_name || DASH}</div>
                  <div><b>District:</b> {detailModalSite.district || DASH}</div>
                  <div><b>Volume &amp; Phase:</b> Vol {detailModalSite.volume || '1'} · {detailModalSite.phase || DASH}</div>
                  <div><b>CA No:</b> {detailModalSite.ca_no || DASH}</div>
                  <div><b>Address:</b> {detailModalSite.survey_address || detailModalSite.site_address || detailModalSite.address || DASH}</div>
                  <div><b>Landmark:</b> {detailModalSite.near_landmark || detailModalSite.nearest_landmark || detailModalSite.landmark || DASH}</div>
                  <div><b>GPS Coordinates:</b> {detailModalSite.latitude || DASH}, {detailModalSite.longitude || DASH}</div>
                  <div><b>Nodal Person:</b> {detailModalSite.nodal_person || DASH} ({detailModalSite.contact_nodal || DASH})</div>
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                  Electrical Specifications
                </h4>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><b>Sanction Load:</b> {detailModalSite.sanction_load || DASH} kW</div>
                  <div><b>Connected Load:</b> {detailModalSite.connected_load || detailModalSite.connected || DASH} kW</div>
                  <div><b>Load Type:</b> {detailModalSite.load_type || DASH}</div>
                  <div><b>Connection Phase:</b> {detailModalSite.connection_phase || DASH}</div>
                  <div><b>Meter Connection:</b> {detailModalSite.meter_connection || DASH}</div>
                  <div><b>Meter Number:</b> {detailModalSite.meter_number || DASH} ({detailModalSite.meter_type || DASH})</div>
                  <div><b>LTDB Present:</b> {detailModalSite.ltdb_present === '1' || detailModalSite.ltdb_present === 'Yes' ? 'Yes' : 'No'}</div>
                  <div><b>All 3-Phase LTDB:</b> {detailModalSite.all_3_phase_ltdb === '1' || detailModalSite.all_3_phase_ltdb === 'Yes' ? 'Yes' : 'No'}</div>
                  <div><b>Missing Phase:</b> {detailModalSite.missing_phase || 'None'}</div>
                  <div><b>Earth Pit:</b> {detailModalSite.earth_pit || DASH}</div>
                </div>
              </div>
            </div>

            {/* Grid 2: Rooftop Feasibility */}
            <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Rooftop &amp; Civil Feasibility
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6, fontSize: 13 }}>
                <div><b>Roof Condition:</b> {detailModalSite.roof_condition || DASH}</div>
                <div><b>Roof Access:</b> {detailModalSite.roof_access || DASH}</div>
                <div><b>Total Roof Area:</b> {detailModalSite.area_roof || detailModalSite.total_roof_area || DASH} Sq. Ft.</div>
                <div><b>Solar Free Space:</b> {detailModalSite.free_space_solar || DASH} Sq. Ft.</div>
                <div><b>Inverter Free Space:</b> {detailModalSite.free_space_inverter || DASH} Sq. Ft.</div>
                <div><b>Building Age:</b> {detailModalSite.building_age || DASH} yrs</div>
                <div><b>Rooftop Height:</b> {detailModalSite.rooftop_height || DASH} m</div>
                <div><b>Parapet Height:</b> {detailModalSite.parapet_height || DASH} m</div>
                <div><b>Number of Floors:</b> {detailModalSite.floors_number || DASH}</div>
                <div><b>Water Source:</b> {detailModalSite.water_source || DASH}</div>
                <div><b>Site Access:</b> {detailModalSite.site_access || DASH}</div>
                <div><b>Site Distance:</b> {detailModalSite.site_distance || DASH} m</div>
                <div style={{ gridColumn: '1 / -1' }}><b>Survey Remarks:</b> {detailModalSite.survey_remarks || DASH}</div>
              </div>
            </div>

            {/* Section 3: Media Dossier */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Field Photo Dossier &amp; Drawings
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Building Front View', src: detailModalSite.image1 || detailModalSite.building_image },
                  { label: 'Rooftop Overview', src: detailModalSite.image2 || detailModalSite.roof_image },
                  { label: 'Control Room / LTDB', src: detailModalSite.image3 || detailModalSite.control_room_image },
                  { label: 'Other Inspection', src: detailModalSite.image4 || detailModalSite.image5 || detailModalSite.other_image },
                  { label: 'Single Line Diagram', src: detailModalSite.pdf_file || detailModalSite.pdf },
                ].map((m, idx) => {
                  const resolved = resolveJammuSurveyMediaUrl(m.src, m.label.includes('Diagram') ? 'resco_pdf' : 'resco_image');
                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid var(--ax-border, #cbd5e1)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#fff',
                        cursor: resolved ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (resolved) setLightbox({ url: resolved, title: m.label });
                      }}
                    >
                      <div style={{ height: 85, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {resolved ? (
                          resolved.endsWith('.pdf') ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>📄 PDF Document</span>
                          ) : (
                            <img
                              src={resolved}
                              alt={m.label}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Not Uploaded</span>
                        )}
                      </div>
                      <div
                        style={{
                          padding: '4px 6px',
                          fontSize: 11,
                          textAlign: 'center',
                          background: '#fafafa',
                          borderTop: '1px solid #f1f5f9',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default StatusView;
