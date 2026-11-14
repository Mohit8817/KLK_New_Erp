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
  arunachalAdminService,
  resolveArunachalMediaUrl,
  type LightVerificationItem,
  type AssignSummaryCounts,
} from '../../arunachal-services';

/* ───────── Responsive page CSS (all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
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
  @media (max-width: 1100px) {
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
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-pill-btn.active {
    background: var(--ax-gradient-accent, var(--ax-accent, #2563eb));
    color: var(--ax-on-accent, #ffffff);
    border-color: transparent;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--asw-primary-rgb), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  rose: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveArunachalMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isHeic = /\.heic($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt="Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '10px';
              span.style.fontWeight = '700';
              span.style.color = '#2563eb';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Main Component ───────── */
export function VerifyLights() {
  // Tabs: 'pending' (Verification Pending) | 'verified' (Approved/Rejected SHL Data)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');

  // Counts
  const [counts, setCounts] = useState<AssignSummaryCounts>({
    claimedapplicable: 0,
    approvedsite: 0,
    verifypending: 0,
    rejectsite: 0,
    paymentsitecount: 0,
    complete: 0,
    totalsite: 0,
    pendingsite: 0,
  });

  // Data lists
  const [pendingList, setPendingList] = useState<LightVerificationItem[]>([]);
  const [verifiedList, setVerifiedList] = useState<LightVerificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Modal State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<LightVerificationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1 = Approved, 2 = Rejected, 0 = Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<LightVerificationItem | null>(null);

  // Media Lightbox Modal
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Vendor Name Lookup Map (populated from getAssignFormData, getDashboard + known fallbacks)
  const [vendorMap, setVendorMap] = useState<Record<string | number, string>>({
    '142': 'App Testing',
    '212': 'mohit',
  });

  // Helper to resolve vendor name across table, export, and details modal
  const getVendorName = useCallback(
    (item?: Partial<LightVerificationItem> | null): string => {
      if (!item) return '—';
      if (item.vendors && typeof item.vendors === 'object') {
        if (item.vendors.name) return item.vendors.name;
        if (item.vendors.vendor_name) return item.vendors.vendor_name;
      }
      if (typeof item.vendors === 'string' && item.vendors.trim()) return item.vendors.trim();
      if (item.vendor_name) return item.vendor_name;
      const vid = item.inst_vendor ?? item.vendor ?? (item.vendors as any)?.id;
      if (vid !== undefined && vid !== null && String(vid).trim() !== '') {
        const key = String(vid).trim();
        if (vendorMap[key]) return vendorMap[key];
        if (key === '142') return 'App Testing';
        if (key === '212') return 'mohit';
        return `Vendor ${key}`;
      }
      return '—';
    },
    [vendorMap]
  );

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [res, assignFormRes, dashRes] = await Promise.allSettled([
        arunachalAdminService.getViewInstallation(),
        arunachalAdminService.getAssignFormData(),
        arunachalAdminService.getDashboard(),
      ]);

      if (res.status === 'fulfilled') {
        setCounts(res.value.summary);
        setPendingList(res.value.verification || []);
        setVerifiedList(res.value.verified?.data || []);
      } else {
        throw res.reason;
      }

      const vMap: Record<string | number, string> = {
        '142': 'App Testing',
        '212': 'mohit',
      };
      if (assignFormRes.status === 'fulfilled' && Array.isArray(assignFormRes.value.vendors)) {
        assignFormRes.value.vendors.forEach((v: any) => {
          const id = v.id ?? v.vendor ?? v.inst_vendor;
          const name = v.name ?? v.vendor_name;
          if (id && name) vMap[String(id).trim()] = String(name).trim();
        });
      }
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value;
        if (Array.isArray(d?.vendorswise)) {
          d.vendorswise.forEach((v: any) => {
            const id = v.inst_vendor ?? v.vendor ?? v.id;
            const name = v.vendor_name ?? v.name;
            if (id && name) vMap[String(id).trim()] = String(name).trim();
          });
        }
        if (Array.isArray(d?.vendors)) {
          d.vendors.forEach((v: any) => {
            const id = v.inst_vendor ?? v.vendor ?? v.id;
            const name = v.name ?? v.vendor_name;
            if (id && name) vMap[String(id).trim()] = String(name).trim();
          });
        }
      }
      setVendorMap((prev) => ({ ...prev, ...vMap }));
    } catch (err: any) {
      console.error('Failed to load verify installations:', err);
      setErrorMsg(err.message || 'Failed to load installation verification data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Action (API: POST /verify-installation-status)
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
      const statusNum = parseInt(actionStatus, 10) as 1 | 2;
      const res = await arunachalAdminService.verifyInstallationStatus(
        selectedSiteForAction.id,
        statusNum,
        actionRemarks.trim() || undefined
      );

      const updatedSite: LightVerificationItem = {
        ...selectedSiteForAction,
        inst_verify_status: statusNum,
        inst_verify_remarks: actionRemarks.trim(),
        inst_verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      if (statusNum === 1 || statusNum === 2) {
        setPendingList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifiedList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifiedList((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setPendingList((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      // Update summary counts dynamically
      setCounts((prev) => {
        const oldStatus = Number(selectedSiteForAction.inst_verify_status ?? 0);
        const next = { ...prev };
        if (oldStatus === 0 && statusNum === 1) {
          next.verifypending = Math.max(0, next.verifypending - 1);
          next.approvedsite = next.approvedsite + 1;
        } else if (oldStatus === 0 && statusNum === 2) {
          next.verifypending = Math.max(0, next.verifypending - 1);
          next.rejectsite = next.rejectsite + 1;
        } else if (oldStatus === 1 && statusNum === 2) {
          next.approvedsite = Math.max(0, next.approvedsite - 1);
          next.rejectsite = next.rejectsite + 1;
        } else if (oldStatus === 2 && statusNum === 1) {
          next.rejectsite = Math.max(0, next.rejectsite - 1);
          next.approvedsite = next.approvedsite + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedSite);
      }

      setSuccessMsg(res.message || `SHL Light ${selectedSiteForAction.uid || selectedSiteForAction.id} verified successfully.`);
      setSelectedSiteForAction(null);
      setActionStatus('1');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Action submit error:', err);
      setErrorMsg(err.message || 'Failed to update verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Current active list
  const currentList = activeTab === 'pending' ? pendingList : verifiedList;

  // Search filtered rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter((item) => {
      const uid = String(item.unique_id || item.uid || item.id || '').toLowerCase();
      const vendorName = getVendorName(item).toLowerCase();
      const dist = (item.district || '').toLowerCase();
      const blk = (item.block || '').toLowerCase();
      const panch = (item.panchayat || '').toLowerCase();
      const contactPerson = (item.beneficiary_name || item.contact_person || item.farmer_name || item.customer_name || '').toLowerCase();
      const contactNo = (item.contact_no || item.contact_number || item.phone || '').toLowerCase();
      const panelNo = (item.panel_no || item.module_no || '').toLowerCase();
      const poleNo = (item.pole_no || '').toLowerCase();
      const batNo = (item.battery_serial_no || item.battery_no || '').toLowerCase();
      const lightNo = (item.light_no || item.luminary_no || '').toLowerCase();
      const rem = (item.inst_remark || item.inst_verify_remarks || item.remark || '').toLowerCase();

      return (
        uid.includes(q) ||
        vendorName.includes(q) ||
        dist.includes(q) ||
        blk.includes(q) ||
        panch.includes(q) ||
        contactPerson.includes(q) ||
        contactNo.includes(q) ||
        panelNo.includes(q) ||
        poleNo.includes(q) ||
        batNo.includes(q) ||
        lightNo.includes(q) ||
        rem.includes(q)
      );
    });
  }, [currentList, searchQuery, getVendorName]);

  // Pagination
  const pagination = usePagination(filteredRows, { initialPageSize: 10 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery, activeTab]);

  // Export Columns (Exact 20 fields)
  const exportColumns: ExportColumn<LightVerificationItem>[] = useMemo(
    () => [
      {
        header: 'Sr. No.',
        accessor: (_r: LightVerificationItem, idx?: number) => (idx !== undefined ? idx + 1 : 1),
      } as any,
      { header: 'Unique Id', accessor: (r: LightVerificationItem) => r.unique_id || r.uid || r.id },
      { header: 'State', accessor: (r: LightVerificationItem) => r.state?.toUpperCase() || 'ARUNACHAL PRADESH' },
      { header: 'District', accessor: (r: LightVerificationItem) => r.district || '—' },
      { header: 'Block', accessor: (r: LightVerificationItem) => r.block || '—' },
      { header: 'Panchayat', accessor: (r: LightVerificationItem) => r.panchayat || '—' },
      { header: 'Address', accessor: (r: LightVerificationItem) => r.address || r.village || r.post || '—' },
      { header: 'Phase', accessor: (r: LightVerificationItem) => r.phase || r.volume || '—' },
      { header: 'Vendor', accessor: (r: LightVerificationItem) => getVendorName(r) },
      { header: 'Contact Person', accessor: (r: LightVerificationItem) => r.beneficiary_name || r.contact_person || r.farmer_name || r.customer_name || '—' },
      { header: 'Contact Number', accessor: (r: LightVerificationItem) => r.contact_no || r.contact_number || r.phone || '—' },
      { header: 'Panel No.', accessor: (r: LightVerificationItem) => r.panel_no || r.module_no || '—' },
      { header: 'Pole No', accessor: (r: LightVerificationItem) => r.pole_no || '—' },
      { header: 'Battery Serial No', accessor: (r: LightVerificationItem) => r.battery_serial_no || r.battery_no || '—' },
      { header: 'Light No', accessor: (r: LightVerificationItem) => r.light_no || r.luminary_no || '—' },
      { header: 'Latitude', accessor: (r: LightVerificationItem) => r.inst_latitude || r.latitude || r.lat || '—' },
      { header: 'Longitude', accessor: (r: LightVerificationItem) => r.inst_longitude || r.longitude || r.long || r.lng || '—' },
      { header: 'Installation Remark', accessor: (r: LightVerificationItem) => r.inst_remark || r.inst_verify_remarks || r.remark || '—' },
      {
        header: 'Verify Status',
        accessor: (r: LightVerificationItem) =>
          Number(r.inst_verify_status) === 1
            ? 'Approved'
            : Number(r.inst_verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Arunachal_SHL_Verify_${activeTab}`;
  const fileTitle = `Arunachal SHL Installation Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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
      columns.map((c) => String(c.header ?? '')),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => String(c.header ?? '')).join('\t'),
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

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Header */}
      <PageHead
        title="Arunachal Pradesh SHL Verify Installation"
        subtitle="Review vendor proof of installations, inspect geo-tagged light photos, and authorize quality approvals."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Arunachal SHL', href: '/vendor-management/arunachal/shl/dashboard' },
          { label: 'Verify Installation' },
        ]}
      />

      <div className="ax-container" style={{ paddingBottom: 40 }}>
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
            <span>{errorMsg}</span>
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
            <span>{successMsg}</span>
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
            sub="Allocated across Arunachal districts"
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
            value={counts.complete}
            sub="Installation completed on site"
          />
          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            tone="amber"
            label="Pending"
            value={counts.pendingsite}
            sub="Awaiting vendor installation"
          />
          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            }
            tone="cyan"
            label="Approve Lights"
            value={counts.approvedsite}
            sub="QA verified and approved"
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
            sub="Requires rectification"
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
            sub="Awaiting administrative review"
          />
          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            tone="violet"
            label="Claim Applicable"
            value={counts.claimedapplicable}
            sub="Eligible for payment claims"
          />
          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            }
            tone="cyan"
            label="Payment Done"
            value={counts.paymentsitecount}
            sub="Fully settled lights"
          />
        </div>

        {/* ── Report Wise Bifurcation Pills ── */}
        <div className="asw-bifurcation-row">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
          <button
            type="button"
            className={`asw-pill-btn ${activeTab === 'pending' ? 'active ax-btn--primary' : ''}`}
            onClick={() => {
              setActiveTab('pending');
              pagination.setPage(1);
            }}
          >
            Verification Pending
            <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11, fontWeight: 700 }}>
              {pendingList.length}
            </span>
          </button>
          <button
            type="button"
            className={`asw-pill-btn ${activeTab === 'verified' ? 'active ax-btn--primary' : ''}`}
            onClick={() => {
              setActiveTab('verified');
              pagination.setPage(1);
            }}
          >
            Approved / Rejected SHL Data
            <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'verified' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11, fontWeight: 700 }}>
              {verifiedList.length}
            </span>
          </button>
        </div>

        {/* ── Main Data Card ── */}
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {activeTab === 'pending'
                  ? 'Arunachal Pradesh SHL Installation Pending Verification'
                  : 'Arunachal Pradesh SHL Installation Verified List'}
              </h2>
              <p className="ax-card__subtitle">
                Showing {filteredRows.length} light{filteredRows.length === 1 ? '' : 's'} with on-site hardware serials & proof images
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {searchQuery.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      pagination.setPage(1);
                    }}
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ height: 30, padding: '0 8px', fontSize: 12 }}
                  >
                    Reset
                  </button>
                )}
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search UID, vendor, serial, block..."
                  size="sm"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredRows, exportColumns)}
                  onExportCSV={() => exportToCSV(filteredRows, exportColumns, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredRows, exportColumns, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredRows, exportColumns, fileTitle)}
                />
              </div>
            </div>
          </div>

          {/* ── Responsive Horizontal Scroll Table (Exact 20 fields) ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2100 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th">Unique Id</th>
                  <th className="ax-table__th">State</th>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Block</th>
                  <th className="ax-table__th">Panchayat</th>
                  <th className="ax-table__th">Address</th>
                  <th className="ax-table__th">Phase</th>
                  <th className="ax-table__th">Vendor</th>
                  <th className="ax-table__th">Contact Person</th>
                  <th className="ax-table__th">Contact Number</th>
                  <th className="ax-table__th">Panel No.</th>
                  <th className="ax-table__th">Pole No</th>
                  <th className="ax-table__th">Battery Serial No</th>
                  <th className="ax-table__th">Light No</th>
                  <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Light File</th>
                  <th className="ax-table__th">Latitude</th>
                  <th className="ax-table__th">Longitude</th>
                  <th className="ax-table__th">Remark</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                  {activeTab === 'pending' && (
                    <th className="ax-table__th" style={{ width: 140, textAlign: 'center' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? 21 : 20} style={centerCell}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="ax-spinner" aria-hidden="true" />
                        <span>Loading installation verification records...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? 21 : 20} style={centerCell}>
                      <TableEmptyState
                        title="No installation records found"
                        description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((row: LightVerificationItem, idx: number) => {
                    const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const mediaRaw = row.light_file || row.file || row.inst_file;
                    const lat = row.inst_latitude || row.latitude || row.lat;
                    const lng = row.inst_longitude || row.longitude || row.long || row.lng;
                    const hasGeo = Boolean(lat && lng && Number(lat) !== 0 && Number(lng) !== 0);
                    const vStatus = Number(row.inst_verify_status ?? 0);

                    return (
                      <tr key={row.id}>
                        {/* 1. Sr. No. */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>

                        {/* 2. Unique Id */}
                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent, #2563eb)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ax-accent, #2563eb)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              textDecoration: 'underline',
                              textUnderlineOffset: 2,
                            }}
                            title="Click to view full installation details"
                          >
                            {row.unique_id || row.uid || row.id}
                          </button>
                        </td>

                        {/* 3. State */}
                        <td className="ax-table__td">{row.state?.toUpperCase() || 'ARUNACHAL PRADESH'}</td>

                        {/* 4. District */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || '—'}</td>

                        {/* 5. Block */}
                        <td className="ax-table__td">{row.block || '—'}</td>

                        {/* 6. Panchayat */}
                        <td className="ax-table__td">{row.panchayat || '—'}</td>

                        {/* 7. Address */}
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.address || row.village || row.post || row.tehsil || '—'}
                        </td>

                        {/* 8. Phase */}
                        <td className="ax-table__td">
                          <span
                            style={{
                              background: 'var(--ax-surface-subtle)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {row.phase || row.volume || '—'}
                          </span>
                        </td>

                        {/* 9. Vendor */}
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {getVendorName(row)}
                        </td>

                        {/* 10. Contact Person */}
                        <td className="ax-table__td">{row.beneficiary_name || row.contact_person || row.farmer_name || row.customer_name || '—'}</td>

                        {/* 11. Contact Number */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {row.contact_no || row.contact_number || row.phone || '—'}
                        </td>

                        {/* 12. Panel No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {row.panel_no || row.module_no || '—'}
                        </td>

                        {/* 13. Pole No */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {row.pole_no || '—'}
                        </td>

                        {/* 14. Battery Serial No */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {row.battery_serial_no || row.battery_no || '—'}
                        </td>

                        {/* 15. Light No */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                          {row.light_no || row.luminary_no || '—'}
                        </td>

                        {/* 16. Light File (In-Row Media Thumbnail with click to open Lightbox) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <MediaFileThumbnail file={mediaRaw} onClick={setLightboxUrl} />
                        </td>

                        {/* 17. Latitude */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {lat || '—'}
                        </td>

                        {/* 18. Longitude (with clickable Google Maps GPS link) */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {lng ? (
                            hasGeo ? (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  color: 'var(--ax-accent, #2563eb)',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                }}
                                title={`GPS: ${lat}, ${lng} (Click to open map)`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{lng} ↗</span>
                              </a>
                            ) : (
                              lng
                            )
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* 19. Installation Remark (from inst_remark) */}
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.inst_remark || row.inst_verify_remarks || row.remark || ''}>
                          {row.inst_remark || row.inst_verify_remarks || '—'}
                        </td>

                        {/* 20. Verify Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {vStatus === 1 ? (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#16a34a',
                                background: 'rgba(22, 163, 74, 0.1)',
                                border: '1px solid rgba(22, 163, 74, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                              Approved
                            </span>
                          ) : vStatus === 2 ? (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#dc2626',
                                background: 'rgba(220, 38, 38, 0.1)',
                                border: '1px solid rgba(220, 38, 38, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                              Rejected
                            </span>
                          ) : (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#d97706',
                                background: 'rgba(217, 119, 6, 0.1)',
                                border: '1px solid rgba(217, 119, 6, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 21. Action (Only displayed for Verification Pending tab) */}
                        {activeTab === 'pending' && (
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedSiteForDetails(row)}
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
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

          {/* Left-Aligned Pagination */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pagination.curPage}
                curPage={pagination.curPage}
                totalItems={pagination.totalItems}
                total={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                setPage={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Arunachal SHL Light Installation Details"
        subtitle={
          selectedSiteForDetails
            ? `Light UID: ${selectedSiteForDetails.unique_id || selectedSiteForDetails.uid || selectedSiteForDetails.id} • Vendor: ${getVendorName(selectedSiteForDetails)} • District: ${selectedSiteForDetails.district}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && Number(selectedSiteForDetails.inst_verify_status) === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const site = selectedSiteForDetails;
                    setSelectedSiteForDetails(null);
                    setSelectedSiteForAction(site);
                    setActionStatus(String(site.inst_verify_status ?? '1'));
                    setActionRemarks(site.inst_verify_remarks || '');
                  }}
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  style={{
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
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setSelectedSiteForDetails(null)}
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Light UID: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--ax-accent, #2563eb)' }}>
                  {selectedSiteForDetails.unique_id || selectedSiteForDetails.uid || selectedSiteForDetails.id}
                </strong>
                {selectedSiteForDetails.phase && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Phase: <strong>{selectedSiteForDetails.phase}</strong>
                  </span>
                )}
                {selectedSiteForDetails.volume && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Volume: <strong>{selectedSiteForDetails.volume}</strong>
                  </span>
                )}
              </div>
              <div>
                {Number(selectedSiteForDetails.inst_verify_status) === 1 ? (
                  <span className="ax-badge" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: 6 }}>
                    Approved
                  </span>
                ) : Number(selectedSiteForDetails.inst_verify_status) === 2 ? (
                  <span className="ax-badge" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: 6 }}>
                    Rejected
                  </span>
                ) : (
                  <span className="ax-badge" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: 6 }}>
                    Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Grid 1: Beneficiary & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Contact Person Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-accent, #2563eb)', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Contact & Vendor Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Contact Person:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedSiteForDetails.beneficiary_name || selectedSiteForDetails.contact_person || selectedSiteForDetails.farmer_name || selectedSiteForDetails.customer_name || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Contact Number:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.contact_no || selectedSiteForDetails.contact_number || selectedSiteForDetails.phone || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Vendor:</span>
                  <span style={{ fontWeight: 600 }}>
                    {getVendorName(selectedSiteForDetails)}
                  </span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-accent, #2563eb)', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.state || 'Arunachal Pradesh'}</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Block:</span>
                  <span>{selectedSiteForDetails.block || '—'}</span>

                  <span style={{ color: '#64748b' }}>Panchayat:</span>
                  <span>{selectedSiteForDetails.panchayat || '—'}</span>

                  <span style={{ color: '#64748b' }}>Address:</span>
                  <span>{selectedSiteForDetails.address || selectedSiteForDetails.village || selectedSiteForDetails.post || '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {(() => {
                      const dLat = selectedSiteForDetails.inst_latitude || selectedSiteForDetails.latitude;
                      const dLng = selectedSiteForDetails.inst_longitude || selectedSiteForDetails.longitude;
                      return dLat && dLng && dLat !== '0.0' ? (
                        <a
                          href={`https://www.google.com/maps?q=${dLat},${dLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--ax-accent, #2563eb)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {dLat}, {dLng} ↗
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Hardware & Luminary Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-accent, #2563eb)', marginBottom: 10, letterSpacing: '0.04em' }}>
                Hardware & Equipment Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Panel Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    {selectedSiteForDetails.panel_no || selectedSiteForDetails.module_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Pole Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    {selectedSiteForDetails.pole_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Battery Serial No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    {selectedSiteForDetails.battery_serial_no || selectedSiteForDetails.battery_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Light / Luminary No.</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    {selectedSiteForDetails.light_no || selectedSiteForDetails.luminary_no || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 3: Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-accent, #2563eb)', marginBottom: 12, letterSpacing: '0.04em' }}>
                Photographic Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {(() => {
                  const mediaRaw = selectedSiteForDetails.light_file || selectedSiteForDetails.file || selectedSiteForDetails.inst_file;
                  return (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        Installation Light Photo
                      </div>
                      {mediaRaw ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(resolveArunachalMediaUrl(mediaRaw))}
                        >
                          {mediaRaw.toLowerCase().endsWith('.pdf') ? (
                            <div style={{ padding: '24px 0' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 36, height: 36, margin: '0 auto' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>PDF Document</div>
                            </div>
                          ) : (
                            <img
                              src={resolveArunachalMediaUrl(mediaRaw)}
                              alt="Installation Light"
                              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }}
                            />
                          )}
                          <div style={{ fontSize: 10, color: 'var(--ax-accent, #2563eb)', marginTop: 4, fontWeight: 600 }}>Click to preview media</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Media Attached</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Grid 4: Audit & QA Verification Notes */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-accent, #2563eb)', marginBottom: 10, letterSpacing: '0.04em' }}>
                Remarks & Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Installation Remark:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedSiteForDetails.inst_remark || '—'}</span>

                <span style={{ color: '#64748b' }}>Installation Date:</span>
                <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.inst_date || '—'}</span>

                <span style={{ color: '#64748b' }}>Survey Remark:</span>
                <span>{selectedSiteForDetails.remark || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedSiteForDetails.inst_verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified By:</span>
                <span>{selectedSiteForDetails.inst_verify_by ? `User ID: ${selectedSiteForDetails.inst_verify_by}` : '—'}</span>

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
            ? `Light UID: ${selectedSiteForAction.unique_id || selectedSiteForAction.uid || selectedSiteForAction.id} • District: ${selectedSiteForAction.district}`
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
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
              placeholder="Enter audit remarks, quality inspection notes, or rejection reasons..."
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
        maxWidth={760}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{
                  textDecoration: 'none',
                }}
              >
                Open Original ↗
              </a>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
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
            {lightboxUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={lightboxUrl}
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '65vh',
                  border: '1px solid var(--ax-border)',
                  borderRadius: 8,
                }}
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Installation light preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: 'var(--ax-shadow-md)',
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifyLights;
