import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
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
  type ExportColumn,
} from '../../../../../common';
import {
  punjabAdminService,
  resolvePunjabMediaUrl,
  type LightVerificationItem,
  type AssignSummaryCounts,
  DEFAULT_PUNJAB_SUMMARY,
} from '../../punjab-services';

/* ───────── Responsive page CSS (Exact Assam SWP / Punjab Solar ERP Design Reference) ───────── */
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
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
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
    border-color: #2563eb;
    color: #2563eb;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
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

const actionsRowStyle = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)',
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  rose: { bg: 'color-mix(in oklab, var(--ax-viz-rose, #f43f5e) 14%, transparent)', fg: '#dc2626' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card"
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display, inherit)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Media Thumbnail Helper ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file || file === '—') {
    return <span style={{ color: 'var(--ax-text-muted, #64748b)', fontSize: 11 }}>—</span>;
  }

  const url = resolvePunjabMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);

  return (
    <button
      type="button"
      onClick={() => onClick(url)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
      }}
      title="Click to view full image"
    >
      {isPdf ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>PDF</span>
      ) : (
        <img
          src={url}
          alt="Light Installation"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      )}
    </button>
  );
}

export function VerifyLights() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [counts, setCounts] = useState<AssignSummaryCounts>(DEFAULT_PUNJAB_SUMMARY);
  const [pendingList, setPendingList] = useState<LightVerificationItem[]>([]);
  const [verifiedList, setVerifiedList] = useState<LightVerificationItem[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});

  // Report Wise Bifurcation tabs: 'pending' (Lights Completed) vs 'verified' (Approved/Rejected Lights)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Popup State (Approve / Reject / Pending status change)
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<LightVerificationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // 1=Approved, 2=Rejected, 0=Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedLightForDetails, setSelectedLightForDetails] = useState<LightVerificationItem | null>(null);

  // Lightbox Photo preview
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Vendor Name Resolver
  const getVendorName = useCallback(
    (row: LightVerificationItem): string => {
      return punjabAdminService.resolveVendorName(row, vendorMap);
    },
    [vendorMap]
  );

  // Load Punjab SSL Installation Verification Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [res, vMap] = await Promise.all([
        punjabAdminService.getViewInstallation(),
        punjabAdminService.getVendorMap(),
      ]);

      setCounts({
        claimedapplicable: Number(res.summary?.claimedapplicable ?? 0),
        approvedsite: Number(res.summary?.approvedsite ?? 0),
        verifypending: Number(res.summary?.verifypending ?? 0),
        rejectsite: Number(res.summary?.rejectsite ?? 0),
        paymentsitecount: Number(res.summary?.paymentsitecount ?? 0),
        complete: Number(res.summary?.complete ?? 0),
        totalsite: Number(res.summary?.totalsite ?? 0),
        pendingsite: Number(res.summary?.pendingsite ?? 0),
      });

      setPendingList(res.verification || []);
      setVerifiedList(res.verified?.data || []);
      if (vMap) setVendorMap(vMap);
    } catch (err: any) {
      console.error('Failed to load Punjab installation verification:', err);
      setErrorMsg(err?.message || 'Failed to load installation verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Action Popup (Approve / Reject verification)
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;
    if (actionStatus === '') {
      return setErrorMsg('Please select a valid verification status.');
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      await punjabAdminService.verifyInstallationStatus(
        selectedSiteForAction.id,
        statusNum as any,
        actionRemarks.trim() || undefined
      );

      const updatedSite: LightVerificationItem = {
        ...selectedSiteForAction,
        inst_verify_status: statusNum,
        inst_verify_remarks: actionRemarks.trim(),
        remark: actionRemarks.trim() || selectedSiteForAction.remark,
      };

      if (statusNum === 1 || statusNum === 2) {
        setPendingList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifiedList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifiedList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setPendingList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update KPI summary counts dynamically
      setCounts((prev) => {
        const oldStatus = Number(selectedSiteForAction.inst_verify_status ?? selectedSiteForAction.status ?? 0);
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

      if (selectedLightForDetails && selectedLightForDetails.id === selectedSiteForAction.id) {
        setSelectedLightForDetails(updatedSite);
      }

      setSuccessMsg(
        `Light UID: ${selectedSiteForAction.uid || selectedSiteForAction.unique_id || selectedSiteForAction.id} verification updated to ${
          statusNum === 1 ? 'Approved' : statusNum === 2 ? 'Rejected' : 'Pending'
        } successfully.`
      );
      setSelectedSiteForAction(null);
      setActionStatus('');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Action submit error:', err);
      setErrorMsg(err?.message || 'Failed to update installation status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter current active tab list
  const currentList = activeTab === 'pending' ? pendingList : verifiedList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((site) => {
      const vName = getVendorName(site).toLowerCase();
      const uid = String(site.uid || site.unique_id || site.id || '').toLowerCase();
      const dist = (site.district || '').toLowerCase();
      const blk = (site.block || '').toLowerCase();
      const panch = (site.panchayat || '').toLowerCase();
      const ben = (site.beneficiary_name || '').toLowerCase();
      const benContact = (site.beneficiary_contact || site.contact_number || '').toLowerCase();
      const sarp = (site.sarpanch_name || '').toLowerCase();
      const sarpContact = (site.sarpanch_contact || '').toLowerCase();
      const lgt = (site.light_no || '').toLowerCase();
      const bat = (site.battery_no || '').toLowerCase();
      const pnl = (site.panel_no || '').toLowerCase();
      const uuidNo = (site.uuid_no || '').toLowerCase();
      const remarks = (site.remark || site.inst_remark || site.inst_verify_remarks || '').toLowerCase();
      const idStr = String(site.id);

      return (
        vName.includes(q) ||
        uid.includes(q) ||
        dist.includes(q) ||
        blk.includes(q) ||
        panch.includes(q) ||
        ben.includes(q) ||
        benContact.includes(q) ||
        sarp.includes(q) ||
        sarpContact.includes(q) ||
        lgt.includes(q) ||
        bat.includes(q) ||
        pnl.includes(q) ||
        uuidNo.includes(q) ||
        remarks.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery, getVendorName]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery, activeTab]);

  // Export Columns definition (Exact 23 columns, NO #)
  const exportCols: ExportColumn<LightVerificationItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: LightVerificationItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r: LightVerificationItem) => getVendorName(r) },
      { header: 'UID', accessor: (r: LightVerificationItem) => String(r.uid || r.unique_id || r.id || '—') },
      { header: 'State', accessor: (r: LightVerificationItem) => r.state || 'Punjab' },
      { header: 'Phase', accessor: (r: LightVerificationItem) => r.phase || r.volume || '2' },
      { header: 'District', accessor: (r: LightVerificationItem) => r.district || '—' },
      { header: 'Block', accessor: (r: LightVerificationItem) => r.block || '—' },
      { header: 'Panchayat', accessor: (r: LightVerificationItem) => r.panchayat || '—' },
      { header: 'Ward No', accessor: (r: LightVerificationItem) => r.ward_no ?? '—' },
      { header: 'Pole No', accessor: (r: LightVerificationItem) => r.pole_no ?? '—' },
      { header: 'Beneficiary Name', accessor: (r: LightVerificationItem) => r.beneficiary_name || '—' },
      { header: 'Beneficiary Contact', accessor: (r: LightVerificationItem) => r.beneficiary_contact || r.contact_number || '—' },
      { header: 'Sarpanch Name', accessor: (r: LightVerificationItem) => r.sarpanch_name || '—' },
      { header: 'Sarpanch Contact', accessor: (r: LightVerificationItem) => r.sarpanch_contact || '—' },
      { header: 'Latitude', accessor: (r: LightVerificationItem) => r.latitude || r.lat || '—' },
      { header: 'Longitude', accessor: (r: LightVerificationItem) => r.longitude || r.lng || '—' },
      { header: 'UUID No.', accessor: (r: LightVerificationItem) => r.uuid_no || '—' },
      { header: 'Light No.', accessor: (r: LightVerificationItem) => r.light_no || '—' },
      { header: 'Battery No.', accessor: (r: LightVerificationItem) => r.battery_no || '—' },
      { header: 'Panel No.', accessor: (r: LightVerificationItem) => r.panel_no || '—' },
      { header: 'Light Image', accessor: (r: LightVerificationItem) => r.light_file || r.file || '—' },
      { header: 'Remark', accessor: (r: LightVerificationItem) => r.remark || r.inst_remark || '—' },
      {
        header: 'Verification Status',
        accessor: (r: LightVerificationItem) => {
          const st = Number(r.inst_verify_status ?? r.status ?? 0);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Punjab_SSL_Verify_${activeTab}`;
  const fileTitle = `Punjab SSL Installation Verification (${activeTab === 'pending' ? 'Completed' : 'Verified'})`;

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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const handleDrilldown = (status: string) => {
    navigate(`/vendor-management/punjab/ssl/status-view?status=${encodeURIComponent(status)}`);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Punjab SSL Verify Installation Lights"
        subtitle="Review vendor proof of installations, inspect geo-tagged light photos, and verify sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Punjab SSL', href: '/vendor-management/punjab/ssl/dashboard' },
          { label: 'Verify Installation Lights' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/punjab/ssl/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              ← Back to Dashboard
            </Link>
            <Link
              to="/vendor-management/punjab/ssl/view-assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              View Assigned Lights →
            </Link>
          </div>
        }
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

      {/* ── Top 8 KPI Metric Cards in .asw-cards-row ── */}
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
          value={counts.totalsite}
          sub="Allocated across Punjab districts"
          onClick={() => handleDrilldown('total')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="emerald"
          label="Complete Lights"
          value={counts.complete}
          sub="Installation complete on ground"
          onClick={() => handleDrilldown('complete')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Installation"
          value={counts.pendingsite}
          sub="Awaiting field execution"
          onClick={() => handleDrilldown('pending')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Approve Lights"
          value={counts.approvedsite}
          sub="Admin verified and approved"
          onClick={() => handleDrilldown('verify-approved')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="rose"
          label="Reject Lights"
          value={counts.rejectsite}
          sub="Flagged during field verification"
          onClick={() => handleDrilldown('verify-reject')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7.5" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          }
          tone="violet"
          label="Verify Pending"
          value={counts.verifypending}
          sub="Installed & awaiting QA review"
          onClick={() => handleDrilldown('verify-pending')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          tone="accent"
          label="Claim Applicable"
          value={counts.claimedapplicable}
          sub="Eligible for payment claim"
          onClick={() => handleDrilldown('claim-applicable')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          tone="emerald"
          label="Payment Done"
          value={counts.paymentsitecount}
          sub="Settlement complete"
          onClick={() => handleDrilldown('pay-done')}
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
          Lights Completed
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11, fontWeight: 700 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Approved / Rejected Lights
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'verified' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11, fontWeight: 700 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Punjab SSL Installation Pending Verification' : 'Punjab SSL Installation Verified List'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} light{filteredList.length === 1 ? '' : 's'} with on-site equipment serials & proof images
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
                placeholder="Search UID, vendor, beneficiary..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Ward No</th>
                <th className="ax-table__th">Pole No</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Beneficiary Contact</th>
                <th className="ax-table__th">Sarpanch Name</th>
                <th className="ax-table__th">Sarpanch Contact</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">UUID No.</th>
                <th className="ax-table__th">Light No.</th>
                <th className="ax-table__th">Battery No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Light Image</th>
                <th className="ax-table__th" style={{ minWidth: 150 }}>Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={24} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading light installation records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={24} style={centerCell}>
                    <TableEmptyState
                      title="No installation records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: LightVerificationItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vName = getVendorName(row);
                  const imgUrl = row.light_file || row.file || row.inst_file;
                  const verifyStatus = Number(row.inst_verify_status ?? row.status ?? 0);
                  const uidStr = String(row.uid || row.unique_id || row.id || '—');
                  const lat = row.latitude || row.lat;
                  const lng = row.longitude || row.lng;
                  const hasGeo = lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) && String(lat) !== '0.0' && String(lat) !== '0';

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                        {vName}
                      </td>
                      <td className="ax-table__td">
                        <span
                          className="ax-badge"
                          onClick={() => setSelectedLightForDetails(row)}
                          role="button"
                          tabIndex={0}
                          title="Click to view full installation details"
                          style={{
                            background: 'rgba(37, 99, 235, 0.12)',
                            color: '#2563eb',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          {uidStr}
                        </span>
                      </td>
                      <td className="ax-table__td">{row.state || 'Punjab'}</td>
                      <td className="ax-table__td">{row.phase || row.volume || '2'}</td>
                      <td className="ax-table__td"><strong>{row.district || '—'}</strong></td>
                      <td className="ax-table__td">{row.block || '—'}</td>
                      <td className="ax-table__td">{row.panchayat || '—'}</td>
                      <td className="ax-table__td">{row.ward_no ?? '—'}</td>
                      <td className="ax-table__td">{row.pole_no ?? '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                        {row.beneficiary_name || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>
                        {row.beneficiary_contact || row.contact_number || '—'}
                      </td>
                      <td className="ax-table__td">{row.sarpanch_name || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>
                        {row.sarpanch_contact || '—'}
                      </td>
                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                            title={`GPS: ${lat}, ${lng} (Click to open map)`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{lat}</span>
                          </a>
                        ) : (
                          lat || '—'
                        )}
                      </td>
                      <td className="ax-table__td">{lng || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.uuid_no || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.light_no || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.battery_no || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.panel_no || '—'}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={imgUrl} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, fontSize: 11, lineHeight: 1.3 }}>
                        {row.remark || row.inst_remark ? (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Vendor: </span>
                            <span>{row.remark || row.inst_remark}</span>
                          </div>
                        ) : null}
                        {row.inst_verify_remarks && (
                          <div style={{ marginTop: row.remark ? 3 : 0, color: '#b45309' }}>
                            <span style={{ fontWeight: 600 }}>QA: </span>
                            <span>{row.inst_verify_remarks}</span>
                          </div>
                        )}
                        {!row.remark && !row.inst_remark && !row.inst_verify_remarks && (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
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
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {activeTab === 'verified' || verifyStatus === 1 || verifyStatus === 2 ? (
                          verifyStatus === 1 ? (
                            <span
                              className="ax-badge ax-badge--soft ax-badge--success"
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                            >
                              Approved
                            </span>
                          ) : (
                            <span
                              className="ax-badge ax-badge--soft ax-badge--danger"
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                            >
                              Rejected
                            </span>
                          )
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setSelectedLightForDetails(row)}
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
                              title="View full installation details"
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
                                setActionStatus('1');
                                setActionRemarks(row.inst_verify_remarks || row.remark || '');
                              }}
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
                        )}
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

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedLightForDetails)}
        onClose={() => setSelectedLightForDetails(null)}
        title="Punjab SSL Installation Light Details"
        subtitle={
          selectedLightForDetails
            ? `UID: ${selectedLightForDetails.uid || selectedLightForDetails.unique_id || selectedLightForDetails.id} • Vendor: ${getVendorName(selectedLightForDetails)} • District: ${selectedLightForDetails.district || '—'}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedLightForDetails && Number(selectedLightForDetails.inst_verify_status ?? selectedLightForDetails.status ?? 0) === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const site = selectedLightForDetails;
                    setSelectedLightForDetails(null);
                    setSelectedSiteForAction(site);
                    setActionStatus('1');
                    setActionRemarks(site.inst_verify_remarks || site.remark || '');
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
              onClick={() => setSelectedLightForDetails(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedLightForDetails && (
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
                <span style={{ fontSize: 12, color: '#64748b' }}>UID: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#2563eb' }}>
                  {selectedLightForDetails.uid || selectedLightForDetails.unique_id || selectedLightForDetails.id}
                </strong>
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                  State: <strong>{selectedLightForDetails.state || 'Punjab'}</strong>
                </span>
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                  Phase: <strong>{selectedLightForDetails.phase || selectedLightForDetails.volume || '2'}</strong>
                </span>
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                  Vendor: <strong>{getVendorName(selectedLightForDetails)}</strong>
                </span>
              </div>
              <div>
                {Number(selectedLightForDetails.inst_verify_status ?? selectedLightForDetails.status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : Number(selectedLightForDetails.inst_verify_status ?? selectedLightForDetails.status) === 2 ? (
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
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Beneficiary & Governance Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Beneficiary Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedLightForDetails.beneficiary_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Beneficiary Contact:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedLightForDetails.beneficiary_contact || selectedLightForDetails.contact_number || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Sarpanch Name:</span>
                  <span>{selectedLightForDetails.sarpanch_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Sarpanch Contact:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedLightForDetails.sarpanch_contact || '—'}</span>

                  <span style={{ color: '#64748b' }}>Ward No:</span>
                  <span>{selectedLightForDetails.ward_no ?? '—'}</span>

                  <span style={{ color: '#64748b' }}>Pole No:</span>
                  <span style={{ fontWeight: 600 }}>{selectedLightForDetails.pole_no ?? '—'}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>{selectedLightForDetails.state || 'Punjab'}</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedLightForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Block:</span>
                  <span>{selectedLightForDetails.block || '—'}</span>

                  <span style={{ color: '#64748b' }}>Panchayat:</span>
                  <span>{selectedLightForDetails.panchayat || '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedLightForDetails.latitude && selectedLightForDetails.longitude && String(selectedLightForDetails.latitude) !== '0.0' ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedLightForDetails.latitude},${selectedLightForDetails.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {selectedLightForDetails.latitude}, {selectedLightForDetails.longitude} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Hardware & Equipment Specifications */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Hardware & Equipment Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>UUID No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    {selectedLightForDetails.uuid_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Light No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedLightForDetails.light_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Battery No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedLightForDetails.battery_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Panel No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedLightForDetails.panel_no || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 3: Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12, letterSpacing: '0.04em' }}>
                Photographic Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {(() => {
                  const img =
                    selectedLightForDetails.light_file ||
                    selectedLightForDetails.file ||
                    selectedLightForDetails.inst_file;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Installed Light Image
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolvePunjabMediaUrl(img))}
                        >
                          <img
                            src={resolvePunjabMediaUrl(img)}
                            alt="Installed Light"
                            style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: 6, background: '#fff' }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 40, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Grid 4: Audit & QA Verification Notes */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Remarks & Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedLightForDetails.remark || selectedLightForDetails.inst_remark || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedLightForDetails.updated_at || selectedLightForDetails.inst_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Review Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedLightForDetails.inst_verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedLightForDetails.inst_verify_remarks || '—'}
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
        title="Verify Installation Status"
        subtitle={
          selectedSiteForAction
            ? `UID: ${selectedSiteForAction.uid || selectedSiteForAction.unique_id || selectedSiteForAction.id} • Beneficiary: ${selectedSiteForAction.beneficiary_name || '—'} • Vendor: ${getVendorName(selectedSiteForAction)}`
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
              Submit Status
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
              <option value="">-- Select Status --</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong, #0f172a)' }}>
              Verification Remarks {actionStatus === '2' && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder={actionStatus === '2' ? 'Enter rejection reason (required)...' : 'Enter audit remarks or feedback...'}
              required={actionStatus === '2'}
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: '#2563eb',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #bfdbfe',
                  background: '#eff6ff',
                }}
              >
                Open Original ↗
              </a>
            )}
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setLightboxUrl(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <img
              src={lightboxUrl}
              alt="Installation preview"
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifyLights;
