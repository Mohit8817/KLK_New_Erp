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
  type JammuClaimItem,
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
function LightboxModal({
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
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Claim Invoice Inspection</span>
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

export interface SrtClaimRow {
  id: number;
  date: string;
  vendorName: string;
  sitesCount: number;
  district: string;
  sitesList: Array<{ id: number; name: string; capacity?: string; ca_no?: string; district?: string }>;
  invoiceFile?: string;
  amount: number;
  contractorRemarks: string;
  verifyRemarks: string;
  status: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  invoiceNo: string;
}

const MOCK_CLAIMS: SrtClaimRow[] = [
  {
    id: 501,
    date: '2026-03-05',
    vendorName: 'utkarsh',
    district: 'Jammu',
    sitesCount: 4,
    sitesList: [
      { id: 3001, name: 'Amit Gupta', capacity: '5.0 kW RTS', ca_no: 'CA-982101', district: 'Jammu' },
      { id: 3002, name: 'Suraj Parkash', capacity: '3.3 kW RTS', ca_no: 'CA-982102', district: 'Jammu' },
      { id: 3003, name: 'Neha Verma', capacity: '7.5 kW RTS', ca_no: 'CA-982103', district: 'Jammu' },
      { id: 3004, name: 'Dr. Rajesh Koul', capacity: '10.0 kW RTS', ca_no: 'CA-982104', district: 'Jammu' },
    ],
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    amount: 1280000,
    contractorRemarks: 'Batch 301 - 80% installation milestone invoice submitted with test reports.',
    verifyRemarks: 'Verified against DISCOM feeder synchronisation checklist. Approved for payment release.',
    status: 2, // Approved
    invoiceNo: 'INV-UTK-JK-084',
  },
  {
    id: 502,
    date: '2026-03-08',
    vendorName: 'bharti',
    district: 'Kathua',
    sitesCount: 2,
    sitesList: [
      { id: 3007, name: 'Kathua Cold Storage Unit', capacity: '15.0 kW RTS', ca_no: 'CA-982201', district: 'Kathua' },
      { id: 3008, name: 'Govt Higher Sec School', capacity: '10.0 kW RTS', ca_no: 'CA-982202', district: 'Kathua' },
    ],
    invoiceFile: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=60',
    amount: 980000,
    contractorRemarks: 'Kathua industrial cluster 80% milestone claim.',
    verifyRemarks: 'Awaiting site audit confirmation from Assistant Executive Engineer Kathua.',
    status: 1, // Pending
    invoiceNo: 'INV-WAA-JK-102',
  },
  {
    id: 503,
    date: '2026-03-10',
    vendorName: 'Jammu TEsting',
    district: 'Samba',
    sitesCount: 3,
    sitesList: [
      { id: 3011, name: 'Ashok Kumar', capacity: '5.0 kW RTS', ca_no: 'CA-982301', district: 'Samba' },
      { id: 3012, name: 'Ramesh Lal', capacity: '3.3 kW RTS', ca_no: 'CA-982302', district: 'Samba' },
      { id: 3013, name: 'Satish Sharma', capacity: '5.0 kW RTS', ca_no: 'CA-982303', district: 'Samba' },
    ],
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    amount: 640000,
    contractorRemarks: 'Samba domestic RTS batch 80% claim.',
    verifyRemarks: 'Audit completed. Approved by finance division.',
    status: 2, // Approved
    invoiceNo: 'INV-JAK-JK-045',
  },
  {
    id: 504,
    date: '2026-03-12',
    vendorName: 'mohit',
    district: 'Udhampur',
    sitesCount: 1,
    sitesList: [
      { id: 3014, name: 'Community Health Centre Chenani', capacity: '10.0 kW RTS', ca_no: 'CA-982401', district: 'Udhampur' },
    ],
    invoiceFile: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=60',
    amount: 550000,
    contractorRemarks: 'Institutional rooftop milestone invoice.',
    verifyRemarks: 'Under initial technical audit review.',
    status: 1, // Pending
    invoiceNo: 'INV-SUN-JK-099',
  },
];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function ViewSrtClaim() {
  const [claims, setClaims] = useState<SrtClaimRow[]>(MOCK_CLAIMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedSitesRow, setSelectedSitesRow] = useState<SrtClaimRow | null>(null);
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<SrtClaimRow | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('2'); // 2 = Approved, 3 = Rejected, 1 = Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Load from API
  useEffect(() => {
    let active = true;
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const resp = await jammuSrt70mwService.getClaimRequests();
        if (!active) return;
        if (resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
          const mapped: SrtClaimRow[] = resp.data.map((item: JammuClaimItem, idx: number) => ({
            id: item.id || 500 + idx + 1,
            date: item.inst_claim_date ? item.inst_claim_date.split(' ')[0] : '2026-03-01',
            vendorName: (item as any).vendor || 'utkarsh',
            district: item.district || 'Jammu',
            sitesCount: 1,
            sitesList: [
              {
                id: item.srt_id || item.id || 3000 + idx,
                name: item.site_name || `Site #${item.id || idx + 1}`,
                capacity: '5.0 kW RTS',
                district: item.district || 'Jammu',
              },
            ],
            invoiceFile: item.invoice ? resolveJammuMediaUrl(item.invoice) : undefined,
            amount: Number(item.inst_claim_amount || 550000),
            contractorRemarks: '80% installation milestone invoice submitted.',
            verifyRemarks: '',
            status: Number(item.inst_claim_status ?? 1),
            invoiceNo: `INV-JK-70M-${item.id || idx + 1}`,
          }));
          setClaims(mapped);
        }
      } catch (err) {
        console.warn('Using fallback claims data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchClaims();
    return () => {
      active = false;
    };
  }, []);

  // Filtered dataset
  const filteredClaims = useMemo(() => {
    let result = claims;
    if (statusFilter !== 'all') {
      const targetSt = Number(statusFilter);
      result = result.filter((c) => c.status === targetSt);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.vendorName.toLowerCase().includes(q) ||
          c.invoiceNo.toLowerCase().includes(q) ||
          c.contractorRemarks.toLowerCase().includes(q) ||
          c.verifyRemarks.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.sitesList.some((s) => s.name.toLowerCase().includes(q)) ||
          String(c.id).includes(q)
      );
    }
    return result;
  }, [claims, statusFilter, search]);

  const { pagedData = [], paginationProps } = usePagination(filteredClaims, 100);

  // Top 5 KPI Metrics matching reference style
  const claimApplicableCount = 11;
  const claimRaisedCount = 9;
  const approvedClaimsCount = 6;
  const pendingClaimsCount = 3;
  const rejectedClaimsCount = 0;

  // Export Columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'Invoice No.', accessor: 'invoiceNo' },
    { header: 'Date', accessor: 'date' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'District', accessor: 'district' },
    { header: 'Sites Count', accessor: 'sitesCount' },
    { header: 'Amount (INR)', accessor: 'amount' },
    { header: 'Status', accessor: (r: SrtClaimRow) => (r.status === 2 ? 'Approved' : r.status === 3 ? 'Rejected' : 'Pending') },
    { header: 'Contractor Remarks', accessor: 'contractorRemarks' },
    { header: 'Audit Remarks', accessor: 'verifyRemarks' },
  ];

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
    if (!filteredClaims.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredClaims.map((row) =>
        exportColumns.map((c) => {
          if (typeof c.accessor === 'function') return c.accessor(row);
          return String((row as any)[c.accessor as string] || '');
        }).join('\t')
      ),
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

  const exportToCSV = () => {
    if (!filteredClaims.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredClaims.map((row) =>
        exportColumns.map((c) => {
          const val = typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor as string];
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SRT_70MW_Claims.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredClaims.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredClaims.map((row) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val || ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SRT_70MW_Claims.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredClaims.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SRT 70MW Claim Invoices</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SRT 70MW Installation - Claim Invoices</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredClaims.map((r) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(r) : (r as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val || ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Action Submit for claim audit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForAction) return;

    setSubmittingAction(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      const targetStatus = Number(actionStatus);
      setClaims((prev) =>
        prev.map((c) =>
          c.id === selectedClaimForAction.id
            ? { ...c, status: targetStatus, verifyRemarks: actionRemarks }
            : c
        )
      );
      setSelectedClaimForAction(null);
      setActionRemarks('');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SRT 70MW Installation - View Claim"
        subtitle="Verification and audit desk for 70 MW rooftop solar EPC milestone claims, vendor submission invoices, and DISCOM commissioning settlements across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW' },
          { label: 'View Claim' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/view-payment"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Payment Register
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/verify-sites"
              className="ax-btn ax-btn--ghost ax-btn--sm"
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
          tone="accent"
          label="Claim Applicable"
          value={claimApplicableCount}
          sub="Eligible installation sites"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Claim Raised"
          value={claimRaisedCount}
          sub="Vendor milestone invoices"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Approved Claims"
          value={approvedClaimsCount}
          sub="Finance audit cleared"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Claims"
          value={pendingClaimsCount}
          sub="Awaiting finance audit"
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
          label="Rejected Claims"
          value={rejectedClaimsCount}
          sub="0 rejected claims"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Claim Invoices
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {claims.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === '1' ? 'active' : ''}`}
          onClick={() => setStatusFilter('1')}
        >
          Pending Review
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === '1' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {claims.filter((c) => c.status === 1).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === '2' ? 'active' : ''}`}
          onClick={() => setStatusFilter('2')}
        >
          Approved Invoices
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === '2' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {claims.filter((c) => c.status === 2).length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              Jammu SRT 70MW Milestone Claim Invoices Register
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredClaims.length} milestone claim{filteredClaims.length === 1 ? '' : 's'} submitted by empaneled contractors
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
                placeholder="Search vendor, invoice no..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Invoice No.</th>
                <th className="ax-table__th">Submission Date</th>
                <th className="ax-table__th">Vendor / Contractor</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Sites</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Claim Amount (₹)</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Invoice Doc</th>
                <th className="ax-table__th">Contractor Remarks</th>
                <th className="ax-table__th">Audit Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 100 }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 140 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading claims records...</span>
                    </div>
                  </td>
                </tr>
              ) : (pagedData || []).length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState
                      title="No Claim Requests Found"
                      description="No vendor milestone invoices match your current filters."
                    />
                  </td>
                </tr>
              ) : (
                (pagedData || []).map((row, idx) => {
                  const serialNo = (paginationProps.page - 1) * paginationProps.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        {row.invoiceNo}
                      </td>

                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.date}
                      </td>

                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendorName}</div>
                      </td>

                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSitesRow(row)}
                          style={{
                            border: '1px solid #bfd3f8',
                            background: '#eff4fc',
                            color: '#2559bf',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {row.sitesCount} Sites ↗
                        </button>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹ {row.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.invoiceFile ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.invoiceFile!, title: `Invoice ${row.invoiceNo}` })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: '#eff4fc',
                              color: '#2559bf',
                              cursor: 'pointer',
                              border: '1px solid #bfd3f8',
                            }}
                            title="View Invoice Document"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 170 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.contractorRemarks}>
                          {row.contractorRemarks || '—'}
                        </div>
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 170 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                          {row.verifyRemarks || '—'}
                        </div>
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.status === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : row.status === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSitesRow(row)}
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
                            title="View claim breakdown"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClaimForAction(row);
                              setActionStatus(String(row.status === 2 ? '2' : '2'));
                              setActionRemarks(row.verifyRemarks || '');
                            }}
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
                            title="Audit / Approve Claim"
                          >
                            Audit
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
            <Pagination {...paginationProps} />
          </div>
        </div>
      </section>

      {/* ── Sites Breakdown Modal ── */}
      <Modal
        open={Boolean(selectedSitesRow)}
        onClose={() => setSelectedSitesRow(null)}
        title="Claim Allocation Sites Breakdown"
        subtitle={`Invoice: ${selectedSitesRow?.invoiceNo} • Vendor: ${selectedSitesRow?.vendorName} • Amount: ₹ ${selectedSitesRow?.amount.toLocaleString('en-IN')}`}
        maxWidth={680}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setSelectedSitesRow(null)}
          >
            Close
          </button>
        }
      >
        {selectedSitesRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <table className="ax-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer Site Name</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>CA No.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Capacity</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>District</th>
                </tr>
              </thead>
              <tbody>
                {selectedSitesRow.sitesList.map((site, sIdx) => (
                  <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{sIdx + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{site.name}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{site.ca_no || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{site.capacity || '5.0 kW RTS'}</td>
                    <td style={{ padding: '8px 12px' }}>{site.district || selectedSitesRow.district}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── Action Audit Modal ── */}
      <Modal
        open={Boolean(selectedClaimForAction)}
        onClose={() => setSelectedClaimForAction(null)}
        title="Audit Jammu SRT 70MW Claim Invoice"
        subtitle={`Invoice: ${selectedClaimForAction?.invoiceNo} • Vendor: ${selectedClaimForAction?.vendorName}`}
        maxWidth={540}
      >
        {selectedClaimForAction && (
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Audit Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              >
                <option value="2">Approve Claim</option>
                <option value="3">Reject Claim</option>
                <option value="1">Keep Pending Review</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Audit / Verification Remarks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter financial audit notes, voucher references or reasons for rejection..."
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, resize: 'vertical', borderRadius: 8, border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedClaimForAction(null)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingAction}
              >
                {submittingAction ? 'Updating Status...' : 'Save Audit Decision'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Document Lightbox Modal ── */}
      <LightboxModal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        url={lightboxUrl?.url || ''}
        title={lightboxUrl?.title || 'Invoice Document'}
      />
    </div>
  );
}

export default ViewSrtClaim;
