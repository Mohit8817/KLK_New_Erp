import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type StructureSiteItem,
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

export function Bihar_Installation_ULA_ViewInstallation() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<StructureSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedInstStatus, setSelectedInstStatus] = useState<string>('All');

  // Preview Modal
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Electrical Install Modal
  const [electricModalSite, setElectricModalSite] = useState<StructureSiteItem | null>(null);
  const [solarmeterNo, setSolarmeterNo] = useState('');
  const [inverterNo, setInverterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');
  const [logerNo, setLogerNo] = useState('');
  const [instRemarks, setInstRemarks] = useState('');
  const [completePhoto, setCompletePhoto] = useState<File | null>(null);
  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [earthingImage, setEarthingImage] = useState<File | null>(null);
  const [acdbImage, setAcdbImage] = useState<File | null>(null);
  const [solarMeterImage, setSolarMeterImage] = useState<File | null>(null);
  const [laImage, setLaImage] = useState<File | null>(null);
  const [electricSubmitting, setElectricSubmitting] = useState(false);
  const [electricError, setElectricError] = useState<string | null>(null);

  // Doc Upload Modal
  const [docModalSite, setDocModalSite] = useState<StructureSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Feedback Notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewInstalledSites();
      setSites(data || []);
    } catch (err: any) {
      console.error('Failed to load installed sites:', err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract distinct districts
  const districtList = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district) set.add(s.district);
    });
    return Array.from(set).sort();
  }, [sites]);

  // KPIs
  const totalSites = sites.length;
  const structVerifiedCount = sites.filter((s) => Number(s.structure_verify_status) === 1).length;
  const electricCompleteCount = sites.filter((s) => Number(s.inst_status) === 1).length;
  const electricVerifiedCount = sites.filter((s) => Number(s.inst_verify_status) === 1).length;

  // Filtered
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      const matchDistrict = selectedDistrict === 'All' || s.district?.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedInstStatus === 'Complete') matchStatus = Number(s.inst_status) === 1;
      else if (selectedInstStatus === 'Pending') matchStatus = Number(s.inst_status) !== 1;
      else if (selectedInstStatus === 'Verified') matchStatus = Number(s.inst_verify_status) === 1;

      if (!matchDistrict || !matchStatus) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.beneficiary_name?.toLowerCase().includes(q) ||
        s.ca_no?.toLowerCase().includes(q) ||
        s.contact_no?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.block?.toLowerCase().includes(q) ||
        s.village?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [sites, selectedDistrict, selectedInstStatus, search]);

  // Paginated
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  // Helpers to parse JSON or comma separated values
  const parseList = (val?: string | string[]): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not json
    }
    return [String(val)];
  };

  // Submit Electric Install
  const handleSubmitElectric = async (e: FormEvent) => {
    e.preventDefault();
    if (!electricModalSite) return;
    setElectricError(null);
    setElectricSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(electricModalSite.id));
      if (solarmeterNo.trim()) fd.append('solarmeter_no', solarmeterNo.trim());
      if (inverterNo.trim()) fd.append('inverter_no', inverterNo.trim());
      if (nmSmNo.trim()) fd.append('nm_sm_no', nmSmNo.trim());
      if (logerNo.trim()) fd.append('loger_no', logerNo.trim());
      if (instRemarks.trim()) fd.append('inst_remarks', instRemarks.trim());

      if (completePhoto) fd.append('complete_photo', completePhoto);
      if (inverterImage) fd.append('inverter_image', inverterImage);
      if (earthingImage) fd.append('earthing_image', earthingImage);
      if (acdbImage) fd.append('acdb_image', acdbImage);
      if (solarMeterImage) fd.append('solar_meter_image', solarMeterImage);
      if (laImage) fd.append('la_image', laImage);

      await biharUlaInstallationService.storeInstallation(fd);
      setToastMsg({ type: 'success', text: 'Electrical installation saved successfully!' });
      setElectricModalSite(null);
      await loadData();
    } catch (err: any) {
      setElectricError(err?.message || 'Failed to save electrical installation.');
    } finally {
      setElectricSubmitting(false);
    }
  };

  // Submit Commissioning Doc
  const handleSubmitDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite || !docFile) return;
    setDocError(null);
    setDocSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(docModalSite.id));
      fd.append('file', docFile);

      await biharUlaInstallationService.uploadInstallationDoc(fd);
      setToastMsg({ type: 'success', text: 'Installation document uploaded successfully!' });
      setDocModalSite(null);
      setDocFile(null);
      await loadData();
    } catch (err: any) {
      setDocError(err?.message || 'Failed to upload document.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<StructureSiteItem>[] = useMemo(
    () => [
      { header: 'ID', accessor: (r) => `#${r.id}` },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no || '' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Structure Verify', accessor: (r) => (Number(r.structure_verify_status) === 1 ? 'Approved' : 'Pending') },
      { header: 'Electric Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || '—' },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || '—' },
      { header: 'Net Meter No.', accessor: (r) => r.nm_sm_no || '—' },
      { header: 'Logger No.', accessor: (r) => r.loger_no || '—' },
    ],
    []
  );

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > View Installation"
        subtitle="Manage structure erection, electrical commissioning, and physical verification media"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'View Installation' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/bihar/ula-installation-pending-structure-site" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Structure</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* KPI Cards */}
        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">Structure Done</span>
            </div>
            <div className="ax-kpi__label">Total Installed Structures</div>
            <div className="ax-kpi__value ax-num">{totalSites}</div>
            <div className="ax-kpi__caption">Sites with structure erected</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Structure Verified</span>
            </div>
            <div className="ax-kpi__label">Structure Verified</div>
            <div className="ax-kpi__value ax-num">{structVerifiedCount}</div>
            <div className="ax-kpi__caption">Approved upon structure inspection</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Electric Done</span>
            </div>
            <div className="ax-kpi__label">Electric Commissioned</div>
            <div className="ax-kpi__value ax-num">{electricCompleteCount}</div>
            <div className="ax-kpi__caption">Inverter, wiring & meter complete</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Fully Approved</span>
            </div>
            <div className="ax-kpi__label">Installation Verified</div>
            <div className="ax-kpi__value ax-num">{electricVerifiedCount}</div>
            <div className="ax-kpi__caption">Officially verified installation</div>
          </div>
        </div>

        {/* Filter and Table Card */}
        <section className="ax-card ax-col--12" aria-labelledby="install-table-title">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div>
                <h3 id="install-table-title" className="ax-card__title">ULA Installation Records</h3>
                <p className="ax-card__subtitle">Comprehensive list of installed structures and commissioning data</p>
              </div>
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV(filteredSites, exportCols, 'bihar_ula_installations.csv')}
                onExportExcel={() => exportDataToExcel(filteredSites, exportCols, 'bihar_ula_installations.xlsx')}
                onPrint={() => printTableData(filteredSites, exportCols, 'Bihar ULA Installation Records')}
                onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
              />
            </div>
          </div>

          <div className="ax-card__body">
            {/* Filter toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <div style={{ width: 260 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search consumer, CA, district..."
                />
              </div>

              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="dist_filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  District:
                </label>
                <select
                  id="dist_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="status_filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  Electric Status:
                </label>
                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedInstStatus}
                  onChange={(e) => {
                    setSelectedInstStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Complete">Complete</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified Approved</option>
                </select>
              </div>

              {(selectedDistrict !== 'All' || selectedInstStatus !== 'All' || search) && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => {
                    setSelectedDistrict('All');
                    setSelectedInstStatus('All');
                    setSearch('');
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ fontSize: 'var(--ax-text-xs)' }}>
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Beneficiary Details</th>
                    <th>Location</th>
                    <th>Module Serials</th>
                    <th>Structure Photos</th>
                    <th>Structure Status</th>
                    <th>Structure Verify</th>
                    <th>Electric Equipments</th>
                    <th>Electric Photos</th>
                    <th>Electric Status</th>
                    <th>Electric Verify</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                        <span className="ax-spinner" /> Loading installation records...
                      </td>
                    </tr>
                  ) : paginatedSites.length === 0 ? (
                    <tr>
                      <td colSpan={12}>
                        <TableEmptyState title="No installation records found" message="Try adjusting your filters or search query." />
                      </td>
                    </tr>
                  ) : (
                    paginatedSites.map((s, index) => {
                      const modSerials = parseList(s.module_serial_no);
                      const modImages = parseList(s.module_serial_image);
                      const fastenerImages = parseList(s.foundation_fastener_images);
                      const isElectricDone = Number(s.inst_status) === 1;

                      return (
                        <tr key={s.id}>
                          <td>{(currentPage - 1) * pageSize + index + 1}</td>
                          {/* Beneficiary Details */}
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{s.beneficiary_name || '—'}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}>CA: {s.ca_no || '—'}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}>Ph: {s.contact_no || '—'}</div>
                          </td>
                          {/* Location */}
                          <td>
                            <div><b>{s.district || '—'}</b></div>
                            <div>{s.block || '—'} / {s.village || '—'}</div>
                            <div style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>
                              {s.inst_latitude ? `${Number(s.inst_latitude).toFixed(4)}, ${Number(s.inst_longitude).toFixed(4)}` : ''}
                            </div>
                          </td>
                          {/* Module Serials */}
                          <td>
                            {modSerials.length > 0 ? (
                              modSerials.map((sn, i) => (
                                <div key={i} style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                  #{i + 1}: {sn}
                                </div>
                              ))
                            ) : (
                              '—'
                            )}
                          </td>
                          {/* Structure Photos */}
                          <td>
                            <div className="ax-cluster" style={{ gap: '4px' }}>
                              {s.structure_image && (
                                <button
                                  type="button"
                                  className="ax-badge ax-badge--soft ax-badge--info"
                                  style={{ cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                                  onClick={() => setPreviewImg(s.structure_image!)}
                                >
                                  Structure
                                </button>
                              )}
                              {fastenerImages.length > 0 && (
                                <button
                                  type="button"
                                  className="ax-badge ax-badge--soft ax-badge--neutral"
                                  style={{ cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                                  onClick={() => setPreviewImg(fastenerImages[0])}
                                >
                                  Fasteners ({fastenerImages.length})
                                </button>
                              )}
                              {modImages.length > 0 && (
                                <button
                                  type="button"
                                  className="ax-badge ax-badge--soft ax-badge--neutral"
                                  style={{ cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                                  onClick={() => setPreviewImg(modImages[0])}
                                >
                                  Mod Serials ({modImages.length})
                                </button>
                              )}
                            </div>
                          </td>
                          {/* Structure Status */}
                          <td>
                            {Number(s.structure_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                            {s.structure_date && <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>{s.structure_date}</div>}
                          </td>
                          {/* Structure Verify */}
                          <td>
                            {Number(s.structure_verify_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                            ) : Number(s.structure_verify_status) === 2 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                            {s.verify_remarks && <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.verify_remarks}</div>}
                          </td>
                          {/* Electric Equipments */}
                          <td>
                            {isElectricDone ? (
                              <div style={{ fontSize: '11px' }}>
                                <div><b>Solar M:</b> {s.solarmeter_no || '—'}</div>
                                <div><b>Inv:</b> {s.inverter_no || '—'}</div>
                                <div><b>Net M:</b> {s.nm_sm_no || '—'}</div>
                                <div><b>Log:</b> {s.loger_no || '—'}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ax-text-muted)' }}>Not Installed</span>
                            )}
                          </td>
                          {/* Electric Photos */}
                          <td>
                            {isElectricDone ? (
                              <div className="ax-cluster" style={{ gap: '4px' }}>
                                {s.complete_photo && (
                                  <button
                                    type="button"
                                    className="ax-badge ax-badge--soft ax-badge--info"
                                    style={{ cursor: 'pointer', padding: '2px 5px', fontSize: '10px' }}
                                    onClick={() => setPreviewImg(s.complete_photo!)}
                                  >
                                    Plant
                                  </button>
                                )}
                                {s.inverter_image && (
                                  <button
                                    type="button"
                                    className="ax-badge ax-badge--soft ax-badge--neutral"
                                    style={{ cursor: 'pointer', padding: '2px 5px', fontSize: '10px' }}
                                    onClick={() => setPreviewImg(s.inverter_image!)}
                                  >
                                    Inv
                                  </button>
                                )}
                                {s.earthing_image && (
                                  <button
                                    type="button"
                                    className="ax-badge ax-badge--soft ax-badge--neutral"
                                    style={{ cursor: 'pointer', padding: '2px 5px', fontSize: '10px' }}
                                    onClick={() => setPreviewImg(s.earthing_image!)}
                                  >
                                    Earth
                                  </button>
                                )}
                                {s.acdb_image && (
                                  <button
                                    type="button"
                                    className="ax-badge ax-badge--soft ax-badge--neutral"
                                    style={{ cursor: 'pointer', padding: '2px 5px', fontSize: '10px' }}
                                    onClick={() => setPreviewImg(s.acdb_image!)}
                                  >
                                    ACDB
                                  </button>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          {/* Electric Status */}
                          <td>
                            {isElectricDone ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                            )}
                          </td>
                          {/* Electric Verify */}
                          <td>
                            {Number(s.inst_verify_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                            ) : Number(s.inst_verify_status) === 2 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                          </td>
                          {/* Actions */}
                          <td style={{ textAlign: 'center' }}>
                            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                              {!isElectricDone && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  style={{ height: 26, padding: '0 8px', fontSize: '11px' }}
                                  onClick={() => {
                                    setElectricModalSite(s);
                                    setSolarmeterNo(s.solarmeter_no || '');
                                    setInverterNo(s.inverter_no || '');
                                    setNmSmNo(s.nm_sm_no || '');
                                    setLogerNo(s.loger_no || '');
                                    setInstRemarks(s.inst_remarks || '');
                                  }}
                                >
                                  Complete Electric
                                </button>
                              )}
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                style={{ height: 26, padding: '0 8px', fontSize: '11px' }}
                                onClick={() => setDocModalSite(s)}
                              >
                                Doc
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--ax-space-3)' }}>
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

      {/* ── Photo Preview Modal ── */}
      {previewImg && (
        <div className="ax-modal-backdrop" onClick={() => setPreviewImg(null)}>
          <div className="ax-modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <h4 className="ax-modal__title">Site Media Viewer</h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setPreviewImg(null)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ textAlign: 'center', padding: 'var(--ax-space-3)' }}>
              <img
                src={previewImg}
                alt="Site Inspection Preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-sm)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">Image could not be loaded</text></svg>';
                }}
              />
            </div>
            <div className="ax-modal__footer">
              <a
                href={previewImg}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--secondary ax-btn--sm"
              >
                Open in New Tab
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setPreviewImg(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Electric Installation Modal ── */}
      {electricModalSite && (
        <div className="ax-modal-backdrop" onClick={() => setElectricModalSite(null)}>
          <div className="ax-modal" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitElectric}>
              <div className="ax-modal__header">
                <div>
                  <h4 className="ax-modal__title">Complete Electrical Installation</h4>
                  <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Beneficiary: {electricModalSite.beneficiary_name} (Site #{electricModalSite.id})
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setElectricModalSite(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ax-modal__body" style={{ maxHeight: 500, overflowY: 'auto' }}>
                {electricError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-3)' }}>
                    <div className="ax-alert__text">{electricError}</div>
                  </div>
                )}

                <div className="ax-dash-grid">
                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Solar Meter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. SM-2024-001"
                        value={solarmeterNo}
                        onChange={(e) => setSolarmeterNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Inverter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. INV-2024-001"
                        value={inverterNo}
                        onChange={(e) => setInverterNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Net Meter / Smart Meter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. NM-99120"
                        value={nmSmNo}
                        onChange={(e) => setNmSmNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Logger No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. LOG-3321"
                        value={logerNo}
                        onChange={(e) => setLogerNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--12">
                    <div className="ax-field">
                      <label className="ax-field__label">Installation Remarks</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. Full electrical wiring and inverter synchronization complete"
                        value={instRemarks}
                        onChange={(e) => setInstRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Complete Plant Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setCompletePhoto(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Inverter Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setInverterImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Earthing Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEarthingImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">ACDB Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setAcdbImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Solar Meter Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setSolarMeterImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Lightning Arrester (LA) Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setLaImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setElectricModalSite(null)}
                  disabled={electricSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={electricSubmitting}
                >
                  {electricSubmitting ? <span className="ax-spinner" /> : 'Save Electrical Installation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Upload Modal ── */}
      {docModalSite && (
        <div className="ax-modal-backdrop" onClick={() => setDocModalSite(null)}>
          <div className="ax-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitDoc}>
              <div className="ax-modal__header">
                <h4 className="ax-modal__title">Upload Commissioning Document</h4>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setDocModalSite(null)}
                >
                  ✕
                </button>
              </div>
              <div className="ax-modal__body">
                {docError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-3)' }}>
                    <div className="ax-alert__text">{docError}</div>
                  </div>
                )}
                <p style={{ margin: '0 0 var(--ax-space-3) 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Site: <b>{docModalSite.beneficiary_name}</b> (CA #{docModalSite.ca_no})
                </p>
                <div className="ax-field">
                  <label className="ax-field__label">Select Document (PDF/JPG/PNG max 5MB)</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    className="ax-input"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>
              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setDocModalSite(null)}
                  disabled={docSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={docSubmitting || !docFile}
                >
                  {docSubmitting ? <span className="ax-spinner" /> : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_ViewInstallation;
