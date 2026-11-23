import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
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
  jammuSurveyAdminService,
  resolveJammuSurveyMediaUrl,
  type JammuSrt70SurveyItem,
  type JammuSrt70SurveyStats,
} from '../jammuSurveyAdminService';

/* ───────── Responsive page CSS (Exact Bihar SRT / Assam reference, all columns scrollable) ───────── */
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
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
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

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
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

/* ── Top KPI Card Component (Exact reference styling) ── */
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#ffffff', border: '1px solid #e2e8f0' }}>
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display, sans-serif)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 720,
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
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image & Document Lightbox Modal ───────── */
function LightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Media Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* 50-field Jammu SRT 70MW Survey Item Interface */
export interface JammuVerifySurveyItem {
  id: number;
  uid: string;
  vendor: string;
  vendorId?: string | number | null;
  state: string;
  district: string;
  deptName: string;
  siteName: string;
  siteAddress: string;
  surveyAddress: string;
  caNo: string;
  nearestLandmark: string;
  contactPerson: string;
  contactNo: string;
  proposedCapacity: string;
  latitude: string;
  longitude: string;
  loadType: string;
  connectionPhase: string;
  meterConnectionType: string;
  meterNumber: string;
  sanctionLoad: string;
  instantaneousLoad: string;
  gridAvailability: string;
  threePhaseAvailable: string;
  missingPhase: string;
  ltdbPresent: string;
  existingDgSet: string;
  dgSetCapacity: string;
  dgSetMake: string;
  roofCondition: string;
  roofArea: string;
  solarFreeSpace: string;
  controlRoomFreeSpace: string;
  earthPit: string;
  acCableRouting: string;
  roofType: string;
  structureType: string;
  buildingAge: string;
  roofAccess: string;
  rooftopHeight: string;
  parapetHeight: string;
  numberOfFloors: string;
  siteAccess: string;
  siteDistance: string;
  buildingImage?: string;
  roofImage?: string;
  controlRoomImage?: string;
  otherImage?: string;
  pdfFile?: string;
  verifyStatus: 'Pending' | 'Approved' | 'Rejected';
  rawStatus: number;
  rawRecord: JammuSrt70SurveyItem;
}

