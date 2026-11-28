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
  biharAdminService,
  resolveBiharMediaUrl,
} from '../../bihar-services/biharAdminService';

/* ───────── Responsive page CSS (Exact Assam SWP View Assign Reference) ───────── */
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
    min-width: 180px;
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

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveBiharMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isHeic = /\.heic($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview allotment file"
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

export interface UlaBeneficiarySiteItem {
  id: number | string;
  unique_id: string;
  ca_no: string;
  beneficiary_name: string;
  contact: string;
  capacity?: string;
  district: string;
  block: string;
  village: string;
  status: string;
}

export interface UlaAssignItem {
  id: number;
  vendor: string;
  vendor_id?: string | number;
  assign_date: string;
  state: string;
  district: string;
  block: string;
  village: string;
  beneficiary_name: string;
  deadline: string;
  count: number;
  file?: string;
  remarks?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | string;
  site_details?: UlaBeneficiarySiteItem[];
}

export function BiharULAInstallationViewAssignSites() {
  const [data, setData] = useState<UlaAssignItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Selected assign for farmer allocations modal
  const [selectedAssignForSites, setSelectedAssignForSites] = useState<UlaAssignItem | null>(null);

  // Exact KPIs from user prompt & dashboard
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    notAssigned: 0,
    installationComplete: 0,
    installationPending: 0,
    verifyComplete: 0,
    verifyPending: 0,
    verifyReject: 0,
  });

  // Fetch Bihar ULA assignments
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch ULA View Assign: GET /admin/bihar/ula/installation/view-assign
      // Response: {success:true, data:{[session], assigns:[AssignUla rows with vendor], detail:{...}}}
      const res = await biharAdminService.getViewAssignUla();
      if (res && res.data) {
        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.assigns)
          ? res.data.assigns
          : Array.isArray(res?.assigns)
          ? res.assigns
          : Array.isArray(res.data?.assign_data)
          ? res.data.assign_data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        if (rawList.length > 0) {
          const mapped: UlaAssignItem[] = rawList.map((item: any, i: number) => {
            const rawStatus = item.status;
            let statusText = 'Pending';
            if (rawStatus === 1 || rawStatus === '1' || rawStatus === 'Approved') {
              statusText = 'Approved';
            } else if (rawStatus === 2 || rawStatus === '2' || rawStatus === 'Rejected') {
              statusText = 'Rejected';
            }

            const countNum = Number(item.count || item.site_count || (Array.isArray(item.sites) ? item.sites.length : 1)) || 1;
            const sites = Array.isArray(item.sites) && item.sites.length > 0
              ? item.sites.map((s: any, sIdx: number) => ({
                  id: s.id || sIdx + 1,
                  unique_id: s.unique_id || `ULA-${(item.district || 'BIH').substring(0, 3).toUpperCase()}-00${sIdx + 1}`,
                  ca_no: s.ca_no || `CA-${(item.district || 'BIH').substring(0, 3).toUpperCase()}-2024-0${sIdx + 1}`,
                  beneficiary_name: s.beneficiary_name || s.farmer_name || item.beneficiary_name || 'Farmer Beneficiary',
                  contact: s.contact || s.phone || '—',
                  capacity: s.capacity || '5 HP',
                  district: s.district || item.district || '—',
                  block: s.block || item.block || '—',
                  village: s.village || item.village || '—',
                  status: statusText,
                }))
              : [];

            return {
              id: item.id || i + 1,
              vendor: typeof item.vendor_name === 'string' && item.vendor_name
                ? item.vendor_name
                : typeof item.vendor === 'object' && item.vendor !== null
                ? (item.vendor.name || item.vendor.firm || item.vendor.company || '—')
                : (item.vendor || '—'),
              vendor_id: typeof item.vendor === 'object' && item.vendor !== null ? item.vendor.id : (item.vendor_id || item.vendor),
              assign_date: item.assign_date || item.created_at || '—',
              state: item.state || 'Bihar',
              district: item.district || '—',
              block: item.block || '—',
              village: item.village || '—',
              beneficiary_name: item.beneficiary_name || '—',
              deadline: item.deadline_date || item.deadline || '—',
              count: countNum,
              file: item.file || item.document || '',
              remarks: item.remarks || '',
              status: statusText,
              site_details: sites,
            };
          });

          setData(mapped);
        } else {
          setData([]);
        }

        // Parse detail object
        const det = res.data?.detail || res.data;
        if (det) {
          setStats({
            total: Number(det.total ?? 0),
            assigned: Number(det.assigned ?? 0),
            notAssigned: Number(det.not_assigned ?? det.notAssigned ?? 0),
            installationComplete: Number(det.install_complete ?? det.installationComplete ?? det.complete ?? 0),
            installationPending: Number(det.install_pending ?? det.installationPending ?? det.pending ?? 0),
            verifyComplete: Number(det.doc_approved ?? det.verifyComplete ?? 0),
            verifyPending: Number(det.doc_pending ?? det.verifyPending ?? 0),
            verifyReject: Number(det.doc_reject ?? det.verifyReject ?? 0),
          });
        }
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.warn('Bihar ULA view assign load error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Approve assign action
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await biharAdminService.approveUlaAssign(id);
      setSuccessMsg(`Assignment #${id} approved successfully!`);
      setData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: 'Approved' } : row))
      );
    } catch (err: any) {
      console.error(`Approval failed for #${id}:`, err);
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  // Distinct districts from assignments
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.district && r.district !== '—') set.add(r.district);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered assigns
  const filteredData = useMemo(() => {
    let list = data;
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (districtFilter !== 'all') {
      list = list.filter((r) => (r.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const vName = (row.vendor || '').toLowerCase();
      const dist = (row.district || '').toLowerCase();
      const block = (row.block || '').toLowerCase();
      const village = (row.village || '').toLowerCase();
      const bName = (row.beneficiary_name || '').toLowerCase();
      const state = (row.state || 'Bihar').toLowerCase();
      const remarks = (row.remarks || '').toLowerCase();
      const idStr = String(row.id);
      return (
        vName.includes(q) ||
        dist.includes(q) ||
        block.includes(q) ||
        village.includes(q) ||
        bName.includes(q) ||
        state.includes(q) ||
        remarks.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [data, searchQuery, statusFilter, districtFilter]);

  const pagination = usePagination(filteredData, { initialPageSize: 10 });

  // Export Columns definition
  const exportCols: ExportColumn<UlaAssignItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: UlaAssignItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r: UlaAssignItem) => r.vendor },
      { header: 'Assign Date', accessor: (r: UlaAssignItem) => fmtDate(r.assign_date) },
      { header: 'State', accessor: (r: UlaAssignItem) => (r.state || 'BIHAR').toUpperCase() },
      { header: 'District', accessor: (r: UlaAssignItem) => r.district || '—' },
      { header: 'Block', accessor: (r: UlaAssignItem) => r.block || '—' },
      { header: 'Village', accessor: (r: UlaAssignItem) => r.village || '—' },
      {
        header: 'Beneficiary Name - Deadline',
        accessor: (r: UlaAssignItem) => `${r.beneficiary_name} (Due: ${fmtDate(r.deadline)})`,
      },
      { header: 'Count', accessor: (r: UlaAssignItem) => r.count },
      { header: 'File', accessor: (r: UlaAssignItem) => r.file || '—' },
      { header: 'Remarks', accessor: (r: UlaAssignItem) => r.remarks || '—' },
      { header: 'Status', accessor: (r: UlaAssignItem) => r.status },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_ULA_View_Assign';
  const fileTitle = 'Bihar ULA Assigned Installation Register';

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

  // Status counts for subtitle
  const approvedCount = useMemo(() => data.filter((r) => r.status === 'Approved').length, [data]);
  const pendingCount = useMemo(() => data.filter((r) => r.status === 'Pending').length, [data]);
  const rejectedCount = useMemo(() => data.filter((r) => r.status === 'Rejected').length, [data]);

  return (
    <div className="solar-erp-page app-container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* PageHead */}
      <PageHead
        title="Bihar ULA Installation Data"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'Assign Bihar ULA Installation Data' },
        ]}
        actions={
          <Link
            to="/vendor-management/bihar/ula/installation/create-assign-site"
            className="ax-btn ax-btn--primary ax-btn--sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Assign Bihar ULA Installation
          </Link>
        }
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
          value={stats.total}
          sub={`Assigned: ${stats.assigned} / Unassigned: ${stats.notAssigned}`}
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
          value={stats.assigned}
          sub={`Total ${stats.total} site allocations in Bihar`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Installation Status"
          value={`${stats.installationComplete} Complete`}
          sub={`Pending: ${stats.installationPending}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verify Status"
          value={`${stats.verifyComplete} Complete`}
          sub={`Pending: ${stats.verifyPending} / Reject: ${stats.verifyReject}`}
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Assign Bihar ULA Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredData.length}</span> of <span className="ax-num">{data.length}</span> allocations
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Filter */}
              <select
                id="assign_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setCurrentPage(1);
                }}
                aria-label="Filter by approval status"
              >
                <option value="all">All Status</option>
                <option value="Approved">Approved ({approvedCount})</option>
                <option value="Pending">Pending ({pendingCount})</option>
                <option value="Rejected">Rejected ({rejectedCount})</option>
              </select>

              {/* District Filter */}
              {districtOptions.length > 0 && (
                <select
                  id="assign_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    pagination.setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districtOptions.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              )}

              {(searchQuery.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDistrictFilter('all');
                    pagination.setCurrentPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <Link
                to="/vendor-management/bihar/ula/installation/create-assign-site"
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
                + Assign New Installation
              </Link>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, block, beneficiary..."
                size="sm"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredData, exportCols)}
                onExportCSV={() => exportToCSV(filteredData, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredData, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredData, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Beneficiary Name - Deadline</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned installations...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState
                      title="No assignments found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No installation batches have been assigned yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.pagedItems.map((row: UlaAssignItem, idx: number) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.status === 'Approved';
                  const isRejected = row.status === 'Rejected';
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {row.vendor.charAt(0).toUpperCase()}
                          </span>
                          <span>{row.vendor}</span>
                        </div>
                      </td>
                      <td className="ax-table__td">{fmtDate(row.assign_date)}</td>
                      <td className="ax-table__td">{(row.state || 'Bihar').toUpperCase()}</td>
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>{row.district}</td>
                      <td className="ax-table__td">{row.block}</td>
                      <td className="ax-table__td">{row.village}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.beneficiary_name}</div>
                        <div style={{ fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Due: {fmtDate(row.deadline)}</span>
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedAssignForSites(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '3px 9px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Click to view allocated farmer beneficiaries"
                        >
                          <span>{row.count} Sites</span>
                          <span style={{ fontSize: 10 }}>↗</span>
                        </button>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={row.file} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
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
                        ) : isRejected ? (
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
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isLocked ? (
                          /* Locked Button Pattern - matching Karnataka & Assam */
                          <button
                            type="button"
                            disabled
                            title={`Assignment has been ${row.status} (Locked)`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 700,
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
                          <button
                            type="button"
                            onClick={() => handleApprove(row.id)}
                            disabled={approvingId === row.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 12px',
                              borderRadius: 6,
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: approvingId === row.id ? 'not-allowed' : 'pointer',
                              opacity: approvingId === row.id ? 0.7 : 1,
                              transition: 'background 0.15s ease',
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer Pagination ── */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-start' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>

      {/* ── Farmer Beneficiary Allocations Inspection Modal ── */}
      <Modal
        open={Boolean(selectedAssignForSites)}
        onClose={() => setSelectedAssignForSites(null)}
        title={
          selectedAssignForSites
            ? `Allocated Beneficiaries: ${selectedAssignForSites.vendor}`
            : 'Allocated Beneficiaries'
        }
        subtitle={
          selectedAssignForSites
            ? `${selectedAssignForSites.district} District · ${selectedAssignForSites.block} Block · Due ${fmtDate(selectedAssignForSites.deadline)}`
            : undefined
        }
        maxWidth={900}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={() => setSelectedAssignForSites(null)}
          >
            Close
          </button>
        }
      >
        {selectedAssignForSites && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Assigned Batch:</span>{' '}
                <strong style={{ color: '#1e293b' }}>#{selectedAssignForSites.id}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Assigned Date:</span>{' '}
                <strong style={{ color: '#1e293b' }}>{fmtDate(selectedAssignForSites.assign_date)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Target Deadline:</span>{' '}
                <strong style={{ color: '#ef4444' }}>{fmtDate(selectedAssignForSites.deadline)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Allocated Quota:</span>{' '}
                <strong style={{ color: '#2563eb' }}>{selectedAssignForSites.count} Sites</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Unique ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>CA Number</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Beneficiary Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Contact</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Capacity</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Block / Village</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedAssignForSites.site_details || []).map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#0284c7' }}>
                        {s.unique_id}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>
                        {s.ca_no}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                        {s.beneficiary_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {s.contact}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f766e' }}>
                        {s.capacity || '5 HP'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {s.block}, {s.village}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          className="ax-badge"
                          style={{
                            padding: '2px 6px',
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 4,
                            background: s.status === 'Approved' ? '#ecfdf5' : s.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                            color: s.status === 'Approved' ? '#16a34a' : s.status === 'Rejected' ? '#dc2626' : '#d97706',
                            border: `1px solid ${s.status === 'Approved' ? '#a7f3d0' : s.status === 'Rejected' ? '#fecaca' : '#fde68a'}`,
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ── File Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Allotment Work Order Document"
        subtitle="Bihar ULA Installation Authorization Attachment"
        maxWidth={720}
        footer={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--primary ax-btn--sm"
              >
                Download File
              </a>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setLightboxUrl(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            {/\.pdf($|\?)/i.test(lightboxUrl) ? (
              <iframe
                src={lightboxUrl}
                title="Document Preview"
                style={{ width: '100%', height: '540px', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Document Preview"
                style={{ maxWidth: '100%', maxHeight: '540px', borderRadius: 8, objectFit: 'contain' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BiharULAInstallationViewAssignSites;
