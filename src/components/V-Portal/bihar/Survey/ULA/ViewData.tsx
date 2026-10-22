import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaSurveyService,
  type BiharUlaSurveyItem,
  type UlaSurveyKpis,
} from '../../../../../services/biharUlaSurveyService';
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

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getSurveyImageCandidates(path?: string | null): string[] {
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

  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/survey/ula/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
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
  const candidates = useMemo(() => getSurveyImageCandidates(src), [src]);
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
        borderRadius: 'var(--ax-radius-sm)',
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

const DEFAULT_KPIS: UlaSurveyKpis = {
  total: 0,
  feasible: 0,
  not_feasible: 0,
  verified: 0,
  pending: 0,
  rejected: 0,
};

export function Bihar_Survey_ULA_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpis, setKpis] = useState<UlaSurveyKpis>(DEFAULT_KPIS);
  const [surveys, setSurveys] = useState<BiharUlaSurveyItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Column Visibility
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (header: string) => !hiddenCols.includes(header);

  // Load surveys from backend
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const resp = await biharUlaSurveyService.getViewSurveys();
      setSurveys(resp.surveys || []);
      setKpis(resp.kpis || DEFAULT_KPIS);
      if (!resp.surveys?.length) {
        setErrorMsg('No ULA survey records found from server.');
      }
    } catch (err: any) {
      console.error('[Bihar ULA Survey] Failed to load surveys:', err);
      setErrorMsg(err?.message || 'Failed to load ULA survey records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered surveys based on search query
  const filteredSurveys = useMemo(() => {
    if (!search.trim()) return surveys;
    const q = search.toLowerCase();
    return surveys.filter((item) =>
      Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(
            (subVal) => subVal !== null && subVal !== undefined && String(subVal).toLowerCase().includes(q)
          );
        }
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [surveys, search]);

  // Pagination slice
  const pagedSurveys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSurveys.slice(start, start + pageSize);
  }, [filteredSurveys, currentPage, pageSize]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  // Export column definitions
  const exportCols: ExportColumn<BiharUlaSurveyItem>[] = useMemo(
    () => [
      { header: 'Survey Date', accessor: (r) => formatDate(r.survey_date || r.created_at) },
      { header: 'District', accessor: (r) => r.district ?? '' },
      { header: 'Block', accessor: (r) => r.block ?? '' },
      { header: 'Panchayat', accessor: (r) => r.panchayat ?? '' },
      { header: 'Village', accessor: (r) => r.village ?? '' },
      { header: 'Address', accessor: (r) => r.address ?? '' },
      { header: 'Consumer Name', accessor: (r) => r.consumer_name ?? '' },
      { header: 'Gender', accessor: (r) => r.gender ?? '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no ?? '' },
      { header: 'Aadhaar No.', accessor: (r) => r.aadhar_no ?? '' },
      { header: 'CA No.', accessor: (r) => r.ca_number ?? '' },
      { header: 'Smart Meter', accessor: (r) => (r.smart_meter === 1 ? 'Yes' : 'No') },
      { header: 'Smart Meter No.', accessor: (r) => r.smart_meter_no ?? '' },
      { header: 'Meter Functional', accessor: (r) => (r.smart_meter_functional === 1 ? 'Yes' : 'No') },
      { header: 'Feasible', accessor: (r) => (r.feasible_status === 1 ? 'Feasible' : 'Not Feasible') },
      { header: 'Latitude', accessor: (r) => String(r.latitude ?? '') },
      { header: 'Longitude', accessor: (r) => String(r.longitude ?? '') },
      { header: 'Remarks', accessor: (r) => r.remarks ?? '' },
      { header: 'Status', accessor: (r) => (r.survey_status === 1 ? 'Complete' : 'Pending') },
      {
        header: 'Verification',
        accessor: (r) =>
          r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks ?? '' },
      {
        header: 'Verify By',
        accessor: (r) =>
          typeof r.verifier === 'object' && r.verifier?.name
            ? r.verifier.name
            : typeof r.verifier === 'string'
            ? r.verifier
            : '',
      },
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

  const handleCopy = () => copyTableDataToClipboard(filteredSurveys, activeExportCols);
  const handleCsv = () => exportDataToCSV('Bihar_ULA_Surveys', filteredSurveys, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_ULA_Surveys', filteredSurveys, activeExportCols);
  const handlePdf = () => printTableData('Bihar ULA Survey Records', filteredSurveys, activeExportCols);

  return (
    <div className="ax-page">
      {/* ── Page Head ── */}
      <PageHead
        title="Bihar ULA Survey Records"
        subtitle="Unnat Lok Abhiyan (ULA) solar rooftop survey records and verification details"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA' },
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
              onClick={() => navigate('/v/bihar/ula-surveys/create')}
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
        {/* ── KPI Box 1: Total Surveys ── */}
        <KpiCard
          tone="cyan"
          label="Total Surveys"
          value={kpis.total}
          unit="Nos."
          sub="Total ULA surveys recorded"
          badge="All Surveys"
          icon={svg(<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2 4-4" /></>)}
        />

        {/* ── KPI Box 2: Feasibility Breakdown ── */}
        <KpiCard
          tone="emerald"
          label="Feasibility Breakdown"
          value={`${kpis.feasible} / ${kpis.not_feasible}`}
          unit="Nos."
          sub="Feasible / Not Feasible sites"
          badge={`${kpis.feasible} Feasible`}
          icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>)}
        />

        {/* ── KPI Box 3: Verification Status ── */}
        <KpiCard
          tone="amber"
          label="Verification Status"
          value={`${kpis.verified} / ${kpis.pending} / ${kpis.rejected}`}
          unit="Nos."
          sub="Approved / Pending / Rejected"
          badge={`${kpis.pending} Pending`}
          icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></>)}
        />

        {/* ── Main Table Card (Template DataTables pattern) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA Survey Records">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Bihar ULA Survey Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSurveys.length} of {surveys.length} records
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
                Loading Bihar ULA Survey records…
              </p>
            </div>
          ) : filteredSurveys.length === 0 ? (
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
                  <caption className="ax-visually-hidden">Bihar ULA Survey Records</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      {isVisible('Survey Date') && <th className="ax-table__th" scope="col">Survey Date</th>}
                      {isVisible('District') && <th className="ax-table__th" scope="col">District</th>}
                      {isVisible('Block') && <th className="ax-table__th" scope="col">Block</th>}
                      {isVisible('Panchayat') && <th className="ax-table__th" scope="col">Panchayat</th>}
                      {isVisible('Village') && <th className="ax-table__th" scope="col">Village</th>}
                      {isVisible('Address') && <th className="ax-table__th" scope="col">Address</th>}
                      {isVisible('Consumer Name') && <th className="ax-table__th" scope="col">Consumer Name</th>}
                      {isVisible('Gender') && <th className="ax-table__th" scope="col">Gender</th>}
                      {isVisible('Contact No.') && <th className="ax-table__th" scope="col">Contact No.</th>}
                      {isVisible('Aadhaar No.') && <th className="ax-table__th" scope="col">Aadhaar No.</th>}
                      {isVisible('CA No.') && <th className="ax-table__th" scope="col">CA No.</th>}
                      {isVisible('Smart Meter') && <th className="ax-table__th" scope="col">Smart Meter</th>}
                      {isVisible('Smart Meter No.') && <th className="ax-table__th" scope="col">Smart Meter No.</th>}
                      {isVisible('Meter Functional') && <th className="ax-table__th" scope="col">Meter Functional</th>}
                      {isVisible('Feasible') && <th className="ax-table__th" scope="col">Feasible</th>}
                      {isVisible('Latitude') && <th className="ax-table__th" scope="col">Latitude</th>}
                      {isVisible('Longitude') && <th className="ax-table__th" scope="col">Longitude</th>}
                      <th className="ax-table__th" scope="col">Electricity Bill Photo</th>
                      <th className="ax-table__th" scope="col">Consent Form Photo</th>
                      <th className="ax-table__th" scope="col">Aadhaar Card Photo</th>
                      {isVisible('Remarks') && <th className="ax-table__th" scope="col">Remarks</th>}
                      {isVisible('Status') && <th className="ax-table__th" scope="col">Status</th>}
                      {isVisible('Verification') && <th className="ax-table__th" scope="col">Verification</th>}
                      {isVisible('Verify Remarks') && <th className="ax-table__th" scope="col">Verify Remarks</th>}
                      {isVisible('Verify By') && <th className="ax-table__th" scope="col">Verify By</th>}
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSurveys.map((item, idx) => {
                      const srNo = (currentPage - 1) * pageSize + idx + 1;
                      const verifierName =
                        typeof item.verifier === 'object' && item.verifier?.name
                          ? item.verifier.name
                          : typeof item.verifier === 'string'
                          ? item.verifier
                          : '—';

                      return (
                        <tr key={item.id || idx} className="ax-table__row">
                          <td className="ax-table__td">{srNo}</td>
                          {isVisible('Survey Date') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {formatDate(item.survey_date || item.created_at)}
                            </td>
                          )}
                          {isVisible('District') && <td className="ax-table__td">{item.district || '—'}</td>}
                          {isVisible('Block') && <td className="ax-table__td">{item.block || '—'}</td>}
                          {isVisible('Panchayat') && <td className="ax-table__td">{item.panchayat || '—'}</td>}
                          {isVisible('Village') && <td className="ax-table__td">{item.village || '—'}</td>}
                          {isVisible('Address') && <td className="ax-table__td">{item.address || '—'}</td>}
                          {isVisible('Consumer Name') && (
                            <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>
                              {item.consumer_name || '—'}
                            </td>
                          )}
                          {isVisible('Gender') && <td className="ax-table__td">{item.gender || '—'}</td>}
                          {isVisible('Contact No.') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {item.contact_no || '—'}
                            </td>
                          )}
                          {isVisible('Aadhaar No.') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {item.aadhar_no || '—'}
                            </td>
                          )}
                          {isVisible('CA No.') && (
                            <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                              {item.ca_number || '—'}
                            </td>
                          )}
                          {isVisible('Smart Meter') && (
                            <td className="ax-table__td">
                              {item.smart_meter === 1 ? 'Yes' : 'No'}
                            </td>
                          )}
                          {isVisible('Smart Meter No.') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {item.smart_meter_no || '—'}
                            </td>
                          )}
                          {isVisible('Meter Functional') && (
                            <td className="ax-table__td">
                              {item.smart_meter_functional === 1 ? 'Yes' : 'No'}
                            </td>
                          )}
                          {isVisible('Feasible') && (
                            <td className="ax-table__td">
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  item.feasible_status === 1 ? 'ax-badge--success' : 'ax-badge--danger'
                                }`}
                              >
                                <span className="ax-badge__dot" />
                                {item.feasible_status === 1 ? 'Feasible' : 'Not Feasible'}
                              </span>
                            </td>
                          )}
                          {isVisible('Latitude') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {item.latitude ?? '—'}
                            </td>
                          )}
                          {isVisible('Longitude') && (
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {item.longitude ?? '—'}
                            </td>
                          )}

                          {/* Electricity Bill Photo */}
                          <td className="ax-table__td">
                            <SurveyThumbnail
                              src={item.electricity_bill_photo}
                              alt="Electricity Bill"
                              onPreview={setPreviewImg}
                            />
                          </td>

                          {/* Consent Form Photo */}
                          <td className="ax-table__td">
                            <SurveyThumbnail
                              src={item.consent_form_photo}
                              alt="Consent Form"
                              onPreview={setPreviewImg}
                            />
                          </td>

                          {/* Aadhaar Card Photo */}
                          <td className="ax-table__td">
                            <SurveyThumbnail
                              src={item.aadhar_card_photo}
                              alt="Aadhaar Card"
                              onPreview={setPreviewImg}
                            />
                          </td>

                          {/* Remarks */}
                          {isVisible('Remarks') && <td className="ax-table__td">{item.remarks || '—'}</td>}

                          {/* Status */}
                          {isVisible('Status') && (
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

                          {/* Verification */}
                          {isVisible('Verification') && (
                            <td className="ax-table__td">
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  item.verify_status === 1
                                    ? 'ax-badge--success'
                                    : item.verify_status === 2
                                    ? 'ax-badge--danger'
                                    : 'ax-badge--warning'
                                }`}
                              >
                                <span className="ax-badge__dot" />
                                {item.verify_status === 1
                                  ? 'Approved'
                                  : item.verify_status === 2
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>
                            </td>
                          )}

                          {/* Verify Remarks */}
                          {isVisible('Verify Remarks') && (
                            <td className="ax-table__td">{item.verify_remarks || '—'}</td>
                          )}

                          {/* Verify By */}
                          {isVisible('Verify By') && (
                            <td className="ax-table__td">{verifierName}</td>
                          )}

                          {/* Action */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => navigate(`/v/bihar/ula-surveys/create?id=${item.id}`)}
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
                total={filteredSurveys.length}
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
              alt="Document Preview"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <a
                href={previewImg}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--secondary ax-btn--sm"
              >
                Open in New Tab ↗
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
    </div>
  );
}

export default Bihar_Survey_ULA_ViewData;