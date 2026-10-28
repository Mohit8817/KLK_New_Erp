import { useEffect, useMemo, useRef, useState, useCallback, useDeferredValue, type ReactNode } from 'react';
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
  punjabSslInstallationService,
  type PunjabAssignedLightItem,
} from '../../punjab-services';

/* ───────── Responsive page CSS (Exact Assam SWP / Bihar reference) ───────── */
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

  /* All table columns fully scrollable horizontally - no sticky clipping */
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

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

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

/* ── Top KPI Card Component (matching Assam SWP / Bihar reference) ── */
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
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card"
      style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={onClick}
    >
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

// Helper: parse panchayat string or JSON
const parsePanchayat = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s;
    }
  }
  return '';
};

const normalizeRecord = (r: any): PunjabAssignedLightItem => ({
  ...r,
  panchayat: parsePanchayat(r.panchayat),
  status: Number(r.status) || 0,
});

export function Punjab_Installation_SSL_AssignedLights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PunjabAssignedLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PunjabAssignedLightItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PunjabAssignedLightItem | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await punjabSslInstallationService.getAssignedLights();
      setRecords(Array.isArray(data) ? data.map(normalizeRecord) : []);
    } catch (err: any) {
      console.error('[Punjab SSL] load assigned lights error:', err);
      setActionErrorMsg('Failed to load Punjab assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts for filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          String(r.id).includes(q);
        if (!matches) return false;
      }
      if (statusFilter === 'pending' && r.status === 2) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;
      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let pendingCount = 0;
    let acceptedCount = 0;
    const districtSet = new Set<string>();
    records.forEach((r) => {
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
      if (r.district) districtSet.add(r.district.trim());
    });
    return { totalBatches, pendingCount, acceptedCount, totalDistricts: districtSet.size };
  }, [records]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [deferredQuery, statusFilter, districtFilter]);

  // Export Columns
  const exportCols: ExportColumn<PunjabAssignedLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => idx + 1 },
      { header: 'Batch ID', accessor: (r) => `#${r.id}` },
      { header: 'Vendor', accessor: (r) => r.vendor || '—' },
      { header: 'State', accessor: (r) => r.state || 'Punjab' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Block', accessor: (r) => r.block || '—' },
      { header: 'Panchayat', accessor: (r) => r.panchayat || '—' },
      { header: 'Status', accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Accept') },
    ],
    []
  );

  // Accept Action (API 2: GET /punjab/ssl/installation/update-status-assigned-light?light_id={light_id})
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await punjabSslInstallationService.acceptAssignedLight(selectedItem.id);
      setActionSuccessMsg(res.message || 'Light assignment accepted successfully!');
      setAcceptModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to accept light assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (item: PunjabAssignedLightItem) => {
    setActiveItem(item);
    setModalSearch('');
    setDetailModalOpen(true);
  };

  // Split panchayats list for detail modal view
  const panchayatList = useMemo(() => {
    if (!activeItem?.panchayat) return [];
    return activeItem.panchayat
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeItem]);

  const filteredPanchayats = useMemo(() => {
    if (!modalSearch.trim()) return panchayatList;
    const q = modalSearch.toLowerCase().trim();
    return panchayatList.filter((p) => p.toLowerCase().includes(q));
  }, [panchayatList, modalSearch]);

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
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

  const exportToCSV = () => {
    if (!filtered.length) return;
    const out = [
      exportCols.map((c) => c.header),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, 'Punjab_SSL_Assignments.csv', 'text/csv');
  };

  const exportToExcel = () => {
    if (!filtered.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${filtered.map((row, idx) => `<tr>${exportCols.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, 'Punjab_SSL_Assignments.xls', 'application/vnd.ms-excel');
  };

  const copyToClipboard = async () => {
    if (!filtered.length) return;
    const t = [
      exportCols.map((c) => c.header).join('\t'),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Assigned data copied to clipboard!');
    } catch {
      alert('Copy failed, please export CSV instead.');
    }
  };

  const exportToPDF = () => {
    if (!filtered.length) return;
    const body = filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>Punjab SSL Assigned Lights</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Punjab SSL Assigned Lights Register</h1><table><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (matching Assam SWP reference) ── */}
      <PageHead
        title="SSL-Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution in Punjab"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
          { label: 'Request Accept' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/punjab/ssl/installation/update-light-deatils" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
            </Link>
          </div>
        }
      />

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{actionSuccessMsg}</div>
        </div>
      )}

      {actionErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Accept Error</div>
          <div className="ax-alert__text">{actionErrorMsg}</div>
        </div>
      )}

      {/* Top KPI Cards (matching Assam SWP 4 cards layout) */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" />
              <path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" />
            </svg>
          }
          tone="accent"
          label="Total Allocations"
          value={metrics.totalBatches}
          sub="All assigned batches"
          onClick={() => setStatusFilter('all')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
          tone="cyan"
          label="Active Districts"
          value={metrics.totalDistricts}
          sub="Districts covered"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" />
            </svg>
          }
          tone="emerald"
          label="Accepted"
          value={metrics.acceptedCount}
          sub="Ready for installation"
          onClick={() => setStatusFilter('accepted')}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          }
          tone="amber"
          label="Pending Accept"
          value={metrics.pendingCount}
          sub="Awaiting vendor acceptance"
          onClick={() => setStatusFilter('pending')}
        />
      </div>

      {/* Main Table Card */}
      <section className="ax-card" role="region" aria-label="Assigned lights register">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">Site Allocation</span>
            <h2 className="ax-card__title">Assigned Installation Register</h2>
            <p className="ax-card__subtitle">Review assigned lights by district and block, verify panchayats, and accept allocations</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Filter Tabs */}
              <div style={{ display: 'inline-flex', background: 'var(--ax-surface-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--ax-border)' }}>
                <button
                  type="button"
                  style={{
                    border: 'none', background: statusFilter === 'all' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'all' ? '#2563eb' : 'var(--ax-text-muted)',
                    fontWeight: 600, fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({records.length})
                </button>
                <button
                  type="button"
                  style={{
                    border: 'none', background: statusFilter === 'pending' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'pending' ? '#d97706' : 'var(--ax-text-muted)',
                    fontWeight: 600, fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    boxShadow: statusFilter === 'pending' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({metrics.pendingCount})
                </button>
                <button
                  type="button"
                  style={{
                    border: 'none', background: statusFilter === 'accepted' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'accepted' ? '#16a34a' : 'var(--ax-text-muted)',
                    fontWeight: 600, fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    boxShadow: statusFilter === 'accepted' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                  onClick={() => setStatusFilter('accepted')}
                >
                  Accepted ({metrics.acceptedCount})
                </button>
              </div>

              {/* District Filter Dropdown */}
              {districts.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, district..." size="sm" />
              <TableExportToolbar
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
                onCopy={copyToClipboard}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Batch ID</th>
                <th className="ax-table__th" scope="col">Vendor</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Panchayat(s)</th>
                <th className="ax-table__th" scope="col">View</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned installation batches…
                  </td>
                </tr>
              )}

              {!loading && pagination.paginatedData.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No assigned lights found"
                      message={
                        searchQuery || statusFilter !== 'all' || districtFilter !== 'all'
                          ? 'No records match your active search filters.'
                          : 'No assigned lights currently allocated.'
                      }
                      onClear={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setDistrictFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                pagination.paginatedData.map((row, idx) => {
                  const isAccepted = row.status === 2;
                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#2563eb' }}>
                        #{row.id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor || '—'}
                      </td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ textTransform: 'capitalize' }}>
                          {row.state || 'Punjab'}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.district || '—'}
                      </td>
                      <td className="ax-table__td">{row.block || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 260, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.panchayat || '—'}
                      </td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          style={{ color: '#2563eb', fontWeight: 600 }}
                          onClick={() => handleOpenDetail(row)}
                        >
                          View Detail
                        </button>
                      </td>
                      <td className="ax-table__td">
                        {isAccepted ? (
                          <Badge tone="success">Accepted</Badge>
                        ) : (
                          <Badge tone="warning">Pending Accept</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isAccepted ? (
                          <span style={{ fontSize: 12, color: 'var(--ax-text-muted)', fontWeight: 500 }}>—</span>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            style={{
                              padding: '4px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                            }}
                            onClick={() => {
                              setSelectedItem(row);
                              setAcceptModalOpen(true);
                            }}
                          >
                            Accept
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer (matching Assam/Bihar reference) */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── View Detail Modal ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Allocation Details — Batch #${activeItem?.id || ''}`}
        subtitle={`State: ${activeItem?.state || 'Punjab'} · District: ${activeItem?.district || '—'} · Block: ${activeItem?.block || '—'}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Status: <b>{activeItem?.status === 2 ? 'Accepted' : 'Pending Acceptance'}</b>
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeItem && activeItem.status !== 2 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSelectedItem(activeItem);
                    setAcceptModalOpen(true);
                  }}
                >
                  Accept Allocation
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Batch ID</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>#{activeItem?.id}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Vendor</span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem?.vendor || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>District</span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem?.district || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Block</span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem?.block || '—'}</div>
            </div>
          </div>

          {/* Panchayats search & list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                Allocated Panchayats ({panchayatList.length})
              </h4>
              <div style={{ width: 220 }}>
                <SearchInput value={modalSearch} onChange={setModalSearch} placeholder="Filter panchayats..." size="sm" />
              </div>
            </div>

            <div style={{ border: '1px solid var(--ax-border)', borderRadius: 8, maxHeight: 240, overflowY: 'auto' }}>
              {filteredPanchayats.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
                  No panchayats match your filter.
                </div>
              ) : (
                <table className="ax-table ax-table--striped">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Panchayat Name</th>
                      <th>District</th>
                      <th>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPanchayats.map((p, idx) => (
                      <tr key={idx}>
                        <td className="ax-num" style={{ color: 'var(--ax-text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p}</td>
                        <td>{activeItem?.district || '—'}</td>
                        <td>{activeItem?.block || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Accept Confirmation Modal ── */}
      <Modal
        open={acceptModalOpen}
        onClose={() => !submitting && setAcceptModalOpen(false)}
        title="Confirm Allocation Acceptance"
        subtitle="Accepting this allocation enables installation form execution for ready lights in this batch"
        maxWidth={520}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              disabled={submitting}
              onClick={() => setAcceptModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              disabled={submitting}
              onClick={handleConfirmAccept}
            >
              {submitting ? (
                <><span className="ax-spinner" style={{ marginRight: 6 }} /> Accepting…</>
              ) : (
                'Confirm & Accept'
              )}
            </button>
          </div>
        }
      >
        <div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
            Are you sure you want to accept this light assignment batch? Once accepted, all allocated lights in this district and block will become available for installation.
          </p>

          <dl style={{ margin: 0, padding: 14, background: 'var(--ax-surface-subtle)', borderRadius: 10, border: '1px solid var(--ax-border)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 13 }}>
            <dt style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Batch ID:</dt>
            <dd style={{ margin: 0, fontWeight: 700, color: '#2563eb' }}>#{selectedItem?.id}</dd>
            <dt style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>District:</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{selectedItem?.district || '—'}</dd>
            <dt style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Block:</dt>
            <dd style={{ margin: 0 }}>{selectedItem?.block || '—'}</dd>
            <dt style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Panchayat(s):</dt>
            <dd style={{ margin: 0, whiteSpace: 'normal' }}>{selectedItem?.panchayat || '—'}</dd>
          </dl>
        </div>
      </Modal>
    </div>
  );
}

export default Punjab_Installation_SSL_AssignedLights;
