import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

export interface BiharSRTInstallationItem {
  id: number;
  company_id?: string;
  unique_id?: string | number | null;
  discom?: string;
  state?: string;
  volume?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string | null;
  phase?: string;
  vendor?: string;
  inst_vendor?: string;
  vendor_name?: string;
  contact_person?: string;
  contact_number?: string;
  installation_status?: string;
  inst_remarks?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  panel_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  cr_doc?: string;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_date?: string;
  inst_assign_date?: string;
  inst_deadline?: string;
  inst_verify_status?: string | number;
  inst_verify_remarks?: string;
  inst_verify_remark?: string;
  agency_remarks?: string;
  inst_verify_date?: string;
  inst_verify_by?: string;
  inst_verify_file?: string;
  created_at?: string;
  updated_at?: string;
}

type Row = BiharSRTInstallationItem;
type TabType = 'pending' | 'verified';
type VerifyState = 'approved' | 'rejected' | 'pending';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const vendorOf = (r: Row) => r.firm_name || r.vendor_name || r.vendor || r.inst_vendor || DASH;

const verifyState = (r: Row): VerifyState => {
  const s = String(r.inst_verify_status ?? '0');
  return s === '1' ? 'approved' : s === '2' ? 'rejected' : 'pending';
};
const stateLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

/* ───────── Responsive page CSS (Exact Reference Pattern) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Image thumbnails */
  .solar-erp-page .kswp-thumb {
    display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--ax-border, #e2e8f0); background: var(--ax-surface-subtle, #f8fafc);
    border-radius: 6px !important; overflow: hidden; cursor: pointer; transition: transform 0.15s ease;
  }
  .solar-erp-page .kswp-thumb:hover { transform: scale(1.08); }
  .solar-erp-page .kswp-thumb img { width: 100%; height: 100%; object-fit: cover; }
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

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '100%', height: '100%' }}>{children}</svg>
);

const ICONS = {
  doc: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>),
  check: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>),
  shield: svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  cross: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></>),
  coin: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M10 8c4 0 4 4 0 4l4 4" /></>),
};
type IconKey = keyof typeof ICONS;

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub?: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
  dialogStyle,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  dialogStyle?: CSSProperties;
  labelledBy?: string;
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{
          maxWidth,
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          ...dialogStyle,
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
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

const REFRESH_ICON = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

function ImageThumbnail({ src, label, onOpen }: { src?: string | null; label: string; onOpen: (url: string, title: string) => void }) {
  const [broken, setBroken] = useState(false);
  if (!src) return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  const fullUrl = resolveBiharMediaUrl(src);
  return (
    <button type="button" className="kswp-thumb" title={`View ${label}`} onClick={() => onOpen(fullUrl, label)}>
      {broken ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ax-accent)' }}>IMG</span>
      ) : (
        <img src={fullUrl} alt={label} onError={() => setBroken(true)} />
      )}
    </button>
  );
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'pending', label: 'Verification Pending' },
  { key: 'verified', label: 'Approved / Rejected Data' },
];

const IMAGE_COLS: { key: 'system_image' | 'inverter_image' | 'panel_image' | 'nm_sm_image' | 'loger_image'; label: string }[] = [
  { key: 'system_image', label: 'System Image' },
  { key: 'inverter_image', label: 'Inverter Image' },
  { key: 'panel_image', label: 'Panel Image' },
  { key: 'nm_sm_image', label: 'Net Meter / Smart Meter Image' },
  { key: 'loger_image', label: 'Logger Image' },
];

