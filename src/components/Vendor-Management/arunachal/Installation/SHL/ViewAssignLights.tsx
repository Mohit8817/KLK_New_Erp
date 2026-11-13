import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
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
  type AssignLightRecord,
  type AssignSummaryCounts,
} from '../../arunachal-services';

/* ───────── Responsive page CSS (all columns scrollable) ───────── */
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
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
export function ViewAssignLights() {
  const navigate = useNavigate();

  // Data states
  const [assigns, setAssigns] = useState<AssignLightRecord[]>([]);
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

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedRecordForPanchayats, setSelectedRecordForPanchayats] = useState<AssignLightRecord | null>(null);
  const [approvingRecord, setApprovingRecord] = useState<AssignLightRecord | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

<<<<<<< HEAD
  // Vendor Name Lookup Map (populated from getAssignFormData, getDashboard + known fallbacks)
=======
  // Vendor Name Lookup Map (populated from getAssignFormData + known fallbacks)
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
  const [vendorMap, setVendorMap] = useState<Record<string | number, string>>({
    '142': 'App Testing',
    '212': 'mohit',
  });

  const getVendorName = useCallback(
    (r?: Partial<AssignLightRecord> | null): string => {
      if (!r) return '—';
<<<<<<< HEAD
      if (r.vendors && typeof r.vendors === 'object') {
        if (r.vendors.name) return r.vendors.name;
        if (r.vendors.vendor_name) return r.vendors.vendor_name;
      }
      if (typeof r.vendors === 'string' && r.vendors.trim()) return r.vendors.trim();
      if (r.vendor_name) return r.vendor_name;
      const vid = r.vendor ?? r.inst_vendor ?? (r.vendors as any)?.id;
=======
      if (r.vendors?.name) return r.vendors.name;
      if (r.vendor_name) return r.vendor_name;
      const vid = r.vendor ?? r.inst_vendor;
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
      if (vid !== undefined && vid !== null && String(vid).trim() !== '') {
        const key = String(vid).trim();
        if (vendorMap[key]) return vendorMap[key];
        if (key === '142') return 'App Testing';
        if (key === '212') return 'mohit';
<<<<<<< HEAD
        return `Vendor ${key}`;
=======
        return `Vendor #${key}`;
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
      }
      return '—';
    },
    [vendorMap]
  );

  // Helper to parse panchayat array or string
  const formatPanchayats = (p: any): string[] => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === 'string') {
      try {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return p.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [p];
    }
    return [];
  };

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
<<<<<<< HEAD
      const [res, formRes, dashRes] = await Promise.allSettled([
        arunachalAdminService.getViewAssign(),
        arunachalAdminService.getAssignFormData(),
        arunachalAdminService.getDashboard(),
=======
      const [res, formRes] = await Promise.allSettled([
        arunachalAdminService.getViewAssign(),
        arunachalAdminService.getAssignFormData(),
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
      ]);

      if (res.status === 'fulfilled') {
        setCounts({
          claimedapplicable: res.value.claimedapplicable,
          approvedsite: res.value.approvedsite,
          verifypending: res.value.verifypending,
          rejectsite: res.value.rejectsite,
          paymentsitecount: res.value.paymentsitecount,
          complete: res.value.complete,
          totalsite: res.value.totalsite,
          pendingsite: res.value.pendingsite,
        });
        setAssigns(res.value.assignedlight || []);
      } else {
        throw res.reason;
      }

<<<<<<< HEAD
      const vMap: Record<string | number, string> = {
        '142': 'App Testing',
        '212': 'mohit',
      };
      if (formRes.status === 'fulfilled' && Array.isArray(formRes.value.vendors)) {
=======
      if (formRes.status === 'fulfilled' && Array.isArray(formRes.value.vendors)) {
        const vMap: Record<string | number, string> = {
          '142': 'App Testing',
          '212': 'mohit',
        };
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
        formRes.value.vendors.forEach((v: any) => {
          const id = v.id ?? v.vendor;
          const name = v.name ?? v.vendor_name;
          if (id && name) vMap[String(id).trim()] = String(name).trim();
        });
<<<<<<< HEAD
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
=======
        setVendorMap((prev) => ({ ...prev, ...vMap }));
      }
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
      setErrorMsg(err.message || 'Failed to load assigned lights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = assigns;
    if (statusFilter !== 'all') {
      const target = Number(statusFilter);
      list = list.filter((r) => Number(r.status) === target);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const batchId = String(r.id || '').toLowerCase();
        const vName = getVendorName(r).toLowerCase();
        const createdBy = String(r.created_by || '').toLowerCase();
        const dist = (r.district || '').toLowerCase();
        const blk = (r.block || '').toLowerCase();
        const vol = (r.volume || '').toLowerCase();
        const rem = (r.remark || r.remarks || '').toLowerCase();
        const pList = formatPanchayats(r.panchayat).join(' ').toLowerCase();

        return (
          batchId.includes(q) ||
          vName.includes(q) ||
          createdBy.includes(q) ||
          dist.includes(q) ||
          blk.includes(q) ||
          vol.includes(q) ||
          rem.includes(q) ||
          pList.includes(q)
        );
      });
    }

    // Sort by id descending so newest assignments always show at the top
    return [...list].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [assigns, statusFilter, searchQuery, getVendorName]);

<<<<<<< HEAD
  // Pagination
  const pagination = usePagination(filteredRows, { initialPageSize: 10 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery, statusFilter]);
=======
  // Pagination - 100 per page so all assignments show up immediately
  const pagination = usePagination(filteredRows, { initialPageSize: 100 });
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6

  // Export columns
  const exportCols: ExportColumn<AssignLightRecord>[] = useMemo(
    () => [
      {
        header: 'Sr. No.',
        accessor: (_r: AssignLightRecord, idx?: number) => (idx !== undefined ? idx + 1 : 1),
      } as any,
      {
        header: 'Batch ID',
<<<<<<< HEAD
        accessor: (r: AssignLightRecord) => String(r.id),
=======
        accessor: (r: AssignLightRecord) => `#${r.id}`,
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
      },
      {
        header: 'Vendor',
        accessor: (r: AssignLightRecord) => getVendorName(r),
      },
      {
        header: 'Assign Date',
        accessor: (r: AssignLightRecord) => fmtDate(r.sdate || r.created_at),
      },
      {
        header: 'State',
        accessor: (r: AssignLightRecord) => r.state?.toUpperCase() || 'ARUNACHAL PRADESH',
      },
      {
        header: 'Volume',
        accessor: (r: AssignLightRecord) => r.volume || '—',
      },
      {
        header: 'District',
        accessor: (r: AssignLightRecord) => r.district || '—',
      },
      {
        header: 'Block',
        accessor: (r: AssignLightRecord) => r.block || '—',
      },
      {
        header: 'Panchayat',
        accessor: (r: AssignLightRecord) => formatPanchayats(r.panchayat).join(', ') || '—',
      },
      {
        header: 'Count',
        accessor: (r: AssignLightRecord) => r.sitecount ?? r.site_count ?? 0,
      },
      {
        header: 'Material Match',
        accessor: (r: AssignLightRecord) => (Number(r.match_material) === 1 ? 'Matched' : 'Pending'),
      },
      {
        header: 'Deadline Date',
        accessor: (r: AssignLightRecord) => fmtDate(r.ldate || r.deadline_date),
      },
      {
        header: 'Created By',
        accessor: (r: AssignLightRecord) => r.created_by || '—',
      },
      {
        header: 'File',
        accessor: (r: AssignLightRecord) => r.file || r.document || r.uid_file || r.battery_no_file || r.panel_no_file || '—',
      },
      {
        header: 'Remarks',
        accessor: (r: AssignLightRecord) => r.remark || r.remarks || '—',
      },
      {
        header: 'Status',
        accessor: (r: AssignLightRecord) =>
          Number(r.status) === 2 ? 'Accepted' : Number(r.status) === 1 ? 'Approved' : 'Pending',
      },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Arunachal_SHL_View_Assign';
  const fileTitle = 'Arunachal SHL Assigned Installation Register';

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

  // Handle Approve Action
  const handleConfirmApprove = async () => {
    if (!approvingRecord) return;
    setIsApproving(true);
    try {
      await arunachalAdminService.approveAssign(approvingRecord.id);
<<<<<<< HEAD
      setSuccessMsg(`Assignment ID: ${approvingRecord.id} approved successfully and vendor notified.`);
=======
      setSuccessMsg(`Assignment #${approvingRecord.id} approved successfully and vendor notified.`);
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
      setApprovingRecord(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve assignment');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Header */}
      <PageHead
        title="Arunachal Pradesh SHL View Installation"
        subtitle="Assigned  (SHL) overview, panchayat allocations, and dispatch authorization."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Arunachal SHL', href: '/vendor-management/arunachal/shl/dashboard' },
          { label: 'View Assign Lights' },
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
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
            sub="Installation verified on ground"
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
            sub="Awaiting installation execution"
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
            sub="Authorized by administrative team"
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
            sub="Rejected / Requires re-inspection"
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
            sub="Installed & pending site verification"
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
            sub="Eligible for subsidy/incentive billing"
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
            sub="Fully paid and settled sites"
          />
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                View Assign SHL Light
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                Comprehensive register of solar street lights assigned to vendors across Arunachal Pradesh districts and panchayats.
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* Status Filter Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter assignments by status"
                  style={{
                    height: 32,
                    fontSize: 12,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: '1px solid var(--ax-border, #cbd5e1)',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Statuses ({assigns.length})</option>
                  <option value="0">Pending ({assigns.filter((r) => Number(r.status) === 0).length})</option>
                  <option value="1">Approved ({assigns.filter((r) => Number(r.status) === 1).length})</option>
                  <option value="2">Accepted ({assigns.filter((r) => Number(r.status) === 2).length})</option>
                </select>

                {/* Reset Filter Button */}
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </button>
                )}

                <Link
                  to="/vendor-management/arunachal/shl/assign-light"
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
                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Assign New Lights
                </Link>

                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search vendor, district, block..."
                  size="sm"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredRows, exportCols)}
                  onExportCSV={() => exportToCSV(filteredRows, exportCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredRows, exportCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredRows, exportCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          {/* ── Responsive Horizontal Scroll Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1350 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" style={{ width: 90 }}>Batch ID</th>
                  <th className="ax-table__th">Vendor</th>
                  <th className="ax-table__th">Assign Date</th>
                  <th className="ax-table__th">State</th>
                  <th className="ax-table__th">Volume</th>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Block</th>
                  <th className="ax-table__th">Panchayat</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Count</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Material Match</th>
                  <th className="ax-table__th">Deadline Date</th>
                  <th className="ax-table__th">Created By</th>
                  <th className="ax-table__th">File</th>
                  <th className="ax-table__th">Remarks</th>
                  <th className="ax-table__th">Status</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={17} style={centerCell}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="ax-spinner" aria-hidden="true" />
                        <span>Loading assigned SHL lights...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={17} style={centerCell}>
                      <TableEmptyState
                        title="No assignments found"
                        description={
                          searchQuery
                            ? 'Try adjusting your search criteria'
                            : 'No SHL lights have been assigned yet'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((row: AssignLightRecord, idx: number) => {
                    const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const vendorName = getVendorName(row);
                    const pList = formatPanchayats(row.panchayat);
                    const count = row.sitecount ?? row.site_count ?? (pList.length > 0 ? pList.length : 0);
                    const isAccepted = Number(row.status) === 2;
                    const isApproved = Number(row.status) === 1;
                    const attachedFile = row.file || row.document || row.uid_file || row.battery_no_file || row.panel_no_file || row.sim_no_file || row.imei_no_file;

                    return (
                      <tr key={row.id}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                        <td className="ax-table__td">
                          <span
                            className="ax-badge"
                            style={{
                              background: 'rgba(37, 99, 235, 0.12)',
                              color: '#2563eb',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
<<<<<<< HEAD
                            {row.id}
=======
                            #{row.id}
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {vendorName}
                        </td>
                        <td className="ax-table__td">{fmtDate(row.sdate || row.created_at)}</td>
                        <td className="ax-table__td">{row.state?.toLowerCase().includes('arunachal') ? 'ARUNACHAL PRADESH' : (row.state?.toUpperCase() || 'ARUNACHAL PRADESH')}</td>
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
                            {row.volume || '—'}
                          </span>
                        </td>
                        <td className="ax-table__td">{row.district || '—'}</td>
                        <td className="ax-table__td">{row.block || '—'}</td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {pList.join(', ') || '—'}
                            </span>
                            {pList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setSelectedRecordForPanchayats(row)}
                                style={{
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  color: '#2563eb',
                                  border: '1px solid rgba(37, 99, 235, 0.25)',
                                  borderRadius: 4,
                                  padding: '1px 6px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title="Click to view assigned panchayats breakdown"
                              >
                                {pList.length} Panchayats ↗
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                          {count}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {Number(row.match_material) === 1 ? (
                            <span
                              className="ax-badge"
                              style={{
                                background: 'rgba(22, 163, 74, 0.12)',
                                color: '#16a34a',
                                fontWeight: 700,
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              Matched
                            </span>
                          ) : (
                            <span
                              className="ax-badge"
                              style={{
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                fontWeight: 700,
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="ax-table__td">{fmtDate(row.ldate || row.deadline_date)}</td>
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>
                          {row.created_by || '—'}
                        </td>
                        <td className="ax-table__td">
                          <MediaFileThumbnail file={attachedFile} onClick={setLightboxUrl} />
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.remark || row.remarks || ''}>
                          {row.remark || row.remarks || '—'}
                        </td>
                        <td className="ax-table__td">
                          {isAccepted ? (
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
                          ) : isApproved ? (
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            {/* Approve Button (when pending) */}
                            {!isApproved && !isAccepted && (
                              <button
                                type="button"
                                onClick={() => setApprovingRecord(row)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease',
                                }}
                                title="Approve this lights assignment batch"
                              >
                                Approve
                              </button>
                            )}

                            {/* Edit / Locked Button */}
                            {isAccepted ? (
                              <button
                                type="button"
                                disabled
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'var(--ax-surface-subtle)',
                                  border: '1px solid var(--ax-border)',
                                  color: 'var(--ax-text-muted)',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'not-allowed',
                                  opacity: 0.75,
                                }}
                                title="Assignment accepted by vendor — locked from editing"
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
                                onClick={() => navigate(`/vendor-management/arunachal/shl/assign-light?edit=${row.id}`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: '#ffffff',
                                  border: '1px solid var(--ax-border, #cbd5e1)',
                                  color: '#334155',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Edit this assignment"
                              >
                                Edit
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

          {/* Left-Aligned Pagination */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pagination.curPage}
<<<<<<< HEAD
                curPage={pagination.curPage}
                totalItems={pagination.totalItems}
                total={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                setPage={pagination.setPage}
=======
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal Dialog: Assigned Panchayats Breakdown ── */}
      <Modal
        open={Boolean(selectedRecordForPanchayats)}
        onClose={() => setSelectedRecordForPanchayats(null)}
        title={`Assigned Panchayats Breakdown: ${getVendorName(selectedRecordForPanchayats)}`}
<<<<<<< HEAD
        subtitle={`Batch ID: ${selectedRecordForPanchayats?.id} • District: ${selectedRecordForPanchayats?.district} • Block: ${selectedRecordForPanchayats?.block} • Volume: ${selectedRecordForPanchayats?.volume}`}
=======
        subtitle={`Batch ID #${selectedRecordForPanchayats?.id} • District: ${selectedRecordForPanchayats?.district} • Block: ${selectedRecordForPanchayats?.block} • Volume: ${selectedRecordForPanchayats?.volume}`}
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
        maxWidth={780}
        footer={
          <button
            type="button"
            onClick={() => setSelectedRecordForPanchayats(null)}
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
        {selectedRecordForPanchayats && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 16,
                background: '#f8fafc',
                padding: 14,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Vendor</span>
                <strong style={{ fontSize: 13 }}>{getVendorName(selectedRecordForPanchayats)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Total Allocated Lights</span>
                <strong style={{ fontSize: 13, color: '#2563eb' }}>{selectedRecordForPanchayats.sitecount ?? selectedRecordForPanchayats.site_count ?? 0} Lights</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Deadline Date</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(selectedRecordForPanchayats.ldate || selectedRecordForPanchayats.deadline_date)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Status</span>
                <strong
                  style={{
                    fontSize: 13,
                    color:
                      Number(selectedRecordForPanchayats.status) === 2
                        ? '#2563eb'
                        : Number(selectedRecordForPanchayats.status) === 1
                        ? '#16a34a'
                        : '#d97706',
                  }}
                >
                  {Number(selectedRecordForPanchayats.status) === 2
                    ? 'Accepted'
                    : Number(selectedRecordForPanchayats.status) === 1
                    ? 'Approved'
                    : 'Pending'}
                </strong>
              </div>
            </div>

            {selectedRecordForPanchayats.remark && (
              <div style={{ marginBottom: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#475569' }}>
                <strong>Remarks:</strong> {selectedRecordForPanchayats.remark}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Allocated Panchayats ({formatPanchayats(selectedRecordForPanchayats.panchayat).length}):
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
<<<<<<< HEAD
                    <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
=======
                    <th className="ax-table__th" style={{ width: 60 }}>#</th>
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
                    <th className="ax-table__th">Panchayat Name</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Block</th>
                    <th className="ax-table__th">Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {formatPanchayats(selectedRecordForPanchayats.panchayat).length > 0 ? (
                    formatPanchayats(selectedRecordForPanchayats.panchayat).map((pName, pIdx) => (
                      <tr key={pIdx}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{pIdx + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>{pName}</td>
                        <td className="ax-table__td">{selectedRecordForPanchayats.district || '—'}</td>
                        <td className="ax-table__td">{selectedRecordForPanchayats.block || '—'}</td>
                        <td className="ax-table__td">
                          <span
                            style={{
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#2563eb',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Assigned
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                        No panchayats recorded for this assignment batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Confirm Approval ── */}
      <Modal
        open={Boolean(approvingRecord)}
        onClose={() => {
          if (!isApproving) setApprovingRecord(null);
        }}
        title="Approve SHL Lights Assignment"
        maxWidth={480}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setApprovingRecord(null)}
              disabled={isApproving}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmApprove}
              disabled={isApproving}
              style={{
                background: '#2563eb',
                borderColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                padding: '6px 16px',
                fontSize: 13,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isApproving ? 'Approving...' : 'Confirm Approval'}
            </button>
          </>
        }
      >
        {approvingRecord && (
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px' }}>
              Are you sure you want to approve SHL assignment{' '}
<<<<<<< HEAD
              <strong>ID: {approvingRecord.id}</strong> for{' '}
=======
              <strong>#{approvingRecord.id}</strong> for{' '}
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
              <strong>{getVendorName(approvingRecord)}</strong>?
            </p>
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: 12,
                color: '#1e40af',
                fontSize: 12,
              }}
            >
              This will update the assignment status to <strong>Approved</strong> and notify the vendor for execution.
            </div>
          </div>
        )}
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
                Assignment Document Preview
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
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  &times;
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

export default ViewAssignLights;
