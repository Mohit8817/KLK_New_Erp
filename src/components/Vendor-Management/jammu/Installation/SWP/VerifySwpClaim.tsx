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
} from './jammuSwpAdminService';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');

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
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
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
  .solar-erp-page .ax-table { min-width: 900px; }

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
type KpiTone = 'accent' | 'emerald' | 'amber' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
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

export function VerifySwpClaim() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [sitesModalOpen, setSitesModalOpen] = useState<boolean>(false);
  const [selectedSites, setSelectedSites] = useState<any[]>([]);
  const [selectedClaimTitle, setSelectedClaimTitle] = useState<string>('');

  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditingClaim, setAuditingClaim] = useState<any | null>(null);
  const [auditDecision, setAuditDecision] = useState<number>(1); // 1 = Approved, 2 = Rejected
  const [auditRemarks, setAuditRemarks] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState<boolean>(false);

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [detailClaim, setDetailClaim] = useState<any | null>(null);

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Fetch claims
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuAdminSwpService.getClaims();
      setClaims(res.claims || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load vendor payment claims.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open audit modal
  const openAuditModal = (claim: any) => {
    setAuditingClaim(claim);
    setAuditDecision(claim.status === 2 ? 2 : 1);
    setAuditRemarks(claim.remarks || '');
    setAuditModalOpen(true);
  };

  // Save audit decision
  const handleSaveAudit = async () => {
    if (!auditingClaim) return;
    setSavingAudit(true);
    try {
      await jammuAdminSwpService.approveClaim({
        id: auditingClaim.id,
        status: auditDecision,
        remarks: auditRemarks,
      });
      setClaims((prev) =>
        prev.map((c) =>
          c.id === auditingClaim.id
            ? { ...c, status: auditDecision, remarks: auditRemarks }
            : c
        )
      );
      setAuditModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Claim audit action failed.');
    } finally {
      setSavingAudit(false);
    }
  };

  // Open sites modal
  const openSitesModal = (claim: any) => {
    const list = claim.site_details && claim.site_details.length > 0
      ? claim.site_details
      : (claim.site_id || []).map((sid: any, idx: number) => ({
          id: sid,
          f_farmer_name: `Farmer Site #${sid}`,
          f_farmer_id: `JK-CLM-${sid}`,
          f_district: 'Jammu Region',
          pump_capacity: '5.0 HP',
        }));
    setSelectedSites(list);
    setSelectedClaimTitle(`${claim.claim_no || `Claim #${claim.id}`} · ${claim.vendor_name || 'Vendor'} (${list.length} Sites)`);
    setSitesModalOpen(true);
  };

  // Filtered dataset
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const st = Number(claim.status ?? 0);
      if (statusFilter === 'pending' && st !== 0) return false;
      if (statusFilter === 'approved' && st !== 1) return false;
      if (statusFilter === 'rejected' && st !== 2) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(claim.id).includes(q) ||
        (claim.vendor_name || '').toLowerCase().includes(q) ||
        (claim.claim_no || '').toLowerCase().includes(q) ||
        (claim.claim_date || '').includes(q) ||
        String(claim.amount || '').includes(q)
      );
    });
  }, [claims, statusFilter, searchQuery]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredClaims.length,
    initialPageSize: 10,
  });

  const pagedClaims = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredClaims.slice(start, start + pagination.pageSize);
  }, [filteredClaims, pagination.currentPage, pagination.pageSize]);

  // KPI calculations
  const totalClaimsCount = claims.length;
  const approvedClaimsCount = claims.filter((c) => Number(c.status) === 1).length;
  const rejectedClaimsCount = claims.filter((c) => Number(c.status) === 2).length;
  const pendingClaimsCount = claims.filter((c) => Number(c.status ?? 0) === 0).length;

  // Export Columns
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'id', header: 'Claim ID' },
      { key: 'vendor_name', header: 'Vendor Name' },
      { key: 'claim_no', header: 'Invoice Reference' },
      { key: 'claim_date', header: 'Claim Date' },
      { key: 'amount', header: 'Claim Amount (₹)' },
      { key: 'status', header: 'Audit Status' },
      { key: 'remarks', header: 'Audit Remarks' },
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
        title="Jammu SWP Claim Verification"
        subtitle="Verification and audit desk for vendor installation claims, milestone invoices, and tax vouchers in Jammu & Kashmir."
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
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>Verify Claim</li>
        </ol>
      </nav>

      {/* Error Alert */}
      {apiError && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {apiError}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          tone="accent"
          label="Total Request"
          value={totalClaimsCount}
          sub="Submitted payment claims"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
          tone="emerald"
          label="Approved Claims"
          value={approvedClaimsCount}
          sub="Cleared for disbursement"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Rejected Claims"
          value={rejectedClaimsCount}
          sub="Flagged for revision"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          tone="amber"
          label="Pending Claims"
          value={pendingClaimsCount}
          sub="In audit verification queue"
        />
      </div>

      {/* Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Vendor Installation Milestone Claims
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredClaims.length} payment claims across contractor vendors
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ax-form-control"
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending ({pendingClaimsCount})</option>
                <option value="approved">Approved ({approvedClaimsCount})</option>
                <option value="rejected">Rejected ({rejectedClaimsCount})</option>
              </select>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, invoice..."
              />

              <TableExportToolbar
                data={filteredClaims}
                columns={exportColumns}
                filename="Jammu_SWP_Claim_Verification"
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
                <th style={{ padding: '12px 14px' }}>Claim / Invoice No</th>
                <th style={{ padding: '12px 14px' }}>Claim Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Sites Covered</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Invoice Doc</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Verify Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={centerCell}>Loading claims data...</td>
                </tr>
              ) : pagedClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <TableEmptyState message="No payment claims found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagedClaims.map((claim, idx) => {
                  const st = Number(claim.status ?? 0);
                  const isApproved = st === 1;
                  const isRejected = st === 2;
                  const siteCount = claim.site_id ? claim.site_id.length : (claim.site_details ? claim.site_details.length : 1);

                  return (
                    <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {claim.vendor_name || 'Vendor'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>
                        {claim.claim_no || `CLM-${claim.id}`}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>
                        {claim.claim_date || claim.created_at || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => openSitesModal(claim)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          {siteCount} Sites
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{num(claim.amount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {claim.invoice_doc ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {claim.invoice_doc.endsWith('.pdf') ? (
                              <a
                                href={resolveJammuSwpMediaUrl(claim.invoice_doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                              >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                Invoice PDF
                              </a>
                            ) : (
                              <img
                                src={resolveJammuSwpMediaUrl(claim.invoice_doc)}
                                alt="Invoice Voucher"
                                onClick={() => setLightboxImg(resolveJammuSwpMediaUrl(claim.invoice_doc))}
                                style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'zoom-in' }}
                                title="Click to enlarge Invoice"
                              />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>No invoice</span>
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
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => openAuditModal(claim)}
                            style={{ background: '#2563eb', borderColor: '#2563eb', padding: '4px 10px', fontSize: 11 }}
                          >
                            Verify Claim
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => { setDetailClaim(claim); setDetailModalOpen(true); }}
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

      {/* Claim Audit Action Modal */}
      <Modal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Payment Claim Verification Decision"
        subtitle={auditingClaim ? `${auditingClaim.claim_no || `Claim #${auditingClaim.id}`} · ${auditingClaim.vendor_name}` : ''}
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
              style={{ background: auditDecision === 1 ? '#10b981' : '#dc2626', borderColor: auditDecision === 1 ? '#10b981' : '#dc2626' }}
            >
              {savingAudit ? 'Saving Decision...' : auditDecision === 1 ? 'Approve Claim' : 'Reject Claim'}
            </button>
          </div>
        }
      >
        {auditingClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Claimed Amount</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>₹{num(auditingClaim.amount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Farmer Sites Covered</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
                  {auditingClaim.site_id ? auditingClaim.site_id.length : 1} Sites
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                Claim Audit Verdict:
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                  <input
                    type="radio"
                    name="claimDecision"
                    checked={auditDecision === 1}
                    onChange={() => setAuditDecision(1)}
                  />
                  Approve Claim for Disbursement
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                  <input
                    type="radio"
                    name="claimDecision"
                    checked={auditDecision === 2}
                    onChange={() => setAuditDecision(2)}
                  />
                  Reject Claim
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="claimRemarks" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Audit Verification Remarks:
              </label>
              <textarea
                id="claimRemarks"
                rows={3}
                value={auditRemarks}
                onChange={(e) => setAuditRemarks(e.target.value)}
                placeholder="Tax invoice match, GST verification, work milestone criteria met..."
                className="ax-form-control"
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Sites List Modal */}
      <Modal
        open={sitesModalOpen}
        onClose={() => setSitesModalOpen(false)}
        title="Covered Farmer Installation Sites"
        subtitle={selectedClaimTitle}
        maxWidth={680}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedSites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No covered sites found.</div>
          ) : (
            selectedSites.map((s, idx) => (
              <div
                key={s.id || idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {idx + 1}. {s.f_farmer_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Farmer ID: <strong style={{ color: '#2563eb' }}>{s.f_farmer_id || `JK-SITE-${s.id}`}</strong> · District: {s.f_district || 'Jammu'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6 }}>
                    {s.pump_capacity || '5.0 HP'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Payment Claim Voucher Details"
        subtitle={detailClaim ? `${detailClaim.claim_no || `Claim #${detailClaim.id}`} · ${detailClaim.vendor_name}` : ''}
        maxWidth={620}
      >
        {detailClaim && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Contractor Vendor</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailClaim.vendor_name}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Claim Reference No</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{detailClaim.claim_no || `CLM-${detailClaim.id}`}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Submission Date</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailClaim.claim_date || detailClaim.created_at || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Claimed Amount</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>₹{num(detailClaim.amount)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Covered Sites Count</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailClaim.site_id ? detailClaim.site_id.length : 1} Sites</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Invoice Document</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                {detailClaim.invoice_doc ? (
                  <a href={resolveJammuSwpMediaUrl(detailClaim.invoice_doc)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    View Invoice ↗
                  </a>
                ) : 'No file attached'}
              </div>
            </div>
            {detailClaim.remarks && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Claim / Audit Remarks</span>
                <div style={{ fontSize: 12, color: '#334155', background: '#eff6ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #bfdbfe', marginTop: 2 }}>
                  {detailClaim.remarks}
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

export default VerifySwpClaim;
