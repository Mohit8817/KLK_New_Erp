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
} from './jammuSwpAdminService';
import {
  fmtDate,
  DASH,
} from '../../../up/Installation/upInstallationShared';

/* ───────── Responsive page CSS (Exact Solar ERP / SRT reference) ───────── */
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 840px) {
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
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
  maxWidth = 780,
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
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

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

function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveJammuSwpMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
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
    >
      {isImage ? (
        <img
          src={url}
          alt="Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
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

export function ViewAssignSwpInstallation() {
  const [assigns, setAssigns] = useState<JammuSwpAssignRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    not_assigned: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Search, Status and District filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Selected assign for details modal
  const [selectedAssignForSites, setSelectedAssignForSites] = useState<JammuSwpAssignRecord | null>(null);

  // Fetch View Assign from live API
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuAdminSwpService.getViewAssign();
      setAssigns(res.assigns || []);
      if (res.detail) {
        setStats({
          total: Number(res.detail.total || 0),
          assigned: Number(res.detail.assigned || 0),
          not_assigned: Number(res.detail.not_assigned || 0),
          complete: Number(res.detail.complete || 0),
          pending: Number(res.detail.pending || 0),
          verify_approved: Number(res.detail.verify_approved || 0),
          verify_pending: Number(res.detail.verify_pending || 0),
          verify_reject: Number(res.detail.verify_reject || 0),
        });
      }
    } catch (err: any) {
      console.error('Failed to load Jammu SWP assignments:', err);
      setErrorMsg(err?.message || 'Failed to fetch assigned installations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Approve assign
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuAdminSwpService.approveAssign(id);
      if (res.success) {
        setSuccessMsg(res.message || `Assignment #${id} approved successfully!`);
        setAssigns((prev) => prev.map((a) => (a.id === id ? { ...a, status: 1 } : a)));
      } else {
        setErrorMsg(res.message || `Failed to approve assignment #${id}.`);
      }
    } catch (err: any) {
      console.error(`Approval failed for #${id}:`, err);
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  // Distinct districts
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    assigns.forEach((r) => {
      if (r.district && String(r.district).trim()) {
        set.add(String(r.district).trim());
      }
    });
    return Array.from(set).sort();
  }, [assigns]);

  // Filtered assigns
  const filteredAssigns = useMemo(() => {
    let list = assigns;
    if (statusFilter !== 'all') {
      list = list.filter((r) => String(r.status) === String(statusFilter));
    }
    if (districtFilter !== 'all') {
      list = list.filter((r) => String(r.district ?? '').trim() === districtFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const vName = row.vendors?.name?.toLowerCase() || '';
      const dist = row.district?.toLowerCase() || '';
      const state = row.state?.toLowerCase() || '';
      const remarks = row.remarks?.toLowerCase() || '';
      const sites = (row.sites || []).map((s) => (s.farmer_name || s.f_farmer_name || '').toLowerCase()).join(' ');
      const idStr = String(row.id);
      return (
        vName.includes(q) ||
        dist.includes(q) ||
        state.includes(q) ||
        remarks.includes(q) ||
        sites.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [assigns, searchQuery, statusFilter, districtFilter]);

  const pagination = usePagination(filteredAssigns, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<JammuSwpAssignRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuSwpAssignRecord, idx?: number) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendors?.name || (typeof r.vendor === 'string' ? r.vendor : `Vendor #${r.vendor}`) },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'District', accessor: (r) => r.district || DASH },
      {
        header: 'Applicant Name - Deadline',
        accessor: (r) => {
          if (r.sites && r.sites.length > 0) {
            return r.sites
              .map((s) => `${s.farmer_name || s.f_farmer_name || 'Farmer'} - ${fmtDate(s.inst_deadline || r.deadline_date)}`)
              .join('; ');
          }
          return `Site - ${fmtDate(r.deadline_date)}`;
        },
      },
      { header: 'Count', accessor: (r) => r.site_count || (r.sites ? r.sites.length : 1) },
      { header: 'File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      {
        header: 'Status',
        accessor: (r) => {
          const st = Number(r.status);
          return st === 2 ? 'Accepted' : st === 1 ? 'Approved' : 'Pending';
        },
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SWP_View_Assign';
  const fileTitle = 'Jammu SWP Assigned Installation Register';

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

  const exportToCSV = () => {
    if (!filteredAssigns.length) return;
    const out = [
      exportCols.map((c) => c.header ?? c.label ?? ''),
      ...filteredAssigns.map((row, idx) =>
        exportCols.map((c) => `"${String(typeof c.accessor === 'function' ? (c.accessor as any)(row, idx) : (c.accessor ? (row as any)[c.accessor] ?? '' : '')).replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `${fileBase}_${stamp}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredAssigns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${c.header ?? c.label ?? ''}</th>`).join('')}</tr></thead><tbody>${filteredAssigns.map((row, idx) => `<tr>${exportCols.map((c) => `<td>${String(typeof c.accessor === 'function' ? (c.accessor as any)(row, idx) : (c.accessor ? (row as any)[c.accessor] ?? '' : ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `${fileBase}_${stamp}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredAssigns.length) return;
    const body = filteredAssigns.map((row, idx) =>
      exportCols.map((c) => String(typeof c.accessor === 'function' ? (c.accessor as any)(row, idx) : (c.accessor ? (row as any)[c.accessor] ?? '' : '')))
    );
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>${fileTitle}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${fileTitle}</h1><table><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Assign Jammu SWP Installation"
        subtitle="Manage assigned vendor work orders, view applicant site allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SWP', href: '/vendor-management/jammu/installation/swp' },
          { label: 'View Assign' },
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

      {/* ── Exact 3 KPI Cards Requested: Total, Installation Status, Verify Status ── */}
      <div className="asw-cards-row">
        {/* Card 1: Total */}
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          tone="accent"
          label="Total"
          value={`${stats.total} / ${stats.assigned} / ${stats.not_assigned}`}
          sub="Total / Assigned / Not Assigned"
        />

        {/* Card 2: Installation Status */}
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Installation Status"
          value={`${stats.complete} / ${stats.pending}`}
          sub="Complete / Pending"
        />

        {/* Card 3: Verify Status */}
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          tone="cyan"
          label="Verify Status"
          value={`${stats.verify_approved} / ${stats.verify_pending} / ${stats.verify_reject}`}
          sub="Complete / Pending / Reject"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Assign Jammu SWP Installation</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredAssigns.length}</span> of <span className="ax-num">{assigns.length}</span> allocations
              {' '}· Approved <b className="ax-num">{assigns.filter((a) => Number(a.status) === 1).length}</b> · Accepted <b className="ax-num">{assigns.filter((a) => Number(a.status) === 2).length}</b> · Pending <b className="ax-num">{assigns.filter((a) => Number(a.status) === 0).length}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {availableDistricts.length > 0 && (
                <select
                  id="assign_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    pagination.setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              <select
                id="assign_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
                aria-label="Filter by approval status"
              >
                <option value="all">All Status</option>
                <option value="0">Pending (0)</option>
                <option value="1">Approved (1)</option>
                <option value="2">Accepted (2)</option>
              </select>

              <Link
                to="/vendor-management/jammu/installation/swp/assign-installation"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                + Assign Installation
              </Link>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, applicant..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => {}}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* ── Table with Exact Columns Requested ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Applicant Name - Deadline</th>
                <th className="ax-table__th">Count</th>
                <th className="ax-table__th">File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned installations...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState
                      title="No assignments found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No installation batches have been assigned yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: JammuSwpAssignRecord, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vendorName = row.vendors?.name || (typeof row.vendor === 'string' ? row.vendor : `Vendor #${row.vendor}`);

                  // Format Applicant Name - Deadline column
                  let applicantDeadlineStr = '—';
                  if (row.sites && row.sites.length > 0) {
                    const firstSite = row.sites[0];
                    const name = firstSite.farmer_name || firstSite.f_farmer_name || 'Farmer';
                    const dl = fmtDate(firstSite.inst_deadline || row.deadline_date);
                    applicantDeadlineStr = `${name} - ${dl}`;
                    if (row.sites.length > 1) {
                      applicantDeadlineStr += ` (+${row.sites.length - 1} more)`;
                    }
                  } else if (row.deadline_date) {
                    applicantDeadlineStr = `Deadline: ${fmtDate(row.deadline_date)}`;
                  }

                  const count = row.site_count || (row.sites ? row.sites.length : 1);

                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>

                      {/* 2. Vendor */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {vendorName}
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td">{fmtDate(row.assign_date || row.created_at)}</td>

                      {/* 4. State */}
                      <td className="ax-table__td">JAMMU</td>

                      {/* 5. District */}
                      <td className="ax-table__td">{row.district || '—'}</td>

                      {/* 6. Applicant Name - Deadline */}
                      <td className="ax-table__td" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {applicantDeadlineStr}
                      </td>

                      {/* 7. Count */}
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setSelectedAssignForSites(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Click to view applicant details"
                        >
                          {count} Site{count === 1 ? '' : 's'} ↗
                        </button>
                      </td>

                      {/* 8. File */}
                      <td className="ax-table__td">
                        <MediaFileThumbnail file={row.file} onClick={setLightboxUrl} />
                      </td>

                      {/* 9. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>

                      {/* 10. Status */}
                      <td className="ax-table__td">
                        {Number(row.status) === 2 ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#2563eb',
                              background: 'rgba(37, 99, 235, 0.1)',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                            Accepted
                          </span>
                        ) : Number(row.status) === 1 ? (
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

                      {/* 11. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {Number(row.status) === 0 && (
                            <button
                              type="button"
                              onClick={() => handleApprove(row.id)}
                              disabled={approvingId === row.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: approvingId === row.id ? 'not-allowed' : 'pointer',
                                opacity: approvingId === row.id ? 0.7 : 1,
                              }}
                            >
                              {approvingId === row.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}

                          <Link
                            to={`/vendor-management/jammu/installation/swp/assign-installation?edit=${row.id}`}
                            title="Edit Assignment"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#2563eb',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => setSelectedAssignForSites(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              color: 'var(--ax-text-strong)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
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

      {/* ── Modal Dialog: Assigned Applicant Details ── */}
      <Modal
        open={Boolean(selectedAssignForSites)}
        onClose={() => setSelectedAssignForSites(null)}
        title={`Assigned Applicants: ${selectedAssignForSites?.vendors?.name || (typeof selectedAssignForSites?.vendor === 'string' ? selectedAssignForSites.vendor : `Vendor #${selectedAssignForSites?.vendor}`)}`}
        subtitle={`Batch ID #${selectedAssignForSites?.id} • District: ${selectedAssignForSites?.district} • Total: ${selectedAssignForSites?.site_count || (selectedAssignForSites?.sites ? selectedAssignForSites.sites.length : 1)} Site(s)`}
        maxWidth={780}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setSelectedAssignForSites(null)}
            style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        }
      >
        {selectedAssignForSites && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Vendor</span>
                <strong style={{ fontSize: 13 }}>{selectedAssignForSites.vendors?.name || (typeof selectedAssignForSites.vendor === 'string' ? selectedAssignForSites.vendor : `Vendor #${selectedAssignForSites.vendor}`)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Deadline Date</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(selectedAssignForSites.deadline_date || (selectedAssignForSites.sites && selectedAssignForSites.sites[0]?.inst_deadline))}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Status</span>
                <strong
                  style={{
                    fontSize: 13,
                    color:
                      Number(selectedAssignForSites.status) === 2
                        ? '#2563eb'
                        : Number(selectedAssignForSites.status) === 1
                        ? '#10b981'
                        : '#d97706',
                  }}
                >
                  {Number(selectedAssignForSites.status) === 2
                    ? 'Accepted'
                    : Number(selectedAssignForSites.status) === 1
                    ? 'Approved'
                    : 'Pending'}
                </strong>
              </div>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th className="ax-table__th">#</th>
                    <th className="ax-table__th">Applicant ID</th>
                    <th className="ax-table__th">Applicant / Farmer Name</th>
                    <th className="ax-table__th">Deadline</th>
                    <th className="ax-table__th">District</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedAssignForSites.sites && selectedAssignForSites.sites.length > 0) ? (
                    selectedAssignForSites.sites.map((site, sIdx: number) => (
                      <tr key={site.id || sIdx}>
                        <td className="ax-table__td">{sIdx + 1}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          #{site.id}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{site.farmer_name || site.f_farmer_name || '—'}</td>
                        <td className="ax-table__td">{fmtDate(site.inst_deadline || selectedAssignForSites.deadline_date)}</td>
                        <td className="ax-table__td">{selectedAssignForSites.district || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                        No individual site items populated for this batch ID.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox Preview */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Work Order Preview</span>
              <button type="button" onClick={() => setLightboxUrl(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', minWidth: 320, minHeight: 240, maxHeight: '80vh', overflow: 'auto' }}>
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe src={lightboxUrl} title="PDF Preview" style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }} />
              ) : (
                <img src={lightboxUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAssignSwpInstallation;
