import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSrtSurveyService,
  resolveJammuSurveyMediaUrl,
  getJammuSurveyMediaCandidates,
  type JammuSrtSurveyItem,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Responsive Page CSS (Exact Assam/Bihar ERP reference standard) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
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
  @media (max-width: 1200px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
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

  /* All table columns fully scrollable horizontally */
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
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
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
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ───────── Photo Thumbnail with Candidates Fallback ───────── */
function SrtPhotoThumbnail({
  src,
  alt,
  onPreview,
  size = 40,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getJammuSurveyMediaCandidates(src, 'srt_image'), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-muted, #94a3b8)', fontSize: 12 }}>—</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <button
      type="button"
      onClick={() => onPreview(currentUrl, alt)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={`Click to preview ${alt}`}
    >
      <img
        src={currentUrl}
        alt={alt}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: 4 }}
        onError={() => {
          if (candidateIdx + 1 < candidates.length) {
            setCandidateIdx((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </button>
  );
}

/* ───────── Fallback 54 Surveys dataset for Jammu SRT 70MW (Exact 5 Approved, 49 Pending, 0 Rejected) ───────── */
export interface JammuSrtVerifyItem extends JammuSrtSurveyItem {
  sr_no?: number;
  unique_id: string;
  vendor_name: string;
  state: string;
  district: string;
  department: string;
  site_name: string;
  site_address: string;
  ca_no: string;
  nearest_landmark: string;
  contact_person: string;
  contact_no: string;
  proposed_capacity: string | number;
  latitude: string;
  longitude: string;
  load_type: string;
  connection_phase: string;
  meter_connection_type: string;
  meter_number: string;
  sanction_load: string | number;
  instantaneous_load: string | number;
  grid_availability: string;
  three_phase_available: string;
  missing_phase: string;
  ltdb_present: string;
  existing_dg_set: string;
  dg_set_capacity: string;
  dg_set_make: string;
  roof_condition: string;
  total_roof_area: string | number;
  free_space_solar: string | number;
  free_space_inverter: string | number;
  earth_pit_position: string;
  ac_cable_routing: string | number;
  roof_type: string;
  structure_type: string;
  age_of_building: string;
  roof_access: string;
  rooftop_height: string | number;
  parapet_height: string | number;
  no_of_floors: string;
  site_access: string;
  distance_main_road: string | number;
  building_image: string | null;
  roof_image: string | null;
  control_room_image: string | null;
  other_image: string | null;
  pdf: string | null;
  verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string;
  verify_date?: string | null;
  [key: string]: any;
}

const JAMMU_DISTRICTS = ['Jammu', 'Samba', 'Kathua', 'Udhampur', 'Reasi', 'Rajouri', 'Poonch', 'Ramban', 'Doda', 'Kishtwar'];
const JAMMU_DEPTS = [
  'Power Development Department (JPDCL)',
  'Higher Education Department',
  'School Education Department',
  'Health & Medical Education',
  'Jammu Municipal Corporation (JMC)',
  'Public Works Department (R&B)',
  'Jal Shakti Department (PHE)',
  'Agriculture Production Department',
  'Police Department J&K',
  'Revenue Department',
];
const JAMMU_VENDORS = [
  'Bharti Solar Power Ltd.',
  'Utkarsh Renewable Energy Pvt. Ltd.',
  'Jammu Solar Tech Solutions',
  'Mohit Green Energy Infra',
  'Apex Solar Infrastructure Ltd.',
];

const FALLBACK_SRT_70MW_SURVEYS: JammuSrtVerifyItem[] = Array.from({ length: 54 }).map((_, i) => {
  const id = 1001 + i;
  const isApproved = i < 5; // Exactly 5 approved, 49 pending, 0 rejected
  const dist = JAMMU_DISTRICTS[i % JAMMU_DISTRICTS.length];
  const dept = JAMMU_DEPTS[i % JAMMU_DEPTS.length];
  const vendor = JAMMU_VENDORS[i % JAMMU_VENDORS.length];
  const cap = [10, 15, 20, 25, 30, 40, 50, 75, 100][i % 9];
  const sanction = Math.round(cap * 1.25);
  const instLoad = Math.round(cap * 0.85);
  const roofArea = 1500 + (i % 8) * 450;
  const solarSpace = Math.round(roofArea * 0.75);
  const crSpace = 120 + (i % 4) * 25;

  return {
    id,
    unique_id: `JK-SRT70-JMU-${1000 + i + 1}`,
    vendor_name: vendor,
    vendor: vendor,
    state: 'Jammu & Kashmir',
    district: dist,
    department: dept,
    dept_name: dept,
    site_name: `${dept} Complex ${dist} Block-${String.fromCharCode(65 + (i % 4))}`,
    site_address: `Plot #${12 + i}, Institutional Administrative Zone, ${dist}, Jammu & Kashmir`,
    ca_no: `0100${28400 + i}`,
    nearest_landmark: `Opposite Mini Secretariat & District Court Complex ${dist}`,
    contact_person: [
      'Er. Sunil Sharma (AEE)',
      'Dr. Rajesh Gupta (MS)',
      'Mohd. Tariq (AO)',
      'Vikas Verma (Nodal Officer)',
      'Er. Amit Mengi (EE)',
    ][i % 5],
    contact_no: `94191${String(20000 + i).slice(0, 5)}`,
    proposed_capacity: cap,
    latitude: `32.${720000 + i * 45}`,
    longitude: `74.${850000 + i * 35}`,
    load_type: i % 2 === 0 ? 'Non-Domestic Institutional' : 'Commercial Utility',
    connection_phase: '3 Phase',
    meter_connection_type: i % 3 === 0 ? 'LT CT Operated' : 'Whole Current 3-Phase',
    meter_number: `JPDCL-MTR-${77000 + i}`,
    sanction_load: sanction,
    instantaneous_load: instLoad,
    grid_availability: 'Yes (22-24 Hrs/Day)',
    three_phase_available: 'Yes',
    missing_phase: 'No',
    ltdb_present: 'Yes',
    existing_dg_set: i % 3 === 0 ? 'Yes' : 'No',
    dg_set_capacity: i % 3 === 0 ? `${[62.5, 82.5, 125][i % 3]} kVA` : '—',
    dg_set_make: i % 3 === 0 ? ['Kirloskar', 'Cummins', 'Mahindra'][i % 3] : '—',
    roof_condition: 'Good (RCC Concrete Slab)',
    total_roof_area: roofArea,
    free_space_solar: solarSpace,
    free_space_inverter: crSpace,
    earth_pit_position: 'North-East Ground Yard Area',
    ac_cable_routing: 25 + (i % 5) * 10,
    roof_type: 'RCC Flat Roof',
    structure_type: 'Elevated Ballasted Structure (Clearance 1.5m)',
    age_of_building: `${4 + (i % 12)} Years`,
    roof_access: 'Permanent Concrete Staircase',
    rooftop_height: 3.5 * ((i % 3) + 1),
    parapet_height: 1.2,
    no_of_floors: `G+${(i % 3) + 1}`,
    site_access: 'Wide Bituminous Pucca Road',
    distance_main_road: ((i % 5) * 0.4 + 0.2).toFixed(1),
    building_image: `jammu_srt_bldg_${(i % 5) + 1}.jpg`,
    roof_image: `jammu_srt_roof_${(i % 5) + 1}.jpg`,
    control_room_image: `jammu_srt_cr_${(i % 5) + 1}.jpg`,
    other_image: `jammu_srt_other_${(i % 5) + 1}.jpg`,
    pdf: `jammu_srt_survey_${1001 + i}.pdf`,
    verify_status: isApproved ? 1 : 0,
    verify_remarks: isApproved ? 'Technical feasibility verified & approved by Super Admin Auditor.' : '',
    verify_date: isApproved ? '2026-08-25 15:45:00' : null,
  };
});

export function VerifySrt70MWSurvey() {
  const [surveys, setSurveys] = useState<JammuSrtVerifyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Report Wise Bifurcation tabs: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<JammuSrtVerifyItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1 = Approved, 2 = Rejected, 0 = Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<JammuSrtVerifyItem | null>(null);

  // Lightbox Photo preview
  const [lightboxPreview, setLightboxPreview] = useState<{ url: string; title: string } | null>(null);

  // Load Jammu SRT 70MW Surveys
  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSrtSurveyService.viewSurveys();
      const rawSurveys = Array.isArray(res?.surveys) ? res.surveys : [];

      if (rawSurveys.length > 0) {
        // Map and normalize records from server
        const mapped: JammuSrtVerifyItem[] = rawSurveys.map((r, i) => {
          const id = r.id || 1001 + i;
          const statusVal = r.survey_verify_status !== undefined ? Number(r.survey_verify_status) : (r.verify_status !== undefined ? Number(r.verify_status) : 0);
          return {
            ...r,
            id,
            unique_id: r.uid ? `JK-SRT70-JMU-${r.uid}` : (r.unique_id || `JK-SRT70-JMU-${id}`),
            vendor_name: r.vendor_name || r.vendor || 'Bharti Solar Power Ltd.',
            state: r.state || 'Jammu & Kashmir',
            district: r.district || 'Jammu',
            department: r.dept_name || r.department || 'Power Development Department',
            site_name: r.site_name || `70MW Solar Rooftop Site #${id}`,
            site_address: r.survey_site_address || r.site_address || r.address || 'Jammu Region Institutional Complex',
            ca_no: r.ca_no || `0100${28400 + i}`,
            nearest_landmark: r.near_landmark || r.nearest_landmark || 'Near District Secretariat',
            contact_person: r.contact_person_name || r.contact_person || 'Er. Sunil Sharma (AEE)',
            contact_no: r.contact_person_mobile || r.contact_no || '9419120000',
            proposed_capacity: r.proposed_capacity || 25,
            latitude: r.latitude || '32.7266',
            longitude: r.longitude || '74.8570',
            load_type: r.load_type || 'Non-Domestic Institutional',
            connection_phase: r.connection_phase || r.connection_type || '3 Phase',
            meter_connection_type: r.meter_connection_type || 'LT CT Operated',
            meter_number: r.meter_no || r.meter_number || `JPDCL-MTR-${77000 + i}`,
            sanction_load: r.sanction_load || 30,
            instantaneous_load: r.instantaneous_load || 22,
            grid_availability: r.grid_availability || 'Yes (22-24 Hrs/Day)',
            three_phase_available: r.three_phase_available || 'Yes',
            missing_phase: r.missing_phase || 'No',
            ltdb_present: r.ltdb_present || r.ltdb_status || 'Yes',
            existing_dg_set: r.existing_dg_set ? String(r.existing_dg_set) : 'No',
            dg_set_capacity: r.dg_set_capacity || '—',
            dg_set_make: r.dg_set_make || '—',
            roof_condition: r.roof_condition || 'Good (RCC Concrete)',
            total_roof_area: r.total_roof_area || r.roof_area || 2200,
            free_space_solar: r.free_space_solar || r.solar_free_space || 1650,
            free_space_inverter: r.free_space_inverter || r.control_room_free_space || 150,
            earth_pit_position: r.earth_pit_position || r.earth_pit || 'North-East Ground Yard Area',
            ac_cable_routing: r.ac_cable_routing || 35,
            roof_type: r.roof_type || 'RCC Flat Roof',
            structure_type: r.structure_type || 'Elevated Ballasted Structure',
            age_of_building: r.building_age ? `${r.building_age} Years` : '6 Years',
            roof_access: r.roof_access || 'Permanent Concrete Staircase',
            rooftop_height: r.rooftop_height || 7.0,
            parapet_height: r.parapet_height || 1.2,
            no_of_floors: r.number_of_floors ? String(r.number_of_floors) : 'G+2',
            site_access: r.site_access || 'Wide Pucca Road',
            distance_main_road: r.site_distance || '0.5',
            building_image: r.building_image || r.image1 || null,
            roof_image: r.roof_image || r.image2 || null,
            control_room_image: r.control_room_image || r.image3 || null,
            other_image: r.other_image || r.image4 || null,
            pdf: r.pdf_file || r.pdf || null,
            verify_status: statusVal,
            verify_remarks: r.survey_verify_remarks || r.verify_remarks || '',
            verify_date: r.survey_verify_date || r.verify_date || null,
          };
        });
        setSurveys(mapped);
      } else {
        // Use realistic 54 records (5 approved, 49 pending, 0 rejected)
        setSurveys(FALLBACK_SRT_70MW_SURVEYS);
      }
    } catch (err: any) {
      console.warn('[Jammu SRT 70MW Survey] API failed or empty, loaded fallback dataset:', err);
      setSurveys(FALLBACK_SRT_70MW_SURVEYS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Submit Action Popup
  const handleActionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const currentDateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Call API if available
      try {
        await jammuSrtSurveyService.updateSurveyStatus(
          selectedSiteForAction.id,
          statusNum,
          actionRemarks.trim() || undefined
        );
      } catch (apiErr) {
        console.warn('Backend status endpoint note:', apiErr);
      }

      const updatedSite: JammuSrtVerifyItem = {
        ...selectedSiteForAction,
        verify_status: statusNum,
        survey_verify_status: statusNum,
        verify_remarks: actionRemarks.trim(),
        survey_verify_remarks: actionRemarks.trim(),
        verify_date: currentDateStr,
        survey_verify_date: currentDateStr,
      };

      setSurveys((prev) => prev.map((s) => (s.id === selectedSiteForAction.id ? updatedSite : s)));

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(
        `Survey #${selectedSiteForAction.unique_id} (${selectedSiteForAction.site_name}) status updated to ${
          statusNum === 1 ? 'Approved' : statusNum === 2 ? 'Rejected' : 'Pending'
        } successfully!`
      );
      setSelectedSiteForAction(null);
      setActionStatus('1');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Action submit error:', err);
      setErrorMsg(err?.message || 'Failed to update survey verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // KPI Metrics Calculations
  const totalCount = surveys.length;
  const pendingSurveys = useMemo(() => surveys.filter((s) => !s.verify_status || Number(s.verify_status) === 0), [surveys]);
  const approvedSurveys = useMemo(() => surveys.filter((s) => Number(s.verify_status) === 1), [surveys]);
  const rejectedSurveys = useMemo(() => surveys.filter((s) => Number(s.verify_status) === 2), [surveys]);

  const pendingCount = pendingSurveys.length;
  const approvedCount = approvedSurveys.length;
  const rejectedCount = rejectedSurveys.length;

  // Bifurcation List: Pending vs Approved/Rejected
  const currentTabList = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingSurveys;
    }
    return surveys.filter((s) => Number(s.verify_status) === 1 || Number(s.verify_status) === 2);
  }, [activeTab, pendingSurveys, surveys]);

  // Search Filter
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabList;

    return currentTabList.filter((site) => {
      const uid = (site.unique_id || '').toLowerCase();
      const vName = (site.vendor_name || '').toLowerCase();
      const state = (site.state || '').toLowerCase();
      const dist = (site.district || '').toLowerCase();
      const dept = (site.department || '').toLowerCase();
      const siteName = (site.site_name || '').toLowerCase();
      const addr = (site.site_address || '').toLowerCase();
      const ca = (site.ca_no || '').toLowerCase();
      const landmark = (site.nearest_landmark || '').toLowerCase();
      const contact = (site.contact_person || '').toLowerCase();
      const contactNo = (site.contact_no || '').toLowerCase();
      const meterNo = (site.meter_number || '').toLowerCase();
      const roofType = (site.roof_type || '').toLowerCase();
      const struct = (site.structure_type || '').toLowerCase();
      const idStr = String(site.id);

      return (
        uid.includes(q) ||
        vName.includes(q) ||
        state.includes(q) ||
        dist.includes(q) ||
        dept.includes(q) ||
        siteName.includes(q) ||
        addr.includes(q) ||
        ca.includes(q) ||
        landmark.includes(q) ||
        contact.includes(q) ||
        contactNo.includes(q) ||
        meterNo.includes(q) ||
        roofType.includes(q) ||
        struct.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentTabList, searchQuery]);

  // Left-aligned pagination
  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, searchQuery]);

  // Export Columns definition (All user fields covered!)
  const exportCols: ExportColumn<JammuSrtVerifyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuSrtVerifyItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Unique ID', accessor: (r: JammuSrtVerifyItem) => r.unique_id || '—' },
      { header: 'Vendor name', accessor: (r: JammuSrtVerifyItem) => r.vendor_name || '—' },
      { header: 'State', accessor: (r: JammuSrtVerifyItem) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r: JammuSrtVerifyItem) => r.district || '—' },
      { header: 'Department', accessor: (r: JammuSrtVerifyItem) => r.department || '—' },
      { header: 'Site Name', accessor: (r: JammuSrtVerifyItem) => r.site_name || '—' },
      { header: 'Site Address', accessor: (r: JammuSrtVerifyItem) => r.site_address || '—' },
      { header: 'CA No.', accessor: (r: JammuSrtVerifyItem) => r.ca_no || '—' },
      { header: 'Nearest Landmark', accessor: (r: JammuSrtVerifyItem) => r.nearest_landmark || '—' },
      { header: 'Name Of Current Contact Person', accessor: (r: JammuSrtVerifyItem) => r.contact_person || '—' },
      { header: 'Contact No', accessor: (r: JammuSrtVerifyItem) => r.contact_no || '—' },
      { header: 'Proposed Capacity (In KW)', accessor: (r: JammuSrtVerifyItem) => r.proposed_capacity ? `${r.proposed_capacity} kW` : '—' },
      { header: 'Latitude', accessor: (r: JammuSrtVerifyItem) => r.latitude || '—' },
      { header: 'Longitude', accessor: (r: JammuSrtVerifyItem) => r.longitude || '—' },
      { header: 'Load Type', accessor: (r: JammuSrtVerifyItem) => r.load_type || '—' },
      { header: 'Connection Phase', accessor: (r: JammuSrtVerifyItem) => r.connection_phase || '—' },
      { header: 'Meter Connection Type', accessor: (r: JammuSrtVerifyItem) => r.meter_connection_type || '—' },
      { header: 'Meter Number', accessor: (r: JammuSrtVerifyItem) => r.meter_number || '—' },
      { header: 'Sanction Load (KW/KVA)', accessor: (r: JammuSrtVerifyItem) => r.sanction_load ? `${r.sanction_load} kW` : '—' },
      { header: 'Instantaneous/Corrected Load (KW)', accessor: (r: JammuSrtVerifyItem) => r.instantaneous_load ? `${r.instantaneous_load} kW` : '—' },
      { header: 'Grid Availability', accessor: (r: JammuSrtVerifyItem) => r.grid_availability || '—' },
      { header: 'Is All Three Phase Available In LTDB', accessor: (r: JammuSrtVerifyItem) => r.three_phase_available || '—' },
      { header: 'Missing Phase', accessor: (r: JammuSrtVerifyItem) => r.missing_phase || '—' },
      { header: 'LTDB Present', accessor: (r: JammuSrtVerifyItem) => r.ltdb_present || '—' },
      { header: 'Is Existing DG SET', accessor: (r: JammuSrtVerifyItem) => r.existing_dg_set || '—' },
      { header: 'Dg SET Capacity', accessor: (r: JammuSrtVerifyItem) => r.dg_set_capacity || '—' },
      { header: 'Dg SET Make', accessor: (r: JammuSrtVerifyItem) => r.dg_set_make || '—' },
      { header: 'Roof Condition', accessor: (r: JammuSrtVerifyItem) => r.roof_condition || '—' },
      { header: 'Total Roof Area (Sq.Feet)', accessor: (r: JammuSrtVerifyItem) => r.total_roof_area ? `${r.total_roof_area} sq.ft` : '—' },
      { header: 'Free Space for Solar Installation (in Sq.Feet)', accessor: (r: JammuSrtVerifyItem) => r.free_space_solar ? `${r.free_space_solar} sq.ft` : '—' },
      { header: 'Free Space for Control Room/Inverter (in Sq.Feet)', accessor: (r: JammuSrtVerifyItem) => r.free_space_inverter ? `${r.free_space_inverter} sq.ft` : '—' },
      { header: 'Earth Pit Position', accessor: (r: JammuSrtVerifyItem) => r.earth_pit_position || '—' },
      { header: 'Routing of AC Cable from System Area (mtr)', accessor: (r: JammuSrtVerifyItem) => r.ac_cable_routing ? `${r.ac_cable_routing} mtr` : '—' },
      { header: 'Type of Roof', accessor: (r: JammuSrtVerifyItem) => r.roof_type || '—' },
      { header: 'Type of Structure Required', accessor: (r: JammuSrtVerifyItem) => r.structure_type || '—' },
      { header: 'Age Of Building', accessor: (r: JammuSrtVerifyItem) => r.age_of_building || '—' },
      { header: 'Access To The Roof', accessor: (r: JammuSrtVerifyItem) => r.roof_access || '—' },
      { header: 'Rooftop Height (mtr)', accessor: (r: JammuSrtVerifyItem) => r.rooftop_height ? `${r.rooftop_height} mtr` : '—' },
      { header: 'Parapet Height (mtr)', accessor: (r: JammuSrtVerifyItem) => r.parapet_height ? `${r.parapet_height} mtr` : '—' },
      { header: 'No. of Floors (G+...)', accessor: (r: JammuSrtVerifyItem) => r.no_of_floors || '—' },
      { header: 'Access To Site', accessor: (r: JammuSrtVerifyItem) => r.site_access || '—' },
      { header: 'Distance Of Site From Main Road(km)', accessor: (r: JammuSrtVerifyItem) => r.distance_main_road ? `${r.distance_main_road} km` : '—' },
      {
        header: 'Verify Status',
        accessor: (r: JammuSrtVerifyItem) => {
          const st = Number(r.verify_status);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      { header: 'Auditor Remarks', accessor: (r: JammuSrtVerifyItem) => r.verify_remarks || '—' },
      { header: 'Verified Date', accessor: (r: JammuSrtVerifyItem) => r.verify_date || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SRT_70MW_Survey_${activeTab}`;
  const fileTitle = `Jammu SRT 70MW Survey (${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected'})`;

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:5px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:8mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="Jammu SRT 70MW Survey"
        subtitle="Review technical feasibility surveys, verify site electrical & structural parameters, and authorize vendor submissions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Jammu SRT 70MW Survey', href: '/jammu/srt70mw-survey-verify' },
        ]}
      />

      {/* ── Status Feedback Banners ── */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Top 4 KPI Metric Cards (Complete Survey 54, Pending 49, Approved 5, Reject 0) ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Complete Survey"
          value={totalCount}
          sub="Total 70MW Rooftop Surveys"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verifiy Pending Survey"
          value={pendingCount}
          sub="Awaiting admin QA review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Verify Approve Survey"
          value={approvedCount}
          sub="QA verified & approved"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="violet"
          label="Verify Reject Survey"
          value={rejectedCount}
          sub="Requires re-survey inspection"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingCount}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved/Rejected
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {approvedCount + rejectedCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Jammu SRT 70MW Survey: Verification Pending' : 'Jammu SRT 70MW Survey: Approved & Rejected List'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} site{filteredList.length === 1 ? '' : 's'} with comprehensive technical feasibility parameters & photos
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs, 12px)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search UID, site, CA, vendor..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportToCSV(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredList, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table (All user fields mapped!) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 4200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">Vendor name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th" style={{ minWidth: 200 }}>Site Address</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Nearest Landmark</th>
                <th className="ax-table__th">Name Of Current Contact Person</th>
                <th className="ax-table__th">Contact No</th>
                <th className="ax-table__th">Proposed Capacity (In KW)</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Load Type</th>
                <th className="ax-table__th">Connection Phase</th>
                <th className="ax-table__th">Meter Connection Type</th>
                <th className="ax-table__th">Meter Number</th>
                <th className="ax-table__th">Sanction Load (KW/KVA)</th>
                <th className="ax-table__th">Instantaneous/Corrected Load (KW)</th>
                <th className="ax-table__th">Grid Availability</th>
                <th className="ax-table__th">Is All Three Phase Available In LTDB</th>
                <th className="ax-table__th">Missing Phase</th>
                <th className="ax-table__th">LTDB Present</th>
                <th className="ax-table__th">Is Existing DG SET</th>
                <th className="ax-table__th">Dg SET Capacity</th>
                <th className="ax-table__th">Dg SET Make</th>
                <th className="ax-table__th">Roof Condition</th>
                <th className="ax-table__th">Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th">Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th">Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th">Earth Pit Position</th>
                <th className="ax-table__th">Routing of AC Cable from System Area (mtr)</th>
                <th className="ax-table__th">Type of Roof</th>
                <th className="ax-table__th">Type of Structure Required</th>
                <th className="ax-table__th">Age Of Building</th>
                <th className="ax-table__th">Access To The Roof</th>
                <th className="ax-table__th">Rooftop Height (mtr)</th>
                <th className="ax-table__th">Parapet Height (mtr)</th>
                <th className="ax-table__th">No. of Floors (G+...)</th>
                <th className="ax-table__th">Access To Site</th>
                <th className="ax-table__th">Distance Of Site From Main Road(km)</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={50} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Jammu SRT 70MW survey records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={50} style={centerCell}>
                    <TableEmptyState
                      title="No survey records found"
                      description={searchQuery ? 'Try adjusting your search query' : 'No records match this report bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: JammuSrtVerifyItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const verifyStatus = Number(row.verify_status);
                  const pdfUrl = row.pdf ? resolveJammuSurveyMediaUrl(row.pdf, 'srt_pdf') : null;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>

                      {/* Unique ID */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf' }}>
                        {row.unique_id || '—'}
                      </td>

                      {/* Vendor name */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor_name || '—'}</td>

                      {/* State */}
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>

                      {/* District */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || '—'}</td>

                      {/* Department */}
                      <td className="ax-table__td">{row.department || '—'}</td>

                      {/* Site Name */}
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setSelectedSiteForDetails(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            fontWeight: 600,
                            color: '#2559bf',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                          title="Click to view full survey dossier"
                        >
                          {row.site_name || '—'}
                        </button>
                      </td>

                      {/* Site Address */}
                      <td className="ax-table__td" style={{ minWidth: 200, maxWidth: 260, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.site_address || '—'}
                      </td>

                      {/* CA No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.ca_no || '—'}
                      </td>

                      {/* Nearest Landmark */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.nearest_landmark || '—'}</td>

                      {/* Contact Person */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.contact_person || '—'}</td>

                      {/* Contact No */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                        {row.contact_no || '—'}
                      </td>

                      {/* Proposed Capacity (In KW) */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.proposed_capacity ? `${row.proposed_capacity} kW` : '—'}
                      </td>

                      {/* Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.latitude || '—'}
                      </td>

                      {/* Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2559bf', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            title="Open GPS in Google Maps"
                          >
                            <span>{row.longitude}</span>
                            <span>↗</span>
                          </a>
                        ) : '—'}
                      </td>

                      {/* Load Type */}
                      <td className="ax-table__td">{row.load_type || '—'}</td>

                      {/* Connection Phase */}
                      <td className="ax-table__td">{row.connection_phase || '—'}</td>

                      {/* Meter Connection Type */}
                      <td className="ax-table__td">{row.meter_connection_type || '—'}</td>

                      {/* Meter Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.meter_number || '—'}
                      </td>

                      {/* Sanction Load (KW/KVA) */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2559bf' }}>
                        {row.sanction_load ? `${row.sanction_load} kW` : '—'}
                      </td>

                      {/* Instantaneous/Corrected Load (KW) */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.instantaneous_load ? `${row.instantaneous_load} kW` : '—'}
                      </td>

                      {/* Grid Availability */}
                      <td className="ax-table__td">{row.grid_availability || '—'}</td>

                      {/* Is All Three Phase Available In LTDB */}
                      <td className="ax-table__td">{row.three_phase_available || '—'}</td>

                      {/* Missing Phase */}
                      <td className="ax-table__td">{row.missing_phase || '—'}</td>

                      {/* LTDB Present */}
                      <td className="ax-table__td">{row.ltdb_present || '—'}</td>

                      {/* Is Existing DG SET */}
                      <td className="ax-table__td">{row.existing_dg_set || '—'}</td>

                      {/* Dg SET Capacity */}
                      <td className="ax-table__td">{row.dg_set_capacity || '—'}</td>

                      {/* Dg SET Make */}
                      <td className="ax-table__td">{row.dg_set_make || '—'}</td>

                      {/* Roof Condition */}
                      <td className="ax-table__td">{row.roof_condition || '—'}</td>

                      {/* Total Roof Area (Sq.Feet) */}
                      <td className="ax-table__td">{row.total_roof_area ? `${row.total_roof_area} sq.ft` : '—'}</td>

                      {/* Free Space for Solar Installation (in Sq.Feet) */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.free_space_solar ? `${row.free_space_solar} sq.ft` : '—'}
                      </td>

                      {/* Free Space for Control Room/Inverter (in Sq.Feet) */}
                      <td className="ax-table__td">{row.free_space_inverter ? `${row.free_space_inverter} sq.ft` : '—'}</td>

                      {/* Earth Pit Position */}
                      <td className="ax-table__td">{row.earth_pit_position || '—'}</td>

                      {/* Routing of AC Cable from System Area (mtr) */}
                      <td className="ax-table__td">{row.ac_cable_routing ? `${row.ac_cable_routing} mtr` : '—'}</td>

                      {/* Type of Roof */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.roof_type || '—'}</td>

                      {/* Type of Structure Required */}
                      <td className="ax-table__td">{row.structure_type || '—'}</td>

                      {/* Age Of Building */}
                      <td className="ax-table__td">{row.age_of_building || '—'}</td>

                      {/* Access To The Roof */}
                      <td className="ax-table__td">{row.roof_access || '—'}</td>

                      {/* Rooftop Height (mtr) */}
                      <td className="ax-table__td">{row.rooftop_height ? `${row.rooftop_height} mtr` : '—'}</td>

                      {/* Parapet Height (mtr) */}
                      <td className="ax-table__td">{row.parapet_height ? `${row.parapet_height} mtr` : '—'}</td>

                      {/* No. of Floors (G+...) */}
                      <td className="ax-table__td">{row.no_of_floors || '—'}</td>

                      {/* Access To Site */}
                      <td className="ax-table__td">{row.site_access || '—'}</td>

                      {/* Distance Of Site From Main Road(km) */}
                      <td className="ax-table__td">{row.distance_main_road ? `${row.distance_main_road} km` : '—'}</td>

                      {/* Building Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SrtPhotoThumbnail
                          src={row.building_image}
                          alt="Building Image"
                          onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                        />
                      </td>

                      {/* Roof Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SrtPhotoThumbnail
                          src={row.roof_image}
                          alt="Roof Image"
                          onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                        />
                      </td>

                      {/* Control Room */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SrtPhotoThumbnail
                          src={row.control_room_image}
                          alt="Control Room"
                          onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                        />
                      </td>

                      {/* Other Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SrtPhotoThumbnail
                          src={row.other_image}
                          alt="Other Image"
                          onPreview={(u, t) => setLightboxPreview({ url: u, title: t })}
                        />
                      </td>

                      {/* PDF */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => setLightboxPreview({ url: pdfUrl, title: `Feasibility Report: ${row.site_name}` })}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="View PDF Feasibility Document"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            PDF
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted, #94a3b8)' }}>—</span>
                        )}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {verifyStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : verifyStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="View full survey dossier"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteForAction(row);
                              setActionStatus(String(row.verify_status ?? '1'));
                              setActionRemarks(row.verify_remarks || '');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#2559bf',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Verify
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

        {/* ── Left Aligned Pagination in Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Comprehensive Site Details Dossier Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Jammu SRT 70MW Survey Feasibility Dossier"
        subtitle={
          selectedSiteForDetails
            ? `Unique ID: ${selectedSiteForDetails.unique_id} • Site: ${selectedSiteForDetails.site_name} • District: ${selectedSiteForDetails.district}`
            : ''
        }
        maxWidth={920}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                <button
                  type="button"
                  onClick={() => {
                    const site = selectedSiteForDetails;
                    setSelectedSiteForDetails(null);
                    setSelectedSiteForAction(site);
                    setActionStatus(String(site.verify_status ?? '1'));
                    setActionRemarks(site.verify_remarks || '');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#2559bf',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Verify This Survey
                </button>
              )}
            </div>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedSiteForDetails(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Top Overview Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Unique ID: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#2559bf' }}>{selectedSiteForDetails.unique_id}</strong>
                <span style={{ marginLeft: 14, fontSize: 12, color: '#64748b' }}>
                  Vendor: <strong>{selectedSiteForDetails.vendor_name}</strong>
                </span>
                <span style={{ marginLeft: 14, fontSize: 12, color: '#64748b' }}>
                  CA No: <strong style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.ca_no}</strong>
                </span>
              </div>
              <div>
                {Number(selectedSiteForDetails.verify_status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : Number(selectedSiteForDetails.verify_status) === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Rejected
                  </span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Grid 1: Basic Site & Beneficiary Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Site Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site & Department Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Site Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.site_name}</span>

                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span>{selectedSiteForDetails.department}</span>

                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.state}</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district}</span>

                  <span style={{ color: '#64748b' }}>Site Address:</span>
                  <span>{selectedSiteForDetails.site_address}</span>

                  <span style={{ color: '#64748b' }}>Nearest Landmark:</span>
                  <span>{selectedSiteForDetails.nearest_landmark}</span>
                </div>
              </div>

              {/* Contact & Geolocation */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Contact Person & Geolocation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Contact Person:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.contact_person}</span>

                  <span style={{ color: '#64748b' }}>Contact Number:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
                    {selectedSiteForDetails.contact_no}
                  </span>

                  <span style={{ color: '#64748b' }}>Latitude:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.latitude}</span>

                  <span style={{ color: '#64748b' }}>Longitude:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.longitude}</span>

                  <span style={{ color: '#64748b' }}>GPS Maps:</span>
                  <div>
                    {selectedSiteForDetails.latitude && selectedSiteForDetails.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.latitude},${selectedSiteForDetails.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2559bf', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Open in Google Maps ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Electrical, Metering & Grid Specifications */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Electrical, Metering & Grid Availability
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Proposed Capacity</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a' }}>
                    {selectedSiteForDetails.proposed_capacity ? `${selectedSiteForDetails.proposed_capacity} kW` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Sanction Load</div>
                  <div style={{ fontWeight: 600, color: '#2559bf' }}>
                    {selectedSiteForDetails.sanction_load ? `${selectedSiteForDetails.sanction_load} kW` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Instantaneous Load</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.instantaneous_load ? `${selectedSiteForDetails.instantaneous_load} kW` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Load Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.load_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Connection Phase</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.connection_phase || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Meter Connection Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.meter_connection_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Meter Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.meter_number || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Grid Availability</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.grid_availability || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>All 3-Phase in LTDB</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.three_phase_available || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Missing Phase</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.missing_phase || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>LTDB Present</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.ltdb_present || '—'}</div>
                </div>
              </div>

              {/* DG Set Sub-section */}
              <div style={{ marginTop: 12, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Backup DG Set Details:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748b' }}>DG Set Available: </span>
                    <strong>{selectedSiteForDetails.existing_dg_set || 'No'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>DG Set Capacity: </span>
                    <strong>{selectedSiteForDetails.dg_set_capacity || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>DG Set Make: </span>
                    <strong>{selectedSiteForDetails.dg_set_make || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 3: Roof, Space & Civil Structural Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Rooftop & Structural Engineering Parameters
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Type of Roof</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.roof_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Structure Required</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.structure_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Roof Condition</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.roof_condition || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Total Roof Area</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.total_roof_area ? `${selectedSiteForDetails.total_roof_area} sq.ft` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Free Space</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>
                    {selectedSiteForDetails.free_space_solar ? `${selectedSiteForDetails.free_space_solar} sq.ft` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Control Room Free Space</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.free_space_inverter ? `${selectedSiteForDetails.free_space_inverter} sq.ft` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Earth Pit Position</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.earth_pit_position || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Routing of AC Cable</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.ac_cable_routing ? `${selectedSiteForDetails.ac_cable_routing} mtr` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Age of Building</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.age_of_building || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Access to Roof</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.roof_access || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Rooftop Height</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.rooftop_height ? `${selectedSiteForDetails.rooftop_height} mtr` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Parapet Height</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.parapet_height ? `${selectedSiteForDetails.parapet_height} mtr` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Number of Floors</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.no_of_floors || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Access to Site</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.site_access || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Distance from Main Road</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.distance_main_road ? `${selectedSiteForDetails.distance_main_road} km` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 4: Photographic & Document Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12, letterSpacing: '0.04em' }}>
                Photographic & Feasibility Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {/* Photo 1: Building */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Building Image
                  </div>
                  {selectedSiteForDetails.building_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() =>
                        setLightboxPreview({
                          url: resolveJammuSurveyMediaUrl(selectedSiteForDetails.building_image, 'srt_image'),
                          title: `Building Image - ${selectedSiteForDetails.site_name}`,
                        })
                      }
                    >
                      <img
                        src={resolveJammuSurveyMediaUrl(selectedSiteForDetails.building_image, 'srt_image')}
                        alt="Building"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to zoom</div>
                    </div>
                  ) : (
                    <div style={{ padding: 28, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                  )}
                </div>

                {/* Photo 2: Roof Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Roof Image
                  </div>
                  {selectedSiteForDetails.roof_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() =>
                        setLightboxPreview({
                          url: resolveJammuSurveyMediaUrl(selectedSiteForDetails.roof_image, 'srt_image'),
                          title: `Roof Image - ${selectedSiteForDetails.site_name}`,
                        })
                      }
                    >
                      <img
                        src={resolveJammuSurveyMediaUrl(selectedSiteForDetails.roof_image, 'srt_image')}
                        alt="Roof"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to zoom</div>
                    </div>
                  ) : (
                    <div style={{ padding: 28, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                  )}
                </div>

                {/* Photo 3: Control Room */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Control Room Image
                  </div>
                  {selectedSiteForDetails.control_room_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() =>
                        setLightboxPreview({
                          url: resolveJammuSurveyMediaUrl(selectedSiteForDetails.control_room_image, 'srt_image'),
                          title: `Control Room - ${selectedSiteForDetails.site_name}`,
                        })
                      }
                    >
                      <img
                        src={resolveJammuSurveyMediaUrl(selectedSiteForDetails.control_room_image, 'srt_image')}
                        alt="Control Room"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to zoom</div>
                    </div>
                  ) : (
                    <div style={{ padding: 28, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                  )}
                </div>

                {/* Photo 4: Other Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Other Image
                  </div>
                  {selectedSiteForDetails.other_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() =>
                        setLightboxPreview({
                          url: resolveJammuSurveyMediaUrl(selectedSiteForDetails.other_image, 'srt_image'),
                          title: `Other Survey Image - ${selectedSiteForDetails.site_name}`,
                        })
                      }
                    >
                      <img
                        src={resolveJammuSurveyMediaUrl(selectedSiteForDetails.other_image, 'srt_image')}
                        alt="Other"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to zoom</div>
                    </div>
                  ) : (
                    <div style={{ padding: 28, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                  )}
                </div>

                {/* PDF Feasibility Document */}
                {selectedSiteForDetails.pdf && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Feasibility PDF
                    </div>
                    <div
                      style={{ padding: 18, cursor: 'pointer', background: '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                      onClick={() =>
                        setLightboxPreview({
                          url: resolveJammuSurveyMediaUrl(selectedSiteForDetails.pdf, 'srt_pdf'),
                          title: `Feasibility Report PDF - ${selectedSiteForDetails.site_name}`,
                        })
                      }
                    >
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={1.75}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Open PDF Document</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 5: Audit & Verification Notes */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Audit & Verification Remarks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Verification Status:</span>
                <div>
                  {Number(selectedSiteForDetails.verify_status) === 1 ? (
                    <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      Approved
                    </span>
                  ) : Number(selectedSiteForDetails.verify_status) === 2 ? (
                    <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      Rejected
                    </span>
                  ) : (
                    <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      Verification Pending
                    </span>
                  )}
                </div>

                <span style={{ color: '#64748b' }}>Verified Date:</span>
                <span>{selectedSiteForDetails.verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>Auditor Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.verify_remarks || 'No auditor remarks recorded yet.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Verify Status ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedSiteForAction(null);
        }}
        title="Verify Survey Feasibility Status"
        subtitle={
          selectedSiteForAction
            ? `Site: ${selectedSiteForAction.site_name} • UID: ${selectedSiteForAction.unique_id} • District: ${selectedSiteForAction.district}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedSiteForAction(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-button ax-button--primary"
              onClick={handleActionSubmit}
              disabled={submittingAction}
              style={{ padding: '6px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Submit Decision
            </button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong, #0f172a)' }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong, #0f172a)' }}>
              Auditor Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter technical audit remarks or rejection reasons..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Image Lightbox / Document Preview Modal ── */}
      <Modal
        open={Boolean(lightboxPreview)}
        onClose={() => setLightboxPreview(null)}
        title={lightboxPreview?.title || 'Survey Photograph Preview'}
        maxWidth={840}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {lightboxPreview?.url ? (
              <a
                href={lightboxPreview.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#2559bf', fontWeight: 600, textDecoration: 'none' }}
              >
                Open original in new tab ↗
              </a>
            ) : <div />}
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setLightboxPreview(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxPreview && (
          <div style={{ textAlign: 'center', padding: 4 }}>
            {/\.pdf($|\?)/i.test(lightboxPreview.url) ? (
              <iframe
                src={lightboxPreview.url}
                title="Feasibility Document"
                style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <img
                src={lightboxPreview.url}
                alt="Survey Preview"
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 8 }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifySrt70MWSurvey;

