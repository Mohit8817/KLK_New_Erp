import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type AssignSiteItem,
} from '../../../../../services/biharUlaInstallationService';
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
} from '../../../../../common';

const DASH = '—';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_BACK = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_EYE = (
  <svg style={{ width: 13, height: 13 }} {...ICON_PROPS}>
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

export function Bihar_Installation_ULA_AssignSiteDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const assignId = searchParams.get('id') || (location.state as any)?.assignment?.id || '';

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignSiteItem | null>(
    (location.state as any)?.assignment || null
  );
  const [sites, setSites] = useState<any[]>(
    (location.state as any)?.assignment?.sites || []
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected site for detailed modal view
  const [activeSite, setActiveSite] = useState<any | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  // Load detailed assignment data
  const loadDetail = useCallback(async () => {
    if (!assignId) {
      setErrorMsg('No assignment ID specified in request URL.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data: any = await biharUlaInstallationService.getAssignSiteDetail(assignId);
      if (data) {
        setAssignment(data);
        const rawSites = data.sites || data;
        const normalized = Array.isArray(rawSites) ? rawSites : [rawSites];
        setSites(normalized);
      } else {
        setErrorMsg(`Unable to load details for assignment #${assignId}.`);
      }
    } catch (err: any) {
      console.error('[AssignSiteDetail] fetch error:', err);
      setErrorMsg(err?.message || 'Failed to load assignment site details.');
    } finally {
      setLoading(false);
    }
  }, [assignId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // KPIs
  const totalSites = sites.length;
  const structureDoneCount = sites.filter((s) => Number(s.structure_status) === 1).length;
  const structureApprovedCount = sites.filter((s) => Number(s.structure_verify_status) === 1).length;
  const instDoneCount = sites.filter((s) => Number(s.inst_status) === 1).length;
  const instApprovedCount = sites.filter((s) => Number(s.inst_verify_status) === 1).length;

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => {
      return (
        String(s.id ?? '').includes(q) ||
        String(s.unique_id ?? '').toLowerCase().includes(q) ||
        String(s.beneficiary_name ?? '').toLowerCase().includes(q) ||
        String(s.ca_no ?? '').toLowerCase().includes(q) ||
        String(s.contact_no ?? '').includes(q) ||
        String(s.wo_no ?? '').toLowerCase().includes(q) ||
        String(s.district ?? '').toLowerCase().includes(q) ||
        String(s.block ?? '').toLowerCase().includes(q) ||
        String(s.village ?? '').toLowerCase().includes(q) ||
        String(s.firm_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [sites, search]);

  // Paginated
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  // Export Columns
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Site ID', accessor: (r) => `#${r.id}` },
      { header: 'Unique ID', accessor: (r) => r.unique_id || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Contact No', accessor: (r) => r.contact_no || DASH },
      { header: 'Firm Name', accessor: (r) => r.firm_name || DASH },
      { header: 'CA No', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanction Load (kW)', accessor: (r) => r.sanction_load ?? DASH },
      { header: 'Discom', accessor: (r) => r.discom || DASH },
      { header: 'WO No', accessor: (r) => r.wo_no || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Structure Verify', accessor: (r) => (Number(r.structure_verify_status) === 1 ? 'Approved' : 'Pending') },
      { header: 'Install Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Install Verify', accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : 'Pending') },
      { header: 'Solar Meter No', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No', accessor: (r) => r.inverter_no || DASH },
    ],
    []
  );

  return (
    <div className="ax-page">
      {/* 1. Header */}
      <PageHead
        title={`Bihar - Installation > ULA > Assignment #${assignId || 'Detail'}`}
        subtitle="Complete site details, consumer information, structure status, and installation records"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Request Accept', href: '/v/bihar/ula-installation-view-assign-site' },
          { label: `Batch #${assignId}` },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => navigate('/v/bihar/ula-installation-view-assign-site')}
            >
              {ICON_BACK}
              <span className="ax-btn__label">Back to Requests</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
              onClick={loadDetail}
              disabled={loading}
              title="Refresh"
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
          </div>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* 2. Batch Overview Summary Card */}
        <section className="ax-card ax-col--12" style={{ padding: '16px 20px', borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div>
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ marginBottom: 6 }}>
                Assignment Batch #{assignId}
              </span>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Vendor: {assignment?.vendors?.name || 'Assigned Partner'}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                Assigned Date: <b>{assignment?.created_at || (sites[0]?.inst_assign_date) || DASH}</b> · Deadline:{' '}
                <b>{assignment?.deadline_date || (sites[0]?.inst_deadline) || DASH}</b>
                {assignment?.remarks ? ` · Remarks: ${assignment.remarks}` : ''}
              </p>
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ padding: '6px 12px', fontSize: 'var(--ax-text-xs)' }}>
                Total Allocated: <b>{totalSites} Sites</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ padding: '6px 12px', fontSize: 'var(--ax-text-xs)' }}>
                Structure Done: <b>{structureDoneCount}</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--emerald ax-badge--pill" style={{ padding: '6px 12px', fontSize: 'var(--ax-text-xs)' }}>
                Electric Installed: <b>{instDoneCount}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Batch Metrics (4 KPI Cards) */}
        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--neutral">Batch Sites</span>
            </div>
            <div className="ax-kpi__label">Total Sites in Batch</div>
            <div className="ax-kpi__value ax-num">{totalSites}</div>
            <div className="ax-kpi__caption">Allocated for installation</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">Phase 1</span>
            </div>
            <div className="ax-kpi__label">Structure Complete / Pend</div>
            <div className="ax-kpi__value ax-num">
              {structureDoneCount}{' '}
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                / {totalSites - structureDoneCount}
              </span>
            </div>
            <div className="ax-kpi__caption">Verified: {structureApprovedCount} approved</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Phase 2</span>
            </div>
            <div className="ax-kpi__label">Electric Install / Pend</div>
            <div className="ax-kpi__value ax-num">
              {instDoneCount}{' '}
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                / {totalSites - instDoneCount}
              </span>
            </div>
            <div className="ax-kpi__caption">Verified: {instApprovedCount} approved</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--accent">Status</span>
            </div>
            <div className="ax-kpi__label">Assignment Status</div>
            <div className="ax-kpi__value" style={{ fontSize: '1.25rem' }}>
              {Number(assignment?.status) === 2 || sites[0]?.inst_accept === 1 ? (
                <span className="ax-badge ax-badge--soft ax-badge--success">Accepted</span>
              ) : (
                <span className="ax-badge ax-badge--soft ax-badge--warning">Pending Accept</span>
              )}
            </div>
            <div className="ax-kpi__caption">Work Order: {sites[0]?.wo_no || DASH}</div>
          </div>
        </div>

        {/* 4. Main Comprehensive Sites Table */}
        <section className="ax-card ax-col--12" aria-labelledby="sites-table-title">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)', padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-accent)', fontWeight: 700 }}>
                Beneficiary Locations &amp; Technical Parameters
              </span>
              <h3 id="sites-table-title" className="ax-card__title" style={{ fontSize: '1.25rem', marginTop: 2 }}>
                Sites Included in Assignment #{assignId}
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                Consumer identity, load, location, structure status, and commissioning parameters
              </p>
            </div>

            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div style={{ width: 250 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search consumer, CA, village…"
                />
              </div>

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportDataToCSV(filteredSites, exportCols, `ula_assignment_${assignId}_sites.csv`)}
                onExportExcel={() => exportDataToExcel(filteredSites, exportCols, `ula_assignment_${assignId}_sites.xlsx`)}
                onPrint={() => printTableData(filteredSites, exportCols, `ULA Assignment #${assignId} Sites Breakdown`)}
              />
            </div>
          </div>

          <div className="ax-card__body" style={{ padding: 0 }}>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ width: 50 }}>Sr.</th>
                    <th className="ax-table__th">Beneficiary &amp; Contact</th>
                    <th className="ax-table__th">CA &amp; Load</th>
                    <th className="ax-table__th">Work Order</th>
                    <th className="ax-table__th">Location (District / Block / Village)</th>
                    <th className="ax-table__th">Structure Status</th>
                    <th className="ax-table__th">Structure Verify</th>
                    <th className="ax-table__th">Electric Status</th>
                    <th className="ax-table__th">Electric Verify</th>
                    <th className="ax-table__th">Metering Equipment</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: 'var(--ax-space-8)' }}>
                        <span className="ax-spinner" /> Loading assignment site records…
                      </td>
                    </tr>
                  ) : paginatedSites.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <TableEmptyState
                          title="No sites found"
                          message="No site records match your search criteria for this assignment."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedSites.map((s, index) => {
                      const isStructDone = Number(s.structure_status) === 1;
                      const isInstDone = Number(s.inst_status) === 1;
                      const isStructApproved = Number(s.structure_verify_status) === 1;
                      const isInstApproved = Number(s.inst_verify_status) === 1;

                      return (
                        <tr key={s.id || index} className="ax-table__row">
                          <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>

                          {/* Beneficiary & Contact */}
                          <td className="ax-table__td">
                            <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {s.beneficiary_name || DASH}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                              Ph: {s.contact_no || DASH}
                            </div>
                            {s.firm_name && (
                              <div style={{ fontSize: '11px', color: 'var(--ax-accent)' }}>
                                Firm: {s.firm_name}
                              </div>
                            )}
                          </td>

                          {/* CA & Load */}
                          <td className="ax-table__td">
                            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {s.ca_no || DASH}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                              Load: <b>{s.sanction_load ?? DASH} kW</b> · {s.discom || 'DISCOM'}
                            </div>
                            {s.phase && (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                {s.phase}
                              </span>
                            )}
                          </td>

                          {/* Work Order */}
                          <td className="ax-table__td">
                            <div><b>{s.wo_no || DASH}</b></div>
                            {s.wo_date && (
                              <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                                Date: {s.wo_date}
                              </div>
                            )}
                            <div style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>
                              UID: {s.unique_id || `#${s.id}`}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="ax-table__td">
                            <div><b>{s.district || DASH}</b></div>
                            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                              {s.block || DASH} / {s.village || DASH}
                            </div>
                            {s.address && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-subtle)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.address}
                              </div>
                            )}
                          </td>

                          {/* Structure Status */}
                          <td className="ax-table__td">
                            {isStructDone ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                                <span className="ax-badge__dot" /> Done
                              </span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">
                                <span className="ax-badge__dot" /> Pending
                              </span>
                            )}
                            {s.structure_date && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>{s.structure_date}</div>
                            )}
                          </td>

                          {/* Structure Verify */}
                          <td className="ax-table__td">
                            {isStructApproved ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                            ) : Number(s.structure_verify_status) === 2 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                            )}
                            {s.structure_verify_remarks && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.structure_verify_remarks}
                              </div>
                            )}
                          </td>

                          {/* Electric Install Status */}
                          <td className="ax-table__td">
                            {isInstDone ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                                <span className="ax-badge__dot" /> Done
                              </span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                                <span className="ax-badge__dot" /> Pending
                              </span>
                            )}
                            {s.inst_date && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>{s.inst_date}</div>
                            )}
                          </td>

                          {/* Electric Verify */}
                          <td className="ax-table__td">
                            {isInstApproved ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                            ) : Number(s.inst_verify_status) === 2 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                            )}
                          </td>

                          {/* Metering Equipment */}
                          <td className="ax-table__td" style={{ fontSize: '11px' }}>
                            <div><b>Solar:</b> {s.solarmeter_no || DASH}</div>
                            <div><b>Inv:</b> {s.inverter_no || DASH}</div>
                            <div><b>Net M:</b> {s.nm_sm_no || DASH}</div>
                          </td>

                          {/* Actions */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ height: 28, padding: '0 10px', fontSize: '11px', gap: 4 }}
                              onClick={() => setActiveSite(s)}
                            >
                              {ICON_EYE}
                              <span className="ax-btn__label">All Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalCount={filteredSites.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── 5. Full Individual Site Details Modal ── */}
      {activeSite && (
        <div className="ax-modal-backdrop" onClick={() => setActiveSite(null)}>
          <div className="ax-modal" style={{ maxWidth: 960 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
              <div>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ marginBottom: 4 }}>
                  Site UID: #{activeSite.unique_id || activeSite.id} · ID: {activeSite.id}
                </span>
                <h3 className="ax-modal__title" style={{ margin: 0, fontSize: '1.25rem' }}>
                  {activeSite.beneficiary_name} — Comprehensive Site Dossier
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  CA: {activeSite.ca_no || DASH} · Work Order: {activeSite.wo_no || DASH} · Discom: {activeSite.discom || DASH}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                onClick={() => setActiveSite(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>
              <div className="ax-dash-grid">
                {/* Section A: Consumer & Utility Connection */}
                <div className="ax-card ax-col--12" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Consumer Identity &amp; Utility Connection
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: 'var(--ax-text-xs)' }}>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Consumer Name:</span> <b>{activeSite.beneficiary_name || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Number:</span> <b>{activeSite.contact_no || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Firm Name:</span> <b>{activeSite.firm_name || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>CA Number:</span> <b>{activeSite.ca_no || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanction Load:</span> <b>{activeSite.sanction_load ?? DASH} kW</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Connection Phase:</span> <b>{activeSite.phase || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>DISCOM:</span> <b>{activeSite.discom || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Volume:</span> <b>{activeSite.volume || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Company ID:</span> <b>{activeSite.company_id || DASH}</b></div>
                  </div>
                </div>

                {/* Section B: Geographic Address */}
                <div className="ax-card ax-col--12" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. Geographic Location
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: 'var(--ax-text-xs)' }}>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{activeSite.state || 'Bihar'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{activeSite.district || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Block:</span> <b>{activeSite.block || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Village:</span> <b>{activeSite.village || DASH}</b></div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Street Address:</span> <b>{activeSite.address || DASH}</b>
                    </div>
                  </div>
                </div>

                {/* Section C: Assignment & Work Order */}
                <div className="ax-card ax-col--12" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    3. Work Order &amp; Partner Assignment
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: 'var(--ax-text-xs)' }}>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Work Order No:</span> <b>{activeSite.wo_no || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Work Order Date:</span> <b>{activeSite.wo_date || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Assigned Partner ID:</span> <b>{activeSite.inst_vendor || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Assigned Date:</span> <b>{activeSite.inst_assign_date || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Deadline Date:</span> <b>{activeSite.inst_deadline || DASH}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Assignment Batch ID:</span> <b>{activeSite.inst_assigned_id || DASH}</b></div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Acceptance Status:</span>{' '}
                      <b>{activeSite.inst_accept === 1 ? 'Accepted' : 'Pending Accept'}</b>
                    </div>
                  </div>
                </div>

                {/* Section D: Structure Erection & Module Serials */}
                <div className="ax-card ax-col--6" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-viz-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    4. Phase 1: Structure Erection
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--ax-text-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Structure Status:</span>
                      <span className={`ax-badge ax-badge--soft ${Number(activeSite.structure_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                        {Number(activeSite.structure_status) === 1 ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Structure Date:</span>
                      <b>{activeSite.structure_date || DASH}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Verification Status:</span>
                      <span className={`ax-badge ax-badge--soft ${Number(activeSite.structure_verify_status) === 1 ? 'ax-badge--success' : 'ax-badge--neutral'}`}>
                        {Number(activeSite.structure_verify_status) === 1 ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Module Serial Number(s):</span>
                      <div style={{ marginTop: 4, fontFamily: 'monospace', background: 'var(--ax-surface-subtle)', padding: '6px 8px', borderRadius: 4 }}>
                        {activeSite.module_serial_no || 'Not recorded yet'}
                      </div>
                    </div>
                    {activeSite.structure_verify_remarks && (
                      <div>
                        <span style={{ color: 'var(--ax-text-muted)' }}>Verification Remarks:</span>
                        <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{activeSite.structure_verify_remarks}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section E: Electrical Commissioning & Equipment */}
                <div className="ax-card ax-col--6" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-viz-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    5. Phase 2: Electrical Commissioning
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--ax-text-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Installation Status:</span>
                      <span className={`ax-badge ax-badge--soft ${Number(activeSite.inst_status) === 1 ? 'ax-badge--success' : 'ax-badge--neutral'}`}>
                        {Number(activeSite.inst_status) === 1 ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Installation Date:</span>
                      <b>{activeSite.inst_date || DASH}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Verification Status:</span>
                      <span className={`ax-badge ax-badge--soft ${Number(activeSite.inst_verify_status) === 1 ? 'ax-badge--success' : 'ax-badge--neutral'}`}>
                        {Number(activeSite.inst_verify_status) === 1 ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Geo Coordinates:</span>
                      <b>
                        {activeSite.inst_latitude && activeSite.inst_longitude
                          ? `${activeSite.inst_latitude}, ${activeSite.inst_longitude}`
                          : DASH}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Solar Meter No:</span>
                      <b>{activeSite.solarmeter_no || DASH}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Inverter Serial No:</span>
                      <b>{activeSite.inverter_no || DASH}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Net Meter / Smart Meter:</span>
                      <b>{activeSite.nm_sm_no || DASH}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Data Logger No:</span>
                      <b>{activeSite.loger_no || DASH}</b>
                    </div>
                  </div>
                </div>

                {/* Section F: Documentation, Claims & Payments */}
                <div className="ax-card ax-col--12" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-viz-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    6. Documentation, Claims &amp; Payments
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: 'var(--ax-text-xs)' }}>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Commissioning Doc Submit:</span>{' '}
                      <b>{Number(activeSite.inst_doc_submit) === 1 ? 'Submitted' : 'Pending'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Doc Verify Status:</span>{' '}
                      <b>{Number(activeSite.inst_doc_verify_status) === 1 ? 'Approved' : 'Pending'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>50% Advance Claim:</span>{' '}
                      <b>{Number(activeSite.inst_pay50_claim_status) === 1 ? 'Claim Raised' : 'Not Raised'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>50% Payment Status:</span>{' '}
                      <b>{Number(activeSite.inst_pay50_status) === 1 ? 'Paid' : 'Pending'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Final Claim Status:</span>{' '}
                      <b>{Number(activeSite.inst_claim_status) === 1 ? 'Claim Raised' : 'Not Raised'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ax-text-muted)' }}>Final Payment Status:</span>{' '}
                      <b>{Number(activeSite.inst_pay_status) === 1 ? 'Disbursed' : 'Pending'}</b>
                    </div>
                  </div>
                </div>

                {/* Section G: Uploaded Inspection Photos */}
                <div className="ax-card ax-col--12" style={{ padding: '16px', background: 'var(--ax-bg-surface)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    7. Inspection Media &amp; Uploaded Photos
                  </h4>
                  <div className="ax-cluster" style={{ gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'structure_image', label: 'Structure Photo' },
                      { key: 'complete_photo', label: 'Complete Plant Photo' },
                      { key: 'inverter_image', label: 'Inverter Photo' },
                      { key: 'earthing_image', label: 'Earthing Photo' },
                      { key: 'acdb_image', label: 'ACDB Photo' },
                      { key: 'solar_meter_image', label: 'Solar Meter Photo' },
                      { key: 'la_image', label: 'Lightning Arrester Photo' },
                    ].map((img) => {
                      const url = activeSite[img.key];
                      if (!url) return null;
                      return (
                        <button
                          key={img.key}
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ fontSize: '11px', height: 28 }}
                          onClick={() => setPreviewMedia({ url, title: img.label })}
                        >
                          {ICON_EYE}
                          <span className="ax-btn__label">{img.label}</span>
                        </button>
                      );
                    })}
                    {!activeSite.structure_image &&
                      !activeSite.complete_photo &&
                      !activeSite.inverter_image &&
                      !activeSite.earthing_image && (
                        <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                          No physical photos uploaded for this site yet.
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setActiveSite(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Image Preview Modal ── */}
      {previewMedia && (
        <div className="ax-modal-backdrop" onClick={() => setPreviewMedia(null)}>
          <div className="ax-modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <h4 className="ax-modal__title">{previewMedia.title}</h4>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setPreviewMedia(null)}>✕</button>
            </div>
            <div className="ax-modal__body" style={{ textAlign: 'center', padding: 'var(--ax-space-3)' }}>
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-sm)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">Image not available</text></svg>';
                }}
              />
            </div>
            <div className="ax-modal__footer">
              <a href={previewMedia.url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
                Open Full Size
              </a>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setPreviewMedia(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_AssignSiteDetail;
