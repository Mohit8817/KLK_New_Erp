import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
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
import { BASE_URL } from '../../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from '../../jammu-services';

/* ───────── Responsive page CSS (Matching Arunachal / Punjab Reference) ───────── */
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

/* ── Top KPI Card Component ── */
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

/* ───────── 49-Field Jammu Survey Record Interface ───────── */
export interface JammuSurveyRecord {
  srNo: number;
  uniqueId: string;
  state: string;
  district: string;
  department: string;
  siteName: string;
  siteAddress: string;
  caNo: string;
  surveyAddress: string;
  nearestLandmark: string;
  contactPerson: string;
  contactNo: string;
  proposedCapacityKw: number;
  latitude: string;
  longitude: string;
  loadType: string;
  connectionPhase: string;
  meterConnectionType: string;
  meterNumber: string;
  sanctionLoadKw: string;
  instantaneousLoadKw: string;
  gridAvailability: string;
  isAllThreePhaseInLtdb: string;
  missingPhase: string;
  ltdbPresent: string;
  isExistingDgSet: string;
  dgSetCapacity: string;
  dgSetMake: string;
  roofCondition: string;
  totalRoofAreaSqFt: number;
  freeSpaceSolarSqFt: number;
  freeSpaceControlRoomSqFt: number;
  earthPitPosition: string;
  routingAcCableMtr: number;
  typeOfRoof: string;
  typeOfStructureRequired: string;
  ageOfBuilding: string;
  accessToRoof: string;
  rooftopHeightMtr: number;
  parapetHeightMtr: number;
  noOfFloors: string;
  accessToSite: string;
  distanceFromMainRoadKm: number;
  buildingImage: string;
  roofImage: string;
  controlRoomImage: string;
  otherImage: string;
  pdfUrl: string;
}

const INITIAL_SURVEY_DATA: JammuSurveyRecord[] = [];

/* ───────── 49 Column Header Labels for Export & Copy ───────── */
const CSV_HEADERS = [
  'Sr. No.',
  'Unique ID',
  'State',
  'District',
  'Department',
  'Site Name',
  'Site Address',
  'CA No.',
  'Survey Address',
  'Nearest Landmark',
  'Name Of Current Contact Person',
  'Contact No',
  'Proposed Capacity (In KW)',
  'Latitude',
  'Longitude',
  'Load Type',
  'Connection Phase',
  'Meter Connection Type',
  'Meter Number',
  'Sanction Load (KW/KVA)',
  'Instantaneous/Corrected Load (KW)',
  'Grid Availability',
  'Is All Three Phase Available In LTDB',
  'Missing Phase',
  'LTDB Present',
  'Is Existing DG SET',
  'Dg SET Capacity',
  'Dg SET Make',
  'Roof Condition',
  'Total Roof Area (Sq.Feet)',
  'Free Space for Solar Installation (in Sq.Feet)',
  'Free Space for Control Room/Inverter (in Sq.Feet)',
  'Earth Pit Position',
  'Routing of AC Cable from System Area (mtr)',
  'Type of Roof',
  'Type of Structure Required',
  'Age Of Building',
  'Access To The Roof',
  'Rooftop Height (mtr)',
  'Parapet Height (mtr)',
  'No. of Floors (G+...)',
  'Access To Site',
  'Distance Of Site From Main Road(km)',
  'Building Image',
  'Roof Image',
  'Control Room',
  'Other Image',
  'PDF',
];

