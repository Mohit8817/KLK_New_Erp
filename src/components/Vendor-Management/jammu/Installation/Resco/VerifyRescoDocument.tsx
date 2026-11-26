import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
} from './jammuRescoAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SWP / SRT 70MW reference) ───────── */
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

/* ── Top KPI Card Component ── */
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0' }}>
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
  maxWidth = 540,
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

/* ───────── Lightbox Modal ───────── */
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
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Document Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
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

export interface JammuRescoVerifyDocumentItem {
  id: number;
  state: string;
  vendorName: string;
  district: string;
  block: string;
  village: string;
  siteName: string;
  applicantName: string;
  contactPerson?: string;
  contactNumber?: string;
  documentFile?: string;
  submitDate: string;
  remarks: string;
  verifyStatus: 'Pending' | 'Approved' | 'Rejected';
  rawStatus: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  verifyRemarks: string;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function extractFilePath(raw: any): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) return extractFilePath(parsed[0]);
      } catch {}
    }
    trimmed = trimmed.replace(/^["']|["']$/g, '');
    trimmed = trimmed.replace(/\\+/g, '/');
    return trimmed;
  }
  if (Array.isArray(raw) && raw.length > 0) return extractFilePath(raw[0]);
  return undefined;
}

export function VerifyRescoDocument() {
  const [items, setItems] = useState<JammuRescoVerifyDocumentItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    not_assigned: 0,
    complete: 0,
    pending: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>('all');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Verify Modal
  const [selectedDocForAction, setSelectedDocForAction] = useState<JammuRescoVerifyDocumentItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('2'); // '2' = Approved, '3' = Rejected
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Fetch document verification records strictly from live API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await jammuRescoAdminService.getViewInstallationDocument();
      if (resp.detail) {
        setStats({
          total: Number(resp.detail.total || 0),
          assigned: Number(resp.detail.assigned || 0),
          not_assigned: Number(resp.detail.not_assigned || 0),
          complete: Number(resp.detail.complete || 0),
          pending: Number(resp.detail.pending || 0),
          doc_approved: Number(resp.detail.doc_approved || 0),
          doc_pending: Number(resp.detail.doc_pending || 0),
          doc_reject: Number(resp.detail.doc_reject || 0),
        });
      }

      const mapDocItem = (item: any, defaultSt: number): JammuRescoVerifyDocumentItem => {
        const rawStatus = Number(item.inst_doc_status ?? item.status ?? item.verify_status ?? defaultSt);
        const verifyStatus: 'Pending' | 'Approved' | 'Rejected' =
          rawStatus === 2 ? 'Approved' : rawStatus === 3 ? 'Rejected' : 'Pending';

        const rawCandidate =
          item.inst_doc_file ||
          item.document_file ||
          item.doc_file ||
          item.file ||
          item.inst_doc ||
          item.document ||
          item.hoc_photo;
        const cleanFile = extractFilePath(rawCandidate);

        const displayName =
          item.site_name ||
          item.f_farmer_name ||
          item.farmer_name ||
          item.applicant_name ||
          item.beneficiary_name ||
          `Site #${item.id}`;

        return {
          id: Number(item.id),
          state: 'Jammu',
          vendorName: item.vendor_name || item.vendor || item.firm_name || (item.vendors?.name ? item.vendors.name : (item.inst_vendor ? `Vendor #${item.inst_vendor}` : '—')),
          district: item.district || item.f_district || 'Jammu',
          block: item.block || item.f_block || '—',
          village: item.village || item.panchayat || item.f_village || '—',
          siteName: displayName,
          applicantName: displayName,
          contactPerson: item.contact_person || item.person || '—',
          contactNumber: item.contact_number || item.phone || item.mobile || '—',
          documentFile: cleanFile ? resolveJammuMediaUrl(cleanFile) : undefined,
          submitDate: item.inst_doc_date || item.submit_date || item.doc_date || item.created_at || '—',
          remarks: item.inst_doc_remarks || item.remarks || item.inst_remarks || '—',
          verifyStatus,
          rawStatus,
          verifyRemarks: item.inst_doc_verify_remarks || item.doc_verify_remarks || item.verify_remarks || '—',
        };
      };

      const combined: JammuRescoVerifyDocumentItem[] = [
        ...(resp.verification || []).map((x: any) => mapDocItem(x, 1)),
        ...(resp.verified || []).map((x: any) => mapDocItem(x, 2)),
      ];
      setItems(combined);
    } catch (err: any) {
      console.error('Failed to load live Jammu RESCO document verification data:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct districts
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      const d = String(r.district || '').trim();
      if (d && d !== '—') set.add(d);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter based on bifurcation tabs and search
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'pending') {
      result = result.filter((s) => s.verifyStatus === 'Pending');
    } else if (activeTab === 'processed') {
      result = result.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected');
    }

    if (districtFilter !== 'all') {
      result = result.filter((s) => s.district.toLowerCase() === districtFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.applicantName.toLowerCase().includes(q) ||
          s.siteName.toLowerCase().includes(q) ||
          s.vendorName.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.block.toLowerCase().includes(q) ||
          s.village.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    return result;
  }, [items, activeTab, districtFilter, search]);

  const pagination = usePagination(filteredItems, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, districtFilter, search]);

  // Export columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'State', accessor: 'state' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Village', accessor: 'village' },
    { header: 'Site / Applicant Name', accessor: 'applicantName' },
    { header: 'Document File', accessor: 'documentFile' },
    { header: 'Submit Date', accessor: 'submitDate' },
    { header: 'Remarks', accessor: 'remarks' },
    { header: 'Verify Status', accessor: 'verifyStatus' },
    { header: 'Verify Remarks', accessor: 'verifyRemarks' },
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
    if (!filteredItems.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
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
    if (!filteredItems.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_RESCO_Doc_Verify_${activeTab}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredItems.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((row) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_RESCO_Doc_Verify_${activeTab}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredItems.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu RESCO Verify Documents</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu RESCO Document Verification</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Submit document audit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForAction) return;

    if (!actionStatus) {
      alert('Please select status.');
      return;
    }

    setSubmittingAction(true);
    try {
      const targetStatus = Number(actionStatus); // 2 = Approved, 3 = Rejected
      const res = await jammuRescoAdminService.verifyInstallationDocument({
        id: selectedDocForAction.id,
        status: targetStatus,
        remarks: actionRemarks,
      });

      if (res.success || res.status) {
        const newStatusLabel: 'Pending' | 'Approved' | 'Rejected' =
          targetStatus === 2 ? 'Approved' : 'Rejected';

        setItems((prev) =>
          prev.map((s) =>
            s.id === selectedDocForAction.id
              ? {
                  ...s,
                  rawStatus: targetStatus,
                  verifyStatus: newStatusLabel,
                  verifyRemarks: actionRemarks || s.verifyRemarks,
                }
              : s
          )
        );

        setStats((prev) => ({
          ...prev,
          doc_pending: Math.max(0, (prev.doc_pending || 0) - 1),
          doc_approved: targetStatus === 2 ? (prev.doc_approved || 0) + 1 : prev.doc_approved,
          doc_reject: targetStatus === 3 ? (prev.doc_reject || 0) + 1 : prev.doc_reject,
        }));

        setSelectedDocForAction(null);
        setActionStatus('2');
        setActionRemarks('');
        alert(res.message || 'Document verification status updated successfully.');
      } else {
        alert(res.message || 'Failed to update document status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating document status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const pendingCount = items.filter((s) => s.verifyStatus === 'Pending').length;
  const processedCount = items.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected').length;

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu RESCO Installation - Verify Documents"
        subtitle="Verification and audit desk for beneficiary handover certificates (HOC), Joint Commissioning Reports (JCR), and installation documents in Jammu"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: 'Verify Documents' },
        ]}
      />

      {/* ── Top 5 KPI Metric Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
          }
          tone="accent"
          label="Total Sites"
          value={stats.total || items.length}
          sub={`${stats.assigned} Assigned · ${stats.not_assigned} Unassigned`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={`${stats.complete} / ${stats.pending}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Doc Pending"
          value={stats.doc_pending || pendingCount}
          sub="HOC under audit review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Document Approved"
          value={stats.doc_approved}
          sub="Handover accepted"
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
          label="Document Rejected"
          value={stats.doc_reject}
          sub="Signoff papers rejected"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Documents
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {stats.doc_pending || pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processed')}
          className={`asw-pill-btn ${activeTab === 'processed' ? 'active' : ''}`}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'processed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(stats.doc_approved + stats.doc_reject) || processedCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'all'
                ? 'All Jammu RESCO Installation Documents'
                : activeTab === 'pending'
                ? 'Jammu RESCO Installation Documents Pending Verification'
                : 'Jammu RESCO Verified Installation Documents Register'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredItems.length} document record{filteredItems.length === 1 ? '' : 's'} across Jammu
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtOptions.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-form-control"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', height: 32 }}
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

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
                placeholder="Search vendor, applicant, district..."
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

        {/* ── Horizontally Scrollable Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: activeTab === 'pending' ? 1400 : 1550 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Site / Applicant Name</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' ? (
                  <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Action</th>
                ) : (
                  <th className="ax-table__th">Verify Remarks</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading document verification records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState
                      title="No Document Records Found"
                      description={`No records found under "${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected Data'}" matching your criteria.`}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const serialNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.state}
                      </td>

                      {/* 3. Vendor Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendorName}</div>
                      </td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 5. Block */}
                      <td className="ax-table__td">{row.block}</td>

                      {/* 6. Village */}
                      <td className="ax-table__td">{row.village}</td>

                      {/* 7. Site / Applicant Name */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.applicantName}
                      </td>

                      {/* 8. Document File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.documentFile ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(row.documentFile) ? (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl({ url: row.documentFile!, title: `Document - ${row.applicantName}` })}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title="Click to preview Document image"
                              >
                                <img
                                  src={row.documentFile}
                                  alt="Document"
                                  style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                />
                              </button>
                            ) : (
                              <a
                                href={row.documentFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#eff4fc',
                                  color: '#2559bf',
                                  textDecoration: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #bfd3f8',
                                }}
                                title="Open / Download Document"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View File</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 9. Submit Date */}
                      <td className="ax-table__td">{row.submitDate}</td>

                      {/* 10. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remarks}>
                          {row.remarks}
                        </div>
                      </td>

                      {/* 11. Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              row.verifyStatus === 'Approved'
                                ? '#ecfdf5'
                                : row.verifyStatus === 'Rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              row.verifyStatus === 'Approved'
                                ? '#059669'
                                : row.verifyStatus === 'Rejected'
                                ? '#dc2626'
                                : '#d97706',
                            border: `1px solid ${
                              row.verifyStatus === 'Approved'
                                ? '#a7f3d0'
                                : row.verifyStatus === 'Rejected'
                                ? '#fecaca'
                                : '#fde68a'
                            }`,
                          }}
                        >
                          {row.verifyStatus}
                        </span>
                      </td>

                      {/* 12. If Pending: Action column */}
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForAction(row);
                              setActionStatus('2');
                              setActionRemarks(row.verifyRemarks !== '—' ? row.verifyRemarks : '');
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#2559bf',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Verify
                          </button>
                        </td>
                      )}

                      {/* 12. If Approved/Rejected: Verify Remarks */}
                      {activeTab === 'processed' && (
                        <td className="ax-table__td" style={{ maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                            {row.verifyRemarks}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination ── */}
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

      {/* ── Document Verification Modal (Only from Pending tab) ── */}
      <Modal
        open={Boolean(selectedDocForAction)}
        onClose={() => {
          if (!submittingAction) {
            setSelectedDocForAction(null);
            setActionStatus('2');
            setActionRemarks('');
          }
        }}
        title="Verify Document"
        subtitle={selectedDocForAction ? `Site: ${selectedDocForAction.applicantName} (${selectedDocForAction.district})` : undefined}
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedDocForAction?.documentFile && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(selectedDocForAction.documentFile) ? (
                  <img
                    src={selectedDocForAction.documentFile}
                    alt="Document"
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                  />
                ) : (
                  <span style={{ fontSize: 24 }}>📄</span>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Submitted Document</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Date: {selectedDocForAction.submitDate}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setLightboxUrl({ url: selectedDocForAction.documentFile!, title: `Document - ${selectedDocForAction.applicantName}` })}
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ fontSize: 12 }}
                >
                  Preview
                </button>
                <a
                  href={selectedDocForAction.documentFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  style={{ fontSize: 12 }}
                >
                  Open ↗
                </a>
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Status <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="2">Approved</option>
              <option value="3">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Remark
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter document verification remarks..."
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setSelectedDocForAction(null);
                setActionStatus('2');
                setActionRemarks('');
              }}
              className="ax-btn ax-btn--secondary"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                borderRadius: 8,
                background: '#2559bf',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: submittingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {submittingAction ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Media Lightbox Modal ── */}
      {lightboxUrl && (
        <LightboxModal
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          url={lightboxUrl.url}
          title={lightboxUrl.title}
        />
      )}
    </div>
  );
}

export default VerifyRescoDocument;
