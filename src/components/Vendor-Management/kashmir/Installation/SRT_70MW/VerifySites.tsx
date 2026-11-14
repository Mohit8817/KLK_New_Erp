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
  kashmirAdminService,
  resolveKashmirMediaUrl,
  type InstallationVerificationItem,
} from '../../kashmir-services';

type Row = InstallationVerificationItem;
type TabType = 'pending' | 'verified';

/* ───────── Responsive page CSS (Exact reference matching Karnataka SWP VerifyInstallation) ───────── */
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

function parseModuleSerials(raw?: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return [];
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

const fmtSiteName = (sn: any): string => {
  if (!sn) return '—';
  if (typeof sn === 'string') {
    if (sn.trim().startsWith('{')) {
      try {
        const p = JSON.parse(sn);
        if (p && typeof p === 'object') {
          const keys = Object.keys(p);
          return keys.length > 0 ? keys.join(', ') : sn;
        }
      } catch {}
    }
    return sn;
  }
  if (typeof sn === 'object' && sn !== null) {
    const keys = Object.keys(sn);
    return keys.length > 0 ? keys.join(', ') : '—';
  }
  return String(sn);
};

function MediaFileThumbnail({
  file,
  alt = 'Site Photo',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const fullUrl = resolveKashmirMediaUrl(file);
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <button
      type="button"
      onClick={() => onClick(fullUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      title={`Click to preview: ${file.split('/').pop()}`}
    >
      {!imgError && (isDirectImage || ext === 'heic') ? (
        <img
          src={fullUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#f1f5f9',
            borderRadius: 4,
            padding: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: 1 }}>
            {ext || 'FILE'}
          </span>
        </div>
      )}
    </button>
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

export function VerifySites() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingList, setPendingList] = useState<Row[]>([]);
  const [verifiedList, setVerifiedList] = useState<Row[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Image / file preview lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<Row | null>(null);

  // Verify action modal
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<Row | null>(null);
  const [actionStatus, setActionStatus] = useState<'1' | '2'>('1'); // 1 approve, 2 reject
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Fetch API: GET /kashmir/srt70mw/installation/view-installation
  const fetchInstallationData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await kashmirAdminService.getViewInstallation();
      const d = res?.data || {};
      setPendingList(Array.isArray(d.verification) ? d.verification : []);
      setVerifiedList(Array.isArray(d.verified) ? d.verified : []);
      setKpiData(d);
    } catch (err: any) {
      console.error('Failed to load Kashmir installation verification data:', err);
      setErrorMsg(err?.message || 'Failed to load installation data.');
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

  // Submit Action Popup (POST /kashmir/srt70mw/installation/verify-installation-status)
  const handleActionSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedSiteForAction) return;

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const formData = new FormData();
      formData.append('id', String(selectedSiteForAction.id));
      formData.append('status', String(statusNum));
      formData.append('inst_verify_status', String(statusNum));
      if (actionRemarks.trim()) {
        formData.append('inst_verify_remarks', actionRemarks.trim());
        formData.append('inst_verify_remark', actionRemarks.trim());
        formData.append('remarks', actionRemarks.trim());
      }
      if (verifyFile) formData.append('file', verifyFile);

      const res = await kashmirAdminService.verifyInstallationStatus(formData);

      const updatedSite: Row = {
        ...selectedSiteForAction,
        inst_verify_status: statusNum,
        inst_verify_remark: actionRemarks.trim(),
      };

      if (statusNum === 1 || statusNum === 2) {
        setPendingList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifiedList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifiedList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setPendingList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update KPI counts dynamically
      setKpiData((prev: any) => {
        const next = { ...prev };
        if (statusNum === 1) {
          next.verifypending = Math.max(0, (next.verifypending || 0) - 1);
          next.approvedsite = (next.approvedsite || 0) + 1;
        } else if (statusNum === 2) {
          next.verifypending = Math.max(0, (next.verifypending || 0) - 1);
          next.rejectsite = (next.rejectsite || 0) + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(res?.message || 'Status updated successfully.');
      setSelectedSiteForAction(null);
      setActionRemarks('');
      setVerifyFile(null);
    } catch (err: any) {
      console.error('Verify status update failed:', err);
      setErrorMsg(err?.message || 'Failed to update verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openVerify = (row: Row) => {
    setSelectedSiteForAction(row);
    setActionStatus(String(row.inst_verify_status === 1 ? '1' : row.inst_verify_status || '1') as '1' | '2');
    setActionRemarks(row.inst_verify_remark || '');
    setVerifyFile(null);
  };

  const activeList = activeTab === 'pending' ? pendingList : verifiedList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((site) => {
      const vName = (site.vendor_name || (site.inst_vendor ? `Vendor #${site.inst_vendor}` : '')).toLowerCase();
      const sName = fmtSiteName(site.site_name).toLowerCase();
      const dist = (site.district || '').toLowerCase();
      const person = (site.contact_person || '').toLowerCase();
      const phone = (site.contact_number || '').toLowerCase();
      const solarMeter = (site.solarmeter_no || '').toLowerCase();
      const inv = (site.inverter_no || '').toLowerCase();
      const nmSm = (site.nm_sm_no || '').toLowerCase();
      const loger = (site.loger_no || '').toLowerCase();
      const panels = parseModuleSerials(site.panel_no).join(' ').toLowerCase();
      const vRemarks = (site.inst_remarks || '').toLowerCase();
      const qaRemarks = (site.inst_verify_remark || '').toLowerCase();
      const idStr = String(site.id);
      return (
        vName.includes(q) ||
        sName.includes(q) ||
        dist.includes(q) ||
        person.includes(q) ||
        phone.includes(q) ||
        solarMeter.includes(q) ||
        inv.includes(q) ||
        nmSm.includes(q) ||
        loger.includes(q) ||
        panels.includes(q) ||
        vRemarks.includes(q) ||
        qaRemarks.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [activeList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: Row, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r: Row) => r.state || 'Kashmir' },
      { header: 'District', accessor: (r: Row) => r.district || '—' },
      { header: 'Site Name', accessor: (r: Row) => fmtSiteName(r.site_name) },
      { header: 'Vendor Name', accessor: (r: Row) => r.vendor_name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : '—') },
      { header: 'Contact Person', accessor: (r: Row) => r.contact_person || '—' },
      { header: 'Contact Number', accessor: (r: Row) => r.contact_number || '—' },
      { header: 'Solar Meter No.', accessor: (r: Row) => r.solarmeter_no || '—' },
      { header: 'Inverter No.', accessor: (r: Row) => r.inverter_no || '—' },
      { header: 'Net/Smart Meter No.', accessor: (r: Row) => r.nm_sm_no || '—' },
      {
        header: 'Panel No.',
        accessor: (r: Row) => parseModuleSerials(r.panel_no).join(', ') || '—',
      },
      { header: 'Loger No.', accessor: (r: Row) => r.loger_no || '—' },
      { header: 'Latitude', accessor: (r: Row) => r.inst_latitude ? String(r.inst_latitude) : '—' },
      { header: 'Longitude', accessor: (r: Row) => r.inst_longitude ? String(r.inst_longitude) : '—' },
      { header: 'Vendor Remarks', accessor: (r: Row) => r.inst_remarks || '—' },
      {
        header: 'Verification Status',
        accessor: (r: Row) => {
          const st = Number(r.inst_verify_status ?? 0);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      { header: 'Verification Remarks', accessor: (r: Row) => r.inst_verify_remark || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Kashmir_SRT70MW_Verify_${activeTab}`;
  const fileTitle = `Kashmir SRT 70MW Installation Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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

  // Top KPI Card computed counts
  const totalSiteCount = kpiData?.totalsite ?? (pendingList.length + verifiedList.length);
  const completeInstallCount = kpiData?.complete ?? (pendingList.length + verifiedList.length);
  const verifyPendingCount = kpiData?.verifypending ?? pendingList.length;
  const approvedCount = kpiData?.approvedsite ?? verifiedList.filter((s) => Number(s.inst_verify_status) === 1).length;
  const rejectedCount = kpiData?.rejectsite ?? verifiedList.filter((s) => Number(s.inst_verify_status) === 2).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Verify Kashmir SRT 70MW Installation"
        subtitle="Review vendor proof of installations, inspect geo-tagged module photos, and approve sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Kashmir SRT 70MW', href: '/vendor-management/kashmir/srt70mw/dashboard' },
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

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
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
          sub={`Assigned: ${totalSiteCount} | Pending: ${kpiData?.pendingsite ?? 0}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={completeInstallCount}
          sub={`Complete installations: ${completeInstallCount}`}
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
          value={verifyPendingCount}
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

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verify Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'verified' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Kashmir SRT 70MW Installation Pending Verification' : 'Kashmir SRT 70MW Installation Verified List'}
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
                placeholder="Search vendor, site, district, meter no..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1800 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name / Location</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">Contact Person & Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th">Loger No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Net/Smart Meter</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Vendor Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify File</th>
                <th className="ax-table__th">QA Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={21} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Kashmir installation verification data...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={21} style={centerCell}>
                    <TableEmptyState
                      title="No installation records found"
                      description={searchQuery ? 'Try adjusting your search query' : 'No installation submissions found under this category'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: Row, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const statusNum = Number(row.inst_verify_status ?? 0);
                  const isApproved = statusNum === 1;
                  const isRejected = statusNum === 2;
                  const siteName = fmtSiteName(row.site_name);
                  const panelSerials = parseModuleSerials(row.panel_no);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{row.state || 'Kashmir'}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</div>
                        {row.inst_latitude && row.inst_longitude && row.inst_latitude !== '0.0' && row.inst_longitude !== '0.0' && (
                          <a
                            href={`https://www.google.com/maps?q=${row.inst_latitude},${row.inst_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              color: '#2563eb',
                              textDecoration: 'none',
                              marginTop: 2,
                            }}
                            title={`GPS: ${row.inst_latitude}, ${row.inst_longitude}`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>GPS Map</span>
                          </a>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : '—')}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.contact_person || '—'}</div>
                        {row.contact_number && (
                          <div style={{ fontSize: 11, color: '#0284c7', fontFamily: 'monospace' }}>
                            {row.contact_number}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.solarmeter_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.inverter_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.nm_sm_no || '—'}
                      </td>
                      <td className="ax-table__td">
                        {!panelSerials.length ? (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 170 }}>
                            {panelSerials.slice(0, 2).map((s, i) => (
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
                            {panelSerials.length > 2 && (
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
                                  padding: '1px 6px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: 'fit-content',
                                }}
                                title={panelSerials.join('\n')}
                              >
                                +{panelSerials.length - 2} more
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.loger_no || '—'}
                      </td>

                      {/* Image 1: System Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.system_image}
                          alt="System Image"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* Image 2: Inverter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.inverter_image}
                          alt="Inverter Image"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* Image 3: Panel Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.panel_image}
                          alt="Panel Image"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* Image 4: Net Meter / Smart Meter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.nm_sm_image}
                          alt="Net Meter / Smart Meter Image"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* Image 5: Loger Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.loger_image}
                          alt="Loger Image"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* Vendor Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, fontSize: 11, lineHeight: 1.3 }}>
                        {row.inst_remarks ? <span>{row.inst_remarks}</span> : <span style={{ color: 'var(--ax-text-muted)' }}>—</span>}
                      </td>

                      {/* Verify File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.inst_verify_file}
                          alt="Verify File"
                          onClick={setLightboxUrl}
                        />
                      </td>

                      {/* QA Verify Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, fontSize: 11, lineHeight: 1.3 }}>
                        {row.inst_verify_remark ? (
                          <span style={{ color: '#b45309', fontWeight: 600 }}>{row.inst_verify_remark}</span>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Verification Status Badge */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action: Details & Locked/Verify Button */}
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
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {isApproved ? (
                            <button
                              type="button"
                              disabled
                              title="Installation has been Approved (Locked)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
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
                          )}
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

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Kashmir SRT 70MW Installation Details"
        subtitle={
          selectedSiteForDetails
            ? `Site ID: #${selectedSiteForDetails.id} • Site: ${fmtSiteName(selectedSiteForDetails.site_name)} • District: ${selectedSiteForDetails.district || '—'}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                Number(selectedSiteForDetails.inst_verify_status) === 1 ? (
                  <button
                    type="button"
                    disabled
                    title="Installation has been Approved (Locked)"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked (Approved)
                  </button>
                ) : (
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Verify This Site
                  </button>
                )
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Vendor: </span>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>
                  {selectedSiteForDetails.vendor_name || (selectedSiteForDetails.inst_vendor ? `Vendor #${selectedSiteForDetails.inst_vendor}` : '—')}
                </strong>
                <span style={{ marginLeft: 16, fontSize: 12, color: '#64748b' }}>
                  District: <strong>{selectedSiteForDetails.district || '—'}</strong>
                </span>
                {selectedSiteForDetails.contact_person && (
                  <span style={{ marginLeft: 16, fontSize: 12, color: '#64748b' }}>
                    Contact: <strong>{selectedSiteForDetails.contact_person}</strong>
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

            {/* Grid 1: Site Location & Contact Person */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site & Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Site Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtSiteName(selectedSiteForDetails.site_name)}</span>

                  <span style={{ color: '#64748b' }}>Contact Person:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.contact_person || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact Number:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.contact_number || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.state || 'Kashmir'}</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Geographic Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Latitude:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.inst_latitude ? String(selectedSiteForDetails.inst_latitude) : '—'}</span>

                  <span style={{ color: '#64748b' }}>Longitude:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.inst_longitude ? String(selectedSiteForDetails.inst_longitude) : '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Map:</span>
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

            {/* Grid 2: Hardware & Equipment Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Equipment & Hardware Serial Numbers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Meter No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedSiteForDetails.solarmeter_no || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Inverter Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedSiteForDetails.inverter_no || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Net/Smart Meter No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedSiteForDetails.nm_sm_no || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Loger Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedSiteForDetails.loger_no || '—'}</div>
                </div>
              </div>

              {/* Solar Panel Serial Numbers */}
              <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Solar Panel Serial Numbers:
                </div>
                {(() => {
                  const serials = parseModuleSerials(selectedSiteForDetails.panel_no);
                  if (!serials.length) {
                    return <span style={{ color: '#94a3b8', fontSize: 12 }}>No panel serial numbers recorded</span>;
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

            {/* Grid 3: Installation Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12, letterSpacing: '0.04em' }}>
                Installation Photographic Proof
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {/* System Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    System Image
                  </div>
                  {selectedSiteForDetails.system_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.system_image!))}
                    >
                      <img
                        src={resolveKashmirMediaUrl(selectedSiteForDetails.system_image)}
                        alt="System Image"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                    </div>
                  ) : (
                    <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>Not Uploaded</div>
                  )}
                </div>

                {/* Inverter Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Inverter Image
                  </div>
                  {selectedSiteForDetails.inverter_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.inverter_image!))}
                    >
                      <img
                        src={resolveKashmirMediaUrl(selectedSiteForDetails.inverter_image)}
                        alt="Inverter Image"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                    </div>
                  ) : (
                    <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>Not Uploaded</div>
                  )}
                </div>

                {/* Panel Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Panel Image
                  </div>
                  {selectedSiteForDetails.panel_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.panel_image!))}
                    >
                      <img
                        src={resolveKashmirMediaUrl(selectedSiteForDetails.panel_image)}
                        alt="Panel Image"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                    </div>
                  ) : (
                    <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>Not Uploaded</div>
                  )}
                </div>

                {/* Net Meter / Smart Meter Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Net / Smart Meter Image
                  </div>
                  {selectedSiteForDetails.nm_sm_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.nm_sm_image!))}
                    >
                      <img
                        src={resolveKashmirMediaUrl(selectedSiteForDetails.nm_sm_image)}
                        alt="Net / Smart Meter"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                    </div>
                  ) : (
                    <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>Not Uploaded</div>
                  )}
                </div>

                {/* Loger Image */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                    Loger Image
                  </div>
                  {selectedSiteForDetails.loger_image ? (
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.loger_image!))}
                    >
                      <img
                        src={resolveKashmirMediaUrl(selectedSiteForDetails.loger_image)}
                        alt="Loger Image"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                    </div>
                  ) : (
                    <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>Not Uploaded</div>
                  )}
                </div>

                {/* Verify File */}
                {selectedSiteForDetails.inst_verify_file && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Verification File
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveKashmirMediaUrl(selectedSiteForDetails.inst_verify_file!))}
                    >
                      {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(selectedSiteForDetails.inst_verify_file) ? (
                        <img
                          src={resolveKashmirMediaUrl(selectedSiteForDetails.inst_verify_file)}
                          alt="Verify File"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        />
                      ) : (
                        <div style={{ padding: '28px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.5}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                            {selectedSiteForDetails.inst_verify_file.split('/').pop()}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview file</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 4: Remarks & Audit Log */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Audit & Verification Remarks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.inst_remarks || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.inst_verify_remark ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.inst_verify_remark || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Verify Installation Status ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedSiteForAction(null);
        }}
        title="Verify Installation Status"
        subtitle={
          selectedSiteForAction
            ? `Site: ${fmtSiteName(selectedSiteForAction.site_name)} • District: ${selectedSiteForAction.district} • ID: #${selectedSiteForAction.id}`
            : ''
        }
        maxWidth={500}
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
              Save Status
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
              onChange={(e) => setActionStatus(e.target.value as '1' | '2')}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
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
              placeholder="Enter installation verification remarks..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Attach Verification File (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
              className="ax-input"
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── File / Photo Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Photo / Document Preview"
        maxWidth={800}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 6,
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Original in New Tab
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
          <div style={{ textAlign: 'center', padding: 8, minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lightboxUrl) ? (
              <img
                src={lightboxUrl}
                alt="Photo preview"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('kash-lightbox-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : /\.pdf$/i.test(lightboxUrl) ? (
              <iframe
                src={lightboxUrl}
                title="PDF Preview"
                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <div
                id="kash-lightbox-fallback"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  padding: 24,
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.5}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  {lightboxUrl.split('/').pop()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', maxWidth: 360 }}>
                  File format: <strong>{lightboxUrl.split('.').pop()?.toUpperCase()}</strong>. You can preview or download below:
                </div>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Download / View File
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifySites;