export function BiharSRTInstallationVerifySites() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingList, setPendingList] = useState<Row[]>([]);
  const [verifiedList, setVerifiedList] = useState<Row[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Image / file preview
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<Row | null>(null);

  // Verify action modal
  const [actionItem, setActionItem] = useState<Row | null>(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState<'1' | '2'>('1'); // 1: approve, 2: reject
  const [remarksInput, setRemarksInput] = useState('');
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [modalError, setModalError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchInstallationData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biharAdminService.getViewSrtInstallation();
      const d = res?.data || res || {};

      const rawVerifications: Row[] = Array.isArray(d.verification)
        ? d.verification
        : Array.isArray(d.installations)
        ? d.installations
        : Array.isArray(d)
        ? d
        : [];

      const rawVerified: Row[] = Array.isArray(d.verified) ? d.verified : [];

      // Split verifications based on inst_verify_status
      const pList: Row[] = [];
      const vList: Row[] = [...rawVerified];

      rawVerifications.forEach((item) => {
        const s = String(item.inst_verify_status ?? '0');
        if (s === '1' || s === '2') {
          vList.push(item);
        } else {
          pList.push(item);
        }
      });

      setPendingList(pList);
      setVerifiedList(vList);
      setKpiData(d);
    } catch (err: any) {
      console.error('Failed to load Bihar SRT installation verification data:', err);
      setErrorMsg(err?.message || 'Failed to load installation data from server.');
      setPendingList([]);
      setVerifiedList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstallationData();
  }, [fetchInstallationData]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  const activeList = activeTab === 'pending' ? pendingList : verifiedList;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((r) =>
      [
        r.firm_name,
        r.vendor,
        r.vendor_name,
        r.inst_vendor,
        r.site_name,
        r.district,
        r.dept_name,
        r.ca_no,
        r.contact_person,
        r.contact_number,
        r.solarmeter_no,
        r.inverter_no,
        r.nm_sm_no,
        r.loger_no,
        r.inst_remarks,
        r.inst_verify_remarks,
        r.inst_verify_remark,
        r.agency_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [activeList, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const openVerify = (row: Row) => {
    setActionItem(row);
    setVerifyStatusAction('1');
    setRemarksInput('');
    setVerifyFile(null);
    setModalError('');
  };

  const handleVerifySubmit = async () => {
    if (!actionItem) return;
    setSubmittingAction(true);
    setModalError('');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('id', String(actionItem.id));
      formData.append('status', verifyStatusAction);
      if (remarksInput) formData.append('inst_verify_remarks', remarksInput);
      if (verifyFile) formData.append('file', verifyFile);

      const res = await biharAdminService.verifySrtInstallationStatus(formData);
      setSuccessMsg(res?.message || `Site #${actionItem.id} verification status updated successfully.`);
      setActionItem(null);
      await fetchInstallationData();
    } catch (err: any) {
      console.error('Bihar SRT Verify status update failed:', err);
      setModalError(err?.message || 'Failed to update verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openImage = (url: string, title: string) => setLightbox({ url, title });

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Unique Id', accessor: (r) => txt(r.unique_id || r.id) },
      { header: 'Vendor', accessor: (r) => vendorOf(r) },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => txt(r.district) },
      { header: 'Site Name', accessor: (r) => txt(r.site_name) },
      { header: 'Department', accessor: (r) => txt(r.dept_name) },
      { header: 'CA No.', accessor: (r) => txt(r.ca_no) },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} KW` : DASH) },
      { header: 'Contact Person', accessor: (r) => txt(r.contact_person) },
      { header: 'Contact Number', accessor: (r) => txt(r.contact_number) },
      { header: 'Solar Meter No.', accessor: (r) => txt(r.solarmeter_no) },
      { header: 'Inverter No.', accessor: (r) => txt(r.inverter_no) },
      { header: 'Net/Smart Meter No.', accessor: (r) => txt(r.nm_sm_no) },
      { header: 'Loger No.', accessor: (r) => txt(r.loger_no) },
      { header: 'CR Doc', accessor: (r) => txt(r.cr_doc) },
      { header: 'Latitude', accessor: (r) => txt(r.inst_latitude) },
      { header: 'Longitude', accessor: (r) => txt(r.inst_longitude) },
      { header: 'Remark', accessor: (r) => txt(r.inst_remarks) },
      { header: 'Verify Remarks', accessor: (r) => txt(r.inst_verify_remarks || r.agency_remarks || r.inst_verify_remark) },
      { header: 'Verify Status', accessor: (r) => stateLabel(verifyState(r)) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_SRT_Verify_${activeTab}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_SRT_Verify_${activeTab}`, filtered, exportCols);
  const handlePdf = () => printTableData(`Verify Bihar SRT Installation - ${activeTab}`, filtered, exportCols);

  const colCount = 26;
  const tabCount = (k: TabType) => (k === 'pending' ? pendingList.length : verifiedList.length);
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');

  const kpis: { label: string; value: unknown; tone: KpiTone; icon: IconKey; sub?: string }[] = [
    { label: 'Total Assigned Sites', value: kpiData?.totalsite, tone: 'accent', icon: 'doc', sub: 'assigned to vendors' },
    { label: 'Complete Sites', value: kpiData?.complete, tone: 'emerald', icon: 'check', sub: 'installation complete' },
    { label: 'Pending', value: kpiData?.pendingsite, tone: 'amber', icon: 'clock', sub: 'installation pending' },
    { label: 'Approve Sites', value: kpiData?.approvedsite, tone: 'cyan', icon: 'shield', sub: 'verified & approved' },
    { label: 'Reject Sites', value: kpiData?.rejectsite, tone: 'amber', icon: 'cross', sub: 'verified & rejected' },
    { label: 'Verify Pending', value: kpiData?.verifypending ?? pendingList.length, tone: 'accent', icon: 'clock', sub: 'awaiting verification' },
    { label: 'Claim Applicable', value: kpiData?.claimedapplicable, tone: 'cyan', icon: 'doc' },
    { label: 'Claim Raised', value: kpiData?.claimraised, tone: 'accent', icon: 'doc' },
    { label: 'DOC Submit', value: kpiData?.docsubmit, tone: 'emerald', icon: 'check' },
    { label: 'Payment 70%', value: kpiData?.payment1, tone: 'cyan', icon: 'coin' },
    { label: 'Payment 15%', value: kpiData?.payment2, tone: 'amber', icon: 'coin' },
    { label: 'Payment Done', value: kpiData?.paymentsitecount ?? kpiData?.payment3, tone: 'emerald', icon: 'coin' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Verify Bihar SRT Installation"
        subtitle="Validate handover documents, JCR certificates, warranty papers, and signed farmer vouchers"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT', href: '/vendor-management/bihar/srt/installation/dashboard' },
          { label: 'Verify Bihar SRT Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchInstallationData} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{successMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={12} />
        ) : (
          kpis.map((k) => (
            <KpiCard key={k.label} tone={k.tone} label={k.label} value={num(k.value)} sub={k.sub} icon={ICONS[k.icon]} />
          ))
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installation verification tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Installation verification">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {activeTab === 'pending' ? 'Verification Pending' : 'Approved / Rejected Data'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{activeList.length}</span> installation records submitted by vendors
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, site, district, CA no, meter no…"
                  size="sm"
                  ariaLabel="Search installations"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SRT Installation Verification</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Unique Id</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Department</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Sanction Load</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Logger No.</th>
                  {IMAGE_COLS.map((c) => (
                    <th key={c.key} className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>{c.label}</th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>CR Doc</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={activeTab === 'pending' ? 'No pending verifications' : 'No verified records'}
                        message={hasFilters ? 'No installations match your search. Try clearing the search term.' : 'No installation submissions found under this category.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const vs = verifyState(row);
                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600, color: '#2563eb' }}>
                          {txt(row.unique_id || row.id)}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{vendorOf(row)}</td>
                        <td className="ax-table__td">{row.state || 'Bihar'}</td>
                        <td className="ax-table__td">{txt(row.district)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.site_name)}</td>
                        <td className="ax-table__td">{txt(row.dept_name)}</td>
                        <td className="ax-table__td ax-num">{txt(row.ca_no)}</td>
                        <td className="ax-table__td ax-num">{row.sanction_load ? `${row.sanction_load} KW` : DASH}</td>
                        <td className="ax-table__td">{txt(row.contact_person)}</td>
                        <td className="ax-table__td ax-num">{txt(row.contact_number)}</td>
                        <td className="ax-table__td ax-num">{txt(row.solarmeter_no)}</td>
                        <td className="ax-table__td ax-num">{txt(row.inverter_no)}</td>
                        <td className="ax-table__td ax-num">{txt(row.nm_sm_no)}</td>
                        <td className="ax-table__td ax-num">{txt(row.loger_no)}</td>
                        {IMAGE_COLS.map((c) => (
                          <td key={c.key} className="ax-table__td" style={{ textAlign: 'center' }}>
                            <ImageThumbnail src={row[c.key]} label={c.label} onOpen={openImage} />
                          </td>
                        ))}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {row.cr_doc ? (
                            <a
                              href={resolveBiharMediaUrl(row.cr_doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontSize: 11 }}
                            >
                              <span>📄</span>
                              <span>Doc</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td ax-num">{txt(row.inst_latitude)}</td>
                        <td className="ax-table__td ax-num">{txt(row.inst_longitude)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>{txt(row.inst_remarks)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>{txt(row.inst_verify_remarks || row.agency_remarks || row.inst_verify_remark)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {vs === 'approved' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                              Approved
                            </span>
                          ) : vs === 'rejected' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                              Rejected
                            </span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                              Pending
                            </span>
                          )}
                        </td>
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
                              title="View full site details"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openVerify(row)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#2563eb',
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
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Bihar SRT Installation Site Details"
        subtitle={
          selectedSiteForDetails
            ? `Site ID: #${selectedSiteForDetails.id} • ${selectedSiteForDetails.site_name} • District: ${selectedSiteForDetails.district}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                <button
                  type="button"
                  onClick={() => {
                    const site = selectedSiteForDetails;
                    setSelectedSiteForDetails(null);
                    openVerify(site);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Verify This Site
                </button>
              )}
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setSelectedSiteForDetails(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. General & Location */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Location & Beneficiary Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 16px', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                <div><span style={{ color: '#64748b' }}>Site Name:</span> <b>{txt(selectedSiteForDetails.site_name)}</b></div>
                <div><span style={{ color: '#64748b' }}>Unique ID:</span> <b>{txt(selectedSiteForDetails.unique_id || selectedSiteForDetails.id)}</b></div>
                <div><span style={{ color: '#64748b' }}>Vendor / Firm:</span> <b>{vendorOf(selectedSiteForDetails)}</b></div>
                <div><span style={{ color: '#64748b' }}>District:</span> <b>{txt(selectedSiteForDetails.district)}</b></div>
                <div><span style={{ color: '#64748b' }}>Department:</span> <b>{txt(selectedSiteForDetails.dept_name)}</b></div>
                <div><span style={{ color: '#64748b' }}>Location Address:</span> <b>{txt(selectedSiteForDetails.location)}</b></div>
                <div><span style={{ color: '#64748b' }}>CA Number:</span> <b>{txt(selectedSiteForDetails.ca_no)}</b></div>
                <div><span style={{ color: '#64748b' }}>Sanction Load:</span> <b>{selectedSiteForDetails.sanction_load ? `${selectedSiteForDetails.sanction_load} KW` : DASH}</b></div>
                <div><span style={{ color: '#64748b' }}>Plant Capacity:</span> <b>{selectedSiteForDetails.plant_sc ? `${selectedSiteForDetails.plant_sc} KW` : DASH}</b></div>
                <div><span style={{ color: '#64748b' }}>Volume / DISCOM:</span> <b>{txt(selectedSiteForDetails.volume)} / {txt(selectedSiteForDetails.discom)}</b></div>
              </div>
            </div>

            {/* 2. Contact & Installation Schedule */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Contact & Execution Schedule
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 16px', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                <div><span style={{ color: '#64748b' }}>Contact Person:</span> <b>{txt(selectedSiteForDetails.contact_person)}</b></div>
                <div><span style={{ color: '#64748b' }}>Contact Number:</span> <b>{txt(selectedSiteForDetails.contact_number)}</b></div>
                <div><span style={{ color: '#64748b' }}>Installation Date:</span> <b>{fmtDate(selectedSiteForDetails.inst_date)}</b></div>
                <div><span style={{ color: '#64748b' }}>Assigned Date:</span> <b>{fmtDate(selectedSiteForDetails.inst_assign_date)}</b></div>
                <div><span style={{ color: '#64748b' }}>Deadline:</span> <b>{fmtDate(selectedSiteForDetails.inst_deadline)}</b></div>
                <div><span style={{ color: '#64748b' }}>Latitude:</span> <b>{txt(selectedSiteForDetails.inst_latitude)}</b></div>
                <div><span style={{ color: '#64748b' }}>Longitude:</span> <b>{txt(selectedSiteForDetails.inst_longitude)}</b></div>
                <div><span style={{ color: '#64748b' }}>Commissioning Doc (CR):</span> {selectedSiteForDetails.cr_doc ? <a href={resolveBiharMediaUrl(selectedSiteForDetails.cr_doc)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Download {selectedSiteForDetails.cr_doc.split('/').pop()} ↗</a> : DASH}</div>
              </div>
            </div>

            {/* 3. Meters & Serial Numbers */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Meters & Hardware Serial Numbers
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 16px', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                <div><span style={{ color: '#64748b' }}>Solar Meter No.:</span> <b>{txt(selectedSiteForDetails.solarmeter_no)}</b></div>
                <div><span style={{ color: '#64748b' }}>Inverter No.:</span> <b>{txt(selectedSiteForDetails.inverter_no)}</b></div>
                <div><span style={{ color: '#64748b' }}>Net / Smart Meter No.:</span> <b>{txt(selectedSiteForDetails.nm_sm_no)}</b></div>
                <div><span style={{ color: '#64748b' }}>Data Logger No.:</span> <b>{txt(selectedSiteForDetails.loger_no)}</b></div>
                <div><span style={{ color: '#64748b' }}>Vendor Remarks:</span> <b>{txt(selectedSiteForDetails.inst_remarks)}</b></div>
                <div><span style={{ color: '#64748b' }}>Verification Remarks:</span> <b>{txt(selectedSiteForDetails.inst_verify_remarks || selectedSiteForDetails.agency_remarks || selectedSiteForDetails.inst_verify_remark)}</b></div>
              </div>
            </div>

            {/* 4. Installation Images Gallery */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                4. Field Images
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {IMAGE_COLS.map((c) => {
                  const url = selectedSiteForDetails[c.key];
                  return (
                    <div key={c.key} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', textAlign: 'center', background: '#f8fafc' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, padding: '6px 4px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.label}
                      </div>
                      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                        {url ? (
                          <img
                            src={resolveBiharMediaUrl(url)}
                            alt={c.label}
                            onClick={() => openImage(resolveBiharMediaUrl(url), c.label)}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>No image</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Verify Modal ── */}
      <Modal
        open={Boolean(actionItem)}
        onClose={() => setActionItem(null)}
        title="Verify Installation Data"
        subtitle={actionItem ? `${actionItem.site_name} (ID: #${actionItem.id})` : ''}
        maxWidth={540}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setActionItem(null)}
              disabled={submittingAction}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleVerifySubmit}
              disabled={submittingAction}
            >
              {submittingAction ? (
                <>
                  <span className="ax-spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                  Saving…
                </>
              ) : (
                'Submit Verification'
              )}
            </button>
          </div>
        }
      >
        {actionItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {modalError && (
              <div className="ax-alert ax-alert--danger" role="alert">
                <div className="ax-alert__content">{modalError}</div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Verification Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="verifyDecision"
                    value="1"
                    checked={verifyStatusAction === '1'}
                    onChange={() => setVerifyStatusAction('1')}
                  />
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Approve Site</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="verifyDecision"
                    value="2"
                    checked={verifyStatusAction === '2'}
                    onChange={() => setVerifyStatusAction('2')}
                  />
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Reject Site</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Verification Remarks
              </label>
              <textarea
                className="ax-textarea"
                rows={3}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Enter verification notes, audit remarks, or rejection reason…"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Upload Inspection / Approval Slip (optional)
              </label>
              <input
                type="file"
                className="ax-input"
                onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Lightbox Preview Modal ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{lightbox.title}</h4>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={lightbox.url} alt={lightbox.title} style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiharSRTInstallationVerifySites;
