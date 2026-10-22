import { useState, useMemo, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
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

/* The API returns relative media paths such as "uploads/bihar/installation/...".
   Set this to your backend / storage base URL (e.g. 'https://api.example.com')
   so images and documents open correctly. Leave '' if the files are served
   from the same domain as the app. */
const MEDIA_BASE_URL = '';

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${clean}` : `/${clean}`;
};

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

const DASH = '—';

/* ── Response field helpers ──
   Fields are read by key so the page works even if StructureSiteItem does not
   declare every property returned by the API. */
const field = (s: StructureSiteItem, key: string): unknown =>
  (s as unknown as Record<string, unknown>)[key];

const text = (s: StructureSiteItem, key: string): string => {
  const v = field(s, key);
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const num = (s: StructureSiteItem, key: string): number => Number(field(s, key));

// JSON-encoded array ('["a","b"]'), real array, or single string -> string[]
const parseList = (val?: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // not json
  }
  return [val];
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

// 0 = Pending, 1 = Approved, 2 = Rejected
const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

const Sub = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>{children}</div>
);

const Row = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div style={{ whiteSpace: 'nowrap' }}>
    <span style={{ color: 'var(--ax-text-muted)' }}>{label}: </span>
    <b style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{value || DASH}</b>
  </div>
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
        String(s.id).includes(q) ||
        text(s, 'unique_id').toLowerCase().includes(q) ||
        text(s, 'company_id').toLowerCase().includes(q) ||
        text(s, 'wo_no').toLowerCase().includes(q) ||
        text(s, 'firm_name').toLowerCase().includes(q) ||
        text(s, 'state').toLowerCase().includes(q) ||
        text(s, 'discom').toLowerCase().includes(q)
      );
    });
  }, [sites, selectedDistrict, selectedInstStatus, search]);

  // Paginated
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

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
      { header: 'Unique ID', accessor: (r) => text(r, 'unique_id') },
      { header: 'Company ID', accessor: (r) => text(r, 'company_id') },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Firm Name', accessor: (r) => text(r, 'firm_name') },
      { header: 'DISCOM', accessor: (r) => text(r, 'discom') },
      { header: 'State', accessor: (r) => text(r, 'state') },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Latitude', accessor: (r) => text(r, 'inst_latitude') },
      { header: 'Longitude', accessor: (r) => text(r, 'inst_longitude') },
      { header: 'Sanction Load (kW)', accessor: (r) => text(r, 'sanction_load') },
      { header: 'Phase', accessor: (r) => text(r, 'phase') },
      { header: 'WO No.', accessor: (r) => text(r, 'wo_no') },
      { header: 'WO Date', accessor: (r) => text(r, 'wo_date') },
      { header: 'Assign Date', accessor: (r) => text(r, 'inst_assign_date') },
      { header: 'Deadline', accessor: (r) => text(r, 'inst_deadline') },
      { header: 'Installation Date', accessor: (r) => text(r, 'inst_date') },
      { header: 'Installation Remarks', accessor: (r) => text(r, 'inst_remarks') },
      { header: 'Module Serials', accessor: (r) => parseList(field(r, 'module_serial_no')).join(', ') },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Structure Date', accessor: (r) => text(r, 'structure_date') },
      { header: 'Structure Verify', accessor: (r) => (Number(r.structure_verify_status) === 1 ? 'Approved' : Number(r.structure_verify_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Structure Verify Remarks', accessor: (r) => text(r, 'structure_verify_remarks') },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Logger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Electric Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Electric Verify', accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Electric Verify Date', accessor: (r) => text(r, 'inst_verify_date') },
      { header: 'Doc Date', accessor: (r) => text(r, 'inst_doc_date') },
      { header: 'Doc Remarks', accessor: (r) => text(r, 'inst_doc_remarks') },
      { header: 'Doc Verify', accessor: (r) => (num(r, 'inst_doc_verify_status') === 1 ? 'Approved' : num(r, 'inst_doc_verify_status') === 2 ? 'Rejected' : 'Pending') },
      { header: 'Doc Verify Remarks', accessor: (r) => text(r, 'inst_doc_verify_remarks') },
    ],
    []
  );

  // Photo badge (opens preview)
  const PhotoBtn = ({ label, path, tone = 'neutral' }: { label: string; path?: string | null; tone?: Tone }) =>
    path ? (
      <button
        type="button"
        className={`ax-badge ax-badge--soft ax-badge--${tone}`}
        style={{ cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
        onClick={() => setPreviewImg(mediaUrl(path))}
      >
        {label}
      </button>
    ) : null;

  const COLS = 17;

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
        {/* Filter and Table Card */}
        <section className="ax-card ax-col--12" aria-labelledby="install-table-title">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div>
                <h3 id="install-table-title" className="ax-card__title">ULA Installation Records</h3>
                <p className="ax-card__subtitle">Comprehensive list of installed structures and commissioning data</p>
              </div>
              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportDataToCSV('bihar_ula_installations', filteredSites, exportCols)}
                onExportExcel={() => exportDataToExcel('bihar_ula_installations', filteredSites, exportCols)}
                onExportPDF={() => printTableData('Bihar ULA Installation Records', filteredSites, exportCols)}
              />
            </div>
          </div>

          <div className="ax-card__body">
            {/* Filter toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <div style={{ width: 280 }}>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search name, CA, unique ID, WO..."
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
                    setCurrentPage(1);
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
                    <th>IDs</th>
                    <th>Beneficiary Details</th>
                    <th>Location</th>
                    <th>Plant & Work Order</th>
                    <th>Installation Assignment</th>
                    <th>Module Serials</th>
                    <th>Structure Photos</th>
                    <th>Structure Status</th>
                    <th>Structure Verify</th>
                    <th>Electric Equipments</th>
                    <th>Electric Photos</th>
                    <th>Electric Status</th>
                    <th>Electric Verify</th>
                    <th>Commissioning Doc</th>
                    <th>50% Payment</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={COLS} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                        <span className="ax-spinner" /> Loading installation records...
                      </td>
                    </tr>
                  ) : paginatedSites.length === 0 ? (
                    <tr>
                      <td colSpan={COLS}>
                        <TableEmptyState title="No installation records found" message="Try adjusting your filters or search query." />
                      </td>
                    </tr>
                  ) : (
                    paginatedSites.map((s, index) => {
                      const modSerials = parseList(field(s, 'module_serial_no'));
                      const modImages = parseList(field(s, 'module_serial_image'));
                      const fastenerImages = parseList(field(s, 'foundation_fastener_images'));
                      const isElectricDone = Number(s.inst_status) === 1;

                      const lat = text(s, 'inst_latitude');
                      const lng = text(s, 'inst_longitude');
                      const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

                      const docPath = text(s, 'inst_doc');
                      const docSubmitted = num(s, 'inst_doc_submit') === 1 || docPath !== '';

                      const payClaim = num(s, 'inst_pay50_claim_status');
                      const payClaimVerify = num(s, 'inst_pay50_claim_verify_status');
                      const payStatus = num(s, 'inst_pay50_status');

                      return (
                        <tr key={s.id}>
                          <td>{(currentPage - 1) * pageSize + index + 1}</td>

                          {/* IDs */}
                          <td>
                            <Row label="ID" value={`#${s.id}`} />
                            <Row label="Unique" value={text(s, 'unique_id')} />
                            <Row label="Company" value={text(s, 'company_id')} />
                          </td>

                          {/* Beneficiary Details */}
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{s.beneficiary_name || DASH}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}>CA: {s.ca_no || DASH}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}>Ph: {s.contact_no || DASH}</div>
                            <div style={{ color: 'var(--ax-text-muted)' }}>Firm: {text(s, 'firm_name') || DASH}</div>
                          </td>

                          {/* Location */}
                          <td>
                            <div><b>{s.district || DASH}</b></div>
                            <div>{s.block || DASH} / {s.village || DASH}</div>
                            <Sub>
                              {[text(s, 'state'), text(s, 'discom')].filter(Boolean).join(' · ') || DASH}
                            </Sub>
                            {hasGeo && (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '10px' }}
                              >
                                {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                              </a>
                            )}
                          </td>

                          {/* Plant & Work Order */}
                          <td>
                            <Row label="Load" value={text(s, 'sanction_load') ? `${text(s, 'sanction_load')} kW` : ''} />
                            <Row label="Phase" value={text(s, 'phase')} />
                            <Row label="WO No." value={text(s, 'wo_no')} />
                            <Row label="WO Date" value={text(s, 'wo_date')} />
                          </td>

                          {/* Installation Assignment */}
                          <td>
                            <Row label="Assigned" value={text(s, 'inst_assign_date')} />
                            <Row label="Deadline" value={text(s, 'inst_deadline')} />
                            <Row label="Installed" value={text(s, 'inst_date')} />
                            {text(s, 'inst_remarks') && (
                              <Sub>Remarks: {text(s, 'inst_remarks')}</Sub>
                            )}
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
                              DASH
                            )}
                          </td>

                          {/* Structure Photos */}
                          <td>
                            <div className="ax-cluster" style={{ gap: '4px', flexWrap: 'wrap' }}>
                              <PhotoBtn label="Structure" path={s.structure_image} tone="info" />
                              {fastenerImages.map((p, i) => (
                                <PhotoBtn key={`f${i}`} label={`Fastener ${i + 1}`} path={p} />
                              ))}
                              {modImages.map((p, i) => (
                                <PhotoBtn key={`m${i}`} label={`Mod Serial ${i + 1}`} path={p} />
                              ))}
                              {!s.structure_image && fastenerImages.length === 0 && modImages.length === 0 && DASH}
                            </div>
                          </td>

                          {/* Structure Status */}
                          <td>
                            {Number(s.structure_status) === 1 ? (
                              <Badge tone="success">Complete</Badge>
                            ) : (
                              <Badge tone="warning">Pending</Badge>
                            )}
                            {text(s, 'structure_date') && <Sub>{text(s, 'structure_date')}</Sub>}
                          </td>

                          {/* Structure Verify */}
                          <td>
                            <VerifyBadge value={Number(s.structure_verify_status)} />
                            {text(s, 'structure_verify_date') && <Sub>{text(s, 'structure_verify_date')}</Sub>}
                            {text(s, 'structure_verify_remarks') && (
                              <div
                                title={text(s, 'structure_verify_remarks')}
                                style={{ fontSize: '10px', color: 'var(--ax-text-muted)', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {text(s, 'structure_verify_remarks')}
                              </div>
                            )}
                          </td>

                          {/* Electric Equipments */}
                          <td>
                            {isElectricDone ? (
                              <div style={{ fontSize: '11px' }}>
                                <div><b>Solar M:</b> {s.solarmeter_no || DASH}</div>
                                <div><b>Inv:</b> {s.inverter_no || DASH}</div>
                                <div><b>Net M:</b> {s.nm_sm_no || DASH}</div>
                                <div><b>Log:</b> {s.loger_no || DASH}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ax-text-muted)' }}>Not Installed</span>
                            )}
                          </td>

                          {/* Electric Photos */}
                          <td>
                            {isElectricDone ? (
                              <div className="ax-cluster" style={{ gap: '4px', flexWrap: 'wrap' }}>
                                <PhotoBtn label="Plant" path={s.complete_photo} tone="info" />
                                <PhotoBtn label="Inverter" path={s.inverter_image} />
                                <PhotoBtn label="Earthing" path={s.earthing_image} />
                                <PhotoBtn label="ACDB" path={s.acdb_image} />
                                <PhotoBtn label="Solar Meter" path={text(s, 'solar_meter_image')} />
                                <PhotoBtn label="LA" path={text(s, 'la_image')} />
                              </div>
                            ) : (
                              DASH
                            )}
                          </td>

                          {/* Electric Status */}
                          <td>
                            {isElectricDone ? (
                              <Badge tone="success">Complete</Badge>
                            ) : (
                              <Badge tone="neutral">Pending</Badge>
                            )}
                          </td>

                          {/* Electric Verify */}
                          <td>
                            <VerifyBadge value={Number(s.inst_verify_status)} />
                            {text(s, 'inst_verify_date') && <Sub>{text(s, 'inst_verify_date')}</Sub>}
                          </td>

                          {/* Commissioning Doc */}
                          <td>
                            {docSubmitted ? (
                              <div>
                                {docPath && (
                                  <a
                                    href={mediaUrl(docPath)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ax-badge ax-badge--soft ax-badge--info"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    View Doc ↗
                                  </a>
                                )}
                                {text(s, 'inst_doc_date') && <Sub>Submitted: {text(s, 'inst_doc_date')}</Sub>}
                                {text(s, 'inst_doc_remarks') && <Sub>Remarks: {text(s, 'inst_doc_remarks')}</Sub>}
                                <div style={{ marginTop: 4 }}>
                                  <VerifyBadge value={num(s, 'inst_doc_verify_status')} />
                                </div>
                                {text(s, 'inst_doc_verify_date') && <Sub>{text(s, 'inst_doc_verify_date')}</Sub>}
                                {text(s, 'inst_doc_verify_remarks') && (
                                  <Sub>{text(s, 'inst_doc_verify_remarks')}</Sub>
                                )}
                              </div>
                            ) : (
                              <Badge tone="neutral">Not submitted</Badge>
                            )}
                          </td>

                          {/* 50% Payment */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              {payClaim === 1 ? (
                                <Badge tone="info">Claimed{text(s, 'inst_pay50_claim_id') ? ` #${text(s, 'inst_pay50_claim_id')}` : ''}</Badge>
                              ) : (
                                <Badge tone="neutral">Not claimed</Badge>
                              )}
                              {payClaim === 1 && (
                                payClaimVerify === 1 ? <Badge tone="success">Claim verified</Badge> : <Badge tone="warning">Claim pending</Badge>
                              )}
                              {payStatus === 2 ? (
                                <Badge tone="success">Paid</Badge>
                              ) : payStatus === 0 || Number.isNaN(payStatus) ? (
                                <Badge tone="warning">Payment pending</Badge>
                              ) : (
                                <Badge tone="info">Payment status {payStatus}</Badge>
                              )}
                            </div>
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
                total={filteredSites.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
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