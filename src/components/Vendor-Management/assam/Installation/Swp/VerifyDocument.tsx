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
  assamAdminService,
  resolveAssamMediaUrl,
  type SiteInstallationItem,
} from '../../assam-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
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
      } catch {
        // ignore and fallback
      }
    }
    return trimmed.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return [String(raw)];
}

function MediaFileThumbnail({
  file,
  alt = 'Document Preview',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const fullUrl = resolveAssamMediaUrl(file);
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
            {ext || 'DOC'}
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
  maxWidth = 540,
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

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

export function VerifyDocument() {
  const [verificationPending, setVerificationPending] = useState<SiteInstallationItem[]>([]);
  const [verifiedList, setVerifiedList] = useState<SiteInstallationItem[]>([]);
  const [detailSummary, setDetailSummary] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Report Wise Bifurcation: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Details & Lightbox Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<SiteInstallationItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<SiteInstallationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // 2=Approved, 3=Rejected, 1=Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Fetch API 11: GET /assam/swp/installation/view-installation-document
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await assamAdminService.getViewInstallationDocument();
      setVerificationPending(res.verification);
      setVerifiedList(res.verified);
      setDetailSummary(res.detail || {});
    } catch (err: any) {
      console.error('Failed to load document verification data:', err);
      setErrorMsg(err?.message || 'Failed to fetch document verification list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Submit Action Popup (API 12: POST /assam/swp/installation/verify-installation-doc-status)
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
      const res = await assamAdminService.verifyInstallationDocStatus({
        id: selectedSiteForAction.id,
        status: statusNum,
        remarks: actionRemarks.trim() || undefined,
      });

      const updatedSite: SiteInstallationItem = {
        ...selectedSiteForAction,
        inst_doc_status: statusNum,
        inst_doc_remarks: actionRemarks.trim(),
        inst_doc_verify_date: new Date().toISOString(),
      };

      if (statusNum === 2 || statusNum === 3) {
        setVerificationPending((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifiedList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifiedList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerificationPending((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update detail counts dynamically
      setDetailSummary((prev: any) => {
        const oldStatus = Number(selectedSiteForAction.inst_doc_status);
        const next = { ...prev };
        if (oldStatus === 1 && statusNum === 2) {
          next.doc_pending = Math.max(0, (next.doc_pending || 0) - 1);
          next.doc_approved = (next.doc_approved || 0) + 1;
        } else if (oldStatus === 1 && statusNum === 3) {
          next.doc_pending = Math.max(0, (next.doc_pending || 0) - 1);
          next.doc_reject = (next.doc_reject || 0) + 1;
        } else if (oldStatus === 2 && statusNum === 3) {
          next.doc_approved = Math.max(0, (next.doc_approved || 0) - 1);
          next.doc_reject = (next.doc_reject || 0) + 1;
        } else if (oldStatus === 3 && statusNum === 2) {
          next.doc_reject = Math.max(0, (next.doc_reject || 0) - 1);
          next.doc_approved = (next.doc_approved || 0) + 1;
        } else if (oldStatus !== 1 && statusNum === 1) {
          if (oldStatus === 2) next.doc_approved = Math.max(0, (next.doc_approved || 0) - 1);
          if (oldStatus === 3) next.doc_reject = Math.max(0, (next.doc_reject || 0) - 1);
          next.doc_pending = (next.doc_pending || 0) + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(res.message || 'Document status updated successfully!');
      setSelectedSiteForAction(null);
      setActionStatus('');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Document action submit error:', err);
      setErrorMsg(err?.message || 'Failed to update document status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const currentList = activeTab === 'pending' ? verificationPending : verifiedList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((site) => {
      const fName = site.farmer_name?.toLowerCase() || '';
      const fatherName = site.father_name?.toLowerCase() || '';
      const contact = (site.farmer_contact || site.contact_no || '').toLowerCase();
      const aadhar = site.aadhar?.toLowerCase() || '';
      const dist = site.district?.toLowerCase() || '';
      const block = site.block?.toLowerCase() || '';
      const tehsil = site.tehsil?.toLowerCase() || '';
      const village = site.village?.toLowerCase() || '';
      const wo = site.wo_no?.toLowerCase() || '';
      const vfd = (site.vfd_no || site.motor_no || '').toLowerCase();
      const inv = (site.inverter_no || site.controller_no || '').toLowerCase();
      const mod = (Array.isArray(site.module_serial_no)
        ? site.module_serial_no.join(' ')
        : String(site.module_serial_no || site.panel_serials || '')
      ).toLowerCase();
      const doc = (site.inst_doc || site.document_file || '').toLowerCase();
      const remarks = (site.inst_doc_remarks || site.remarks || '').toLowerCase();
      const qaRemarks = (site.inst_doc_verify_remarks || '').toLowerCase();
      const idStr = String(site.id);
      return (
        fName.includes(q) ||
        fatherName.includes(q) ||
        contact.includes(q) ||
        aadhar.includes(q) ||
        dist.includes(q) ||
        block.includes(q) ||
        tehsil.includes(q) ||
        village.includes(q) ||
        wo.includes(q) ||
        vfd.includes(q) ||
        inv.includes(q) ||
        mod.includes(q) ||
        doc.includes(q) ||
        remarks.includes(q) ||
        qaRemarks.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<SiteInstallationItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SiteInstallationItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'ASSAM' },
      { header: 'District', accessor: (r: SiteInstallationItem) => r.district || '—' },
      { header: 'Block', accessor: (r: SiteInstallationItem) => r.block || '—' },
      { header: 'Tehsil', accessor: (r: SiteInstallationItem) => r.tehsil || '—' },
      { header: 'Village', accessor: (r: SiteInstallationItem) => r.village || '—' },
      { header: 'Farmer Name', accessor: (r: SiteInstallationItem) => r.farmer_name || '—' },
      { header: 'Father Name', accessor: (r: SiteInstallationItem) => r.father_name || '—' },
      { header: 'Contact No.', accessor: (r: SiteInstallationItem) => r.farmer_contact || r.contact_no || '—' },
      { header: 'Aadhar No.', accessor: (r: SiteInstallationItem) => r.aadhar || '—' },
      { header: 'Work Order No.', accessor: (r: SiteInstallationItem) => r.wo_no || '—' },
      { header: 'Volume', accessor: (r: SiteInstallationItem) => r.volume || '—' },
      { header: 'Pump Capacity', accessor: (r: SiteInstallationItem) => r.pump_capacity || '—' },
      { header: 'Pump Sub-Type', accessor: (r: SiteInstallationItem) => r.pump_sub_type || '—' },
      { header: 'VFD No.', accessor: (r: SiteInstallationItem) => r.vfd_no || r.motor_no || '—' },
      { header: 'Inverter No.', accessor: (r: SiteInstallationItem) => r.inverter_no || r.controller_no || '—' },
      {
        header: 'Module Serial No.',
        accessor: (r: SiteInstallationItem) => parseModuleSerials(r.module_serial_no || r.panel_serials).join(', ') || '—',
      },
      { header: 'Document File', accessor: (r: SiteInstallationItem) => r.inst_doc || r.document_file || '—' },
      { header: 'Submit Date', accessor: (r: SiteInstallationItem) => fmtDate(r.inst_doc_date || r.inst_date || r.created_at) },
      { header: 'Vendor Remarks', accessor: (r: SiteInstallationItem) => r.inst_doc_remarks || r.remarks || '—' },
      { header: 'QA Audit Remarks', accessor: (r: SiteInstallationItem) => r.inst_doc_verify_remarks || '—' },
      {
        header: 'Verify Status',
        accessor: (r: SiteInstallationItem) =>
          Number(r.inst_doc_status) === 2 ? 'Approved' : Number(r.inst_doc_status) === 3 ? 'Rejected' : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Assam_SWP_Document_${activeTab}`;
  const fileTitle = `Assam SWP Installation Document Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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
  const totalSiteCount = detailSummary?.total ?? (verificationPending.length + verifiedList.length);
  const completeInstall = detailSummary?.complete ?? (verificationPending.length + verifiedList.length);
  const docPending = detailSummary?.doc_pending ?? verificationPending.length;
  const docApproved = detailSummary?.doc_approved ?? verifiedList.filter((s) => Number(s.inst_doc_status) === 2).length;
  const docRejected = detailSummary?.doc_reject ?? verifiedList.filter((s) => Number(s.inst_doc_status) === 3).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Assam SWP Installation Document Verify List"
        subtitle="Validate handover documents, JCR certificates, warranty papers, and signed farmer vouchers"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Assam SWP', href: '/vendor-management/assam/swp/dashboard' },
          { label: 'Verify Document' },
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={completeInstall}
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
          label="Doc Pending"
          value={docPending}
          sub="Requires document verification"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          }
          tone="emerald"
          label="Document Approved"
          value={docApproved}
          sub="Documents validated & approved"
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
          label="Document Rejected"
          value={docRejected}
          sub="Requires vendor re-upload"
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
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verificationPending.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Assam SWP Document Verification Pending' : 'Assam SWP Document Verified Data'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} documentation record{filteredList.length === 1 ? '' : 's'} submitted by vendors
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
                placeholder="Search farmer, district, block, file..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block / Tehsil</th>
                <th className="ax-table__th">Village / GPS</th>
                <th className="ax-table__th">Farmer Details</th>
                <th className="ax-table__th">WO & Volume</th>
                <th className="ax-table__th">Pump Specs</th>
                <th className="ax-table__th">VFD No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Module Serial No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation documents...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <TableEmptyState
                      title="No document records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: SiteInstallationItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const docFile = row.inst_doc || row.document_file || (row as any).doc_file;
                  const statusNum = Number(row.inst_doc_status);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">ASSAM</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{row.block || '—'}</div>
                        {row.tehsil && <div style={{ fontSize: 11, color: '#64748b' }}>Tehsil: {row.tehsil}</div>}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.village || '—'}</div>
                        {row.post && (
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            Post: {row.post} {row.pin ? `- ${row.pin}` : ''}
                          </div>
                        )}
                        {row.latitude && row.longitude && row.latitude !== '0.0' && row.longitude !== '0.0' && (
                          <a
                            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
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
                            title={`GPS: ${row.latitude}, ${row.longitude} (Click to open map)`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>GPS Map</span>
                          </a>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ minWidth: 140 }}>
                          <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.farmer_name || '—'}</div>
                          {row.father_name && <div style={{ fontSize: 11, color: '#64748b' }}>S/o {row.father_name}</div>}
                          {row.aadhar && (
                            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                              UID: {row.aadhar}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: 12 }}>
                          <div><span style={{ color: '#64748b' }}>WO:</span> <strong style={{ fontFamily: 'monospace' }}>{row.wo_no || '—'}</strong></div>
                          {row.volume && <div><span style={{ color: '#64748b' }}>Vol:</span> <strong>{row.volume}</strong></div>}
                          {row.wo_date && <div style={{ fontSize: 11, color: '#64748b' }}>{row.wo_date}</div>}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.pump_capacity || '—'}</div>
                          {row.pump_sub_type && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                borderRadius: 4,
                                fontWeight: 600,
                                display: 'inline-block',
                                marginTop: 2,
                              }}
                            >
                              {row.pump_sub_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.vfd_no || row.motor_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.inverter_no || row.controller_no || '—'}
                      </td>
                      <td className="ax-table__td">
                        {(() => {
                          const serials = parseModuleSerials(row.module_serial_no || row.panel_serials || row.pump_type);
                          if (!serials.length) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 170 }}>
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
                                    padding: '1px 6px',
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

                      {/* Document File Thumbnail (Direct in Table with click to preview) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={docFile}
                          alt={`${row.farmer_name || 'Farmer'} Document`}
                          onClick={setLightboxUrl}
                        />
                      </td>

                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {fmtDate(row.inst_doc_date || row.inst_date || row.created_at)}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 170, fontSize: 11, lineHeight: 1.3 }}>
                        {(row.inst_doc_remarks || row.remarks) && (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Vendor: </span>
                            <span>{row.inst_doc_remarks || row.remarks}</span>
                          </div>
                        )}
                        {row.inst_doc_verify_remarks && (
                          <div style={{ marginTop: (row.inst_doc_remarks || row.remarks) ? 3 : 0, color: '#b45309' }}>
                            <span style={{ fontWeight: 600 }}>QA: </span>
                            <span>{row.inst_doc_verify_remarks}</span>
                          </div>
                        )}
                        {!row.inst_doc_remarks && !row.remarks && !row.inst_doc_verify_remarks && (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {statusNum === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : statusNum === 3 ? (
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
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {Number(row.inst_doc_status) === 2 || Number(row.inst_doc_status) === 3 ? (
                            <button
                              type="button"
                              disabled
                              title={`Document has been ${Number(row.inst_doc_status) === 2 ? 'Approved' : 'Rejected'} (Locked)`}
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
                              onClick={() => {
                                setSelectedSiteForAction(row);
                                setActionStatus(String(row.inst_doc_status === 1 ? '2' : row.inst_doc_status || '2'));
                                setActionRemarks(row.inst_doc_remarks || '');
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
        title="Assam SWP Installation Document Details"
        subtitle={
          selectedSiteForDetails
            ? `Site ID: #${selectedSiteForDetails.id} • Farmer: ${selectedSiteForDetails.farmer_name} • District: ${selectedSiteForDetails.district}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                Number(selectedSiteForDetails.inst_doc_status) === 2 || Number(selectedSiteForDetails.inst_doc_status) === 3 ? (
                  <button
                    type="button"
                    disabled
                    title={`Document has been ${Number(selectedSiteForDetails.inst_doc_status) === 2 ? 'Approved' : 'Rejected'} (Locked)`}
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
                    Locked ({Number(selectedSiteForDetails.inst_doc_status) === 2 ? 'Approved' : 'Rejected'})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const site = selectedSiteForDetails;
                      setSelectedSiteForDetails(null);
                      setSelectedSiteForAction(site);
                      setActionStatus(String(site.inst_doc_status === 1 ? '2' : site.inst_doc_status || '2'));
                      setActionRemarks(site.inst_doc_remarks || '');
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
                    Verify This Document
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Work Order: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedSiteForDetails.wo_no || '—'}</strong>
                {selectedSiteForDetails.volume && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Volume: <strong>{selectedSiteForDetails.volume}</strong>
                  </span>
                )}
                {selectedSiteForDetails.wo_date && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Date: {selectedSiteForDetails.wo_date}
                  </span>
                )}
              </div>
              <div>
                {Number(selectedSiteForDetails.inst_doc_status) === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : Number(selectedSiteForDetails.inst_doc_status) === 3 ? (
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
                  Beneficiary Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Farmer Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.farmer_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Father's Name:</span>
                  <span>{selectedSiteForDetails.father_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact No:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.farmer_contact || selectedSiteForDetails.contact_no || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Aadhar No:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.aadhar || '—'}</span>

                  <span style={{ color: '#64748b' }}>Gender:</span>
                  <span style={{ textTransform: 'capitalize' }}>{selectedSiteForDetails.gender || '—'}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>ASSAM</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Tehsil / Block:</span>
                  <span>{selectedSiteForDetails.tehsil || '—'} / {selectedSiteForDetails.block || '—'}</span>

                  <span style={{ color: '#64748b' }}>Village / Post:</span>
                  <span>{selectedSiteForDetails.village || '—'} (Post: {selectedSiteForDetails.post || '—'}, PIN: {selectedSiteForDetails.pin || '—'})</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedSiteForDetails.latitude && selectedSiteForDetails.longitude && selectedSiteForDetails.latitude !== '0.0' ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.latitude},${selectedSiteForDetails.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {selectedSiteForDetails.latitude}, {selectedSiteForDetails.longitude} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Hardware & Pump Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Pump & Equipment Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Pump Capacity</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.pump_capacity || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Pump Sub-Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.pump_sub_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Water Depth Level</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.water_depth_level || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>VFD Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.vfd_no || selectedSiteForDetails.motor_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Inverter Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                    {selectedSiteForDetails.inverter_no || selectedSiteForDetails.controller_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Installation Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.inst_date || '—'}</div>
                </div>
              </div>

              {/* Module Serial Numbers List */}
              <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Solar Module Serial Numbers:
                </div>
                {(() => {
                  const serials = parseModuleSerials(
                    selectedSiteForDetails.module_serial_no || selectedSiteForDetails.panel_serials || selectedSiteForDetails.pump_type
                  );
                  if (!serials.length) {
                    return <span style={{ color: '#94a3b8', fontSize: 12 }}>No module serials recorded</span>;
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

            {/* Grid 3: Uploaded Document & Photos */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12, letterSpacing: '0.04em' }}>
                Handover Document & Photographic Proof
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {/* Document File */}
                {(() => {
                  const doc = selectedSiteForDetails.inst_doc || selectedSiteForDetails.document_file;
                  return (
                    <div style={{ border: '2px solid #2563eb', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#eff6ff', fontSize: 11, fontWeight: 700, color: '#1d4ed8', borderBottom: '1px solid #bfdbfe' }}>
                        Handover Document
                      </div>
                      {doc ? (
                        <div
                          style={{ padding: 10, cursor: 'pointer', background: '#f8fafc' }}
                          onClick={() => setLightboxUrl(resolveAssamMediaUrl(doc))}
                        >
                          {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc) ? (
                            <img
                              src={resolveAssamMediaUrl(doc)}
                              alt="Handover Document"
                              style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.5}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                                {doc.split('/').pop()}
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview document</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Document Uploaded</div>
                      )}
                    </div>
                  );
                })()}

                {/* Installation Photo 1 */}
                {selectedSiteForDetails.farmer_with_module && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Farmer with Module
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveAssamMediaUrl(selectedSiteForDetails.farmer_with_module!))}
                    >
                      <img
                        src={resolveAssamMediaUrl(selectedSiteForDetails.farmer_with_module)}
                        alt="Farmer with Module"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}

                {/* Installation Photo 2 */}
                {selectedSiteForDetails.inverter_vfd_with_farmer && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Inverter & VFD with Farmer
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveAssamMediaUrl(selectedSiteForDetails.inverter_vfd_with_farmer!))}
                    >
                      <img
                        src={resolveAssamMediaUrl(selectedSiteForDetails.inverter_vfd_with_farmer)}
                        alt="Inverter & VFD"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}

                {/* Installation Photo 3 */}
                {selectedSiteForDetails.running_water_with_farmer && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Running Water with Farmer
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveAssamMediaUrl(selectedSiteForDetails.running_water_with_farmer!))}
                    >
                      <img
                        src={resolveAssamMediaUrl(selectedSiteForDetails.running_water_with_farmer)}
                        alt="Running Water"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 4: Remarks & Audit Log */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Document Audit & Verification Notes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.inst_doc_remarks || selectedSiteForDetails.remarks || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified By:</span>
                <span>{selectedSiteForDetails.inst_doc_verify_by || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedSiteForDetails.inst_doc_verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Review Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.inst_doc_verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.inst_doc_verify_remarks || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Verify Document Status ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedSiteForAction(null);
        }}
        title="Verify Installation Document"
        subtitle={
          selectedSiteForAction
            ? `Farmer: ${selectedSiteForAction.farmer_name} • District: ${selectedSiteForAction.district} • Site ID: #${selectedSiteForAction.id}`
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
              Document Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="">-- Select Status --</option>
              <option value="2">Approved</option>
              <option value="3">Rejected</option>
              <option value="1">Pending</option>
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
              placeholder="Enter document verification remarks..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── File / Document Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Document / File Preview"
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
                alt="File preview"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('doc-lightbox-fallback');
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
                id="doc-lightbox-fallback"
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
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  {lightboxUrl.split('/').pop()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', maxWidth: 360 }}>
                  Document format: <strong>{lightboxUrl.split('.').pop()?.toUpperCase()}</strong>. You can preview or download below:
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
                  Download / View Document
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifyDocument;

