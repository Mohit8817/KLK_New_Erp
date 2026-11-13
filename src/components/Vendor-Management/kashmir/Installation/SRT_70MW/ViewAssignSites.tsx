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
  kashmirAdminService,
  resolveKashmirMediaUrl,
  type AssignRecord,
} from '../../kashmir-services';

/* ───────── Responsive page CSS (Exact Karnataka / Assam SWP View Assign Reference) ───────── */
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
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
    }
  }

  /* ───────── Unified Modal Styles ───────── */
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
    position: relative; z-index: 10000;
    background: #ffffff;
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: ax-modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes ax-modal-pop {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    background: transparent; border: none; cursor: pointer;
    width: 32px; height: 32px; border-radius: 8px;
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

const REFRESH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
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

export interface ParsedSiteItem {
  id?: string | number;
  name: string;
  deadline: string;
  district?: string;
}

const parseSiteItems = (row?: AssignRecord | null): ParsedSiteItem[] => {
  if (!row) return [];

  // 1. If row.sites or row.site_details is array of objects
  if (Array.isArray(row.sites) && row.sites.length > 0) {
    return row.sites.map((s: any, idx: number) => ({
      id: s.id ?? idx + 1,
      name: s.site_name || s.name || s.farmer_name || `Site #${s.id || idx + 1}`,
      deadline: fmtDate(s.deadline || s.deadline_date || row.deadline_date),
      district: s.district || row.district || '—',
    }));
  }
  if (Array.isArray(row.site_details) && row.site_details.length > 0) {
    return row.site_details.map((s: any, idx: number) => ({
      id: s.id ?? idx + 1,
      name: s.site_name || s.name || s.farmer_name || `Site #${s.id || idx + 1}`,
      deadline: fmtDate(s.deadline || s.deadline_date || row.deadline_date),
      district: s.district || row.district || '—',
    }));
  }

  // 2. If row.site_name is an object { [name]: deadline }
  const siteVal = row.site_name;
  if (!siteVal) return [];

  if (typeof siteVal === 'object' && !Array.isArray(siteVal)) {
    return Object.entries(siteVal).map(([name, dl], idx) => ({
      id: idx + 1,
      name,
      deadline: dl ? fmtDate(String(dl)) : fmtDate(row.deadline_date),
      district: row.district || '—',
    }));
  }

  // 3. If array of strings or objects
  if (Array.isArray(siteVal)) {
    return siteVal.map((s: any, idx) => {
      if (typeof s === 'object' && s !== null) {
        return {
          id: s.id || idx + 1,
          name: s.site_name || s.name || `Site #${idx + 1}`,
          deadline: fmtDate(s.deadline || row.deadline_date),
          district: s.district || row.district || '—',
        };
      }
      return {
        id: idx + 1,
        name: String(s),
        deadline: fmtDate(row.deadline_date),
        district: row.district || '—',
      };
    });
  }

  // 4. If JSON string
  try {
    const parsed = JSON.parse(String(siteVal));
    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed)) {
        return parsed.map((s: any, idx) => ({
          id: idx + 1,
          name: typeof s === 'object' ? s.site_name || s.name : String(s),
          deadline: fmtDate(typeof s === 'object' ? s.deadline : row.deadline_date),
          district: row.district || '—',
        }));
      }
      return Object.entries(parsed).map(([name, dl], idx) => ({
        id: idx + 1,
        name,
        deadline: dl ? fmtDate(String(dl)) : fmtDate(row.deadline_date),
        district: row.district || '—',
      }));
    }
  } catch {}

  return [{
    id: 1,
    name: String(siteVal),
    deadline: fmtDate(row.deadline_date),
    district: row.district || '—',
  }];
};

const siteCountOf = (r: AssignRecord): number => {
  if (r.sitecount != null && !isNaN(Number(r.sitecount))) return Number(r.sitecount);
  const items = parseSiteItems(r);
  return items.length || 1;
};

