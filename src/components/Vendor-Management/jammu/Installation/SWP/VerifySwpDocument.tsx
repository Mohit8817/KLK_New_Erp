import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
  type JammuSwpInstalledSiteItem,
} from './jammuSwpAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP reference) ───────── */
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

  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 1100px; }

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
    .solar-erp-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
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

/* ───────── Overlay CSS (modals & lightbox) ───────── */
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

  .asw-lightbox-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; padding: 20px; cursor: zoom-out;
  }
  .asw-lightbox-img {
    max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px;
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

/* ───────── Top KPI Card Component ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
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
          {icon}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function VerifySwpDocument() {
  const [sites, setSites] = useState<JammuSwpInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Bifurcation & Search
  const [bifurcation, setBifurcation] = useState<'pending' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Modals
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditingSite, setAuditingSite] = useState<JammuSwpInstalledSiteItem | null>(null);
  const [auditDecision, setAuditDecision] = useState<number>(2); // 2 = Approved, 3 = Rejected
  const [auditRemarks, setAuditRemarks] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState<boolean>(false);

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [detailSite, setDetailSite] = useState<JammuSwpInstalledSiteItem | null>(null);

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Fetch installed sites for documents
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuAdminSwpService.getInstalledSites();
      setSites(res.sites || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load document records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open doc audit modal
  const openAuditModal = (site: JammuSwpInstalledSiteItem) => {
    setAuditingSite(site);
    setAuditDecision(site.doc_verify_status === 3 ? 3 : 2);
    setAuditRemarks(site.doc_verify_remarks || '');
    setAuditModalOpen(true);
  };

  // Submit doc audit decision
  const handleSaveAudit = async () => {
    if (!auditingSite) return;
    setSavingAudit(true);
    try {
      await jammuAdminSwpService.verifyDocumentStatus({
        id: auditingSite.id,
        status: auditDecision,
        remarks: auditRemarks,
      });
      setSites((prev) =>
        prev.map((s) =>
          s.id === auditingSite.id
            ? { ...s, doc_verify_status: auditDecision, doc_verify_remarks: auditRemarks }
            : s
        )
      );
      setAuditModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Document audit action failed.');
    } finally {
      setSavingAudit(false);
    }
  };

  // Filtered dataset
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const docStatus = Number(site.doc_verify_status ?? 0);
      if (bifurcation === 'pending') {
        if (docStatus === 2 || docStatus === 3) return false;
      } else {
        if (docStatus !== 2 && docStatus !== 3) return false;
      }

      if (districtFilter !== 'all') {
        if ((site.district || '').toLowerCase() !== districtFilter.toLowerCase()) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(site.id).includes(q) ||
        (site.f_farmer_name || '').toLowerCase().includes(q) ||
        (site.f_farmer_id || '').toLowerCase().includes(q) ||
        (site.contact_no || '').includes(q) ||
        (site.district || '').toLowerCase().includes(q) ||
        (site.vendor_name || '').toLowerCase().includes(q) ||
        (site.block || '').toLowerCase().includes(q)
      );
    });
  }, [sites, bifurcation, districtFilter, searchQuery]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredSites.length,
    initialPageSize: 10,
  });

  const pagedSites = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredSites.slice(start, start + pagination.pageSize);
  }, [filteredSites, pagination.currentPage, pagination.pageSize]);

  // KPI calculations
  const totalSites = sites.length;
  const docPendingCount = sites.filter((s) => Number(s.doc_verify_status ?? 0) <= 1).length;
  const docApprovedCount = sites.filter((s) => Number(s.doc_verify_status) === 2).length;
  const docRejectedCount = sites.filter((s) => Number(s.doc_verify_status) === 3).length;

  const districtOptions = useMemo(
    () => [...new Set(sites.map((s) => s.district).filter(Boolean))].sort(),
    [sites]
  );

  // Export Columns
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'id', header: 'Site ID' },
      { key: 'vendor_name', header: 'Contractor Vendor' },
      { key: 'f_farmer_name', header: 'Farmer Name' },
      { key: 'f_farmer_id', header: 'Farmer ID' },
      { key: 'contact_no', header: 'Contact' },
      { key: 'district', header: 'District' },
      { key: 'block', header: 'Block' },
      { key: 'village', header: 'Village' },
      { key: 'pump_capacity', header: 'Capacity' },
      { key: 'doc_verify_status', header: 'HOC Status' },
      { key: 'doc_verify_remarks', header: 'Remarks' },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        eyebrow="Super Admin · Vendor Management"
        title="Jammu SWP Document Verification"
        subtitle="Verification and audit desk for farmer handover certificates (HOC), Joint Commissioning Reports (JCR), and equipment warranties in Jammu & Kashmir."
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol className="ax-breadcrumb" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Home</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Vendor Management</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu" style={{ color: '#2563eb' }}>Jammu</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu/installation/swp/dashboard" style={{ color: '#2563eb' }}>SWP Installation</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>Verify Document</li>
        </ol>
      </nav>

      {/* Error Alert */}
      {apiError && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {apiError}
        </div>
      )}

      {/* 5 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>}
          tone="accent"
          label="Total Sites"
          value={totalSites}
          sub="Sanctioned units"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
          tone="emerald"
          label="Installed Sites"
          value={totalSites}
          sub="Field completed"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          tone="amber"
          label="Doc Pending"
          value={docPendingCount}
          sub="HOC under audit or awaited"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
          tone="emerald"
          label="Document Approved"
          value={docApprovedCount}
          sub="Handover signoff accepted"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Document Rejected"
          value={docRejectedCount}
          sub="Signoff papers rejected"
        />
      </div>

      {/* Report Wise Bifurcation Pills */}
      <div className="asw-bifurcation-row">
        <button
          type="button"
          className={`asw-pill-btn ${bifurcation === 'pending' ? 'active' : ''}`}
          onClick={() => setBifurcation('pending')}
        >
          Verification Pending ({docPendingCount})
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${bifurcation === 'approved' ? 'active' : ''}`}
          onClick={() => setBifurcation('approved')}
        >
          Approved / Rejected Data ({docApprovedCount + docRejectedCount})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              {bifurcation === 'pending' ? 'Pending Farmer Handover Signoff Audit' : 'Approved & Rejected Handover Records'}
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredSites.length} handover certificates in UT Jammu & Kashmir
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              {districtOptions.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-form-control"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search farmer, vendor, block..."
              />

              <TableExportToolbar
                data={filteredSites}
                columns={exportColumns}
                filename="Jammu_SWP_Document_Register"
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Sr. No.</th>
                <th style={{ padding: '12px 14px' }}>Vendor Name</th>
                <th style={{ padding: '12px 14px' }}>Farmer Name</th>
                <th style={{ padding: '12px 14px' }}>Farmer ID</th>
                <th style={{ padding: '12px 14px' }}>Contact</th>
                <th style={{ padding: '12px 14px' }}>District</th>
                <th style={{ padding: '12px 14px' }}>Block</th>
                <th style={{ padding: '12px 14px' }}>Village</th>
                <th style={{ padding: '12px 14px' }}>Pump Rating</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>HOC Document</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Verify Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>Loading document records...</td>
                </tr>
              ) : pagedSites.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState message="No handover document records found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagedSites.map((site, idx) => {
                  const dStatus = Number(site.doc_verify_status ?? 0);
                  const isApproved = dStatus === 2;
                  const isRejected = dStatus === 3;
                  const isPending = dStatus <= 1;

                  return (
                    <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {site.vendor_name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {site.f_farmer_name}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>
                        {site.f_farmer_id || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>
                        {site.contact_no || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                        {site.district}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {site.block || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {site.village || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4 }}>
                          {site.pump_capacity || '5.0 HP'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {site.hoc_photo ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {site.hoc_photo.endsWith('.pdf') ? (
                              <a
                                href={resolveJammuSwpMediaUrl(site.hoc_photo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                              >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                HOC PDF
                              </a>
                            ) : (
                              <img
                                src={resolveJammuSwpMediaUrl(site.hoc_photo)}
                                alt="HOC Document"
                                onClick={() => setLightboxImg(resolveJammuSwpMediaUrl(site.hoc_photo))}
                                style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'zoom-in' }}
                                title="Click to enlarge HOC"
                              />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>Awaited</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--${isApproved ? 'success' : isRejected ? 'danger' : 'warning'}`}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#fef3c7',
                            color: isApproved ? '#059669' : isRejected ? '#dc2626' : '#d97706',
                          }}
                        >
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Submitted (Pending)'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => openAuditModal(site)}
                            style={{ background: '#2563eb', borderColor: '#2563eb', padding: '4px 10px', fontSize: 11 }}
                          >
                            Verify Doc
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => { setDetailSite(site); setDetailModalOpen(true); }}
                            style={{ padding: '4px 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            Details
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

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Doc Audit Action Modal */}
      <Modal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="HOC Document Audit Decision"
        subtitle={auditingSite ? `Site #${auditingSite.id} · ${auditingSite.f_farmer_name} (${auditingSite.district})` : ''}
        maxWidth={580}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setAuditModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              disabled={savingAudit}
              onClick={handleSaveAudit}
              style={{ background: auditDecision === 2 ? '#10b981' : '#dc2626', borderColor: auditDecision === 2 ? '#10b981' : '#dc2626' }}
            >
              {savingAudit ? 'Saving Decision...' : auditDecision === 2 ? 'Approve HOC' : 'Reject HOC'}
            </button>
          </div>
        }
      >
        {auditingSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                Document Verification Verdict:
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                  <input
                    type="radio"
                    name="docDecision"
                    checked={auditDecision === 2}
                    onChange={() => setAuditDecision(2)}
                  />
                  Approve HOC Certificate
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                  <input
                    type="radio"
                    name="docDecision"
                    checked={auditDecision === 3}
                    onChange={() => setAuditDecision(3)}
                  />
                  Reject HOC Certificate
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="docRemarks" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Audit Verification Remarks:
              </label>
              <textarea
                id="docRemarks"
                rows={3}
                value={auditRemarks}
                onChange={(e) => setAuditRemarks(e.target.value)}
                placeholder="Signatures verified, farmer seal legible, warranty card attached..."
                className="ax-form-control"
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Complete Handover & Site Record"
        subtitle={detailSite ? `Site #${detailSite.id} · ${detailSite.f_farmer_name}` : ''}
        maxWidth={680}
      >
        {detailSite && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Farmer Name</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailSite.f_farmer_name}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Farmer ID</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{detailSite.f_farmer_id || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Contractor Agency</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailSite.vendor_name || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Contact Phone</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailSite.contact_no || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>District & Block</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailSite.district}, {detailSite.block || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Post Office & Village</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailSite.post || '—'}, {detailSite.village || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Pump Rating & Subtype</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{detailSite.pump_capacity} ({detailSite.pump_type} {detailSite.pump_subtype})</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>HOC Document Link</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                {detailSite.hoc_photo ? (
                  <a href={resolveJammuSwpMediaUrl(detailSite.hoc_photo)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    View Uploaded File ↗
                  </a>
                ) : 'Not uploaded'}
              </div>
            </div>
            {detailSite.doc_verify_remarks && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Document Audit Remarks</span>
                <div style={{ fontSize: 12, color: '#334155', background: '#eff6ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #bfdbfe', marginTop: 2 }}>
                  {detailSite.doc_verify_remarks}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Lightbox Zoom */}
      {lightboxImg && (
        <div className="asw-lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Enlarged view" className="asw-lightbox-img" />
        </div>
      )}
    </div>
  );
}

export default VerifySwpDocument;
