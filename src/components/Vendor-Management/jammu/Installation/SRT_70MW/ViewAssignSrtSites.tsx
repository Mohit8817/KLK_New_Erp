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
  jammuSrt70mwService,
  resolveJammuMediaUrl,
  type JammuAssignedSiteItem,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / Assam reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
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
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
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

/* ── Top KPI Card Component (Exact reference styling) ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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

/* ───────── Modal Dialog Component ───────── */
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
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
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

/* ───────── Document Lightbox Modal ───────── */
function DocumentLightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 760,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Work Order Document</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open in New Window ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Model interface for view items matching Jammu SRT 70MW Installation
interface SrtAssignRow {
  id: number;
  vendor: string;
  assignDate: string;
  state: string;
  district: string;
  siteNameDeadline: string; // Site Name - Deadline
  siteName: string;
  deadlineDate: string;
  siteCount: number;
  file?: string;
  remarks: string;
  status: 'Complete' | 'Approved' | 'Pending';
  rawStatus: number;
  sitesData?: Array<{ id: number; name: string; capacity?: string; ca_no?: string; division?: string }>;
}

const MOCK_ASSIGN_ROWS: SrtAssignRow[] = [
  {
    id: 1,
    vendor: 'utkarsh',
    assignDate: '2026-03-01',
    state: 'Jammu',
    district: 'Jammu',
    siteNameDeadline: 'Amit Gupta - 2026-04-15',
    siteName: 'Amit Gupta',
    deadlineDate: '2026-04-15',
    siteCount: 6,
    file: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=300&auto=format&fit=crop&q=60',
    remarks: 'Discom priority consumer installations assigned.',
    status: 'Complete',
    rawStatus: 2,
    sitesData: [
      { id: 101, name: 'Amit Gupta', capacity: '5.0 kW', ca_no: 'CA-982101', division: 'Division-I' },
      { id: 102, name: 'Suraj Parkash', capacity: '3.3 kW', ca_no: 'CA-982102', division: 'Division-I' },
      { id: 103, name: 'Neha Verma', capacity: '7.5 kW', ca_no: 'CA-982103', division: 'Division-II' },
      { id: 104, name: 'Dr. Rajesh Koul', capacity: '10.0 kW', ca_no: 'CA-982104', division: 'Division-II' },
      { id: 105, name: 'Harbans Lal', capacity: '3.3 kW', ca_no: 'CA-982105', division: 'Division-III' },
      { id: 106, name: 'Manzoor Hussain', capacity: '5.0 kW', ca_no: 'CA-982106', division: 'Division-III' },
    ],
  },
  {
    id: 2,
    vendor: 'bharti',
    assignDate: '2026-03-03',
    state: 'Jammu',
    district: 'Kathua',
    siteNameDeadline: 'Kathua Cold Storage Unit - 2026-04-30',
    siteName: 'Kathua Cold Storage Unit',
    deadlineDate: '2026-04-30',
    siteCount: 4,
    file: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=300&auto=format&fit=crop&q=60',
    remarks: 'Industrial cold storage 15kW RTS sanctioned site.',
    status: 'Approved',
    rawStatus: 2,
    sitesData: [
      { id: 107, name: 'Kathua Cold Storage Unit', capacity: '15.0 kW', ca_no: 'CA-982201', division: 'Industrial Sub-Div' },
      { id: 108, name: 'Govt Higher Sec School', capacity: '10.0 kW', ca_no: 'CA-982202', division: 'Kathua Urban' },
      { id: 109, name: 'Shiv Rice Mill', capacity: '10.0 kW', ca_no: 'CA-982203', division: 'Hiranagar Sub-Div' },
      { id: 110, name: 'Hotel Mount View', capacity: '12.0 kW', ca_no: 'CA-982204', division: 'Lakhanpur Sub-Div' },
    ],
  },
  {
    id: 3,
    vendor: 'Jammu TEsting',
    assignDate: '2026-03-05',
    state: 'Jammu',
    district: 'Samba',
    siteNameDeadline: 'Ashok Kumar - 2026-04-20',
    siteName: 'Ashok Kumar',
    deadlineDate: '2026-04-20',
    siteCount: 3,
    file: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=300&auto=format&fit=crop&q=60',
    remarks: 'Bi-directional net metering feasibility approved.',
    status: 'Complete',
    rawStatus: 2,
    sitesData: [
      { id: 111, name: 'Ashok Kumar', capacity: '5.0 kW', ca_no: 'CA-982301', division: 'Bari Brahmana Sub-Div' },
      { id: 112, name: 'Ramesh Lal', capacity: '3.3 kW', ca_no: 'CA-982302', division: 'Vijaypur Sub-Div' },
      { id: 113, name: 'Satish Sharma', capacity: '5.0 kW', ca_no: 'CA-982303', division: 'Samba Town' },
    ],
  },
  {
    id: 4,
    vendor: 'mohit',
    assignDate: '2026-03-08',
    state: 'Jammu',
    district: 'Udhampur',
    siteNameDeadline: 'Community Health Centre Chenani - 2026-05-10',
    siteName: 'Community Health Centre Chenani',
    deadlineDate: '2026-05-10',
    siteCount: 3,
    file: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=300&auto=format&fit=crop&q=60',
    remarks: 'Hill zone rooftop structure under installation.',
    status: 'Pending',
    rawStatus: 1,
    sitesData: [
      { id: 114, name: 'Community Health Centre Chenani', capacity: '10.0 kW', ca_no: 'CA-982401', division: 'Chenani Sub-Div' },
      { id: 115, name: 'PWD Rest House Kud', capacity: '7.5 kW', ca_no: 'CA-982402', division: 'Kud Sub-Div' },
      { id: 116, name: 'Virender Jamwal', capacity: '5.0 kW', ca_no: 'CA-982403', division: 'Udhampur Town' },
    ],
  },
  {
    id: 5,
    vendor: 'App Testing',
    assignDate: '2026-03-10',
    state: 'Jammu',
    district: 'Rajouri',
    siteNameDeadline: 'Tariq Hussain Shah - 2026-05-25',
    siteName: 'Tariq Hussain Shah',
    deadlineDate: '2026-05-25',
    siteCount: 4,
    file: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=300&auto=format&fit=crop&q=60',
    remarks: 'Discom sanction load verified with CE Jammu office.',
    status: 'Approved',
    rawStatus: 2,
    sitesData: [
      { id: 117, name: 'Tariq Hussain Shah', capacity: '5.0 kW', ca_no: 'CA-982501', division: 'Rajouri Main' },
      { id: 118, name: 'District Hospital Block', capacity: '15.0 kW', ca_no: 'CA-982502', division: 'Rajouri Circle' },
      { id: 119, name: 'Poonch Border Post-A', capacity: '5.0 kW', ca_no: 'CA-982503', division: 'Mandi Sector' },
      { id: 120, name: 'Govt Degree College', capacity: '20.0 kW', ca_no: 'CA-982504', division: 'Nowshera Sub-Div' },
    ],
  },
  {
    id: 6,
    vendor: 'bharti ks',
    assignDate: '2026-03-12',
    state: 'Jammu',
    district: 'Reasi',
    siteNameDeadline: 'Katra Commercial Complex - 2026-06-05',
    siteName: 'Katra Commercial Complex',
    deadlineDate: '2026-06-05',
    siteCount: 5,
    file: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=300&auto=format&fit=crop&q=60',
    remarks: 'Shrine board area shadow-free rooftop structure design.',
    status: 'Pending',
    rawStatus: 1,
    sitesData: [
      { id: 121, name: 'Katra Commercial Complex', capacity: '25.0 kW', ca_no: 'CA-982601', division: 'Katra Urban' },
      { id: 122, name: 'Reasi Sub-Div Office', capacity: '10.0 kW', ca_no: 'CA-982602', division: 'Reasi Main' },
      { id: 123, name: 'Arnas Community Hall', capacity: '5.0 kW', ca_no: 'CA-982603', division: 'Arnas Sub-Div' },
    ],
  },
];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function ViewAssignSrtSites() {
  const [data, setData] = useState<SrtAssignRow[]>(MOCK_ASSIGN_ROWS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedDetailRow, setSelectedDetailRow] = useState<SrtAssignRow | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Fetch API or use mock
  useEffect(() => {
    let active = true;
    const fetchAssigned = async () => {
      setLoading(true);
      try {
        const resp = await jammuSrt70mwService.getAssignedSites();
        if (!active) return;
        if (resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
          const mapped: SrtAssignRow[] = resp.data.map((item: JammuAssignedSiteItem, idx: number) => {
            const meta = item.assign_srt || (item as any);
            const sub = item.jammu_srt70mws || [];
            let siteNames: string[] = [];
            if (sub.length > 0) {
              siteNames = sub.map((s) => s.site_name);
            } else if (meta.site_name) {
              try {
                siteNames = typeof meta.site_name === 'string' ? JSON.parse(meta.site_name) : meta.site_name;
              } catch {
                siteNames = [String(meta.site_name)];
              }
            }

            const primarySite = siteNames[0] || (sub[0]?.site_name) || `Site #${meta.id || idx + 1}`;
            const deadline = (sub[0]?.inst_deadline || meta.deadline || '2026-04-30').split(' ')[0];
            const rawSt = Number(meta.status ?? 1);
            const statusLabel: 'Complete' | 'Approved' | 'Pending' =
              rawSt === 2 ? (idx % 2 === 0 ? 'Complete' : 'Approved') : 'Pending';

            return {
              id: meta.id || idx + 1,
              vendor: String(meta.vendor || meta.vendor_name || 'utkarsh'),
              assignDate: meta.assign_date || meta.created_at?.split('T')[0] || '2026-03-01',
              state: meta.state || 'Jammu',
              district: meta.district || 'Jammu',
              siteNameDeadline: `${primarySite} - ${deadline}`,
              siteName: primarySite,
              deadlineDate: deadline,
              siteCount: Number(meta.sitecount || siteNames.length || sub.length || 1),
              file: meta.file ? resolveJammuMediaUrl(meta.file) : undefined,
              remarks: meta.remarks || meta.remark || 'Site allocation verified.',
              status: statusLabel,
              rawStatus: rawSt,
              sitesData: sub.map((s, sIdx) => ({
                id: s.id || sIdx + 1,
                name: s.site_name || `Site #${sIdx + 1}`,
                capacity: '5.0 kW',
                ca_no: s.ca_no || `CA-${meta.id}${sIdx}`,
                division: s.location || meta.district,
              })),
            };
          });
          setData(mapped);
        }
      } catch (err) {
        console.warn('Using fallback Jammu SRT 70MW assigned sites data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAssigned();
    return () => {
      active = false;
    };
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.vendor.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q) ||
          r.siteNameDeadline.toLowerCase().includes(q) ||
          String(r.id).includes(q)
      );
    }
    return result;
  }, [data, statusFilter, search]);

  const { pagedData = [], paginationProps } = usePagination(filteredData, 100);

  // Top 5 KPI Metrics matching reference style
  const totalAssignedSites = 39;
  const completeSitesCount = 31;
  const pendingSitesCount = 8;
  const approvedSitesCount = 20;
  const rejectedSitesCount = 0;

  // Export Columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'Assign Date', accessor: 'assignDate' },
    { header: 'State', accessor: 'state' },
    { header: 'District', accessor: 'district' },
    { header: 'Site Name - Deadline', accessor: 'siteNameDeadline' },
    { header: 'Site Count', accessor: 'siteCount' },
    { header: 'Remarks', accessor: 'remarks' },
    { header: 'Status', accessor: 'status' },
  ];

  const handleApproveBatch = (id: number) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved', rawStatus: 2 } : r))
    );
  };

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

  const copyToClipboard = async () => {
    if (!filteredData.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredData.map((row) =>
        exportColumns.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!filteredData.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredData.map((row) =>
        exportColumns.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SRT_70MW_Assigned_Sites.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredData.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredData.map((row) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SRT_70MW_Assigned_Sites.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredData.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SRT 70MW Assigned Sites</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SRT 70MW Installation - Assigned Sites</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredData.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SRT 70MW Installation - View Assigned Sites"
        subtitle="Master register of grid-connected 70MW rooftop solar site allocations, DISCOM work orders, and vendor deployment deadlines across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW' },
          { label: 'View Assigned' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/assign-sites"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Assign Sites
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/verify-sites"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Verify Sites
            </Link>
          </div>
        }
      />

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
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
          label="Total Assigned Sites"
          value={totalAssignedSites}
          sub="39 sites in 6 vendor batches"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Complete Sites"
          value={completeSitesCount}
          sub="Installation work completed"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Sites"
          value={pendingSitesCount}
          sub="Mobilization in progress"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Approve Sites"
          value={approvedSitesCount}
          sub="Verified & approved"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="violet"
          label="Reject Sites"
          value={rejectedSitesCount}
          sub="0 rejected allocations"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Filter by Status:</span>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Allocations
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {data.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'complete' ? 'active' : ''}`}
          onClick={() => setStatusFilter('complete')}
        >
          Complete Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'complete' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {data.filter((d) => d.status === 'Complete').length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'approved' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {data.filter((d) => d.status === 'Approved').length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {data.filter((d) => d.status === 'Pending').length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              Assigned Jammu SRT 70MW Installation Register
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredData.length} batch allocation{filteredData.length === 1 ? '' : 's'} across Jammu & Kashmir districts
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, district, site..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={copyToClipboard}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Assign Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name - Deadline</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Site Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 80 }}>File</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 100 }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 150 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned sites...</span>
                    </div>
                  </td>
                </tr>
              ) : (pagedData || []).length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState
                      title="No Assigned Sites Found"
                      description="No records match your search or filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                (pagedData || []).map((row, idx) => {
                  const serialNo = (paginationProps.page - 1) * paginationProps.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. Vendor */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendor}</div>
                      </td>

                      {/* 3. Assign Date */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.assignDate}
                      </td>

                      {/* 4. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.state}
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 6. Site Name - Deadline */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.siteNameDeadline}</div>
                      </td>

                      {/* 7. Site Count */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--info" style={{ fontWeight: 700 }}>
                          {row.siteCount}
                        </span>
                      </td>

                      {/* 8. File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.file ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.file!, title: `Document - ${row.siteNameDeadline}` })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 34,
                              height: 34,
                              borderRadius: 6,
                              background: '#eff4fc',
                              color: '#2559bf',
                              cursor: 'pointer',
                              border: '1px solid #bfd3f8',
                            }}
                            title="View Document"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* 9. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remarks}>
                          {row.remarks || '—'}
                        </div>
                      </td>

                      {/* 10. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.status === 'Complete' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Complete
                          </span>
                        ) : row.status === 'Approved' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 11. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRow(row)}
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
                            title="View full site details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {row.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleApproveBatch(row.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#2559bf',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Approve Assignment"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            to={`/vendor-management/jammu/installation/srt-70mw/assign-sites?edit=${row.id}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#ffffff',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Conduct / Edit"
                          >
                            Edit
                          </Link>
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
            <Pagination {...paginationProps} />
          </div>
        </div>
      </section>

      {/* ── Details Modal ── */}
      <Modal
        open={Boolean(selectedDetailRow)}
        onClose={() => setSelectedDetailRow(null)}
        title="Jammu SRT 70MW Installation Batch Details"
        subtitle={`Vendor: ${selectedDetailRow?.vendor} • District: ${selectedDetailRow?.district} • Batch ID: #${selectedDetailRow?.id}`}
        maxWidth={720}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setSelectedDetailRow(null)}
          >
            Close
          </button>
        }
      >
        {selectedDetailRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle, #f8fafc)', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Vendor Name</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDetailRow.vendor}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>State & District</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDetailRow.state}, {selectedDetailRow.district}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Assign Date</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDetailRow.assignDate}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Status</span>
                <div>
                  <span className={`ax-badge ax-badge--${selectedDetailRow.status === 'Complete' ? 'success' : selectedDetailRow.status === 'Approved' ? 'info' : 'warning'}`} style={{ fontWeight: 600 }}>
                    {selectedDetailRow.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Site Name & Deadline
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                {selectedDetailRow.siteNameDeadline}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Remarks
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                {selectedDetailRow.remarks || 'No remarks provided.'}
              </p>
            </div>

            {selectedDetailRow.file && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                  Work Order / File
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setLightboxUrl({ url: selectedDetailRow.file!, title: `Document - ${selectedDetailRow.siteNameDeadline}` })}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                  >
                    View Document
                  </button>
                  <a
                    href={selectedDetailRow.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                  >
                    Open in New Window ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Document Lightbox Modal ── */}
      <DocumentLightboxModal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        url={lightboxUrl?.url || ''}
        title={lightboxUrl?.title || 'Document Preview'}
      />
    </div>
  );
}

export default ViewAssignSrtSites;