export function ViewData() {
  const [data, setData] = useState<JammuSurveyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');

  // Load survey records from backend API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/jammu/srt70mw/view-survey`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setData(list);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modals state
  const [activeRecord, setActiveRecord] = useState<JammuSurveyRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; src: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Focus trap for detail modal
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!activeRecord);

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

  const departments = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.department) set.add(r.department.trim());
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = data;

    if (districtFilter !== 'all') {
      list = list.filter((r) => r.district.toLowerCase() === districtFilter.toLowerCase());
    }

    if (deptFilter !== 'all') {
      list = list.filter((r) => r.department === deptFilter);
    }

    if (phaseFilter !== 'all') {
      list = list.filter((r) => r.connectionPhase === phaseFilter);
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
          r.contactPerson.toLowerCase().includes(q) ||
          r.contactNo.includes(q) ||
          r.meterNumber.toLowerCase().includes(q) ||
          r.surveyAddress.toLowerCase().includes(q) ||
          r.nearestLandmark.toLowerCase().includes(q) ||
          r.loadType.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [data, search, districtFilter, deptFilter, phaseFilter]);

  // Universal pagination
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 8 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, deptFilter, phaseFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || deptFilter !== 'all' || phaseFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setDeptFilter('all');
    setPhaseFilter('all');
    setPage(1);
  };

  // Top metrics calculations
  const totalSites = data.length;
  const totalCapacityKw = useMemo(() => data.reduce((sum, r) => sum + (r.proposedCapacityKw || 0), 0), [data]);
  const totalSolarAreaSqFt = useMemo(() => data.reduce((sum, r) => sum + (r.freeSpaceSolarSqFt || 0), 0), [data]);
  const totalGrossRoofAreaSqFt = useMemo(() => data.reduce((sum, r) => sum + (r.totalRoofAreaSqFt || 0), 0), [data]);
  const filteredCapacityKw = useMemo(() => filtered.reduce((sum, r) => sum + (r.proposedCapacityKw || 0), 0), [filtered]);

  const handleDelete = (uniqueId: string) => {
    setData((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    setDeleteConfirmId(null);
    setToastMsg({ type: 'success', text: `Survey site ${uniqueId} removed successfully.` });
  };

  /* ───────── Export Helpers (All 49 Fields) ───────── */
  const getRowValues = (r: JammuSurveyRecord, index: number) => [
    index + 1,
    r.uniqueId,
    r.state,
    r.district,
    r.department,
    r.siteName,
    r.siteAddress,
    r.caNo,
    r.surveyAddress,
    r.nearestLandmark,
    r.contactPerson,
    r.contactNo,
    r.proposedCapacityKw,
    r.latitude,
    r.longitude,
    r.loadType,
    r.connectionPhase,
    r.meterConnectionType,
    r.meterNumber,
    r.sanctionLoadKw,
    r.instantaneousLoadKw,
    r.gridAvailability,
    r.isAllThreePhaseInLtdb,
    r.missingPhase,
    r.ltdbPresent,
    r.isExistingDgSet,
    r.dgSetCapacity,
    r.dgSetMake,
    r.roofCondition,
    r.totalRoofAreaSqFt,
    r.freeSpaceSolarSqFt,
    r.freeSpaceControlRoomSqFt,
    r.earthPitPosition,
    r.routingAcCableMtr,
    r.typeOfRoof,
    r.typeOfStructureRequired,
    r.ageOfBuilding,
    r.accessToRoof,
    r.rooftopHeightMtr,
    r.parapetHeightMtr,
    r.noOfFloors,
    r.accessToSite,
    r.distanceFromMainRoadKm,
    r.buildingImage,
    r.roofImage,
    r.controlRoomImage,
    r.otherImage,
    r.pdfUrl,
  ];

  const handleCopy = () => {
    if (!filtered.length) return;
    const lines = [
      CSV_HEADERS.join('\t'),
      ...filtered.map((r, i) => getRowValues(r, i).join('\t')),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setToastMsg({ type: 'success', text: `Copied ${filtered.length} survey records to clipboard!` });
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const csvRows = [
      CSV_HEADERS.map((h) => `"${h}"`).join(','),
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
    link.download = `Jammu_SRT_70MW_Survey_Records_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'CSV survey file generated successfully!' });
  };

  const handleExportExcel = () => {
    if (!filtered.length) return;
    const headerRow = `<tr>${CSV_HEADERS.map((h) => `<th style="background:#2563eb;color:#fff;font-weight:bold;border:1px solid #ccc;padding:6px;">${h}</th>`).join('')}</tr>`;
    const dataRows = filtered
      .map(
        (r, i) =>
          `<tr>${getRowValues(r, i)
            .map((v) => `<td style="border:1px solid #ccc;padding:4px 8px;">${v ?? ''}</td>`)
            .join('')}</tr>`
      )
      .join('');
    const tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"/></head><body><table border="1">${headerRow}${dataRows}</table></body></html>`;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jammu_SRT_70MW_Survey_Records_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg({ type: 'success', text: 'Excel survey file generated successfully!' });
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SRT 70MW Survey Information"
        subtitle="Review 49-field technical rooftop solar surveys, structural assessments, electrical loads, and site feasibility across Jammu Division"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'SRT 70MW' },
          { label: 'Survey Information' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              disabled={loading}
              onClick={() => {
                loadData();
                setToastMsg({ type: 'success', text: 'Survey records refreshed successfully!' });
              }}
              title="Reload all survey records"
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/survey/srt-70mw/add-srt" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Site Survey</span>
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
          label="Total Surveyed Sites"
          value={totalSites.toLocaleString('en-IN')}
          sub={`${totalCapacityKw.toLocaleString('en-IN')} KW Total Proposed`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Proposed Solar Capacity"
          value={`${totalCapacityKw.toLocaleString('en-IN')} KW`}
          sub={`Avg ${(totalCapacityKw / (totalSites || 1)).toFixed(1)} KW per site`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Solar Usable Space"
          value={`${totalSolarAreaSqFt.toLocaleString('en-IN')} sq ft`}
          sub={`${totalGrossRoofAreaSqFt.toLocaleString('en-IN')} sq ft gross roof area`}
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
          sub={`${departments.length} Departments surveyed`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3" />
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Master Survey Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu Survey Master Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Site Survey Data Ledger</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{data.length}</span> sites
              {' '}· Proposed Capacity: <b className="ax-num">{filteredCapacityKw.toLocaleString('en-IN')} KW</b>
              {' '}· Usable Space: <b className="ax-num">{filtered.reduce((s, r) => s + (r.freeSpaceSolarSqFt || 0), 0).toLocaleString('en-IN')} sq ft</b>
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

              {/* Department Filter */}
              {departments.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32 }}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  aria-label="Filter by Department"
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept.split('(')[0].trim()}
                    </option>
                  ))}
                </select>
              )}

              {/* Phase Filter */}
              <select
                className="ax-input ax-input--sm"
                style={{ width: 120, height: 32 }}
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                aria-label="Filter by Connection Phase"
              >
                <option value="all">All Phases</option>
                <option value="3 Phase">3 Phase</option>
                <option value="1 Phase">1 Phase</option>
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

              {/* Search input matching Grid.js */}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, ID, CA No, person…"
                size="sm"
                ariaLabel="Search Jammu survey records"
              />

              {/* Universal Table Export Toolbar */}
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with all 49 Exact Fields ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ax-table--striped" style={{ minWidth: 4400, fontSize: '12px', whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--ax-surface-subtle, #f8fafc)' }}>
              <tr>
                <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center', position: 'sticky', left: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Sr. No.
                </th>
                <th className="ax-table__th" scope="col" style={{ width: 140, position: 'sticky', left: 60, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Unique ID
                </th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>State</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>District</th>
                <th className="ax-table__th" scope="col" style={{ width: 220 }}>Department</th>
                <th className="ax-table__th" scope="col" style={{ width: 240 }}>Site Name</th>
                <th className="ax-table__th" scope="col" style={{ width: 240 }}>Site Address</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>CA No.</th>
                <th className="ax-table__th" scope="col" style={{ width: 220 }}>Survey Address</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Nearest Landmark</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Name Of Current Contact Person</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Contact No</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 150 }}>Proposed Capacity (In KW)</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>Latitude</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>Longitude</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Load Type</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Connection Phase</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Meter Connection Type</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Meter Number</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Sanction Load (KW/KVA)</th>
                <th className="ax-table__th" scope="col" style={{ width: 170 }}>Instantaneous/Corrected Load (KW)</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>Grid Availability</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Is All Three Phase Available In LTDB</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Missing Phase</th>
                <th className="ax-table__th" scope="col" style={{ width: 110 }}>LTDB Present</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>Is Existing DG SET</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>Dg SET Capacity</th>
                <th className="ax-table__th" scope="col" style={{ width: 130 }}>Dg SET Make</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Roof Condition</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 150 }}>Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 190 }}>Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th" scope="col" style={{ width: 190 }}>Earth Pit Position</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Routing of AC Cable from System Area (mtr)</th>
                <th className="ax-table__th" scope="col" style={{ width: 150 }}>Type of Roof</th>
                <th className="ax-table__th" scope="col" style={{ width: 230 }}>Type of Structure Required</th>
                <th className="ax-table__th" scope="col" style={{ width: 120 }}>Age Of Building</th>
                <th className="ax-table__th" scope="col" style={{ width: 160 }}>Access To The Roof</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Rooftop Height (mtr)</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Parapet Height (mtr)</th>
                <th className="ax-table__th" scope="col" style={{ width: 140 }}>No. of Floors (G+...)</th>
                <th className="ax-table__th" scope="col" style={{ width: 170 }}>Access To Site</th>
                <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Distance Of Site From Main Road(km)</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" scope="col" style={{ width: 110, textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th" scope="col" style={{ width: 140, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 12, boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={49} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Jammu survey records found"
                      message={hasFilters ? 'No records match your filters. Try clearing your query or reset filters.' : 'No site survey entries currently registered.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.uniqueId} className="ax-table__row">
                      {/* 1. Sr. No. (Sticky Left) */}
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

                      {/* 2. Unique ID (Sticky Left) */}
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
                            fontFamily: 'var(--ax-font-mono, monospace)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                          title="Click to view full dossier"
                        >
                          {row.uniqueId}
                        </button>
                      </td>

                      {/* 3. State */}
                      <td className="ax-table__td">{row.state}</td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <b>{row.district}</b>
                      </td>

                      {/* 5. Department */}
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.department}
                      </td>

                      {/* 6. Site Name */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.siteName}
                      </td>

                      {/* 7. Site Address */}
                      <td className="ax-table__td" style={{ maxWidth: 240, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.siteAddress}
                      </td>

                      {/* 8. CA No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600 }}>
                        {row.caNo}
                      </td>

                      {/* 9. Survey Address */}
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.surveyAddress}
                      </td>

                      {/* 10. Nearest Landmark */}
                      <td className="ax-table__td">{row.nearestLandmark}</td>

                      {/* 11. Contact Person */}
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {row.contactPerson}
                      </td>

                      {/* 12. Contact No */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)' }}>
                        {row.contactNo}
                      </td>

                      {/* 13. Proposed Capacity */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 800, color: '#2563eb' }}>
                        {row.proposedCapacityKw} KW
                      </td>

                      {/* 14. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.latitude}
                      </td>

                      {/* 15. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>
                        {row.longitude}
                      </td>

                      {/* 16. Load Type */}
                      <td className="ax-table__td">{row.loadType}</td>

                      {/* 17. Connection Phase */}
                      <td className="ax-table__td">
                        <Badge tone="neutral">{row.connectionPhase}</Badge>
                      </td>

                      {/* 18. Meter Connection Type */}
                      <td className="ax-table__td">{row.meterConnectionType}</td>

                      {/* 19. Meter Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)' }}>
                        {row.meterNumber}
                      </td>

                      {/* 20. Sanction Load */}
                      <td className="ax-table__td ax-num">{row.sanctionLoadKw}</td>

                      {/* 21. Instantaneous Load */}
                      <td className="ax-table__td ax-num">{row.instantaneousLoadKw}</td>

                      {/* 22. Grid Availability */}
                      <td className="ax-table__td">
                        <Badge tone="success">{row.gridAvailability}</Badge>
                      </td>

                      {/* 23. Is All 3 Phase in LTDB */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.isAllThreePhaseInLtdb === 'Yes' ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>Yes</span>
                        ) : (
                          <span style={{ color: '#dc2626' }}>No</span>
                        )}
                      </td>

                      {/* 24. Missing Phase */}
                      <td className="ax-table__td">{row.missingPhase}</td>

                      {/* 25. LTDB Present */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.ltdbPresent}
                      </td>

                      {/* 26. Is Existing DG Set */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.isExistingDgSet}
                      </td>

                      {/* 27. DG Set Capacity */}
                      <td className="ax-table__td ax-num">{row.dgSetCapacity}</td>

                      {/* 28. DG Set Make */}
                      <td className="ax-table__td">{row.dgSetMake}</td>

                      {/* 29. Roof Condition */}
                      <td className="ax-table__td">{row.roofCondition}</td>

                      {/* 30. Total Roof Area */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.totalRoofAreaSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 31. Free Space for Solar */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.freeSpaceSolarSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 32. Free Space for Control Room */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.freeSpaceControlRoomSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 33. Earth Pit Position */}
                      <td className="ax-table__td" style={{ maxWidth: 190, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.earthPitPosition}
                      </td>

                      {/* 34. Routing AC Cable */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.routingAcCableMtr} m
                      </td>

                      {/* 35. Type of Roof */}
                      <td className="ax-table__td">{row.typeOfRoof}</td>

                      {/* 36. Type of Structure Required */}
                      <td className="ax-table__td" style={{ maxWidth: 230, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.typeOfStructureRequired}
                      </td>

                      {/* 37. Age of Building */}
                      <td className="ax-table__td">{row.ageOfBuilding}</td>

                      {/* 38. Access to Roof */}
                      <td className="ax-table__td">{row.accessToRoof}</td>

                      {/* 39. Rooftop Height */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.rooftopHeightMtr} m
                      </td>

                      {/* 40. Parapet Height */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.parapetHeightMtr} m
                      </td>

                      {/* 41. No. of Floors */}
                      <td className="ax-table__td">{row.noOfFloors}</td>

                      {/* 42. Access to Site */}
                      <td className="ax-table__td">{row.accessToSite}</td>

                      {/* 43. Distance from Main Road */}
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.distanceFromMainRoadKm} km
                      </td>

                      {/* 44. Building Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Building Image`, src: row.buildingImage })}
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="View Building Photo"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75}>
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                          Photo
                        </button>
                      </td>

                      {/* 45. Roof Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Roof Photo`, src: row.roofImage })}
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="View Roof Photo"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75}>
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                          Photo
                        </button>
                      </td>

                      {/* 46. Control Room Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Control Room`, src: row.controlRoomImage })}
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="View Control Room Photo"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75}>
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                          Photo
                        </button>
                      </td>

                      {/* 47. Other Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} — Site Additional Photo`, src: row.otherImage })}
                          style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="View Additional Site Photo"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75}>
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                          Photo
                        </button>
                      </td>

                      {/* 48. PDF */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill"
                          onClick={() => {
                            setToastMsg({ type: 'success', text: `Survey PDF dossier downloaded for ${row.uniqueId}` });
                          }}
                          style={{ cursor: 'pointer', border: 'none', padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                          title="Download Site Technical PDF"
                        >
                          📄 PDF
                        </button>
                      </td>

                      {/* 49. Action (Sticky Right) */}
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
                            to="/v/jammu/survey/srt-70mw/add-srt"
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
                            title="Delete record"
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

      {/* ── Modal 1: Full 49-Field Site Survey Dossier ── */}
      {activeRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="survey-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setActiveRecord(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 860 }}>
            <div className="ax-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontFamily: 'monospace' }}>
                  {activeRecord.uniqueId}
                </span>
                <h2 className="ax-modal__title" id="survey-detail-title" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
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
              {/* Category 1: Location & Site Demographics */}
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  1. Location &amp; Contact Details
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State &amp; District</span>
                    <b>{activeRecord.state} · {activeRecord.district}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                    <b>{activeRecord.department}</b>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Site Address</span>
                    <b>{activeRecord.siteAddress}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Survey Address / Wing</span>
                    <b>{activeRecord.surveyAddress}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Nearest Landmark</span>
                    <b>{activeRecord.nearestLandmark}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</span>
                    <b>{activeRecord.contactPerson} ({activeRecord.contactNo})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>GPS Coordinates</span>
                    <b style={{ fontFamily: 'monospace' }}>{activeRecord.latitude}, {activeRecord.longitude}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Distance from Main Road</span>
                    <b>{activeRecord.distanceFromMainRoadKm} km ({activeRecord.accessToSite})</b>
                  </div>
                </div>
              </div>

              {/* Category 2: Electrical, Grid & Sanction Load */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  2. Electrical, Grid &amp; Metering Information
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CA Number</span>
                    <b style={{ fontFamily: 'monospace', color: '#2563eb' }}>{activeRecord.caNo}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Proposed Solar Capacity</span>
                    <b style={{ color: '#16a34a' }}>{activeRecord.proposedCapacityKw} KW</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction Load / Instantaneous</span>
                    <b>{activeRecord.sanctionLoadKw} / {activeRecord.instantaneousLoadKw}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Connection Phase</span>
                    <b>{activeRecord.connectionPhase} (LTDB Present: {activeRecord.ltdbPresent})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Meter No. &amp; Type</span>
                    <b>{activeRecord.meterNumber} ({activeRecord.meterConnectionType})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Grid Availability</span>
                    <b style={{ color: '#16a34a' }}>{activeRecord.gridAvailability}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>3-Phase in LTDB / Missing</span>
                    <b>{activeRecord.isAllThreePhaseInLtdb} (Missing: {activeRecord.missingPhase})</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Existing DG Set</span>
                    <b>{activeRecord.isExistingDgSet === 'Yes' ? `${activeRecord.dgSetCapacity} (${activeRecord.dgSetMake})` : 'No DG Set'}</b>
                  </div>
                </div>
              </div>

              {/* Category 3: Rooftop Dimensions & Civil Structure */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  3. Roof, Space &amp; Civil Structural Details
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total Roof Area</span>
                    <b>{activeRecord.totalRoofAreaSqFt.toLocaleString()} sq ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Free Space for Solar</span>
                    <b style={{ color: '#16a34a' }}>{activeRecord.freeSpaceSolarSqFt.toLocaleString()} sq ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Control Room / Inverter Space</span>
                    <b>{activeRecord.freeSpaceControlRoomSqFt.toLocaleString()} sq ft</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Type of Roof &amp; Condition</span>
                    <b>{activeRecord.typeOfRoof} ({activeRecord.roofCondition})</b>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Type of Structure Required</span>
                    <b>{activeRecord.typeOfStructureRequired}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Cable Routing &amp; Earth Pit</span>
                    <b>{activeRecord.routingAcCableMtr}m AC Cable · {activeRecord.earthPitPosition}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Building Floors &amp; Heights</span>
                    <b>{activeRecord.noOfFloors} · Roof: {activeRecord.rooftopHeightMtr}m · Parapet: {activeRecord.parapetHeightMtr}m</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Age of Building</span>
                    <b>{activeRecord.ageOfBuilding}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Access to Roof</span>
                    <b>{activeRecord.accessToRoof}</b>
                  </div>
                </div>
              </div>

              {/* Category 4: Media Photos & Documents */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  Site Survey Photo Attachments
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Building Image', src: activeRecord.buildingImage },
                    { label: 'Roof Image', src: activeRecord.roofImage },
                    { label: 'Control Room', src: activeRecord.controlRoomImage },
                    { label: 'Other Image', src: activeRecord.otherImage },
                  ].map((img) => (
                    <div
                      key={img.label}
                      style={{
                        border: '1px solid var(--ax-border, #e2e8f0)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--ax-surface-subtle, #f8fafc)',
                      }}
                      onClick={() => setPreviewImage({ title: `${activeRecord.siteName} — ${img.label}`, src: img.src })}
                    >
                      <img src={img.src} alt={img.label} style={{ width: '100%', height: 85, objectFit: 'cover' }} />
                      <div style={{ padding: '4px 6px', fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--ax-text-strong)' }}>
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => {
                  setToastMsg({ type: 'success', text: `Survey report PDF downloaded for ${activeRecord.uniqueId}` });
                }}
              >
                Download PDF Report
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
                Confirm Site Deletion
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
                Are you sure you want to remove survey record <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{deleteConfirmId}</b>? This action will remove the site assessment from the active ledger.
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
                Delete Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewData;
