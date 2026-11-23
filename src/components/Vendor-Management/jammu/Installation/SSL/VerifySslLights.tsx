import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
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
  jammuSslAdminService,
  resolveJammuSslMediaUrl,
  type LightVerificationItem,
  type AssignSummaryCounts,
} from './jammuSslAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
    --ax-primary: #2559bf;
    --ax-primary-hover: #1e4699;
    --ax-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary,
  .solar-erp-page .ax-button--primary {
    background: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover,
  .solar-erp-page .ax-button--primary:hover {
    background: #1e4699 !important;
    border-color: #1e4699 !important;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
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
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function extractFilePath(raw: any): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
      } catch {}
    }
    return trimmed;
  }
  if (Array.isArray(raw) && raw.length > 0) return String(raw[0]);
  return undefined;
}

export function VerifySslLights() {
  const [searchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status') || '';
  const initialDistrictParam = searchParams.get('district') || '';
  const initialVendorParam = searchParams.get('vendor') || '';

  const [counts, setCounts] = useState<AssignSummaryCounts>({
    totalsite: 0,
    complete: 0,
    pendingsite: 0,
    approvedsite: 0,
    rejectsite: 0,
    verifypending: 0,
    claimedapplicable: 0,
    paymentsitecount: 0,
  });

  const [verifyPending, setVerifyPending] = useState<LightVerificationItem[]>([]);
  const [verifyComplete, setVerifyComplete] = useState<LightVerificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Report Wise Bifurcation tabs: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>(() => {
    const st = initialStatusParam.toLowerCase();
    if (st.includes('approve') || st.includes('reject') || st === 'verified' || st === 'approved_rejected') {
      return 'approved_rejected';
    }
    return 'pending';
  });

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return initialDistrictParam || initialVendorParam || '';
  });

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<LightVerificationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // 1=Approved, 2=Rejected
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<LightVerificationItem | null>(null);

  // Lightbox Photo preview
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [vendorMap, setVendorMap] = useState<Record<string | number, string>>({});

  const getVendorName = useCallback(
    (item?: Partial<LightVerificationItem> | null): string => {
      if (!item) return '—';
      if (item.vendors && typeof item.vendors === 'object') {
        if (item.vendors.name) return item.vendors.name;
        if (item.vendors.vendor_name) return item.vendors.vendor_name;
      }
      if (typeof item.vendors === 'string' && item.vendors.trim()) return item.vendors.trim();
      if (item.vendor_name) return item.vendor_name;
      const vid = item.inst_vendor ?? item.vendor;
      if (vid !== undefined && vid !== null && String(vid).trim() !== '') {
        const key = String(vid).trim();
        if (vendorMap[key]) return vendorMap[key];
        return `Vendor ${key}`;
      }
      return '—';
    },
    [vendorMap]
  );

  // Fetch Jammu SSL verification dataset
  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [res, vMap] = await Promise.all([
        jammuSslAdminService.getViewInstallation(),
        jammuSslAdminService.getVendorMap(),
      ]);
      setCounts(res.summary);
      setVerifyPending(res.verification || []);
      setVerifyComplete(res.verified?.data || []);
      setVendorMap((prev) => ({ ...prev, ...vMap }));
    } catch (err: any) {
      console.error('Failed to load Jammu SSL verification data:', err);
      setErrorMsg(err?.message || 'Failed to fetch installation verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  // Submit Action Popup
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;
    if (actionStatus === '') {
      return setErrorMsg('Please select a valid status.');
    }
    if (!actionFile && !selectedSiteForAction.verify_file && !selectedSiteForAction.inst_verify_file) {
      return setErrorMsg('Please choose a verification file.');
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const res = await jammuSslAdminService.verifyInstallationStatus({
        id: selectedSiteForAction.id,
        status: statusNum,
        file: actionFile,
        remark: actionRemarks.trim() || undefined,
        inst_verify_remarks: actionRemarks.trim() || undefined,
      });

      const updatedSite: LightVerificationItem = {
        ...selectedSiteForAction,
        inst_verify_status: statusNum,
        inst_verify_remarks: actionRemarks.trim(),
        inst_verify_file: actionFile ? URL.createObjectURL(actionFile) : selectedSiteForAction.inst_verify_file,
        verify_file: actionFile ? URL.createObjectURL(actionFile) : selectedSiteForAction.verify_file,
        inst_verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      if (statusNum === 1 || statusNum === 2) {
        setVerifyPending((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyComplete((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifyComplete((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyPending((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update summary counts dynamically
      setCounts((prev) => {
        const oldStatus = Number(selectedSiteForAction.inst_verify_status);
        const next = { ...prev };
        if (oldStatus === 0 && statusNum === 1) {
          next.verifypending = Math.max(0, (next.verifypending || 0) - 1);
          next.approvedsite = (next.approvedsite || 0) + 1;
        } else if (oldStatus === 0 && statusNum === 2) {
          next.verifypending = Math.max(0, (next.verifypending || 0) - 1);
          next.rejectsite = (next.rejectsite || 0) + 1;
        } else if (oldStatus === 1 && statusNum === 2) {
          next.approvedsite = Math.max(0, (next.approvedsite || 0) - 1);
          next.rejectsite = (next.rejectsite || 0) + 1;
        } else if (oldStatus === 2 && statusNum === 1) {
          next.rejectsite = Math.max(0, (next.rejectsite || 0) - 1);
          next.approvedsite = (next.approvedsite || 0) + 1;
        } else if (oldStatus !== 0 && statusNum === 0) {
          if (oldStatus === 1) next.approvedsite = Math.max(0, (next.approvedsite || 0) - 1);
          if (oldStatus === 2) next.rejectsite = Math.max(0, (next.rejectsite || 0) - 1);
          next.verifypending = (next.verifypending || 0) + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(res.message || 'Status Updated Successfully');
      setSelectedSiteForAction(null);
      setActionStatus('1');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Action submit error:', err);
      setErrorMsg(err?.message || 'Failed to update installation status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter current active tab data
  const currentList = activeTab === 'pending' ? verifyPending : verifyComplete;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((site) => {
      const vName = getVendorName(site).toLowerCase();
      const bName = (site.beneficiary_name || site.contact_person || '').toLowerCase();
      const contact = (site.contact_no || site.contact_number || site.phone || '').toLowerCase();
      const dist = (site.district || '').toLowerCase();
      const block = (site.block || '').toLowerCase();
      const panchayat = (site.panchayat || '').toLowerCase();
      const pole = (site.pole_no || '').toLowerCase();
      const bat = (site.battery_serial_no || site.battery_no || '').toLowerCase();
      const lum = (site.luminary_no || site.light_no || '').toLowerCase();
      const imei = (site.imei_no || site.sim_no || '').toLowerCase();
      const wo = (site.volume || site.phase || '').toLowerCase();
      const vRemarks = (site.inst_remark || site.remark || '').toLowerCase();
      const qaRemarks = (site.inst_verify_remarks || '').toLowerCase();
      const uid = (site.uid || site.unique_id || String(site.id)).toLowerCase();

      return (
        vName.includes(q) ||
        bName.includes(q) ||
        contact.includes(q) ||
        dist.includes(q) ||
        block.includes(q) ||
        panchayat.includes(q) ||
        pole.includes(q) ||
        bat.includes(q) ||
        lum.includes(q) ||
        imei.includes(q) ||
        wo.includes(q) ||
        vRemarks.includes(q) ||
        qaRemarks.includes(q) ||
        uid.includes(q)
      );
    });
  }, [currentList, searchQuery, getVendorName]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<LightVerificationItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: LightVerificationItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'District', accessor: (r: LightVerificationItem) => r.district || '—' },
      { header: 'Block', accessor: (r: LightVerificationItem) => r.block || '—' },
      { header: 'Panchayat', accessor: (r: LightVerificationItem) => r.panchayat || '—' },
      { header: 'Village / Ward', accessor: (r: LightVerificationItem) => r.village || r.address || '—' },
      { header: 'Vendor Name', accessor: (r: LightVerificationItem) => getVendorName(r) },
      { header: 'Beneficiary Name', accessor: (r: LightVerificationItem) => r.beneficiary_name || r.contact_person || '—' },
      { header: 'Contact No.', accessor: (r: LightVerificationItem) => r.contact_no || r.contact_number || r.phone || '—' },
      { header: 'Pole Serial No.', accessor: (r: LightVerificationItem) => r.pole_no || '—' },
      { header: 'Luminary / Lux', accessor: (r: LightVerificationItem) => r.luminary_no || r.light_no || '—' },
      { header: 'Battery Serial No.', accessor: (r: LightVerificationItem) => r.battery_serial_no || r.battery_no || '—' },
      { header: 'Solar Panel No.', accessor: (r: LightVerificationItem) => r.panel_no || r.module_no || '—' },
      { header: 'RMS IMEI No.', accessor: (r: LightVerificationItem) => r.imei_no || '—' },
      { header: 'SIM No.', accessor: (r: LightVerificationItem) => r.sim_no || '—' },
      { header: 'Installed Date', accessor: (r: LightVerificationItem) => r.created_at || r.updated_at || '—' },
      { header: 'Vendor Remarks', accessor: (r: LightVerificationItem) => r.inst_remark || r.remark || '—' },
      {
        header: 'Verification Status',
        accessor: (r: LightVerificationItem) => {
          const st = Number(r.inst_verify_status);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      { header: 'Verification Remarks', accessor: (r: LightVerificationItem) => r.inst_verify_remarks || '—' },
      { header: 'Verified Date', accessor: (r: LightVerificationItem) => r.inst_verify_date || '—' },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_Verify_${activeTab}`;
  const fileTitle = `Jammu SSL Installation Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Top KPI values
  const totalSiteCount = counts.totalsite || (verifyPending.length + verifyComplete.length);
  const installedCount = counts.complete || (verifyPending.length + verifyComplete.length);
  const pendingCount = counts.verifypending || verifyPending.length;
  const approvedCount = counts.approvedsite || verifyComplete.filter((s) => Number(s.inst_verify_status) === 1).length;
  const rejectedCount = counts.rejectsite || verifyComplete.filter((s) => Number(s.inst_verify_status) === 2).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu SSL Installation Verify List"
        subtitle="Review vendor proof of installations, inspect pole & battery telemetry, luminary lux levels, and approve sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu SSL', href: '/vendor-management/jammu/installation/ssl/dashboard' },
          { label: 'Verify Installation' },
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

      {/* ── Top 8 KPI Metric Cards matching Backend Counters ── */}
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
          label="Total Assigned Lights"
          value={num(counts.totalsite)}
          sub="Total lights assigned"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Complete Lights"
          value={num(counts.complete)}
          sub="Installation complete"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Lights"
          value={num(counts.pendingsite)}
          sub="Installation pending"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
          tone="cyan"
          label="Approve Lights"
          value={num(counts.approvedsite)}
          sub="Approved lights"
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
          label="Reject Lights"
          value={num(counts.rejectsite)}
          sub="Rejected lights"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          tone="amber"
          label="Verify Pending"
          value={num(counts.verifypending)}
          sub="Awaiting QA review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="cyan"
          label="Claim Applicable"
          value={num(counts.claimedapplicable)}
          sub="Ready for claim audit"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
          }
          tone="emerald"
          label="Payment Done"
          value={num(counts.paymentsitecount)}
          sub="Disbursed sites"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Lights Completed
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyPending.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved / Rejected Lights
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyComplete.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Jammu SSL Installation Pending Verification' : 'Jammu SSL Installation Verified List'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} site{filteredList.length === 1 ? '' : 's'} with on-site hardware serials & proof images
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
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search pole, vendor, district, block, IMEI..."
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

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1850 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Beneficiary Contact</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">IMEI No.</th>
                <th className="ax-table__th">Sim No.</th>
                <th className="ax-table__th">Battery No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Light Image</th>
                <th className="ax-table__th">Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify File</th>
                <th className="ax-table__th">Verify Remarks</th>
                {activeTab === 'pending' && (
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 20 : 19} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation proof records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 20 : 19} style={centerCell}>
                    <TableEmptyState
                      title="No installation records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: LightVerificationItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const poleImg = row.light_file || row.light_image || row.photo;
                  const verifyStatus = Number(row.inst_verify_status);
                  const lat = row.inst_latitude || row.latitude || row.lat;
                  const lng = row.inst_longitude || row.longitude || row.long || row.lng;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: '#334155' }}>{row.phase || row.volume || 'Phase I'}</span>
                      </td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{row.block || '—'}</div>
                      </td>
                      <td className="ax-table__td">
                        <div>{row.village || row.panchayat || '—'}</div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.beneficiary_name || row.contact_person || '—'}
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.contact_no || row.contact_number || row.phone || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {lat ? String(lat) : '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {lng ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span>{String(lng)}</span>
                            {lat && String(lat) !== '0.0' && String(lng) !== '0.0' && (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2559bf', textDecoration: 'none' }}
                                title="Open GPS Map"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.imei_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.sim_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.battery_serial_no || row.battery_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.panel_no || row.module_no || '—'}
                      </td>

                      {/* Light Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {poleImg ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(poleImg))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to view full image"
                          >
                            <img
                              src={resolveJammuSslMediaUrl(poleImg)}
                              alt="Light"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Remark */}
                      <td className="ax-table__td" style={{ maxWidth: 160, fontSize: 11 }}>
                        {row.inst_remark || row.remark || '—'}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {verifyStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Verify Approved
                          </span>
                        ) : verifyStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Verify Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Verify File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {(() => {
                          const rawFile =
                            row.verify_file ||
                            row.inst_verify_file ||
                            (row as any).file ||
                            (row as any).verify_doc ||
                            (row as any).document;
                          const cleanFile = extractFilePath(rawFile);
                          if (!cleanFile) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
                          const fileUrl = resolveJammuSslMediaUrl(cleanFile);
                          const isImg = /\.(jpe?g|png|webp|gif|svg)$/i.test(cleanFile);

                          return (
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isImg ? (
                                <button
                                  type="button"
                                  onClick={() => setLightboxUrl(fileUrl)}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 6,
                                    padding: 2,
                                    background: '#fff',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                  }}
                                  title="Click to preview Verify File"
                                >
                                  <img
                                    src={fileUrl}
                                    alt="Verify File"
                                    style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </button>
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    background: '#eff6ff',
                                    color: '#2559bf',
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    border: '1px solid #bfd3f8',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                  title="Open / Download Verify File"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  <span>View File</span>
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Verify Remarks */}
                      <td className="ax-table__td" style={{ fontSize: 12, color: '#334155' }}>
                        {row.inst_verify_remarks || row.verify_remarks || '—'}
                      </td>

                      {/* Action: Only rendered when pending! */}
                      {activeTab === 'pending' && (
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
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSiteForAction(row);
                                setActionStatus(row.inst_verify_status ? String(row.inst_verify_status) : '');
                                setActionFile(null);
                                setActionRemarks(row.inst_verify_remarks || '');
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

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Jammu SSL Installation Site Details"
        subtitle={
          selectedSiteForDetails
            ? `Pole ID: ${selectedSiteForDetails.pole_no || '#' + selectedSiteForDetails.id} • District: ${selectedSiteForDetails.district} • Block: ${selectedSiteForDetails.block}`
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
                    setSelectedSiteForAction(site);
                    setActionStatus(String(site.inst_verify_status ?? '1'));
                    setActionRemarks(site.inst_verify_remarks || '');
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
                  Verify This Installation
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
            {/* Top Status & Overview Bar */}
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Pole Serial No: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedSiteForDetails.pole_no || `JK-POLE-${selectedSiteForDetails.id}`}</strong>
                {selectedSiteForDetails.volume && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Volume: <strong>{selectedSiteForDetails.volume}</strong>
                  </span>
                )}
                {selectedSiteForDetails.created_at && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Date: {selectedSiteForDetails.created_at}
                  </span>
                )}
              </div>
              <div>
                {Number(selectedSiteForDetails.inst_verify_status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : Number(selectedSiteForDetails.inst_verify_status) === 2 ? (
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

            {/* Grid 1: Beneficiary & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Beneficiary Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Beneficiary Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Beneficiary / Ward:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.beneficiary_name || selectedSiteForDetails.contact_person || 'Gram Panchayat'}</span>

                  <span style={{ color: '#64748b' }}>Contact No:</span>
                  <span style={{ fontFamily: 'monospace', color: '#2559bf' }}>
                    {selectedSiteForDetails.contact_no || selectedSiteForDetails.contact_number || selectedSiteForDetails.phone || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Vendor Partner:</span>
                  <span style={{ fontWeight: 600 }}>{getVendorName(selectedSiteForDetails)}</span>

                  <span style={{ color: '#64748b' }}>Scheme Phase:</span>
                  <span>{selectedSiteForDetails.phase || 'Phase I'}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>JAMMU</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Block:</span>
                  <span>{selectedSiteForDetails.block || '—'}</span>

                  <span style={{ color: '#64748b' }}>Panchayat:</span>
                  <span>{selectedSiteForDetails.panchayat || selectedSiteForDetails.village || '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedSiteForDetails.inst_latitude && selectedSiteForDetails.inst_longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.inst_latitude},${selectedSiteForDetails.inst_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2559bf', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {selectedSiteForDetails.inst_latitude}, {selectedSiteForDetails.inst_longitude} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Hardware & Street Light Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Solar Street Light Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Pole Number</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.pole_no || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Luminary / Lux Level</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.luminary_no || selectedSiteForDetails.light_no || '12W LED Luminary'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Battery Serial Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.battery_serial_no || selectedSiteForDetails.battery_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Panel / Module No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.panel_no || selectedSiteForDetails.module_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>RMS IMEI Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.imei_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>SIM Serial Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedSiteForDetails.sim_no || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 3: Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12, letterSpacing: '0.04em' }}>
                Photographic Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {/* Photo 1: Pole With Light */}
                {(() => {
                  const img = selectedSiteForDetails.light_file || selectedSiteForDetails.light_image || selectedSiteForDetails.photo;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Pole Erection & Luminary
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(img))}
                        >
                          <img
                            src={resolveJammuSslMediaUrl(img)}
                            alt="Pole Erection"
                            style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}

                {/* Photo 2: Battery & Enclosure */}
                {(() => {
                  const img = (selectedSiteForDetails as any).battery_image || (selectedSiteForDetails as any).battery_file || selectedSiteForDetails.light_file;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Battery Box & Ingress Enclosure
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveJammuSslMediaUrl(img))}
                        >
                          <img
                            src={resolveJammuSslMediaUrl(img)}
                            alt="Battery Box"
                            style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2559bf', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Grid 4: Audit & QA Verification Notes */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10, letterSpacing: '0.04em' }}>
                Remarks & Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.inst_remark || selectedSiteForDetails.remark || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedSiteForDetails.inst_verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Review Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.inst_verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.inst_verify_remarks || '—'}
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
        title="Verify Status"
        subtitle={
          selectedSiteForAction
            ? `Pole: ${selectedSiteForAction.pole_no || '#' + selectedSiteForAction.id} • District: ${selectedSiteForAction.district} • Vendor: ${getVendorName(selectedSiteForAction)}`
            : undefined
        }
        maxWidth={480}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
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
              style={{ background: '#2559bf', borderColor: '#2559bf', padding: '6px 20px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Submit
            </button>
          </div>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
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
            >
              <option value="">-- Select Status --</option>
              <option value="1">Verify Approve</option>
              <option value="2">Verify Reject</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              File <span style={{ color: '#ef4444' }}>*</span>
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
              required={!selectedSiteForAction?.verify_file && !selectedSiteForAction?.inst_verify_file}
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
        </form>
      </Modal>

      {/* ── Image Lightbox Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Installation Photo Preview"
        maxWidth={720}
        footer={
          <button
            type="button"
            className="ax-button ax-button--secondary"
            onClick={() => setLightboxUrl(null)}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            Close
          </button>
        }
      >
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            {/\.pdf($|\?)/i.test(lightboxUrl) ? (
              <iframe
                src={lightboxUrl}
                title="Installation Document Preview"
                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8, background: '#fff' }}
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Installation preview"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifySslLights;
