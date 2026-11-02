import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../../../common';
import {
  getStoredRescoSurveys,
  saveRescoSurveys,
  type RescoSurveyRecord,
} from './rescoSurveyData';

/* ───────── Responsive Page CSS (Matching Karnataka & Jammu SRT Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  /* Modal Details Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';
const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const X_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ width: 16, height: 16 }}
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── All 52 Column Headers for Export & Display ───────── */
const RESCO_SURVEY_HEADERS = [
  'Sr. No.',
  'Unique ID',
  'State',
  'District',
  'Division',
  'Sub Division',
  'Department',
  'Site Name',
  'Site Address',
  'CA No.',
  'Survey Address',
  'Nearest Landmark',
  'Agency Contact Person Name',
  'Agency Contact Number',
  'Nodal Person',
  'Nodal Person Contact',
  'Latitude',
  'Longitude',
  'Load Type',
  'Connection Phase',
  'Meter Connection Type',
  'Meter Number',
  'Meter Type',
  'Sanction Load (KW/KVA)',
  'Connected Load (KW)',
  'Grid Power Availability',
  'Three-Phase Availability',
  'Missing Phase',
  'LTDB Present',
  'Roof Condition',
  'Total Roof Area (Sq.Feet)',
  'Free Space for Solar Installation (in Sq.Feet)',
  'Free Space for Control Room/Inverter (in Sq.Feet)',
  'Earth Pit Position',
  'Age of Building',
  'Access to the Roof (Availability of Staircase)',
  'Rooftop Height (Feet)',
  'Parapet Height (Feet)',
  'No. of Floors (G+...)',
  'Water Source for Cleaning',
  'Access to Site',
  'Distance of Site from Main Road (km)',
  'Building Image',
  'Roof Image',
  'Control Room',
  'Meter',
  'Other Image',
  'PDF',
  'BOS Status',
  'BOS File',
  'BOS Remarks',
  'Action',
];

