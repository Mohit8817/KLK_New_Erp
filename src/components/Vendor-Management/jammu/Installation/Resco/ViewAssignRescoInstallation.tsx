<<<<<<< HEAD
﻿import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
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
  jammuRescoAdminService,
  resolveJammuMediaUrl,
  type RescoAssignedRecord,
} from './jammuRescoAdminService';

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
=======
<<<<<<< HEAD
import React from 'react';
import RescoAssignedSites from '../../../../V-Portal/jammu/Installation/Resco/RescoAssignedSites';

/**
 * Super Admin - View Assigned Jammu RESCO Installation Desk
 * Displays assigned rooftop solar projects, vendor allocations and acceptance statuses
 */
export const ViewAssignRescoInstallation: React.FC = () => {
  return <RescoAssignedSites />;
=======
import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  type JammuRescoAssignedSiteItem,
  type JammuRescoAssignedDetailData,
} from '../../../../V-Portal/jammu/jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Badges & Status ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const formatDate = (val?: any): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(val);
  }
};

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Top KPI Card ───────── */
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Styles matching ERP Layout ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
<<<<<<< HEAD
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  .solar-erp-page .asw-cards-row span svg {
    width: 15px !important;
    height: 15px !important;
    display: block !important;
  }
  /* Compact table action buttons */
  .solar-erp-page .ax-table .ax-btn--sm,
  .solar-erp-page .ax-table .ax-btn--xs,
  .solar-erp-page .ax-table button.ax-btn,
  .solar-erp-page .ax-table a.ax-btn {
    min-height: unset !important;
    height: auto !important;
    padding: 4px 8px !important;
    font-size: 11px !important;
    line-height: 1.2 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
  }
  @media (max-width: 1024px) {
=======
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
<<<<<<< HEAD
  @media (max-width: 640px) {
=======
  @media (max-width: 520px) {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
  .solar-erp-page .ax-card__eyebrow,
=======
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD

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
=======
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Modal */
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
=======
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
<<<<<<< HEAD
    transition: all 0.15s ease;
=======
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
<<<<<<< HEAD
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
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
=======
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

const actionsRowStyle: CSSProperties = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' };

export const ViewAssignRescoInstallation: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<JammuRescoAssignedSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Detail Modal State
  const [detailModalItem, setDetailModalItem] = useState<JammuRescoAssignedSiteItem | null>(null);
  const [detailData, setDetailData] = useState<JammuRescoAssignedDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, detailModalItem !== null);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load live data from API
  const loadAssignedSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoService.getAssignedSites();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Admin Jammu RESCO Assigned] load error:', err);
      setRecords([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned RESCO sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignedSites();
  }, [loadAssignedSites]);

  // Handle Accept Assignment
  const handleDirectAccept = async (id?: number | string) => {
    if (!id) return;
    const numId = Number(id);
    setAcceptingId(numId);
    try {
      const res = await jammuRescoService.acceptAssignment(numId);
      setToastMsg({
        type: 'success',
        text: res.message || `Installation Assignment #${numId} accepted successfully!`,
      });

      // Update state optimistically
      setRecords((prev) =>
        prev.map((r) => (Number(r.id) === numId ? { ...r, status: 2 } : r))
      );

      if (detailModalItem && Number(detailModalItem.id) === numId) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 2 } : null));
      }
    } catch (err: any) {
      console.error('[Admin Jammu RESCO Accept] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to accept installation assignment.' });
    } finally {
      setAcceptingId(null);
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (item: JammuRescoAssignedSiteItem) => {
    setDetailModalItem(item);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const detail = await jammuRescoService.getAssignedSiteDetail(item.id);
      setDetailData(detail);
    } catch (err: any) {
      console.warn('[Admin Jammu RESCO Assigned] fetchDetail warning:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Unique Districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [records]);

  // Metrics
  const totalBatches = records.length;
  const acceptedBatches = useMemo(
    () => records.filter((r) => Number(r.status) === 2).length,
    [records]
  );
  const pendingBatches = totalBatches - acceptedBatches;
  const acceptRate = totalBatches > 0 ? Math.round((acceptedBatches / totalBatches) * 100) : 0;

  // Filtered
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (districtFilter !== 'all' && r.district !== districtFilter) return false;
      if (statusFilter === 'pending' && Number(r.status) === 2) return false;
      if (statusFilter === 'accepted' && Number(r.status) !== 2) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const v = String(r.inst_vendor || r.vendor || '').toLowerCase();
        const s = String(r.site_name || '').toLowerCase();
        const d = String(r.district || '').toLowerCase();
        const rem = String(r.remarks || r.remark || '').toLowerCase();
        if (!v.includes(q) && !s.includes(q) && !d.includes(q) && !rem.includes(q) && !String(r.id).includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, districtFilter, statusFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoAssignedSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r) => String(r.inst_vendor || r.vendor || '—') },
      { header: 'Assign Date', accessor: (r) => formatDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || '—' },
      { header: 'Deadline', accessor: (r) => formatDate(r.inst_deadline) },
      { header: 'Count', accessor: (r) => r.count ?? 1 },
      { header: 'Remarks', accessor: (r) => r.remarks || r.remark || '—' },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Assigned') },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Assigned Installation Sites"
        subtitle="Manage and accept RESCO solar rooftop installation work orders, developer allocations, and deadlines"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'View Assigned Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              + Assign Installation
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-vendor-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              + Vendor Installation
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assigned Sites"
          value={totalBatches.toLocaleString('en-IN')}
          sub="Total site allocations"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Acceptance"
          value={pendingBatches.toLocaleString('en-IN')}
          sub="Awaiting vendor acceptance"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Accepted Sites"
          value={acceptedBatches.toLocaleString('en-IN')}
          sub="Ready for field execution"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Acceptance Rate"
          value={`${acceptRate}%`}
          sub={`${acceptedBatches} of ${totalBatches} sites`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Resco Sites Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned Resco Sites</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> site batches
              {' '}· Accepted <b className="ax-num">{acceptedBatches}</b> · Pending <b className="ax-num">{pendingBatches}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, district…"
                size="sm"
                ariaLabel="Search assigned sites"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Assigned_Sites')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Assigned_Sites')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Assigned Sites Register')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">Assign Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name - Deadline</th>
                <th className="ax-table__th" scope="col">Count</th>
                <th className="ax-table__th" scope="col">File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned RESCO sites from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned RESCO sites found"
                      message={hasFilters ? 'No records match your filters. Try clearing your query.' : 'No site allocations currently assigned.'}
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isAccepted = Number(row.status) === 2;
                  const assignDate = formatDate(row.assign_date || row.created_at);
                  const deadlineDate = formatDate(row.inst_deadline);
                  const rowId = Number(row.id);
                  const fileUrl = row.file ? resolveJammuMediaUrl(row.file) : null;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {String(row.inst_vendor || row.vendor || '—')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {assignDate}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{row.district || '—'}</b></td>

                      {/* Site Name - Deadline */}
                      <td className="ax-table__td" style={{ maxWidth: 320, whiteSpace: 'normal', fontSize: 12 }}>
                        <div
                          style={{
                            display: 'inline-block',
                            background: 'var(--ax-surface-subtle, #f8fafc)',
                            border: '1px solid var(--ax-border, #e2e8f0)',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          <b style={{ color: 'var(--ax-text-strong)' }}>{row.site_name || `Site ${row.site_id || row.id}`}</b>
                          {deadlineDate !== '—' && (
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 6 }}>
                              (Deadline: {deadlineDate})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {row.count ?? 1}
                      </td>

                      {/* Document File link */}
                      <td className="ax-table__td">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            View File ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.remarks || row.remark || '—'}
                      </td>

                      {/* Status */}
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Assigned</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => handleOpenDetailModal(row)}
                            style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                          >
                            View Sites
                          </button>

                          {!isAccepted && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleDirectAccept(rowId)}
                              disabled={acceptingId === rowId}
                              style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                            >
                              {acceptingId === rowId ? 'Accepting…' : 'Accept'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Card Footer with Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>

      {/* ── Modal: Itemized Assigned Sites Breakdown ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 860 }}>
            <div className="ax-modal__header">
              <div>
                <h3 id="modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Assigned RESCO Sites Breakdown
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Vendor: <b>{String(detailModalItem.inst_vendor || detailModalItem.vendor || '—')}</b> · District: <b>{detailModalItem.district || '—'}</b> · Allocation ID: #{detailModalItem.id}
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailModalItem(null)}
                aria-label="Close modal"
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 36 }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading allocation details…
                </div>
              ) : !detailData?.sites || detailData.sites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' }}>
                  No itemized individual sites found in this allocation batch.
                </div>
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                    <thead className="ax-table__head">
                      <tr>
                        <th className="ax-table__th" scope="col">Sr. No.</th>
                        <th className="ax-table__th" scope="col">Assign Date</th>
                        <th className="ax-table__th" scope="col">State</th>
                        <th className="ax-table__th" scope="col">District</th>
                        <th className="ax-table__th" scope="col">Site Name</th>
                        <th className="ax-table__th" scope="col">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="ax-table__body">
                      {detailData.sites.map((st, i) => (
                        <tr key={st.sr_no || i} className="ax-table__row">
                          <td className="ax-table__td ax-num">{i + 1}</td>
                          <td className="ax-table__td" style={{ fontSize: 12 }}>{formatDate(st.assign_date)}</td>
                          <td className="ax-table__td">{st.state || 'Jammu & Kashmir'}</td>
                          <td className="ax-table__td"><b>{st.district || '—'}</b></td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {st.site_name || `Site #${i + 1}`}
                          </td>
                          <td className="ax-table__td" style={{ fontSize: 12 }}>{formatDate(st.inst_deadline)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              {Number(detailModalItem.status) !== 2 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => handleDirectAccept(detailModalItem.id)}
                  disabled={acceptingId === Number(detailModalItem.id)}
                >
                  {acceptingId === Number(detailModalItem.id) ? 'Accepting…' : 'Accept Allocation'}
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
          <span style={{ width: 15, height: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

export function ViewAssignRescoInstallation() {
  const [assignedList, setAssignedList] = useState<RescoAssignedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RescoAssignedRecord | null>(null);

  // Top stats state
  const [stats, setStats] = useState({
    total: 21,
    assigned: 5,
    not_assigned: 13,
    installed_complete: 4,
    installed_pending: 1,
    verify_complete: 3,
    verify_pending: 1,
    verify_reject: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoAdminService.getViewAssigned();
      setAssignedList(data.list);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load assigned RESCO data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter list by search query
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assignedList;
    return assignedList.filter(
      (r) =>
        r.vendor.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.site_name.toLowerCase().includes(q) ||
        r.deadline.toLowerCase().includes(q) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
    );
  }, [assignedList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 10 });

  // Export Columns
  const exportCols: ExportColumn<RescoAssignedRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'Assign Date', accessor: (r) => r.assign_date },
      { header: 'State', accessor: () => 'JAMMU & KASHMIR' },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Site Name - Deadline', accessor: (r) => r.site_name },
      { header: 'Count', accessor: (r) => r.count },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
      { header: 'Status', accessor: (r) => r.status },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="View Assign Jammu Resco Installation"
        subtitle="Master register of contracted rooftop solar installations, vendor assignment batches, and deadline tracking in Jammu & Kashmir."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'View Assign Jammu Resco Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/assign-installation"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            + Assign New Site
          </Link>
        }
      />

      {/* Top 3 Metric Cards exactly matching user's summary format */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total / Assigned / Not Assigned"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span>{stats.total}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#16a34a' }}>{stats.assigned}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.not_assigned}</span>
            </div>
          }
          sub={`Total Sites: ${stats.total} • Assigned: ${stats.assigned} • Pending Allocation: ${stats.not_assigned}`}
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          tone="emerald"
          label="Installation Status"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#16a34a' }}>{stats.installed_complete}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.installed_pending}</span>
            </div>
          }
          sub={`Complete: ${stats.installed_complete} • Pending: ${stats.installed_pending}`}
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Verify Status"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#16a34a' }}>{stats.verify_complete}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#d97706' }}>{stats.verify_pending}</span>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>/</span>
              <span style={{ color: '#dc2626' }}>{stats.verify_reject}</span>
            </div>
          }
          sub={`Complete: ${stats.verify_complete} • Pending: ${stats.verify_pending} • Reject: ${stats.verify_reject}`}
        />
      </div>

      {/* Main Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Assign Jammu Resco Installation</h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} assigned work order batch{filteredList.length === 1 ? '' : 'es'}
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
                  style={{ height: 30, padding: '0 8px', fontSize: '11px' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, site name..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => {}}
                onExportCSV={() => {}}
                onExportExcel={() => {}}
                onExportPDF={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Table Wrap */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name - Deadline</th>
                <th className="ax-table__th ax-table__th--num">Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned RESCO installations...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState
                      title="No assigned installations found"
                      description={searchQuery ? 'Adjust your search query' : 'No records allocated yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.vendor}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{row.assign_date}</td>
                      <td className="ax-table__td">JAMMU & KASHMIR</td>
                      <td className="ax-table__td">{row.district}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#2559bf' }}>{row.site_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Target Completion: {row.deadline}</div>
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700 }}>
                        {row.count}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.file ? (
                          <a
                            href={resolveJammuMediaUrl(row.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2559bf', fontWeight: 600 }}
                          >
                            📄 View File
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12, maxWidth: 200, whiteSpace: 'normal' }}>
                        {row.remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            row.status === 'Accepted'
                              ? 'ax-badge--success'
                              : row.status === 'In Progress'
                              ? 'ax-badge--info'
                              : 'ax-badge--warning'
                          }`}
                          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(row)}
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            lineHeight: 1.2,
                            height: 'auto',
                            minHeight: 'unset',
                          }}
                          title="View sites in this work order"
                        >
                          View Sites
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination in Footer */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Sites Detail Modal */}
      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Assigned RESCO Rooftop Sites Details"
        subtitle={selectedRecord ? `Vendor: ${selectedRecord.vendor} • District: ${selectedRecord.district}` : ''}
        maxWidth={720}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setSelectedRecord(null)}
          >
            Close
          </button>
        }
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
              <div><span style={{ color: '#64748b' }}>Assigned Date:</span> <strong>{selectedRecord.assign_date}</strong></div>
              <div><span style={{ color: '#64748b' }}>Deadline:</span> <strong>{selectedRecord.deadline}</strong></div>
              <div><span style={{ color: '#64748b' }}>Total Sites:</span> <strong>{selectedRecord.count}</strong></div>
              <div><span style={{ color: '#64748b' }}>Status:</span> <strong>{selectedRecord.status}</strong></div>
            </div>

            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Allocated Institutional Rooftops:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(selectedRecord.sites && selectedRecord.sites.length > 0 ? selectedRecord.sites : [
                {
                  id: 1,
                  site_name: selectedRecord.site_name.split(' - ')[0],
                  district: selectedRecord.district,
                  ca_no: 'CA-JK-78921',
                  capacity_kw: 35,
                  contact_person: 'Er. Incharge',
                  contact_phone: '9419123456',
                },
              ]).map((s: any, i: number) => (
                <div key={i} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{s.site_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {s.capacity_kw ? `Capacity: ${s.capacity_kw} kW • ` : ''}
                      District: {s.district} • CA No: {s.ca_no || 'CA-JK-78921'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11 }}>
                    <div style={{ color: '#2559bf', fontWeight: 600 }}>{s.contact_person || 'Supervisor'}</div>
                    <div style={{ color: '#64748b' }}>{s.contact_phone || '9419XXXXXX'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ViewAssignRescoInstallation;
