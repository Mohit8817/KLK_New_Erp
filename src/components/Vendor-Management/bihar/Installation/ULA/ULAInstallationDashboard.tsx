import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  exportDataToCSV,
  exportDataToExcel,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, getBiharMediaCandidates } from '../../bihar-services/biharAdminService';
import { BIHAR_DISTRICTS } from '../../bihar-types';

// Code-split ApexCharts so Bihar ULA Installation Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Karnataka SWP & Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

// Responsive chart height hook matching Karnataka SWP & DleDashboard
const useChartHeight = (desktop: number, mobile: number) => {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pick);
  useEffect(() => {
    const onResize = () => setH(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktop, mobile]);
  return h;
};

/* ───────── Responsive page CSS (Exact Karnataka SWP reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* ───── Card header (desktop): prioritize title width, condense actions ───── */
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

  /* Search: shrink when space is tight */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Export toolbar: compact layout */
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] .ax-btn {
    padding-inline: 8px;
    min-width: 0;
  }

  /* Tables: responsive scroll */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .solar-erp-page .ax-table {
    width: 100%;
    border-collapse: collapse;
  }

  /* Quick action cards */
  .solar-erp-page .asw-action-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }
  .solar-erp-page .asw-action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px -4px rgba(37, 99, 235, 0.12);
    border-color: #93c5fd;
  }

  /* Interactive KPI Card hover */
  .solar-erp-page .asw-kpi-clickable {
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .solar-erp-page .asw-kpi-clickable:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.08);
  }

  /* Tabs styling matching Karnataka SWP */
  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
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
    border-color: #2563eb;
    color: #2563eb;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  /* ───── Tablet / Mobile breakpoint (<=760px) ───── */
  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-card__header {
      flex-wrap: wrap;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 1 1 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions {
      flex: 1 1 100%;
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
  }
`;

/* ───────── Modal Dialog Styles ───────── */
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

/* ───────── SVG Icons ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_BUILDING = svg(<><path d="M3 21l18 0" /><path d="M9 8l1 0" /><path d="M9 12l1 0" /><path d="M9 16l1 0" /><path d="M14 8l1 0" /><path d="M14 12l1 0" /><path d="M14 16l1 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></>);

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 1000,
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 id="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ax-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Smart Image Thumbnail ───────── */
function SmartThumbnail({
  src,
  title,
  onClick,
}: {
  src?: string | null;
  title: string;
  onClick: (url: string) => void;
}) {
  const candidates = useMemo(() => getBiharMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [src]);

  if (!src || candidates.length === 0) {
    return <span style={{ color: '#94a3b8' }}>—</span>;
  }

  const currentUrl = candidates[candidateIdx] || candidates[0];

  const handleError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(currentUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        overflow: 'hidden',
      }}
      title={`Preview ${title}`}
    >
      {!hasError ? (
        <img
          src={currentUrl}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={handleError}
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb' }}>IMG</span>
      )}
    </button>
  );
}

/* ───────── Interfaces ───────── */
interface VendorBifurcationItem {
  id: string | number;
  vendor: string;
  vendorId?: string | number;
  totalAllocation: number;
  totalStructure: number;
  pendingStructure: number;
  structureVerifyApproved: number;
  structureVerifyPending: number;
  structureVerifyRejected: number;
  totalInstalled: number;
  pendingInstallation: number;
  verifyApproved: number;
  verifyPending: number;
  verifyRejected: number;
  docSubmitted: number;
  docPending: number;
}

interface DistrictBifurcationItem {
  district: string;
  totalSites: number;
  structureComplete: number;
  structurePending: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface StructureRecord {
  id: number | string;
  site_id?: number | string;
  site_name?: string;
  district?: string;
  block?: string;
  village?: string;
  ca_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  module_serial_no?: string;
  foundation_and_fastner?: string;
  structure_image?: string;
  structure_status?: number;
  structure_verify_status?: number;
  status_text?: string;
  structure_remark?: string;
  verify_remarks?: string;
  created_at?: string;
}

interface DrillSiteRecord {
  id: number | string;
  site_name?: string;
  beneficiary_name?: string;
  district?: string;
  block?: string;
  village?: string;
  ca_no?: string;
  sanction_load?: string;
  contact_no?: string;
  vendor_name?: string;
  structure_status?: string | number;
  inst_status?: string | number;
  verify_status?: string | number;
  doc_status?: string | number;
  claim_status?: string | number;
  payment_status?: string | number;
  structure_image?: string;
  complete_photo?: string;
}

export function BiharULAInstallationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<
    'vendor_wise' | 'district_wise' | 'structure_verification' | 'monthly_inst' | 'today_inst'
  >('vendor_wise');

  const donutH = useChartHeight(280, 240);
  const barH = useChartHeight(280, 240);

  // Exact 14 Live KPI Categories matching Bihar ULA Installation specification
  const [kpiStats, setKpiStats] = useState({
    totalSites: 0,
    sitesAssigned: 0,
    sitesPending: 0,
    sitesCancel: 0,
    structureInstalled: 0,
    structurePending: 0,
    structureApproved: 0,
    structureVerifyPending: 0,
    structureRejected: 0,
    installationInstalled: 0,
    installationPending: 0,
    verificationApproved: 0,
    verificationPending: 0,
    verificationRejected: 0,
    docSubmitted: 0,
    docPending: 0,
    docApproved: 0,
    docVerifyPending: 0,
    docRejected: 0,
    claim50Applicable: 0,
    claim50Raised: 0,
    claim50Approved: 0,
    claim50Pending: 0,
    claim50Rejected: 0,
    claim30Applicable: 0,
    claim30Raised: 0,
    claim30Approved: 0,
    claim30Pending: 0,
    claim30Rejected: 0,
    payment50Partially: 0,
    payment50Paid: 0,
    payment50Pending: 0,
    payment30Partially: 0,
    payment30Paid: 0,
    payment30Pending: 0,
  });

  // Table Data State
  const [vendorList, setVendorList] = useState<VendorBifurcationItem[]>([]);
  const [districtList, setDistrictList] = useState<DistrictBifurcationItem[]>([]);
  const [structureList, setStructureList] = useState<StructureRecord[]>([]);
  const [monthlyList, setMonthlyList] = useState<Array<{ month_year: string; monthly_installations: number }>>([]);
  const [todayList, setTodayList] = useState<Array<{ inst_vendor: number; name: string; today_install: number }>>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const defSearch = useDeferredValue(searchQuery);

  // Drill-down Modal State
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillSubtitle, setDrillSubtitle] = useState('');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRecords, setDrillRecords] = useState<DrillSiteRecord[]>([]);
  const [drillSearch, setDrillSearch] = useState('');
  const defDrillSearch = useDeferredValue(drillSearch);

  // Lightbox preview modal state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /* ─────────────────────────────────────────────────────────────────────────
     FETCH DASHBOARD DATA FROM API
     Endpoints:
     - GET /admin/bihar/ula/installation/dashboard
     - GET /admin/bihar/ula/installation/view-structure
     ───────────────────────────────────────────────────────────────────────── */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await biharAdminService.getUlaInstallationDashboard();
      const rawData = res?.data ?? res ?? {};

      // 1. Process KPI Summary Stats
      const ula = rawData?.ula || rawData?.summary || rawData;
      if (ula) {
        const n = (v: any) => (v !== undefined && v !== null && !isNaN(Number(v)) ? Number(v) : 0);

        const totalSites = n(ula.site_count ?? ula.total_sites ?? ula.totalSites ?? ula.totalsite);
        const structureInstalled = n(ula.structure_complete ?? ula.structure_installed ?? ula.structureInstalled);
        const structurePending = n(ula.structure_pending ?? ula.structurePending ?? Math.max(0, totalSites - structureInstalled));
        const structureApproved = n(ula.structure_verify_approved ?? ula.structure_approved ?? ula.structureApproved);
        const structureVerifyPending = n(ula.structure_verify_pending ?? ula.structureVerifyPending);
        const structureRejected = n(ula.structure_verify_reject ?? ula.structure_rejected ?? ula.structureRejected);

        const installationInstalled = n(ula.complete ?? ula.inst_complete ?? ula.installationInstalled ?? ula.installed);
        const installationPending = n(ula.pending ?? ula.inst_pending ?? ula.installationPending ?? Math.max(0, totalSites - installationInstalled));
        const verificationApproved = n(ula.verify_approved ?? ula.inst_verify_approved ?? ula.verificationApproved ?? ula.approved);
        const verificationPending = n(ula.verify_pending ?? ula.inst_verify_pending ?? ula.verificationPending);
        const verificationRejected = n(ula.verify_reject ?? ula.inst_verify_reject ?? ula.verificationRejected ?? ula.rejected);

        const docSubmitted = n(ula.inst_doc_complete ?? ula.doc_submitted ?? ula.docSubmitted ?? ula.doc_complete);
        const docPending = n(ula.inst_doc_pending ?? ula.doc_pending ?? ula.docPending);
        const docApproved = n(ula.doc_verify_approve ?? ula.doc_approved ?? ula.docApproved);
        const docVerifyPending = n(ula.doc_verify_pending ?? ula.docVerifyPending);
        const docRejected = n(ula.doc_verify_reject ?? ula.doc_rejected ?? ula.docRejected);

        const claim50Applicable = n(ula.claim50_applicable ?? ula.claim50Applicable ?? ula.claim_50_applicable);
        const claim50Raised = n(ula.claim50_raised ?? ula.claim50Raised ?? ula.claim_50_raised);
        const claim50Approved = n(ula.inst_claim50_verify_papprove ?? ula.claim50_approved ?? ula.claim50Approved);
        const claim50Pending = n(ula.inst_claim50_verify_pending ?? ula.claim50_pending ?? ula.claim50Pending);
        const claim50Rejected = n(ula.inst_claim50_verify_reject ?? ula.claim50_rejected ?? ula.claim50Rejected);

        const claim30Applicable = n(ula.claim30_applicable ?? ula.claim30Applicable ?? ula.claim_30_applicable);
        const claim30Raised = n(ula.claim30_raised ?? ula.claim30Raised ?? ula.claim_30_raised);
        const claim30Approved = n(ula.inst_claim30_verify_papprove ?? ula.claim30_approved ?? ula.claim30Approved);
        const claim30Pending = n(ula.inst_claim30_verify_pending ?? ula.claim30_pending ?? ula.claim30Pending);
        const claim30Rejected = n(ula.inst_claim30_verify_reject ?? ula.claim30_rejected ?? ula.claim30Rejected);

        const payment50Partially = n(ula.inst_pay50_partially ?? ula.payment50Partially ?? ula.pay50_partial);
        const payment50Paid = n(ula.inst_pay50_paid ?? ula.payment50Paid ?? ula.pay50_paid);
        const payment50Pending = n(ula.inst_pay50_pending ?? ula.payment50Pending ?? ula.pay50_pending);

        const payment30Partially = n(ula.inst_pay30_partially ?? ula.payment30Partially ?? ula.pay30_partial);
        const payment30Paid = n(ula.inst_pay30_paid ?? ula.payment30Paid ?? ula.pay30_paid);
        const payment30Pending = n(ula.inst_pay30_pending ?? ula.payment30Pending ?? ula.pay30_pending);

        setKpiStats({
          totalSites,
          sitesAssigned: n(ula.sites_assigned ?? ula.sitesAssigned ?? totalSites),
          sitesPending: n(ula.sites_pending ?? ula.sitesPending ?? 0),
          sitesCancel: n(ula.sites_cancel ?? ula.sitesCancel ?? 0),
          structureInstalled,
          structurePending,
          structureApproved,
          structureVerifyPending,
          structureRejected,
          installationInstalled,
          installationPending,
          verificationApproved,
          verificationPending,
          verificationRejected,
          docSubmitted,
          docPending,
          docApproved,
          docVerifyPending,
          docRejected,
          claim50Applicable,
          claim50Raised,
          claim50Approved,
          claim50Pending,
          claim50Rejected,
          claim30Applicable,
          claim30Raised,
          claim30Approved,
          claim30Pending,
          claim30Rejected,
          payment50Partially,
          payment50Paid,
          payment50Pending,
          payment30Partially,
          payment30Paid,
          payment30Pending,
        });
      }

      // 2. Process District Bifurcation Data
      const rawDistricts =
        Array.isArray(rawData?.districtwise)
          ? rawData.districtwise
          : Array.isArray(rawData?.districts)
          ? rawData.districts
          : Array.isArray(rawData?.district_wise)
          ? rawData.district_wise
          : [];

      if (rawDistricts.length > 0) {
        setDistrictList(
          rawDistricts.map((d: any) => ({
            district: d.district || d.name || 'Unknown',
            totalSites: Number(d.site_count ?? d.total_sites ?? d.totalSites ?? 0),
            structureComplete: Number(d.structure_complete ?? d.structure_installed ?? 0),
            structurePending: Number(d.structure_pending ?? 0),
            completed: Number(d.inst_complete ?? d.complete ?? d.completed ?? 0),
            pending: Number(d.inst_pending ?? d.pending ?? 0),
            approved: Number(d.verify_approved ?? d.doc_verify_approved ?? d.approved ?? 0),
            rejected: Number(d.verify_reject ?? d.doc_verify_reject ?? d.rejected ?? 0),
          }))
        );
      } else {
        setDistrictList([]);
      }

      // 3. Process Vendor Bifurcation Data
      const rawVendors =
        Array.isArray(rawData?.vendorwise)
          ? rawData.vendorwise
          : Array.isArray(rawData?.vendors)
          ? rawData.vendors
          : Array.isArray(rawData?.vendor_wise)
          ? rawData.vendor_wise
          : Array.isArray(rawData?.vendor_bifurcation)
          ? rawData.vendor_bifurcation
          : [];

      if (rawVendors.length > 0) {
        setVendorList(
          rawVendors.map((v: any, idx: number) => ({
            id: v.id || v.vendor_id || idx + 1,
            vendor: v.vendor || v.name || v.vendor_name || `Vendor #${v.vendor_id || idx + 1}`,
            vendorId: v.vendor_id || v.id,
            totalAllocation: Number(v.totalAllocation ?? v.site_count ?? v.total_sites ?? 0),
            totalStructure: Number(v.totalStructure ?? v.structure_complete ?? 0),
            pendingStructure: Number(v.pendingStructure ?? v.structure_pending ?? 0),
            structureVerifyApproved: Number(v.structureVerifyApproved ?? v.structure_verify_approved ?? 0),
            structureVerifyPending: Number(v.structureVerifyPending ?? v.structure_verify_pending ?? 0),
            structureVerifyRejected: Number(v.structureVerifyRejected ?? v.structure_verify_reject ?? 0),
            totalInstalled: Number(v.totalInstalled ?? v.inst_complete ?? v.complete ?? 0),
            pendingInstallation: Number(v.pendingInstallation ?? v.inst_pending ?? v.pending ?? 0),
            verifyApproved: Number(v.verifyApproved ?? v.verify_approved ?? 0),
            verifyPending: Number(v.verifyPending ?? v.verify_pending ?? 0),
            verifyRejected: Number(v.verifyRejected ?? v.verify_reject ?? 0),
            docSubmitted: Number(v.docSubmitted ?? v.inst_doc_complete ?? 0),
            docPending: Number(v.docPending ?? v.inst_doc_pending ?? 0),
          }))
        );
      } else {
        setVendorList([]);
      }

      // 4. Process Monthly & Today Installation
      if (Array.isArray(rawData?.vendor_installation_month)) {
        setMonthlyList(rawData.vendor_installation_month);
      }
      if (Array.isArray(rawData?.vendor_today_installation)) {
        setTodayList(rawData.vendor_today_installation);
      }

      // 5. Fetch Structure Verification Data
      try {
        const structRes = await biharAdminService.getViewUlaStructure();
        const sData = structRes?.data ?? structRes;
        const sList = Array.isArray(sData) ? sData : Array.isArray(sData?.structures) ? sData.structures : [];
        if (sList.length > 0) {
          setStructureList(
            sList.map((s: any, idx: number) => {
              const code = Number(s.structure_verify_status ?? s.verify_status ?? 0);
              const statusText = code === 1 ? 'Approved' : code === 2 ? 'Rejected' : 'Pending';
              return {
                id: s.id || idx + 1,
                site_id: s.site_id,
                site_name: s.site_name || s.name || 'ULA Solar Pump Site',
                district: s.district || 'Patna',
                block: s.block || '—',
                village: s.village || '—',
                ca_no: s.ca_no || '—',
                beneficiary_name: s.beneficiary_name || '—',
                contact_no: s.contact_no || '—',
                module_serial_no: s.module_serial_no || '—',
                foundation_and_fastner: s.foundation_and_fastner || '—',
                structure_image: s.structure_image || '',
                structure_status: Number(s.structure_status ?? 0),
                structure_verify_status: code,
                status_text: statusText,
                structure_remark: s.structure_remark || '',
                verify_remarks: s.verify_remarks || '',
                created_at: s.created_at || '—',
              };
            })
          );
        }
      } catch (sErr) {
        console.warn('[ULA Dashboard] Structure fetch warning:', sErr);
      }

      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('[Bihar ULA Dashboard] Error fetching dashboard data:', err);
      setError(err?.message || 'Unable to connect to Bihar ULA Installation server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ─────────────────────────────────────────────────────────────────────────
     DRILL-DOWN MODAL ACTIONS
     Endpoints:
     - GET /admin/bihar/ula/installation/view-dashboard/{status}
     - GET /admin/bihar/ula/installation/view-dashboard/vendorwise/{status}/{vendor}
     - GET /admin/bihar/ula/installation/view-dashboard/districtwise/{status}/{district}
     ───────────────────────────────────────────────────────────────────────── */
  const handleOpenStatusDrilldown = async (statusCode: string, label: string) => {
    setDrillTitle(`Drill-down: ${label}`);
    setDrillSubtitle(`Live site list for status code "${statusCode}" fetched directly from Bihar ULA Controller`);
    setDrillLoading(true);
    setDrillRecords([]);
    setDrillSearch('');
    setDrillModalOpen(true);

    try {
      const res = await biharAdminService.getViewUlaDashboard(statusCode);
      const raw = res?.data?.ula ?? res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setDrillRecords(
        list.map((it: any, idx: number) => ({
          id: it.id || idx + 1,
          site_name: it.site_name || it.name || `ULA Site #${it.id || idx + 1}`,
          beneficiary_name: it.beneficiary_name || it.consumer_name || '—',
          district: it.district || '—',
          block: it.block || '—',
          village: it.village || '—',
          ca_no: it.ca_no || '—',
          sanction_load: it.sanction_load ? `${it.sanction_load} HP` : '—',
          contact_no: it.contact_no || '—',
          vendor_name: it.vendor_name || it.firm_name || (it.vendor ? `Vendor #${it.vendor}` : '—'),
          structure_status: it.structure_status ?? '—',
          inst_status: it.inst_status ?? it.installation_status ?? '—',
          verify_status: it.verify_status ?? it.structure_verify_status ?? '—',
          doc_status: it.inst_doc_status ?? it.doc_status ?? '—',
          claim_status: it.claim_status ?? '—',
          payment_status: it.payment_status ?? '—',
          structure_image: it.structure_image || '',
          complete_photo: it.complete_photo || it.installation_image || '',
        }))
      );
    } catch (err: any) {
      console.error('[ULA Dashboard] Drill-down fetch error:', err);
    } finally {
      setDrillLoading(false);
    }
  };

  const handleOpenVendorDrilldown = async (vendorId: string | number, vendorName: string, status = 'all') => {
    setDrillTitle(`Vendor Drill-down: ${vendorName}`);
    setDrillSubtitle(`Site allocations and execution records for vendor "${vendorName}"`);
    setDrillLoading(true);
    setDrillRecords([]);
    setDrillSearch('');
    setDrillModalOpen(true);

    try {
      const res = await biharAdminService.getViewUlaDashboardVendorwise(status, String(vendorId || vendorName));
      const raw = res?.data?.ula ?? res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setDrillRecords(
        list.map((it: any, idx: number) => ({
          id: it.id || idx + 1,
          site_name: it.site_name || `ULA Site #${it.id || idx + 1}`,
          beneficiary_name: it.beneficiary_name || '—',
          district: it.district || '—',
          block: it.block || '—',
          village: it.village || '—',
          ca_no: it.ca_no || '—',
          sanction_load: it.sanction_load ? `${it.sanction_load} HP` : '—',
          contact_no: it.contact_no || '—',
          vendor_name: vendorName,
          structure_status: it.structure_status ?? '—',
          inst_status: it.inst_status ?? '—',
          verify_status: it.verify_status ?? '—',
          doc_status: it.inst_doc_status ?? '—',
          claim_status: it.claim_status ?? '—',
          payment_status: it.payment_status ?? '—',
          structure_image: it.structure_image || '',
          complete_photo: it.complete_photo || '',
        }))
      );
    } catch (err: any) {
      console.error('[ULA Dashboard] Vendor drill-down fetch error:', err);
    } finally {
      setDrillLoading(false);
    }
  };

  const handleOpenDistrictDrilldown = async (district: string, status = 'all') => {
    setDrillTitle(`District Drill-down: ${district}`);
    setDrillSubtitle(`Solar pump sites and civil foundation status across district "${district}"`);
    setDrillLoading(true);
    setDrillRecords([]);
    setDrillSearch('');
    setDrillModalOpen(true);

    try {
      const res = await biharAdminService.getViewUlaDashboardDistrictwise(status, district);
      const raw = res?.data?.ula ?? res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setDrillRecords(
        list.map((it: any, idx: number) => ({
          id: it.id || idx + 1,
          site_name: it.site_name || `ULA Site #${it.id || idx + 1}`,
          beneficiary_name: it.beneficiary_name || '—',
          district,
          block: it.block || '—',
          village: it.village || '—',
          ca_no: it.ca_no || '—',
          sanction_load: it.sanction_load ? `${it.sanction_load} HP` : '—',
          contact_no: it.contact_no || '—',
          vendor_name: it.vendor_name || '—',
          structure_status: it.structure_status ?? '—',
          inst_status: it.inst_status ?? '—',
          verify_status: it.verify_status ?? '—',
          doc_status: it.inst_doc_status ?? '—',
          claim_status: it.claim_status ?? '—',
          payment_status: it.payment_status ?? '—',
          structure_image: it.structure_image || '',
          complete_photo: it.complete_photo || '',
        }))
      );
    } catch (err: any) {
      console.error('[ULA Dashboard] District drill-down fetch error:', err);
    } finally {
      setDrillLoading(false);
    }
  };

  /* ───────── Filtered Lists & Paginations ───────── */
  const filteredVendors = useMemo(() => {
    if (!defSearch.trim()) return vendorList;
    const q = defSearch.toLowerCase();
    return vendorList.filter((v) => v.vendor.toLowerCase().includes(q));
  }, [vendorList, defSearch]);

  const filteredDistricts = useMemo(() => {
    if (!defSearch.trim()) return districtList;
    const q = defSearch.toLowerCase();
    return districtList.filter((d) => d.district.toLowerCase().includes(q));
  }, [districtList, defSearch]);

  const filteredStructures = useMemo(() => {
    if (!defSearch.trim()) return structureList;
    const q = defSearch.toLowerCase();
    return structureList.filter(
      (s) =>
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        (s.beneficiary_name || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        (s.module_serial_no || '').toLowerCase().includes(q)
    );
  }, [structureList, defSearch]);

  const filteredDrillRecords = useMemo(() => {
    if (!defDrillSearch.trim()) return drillRecords;
    const q = defDrillSearch.toLowerCase();
    return drillRecords.filter(
      (r) =>
        (r.site_name || '').toLowerCase().includes(q) ||
        (r.beneficiary_name || '').toLowerCase().includes(q) ||
        (r.ca_no || '').toLowerCase().includes(q) ||
        (r.district || '').toLowerCase().includes(q) ||
        (r.block || '').toLowerCase().includes(q) ||
        (r.vendor_name || '').toLowerCase().includes(q)
    );
  }, [drillRecords, defDrillSearch]);

  const vendorPagination = usePagination(filteredVendors, { initialPageSize: 10 });
  const districtPagination = usePagination(filteredDistricts, { initialPageSize: 10 });
  const structurePagination = usePagination(filteredStructures, { initialPageSize: 10 });
  const drillPagination = usePagination(filteredDrillRecords, { initialPageSize: 10 });

  /* ───────── Export Columns ───────── */
  const vendorExportCols: ExportColumn<VendorBifurcationItem>[] = [
    { header: 'Vendor', key: 'vendor' },
    { header: 'Total Allocation', key: 'totalAllocation' },
    { header: 'Total Structure', key: 'totalStructure' },
    { header: 'Pending Structure', key: 'pendingStructure' },
    { header: 'Structure Verify Approved', key: 'structureVerifyApproved' },
    { header: 'Structure Verify Pending', key: 'structureVerifyPending' },
    { header: 'Structure Verify Rejected', key: 'structureVerifyRejected' },
    { header: 'Total Installed', key: 'totalInstalled' },
    { header: 'Pending Installation', key: 'pendingInstallation' },
    { header: 'Verify Approved', key: 'verifyApproved' },
    { header: 'Verify Pending', key: 'verifyPending' },
    { header: 'Verify Rejected', key: 'verifyRejected' },
    { header: 'Doc Submitted', key: 'docSubmitted' },
    { header: 'Doc Pending', key: 'docPending' },
  ];

  const districtExportCols: ExportColumn<DistrictBifurcationItem>[] = [
    { header: 'District', key: 'district' },
    { header: 'Total Sites', key: 'totalSites' },
    { header: 'Structure Done', key: 'structureComplete' },
    { header: 'Structure Pending', key: 'structurePending' },
    { header: 'Completed', key: 'completed' },
    { header: 'Pending', key: 'pending' },
    { header: 'Approved', key: 'approved' },
    { header: 'Rejected', key: 'rejected' },
  ];

  const drillExportCols: ExportColumn<DrillSiteRecord>[] = [
    { header: 'Site ID', key: 'id' },
    { header: 'Site / Beneficiary', key: 'beneficiary_name' },
    { header: 'CA No', key: 'ca_no' },
    { header: 'District', key: 'district' },
    { header: 'Block', key: 'block' },
    { header: 'Sanction Load', key: 'sanction_load' },
    { header: 'Vendor', key: 'vendor_name' },
    { header: 'Structure Status', key: 'structure_status' },
    { header: 'Install Status', key: 'inst_status' },
    { header: 'Verify Status', key: 'verify_status' },
  ];

  /* ───────── Chart Options ───────── */
  const donutSeries = [kpiStats.installationInstalled, kpiStats.installationPending];
  const donutOptions: any = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: ['Installed', 'Pending'],
    colors: [LIGHT_GREEN, LIGHT_AMBER],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Sites',
              formatter: () => num(kpiStats.totalSites),
            },
          },
        },
      },
    },
    dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
  };

  const barCategories = districtList.slice(0, 10).map((d) => d.district);
  const barSeries = [
    { name: 'Completed', data: districtList.slice(0, 10).map((d) => d.completed) },
    { name: 'Pending', data: districtList.slice(0, 10).map((d) => d.pending) },
  ];
  const barOptions: any = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false } },
    colors: [LIGHT_GREEN, LIGHT_AMBER],
    plotOptions: { bar: { horizontal: false, columnWidth: '40%', borderRadius: 4 } },
    xaxis: { categories: barCategories.length > 0 ? barCategories : ['No Data'] },
    legend: { position: 'top' },
    dataLabels: { enabled: false },
  };

  return (
    <div className="solar-erp-page app-container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── PAGE HEAD (EXACT KARNATAKA SWP STANDARD) ── */}
      <PageHead
        title="Bihar ULA Installation Dashboard"
        subtitle="Urban Local Areas (ULA) Solar Pump Installation, Structure Verification & District Execution Analysis"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Updated: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh API Data"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                refresh
              </span>
              Refresh API
            </button>
            <Link
              to="/vendor-management/bihar/ula/installation/create-assign-site"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                assignment_add
              </span>
              Assign ULA Sites
            </Link>
          </div>
        }
      />

      {error && (
        <div
          className="ax-banner ax-banner--warning"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fef3c7',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">warning</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="ax-btn ax-btn--sm ax-btn--secondary"
            onClick={fetchDashboardData}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── TOP KPI CARDS GRID (14 INTERACTIVE CARDS WITH DRILL-DOWN) ── */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Total Sites */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid ${LIGHT_BLUE}`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('all', 'Total Sites')}
            title="Click to view all ULA sites"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Sites
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '6px', color: '#1e293b' }}>
              {num(kpiStats.totalSites)}
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px', fontWeight: 500 }}>
              All ULA locations &rarr;
            </div>
          </div>

          {/* Card 2: Sites Assign Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #3b82f6`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('assigned', 'Assigned ULA Sites')}
            title="Click to view assigned sites drill-down"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Sites Assign Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.sitesAssigned)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.sitesPending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.sitesCancel)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Assigned / Pending / Cancel
            </div>
          </div>

          {/* Card 3: Structure Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #06b6d4`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('structure_complete', 'Structure Completed Sites')}
            title="Click to view structure status drill-down"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Structure Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.structureInstalled)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.structurePending)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Installed / Pending
            </div>
          </div>

          {/* Card 4: Structure Verification Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #14b8a6`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('structure_verify', 'Structure Verification')}
            title="Click to view verified structures drill-down"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Structure Verification Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.structureApproved)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.structureVerifyPending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.structureRejected)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Approved / Pending / Rejected
            </div>
          </div>

          {/* Card 5: Installation Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid ${LIGHT_GREEN}`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('complete', 'Completed Pump Installations')}
            title="Click to view completed installations"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Installation Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.installationInstalled)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.installationPending)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Installed / Pending
            </div>
          </div>

          {/* Card 6: Verification Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #8b5cf6`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('verify_approved', 'Approved Installations')}
            title="Click to view verification drill-down"
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Verification Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.verificationApproved)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.verificationPending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.verificationRejected)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Approved / Pending / Rejected
            </div>
          </div>

          {/* Card 7: Documents Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #f97316`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('doc_submitted', 'Document Submission Status')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Documents Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.docSubmitted)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.docPending)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Submitted / Pending
            </div>
          </div>

          {/* Card 8: Document Approval */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #ec4899`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('doc_approved', 'Document Approvals')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Document Approval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.docApproved)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.docVerifyPending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.docRejected)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Approved / Pending / Rejected
            </div>
          </div>

          {/* Card 9: Claim 50% Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #eab308`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('claim50', 'Claim 50% Status')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Claim 50% Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_BLUE }}>{num(kpiStats.claim50Applicable)}</span> /{' '}
              <span style={{ color: '#d97706' }}>{num(kpiStats.claim50Raised)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Applicable / Raised
            </div>
          </div>

          {/* Card 10: Claim 50% Approval */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #10b981`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('claim50_approved', 'Claim 50% Approval')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Claim 50% Approval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.claim50Approved)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.claim50Pending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.claim50Rejected)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Approved / Pending / Rejected
            </div>
          </div>

          {/* Card 11: Claim 30% Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #6366f1`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('claim30', 'Claim 30% Status')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Claim 30% Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_BLUE }}>{num(kpiStats.claim30Applicable)}</span> /{' '}
              <span style={{ color: '#d97706' }}>{num(kpiStats.claim30Raised)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Applicable / Raised
            </div>
          </div>

          {/* Card 12: Claim 30% Approval */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #a855f7`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('claim30_approved', 'Claim 30% Approval')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Claim 30% Approval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.claim30Approved)}</span> /{' '}
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.claim30Pending)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.claim30Rejected)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Approved / Pending / Rejected
            </div>
          </div>

          {/* Card 13: Payment 50% Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #0284c7`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('pay50', 'Payment 50% Status')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Payment 50% Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.payment50Partially)}</span> /{' '}
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.payment50Paid)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.payment50Pending)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Partially Paid / Paid / Pending
            </div>
          </div>

          {/* Card 14: Payment 30% Status */}
          <div
            className="ax-card asw-kpi-clickable"
            style={{ padding: '16px', borderLeft: `4px solid #059669`, borderRadius: '8px' }}
            onClick={() => handleOpenStatusDrilldown('pay30', 'Payment 30% Status')}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Payment 30% Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#1e293b' }}>
              <span style={{ color: LIGHT_AMBER }}>{num(kpiStats.payment30Partially)}</span> /{' '}
              <span style={{ color: LIGHT_GREEN }}>{num(kpiStats.payment30Paid)}</span> /{' '}
              <span style={{ color: LIGHT_RED }}>{num(kpiStats.payment30Pending)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Partially Paid / Paid / Pending
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK NAVIGATION ACTIONS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <Link
          to="/vendor-management/bihar/ula/installation/create-assign-site"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">assignment_add</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Assign Sites</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Allot ULA pump quotas</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/view-assign-site"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">table_view</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>View Assign Sites</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Check allocations by block</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/structure-approval-site"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">foundation</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Structure Approval</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Civil foundation & MMS audit</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/view-site"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">precision_manufacturing</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Install Site</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Pump discharge & handover</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/view-document"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">description</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>View Document</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Aadhaar & JCR scrutinies</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/view-claim"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">request_quote</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>View Claim</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Scrutinize vendor claims</div>
          </div>
        </Link>

        <Link
          to="/vendor-management/bihar/ula/installation/payment-view"
          className="ax-card asw-action-card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>View Payment</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Disbursements & UTR logs</div>
          </div>
        </Link>
      </div>

      {/* ── VISUALIZATIONS SECTION (APEXCHARTS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="ax-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
            Pump Commissioning Status
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Live completed vs pending solar pump sites
          </div>
          <Suspense fallback={<div style={{ height: donutH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>}>
            <ApexChart options={donutOptions} series={donutSeries} type="donut" height={donutH} />
          </Suspense>
        </div>

        <div className="ax-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
            District-Wise Pump Delivery
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Allocation and completion per district (Top 10 Districts)
          </div>
          <Suspense fallback={<div style={{ height: barH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>}>
            <ApexChart options={barOptions} series={barSeries} type="bar" height={barH} />
          </Suspense>
        </div>
      </div>

      {/* ── BIFURCATION TABS ── */}
      <div className="asw-bifurcation-row">
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'vendor_wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendor_wise')}
        >
          Vendor Wise Bifurcation
          {vendorList.length > 0 && <span style={{ opacity: 0.85 }}>({vendorList.length})</span>}
        </button>

        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'district_wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('district_wise')}
        >
          District Wise Bifurcation
          {districtList.length > 0 && <span style={{ opacity: 0.85 }}>({districtList.length})</span>}
        </button>

        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'structure_verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure_verification')}
        >
          Structure Verification
          {structureList.length > 0 && <span style={{ opacity: 0.85 }}>({structureList.length})</span>}
        </button>

        {monthlyList.length > 0 && (
          <button
            type="button"
            className={`asw-pill-btn ${activeTab === 'monthly_inst' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly_inst')}
          >
            Monthly Installation ({monthlyList.length})
          </button>
        )}

        {todayList.length > 0 && (
          <button
            type="button"
            className={`asw-pill-btn ${activeTab === 'today_inst' ? 'active' : ''}`}
            onClick={() => setActiveTab('today_inst')}
          >
            Today Installation ({todayList.length})
          </button>
        )}
      </div>

      {/* ── MAIN BIFURCATION TABLE CARD ── */}
      <div className="ax-card" style={{ marginBottom: '24px', overflow: 'hidden', borderRadius: '12px' }}>
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="ax-card__titles">
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>
              {activeTab === 'vendor_wise' && 'Vendor Wise Bifurcation'}
              {activeTab === 'district_wise' && 'District Wise Bifurcation'}
              {activeTab === 'structure_verification' && 'Structure Foundation & MMS Inspection'}
              {activeTab === 'monthly_inst' && 'Monthly Installation Throughput'}
              {activeTab === 'today_inst' && 'Vendor Today Installation'}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Real-time synchronization with Bihar ULA Installation controller
            </div>
          </div>

          <div className="ax-card__actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search partner, district, site..."
            />
            {activeTab === 'vendor_wise' && (
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV('Bihar_ULA_Vendor_Bifurcation', filteredVendors, vendorExportCols)}
                onExportExcel={() => exportDataToExcel('Bihar_ULA_Vendor_Bifurcation', filteredVendors, vendorExportCols)}
              />
            )}
            {activeTab === 'district_wise' && (
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV('Bihar_ULA_District_Bifurcation', filteredDistricts, districtExportCols)}
                onExportExcel={() => exportDataToExcel('Bihar_ULA_District_Bifurcation', filteredDistricts, districtExportCols)}
              />
            )}
          </div>
        </div>

        {/* ── TAB 1: VENDOR WISE BIFURCATION TABLE ── */}
        {activeTab === 'vendor_wise' && (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1300px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Sr. No.</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Vendor</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Total Allocation</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Total Structure</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Pending Structure</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Structure Approved</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Structure Pending</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Structure Rejected</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Total Installed</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Pending Install</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Verify Approved</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Verify Pending</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Verify Rejected</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Doc Submitted</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Doc Pending</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorPagination.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={16}>
                      <TableEmptyState
                        title="No Vendors Found"
                        description={
                          loading
                            ? 'Fetching vendor allocations from server...'
                            : 'No vendors match your search criteria or no allocations have been made yet.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  vendorPagination.pagedItems.map((v, idx) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        {(vendorPagination.currentPage - 1) * vendorPagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {v.vendor}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                        {num(v.totalAllocation)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_GREEN, fontWeight: 600 }}>
                        {num(v.totalStructure)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_AMBER, fontWeight: 600 }}>
                        {num(v.pendingStructure)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_GREEN, fontWeight: 600 }}>
                        {num(v.structureVerifyApproved)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_AMBER }}>
                        {num(v.structureVerifyPending)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_RED }}>
                        {num(v.structureVerifyRejected)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_GREEN, fontWeight: 700 }}>
                        {num(v.totalInstalled)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_AMBER }}>
                        {num(v.pendingInstallation)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_GREEN, fontWeight: 600 }}>
                        {num(v.verifyApproved)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_AMBER }}>
                        {num(v.verifyPending)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_RED }}>
                        {num(v.verifyRejected)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_GREEN }}>
                        {num(v.docSubmitted)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: LIGHT_AMBER }}>
                        {num(v.docPending)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                          onClick={() => handleOpenVendorDrilldown(v.vendorId || v.id, v.vendor)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            visibility
                          </span>
                          View Sites
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 2: DISTRICT WISE BIFURCATION TABLE ── */}
        {activeTab === 'district_wise' && (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Sr. No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>District</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Total Beneficiaries</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Structure Done</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Structure Pending</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Completed (Installed)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Pending Installation</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Approved</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Rejected</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {districtPagination.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <TableEmptyState
                        title="No Districts Found"
                        description={
                          loading
                            ? 'Loading district data from server...'
                            : 'No district records match your search criteria.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  districtPagination.pagedItems.map((d, idx) => (
                    <tr key={d.district} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                        {(districtPagination.currentPage - 1) * districtPagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                        {d.district}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                        {num(d.totalSites)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_GREEN, fontWeight: 600 }}>
                        {num(d.structureComplete)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_AMBER, fontWeight: 600 }}>
                        {num(d.structurePending)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_GREEN, fontWeight: 700 }}>
                        {num(d.completed)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_AMBER, fontWeight: 600 }}>
                        {num(d.pending)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_VIOLET, fontWeight: 600 }}>
                        {num(d.approved)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: LIGHT_RED, fontWeight: 600 }}>
                        {num(d.rejected)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                          onClick={() => handleOpenDistrictDrilldown(d.district)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            visibility
                          </span>
                          View Sites
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 3: STRUCTURE FOUNDATION & MMS VERIFICATION (LIVE VIEW-STRUCTURE API) ── */}
        {activeTab === 'structure_verification' && (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Sr. No.</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Site / Beneficiary</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>District / Block</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>CA No</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Module Serial No</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Foundation & MMS Fasteners</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Structure Photo</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Verification Remarks</th>
                </tr>
              </thead>
              <tbody>
                {structurePagination.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <TableEmptyState
                        title="No Structures Found"
                        description="No structure inspection records available on the server."
                      />
                    </td>
                  </tr>
                ) : (
                  structurePagination.pagedItems.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        {(structurePagination.currentPage - 1) * structurePagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {s.beneficiary_name !== '—' ? s.beneficiary_name : s.site_name}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        {s.district} {s.block !== '—' && <span style={{ color: '#64748b' }}>({s.block})</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'monospace' }}>
                        {s.ca_no}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#2563eb' }}>
                        {s.module_serial_no}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
                        {s.foundation_and_fastner}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <SmartThumbnail
                          src={s.structure_image}
                          title={s.site_name || 'Structure Photo'}
                          onClick={(url) => setLightboxUrl(url)}
                        />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--${
                            s.structure_verify_status === 1 ? 'success' : s.structure_verify_status === 2 ? 'danger' : 'warning'
                          }`}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}
                        >
                          {s.status_text}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>
                        {s.verify_remarks || s.structure_remark || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 4: MONTHLY INSTALLATION ── */}
        {activeTab === 'monthly_inst' && (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Sr. No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Month - Year</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Monthly Installations</th>
                </tr>
              </thead>
              <tbody>
                {monthlyList.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <TableEmptyState title="No Monthly Data" description="No monthly installations recorded yet." />
                    </td>
                  </tr>
                ) : (
                  monthlyList.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{m.month_year}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: LIGHT_GREEN, fontWeight: 700 }}>
                        {num(m.monthly_installations)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 5: TODAY INSTALLATION ── */}
        {activeTab === 'today_inst' && (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Sr. No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Vendor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Today Installations</th>
                </tr>
              </thead>
              <tbody>
                {todayList.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <TableEmptyState title="No Installations Today" description="No installations recorded for today yet." />
                    </td>
                  </tr>
                ) : (
                  todayList.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.name || `Vendor #${t.inst_vendor}`}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: LIGHT_GREEN, fontWeight: 700 }}>
                        {num(t.today_install)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION FOOTER ── */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-start' }}>
          {activeTab === 'vendor_wise' && (
            <Pagination
              currentPage={vendorPagination.currentPage}
              totalPages={vendorPagination.totalPages}
              totalItems={vendorPagination.totalItems}
              pageSize={vendorPagination.pageSize}
              onPageChange={vendorPagination.setCurrentPage}
              onPageSizeChange={vendorPagination.setPageSize}
            />
          )}
          {activeTab === 'district_wise' && (
            <Pagination
              currentPage={districtPagination.currentPage}
              totalPages={districtPagination.totalPages}
              totalItems={districtPagination.totalItems}
              pageSize={districtPagination.pageSize}
              onPageChange={districtPagination.setCurrentPage}
              onPageSizeChange={districtPagination.setPageSize}
            />
          )}
          {activeTab === 'structure_verification' && (
            <Pagination
              currentPage={structurePagination.currentPage}
              totalPages={structurePagination.totalPages}
              totalItems={structurePagination.totalItems}
              pageSize={structurePagination.pageSize}
              onPageChange={structurePagination.setCurrentPage}
              onPageSizeChange={structurePagination.setPageSize}
            />
          )}
        </div>
      </div>

      {/* ── DRILL-DOWN MODAL DIALOG (LIVE VIEW-DASHBOARD DRILLDOWN) ── */}
      <Modal
        open={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        title={drillTitle}
        subtitle={drillSubtitle}
        maxWidth={1100}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing {drillPagination.pagedItems.length} of {drillPagination.totalItems} records
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setDrillModalOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <SearchInput
            value={drillSearch}
            onChange={setDrillSearch}
            placeholder="Search beneficiary, CA No., block..."
          />
          <TableExportToolbar
            onExportCSV={() => exportDataToCSV('Bihar_ULA_Drilldown_Sites', filteredDrillRecords, drillExportCols)}
            onExportExcel={() => exportDataToExcel('Bihar_ULA_Drilldown_Sites', filteredDrillRecords, drillExportCols)}
          />
        </div>

        {drillLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div className="ax-spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading live site records from server...</span>
          </div>
        ) : (
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Sr. No.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Beneficiary / Site</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>CA No</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>District / Block</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Vendor</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Structure</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Installation</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Verification</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Photos</th>
                </tr>
              </thead>
              <tbody>
                {drillPagination.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <TableEmptyState
                        title="No Sites Found"
                        description="No site records found for this status on the server."
                      />
                    </td>
                  </tr>
                ) : (
                  drillPagination.pagedItems.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                        {(drillPagination.currentPage - 1) * drillPagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {r.beneficiary_name !== '—' ? r.beneficiary_name : r.site_name}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace' }}>
                        {r.ca_no}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                        {r.district} {r.block !== '—' && <span style={{ color: '#64748b' }}>({r.block})</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                        {r.vendor_name}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px' }}>
                        <span
                          className={`ax-badge ax-badge--${
                            Number(r.structure_status) === 1 ? 'success' : 'warning'
                          }`}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                        >
                          {Number(r.structure_status) === 1 ? 'Installed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px' }}>
                        <span
                          className={`ax-badge ax-badge--${
                            Number(r.inst_status) === 1 ? 'success' : 'warning'
                          }`}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                        >
                          {Number(r.inst_status) === 1 ? 'Installed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px' }}>
                        <span
                          className={`ax-badge ax-badge--${
                            Number(r.verify_status) === 1 ? 'success' : Number(r.verify_status) === 2 ? 'danger' : 'warning'
                          }`}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                        >
                          {Number(r.verify_status) === 1 ? 'Approved' : Number(r.verify_status) === 2 ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {r.structure_image && (
                            <SmartThumbnail
                              src={r.structure_image}
                              title="Structure Photo"
                              onClick={(url) => setLightboxUrl(url)}
                            />
                          )}
                          {r.complete_photo && (
                            <SmartThumbnail
                              src={r.complete_photo}
                              title="Installation Photo"
                              onClick={(url) => setLightboxUrl(url)}
                            />
                          )}
                          {!r.structure_image && !r.complete_photo && <span style={{ color: '#94a3b8' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <Pagination
            currentPage={drillPagination.currentPage}
            totalPages={drillPagination.totalPages}
            totalItems={drillPagination.totalItems}
            pageSize={drillPagination.pageSize}
            onPageChange={drillPagination.setCurrentPage}
            onPageSizeChange={drillPagination.setPageSize}
          />
        </div>
      </Modal>

      {/* ── LIGHTBOX PHOTO PREVIEW MODAL ── */}
      {lightboxUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxUrl}
              alt="Photo preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiharULAInstallationDashboard;