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
  type JammuSwpAssignRecord,
  type JammuSwpFarmerSiteItem,
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
  .solar-erp-page .ax-table { min-width: 880px; }

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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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

export function ViewAssignSwpInstallation() {
  const [assigns, setAssigns] = useState<JammuSwpAssignRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [siteModalOpen, setSiteModalOpen] = useState<boolean>(false);
  const [selectedRecordSites, setSelectedRecordSites] = useState<JammuSwpFarmerSiteItem[]>([]);
  const [selectedRecordTitle, setSelectedRecordTitle] = useState<string>('');

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [activeRecord, setActiveRecord] = useState<JammuSwpAssignRecord | null>(null);

  const [approvingId, setApprovingId] = useState<number | null>(null);

  // 1. Fetch View Assign Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuAdminSwpService.getViewAssign();
      setAssigns(res.assigns || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load assigned installation records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve action
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      await jammuAdminSwpService.approveAssign(id);
      setAssigns((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 1 } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Approval action failed.');
    } finally {
      setApprovingId(null);
    }
  };

  // Open site list modal
  const openSitesModal = (record: JammuSwpAssignRecord) => {
    const list = record.site_details && record.site_details.length > 0
      ? record.site_details
      : (record.site_id || []).map((sid, idx) => ({
          id: sid,
          f_farmer_name: `Farmer Site #${sid}`,
          f_farmer_id: `JK-SITE-${sid}`,
          f_district: record.district,
          f_block: `Block ${idx + 1}`,
          pump_capacity: '5.0 HP',
        }));
    setSelectedRecordSites(list);
    setSelectedRecordTitle(`${record.vendor} · ${record.district} (${list.length} Sites)`);
    setSiteModalOpen(true);
  };

  // Open details modal
  const openDetailModal = (record: JammuSwpAssignRecord) => {
    setActiveRecord(record);
    setDetailModalOpen(true);
  };

  // Filtered dataset
  const filteredAssigns = useMemo(() => {
    return assigns.filter((item) => {
      if (statusFilter === 'pending' && Number(item.status) !== 0) return false;
      if (statusFilter === 'approved' && Number(item.status) === 0) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(item.id).includes(q) ||
        (item.vendor || '').toLowerCase().includes(q) ||
        (item.district || '').toLowerCase().includes(q) ||
        (item.volume || '').toLowerCase().includes(q) ||
        (item.deadline_date || '').toLowerCase().includes(q)
      );
    });
  }, [assigns, statusFilter, searchQuery]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredAssigns.length,
    initialPageSize: 10,
  });

  const pagedAssigns = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredAssigns.slice(start, start + pagination.pageSize);
  }, [filteredAssigns, pagination.currentPage, pagination.pageSize]);

  // KPI calculations
  const totalSitesAllocated = useMemo(() => {
    return assigns.reduce((acc, curr) => acc + (curr.site_id ? curr.site_id.length : 1), 0);
  }, [assigns]);

  const activeWorkOrders = useMemo(() => {
    return assigns.filter((a) => Number(a.status) === 1).length;
  }, [assigns]);

  const pendingApprovalOrders = useMemo(() => {
    return assigns.filter((a) => Number(a.status) === 0).length;
  }, [assigns]);

  // Export Columns
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'id', header: 'Order ID' },
      { key: 'state', header: 'State' },
      { key: 'volume', header: 'Volume / Scheme' },
      { key: 'district', header: 'District' },
      { key: 'vendor', header: 'Contracted Vendor' },
      { key: 'deadline_date', header: 'Deadline' },
      { key: 'status', header: 'Approval Status' },
      { key: 'created_at', header: 'Assigned Date' },
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
        title="View Assigned SWP Installations"
        subtitle="Master register of solar water pump allocations, contracted vendor work orders, and field sites in Jammu & Kashmir."
        actions={
          <div className="ax-cluster" style={actionsRowStyle}>
            <Link to="/vendor-management/jammu/installation/swp/assign-installation" className="ax-btn ax-btn--primary ax-btn--sm" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
              + Allocate New Sites
            </Link>
          </div>
        }
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
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>View Assigned</li>
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
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>}
          tone="accent"
          label="Total Allocated Sites"
          value={totalSitesAllocated}
          sub="Across all work orders"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          tone="emerald"
          label="Active Work Orders"
          value={activeWorkOrders}
          sub="Approved & active with vendors"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>}
          tone="amber"
          label="Pending Approval"
          value={pendingApprovalOrders}
          sub="Orders awaiting clearance"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
          tone="cyan"
          label="Total Allocations"
          value={assigns.length}
          sub="Registered contract batches"
        />
      </div>

      {/* Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Assigned Installation Master Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredAssigns.length} assigned work orders across Jammu & Kashmir
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
                <option value="pending">Pending Approval ({pendingApprovalOrders})</option>
                <option value="approved">Approved / Active ({activeWorkOrders})</option>
              </select>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district..."
              />

              <TableExportToolbar
                data={filteredAssigns}
                columns={exportColumns}
                filename="Jammu_SWP_Assigned_Installations"
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Order ID</th>
                <th style={{ padding: '12px 14px' }}>Scheme / Volume</th>
                <th style={{ padding: '12px 14px' }}>District</th>
                <th style={{ padding: '12px 14px' }}>Contracted Vendor</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Sites Count</th>
                <th style={{ padding: '12px 14px' }}>Deadline</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Work Order</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={centerCell}>Loading assigned installations...</td>
                </tr>
              ) : pagedAssigns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <TableEmptyState message="No assigned installation records found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagedAssigns.map((row) => {
                  const isApproved = Number(row.status) !== 0;
                  const siteCount = row.site_id ? row.site_id.length : 0;
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>
                        #{row.id}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#0f172a' }}>
                        {row.volume}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                        {row.district}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {row.vendor}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => openSitesModal(row)}
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
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>
                        {row.deadline_date || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {row.file ? (
                          <a
                            href={resolveJammuSwpMediaUrl(row.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            View PDF
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>No file</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--${isApproved ? 'success' : 'warning'}`}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isApproved ? '#ecfdf5' : '#fef3c7',
                            color: isApproved ? '#059669' : '#d97706',
                          }}
                        >
                          {isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {!isApproved && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleApprove(row.id)}
                              disabled={approvingId === row.id}
                              style={{ background: '#10b981', borderColor: '#10b981', padding: '4px 8px', fontSize: 11 }}
                            >
                              {approvingId === row.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => openDetailModal(row)}
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

      {/* Sites List Modal */}
      <Modal
        open={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
        title="Assigned Farmer Sites"
        subtitle={selectedRecordTitle}
        maxWidth={700}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedRecordSites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No farmer details available.</div>
          ) : (
            selectedRecordSites.map((s, idx) => (
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
                    Farmer ID: <strong style={{ color: '#2563eb' }}>{s.f_farmer_id || `JK-SWP-${s.id}`}</strong> · {s.f_block || 'Block'}, {s.f_village || 'Village'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6 }}>
                    {s.pump_capacity || '5.0 HP'}
                  </span>
                  {s.contact_no && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Ph: {s.contact_no}
                    </div>
                  )}
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
        title="Work Order Allocation Details"
        subtitle={activeRecord ? `Order #${activeRecord.id} · ${activeRecord.vendor}` : ''}
        maxWidth={620}
      >
        {activeRecord && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>State / Region</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{activeRecord.state}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Target District</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{activeRecord.district}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Contracted Vendor</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{activeRecord.vendor}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Allocation Scheme / Volume</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{activeRecord.volume}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Installation Deadline</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{activeRecord.deadline_date || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Total Assigned Sites</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{activeRecord.site_id ? activeRecord.site_id.length : 0} sites</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Allocation Remarks</span>
              <div style={{ fontSize: 13, color: '#0f172a', marginTop: 2, background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                {activeRecord.remarks || 'No remarks provided.'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ViewAssignSwpInstallation;
