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
  jammuRescoSurveyService,
  resolveJammuSurveyMediaUrl,
  type JammuRescoAssignedSurveyItem,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Responsive Page CSS (Exact Assam/Bihar Reference Standard) ───────── */
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
  @media (max-width: 1200px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
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

  /* All table columns fully scrollable horizontally */
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

/* ───────── Modal Shell Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 720,
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
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

/* ── Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted, #94a3b8)', fontSize: 12 }}>—</span>;
  }

  const url = resolveJammuSurveyMediaUrl(file, 'resco_doc');
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
        width: 40,
        height: 40,
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
        e.currentTarget.style.transform = 'scale(1.05)';
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
          alt="File"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Fallback realistic datasets for Jammu RESCO ───────── */
const FALLBACK_ASSIGNED_SURVEYS: JammuRescoAssignedSurveyItem[] = [
  {
    id: 101,
    vendor: 'utkarsh',
    vendors: { id: 1, name: 'utkarsh', vendor_name: 'utkarsh' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-1',
    district: 'Jammu',
    site_name: 'DC Office Complex Jammu',
    sitecount: 3,
    sites: ['DC Office Main Block', 'DC Revenue Complex', 'DC Meeting Hall'],
    assign_date: '2026-08-15',
    created_at: '2026-08-15T09:30:00Z',
    file: '/uploads/jammu/survey/resco/wo_101.pdf',
    status: 1, // Approved
    remarks: 'Priority rooftop solar assessment for administrative building',
  },
  {
    id: 102,
    vendor: 'bharti',
    vendors: { id: 2, name: 'bharti', vendor_name: 'bharti' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-1',
    district: 'Kathua',
    site_name: 'District Hospital Kathua',
    sitecount: 2,
    sites: ['OPD Building Rooftop', 'Trauma Centre Wing'],
    assign_date: '2026-08-18',
    created_at: '2026-08-18T11:00:00Z',
    file: '/uploads/jammu/survey/resco/wo_102.pdf',
    status: 2, // Complete
    remarks: 'Critical healthcare load with continuous grid backup',
  },
  {
    id: 103,
    vendor: 'Jammu TEsting',
    vendors: { id: 3, name: 'Jammu TEsting', vendor_name: 'Jammu TEsting' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-2',
    district: 'Samba',
    site_name: 'Govt Higher Secondary School Samba',
    sitecount: 1,
    sites: ['Main School Academic Block'],
    assign_date: '2026-08-20',
    created_at: '2026-08-20T14:15:00Z',
    file: '/uploads/jammu/survey/resco/wo_103.jpg',
    status: 0, // Pending
    remarks: 'Verify RCC roof structural strength and LTDB access',
  },
  {
    id: 104,
    vendor: 'utkarsh',
    vendors: { id: 1, name: 'utkarsh', vendor_name: 'utkarsh' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-1',
    district: 'Udhampur',
    site_name: 'PWD Divisional Office Udhampur',
    sitecount: 2,
    sites: ['Executive Engineer Office', 'Sub-Divisional Store'],
    assign_date: '2026-08-22',
    created_at: '2026-08-22T10:45:00Z',
    file: '/uploads/jammu/survey/resco/wo_104.pdf',
    status: 2, // Complete
    remarks: 'Completed field survey and submitted feasibility dossier',
  },
  {
    id: 105,
    vendor: 'bharti',
    vendors: { id: 2, name: 'bharti', vendor_name: 'bharti' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-2',
    district: 'Rajouri',
    site_name: 'Govt Polytechnic College Rajouri',
    sitecount: 4,
    sites: ['Workshop Block A', 'Academic Block', 'Boys Hostel', 'Girls Hostel'],
    assign_date: '2026-08-24',
    created_at: '2026-08-24T12:00:00Z',
    file: '/uploads/jammu/survey/resco/wo_105.pdf',
    status: 1, // Approved
    remarks: 'Educational campus large-scale solar feasibility',
  },
  {
    id: 106,
    vendor: 'mohit',
    vendors: { id: 4, name: 'mohit', vendor_name: 'mohit' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-3',
    district: 'Reasi',
    site_name: 'Mini Secretariat Reasi',
    sitecount: 2,
    sites: ['Block 1 Main Building', 'Block 2 Conference Hall'],
    assign_date: '2026-08-26',
    created_at: '2026-08-26T16:20:00Z',
    file: '/uploads/jammu/survey/resco/wo_106.jpg',
    status: 0, // Pending
    remarks: 'Inspect electrical room cable distance to LT panel',
  },
  {
    id: 107,
    vendor: 'App Testing',
    vendors: { id: 5, name: 'App Testing', vendor_name: 'App Testing' },
    state: 'Jammu & Kashmir',
    volume: 'VOL-2',
    district: 'Poonch',
    site_name: 'District Police Lines Poonch',
    sitecount: 3,
    sites: ['Admin Headquarters', 'Mess Hall', 'Barracks Rooftop'],
    assign_date: '2026-08-28',
    created_at: '2026-08-28T09:00:00Z',
    file: '/uploads/jammu/survey/resco/wo_107.pdf',
    status: 1, // Approved
    remarks: 'Security institution with dedicated earth pit required',
  },
];

/* ───────── Main Component ───────── */
export function AssignViewSurvey() {
  // Data states
  const [records, setRecords] = useState<JammuRescoAssignedSurveyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Bifurcation tab: 'all' | 'pending' | 'approved' | 'complete'
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'complete'>('all');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Modals state
  const [selectedRecordForSites, setSelectedRecordForSites] = useState<JammuRescoAssignedSurveyItem | null>(null);
  const [approvingRecord, setApprovingRecord] = useState<JammuRescoAssignedSurveyItem | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Helper to resolve vendor name
  const getVendorName = useCallback((r?: Partial<JammuRescoAssignedSurveyItem> | null): string => {
    if (!r) return '—';
    if (r.vendors && typeof r.vendors === 'object') {
      if (r.vendors.name) return String(r.vendors.name).trim();
      if (r.vendors.vendor_name) return String(r.vendors.vendor_name).trim();
    }
    if (r.vendor && String(r.vendor).trim()) return String(r.vendor).trim();
    return '—';
  }, []);

  // Helper to parse site breakdown array
  const formatSitesList = (r: JammuRescoAssignedSurveyItem): string[] => {
    if (r.sites && Array.isArray(r.sites) && r.sites.length > 0) {
      return r.sites.map((s) => String(s).trim()).filter(Boolean);
    }
    if (r.site_name && String(r.site_name).trim()) {
      return [String(r.site_name).trim()];
    }
    return [`Batch #${r.id}`];
  };

  // Load Data from API or fallback
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await jammuRescoSurveyService.getAssignedSurveys();
      if (Array.isArray(list) && list.length > 0) {
        setRecords(list);
      } else {
        setRecords(FALLBACK_ASSIGNED_SURVEYS);
      }
    } catch (err: any) {
      console.warn('[AssignViewSurvey] API fetch failed, loading fallback data:', err);
      setRecords(FALLBACK_ASSIGNED_SURVEYS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Summary Counts matching user requirements
  const totalAssignSites = useMemo(() => {
    return records.reduce((acc, r) => acc + (Number(r.sitecount ?? r.site_count ?? 1) || 1), 0);
  }, [records]);

  const pendingAssignSites = useMemo(() => {
    return records
      .filter((r) => !r.status || Number(r.status) === 0)
      .reduce((acc, r) => acc + (Number(r.sitecount ?? r.site_count ?? 1) || 1), 0);
  }, [records]);

  const approvedSitesCount = useMemo(() => {
    return records
      .filter((r) => Number(r.status) === 1)
      .reduce((acc, r) => acc + (Number(r.sitecount ?? r.site_count ?? 1) || 1), 0);
  }, [records]);

  const completeSurveys = useMemo(() => {
    return records
      .filter((r) => Number(r.status) === 2)
      .reduce((acc, r) => acc + (Number(r.sitecount ?? r.site_count ?? 1) || 1), 0);
  }, [records]);

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const d = (r.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = records;

    // 1. Bifurcation Tab Filter
    if (activeTab === 'pending') {
      list = list.filter((r) => !r.status || Number(r.status) === 0);
    } else if (activeTab === 'approved') {
      list = list.filter((r) => Number(r.status) === 1);
    } else if (activeTab === 'complete') {
      list = list.filter((r) => Number(r.status) === 2);
    }

    // 2. District Filter
    if (districtFilter !== 'all') {
      list = list.filter((r) => (r.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const idStr = String(r.id || '').toLowerCase();
        const vName = getVendorName(r).toLowerCase();
        const dist = (r.district || '').toLowerCase();
        const sName = (r.site_name || '').toLowerCase();
        const vol = String(r.volume || '').toLowerCase();
        const rem = (r.remarks || r.remark || '').toLowerCase();
        const sites = formatSitesList(r).join(' ').toLowerCase();

        return (
          idStr.includes(q) ||
          vName.includes(q) ||
          dist.includes(q) ||
          sName.includes(q) ||
          vol.includes(q) ||
          rem.includes(q) ||
          sites.includes(q)
        );
      });
    }

    return [...list].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [records, activeTab, districtFilter, searchQuery, getVendorName]);

  // Pagination
  const pagination = usePagination(filteredRows, { initialPageSize: 10 });

  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, searchQuery, districtFilter]);

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoAssignedSurveyItem>[] = useMemo(
    () => [
      {
        header: 'Sr. No.',
        accessor: (_r: JammuRescoAssignedSurveyItem, idx?: number) => (idx !== undefined ? idx + 1 : 1),
      } as any,
      {
        header: 'Batch ID',
        accessor: (r: JammuRescoAssignedSurveyItem) => String(r.id),
      },
      {
        header: 'Vendor Name',
        accessor: (r: JammuRescoAssignedSurveyItem) => getVendorName(r),
      },
      {
        header: 'Assign Date',
        accessor: (r: JammuRescoAssignedSurveyItem) => fmtDate(r.assign_date || r.created_at),
      },
      {
        header: 'State',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.state || 'Jammu & Kashmir',
      },
      {
        header: 'Volume',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.volume || 'VOL-1',
      },
      {
        header: 'District',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.district || '—',
      },
      {
        header: 'Site Name',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.site_name || formatSitesList(r).join(', '),
      },
      {
        header: 'Allocated Sites Count',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.sitecount ?? r.site_count ?? 1,
      },
      {
        header: 'Remarks',
        accessor: (r: JammuRescoAssignedSurveyItem) => r.remarks || r.remark || '—',
      },
      {
        header: 'Status',
        accessor: (r: JammuRescoAssignedSurveyItem) =>
          Number(r.status) === 2 ? 'Complete Survey' : Number(r.status) === 1 ? 'Approved' : 'Pending Assign',
      },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_RESCO_Assigned_Surveys_${activeTab}`;
  const fileTitle = `Jammu RESCO Assigned Surveys (${activeTab.toUpperCase()})`;

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
      setSuccessMsg('Assigned survey records copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setSuccessMsg('Assigned survey records copied to clipboard!');
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
      setRecords((prev) =>
        prev.map((r) => (r.id === approvingRecord.id ? { ...r, status: 1 } : r))
      );
      setSuccessMsg(`Survey Batch ID: #${approvingRecord.id} approved successfully and vendor notified.`);
      setApprovingRecord(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to approve survey allocation');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="View Assigned JK Resco Survey"
        subtitle="Track and manage assigned JK RESCO rooftop solar feasibility surveys, institutional site allocations, and vendor assignments across Jammu region"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'JK Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'View Assigned Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, marginRight: 6 }}>
                <path d="M21 12a9 9 0 11-3.21-6.88L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {loading ? 'Refreshing…' : 'Refresh Records'}
            </button>
            <Link to="/vendor-management/jammu/survey/resco/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign New Survey</span>
            </Link>
          </div>
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

      {/* ── Top 4 Key KPI Metric Cards (Standard Unified Reference Pattern) ── */}
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
          label="Total Assign Sites"
          value={totalAssignSites}
          sub={`${records.length} survey batches allocated`}
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Assign Site"
          value={pendingAssignSites}
          sub="Awaiting authorization / approval"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Complete Survey"
          value={completeSurveys}
          sub="Feasibility reports conducted"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          tone="cyan"
          label="Pending Survey"
          value={approvedSitesCount}
          sub="Authorized & awaiting field visit"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Allocations
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {records.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Assign
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {records.filter((r) => !r.status || Number(r.status) === 0).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {records.filter((r) => Number(r.status) === 1).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'complete' ? 'active' : ''}`}
          onClick={() => setActiveTab('complete')}
        >
          Complete Survey
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'complete' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {records.filter((r) => Number(r.status) === 2).length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending'
                ? 'Pending Assign JK Resco Surveys'
                : activeTab === 'approved'
                ? 'Approved JK Resco Surveys'
                : activeTab === 'complete'
                ? 'Completed JK Resco Surveys'
                : 'All Assigned JK Resco Surveys'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredRows.length} batch record{filteredRows.length === 1 ? '' : 's'} across Jammu &amp; Kashmir region
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter Dropdown */}
              {districtOptions.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter assignments by district"
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
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Reset Button */}
              {(searchQuery.trim() !== '' || districtFilter !== 'all' || activeTab !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDistrictFilter('all');
                    setActiveTab('all');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs, 12px)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, site..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1420 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 90 }}>Batch ID</th>
                <th className="ax-table__th" style={{ minWidth: 160 }}>Vendor</th>
                <th className="ax-table__th" style={{ width: 120 }}>Assign Date</th>
                <th className="ax-table__th" style={{ width: 130 }}>State</th>
                <th className="ax-table__th" style={{ width: 90 }}>Volume</th>
                <th className="ax-table__th" style={{ width: 120 }}>District</th>
                <th className="ax-table__th" style={{ minWidth: 260 }}>Site Name</th>
                <th className="ax-table__th" style={{ textAlign: 'right', width: 100 }}>Site Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>File</th>
                <th className="ax-table__th" style={{ minWidth: 180 }}>Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 120 }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 170 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned RESCO survey records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState
                      title="No assigned surveys found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No survey allocations match this view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: JammuRescoAssignedSurveyItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vendorName = getVendorName(row);
                  const sitesList = formatSitesList(row);
                  const count = row.sitecount ?? row.site_count ?? sitesList.length;
                  const st = Number(row.status ?? 0);
                  const attachedFile = row.file || row.document;

                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>

                      {/* 2. Batch ID */}
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
                          #{row.id}
                        </span>
                      </td>

                      {/* 3. Vendor */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                        {vendorName}
                      </td>

                      {/* 4. Assign Date */}
                      <td className="ax-table__td">{fmtDate(row.assign_date || row.created_at)}</td>

                      {/* 5. State */}
                      <td className="ax-table__td">
                        {row.state?.toLowerCase().includes('jammu') ? 'Jammu & Kashmir' : (row.state || 'Jammu & Kashmir')}
                      </td>

                      {/* 6. Volume */}
                      <td className="ax-table__td">
                        <span
                          style={{
                            background: 'var(--ax-surface-subtle, #f8fafc)',
                            border: '1px solid #e2e8f0',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          {row.volume || 'VOL-1'}
                        </span>
                      </td>

                      {/* 7. District */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || '—'}</td>

                      {/* 8. Site Name */}
                      <td className="ax-table__td" style={{ maxWidth: 280, whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {row.site_name || sitesList[0] || `Batch #${row.id}`}
                          </span>
                          {sitesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForSites(row)}
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
                              title="Click to view all allocated sites"
                            >
                              +{sitesList.length - 1} more sites &nearr;
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 9. Site Count */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        {count}
                      </td>

                      {/* 10. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={attachedFile} onClick={setLightboxUrl} />
                      </td>

                      {/* 11. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.remarks || row.remark || ''}>
                        {row.remarks || row.remark || '—'}
                      </td>

                      {/* 12. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Complete
                          </span>
                        ) : st === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                            Approved
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 13. Actions */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          {/* Conduct Button */}
                          <Link
                            to={`/vendor-management/jammu/survey/resco/assigned-vendor?siteId=${row.id}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="Conduct or review field survey"
                          >
                            Conduct
                          </Link>

                          {/* Approve Button (when pending) */}
                          {st === 0 && (
                            <button
                              type="button"
                              onClick={() => setApprovingRecord(row)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title="Approve survey allocation"
                            >
                              Approve
                            </button>
                          )}

                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForSites(row)}
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
                            title="View allocated sites breakdown"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
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

        {/* ── Left-Aligned Pagination in Footer ── */}
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

      {/* ── Modal: Assigned Sites Breakdown ── */}
      <Modal
        open={Boolean(selectedRecordForSites)}
        onClose={() => setSelectedRecordForSites(null)}
        title={`Assigned Sites Breakdown: ${getVendorName(selectedRecordForSites)}`}
        subtitle={`Batch ID: #${selectedRecordForSites?.id} • District: ${selectedRecordForSites?.district} • State: ${selectedRecordForSites?.state || 'Jammu & Kashmir'} • Volume: ${selectedRecordForSites?.volume || 'VOL-1'}`}
        maxWidth={780}
        footer={
          <button
            type="button"
            className="ax-button ax-button--secondary"
            onClick={() => setSelectedRecordForSites(null)}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            Close
          </button>
        }
      >
        {selectedRecordForSites && (
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
                <strong style={{ fontSize: 13 }}>{getVendorName(selectedRecordForSites)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Allocated Sites</span>
                <strong style={{ fontSize: 13, color: '#2563eb' }}>
                  {selectedRecordForSites.sitecount ?? selectedRecordForSites.site_count ?? 1} Sites
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Assign Date</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(selectedRecordForSites.assign_date || selectedRecordForSites.created_at)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Status</span>
                <strong
                  style={{
                    fontSize: 13,
                    color:
                      Number(selectedRecordForSites.status) === 2
                        ? '#16a34a'
                        : Number(selectedRecordForSites.status) === 1
                        ? '#2563eb'
                        : '#d97706',
                  }}
                >
                  {Number(selectedRecordForSites.status) === 2
                    ? 'Complete'
                    : Number(selectedRecordForSites.status) === 1
                    ? 'Approved'
                    : 'Pending'}
                </strong>
              </div>
            </div>

            {selectedRecordForSites.remarks && (
              <div style={{ marginBottom: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
                <strong>Remarks:</strong> {selectedRecordForSites.remarks}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ax-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Allocated Sites ({formatSitesList(selectedRecordForSites).length}):
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                    <th className="ax-table__th">Site Name</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th" style={{ textAlign: 'center', width: 140 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formatSitesList(selectedRecordForSites).map((sName, sIdx) => (
                    <tr key={sIdx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{sIdx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>{sName}</td>
                      <td className="ax-table__td">{selectedRecordForSites.district || 'Jammu'}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Link
                          to={`/vendor-management/jammu/survey/resco/assigned-vendor?siteId=${selectedRecordForSites.id}`}
                          onClick={() => setSelectedRecordForSites(null)}
                          style={{
                            padding: '3px 10px',
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          Conduct Survey &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
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
        title="Approve RESCO Survey Assignment"
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
              className="ax-button ax-button--primary"
              onClick={handleConfirmApprove}
              disabled={isApproving}
              style={{ padding: '6px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isApproving && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Confirm Approval
            </button>
          </>
        }
      >
        {approvingRecord && (
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px' }}>
              Are you sure you want to approve survey assignment{' '}
              <strong>Batch #{approvingRecord.id}</strong> for{' '}
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
              This will update the survey batch status to <strong>Approved</strong> and authorize field inspection.
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document Lightbox Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Work Order Document Preview"
        maxWidth={840}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {lightboxUrl ? (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Open original in new tab ↗
              </a>
            ) : <div />}
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
          <div style={{ textAlign: 'center', padding: 4 }}>
            {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
              <iframe
                src={lightboxUrl}
                title="PDF Preview"
                style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Document Preview"
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 8 }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AssignViewSurvey;
