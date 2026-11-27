import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
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
  upRescoAdminService,
  resolveUpMediaUrl,
  type UpRescoSiteRow,
  type UpRescoDetailSummary,
} from '../../up-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
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

  .solar-erp-page .asw-filter-card {
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-pill-btn.active {
    background: var(--ax-gradient-accent, var(--ax-accent, #2563eb)) !important;
    color: var(--ax-on-accent, #ffffff) !important;
    border-color: transparent !important;
    box-shadow: var(--ax-glow-accent, 0 2px 4px rgba(37, 99, 235, 0.2)) !important;
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

/* Helper to parse panel serial numbers safely */
function parseModuleSerials(raw?: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return [String(raw)];
}

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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function UPRescoVerifyInstallation() {
  const [verifyPending, setVerifyPending] = useState<UpRescoSiteRow[]>([]);
  const [verifyComplete, setVerifyComplete] = useState<UpRescoSiteRow[]>([]);
  const [detailSummary, setDetailSummary] = useState<UpRescoDetailSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Report Wise Bifurcation tabs: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Search input & volume filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [volumeFilter, setVolumeFilter] = useState<string>('all');

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<UpRescoSiteRow | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // 1=Approved, 2=Rejected, 0=Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<UpRescoSiteRow | null>(null);

  // Lightbox Photo preview
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch API: GET /up/resco/installation/view-installation
  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upRescoAdminService.getViewInstallation();
      setVerifyPending(res.verify_pending || []);
      setVerifyComplete(res.verify_complete || []);
      setDetailSummary(res.detail || null);
    } catch (err: any) {
      console.error('Failed to load UP Resco verify installations:', err);
      setErrorMsg(err?.message || 'Failed to fetch installation verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  // Submit Action Popup (API: POST /up/resco/installation/verify-status-installation)
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;
    if (actionStatus === '') {
      return setErrorMsg('Please select a valid status.');
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const res = await upRescoAdminService.verifyInstallationStatus({
        id: selectedSiteForAction.id,
        status: (statusNum === 2 ? 2 : 1) as 1 | 2,
        inst_verify_remarks: actionRemarks.trim() || undefined,
      });

      const updatedSite: UpRescoSiteRow = {
        ...selectedSiteForAction,
        inst_verify_status: statusNum,
        inst_verify_remarks: actionRemarks.trim(),
        inst_verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      if (statusNum === 1 || statusNum === 2) {
        setVerifyPending((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyComplete((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifyComplete((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyPending((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update detail counts dynamically
      setDetailSummary((prev: any) => {
        if (!prev) return prev;
        const oldStatus = Number(selectedSiteForAction.inst_verify_status);
        const next = { ...prev };
        if (oldStatus === 0 && statusNum === 1) {
          next.verify_pending = Math.max(0, (next.verify_pending || 0) - 1);
          next.verify_approved = (next.verify_approved || 0) + 1;
        } else if (oldStatus === 0 && statusNum === 2) {
          next.verify_pending = Math.max(0, (next.verify_pending || 0) - 1);
          next.verify_reject = (next.verify_reject || 0) + 1;
        } else if (oldStatus === 1 && statusNum === 2) {
          next.verify_approved = Math.max(0, (next.verify_approved || 0) - 1);
          next.verify_reject = (next.verify_reject || 0) + 1;
        } else if (oldStatus === 2 && statusNum === 1) {
          next.verify_reject = Math.max(0, (next.verify_reject || 0) - 1);
          next.verify_approved = (next.verify_approved || 0) + 1;
        } else if (oldStatus !== 0 && statusNum === 0) {
          if (oldStatus === 1) next.verify_approved = Math.max(0, (next.verify_approved || 0) - 1);
          if (oldStatus === 2) next.verify_reject = Math.max(0, (next.verify_reject || 0) - 1);
          next.verify_pending = (next.verify_pending || 0) + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(res?.message || 'Status Updated Successfully');
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

  // Derive distinct volumes in requested order: 1, 10, 3, 5, 7, 8
  const preferredOrder = ['1', '10', '3', '5', '7', '8'];
  const { availableVolumes } = useMemo(() => {
    const all = [...verifyPending, ...verifyComplete];
    const counts: Record<string, number> = {};
    const set = new Set<string>();

    all.forEach((s) => {
      const vol = s.volume !== undefined && s.volume !== null && String(s.volume).trim() !== ''
        ? String(s.volume).trim()
        : '';
      if (vol) {
        set.add(vol);
        counts[vol] = (counts[vol] || 0) + 1;
      }
    });

    const distinct = Array.from(set);
    const combined = Array.from(new Set([...preferredOrder, ...distinct])).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    return { availableVolumes: combined, volumeCounts: counts };
  }, [verifyPending, verifyComplete]);

  // Current active list based on report bifurcation
  const currentList = activeTab === 'pending' ? verifyPending : verifyComplete;

  const filteredList = useMemo(() => {
    let list = currentList;
    if (volumeFilter !== 'all') {
      list = list.filter((s) => String(s.volume ?? '').trim() === volumeFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((site) => {
      const siteName = site.site_name?.toLowerCase() || '';
      const deptName = site.dept_name?.toLowerCase() || '';
      const contactPerson = site.contact_person?.toLowerCase() || '';
      const contactNo = String(site.contact_number || '').toLowerCase();
      const caNo = String(site.ca_no || '').toLowerCase();
      const dist = site.district?.toLowerCase() || '';
      const addr = site.address?.toLowerCase() || '';
      const vName = (site.vendor_name || site.vendors?.name || '').toLowerCase();
      const inv = String(site.inverter_no || site.Inverter_no || '').toLowerCase();
      const pan = String(site.panel_no || '').toLowerCase();
      const meterNo = String(site.solarmeter_no || site.nm_sm_no || '').toLowerCase();
      const logerNo = String(site.loger_no || '').toLowerCase();
      const vRemarks = site.inst_remarks?.toLowerCase() || '';
      const qaRemarks = site.inst_verify_remarks?.toLowerCase() || '';
      const idStr = String(site.id);
      const uIdStr = String(site.unique_id || '');
      return (
        siteName.includes(q) ||
        deptName.includes(q) ||
        contactPerson.includes(q) ||
        contactNo.includes(q) ||
        caNo.includes(q) ||
        dist.includes(q) ||
        addr.includes(q) ||
        vName.includes(q) ||
        inv.includes(q) ||
        pan.includes(q) ||
        meterNo.includes(q) ||
        logerNo.includes(q) ||
        vRemarks.includes(q) ||
        qaRemarks.includes(q) ||
        idStr.includes(q) ||
        uIdStr.includes(q)
      );
    });
  }, [currentList, searchQuery, volumeFilter]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition: Exactly matching the requested 24 fields
  const exportCols: ExportColumn<UpRescoSiteRow>[] = useMemo(() => {
    const base: ExportColumn<UpRescoSiteRow>[] = [
      { header: 'Sr. No.', accessor: (_r: UpRescoSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'UID', accessor: (r: UpRescoSiteRow) => r.unique_id || r.id },
      { header: 'State', accessor: () => 'UTTAR PRADESH' },
      { header: 'District', accessor: (r: UpRescoSiteRow) => r.district || '—' },
      { header: 'Site Name', accessor: (r: UpRescoSiteRow) => r.site_name || '—' },
      { header: 'Contact Person', accessor: (r: UpRescoSiteRow) => r.contact_person || '—' },
      { header: 'Contact Number', accessor: (r: UpRescoSiteRow) => r.contact_number || '—' },
      { header: 'Solar Meter No.', accessor: (r: UpRescoSiteRow) => r.solarmeter_no || '—' },
      { header: 'Inverter No.', accessor: (r: UpRescoSiteRow) => r.inverter_no || r.Inverter_no || '—' },
      { header: 'Net/Smart Meter No.', accessor: (r: UpRescoSiteRow) => r.nm_sm_no || '—' },
      { header: 'Loger No.', accessor: (r: UpRescoSiteRow) => r.loger_no || '—' },
      { header: 'Panel No.', accessor: (r: UpRescoSiteRow) => r.panel_no || (r.panel_qty ? `${r.panel_qty} Panels` : '—') },
      { header: 'System Image', accessor: (r: UpRescoSiteRow) => r.system_image ? resolveUpMediaUrl(r.system_image, 'resco') : '—' },
      { header: 'Inverter Image', accessor: (r: UpRescoSiteRow) => r.inverter_image || r.Inverter_image || (r as any).inverter_img ? resolveUpMediaUrl(r.inverter_image || r.Inverter_image || (r as any).inverter_img, 'resco') : '—' },
      { header: 'Panel Image', accessor: (r: UpRescoSiteRow) => r.panel_image || (r as any).panel_img ? resolveUpMediaUrl(r.panel_image || (r as any).panel_img, 'resco') : '—' },
      { header: 'Net Meter/Smart Meter Image', accessor: (r: UpRescoSiteRow) => r.nm_sm_image || (r as any).meter_image ? resolveUpMediaUrl(r.nm_sm_image || (r as any).meter_image, 'resco') : '—' },
      { header: 'Loger Image', accessor: (r: UpRescoSiteRow) => r.loger_image ? resolveUpMediaUrl(r.loger_image, 'resco') : '—' },
      { header: 'Latitude', accessor: (r: UpRescoSiteRow) => r.inst_latitude || '—' },
      { header: 'Longitude', accessor: (r: UpRescoSiteRow) => r.inst_longitude || '—' },
      { header: 'Inst.Remarks', accessor: (r: UpRescoSiteRow) => r.inst_remarks || '—' },
      { header: 'Installation Status', accessor: () => 'Installed' },
      {
        header: 'Verify Status',
        accessor: (r: UpRescoSiteRow) => {
          const st = Number(r.inst_verify_status);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
    ];

    if (activeTab === 'approved_rejected') {
      base.push(
        { header: 'Verify By', accessor: (r: UpRescoSiteRow) => r.inst_verify_by || '—' },
        { header: 'Verify Remarks', accessor: (r: UpRescoSiteRow) => r.inst_verify_remarks || '—' }
      );
    }

    return base;
  }, [activeTab]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `UP_Resco_Verify_${activeTab}`;
  const fileTitle = `UP Resco Installation Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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

  // Helper to render image cell with thumbnail & lightbox
  const renderImageThumbnail = (imgSrc?: string | null, label = 'Photo') => {
    if (!imgSrc || imgSrc === '—' || String(imgSrc).trim() === '' || String(imgSrc).toLowerCase() === 'null') {
      return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
    }
    const fullUrl = resolveUpMediaUrl(imgSrc, 'resco');
    return (
      <button
        type="button"
        onClick={() => setLightboxUrl(fullUrl)}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          padding: 2,
          background: '#ffffff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        title={`Click to view ${label}`}
      >
        <img
          src={fullUrl}
          alt={label}
          style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </button>
    );
  };

  // Top KPI values
  const totalSiteCount = detailSummary?.total ?? (verifyPending.length + verifyComplete.length);
  const installedCount = detailSummary?.complete ?? (verifyPending.length + verifyComplete.length);
  const pendingCount = detailSummary?.verify_pending ?? verifyPending.length;
  const approvedCount = detailSummary?.verify_approved ?? verifyComplete.filter((s) => Number(s.inst_verify_status) === 1).length;
  const rejectedCount = detailSummary?.verify_reject ?? verifyComplete.filter((s) => Number(s.inst_verify_status) === 2).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Verify UP Resco Installation"
        subtitle="Review vendor proof of installations, inspect rooftop solar photos & meter equipment, and verify sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Resco Installation', href: '/vendor-management/up/resco/installation/dashboard' },
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

      {/* ── Top 5 KPI Metric Cards ── */}
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
          label="Total Sites"
          value={totalSiteCount}
          sub={`Assigned: ${detailSummary?.assigned ?? totalSiteCount} | Unassigned: ${detailSummary?.not_assigned ?? 0}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={installedCount}
          sub={`Pending Inst: ${detailSummary?.pending ?? 0}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verify Pending"
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
          label="Verified Approved"
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
          label="Verified Rejected"
          value={rejectedCount}
          sub="Requires re-installation"
        />
      </div>

      {/* ── Report Wise Bifurcation & Volume Filter Card ── */}
      <div>
        {/* Row 1: Report Wise Bifurcation */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)', marginBottom: 8 }}>
            Report Wise Bifurcation:
          </div>
          <div className="asw-bifurcation-row">
            <button
              type="button"
              className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('pending');
                pagination.setPage(1);
              }}
            >
              Verification Pending
              <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
                {verifyPending.length}
              </span>
            </button>
            <button
              type="button"
              className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('approved_rejected');
                pagination.setPage(1);
              }}
            >
              Approved / Rejected Resco Data
              <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
                {verifyComplete.length}
              </span>
            </button>
          </div>
        </div>

     
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'UP Resco Installation Pending Verification' : 'UP Resco Installation Verified List (Approved / Rejected)'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} site{filteredList.length === 1 ? '' : 's'} with rooftop solar hardware serials & proof images
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {availableVolumes.length > 0 && (
                <select
                  id="verify_volume_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={volumeFilter}
                  onChange={(e) => {
                    setVolumeFilter(e.target.value);
                    pagination.setPage(1);
                  }}
                  aria-label="Filter by volume"
                >
                  <option value="all">All Volumes</option>
                  {availableVolumes.map((vol) => (
                    <option key={vol} value={vol}>
                      Volume {vol}
                    </option>
                  ))}
                </select>
              )}

              {(searchQuery.trim() !== '' || volumeFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setVolumeFilter('all');
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
                placeholder="Search site, UID, serials, district..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2200 }}>
            <thead className="ax-table__head">
              <tr>
                {/* Requested 24 Fields:
                    Sr. No. | UID | State | District | Site Name | Contact Person | Contact Number |
                    Solar Meter No. | Inverter No. | Net/Smart Meter No. | Loger No. | Panel No. |
                    System Image | Inverter Image | Panel Image | Net Meter/Smart Meter Image | Loger Image |
                    Latitude | Longitude | Inst.Remarks | Installation Status | Verify Status |
                    [Verify By | Verify Remarks] (in approved_rejected) OR [Action] (in pending)
                */}
                <th className="ax-table__th" style={{ textAlign: 'center', width: 60 }}>Sr. No.</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Loger No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Net Meter/Smart Meter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Inst.Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Installation Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>

                {/* Approved and reject has Verify By & Verify Remarks, ONLY NO ACTION */}
                {activeTab === 'approved_rejected' ? (
                  <>
                    <th className="ax-table__th">Verify By</th>
                    <th className="ax-table__th">Verify Remarks</th>
                  </>
                ) : (
                  <th className="ax-table__th" style={{ textAlign: 'center', width: 140 }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'approved_rejected' ? 24 : 23} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation proof records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'approved_rejected' ? 24 : 23} style={centerCell}>
                    <TableEmptyState
                      title="No installation records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: UpRescoSiteRow, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const verifyStatus = Number(row.inst_verify_status);
                  const lat = row.inst_latitude;
                  const lng = row.inst_longitude;
                  const hasGps = lat && lng && lat !== '0.0' && lng !== '0.0';

                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ fontWeight: 600, textAlign: 'center' }}>
                        {globalIdx}
                      </td>

                      {/* 2. UID */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.unique_id || row.id}
                      </td>

                      {/* 3. State */}
                      <td className="ax-table__td">
                        {row.state || 'UTTAR PRADESH'}
                      </td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        {row.district || '—'}
                      </td>

                      {/* 5. Site Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || '—'}
                        </div>
                        {row.ca_no && (
                          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                            CA: {row.ca_no}
                          </div>
                        )}
                      </td>

                      {/* 6. Contact Person */}
                      <td className="ax-table__td">
                        {row.contact_person || '—'}
                      </td>

                      {/* 7. Contact Number */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                        {row.contact_number || '—'}
                      </td>

                      {/* 8. Solar Meter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.solarmeter_no || '—'}
                      </td>

                      {/* 9. Inverter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.inverter_no || row.Inverter_no || '—'}
                      </td>

                      {/* 10. Net/Smart Meter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.nm_sm_no || '—'}
                      </td>

                      {/* 11. Loger No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.loger_no || '—'}
                      </td>

                      {/* 12. Panel No. */}
                      <td className="ax-table__td">
                        {(() => {
                          const serials = parseModuleSerials(row.panel_no);
                          if (!serials.length) {
                            return <span>{row.panel_qty ? `${row.panel_qty} Panels` : '—'}</span>;
                          }
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 160 }}>
                              {serials.slice(0, 2).map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    color: '#334155',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {serials.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSiteForDetails(row)}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '1px 5px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: 'fit-content',
                                  }}
                                  title={serials.join('\n')}
                                >
                                  +{serials.length - 2} more
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 13. System Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderImageThumbnail(row.system_image, 'System')}
                      </td>

                      {/* 14. Inverter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderImageThumbnail(row.inverter_image || row.Inverter_image || (row as any).inverter_img, 'Inverter')}
                      </td>

                      {/* 15. Panel Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderImageThumbnail(row.panel_image || (row as any).panel_img, 'Panel')}
                      </td>

                      {/* 16. Net Meter/Smart Meter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderImageThumbnail(row.nm_sm_image || (row as any).meter_image, 'Net/Smart Meter')}
                      </td>

                      {/* 17. Loger Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {renderImageThumbnail(row.loger_image, 'Loger')}
                      </td>

                      {/* 18. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {lat || '—'}
                      </td>

                      {/* 19. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {lng ? (
                          hasGps ? (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                              title={`GPS: ${lat}, ${lng} (Click to open map)`}
                            >
                              <span>{lng}</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          ) : (
                            lng
                          )
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 20. Inst.Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 170, fontSize: 11, lineHeight: 1.3 }}>
                        {row.inst_remarks || '—'}
                      </td>

                      {/* 21. Installation Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                          Installed
                        </span>
                      </td>

                      {/* 22. Verify Status */}
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

                      {/* In approved_rejected: 23. Verify By & 24. Verify Remarks (NO ACTION) */}
                      {activeTab === 'approved_rejected' ? (
                        <>
                          <td className="ax-table__td">
                            {row.inst_verify_by || '—'}
                          </td>
                          <td className="ax-table__td" style={{ maxWidth: 180, fontSize: 11, color: row.inst_verify_remarks ? '#b45309' : undefined }}>
                            {row.inst_verify_remarks || '—'}
                          </td>
                        </>
                      ) : (
                        /* In pending: Action Button */
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setSelectedSiteForDetails(row)}
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              style={{
                                padding: '4px 8px',
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
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSiteForAction(row);
                                setActionStatus(String(row.inst_verify_status ?? '1'));
                                setActionRemarks(row.inst_verify_remarks || '');
                              }}
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{
                                padding: '4px 10px',
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
        title="UP Resco Installation Site Details"
        subtitle={
          selectedSiteForDetails
            ? `Site ID: #${selectedSiteForDetails.id} • Building: ${selectedSiteForDetails.site_name} • District: ${selectedSiteForDetails.district}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && activeTab === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    const site = selectedSiteForDetails;
                    setSelectedSiteForDetails(null);
                    setSelectedSiteForAction(site);
                    setActionStatus(String(site.inst_verify_status ?? '1'));
                    setActionRemarks(site.inst_verify_remarks || '');
                  }}
                  className="ax-btn ax-btn--primary"
                  style={{
                    padding: '6px 14px',
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
              className="ax-btn ax-btn--secondary"
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Work Order / Unique ID: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedSiteForDetails.unique_id || selectedSiteForDetails.wo_no || selectedSiteForDetails.id}</strong>
                {selectedSiteForDetails.ca_no && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    CA No: <strong style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.ca_no}</strong>
                  </span>
                )}
                {selectedSiteForDetails.sanction_load && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Sanction: <strong>{selectedSiteForDetails.sanction_load} kW</strong>
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

            {/* Grid 1: Building & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Building & Contact Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site & Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Site Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.site_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span>{selectedSiteForDetails.dept_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>CA Number:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.ca_no || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact Person:</span>
                  <span>{selectedSiteForDetails.contact_person || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact Number:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.contact_number || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Vendor:</span>
                  <span>{selectedSiteForDetails.vendor_name || selectedSiteForDetails.vendors?.name || '—'}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>UTTAR PRADESH</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Address:</span>
                  <span>{selectedSiteForDetails.address || '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedSiteForDetails.inst_latitude && selectedSiteForDetails.inst_longitude && selectedSiteForDetails.inst_latitude !== '0.0' ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.inst_latitude},${selectedSiteForDetails.inst_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
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

            {/* Grid 2: Rooftop Hardware & Solar Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Rooftop Solar & Equipment Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Sanction Load</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    {selectedSiteForDetails.sanction_load ? `${selectedSiteForDetails.sanction_load} kW` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Plant SC</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.plant_sc || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Inverter Make & No</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.inverter_make ? `${selectedSiteForDetails.inverter_make} - ` : ''}
                    {selectedSiteForDetails.inverter_no || selectedSiteForDetails.Inverter_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Meter No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.solarmeter_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Net/Smart Meter No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.nm_sm_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Datalogger No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.loger_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Panel Details</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.panel_make ? `${selectedSiteForDetails.panel_make} ` : ''}
                    {selectedSiteForDetails.panel_wp ? `${selectedSiteForDetails.panel_wp}Wp ` : ''}
                    {selectedSiteForDetails.panel_qty ? `(${selectedSiteForDetails.panel_qty} Nos)` : ''}
                    {!selectedSiteForDetails.panel_make && !selectedSiteForDetails.panel_wp && !selectedSiteForDetails.panel_qty && '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Installation Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.inst_date || '—'}</div>
                </div>
              </div>

              {/* Panel Serial Numbers */}
              <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Solar Panel Serial Numbers:
                </div>
                {(() => {
                  const serials = parseModuleSerials(selectedSiteForDetails.panel_no);
                  if (!serials.length) {
                    return <span style={{ color: '#94a3b8', fontSize: 12 }}>No panel serials recorded</span>;
                  }
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {serials.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: 6,
                            color: '#1e293b',
                            fontWeight: 600,
                          }}
                        >
                          #{idx + 1}: {s}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Grid 3: Photographic Evidence (5 Photos) */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12, letterSpacing: '0.04em' }}>
                Photographic Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {/* Photo 1: System Image */}
                {(() => {
                  const img = selectedSiteForDetails.system_image;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        System Photo
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveUpMediaUrl(img, 'resco'))}
                        >
                          <img
                            src={resolveUpMediaUrl(img, 'resco')}
                            alt="System"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}

                {/* Photo 2: Inverter Image */}
                {(() => {
                  const img = selectedSiteForDetails.inverter_image || (selectedSiteForDetails as any).inverter_img;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Inverter Photo
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveUpMediaUrl(img, 'resco'))}
                        >
                          <img
                            src={resolveUpMediaUrl(img, 'resco')}
                            alt="Inverter"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}

                {/* Photo 3: Panel Image */}
                {(() => {
                  const img = selectedSiteForDetails.panel_image || (selectedSiteForDetails as any).panel_img;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Solar Panels Photo
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveUpMediaUrl(img, 'resco'))}
                        >
                          <img
                            src={resolveUpMediaUrl(img, 'resco')}
                            alt="Solar Panels"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}

                {/* Photo 4: Net Meter / Smart Meter Image */}
                {(() => {
                  const img = selectedSiteForDetails.nm_sm_image || (selectedSiteForDetails as any).meter_image;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Net Meter / Smart Meter
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveUpMediaUrl(img, 'resco'))}
                        >
                          <img
                            src={resolveUpMediaUrl(img, 'resco')}
                            alt="Net Meter / Smart Meter"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Image Available</div>
                      )}
                    </div>
                  );
                })()}

                {/* Photo 5: Loger Image */}
                {(() => {
                  const img = selectedSiteForDetails.loger_image;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Loger Photo
                      </div>
                      {img ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveUpMediaUrl(img, 'resco'))}
                        >
                          <img
                            src={resolveUpMediaUrl(img, 'resco')}
                            alt="Loger"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view full image</div>
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
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Remarks & Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.inst_remarks || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified By:</span>
                <span>{selectedSiteForDetails.inst_verify_by || '—'}</span>

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
        title="Verify Installation Status"
        subtitle={
          selectedSiteForAction
            ? `Site: ${selectedSiteForAction.site_name} • District: ${selectedSiteForAction.district} • ID: #${selectedSiteForAction.id}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedSiteForAction(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter audit remarks or rejection reasons..."
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
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setLightboxUrl(null)}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            Close
          </button>
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

export default UPRescoVerifyInstallation;