const DASH = '—';
const escapeHtml = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function VerifySrt70MWSurvey() {
  const location = useLocation();
  const [items, setItems] = useState<JammuVerifySurveyItem[]>([]);
  const [stats, setStats] = useState<JammuSrt70SurveyStats>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bifurcation Tabs: 'pending' (default) | 'processed' (Approved/Rejected) | 'all'
  const [activeTab, setActiveTab] = useState<'pending' | 'processed' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<JammuVerifySurveyItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // '' = -- Select Status --, 1 = Approved, 2 = Rejected
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<JammuVerifySurveyItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Synchronize hash/query params (e.g. #Pending, #approved, ?tab=processed)
  useEffect(() => {
    const hash = (location.hash || '').toLowerCase();
    const qTab = new URLSearchParams(location.search).get('tab');
    if (hash === '#approved' || qTab === 'processed' || qTab === 'verify') {
      setActiveTab('processed');
    } else if (hash === '#pending' || qTab === 'pending') {
      setActiveTab('pending');
    } else if (qTab === 'all') {
      setActiveTab('all');
    }
  }, [location.hash, location.search]);

  // Top 4 KPI Metrics matching user specification:
  // Complete Survey 54, Verifiy Pending Survey 45, Verify Approve Survey 9, Verify Reject Survey 0
  const completeSurveyCount = stats.complete_survey ?? (stats.assignsite ?? stats.total ?? items.length);
  const verifyPendingCount = stats.survey_verify_pending ?? items.filter((s) => s.verifyStatus === 'Pending').length;
  const verifyApproveCount = stats.survey_verify ?? (stats.survey_verify_complete ?? items.filter((s) => s.verifyStatus === 'Approved').length);
  const verifyRejectCount = stats.survey_verify_reject ?? items.filter((s) => s.verifyStatus === 'Rejected').length;

  // Load from Live Backend API
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [viewRes, assignFormRes] = await Promise.allSettled([
        jammuSurveyAdminService.viewSrt70Survey(),
        jammuSurveyAdminService.getSrt70SurveyAssignFormData(),
      ]);

      const vendorMap = new Map<string, string>();
      if (assignFormRes.status === 'fulfilled' && assignFormRes.value?.vendor) {
        assignFormRes.value.vendor.forEach((v) => {
          if (v && v.id !== undefined) {
            vendorMap.set(String(v.id), v.name);
          }
        });
      }

      if (viewRes.status === 'fulfilled') {
        const resp = viewRes.value;
        const srtStats = resp.srt70mw || {};
        setStats(srtStats);

        const mapItem = (item: JammuSrt70SurveyItem, defaultStatus: number): JammuVerifySurveyItem => {
          const rawStatus = Number(item.survey_verify_status ?? item.verify_status ?? defaultStatus);
          const verifyStatus: 'Pending' | 'Approved' | 'Rejected' =
            rawStatus === 1 ? 'Approved' : rawStatus === 2 ? 'Rejected' : (defaultStatus === 1 ? 'Approved' : 'Pending');

          const vId = item.survey_vendor || item.vendor;
          const vendorName =
            item.vendor_name ||
            (vId ? vendorMap.get(String(vId)) : undefined) ||
            (vId ? `Vendor #${vId}` : DASH);

          const rawBld = item.image1 || item.building_image;
          const rawRoof = item.image2 || item.roof_image;
          const rawCtrl = item.image3 || item.control_room_image;
          const rawOther = item.image4 || item.other_image;
          const rawPdf = item.pdf_file || item.pdf;

          return {
            id: item.id,
            uid: String(item.uid || item.unique_id || item.id),
            vendor: vendorName,
            vendorId: vId,
            state: item.state ? (item.state.toLowerCase() === 'jammu' ? 'Jammu' : item.state) : 'Jammu',
            district: item.district || DASH,
            deptName: item.dept_name || item.department || DASH,
            siteName: item.site_name || `Site #${item.id}`,
            siteAddress: item.address || item.site_address || DASH,
            surveyAddress: item.survey_site_address || item.address || DASH,
            caNo: item.ca_no || DASH,
            nearestLandmark: item.near_landmark || item.landmark || DASH,
            contactPerson: item.contact_person || item.contact_person_name || DASH,
            contactNo: item.contact_no || item.contact_person_mobile || DASH,
            proposedCapacity: item.proposed_capacity ? `${item.proposed_capacity} kW` : (item.sanction_load ? `${item.sanction_load} kW` : DASH),
            latitude: item.latitude || DASH,
            longitude: item.longitude || DASH,
            loadType: item.load_type || DASH,
            connectionPhase: item.connection_type || item.connection_phase || DASH,
            meterConnectionType: item.meter_connection_type || DASH,
            meterNumber: item.meter_no || item.meter_number || DASH,
            sanctionLoad: item.sanction_load ? `${item.sanction_load} kW` : DASH,
            instantaneousLoad: item.instantaneous_load ? `${item.instantaneous_load} kW` : DASH,
            gridAvailability: item.grid_availability || DASH,
            threePhaseAvailable: item.three_phase_available || DASH,
            missingPhase: item.missing_phase || DASH,
            ltdbPresent: item.ltdb_status || item.ltdb_present || DASH,
            existingDgSet: item.existing_dg_set || DASH,
            dgSetCapacity: item.dg_set_capacity || DASH,
            dgSetMake: item.dg_set_make || DASH,
            roofCondition: item.roof_condition || DASH,
            roofArea: item.roof_area ? `${item.roof_area} sq.ft` : DASH,
            solarFreeSpace: item.solar_free_space ? `${item.solar_free_space} sq.ft` : DASH,
            controlRoomFreeSpace: item.control_room_free_space ? `${item.control_room_free_space} sq.ft` : DASH,
            earthPit: item.earth_pit || DASH,
            acCableRouting: item.ac_cable_routing ? `${item.ac_cable_routing} mtr` : DASH,
            roofType: item.roof_type || DASH,
            structureType: item.structure_type || DASH,
            buildingAge: item.building_age ? `${item.building_age} yrs` : DASH,
            roofAccess: item.roof_access || DASH,
            rooftopHeight: item.rooftop_height ? `${item.rooftop_height} mtr` : DASH,
            parapetHeight: item.parapet_height ? `${item.parapet_height} mtr` : DASH,
            numberOfFloors: item.number_of_floors ? `G+${item.number_of_floors}` : DASH,
            siteAccess: item.site_access || DASH,
            siteDistance: item.site_distance ? `${item.site_distance} km` : DASH,
            buildingImage: rawBld ? resolveJammuSurveyMediaUrl(rawBld, 'srt_image') : undefined,
            roofImage: rawRoof ? resolveJammuSurveyMediaUrl(rawRoof, 'srt_image') : undefined,
            controlRoomImage: rawCtrl ? resolveJammuSurveyMediaUrl(rawCtrl, 'srt_image') : undefined,
            otherImage: rawOther ? resolveJammuSurveyMediaUrl(rawOther, 'srt_image') : undefined,
            pdfFile: rawPdf ? resolveJammuSurveyMediaUrl(rawPdf, 'srt_pdf') : undefined,
            verifyStatus,
            rawStatus,
            rawRecord: item,
          };
        };

        const pendingList = (resp.pending || []).map((x) => mapItem(x, 0));
        const verifiedList = (resp.verify || []).map((x) => mapItem(x, 1));
        setItems([...pendingList, ...verifiedList]);
      } else {
        throw viewRes.reason;
      }
    } catch (err: any) {
      console.error('[VerifySrt70MWSurvey] Failed to load survey records:', err);
      setErrorMsg(err?.message || 'Failed to load live Jammu SRT 70MW survey verification data.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab Filtering & Global Search across all fields
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'pending') {
      result = result.filter((s) => s.verifyStatus === 'Pending');
    } else if (activeTab === 'processed') {
      result = result.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected');
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.siteName.toLowerCase().includes(q) ||
          s.vendor.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.deptName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.contactNo.toLowerCase().includes(q) ||
          s.caNo.toLowerCase().includes(q) ||
          s.meterNumber.toLowerCase().includes(q) ||
          s.uid.toLowerCase().includes(q) ||
          s.nearestLandmark.toLowerCase().includes(q) ||
          s.siteAddress.toLowerCase().includes(q) ||
          s.surveyAddress.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeTab, search]);

  // Pagination hook matching exact reference
  const pagination = usePagination(filteredItems, { initialPageSize: 100 });

  // Reset page to 1 when changing tabs or search
  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, search]);

  // Action Submission Handler (Approve / Reject)
  const handleActionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    if (!actionStatus) {
      alert('Please select status.');
      return;
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await jammuSurveyAdminService.verifySrt70SurveyStatus({
        id: selectedSiteForAction.id,
        status: actionStatus,
        vendor: selectedSiteForAction.vendorId || selectedSiteForAction.rawRecord.survey_vendor || '',
        remarks: actionRemarks,
      });

      if (res.success) {
        setSuccessMsg(
          res.message ||
            `Survey site #${selectedSiteForAction.id} successfully marked as ${actionStatus === '1' ? 'Approved' : 'Rejected'}!`
        );
        setSelectedSiteForAction(null);
        setActionStatus('');
        setActionRemarks('');
        setActionFile(null);
        loadData();
      } else {
        setErrorMsg(res.message || 'Failed to update survey verification status.');
      }
    } catch (err: any) {
      console.error('Action submit error:', err);
      setErrorMsg(err?.message || 'Server error while submitting survey verification.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Full 50-field Export Columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'serialNo', header: 'Sr. No.' },
    { key: 'uid', header: 'Unique ID' },
    { key: 'vendor', header: 'Vendor Name' },
    { key: 'state', header: 'State' },
    { key: 'district', header: 'District' },
    { key: 'deptName', header: 'Department' },
    { key: 'siteName', header: 'Site Name' },
    { key: 'siteAddress', header: 'Site Address' },
    { key: 'caNo', header: 'CA No.' },
    ...(activeTab === 'processed' ? [{ key: 'surveyAddress', header: 'Survey Address' }] : []),
    { key: 'nearestLandmark', header: 'Nearest Landmark' },
    { key: 'contactPerson', header: 'Name Of Current Contact Person' },
    { key: 'contactNo', header: 'Contact No' },
    { key: 'proposedCapacity', header: 'Proposed Capacity (In KW)' },
    { key: 'latitude', header: 'Latitude' },
    { key: 'longitude', header: 'Longitude' },
    { key: 'loadType', header: 'Load Type' },
    { key: 'connectionPhase', header: 'Connection Phase' },
    { key: 'meterConnectionType', header: 'Meter Connection Type' },
    { key: 'meterNumber', header: 'Meter Number' },
    { key: 'sanctionLoad', header: 'Sanction Load (KW/KVA)' },
    { key: 'instantaneousLoad', header: 'Instantaneous/Corrected Load (KW)' },
    { key: 'gridAvailability', header: 'Grid Availability' },
    { key: 'threePhaseAvailable', header: 'Is All Three Phase Available In LTDB' },
    { key: 'missingPhase', header: 'Missing Phase' },
    { key: 'ltdbPresent', header: 'LTDB Present' },
    { key: 'existingDgSet', header: 'Is Existing DG SET' },
    { key: 'dgSetCapacity', header: 'Dg SET Capacity' },
    { key: 'dgSetMake', header: 'Dg SET Make' },
    { key: 'roofCondition', header: 'Roof Condition' },
    { key: 'roofArea', header: 'Total Roof Area (Sq.Feet)' },
    { key: 'solarFreeSpace', header: 'Free Space for Solar Installation (in Sq.Feet)' },
    { key: 'controlRoomFreeSpace', header: 'Free Space for Control Room/Inverter (in Sq.Feet)' },
    { key: 'earthPit', header: 'Earth Pit Position' },
    { key: 'acCableRouting', header: 'Routing of AC Cable from System Area (mtr)' },
    { key: 'roofType', header: 'Type of Roof' },
    { key: 'structureType', header: 'Type of Structure Required' },
    { key: 'buildingAge', header: 'Age Of Building' },
    { key: 'roofAccess', header: 'Access To The Roof' },
    { key: 'rooftopHeight', header: 'Rooftop Height (mtr)' },
    { key: 'parapetHeight', header: 'Parapet Height (mtr)' },
    { key: 'numberOfFloors', header: 'No. of Floors (G+...)' },
    { key: 'siteAccess', header: 'Access To Site' },
    { key: 'siteDistance', header: 'Distance Of Site From Main Road(km)' },
    { key: 'buildingImage', header: 'Building Image' },
    { key: 'roofImage', header: 'Roof Image' },
    { key: 'controlRoomImage', header: 'Control Room' },
    { key: 'otherImage', header: 'Other Image' },
    { key: 'pdfFile', header: 'PDF' },
    { key: 'status', header: activeTab === 'pending' ? 'Verify Status' : 'status' },
  ];

  const exportRows = useMemo(() => {
    return filteredItems.map((r, i) => ({
      serialNo: i + 1,
      uid: r.uid,
      vendor: r.vendor,
      state: r.state,
      district: r.district,
      deptName: r.deptName,
      siteName: r.siteName,
      siteAddress: r.siteAddress,
      caNo: r.caNo,
      surveyAddress: r.surveyAddress,
      nearestLandmark: r.nearestLandmark,
      contactPerson: r.contactPerson,
      contactNo: r.contactNo,
      proposedCapacity: r.proposedCapacity,
      latitude: r.latitude,
      longitude: r.longitude,
      loadType: r.loadType,
      connectionPhase: r.connectionPhase,
      meterConnectionType: r.meterConnectionType,
      meterNumber: r.meterNumber,
      sanctionLoad: r.sanctionLoad,
      instantaneousLoad: r.instantaneousLoad,
      gridAvailability: r.gridAvailability,
      threePhaseAvailable: r.threePhaseAvailable,
      missingPhase: r.missingPhase,
      ltdbPresent: r.ltdbPresent,
      existingDgSet: r.existingDgSet,
      dgSetCapacity: r.dgSetCapacity,
      dgSetMake: r.dgSetMake,
      roofCondition: r.roofCondition,
      roofArea: r.roofArea,
      solarFreeSpace: r.solarFreeSpace,
      controlRoomFreeSpace: r.controlRoomFreeSpace,
      earthPit: r.earthPit,
      acCableRouting: r.acCableRouting,
      roofType: r.roofType,
      structureType: r.structureType,
      buildingAge: r.buildingAge,
      roofAccess: r.roofAccess,
      rooftopHeight: r.rooftopHeight,
      parapetHeight: r.parapetHeight,
      numberOfFloors: r.numberOfFloors,
      siteAccess: r.siteAccess,
      siteDistance: r.siteDistance,
      buildingImage: r.buildingImage || DASH,
      roofImage: r.roofImage || DASH,
      controlRoomImage: r.controlRoomImage || DASH,
      otherImage: r.otherImage || DASH,
      pdfFile: r.pdfFile || DASH,
      status: r.verifyStatus,
    }));
  }, [filteredItems, activeTab]);

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="Jammu SRT 70MW Survey"
        subtitle="Review, audit, approve or reject survey feasibility records submitted by empaneled vendors"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'SRT 70MW', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'Verify Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Survey Dashboard
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Sites
            </Link>
          </div>
        }
      />

      {/* Feedback Alerts */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8, color: '#b91c1c', marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><b>Error:</b> {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #10b981', borderRadius: 8, color: '#15803d', marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><b>Success:</b> {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Top 4 KPI Metrics matching user specification ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          tone="accent"
          label="Complete Survey"
          value={Number(completeSurveyCount || 0).toLocaleString('en-IN')}
          sub="Total survey sites conducted"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          }
          tone="amber"
          label="Verifiy Pending Survey"
          value={Number(verifyPendingCount || 0).toLocaleString('en-IN')}
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
          value={Number(verifyApproveCount || 0).toLocaleString('en-IN')}
          sub="Feasible & approved surveys"
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
          value={Number(verifyRejectCount || 0).toLocaleString('en-IN')}
          sub="Requires re-inspection"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyPendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processed')}
          className={`asw-pill-btn ${activeTab === 'processed' ? 'active' : ''}`}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'processed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyApproveCount + verifyRejectCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {items.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'all'
                ? 'All Jammu SRT 70MW Survey Records'
                : activeTab === 'pending'
                ? 'Jammu SRT 70MW Surveys Pending Verification'
                : 'Jammu SRT 70MW Verified Survey Register'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredItems.length} site{filteredItems.length === 1 ? '' : 's'} with all 50 technical & feasibility attributes
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, site, meter..."
                size="sm"
              />
              <TableExportToolbar
                onExportCSV={() => {
                  const headerRow = exportColumns.map((c) => `"${c.header}"`).join(',');
                  const bodyRows = exportRows.map((r) =>
                    exportColumns.map((c) => `"${String((r as any)[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
                  );
                  const csv = `\ufeff${[headerRow, ...bodyRows].join('\r\n')}`;
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SRT_70MW_Survey_${activeTab}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onExportExcel={() => {
                  const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${exportRows.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.key] ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
                  const blob = new Blob([`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Jammu_SRT_70MW_Survey_${activeTab}.xls`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onExportPDF={() => {
                  window.print();
                }}
                onCopy={() => {
                  const headerRow = exportColumns.map((c) => c.header).join('\t');
                  const bodyRows = exportRows.map((r) =>
                    exportColumns.map((c) => String((r as any)[c.key] ?? '')).join('\t')
                  );
                  navigator.clipboard.writeText([headerRow, ...bodyRows].join('\n'));
                  alert('Data copied to clipboard!');
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Horizontally Scrollable Table matching exact reference classes ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 4800 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">Vendor name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Site Address</th>
                <th className="ax-table__th">CA No.</th>
                {activeTab === 'processed' && <th className="ax-table__th">Survey Address</th>}
                <th className="ax-table__th">Nearest Landmark</th>
                <th className="ax-table__th">Name Of Current Contact Person</th>
                <th className="ax-table__th">Contact No</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Proposed Capacity (In KW)</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Load Type</th>
                <th className="ax-table__th">Connection Phase</th>
                <th className="ax-table__th">Meter Connection Type</th>
                <th className="ax-table__th">Meter Number</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Sanction Load (KW/KVA)</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Instantaneous/Corrected Load (KW)</th>
                <th className="ax-table__th">Grid Availability</th>
                <th className="ax-table__th">Is All Three Phase Available In LTDB</th>
                <th className="ax-table__th">Missing Phase</th>
                <th className="ax-table__th">LTDB Present</th>
                <th className="ax-table__th">Is Existing DG SET</th>
                <th className="ax-table__th">Dg SET Capacity</th>
                <th className="ax-table__th">Dg SET Make</th>
                <th className="ax-table__th">Roof Condition</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th">Earth Pit Position</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Routing of AC Cable from System Area (mtr)</th>
                <th className="ax-table__th">Type of Roof</th>
                <th className="ax-table__th">Type of Structure Required</th>
                <th className="ax-table__th">Age Of Building</th>
                <th className="ax-table__th">Access To The Roof</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Rooftop Height (mtr)</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Parapet Height (mtr)</th>
                <th className="ax-table__th">No. of Floors (G+...)</th>
                <th className="ax-table__th">Access To Site</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Distance Of Site From Main Road(km)</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" style={{ width: 80, textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' && (
                  <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 51 : (activeTab === 'processed' ? 51 : 50)} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading survey verification records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 51 : (activeTab === 'processed' ? 51 : 50)} style={centerCell}>
                    <TableEmptyState
                      title="No Survey Verification Records Found"
                      description={`No records found under "${activeTab === 'pending' ? 'Verification Pending' : 'Approved / Rejected'}" matching your criteria.`}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((r, idx) => {
                  const serialNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={r.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. Unique ID */}
                      <td className="ax-table__td">
                        <b style={{ color: '#2559bf' }}>#{r.uid}</b>
                      </td>

                      {/* 3. Vendor name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.vendor}</div>
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.state}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {r.district}
                        </span>
                      </td>

                      {/* 6. Department */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.deptName}
                      </td>

                      {/* 7. Site Name */}
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setSelectedSiteForDetails(r)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontWeight: 700,
                            color: '#2559bf',
                            cursor: 'pointer',
                            textAlign: 'left',
                            textDecoration: 'underline',
                          }}
                          title="Click to view full inspection card"
                        >
                          {r.siteName}
                        </button>
                      </td>

                      {/* 8. Site Address */}
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.siteAddress}
                      </td>

                      {/* 9. CA No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.caNo}
                      </td>

                      {/* 10. Survey Address (Specifically on Approved/Rejected tab) */}
                      {activeTab === 'processed' && (
                        <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.surveyAddress}
                        </td>
                      )}

                      {/* 11. Nearest Landmark */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.nearestLandmark}
                      </td>

                      {/* 12. Name Of Current Contact Person */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.contactPerson}
                      </td>

                      {/* 13. Contact No */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.contactNo}
                      </td>

                      {/* 14. Proposed Capacity (In KW) */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {r.proposedCapacity}
                      </td>

                      {/* 15. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.latitude}
                      </td>

                      {/* 16. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.longitude && r.longitude !== DASH && r.latitude && r.latitude !== DASH ? (
                          <a
                            href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              color: '#2559bf',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                            title="Open Google Maps"
                          >
                            <span>{r.longitude}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : (
                          r.longitude
                        )}
                      </td>

                      {/* 17. Load Type */}
                      <td className="ax-table__td">
                        <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>{r.loadType}</span>
                      </td>

                      {/* 18. Connection Phase */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.connectionPhase}
                      </td>

                      {/* 19. Meter Connection Type */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {r.meterConnectionType}
                      </td>

                      {/* 20. Meter Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.meterNumber}
                      </td>

                      {/* 21. Sanction Load (KW/KVA) */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {r.sanctionLoad}
                      </td>

                      {/* 22. Instantaneous/Corrected Load (KW) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.instantaneousLoad}
                      </td>

                      {/* 23. Grid Availability */}
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.gridAvailability}
                      </td>

                      {/* 24. Is All Three Phase Available In LTDB */}
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.threePhaseAvailable}
                      </td>

                      {/* 25. Missing Phase */}
                      <td className="ax-table__td">
                        {r.missingPhase}
                      </td>

                      {/* 26. LTDB Present */}
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.ltdbPresent}
                      </td>

                      {/* 27. Is Existing DG SET */}
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.existingDgSet}
                      </td>

                      {/* 28. Dg SET Capacity */}
                      <td className="ax-table__td">
                        {r.dgSetCapacity}
                      </td>

                      {/* 29. Dg SET Make */}
                      <td className="ax-table__td">
                        {r.dgSetMake}
                      </td>

                      {/* 30. Roof Condition */}
                      <td className="ax-table__td">
                        {r.roofCondition}
                      </td>

                      {/* 31. Total Roof Area (Sq.Feet) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.roofArea}
                      </td>

                      {/* 32. Free Space for Solar Installation (in Sq.Feet) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.solarFreeSpace}
                      </td>

                      {/* 33. Free Space for Control Room/Inverter (in Sq.Feet) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.controlRoomFreeSpace}
                      </td>

                      {/* 34. Earth Pit Position */}
                      <td className="ax-table__td">
                        {r.earthPit}
                      </td>

                      {/* 35. Routing of AC Cable from System Area (mtr) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.acCableRouting}
                      </td>

                      {/* 36. Type of Roof */}
                      <td className="ax-table__td">
                        {r.roofType}
                      </td>

                      {/* 37. Type of Structure Required */}
                      <td className="ax-table__td">
                        {r.structureType}
                      </td>

                      {/* 38. Age Of Building */}
                      <td className="ax-table__td">
                        {r.buildingAge}
                      </td>

                      {/* 39. Access To The Roof */}
                      <td className="ax-table__td">
                        {r.roofAccess}
                      </td>

                      {/* 40. Rooftop Height (mtr) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.rooftopHeight}
                      </td>

                      {/* 41. Parapet Height (mtr) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.parapetHeight}
                      </td>

                      {/* 42. No. of Floors (G+...) */}
                      <td className="ax-table__td">
                        {r.numberOfFloors}
                      </td>

                      {/* 43. Access To Site */}
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.siteAccess}
                      </td>

                      {/* 44. Distance Of Site From Main Road(km) */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        {r.siteDistance}
                      </td>

                      {/* 45. Building Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.buildingImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: r.buildingImage!, title: `${r.siteName} — Building Image` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view building photo"
                          >
                            <img
                              src={r.buildingImage}
                              alt="Building"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 46. Roof Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.roofImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: r.roofImage!, title: `${r.siteName} — Roof Image` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view roof photo"
                          >
                            <img
                              src={r.roofImage}
                              alt="Roof"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 47. Control Room */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.controlRoomImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: r.controlRoomImage!, title: `${r.siteName} — Control Room Image` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view control room photo"
                          >
                            <img
                              src={r.controlRoomImage}
                              alt="Control Room"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 48. Other Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.otherImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: r.otherImage!, title: `${r.siteName} — Other Image` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view additional photo"
                          >
                            <img
                              src={r.otherImage}
                              alt="Other"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 49. PDF */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.pdfFile ? (
                          <a
                            href={r.pdfFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600 }}
                            title="Open Survey PDF"
                          >
                            PDF ↗
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 50. Verify Status / status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              r.verifyStatus === 'Approved'
                                ? '#ecfdf5'
                                : r.verifyStatus === 'Rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              r.verifyStatus === 'Approved'
                                ? '#059669'
                                : r.verifyStatus === 'Rejected'
                                ? '#dc2626'
                                : '#d97706',
                            border: `1px solid ${
                              r.verifyStatus === 'Approved'
                                ? '#a7f3d0'
                                : r.verifyStatus === 'Rejected'
                                ? '#fecaca'
                                : '#fde68a'
                            }`,
                          }}
                        >
                          {r.verifyStatus}
                        </span>
                      </td>

                      {/* 51. Action column (ONLY ON PENDING TAB, OMITTED ON APPROVED/REJECTED TAB) */}
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteForAction(r);
                              setActionStatus('');
                              setActionRemarks('');
                              setActionFile(null);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              background: '#2559bf',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Verify Site Status"
                          >
                            Verify
                          </button>
                        </td>
                      )}
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

      {/* ── Verification Action Modal ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          setSelectedSiteForAction(null);
          setActionStatus('');
          setActionRemarks('');
          setActionFile(null);
        }}
        title="Verify Status"
        subtitle={selectedSiteForAction ? `Site: ${selectedSiteForAction.siteName} • Vendor: ${selectedSiteForAction.vendor}` : undefined}
        maxWidth={480}
      >
        {selectedSiteForAction && (
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  color: actionStatus ? '#0f172a' : '#64748b',
                  background: '#fff',
                }}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="1">Verify Approve</option>
                <option value="2">Verify Reject</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                File <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setActionFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  background: '#f8fafc',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Remark
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter remark"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13,
                  resize: 'vertical',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => {
                  setSelectedSiteForAction(null);
                  setActionStatus('');
                  setActionRemarks('');
                  setActionFile(null);
                }}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingAction}
                style={{ background: '#2559bf', color: '#fff', fontWeight: 700 }}
              >
                {submittingAction ? 'Updating...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Technical Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Technical Verification Details"
        subtitle={selectedSiteForDetails ? `${selectedSiteForDetails.siteName} • ${selectedSiteForDetails.district} (#${selectedSiteForDetails.id})` : undefined}
        maxWidth={840}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setSelectedSiteForDetails(null)}
          >
            Close
          </button>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Beneficiary & Site Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle, #f8fafc)', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Vendor Name</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.vendor}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>State & District</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.state}, {selectedSiteForDetails.district}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Contact Person</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.contactPerson} ({selectedSiteForDetails.contactNo})</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Verification Status</span>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        selectedSiteForDetails.verifyStatus === 'Approved'
                          ? '#ecfdf5'
                          : selectedSiteForDetails.verifyStatus === 'Rejected'
                          ? '#fef2f2'
                          : '#fffbeb',
                      color:
                        selectedSiteForDetails.verifyStatus === 'Approved'
                          ? '#059669'
                          : selectedSiteForDetails.verifyStatus === 'Rejected'
                          ? '#dc2626'
                          : '#d97706',
                    }}
                  >
                    {selectedSiteForDetails.verifyStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Equipment Serials & Grid Feasibility */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Technical Feasibility & Equipment
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Proposed Capacity</span>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#2559bf' }}>{selectedSiteForDetails.proposedCapacity}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Sanction Load</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.sanctionLoad}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>CA Number</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.caNo || '—'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Meter Number</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.meterNumber || '—'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Grid Availability</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', textTransform: 'capitalize' }}>{selectedSiteForDetails.gridAvailability}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Connection Phase</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.connectionPhase}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Existing DG Set</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', textTransform: 'capitalize' }}>
                    {selectedSiteForDetails.existingDgSet} {selectedSiteForDetails.dgSetCapacity ? `(${selectedSiteForDetails.dgSetCapacity})` : ''}
                  </div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>AC Cable Routing</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.acCableRouting}</div>
                </div>
              </div>
            </div>

            {/* Rooftop Dimensions */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Civil & Rooftop Dimensions
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Total Roof Area</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.roofArea}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Solar Free Space</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.solarFreeSpace}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Control Room Space</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.controlRoomFreeSpace}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Roof Condition & Type</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.roofCondition} ({selectedSiteForDetails.roofType})</div>
                </div>
              </div>
            </div>

            {/* Site Photos Gallery */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Site Verification Photos
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {selectedSiteForDetails.buildingImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.buildingImage}
                      alt="Building"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.buildingImage!, title: `Building Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 95, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block', fontWeight: 600 }}>Building Image</span>
                  </div>
                )}
                {selectedSiteForDetails.roofImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.roofImage}
                      alt="Roof"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.roofImage!, title: `Roof Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 95, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block', fontWeight: 600 }}>Roof Image</span>
                  </div>
                )}
                {selectedSiteForDetails.controlRoomImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.controlRoomImage}
                      alt="Control Room"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.controlRoomImage!, title: `Control Room - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 95, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block', fontWeight: 600 }}>Control Room</span>
                  </div>
                )}
                {selectedSiteForDetails.otherImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.otherImage}
                      alt="Other"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.otherImage!, title: `Other Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 95, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block', fontWeight: 600 }}>Other Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Site Address:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#334155', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                  {selectedSiteForDetails.siteAddress || 'No address specified.'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Nearest Landmark:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#334155', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                  {selectedSiteForDetails.nearestLandmark || 'No landmark recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Image & Document Lightbox Modal ── */}
      <LightboxModal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        url={lightboxUrl?.url || ''}
        title={lightboxUrl?.title || 'Photo Inspection'}
      />
    </div>
  );
}

export default VerifySrt70MWSurvey;