export function View_Survey() {
  const [data, setData] = useState<RescoSurveyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [feasibilityFilter, setFeasibilityFilter] = useState('all');
  const [bosFilter, setBosFilter] = useState('all');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modals state
  const [activeRecord, setActiveRecord] = useState<RescoSurveyRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; src: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!activeRecord);

  useEffect(() => {
    setData(getStoredRescoSurveys());
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Distinct filter options
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = data;

    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district.toLowerCase() === districtFilter.toLowerCase());
    }

    if (feasibilityFilter !== 'all') {
      list = list.filter((r) => r.siteFeasible.toLowerCase().includes(feasibilityFilter.toLowerCase()));
    }

    if (bosFilter !== 'all') {
      list = list.filter((r) => r.bosStatus.toLowerCase() === bosFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          r.uniqueId.toLowerCase().includes(q) ||
          r.siteName.toLowerCase().includes(q) ||
          r.siteAddress.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.caNo.toLowerCase().includes(q) ||
          r.nodalPerson.toLowerCase().includes(q) ||
          r.agencyContactPerson.toLowerCase().includes(q) ||
          r.meterNumber.toLowerCase().includes(q) ||
          r.nearestLandmark.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [data, search, districtFilter, feasibilityFilter, bosFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 8 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, feasibilityFilter, bosFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || feasibilityFilter !== 'all' || bosFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setFeasibilityFilter('all');
    setBosFilter('all');
    setPage(1);
  };

  // Top metric stats
  const totalSurveys = data.length;
  const totalSolarArea = useMemo(() => data.reduce((s, r) => s + (r.freeSpaceSolarSqFt || 0), 0), [data]);
  const approvedBosCount = useMemo(() => data.filter((r) => r.bosStatus === 'Approved').length, [data]);

  const handleDelete = (uniqueId: string) => {
    const updated = data.filter((item) => item.uniqueId !== uniqueId);
    setData(updated);
    saveRescoSurveys(updated);
    setDeleteConfirmId(null);
    setToastMsg({ type: 'success', text: `Survey dossier ${uniqueId} removed successfully.` });
  };

  /* ───────── Export Helpers (All 52 Fields) ───────── */
  const getRowValues = (r: RescoSurveyRecord, index: number) => [
    index + 1,
    r.uniqueId,
    r.state,
    r.district,
    r.division,
    r.subDivision,
    r.department,
    r.siteName,
    r.siteAddress,
    r.caNo,
    r.surveyAddress,
    r.nearestLandmark,
    r.agencyContactPerson,
    r.agencyContactNo,
    r.nodalPerson,
    r.nodalPersonContact,
    r.latitude,
    r.longitude,
    r.loadType,
    r.connectionPhase,
    r.meterConnectionType,
    r.meterNumber,
    r.meterType,
    r.sanctionLoadKw,
    r.connectedLoadKw,
    r.gridPowerAvailability,
    r.threePhaseAvailability,
    r.missingPhase,
    r.ltdbPresent,
    r.roofCondition,
    r.totalRoofAreaSqFt,
    r.freeSpaceSolarSqFt,
    r.freeSpaceControlRoomSqFt,
    r.earthPitPosition,
    r.ageOfBuilding,
    r.accessToRoof,
    r.rooftopHeightFt,
    r.parapetHeightFt,
    r.noOfFloors,
    r.waterSourceForCleaning,
    r.accessToSite,
    r.distanceFromMainRoadKm,
    r.buildingImage,
    r.roofImage,
    r.controlRoomImage,
    r.meterImage,
    r.otherImage,
    r.pdfUrl,
    r.bosStatus,
    r.bosFile,
    r.bosRemarks,
  ];

  const handleCopy = () => {
    if (!filtered.length) return;
    const lines = [
      RESCO_SURVEY_HEADERS.slice(0, 51).join('\t'),
      ...filtered.map((r, i) => getRowValues(r, i).join('\t')),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setToastMsg({ type: 'success', text: `Copied ${filtered.length} RESCO survey records to clipboard!` });
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const csvRows = [
      RESCO_SURVEY_HEADERS.slice(0, 51).map((h) => `"${h}"`).join(','),
      ...filtered.map((r, i) =>
        getRowValues(r, i)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jammu_RESCO_Surveys_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'CSV RESCO survey file exported!' });
  };

  const handleExportExcel = () => {
    if (!filtered.length) return;
    const headerRow = `<tr>${RESCO_SURVEY_HEADERS.slice(0, 51).map((h) => `<th style="background:#2563eb;color:#fff;border:1px solid #ccc;padding:6px;">${h}</th>`).join('')}</tr>`;
    const dataRows = filtered
      .map(
        (r, i) =>
          `<tr>${getRowValues(r, i)
            .map((v) => `<td style="border:1px solid #ccc;padding:4px 8px;">${v ?? ''}</td>`)
            .join('')}</tr>`
      )
      .join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"/></head><body><table border="1">${headerRow}${dataRows}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jammu_RESCO_Surveys_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'Excel RESCO survey file exported!' });
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Resco Survey Information"
        subtitle="Comprehensive 52-field engineering survey records, rooftop feasibility assessments, and BOS approvals under Jammu RESCO model"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: 'View Resco Survey Information' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Sites
            </Link>
            <Link to="/v/jammu/survey/resco/pending-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              + New Feasibility Survey
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Feasibility Surveys"
          value={totalSurveys.toLocaleString('en-IN')}
          sub="Verified RESCO sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="BOS Approved Sites"
          value={approvedBosCount.toLocaleString('en-IN')}
          sub={`${totalSurveys > 0 ? Math.round((approvedBosCount / totalSurveys) * 100) : 0}% BOS approval rate`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Solar Usable Space"
          value={`${totalSolarArea.toLocaleString('en-IN')} sq ft`}
          sub="Available for solar panel layout"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Districts Covered"
          value={`${districts.length} Districts`}
          sub="Jammu Division RESCO reach"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Master Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="RESCO survey master ledger">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Resco Survey Information</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> surveyed sites
              {' '}· Total Usable Solar Space: <b className="ax-num">{filtered.reduce((s, r) => s + (r.freeSpaceSolarSqFt || 0), 0).toLocaleString('en-IN')} sq ft</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter */}
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by District"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {/* Feasibility Filter */}
              <select
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32 }}
                value={feasibilityFilter}
                onChange={(e) => setFeasibilityFilter(e.target.value)}
                aria-label="Filter by Feasibility"
              >
                <option value="all">All Feasibility</option>
                <option value="Yes">Feasible (Yes)</option>
                <option value="Modifications">With Modifications</option>
                <option value="No">Not Feasible</option>
              </select>

              {/* BOS Status Filter */}
              <select
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32 }}
                value={bosFilter}
                onChange={(e) => setBosFilter(e.target.value)}
                aria-label="Filter by BOS Status"
              >
                <option value="all">All BOS Status</option>
                <option value="Approved">BOS Approved</option>
                <option value="Pending">BOS Pending</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, ID, CA, person…"
                size="sm"
                ariaLabel="Search RESCO surveys"
              />

              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with exact all 52 columns ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ax-table--striped" style={{ minWidth: 4600, fontSize: '12px', whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--ax-surface-subtle, #f8fafc)' }}>
              <tr>
                <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center', position: 'sticky', left: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Sr. No.
                </th>
                <th className="ax-table__th" scope="col" style={{ width: 140, position: 'sticky', left: 60, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Unique ID
                </th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>State</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>District</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>Division</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>Sub Division</th>
                <th className="ax-table__th" scope="col" style={{ width: 220 }}>Department</th>
                <th className="ax-table__th" scope="col" style={{ width: 240 }}>Site Name</th>
                <th className="ax-table__th" scope="col" style={{ width: 240 }}>Site Address</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>CA No.</th>
                <th className="ax-table__th" scope="col" style={{ width: 220 }}>Survey Address</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Nearest Landmark</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Agency Contact Person Name</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Agency Contact Number</th>
                <th className="ax-table__th" scope="col" style={{ width: 180 }}>Nodal Person</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Nodal Person Contact</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>Latitude</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>Longitude</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Load Type</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Connection Phase</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Meter Connection Type</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Meter Number</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Meter Type</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Sanction Load (KW/KVA)</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Connected Load (KW)</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Grid Power Availability</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Three-Phase Availability</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Missing Phase</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>LTDB Present</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Roof Condition</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 150 }}>Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 190 }}>Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Earth Pit Position</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Age of Building</th>
                <th className="ax-table__th" scope="col" style={{ width: 180 }}>Access to the Roof (Availability of Staircase)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Rooftop Height (Feet)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Parapet Height (Feet)</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>No. of Floors (G+...)</th>
                <th className="ax-table__th" scope="col" style={{ width: 170 }}>Water Source for Cleaning</th>
                <th className="ax-table__th" scope="col" style={{ width: 170 }}>Access to Site</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Distance of Site from Main Road (km)</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Meter</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>BOS Status</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>BOS File</th>
                <th className="ax-table__th" scope="col" style={{ width: 220 }}>BOS Remarks</th>
                <th className="ax-table__th" scope="col" style={{ width: 140, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                // EXACT USER SPECIFICATION: No data available in table
                <tr>
                  <td colSpan={52} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={hasFilters ? 'No matching RESCO surveys match your search query or active filters.' : 'No RESCO survey records currently registered.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.uniqueId} className="ax-table__row">
                      {/* 1. Sr. No. (Sticky) */}
                      <td
                        className="ax-table__td ax-num"
                        style={{
                          textAlign: 'center',
                          position: 'sticky',
                          left: 0,
                          background: 'var(--ax-surface-solid)',
                          zIndex: 6,
                          boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)',
                        }}
                      >
                        {serialNumber}
                      </td>

                      {/* 2. Unique ID (Sticky) */}
                      <td
                        className="ax-table__td"
                        style={{
                          position: 'sticky',
                          left: 60,
                          background: 'var(--ax-surface-solid)',
                          zIndex: 6,
                          boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveRecord(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#2563eb',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {row.uniqueId}
                        </button>
                      </td>

                      {/* 3. State */}
                      <td className="ax-table__td">{row.state}</td>

                      {/* 4. District */}
                      <td className="ax-table__td"><b>{row.district}</b></td>

                      {/* 5. Division */}
                      <td className="ax-table__td">{row.division}</td>

                      {/* 6. Sub Division */}
                      <td className="ax-table__td">{row.subDivision}</td>

                      {/* 7. Department */}
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.department}
                      </td>

                      {/* 8. Site Name */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.siteName}
                      </td>

                      {/* 9. Site Address */}
                      <td className="ax-table__td" style={{ maxWidth: 240, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.siteAddress}
                      </td>

                      {/* 10. CA No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.caNo}
                      </td>

                      {/* 11. Survey Address */}
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.surveyAddress}
                      </td>

                      {/* 12. Nearest Landmark */}
                      <td className="ax-table__td">{row.nearestLandmark}</td>

                      {/* 13. Agency Contact Person Name */}
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {row.agencyContactPerson}
                      </td>

                      {/* 14. Agency Contact Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.agencyContactNo}
                      </td>

                      {/* 15. Nodal Person */}
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {row.nodalPerson}
                      </td>

                      {/* 16. Nodal Person Contact */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.nodalPersonContact}
                      </td>

                      {/* 17. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {row.latitude}
                      </td>

                      {/* 18. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {row.longitude}
                      </td>

                      {/* 19. Load Type */}
                      <td className="ax-table__td">{row.loadType}</td>

                      {/* 20. Connection Phase */}
                      <td className="ax-table__td">
                        <Badge tone="neutral">{row.connectionPhase}</Badge>
                      </td>

                      {/* 21. Meter Connection Type */}
                      <td className="ax-table__td">{row.meterConnectionType}</td>

                      {/* 22. Meter Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.meterNumber}
                      </td>

                      {/* 23. Meter Type */}
                      <td className="ax-table__td">{row.meterType}</td>

                      {/* 24. Sanction Load */}
                      <td className="ax-table__td ax-num">{row.sanctionLoadKw}</td>

                      {/* 25. Connected Load */}
                      <td className="ax-table__td ax-num">{row.connectedLoadKw}</td>

                      {/* 26. Grid Power Availability */}
                      <td className="ax-table__td">
                        <Badge tone="success">{row.gridPowerAvailability}</Badge>
                      </td>

                      {/* 27. Three-Phase Availability */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.threePhaseAvailability === 'Yes' ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>Yes</span>
                        ) : (
                          <span style={{ color: '#dc2626' }}>No</span>
                        )}
                      </td>

                      {/* 28. Missing Phase */}
                      <td className="ax-table__td">{row.missingPhase}</td>

                      {/* 29. LTDB Present */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{row.ltdbPresent}</td>

                      {/* 30. Roof Condition */}
                      <td className="ax-table__td">{row.roofCondition}</td>

                      {/* 31. Total Roof Area */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.totalRoofAreaSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 32. Free Space for Solar */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.freeSpaceSolarSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 33. Free Space for Control Room */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.freeSpaceControlRoomSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 34. Earth Pit Position */}
                      <td className="ax-table__td" style={{ maxWidth: 190, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.earthPitPosition}
                      </td>

                      {/* 35. Age of Building */}
                      <td className="ax-table__td">{row.ageOfBuilding}</td>

                      {/* 36. Access to the Roof */}
                      <td className="ax-table__td">{row.accessToRoof}</td>

                      {/* 37. Rooftop Height (Feet) */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.rooftopHeightFt} ft</td>

                      {/* 38. Parapet Height (Feet) */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.parapetHeightFt} ft</td>

                      {/* 39. No. of Floors */}
                      <td className="ax-table__td">{row.noOfFloors}</td>

                      {/* 40. Water Source for Cleaning */}
                      <td className="ax-table__td" style={{ maxWidth: 170, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.waterSourceForCleaning}
                      </td>

                      {/* 41. Access to Site */}
                      <td className="ax-table__td">{row.accessToSite}</td>

                      {/* 42. Distance from Main Road */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.distanceFromMainRoadKm} km</td>

                      {/* 43. Building Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Building Image`, src: row.buildingImage })}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          📷 View
                        </button>
                      </td>

                      {/* 44. Roof Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Roof Image`, src: row.roofImage })}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          📷 View
                        </button>
                      </td>

                      {/* 45. Control Room */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Control Room`, src: row.controlRoomImage })}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          📷 View
                        </button>
                      </td>

                      {/* 46. Meter */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Meter Image`, src: row.meterImage })}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          📷 View
                        </button>
                      </td>

                      {/* 47. Other Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Additional Image`, src: row.otherImage })}
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          📷 View
                        </button>
                      </td>

                      {/* 48. PDF */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill"
                          onClick={() => setToastMsg({ type: 'success', text: `Survey dossier PDF downloaded for ${row.uniqueId}` })}
                          style={{ cursor: 'pointer', border: 'none', padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          📄 PDF
                        </button>
                      </td>

                      {/* 49. BOS Status */}
                      <td className="ax-table__td">
                        {row.bosStatus === 'Approved' ? (
                          <Badge tone="success">BOS Approved</Badge>
                        ) : (
                          <Badge tone="warning">Pending BOS</Badge>
                        )}
                      </td>

                      {/* 50. BOS File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.bosFile ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setToastMsg({ type: 'success', text: `BOS file downloaded for ${row.uniqueId}` })}
                            style={{ padding: '3px 6px', fontSize: 11, color: '#2563eb' }}
                          >
                            📄 BOS Doc
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 51. BOS Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.bosRemarks || '—'}
                      </td>

                      {/* 52. Action (Sticky Right) */}
                      <td
                        className="ax-table__td"
                        style={{
                          textAlign: 'center',
                          position: 'sticky',
                          right: 0,
                          background: 'var(--ax-surface-solid)',
                          zIndex: 6,
                          boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setActiveRecord(row)}
                            title="View full survey dossier"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            View
                          </button>
                          <Link
                            to={`/v/jammu/survey/resco/pending-survey?siteId=${row.uniqueId}`}
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            style={{ padding: '3px 8px', fontSize: 11, color: '#2563eb' }}
                            title="Edit survey record"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '3px 8px', fontSize: 11, color: 'var(--ax-viz-red, #dc2626)' }}
                            onClick={() => setDeleteConfirmId(row.uniqueId)}
                            title="Delete survey record"
                          >
                            Delete
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

        {/* ── Footer Pagination matching reference ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 8, 15, 25, 50]}
            />
          </div>
        </div>
      </section>

      {/* ── Modal 1: Full 52-Field RESCO Survey Dossier ── */}
      {activeRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-survey-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setActiveRecord(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 880 }}>
            <div className="ax-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontFamily: 'monospace' }}>
                  {activeRecord.uniqueId}
                </span>
                <h2 className="ax-modal__title" id="resco-survey-detail-title" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {activeRecord.siteName}
                </h2>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setActiveRecord(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {/* Category 1: General & Location */}
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  1. Location &amp; Administrative Details
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State / District</span>
                    <b>{activeRecord.state} · {activeRecord.district}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Division &amp; Sub-Division</span>
                    <b>{activeRecord.division} ({activeRecord.subDivision})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                    <b>{activeRecord.department}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                    <b style={{ fontFamily: 'monospace', color: '#2563eb' }}>{activeRecord.caNo}</b>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site &amp; Survey Address</span>
                    <b>{activeRecord.siteAddress}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Nearest Landmark</span>
                    <b>{activeRecord.nearestLandmark}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>GPS Coordinates</span>
                    <b style={{ fontFamily: 'monospace' }}>{activeRecord.latitude}, {activeRecord.longitude}</b>
                  </div>
                </div>
              </div>

              {/* Category 2: Contacts & Authority */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  2. Contact Persons &amp; Building Authority
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Agency Contact Person</span>
                    <b>{activeRecord.agencyContactPerson} ({activeRecord.agencyContactNo})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Nodal Building Officer</span>
                    <b>{activeRecord.nodalPerson} ({activeRecord.nodalPersonContact})</b>
                  </div>
                </div>
              </div>

              {/* Category 3: Electrical, Metering & Grid */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  3. Technical, Electrical &amp; Metering Information
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Load Type &amp; Phase</span>
                    <b>{activeRecord.loadType} · {activeRecord.connectionPhase}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Meter No. &amp; Type</span>
                    <b>{activeRecord.meterNumber} ({activeRecord.meterType})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction &amp; Connected Load</span>
                    <b style={{ color: '#2563eb' }}>{activeRecord.sanctionLoadKw} / {activeRecord.connectedLoadKw}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Grid Availability</span>
                    <b style={{ color: '#16a34a' }}>{activeRecord.gridPowerAvailability}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>3-Phase in LTDB / Missing</span>
                    <b>{activeRecord.threePhaseAvailability} (Missing: {activeRecord.missingPhase})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>LTDB Present</span>
                    <b>{activeRecord.ltdbPresent}</b>
                  </div>
                </div>
              </div>

              {/* Category 4: Rooftop Dimensions & Civil Structure */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  4. Rooftop Civil &amp; Structural Feasibility
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total Roof Area</span>
                    <b>{activeRecord.totalRoofAreaSqFt.toLocaleString()} sq ft ({activeRecord.roofCondition})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Free Solar Space</span>
                    <b style={{ color: '#16a34a' }}>{activeRecord.freeSpaceSolarSqFt.toLocaleString()} sq ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Control Room Space</span>
                    <b>{activeRecord.freeSpaceControlRoomSqFt.toLocaleString()} sq ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Earth Pit Position</span>
                    <b>{activeRecord.earthPitPosition}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Building Floors &amp; Heights</span>
                    <b>{activeRecord.noOfFloors} · Roof: {activeRecord.rooftopHeightFt} ft · Parapet: {activeRecord.parapetHeightFt} ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Water Source &amp; Access</span>
                    <b>{activeRecord.waterSourceForCleaning} · Access: {activeRecord.accessToRoof}</b>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Survey Remarks &amp; Feasibility</span>
                    <p style={{ margin: '4px 0 0', background: 'var(--ax-surface-subtle, #f8fafc)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                      <b>Feasible: {activeRecord.siteFeasible}</b> — {activeRecord.surveyRemarks}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category 5: Photo Attachments & BOS Documents */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  5. Site Photographs &amp; BOS Approvals
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Building Image', src: activeRecord.buildingImage },
                    { label: 'Roof Image', src: activeRecord.roofImage },
                    { label: 'Control Room', src: activeRecord.controlRoomImage },
                    { label: 'Meter Image', src: activeRecord.meterImage },
                    { label: 'Other Image', src: activeRecord.otherImage },
                  ].map((img) => (
                    <div
                      key={img.label}
                      style={{
                        border: '1px solid var(--ax-border, #e2e8f0)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--ax-surface-subtle, #f8fafc)',
                      }}
                      onClick={() => setPreviewImage({ title: `${activeRecord.siteName} — ${img.label}`, src: img.src })}
                    >
                      <img src={img.src} alt={img.label} style={{ width: '100%', height: 70, objectFit: 'cover' }} />
                      <div style={{ padding: '3px 4px', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>BOS Status:</span>
                  <Badge tone={activeRecord.bosStatus === 'Approved' ? 'success' : 'warning'}>
                    {activeRecord.bosStatus}
                  </Badge>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    {activeRecord.bosRemarks || 'No additional remarks.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setToastMsg({ type: 'success', text: `Survey PDF downloaded for ${activeRecord.uniqueId}` })}
              >
                Download Feasibility PDF
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setActiveRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Image Preview Lightbox ── */}
      {previewImage && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-label={previewImage.title}>
          <div className="ax-modal__backdrop" onClick={() => setPreviewImage(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 760, background: '#0f172a', border: '1px solid #334155' }}>
            <div className="ax-modal__header" style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#fff' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{previewImage.title}</span>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setPreviewImage(null)}
                style={{ color: '#fff' }}
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ textAlign: 'center', padding: 12 }}>
              <img
                src={previewImage.src}
                alt={previewImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Delete Confirmation ── */}
      {deleteConfirmId && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-label="Confirm Deletion">
          <div className="ax-modal__backdrop" onClick={() => setDeleteConfirmId(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 420 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                Confirm Deletion
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDeleteConfirmId(null)}
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body">
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
                Are you sure you want to remove survey dossier <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{deleteConfirmId}</b>? This action will remove the feasibility inspection from the active ledger.
              </p>
            </div>
            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ background: 'var(--ax-viz-red, #dc2626)', borderColor: 'var(--ax-viz-red, #dc2626)' }}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default View_Survey;