const vendorOf = (r: AssignRecord): string => {
  return r.vendors?.name || r.vendor_name || (r.vendor ? `Vendor #${r.vendor}` : '—');
};

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveKashmirMediaUrl(file);
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
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export function ViewAssignSites() {
  const [assigns, setAssigns] = useState<AssignRecord[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Search and status filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected assign for sites detail modal
  const [selectedAssignForSites, setSelectedAssignForSites] = useState<AssignRecord | null>(null);
  const [modalSiteSearch, setModalSiteSearch] = useState<string>('');

  // Fetch Kashmir SRT 70MW assignments
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await kashmirAdminService.getViewAssign();
      const records = res?.data?.amcsrtRecords || [];
      setAssigns(Array.isArray(records) ? records : []);
      setKpiData(res?.data || null);
    } catch (err: any) {
      console.error('Failed to load Kashmir assignments:', err);
      setErrorMsg(err?.message || 'Failed to fetch assigned installations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  // Approve assign
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await kashmirAdminService.approveAssign(id);
      setSuccessMsg(res?.message || `Site Assignment #${id} approved successfully!`);
      setAssigns((prev) => prev.map((a) => (a.id === id ? { ...a, status: 1 } : a)));
    } catch (err: any) {
      console.error(`Approval failed for #${id}:`, err);
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  // Filtered dataset
  const filteredAssigns = useMemo(() => {
    return assigns.filter((r) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (String(r.status) !== statusFilter) return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const vName = vendorOf(r).toLowerCase();
      const dist = (r.district || '').toLowerCase();
      const state = (r.state || '').toLowerCase();
      const remarks = (r.remarks || '').toLowerCase();
      const sites = parseSiteItems(r)
        .map((s) => s.name.toLowerCase())
        .join(' ');
      return (
        vName.includes(q) ||
        dist.includes(q) ||
        state.includes(q) ||
        remarks.includes(q) ||
        sites.includes(q) ||
        String(r.id).includes(q)
      );
    });
  }, [assigns, searchQuery, statusFilter]);

  const pagination = usePagination(filteredAssigns, { initialPageSize: 10 });

  // Export Columns definition
  const exportCols: ExportColumn<AssignRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => vendorOf(r) },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date || r.created_at) },
      { header: 'State', accessor: (r) => (r.state || 'Kashmir').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || '—' },
      {
        header: 'Site Names',
        accessor: (r) =>
          parseSiteItems(r)
            .map((s) => s.name)
            .join(', '),
      },
      { header: 'Site Count', accessor: (r) => siteCountOf(r) },
      { header: 'Deadline Date', accessor: (r) => fmtDate(r.deadline_date) },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
      {
        header: 'Status',
        accessor: (r) =>
          Number(r.status) === 2 ? 'Accepted' : Number(r.status) === 1 ? 'Approved' : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Kashmir_SRT70MW_View_Assign';
  const fileTitle = 'Kashmir SRT 70MW Assigned Installation Register';

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

  // Top 4 KPI Calculations (Matching Karnataka SWP / Assam SWP Reference)
  const totalSites = kpiData?.totalsite ?? assigns.length;
  const assignedSites = kpiData?.approvedsite ?? assigns.filter((a) => Number(a.status) >= 1).length;
  const completeInstall = kpiData?.complete ?? 0;
  const pendingInstall = kpiData?.pendingsite ?? assigns.filter((a) => Number(a.status) === 0).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Header with breadcrumbs and action button ── */}
      <PageHead
        title="View Kashmir SRT 70MW Installation"
        subtitle="View and approve site assignments for Kashmir SRT 70MW installation"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Kashmir SRT 70MW', href: '/vendor-management/kashmir/srt70mw/installation/dashboard' },
          { label: 'View Kashmir SRT 70MW Installation', href: '/vendor-management/kashmir/srt70mw/installation/view-assign' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchAssignments} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link
              to="/vendor-management/kashmir/srt70mw/installation/assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="ax-btn__label">Assign Site</span>
            </Link>
          </div>
        }
      />

      {errorMsg && !loading && (
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

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          tone="accent"
          label="Total Sites"
          value={totalSites}
          sub={`Assigned: ${assignedSites} / Pending: ${pendingInstall}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          }
          tone="cyan"
          label="Assigned Sites"
          value={assignedSites}
          sub="Dispatched to registered vendors"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Completed Installation"
          value={completeInstall}
          sub="Sites executed by field partners"
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
          value={pendingInstall}
          sub="Awaiting field completion"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Kashmir SRT 70MW Installation</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredAssigns.length}</span> of <span className="ax-num">{assigns.length}</span> allocations
              {' '}· Approved <b className="ax-num">{assigns.filter((a) => Number(a.status) === 1).length}</b> · Accepted <b className="ax-num">{assigns.filter((a) => Number(a.status) === 2).length}</b> · Pending <b className="ax-num">{assigns.filter((a) => Number(a.status) === 0).length}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="assign_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
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

              {(searchQuery.trim() !== '' || statusFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <Link
                to="/vendor-management/kashmir/srt70mw/installation/assign"
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
                + Assign Site
              </Link>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, site name..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredAssigns, exportCols)}
                onExportCSV={() => exportToCSV(filteredAssigns, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredAssigns, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredAssigns, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1100 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Count</th>
                <th className="ax-table__th">Deadline Date</th>
                <th className="ax-table__th">File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned installations...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState
                      title="No assignments found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No installation batches have been assigned yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: AssignRecord, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vendorName = vendorOf(row);
                  const sites = parseSiteItems(row);
                  const siteNames = sites
                    .map((s) => s.name)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ');
                  const extraCount = sites.length - 3;
                  const displaySiteStr = siteNames + (extraCount > 0 ? ` +${extraCount} more` : '');
                  const count = siteCountOf(row);
                  const deadlineStr = fmtDate(row.deadline_date) !== '—' ? fmtDate(row.deadline_date) : (sites[0]?.deadline || '—');

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {vendorName}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.assign_date || row.created_at)}</td>
                      <td className="ax-table__td">{(row.state || 'Kashmir').toUpperCase()}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displaySiteStr || '—'}
                      </td>
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
                          title="Click to view allocated sites"
                        >
                          {count} Site{count === 1 ? '' : 's'} ↗
                        </button>
                      </td>
                      <td className="ax-table__td">{deadlineStr}</td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail file={row.file} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>
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
                              {approvingId === row.id ? (
                                <>
                                  <span className="ax-spinner" style={{ width: 10, height: 10 }} />
                                  Approving...
                                </>
                              ) : (
                                'Approve'
                              )}
                            </button>
                          )}

                          {Number(row.status) === 2 ? (
                            <button
                              type="button"
                              disabled
                              title="Accepted by Vendor (Locked for editing)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <Link
                              to={`/vendor-management/kashmir/srt70mw/installation/assign?id=${row.id}&edit=${row.id}`}
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
                                cursor: 'pointer',
                              }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </Link>
                          )}

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

      {/* ── Modal Dialog: Assigned Sites Details ── */}
      <Modal
        open={Boolean(selectedAssignForSites)}
        onClose={() => {
          setSelectedAssignForSites(null);
          setModalSiteSearch('');
        }}
        title={`Assigned Sites: ${vendorOf(selectedAssignForSites || ({} as any))}`}
        subtitle={`Batch ID #${selectedAssignForSites?.id} • District: ${selectedAssignForSites?.district || '—'} • Total: ${parseSiteItems(selectedAssignForSites).length} Site(s)`}
        maxWidth={780}
        footer={
          <button
            type="button"
            onClick={() => {
              setSelectedAssignForSites(null);
              setModalSiteSearch('');
            }}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              borderRadius: 6,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        }
      >
        {selectedAssignForSites && (() => {
          const allSites = parseSiteItems(selectedAssignForSites);
          const filteredSites = modalSiteSearch.trim()
            ? allSites.filter((s) =>
                s.name.toLowerCase().includes(modalSiteSearch.toLowerCase()) ||
                (s.district || '').toLowerCase().includes(modalSiteSearch.toLowerCase())
              )
            : allSites;

          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Vendor</span>
                  <strong style={{ fontSize: 13 }}>{vendorOf(selectedAssignForSites)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Deadline Date</span>
                  <strong style={{ fontSize: 13 }}>{fmtDate(selectedAssignForSites.deadline_date) || allSites[0]?.deadline || '—'}</strong>
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

              {allSites.length > 5 && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    value={modalSiteSearch}
                    onChange={(e) => setModalSiteSearch(e.target.value)}
                    placeholder="Search site name or district in this batch..."
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 32, fontSize: 12 }}
                  />
                </div>
              )}

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th className="ax-table__th">#</th>
                      <th className="ax-table__th">Site ID / Name</th>
                      <th className="ax-table__th">District</th>
                      <th className="ax-table__th">Deadline Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSites.length > 0 ? (
                      filteredSites.map((site, sIdx) => (
                        <tr key={site.id || sIdx}>
                          <td className="ax-table__td">{sIdx + 1}</td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {site.name}
                          </td>
                          <td className="ax-table__td">
                            {site.district || selectedAssignForSites.district || '—'}
                          </td>
                          <td className="ax-table__td">
                            {site.deadline || fmtDate(selectedAssignForSites.deadline_date)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                          No individual site details populated for this batch ID.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Document / File Lightbox Preview Modal ── */}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                Assignment Work Order Preview
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
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
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  aria-label="Close preview"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minWidth: 320,
                minHeight: 240,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : /\.(heic|docx?|xlsx?)($|\?)/i.test(lightboxUrl) ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Direct preview not supported for this file format in browser.
                  </p>
                  <a
                    href={lightboxUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#2563eb',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Download / Open File
                  </a>
                </div>
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Document Preview"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAssignSites;
