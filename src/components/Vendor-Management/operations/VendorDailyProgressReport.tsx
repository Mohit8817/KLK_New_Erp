import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../shell/PageHead';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../common';
import {
  vendorOperationsService,
  type VendorDailyProgressItem,
  type VendorMasterItem,
} from './vendorOperationsService';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
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
  @media (max-width: 1024px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .ax-filter-card {
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-lg, 12px);
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
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

  /* Fullscreen lightbox viewer */
  .ax-lightbox-modal {
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(8px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-lightbox-img {
    max-width: 90vw;
    max-height: 82vh;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .ax-lightbox-close {
    position: absolute; top: 20px; right: 24px;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    width: 40px; height: 40px; border-radius: 50%;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: bold;
    transition: all 0.2s ease;
  }
  .ax-lightbox-close:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.05);
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Modal Dialog Component ───────── */
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

export function VendorDailyProgressReport() {
  const [reports, setReports] = useState<VendorDailyProgressItem[]>([]);
  const [vendorsList, setVendorsList] = useState<VendorMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter criteria
  const [filterVendor, setFilterVendor] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [tillDate, setTillDate] = useState('');

  // Modal & Lightbox
  const [selectedReportForView, setSelectedReportForView] = useState<VendorDailyProgressItem | null>(null);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [rList, vList] = await Promise.all([
        vendorOperationsService.getDailyProgress({
          vendor: filterVendor !== 'All' ? filterVendor : undefined,
          start_date: startDate || undefined,
          till_date: tillDate || undefined,
        }),
        vendorOperationsService.getVendors(),
      ]);
      setReports(rList);
      setVendorsList(vList);
    } catch (err) {
      console.error('Failed to fetch daily progress reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filterVendor, startDate, tillDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = () => {
    setFilterVendor('All');
    setStartDate('');
    setTillDate('');
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) =>
      (r.workorder && r.workorder.toLowerCase().includes(q)) ||
      (r.vendor_name && r.vendor_name.toLowerCase().includes(q)) ||
      (r.state && r.state.toLowerCase().includes(q)) ||
      (r.district && r.district.toLowerCase().includes(q)) ||
      (r.date && r.date.toLowerCase().includes(q))
    );
  }, [reports, searchQuery]);

  const pagination = usePagination(filteredReports, { initialPageSize: 100 });

  const kpis = useMemo(() => {
    const totalEntries = reports.length;
    const totalSites = reports.reduce((acc, curr) => acc + (Number(curr.workorder_quantity) || 0), 0);
    const uniqueVendors = new Set(reports.map((r) => r.vendor_name).filter(Boolean)).size;
    const uniqueDistricts = new Set(reports.map((r) => r.district).filter(Boolean)).size;
    return { totalEntries, totalSites, uniqueVendors, uniqueDistricts };
  }, [reports]);

  const exportCols: ExportColumn<VendorDailyProgressItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: VendorDailyProgressItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => r.date || '—' },
      { header: 'Work Order', accessor: (r) => r.workorder || '—' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || '—' },
      { header: 'State', accessor: (r) => r.state || '—' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'WO Quantity', accessor: (r) => String(r.workorder_quantity || 0) },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Vendor_Daily_Progress_Report';
  const fileTitle = 'Vendor Daily Progress Report Log';

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

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Header */}
      <PageHead
        title="Vendor Daily Progress Report"
        subtitle="Monitor field execution metrics, daily site volume completions and geo-tagged visual proofs"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Vendor Daily Progress Report' },
        ]}
      />

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Progress Logs"
          value={kpis.totalEntries}
          sub="Submitted daily logs"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald"
          label="Daily Sites Executed"
          value={kpis.totalSites.toLocaleString()}
          sub="Total site installations"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          tone="cyan"
          label="Reporting Vendors"
          value={kpis.uniqueVendors}
          sub="Active contractors"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <KpiCard
          tone="violet"
          label="Districts Active"
          value={kpis.uniqueDistricts}
          sub="Geographical coverage"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
        />
      </div>

      {/* Filter Vendor Card */}
      <div className="ax-card ax-filter-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(37, 99, 235, 0.12)',
              color: '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
            Filter Vendor Daily Progress
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)', marginBottom: '4px' }}>
              Start Date
            </label>
            <input
              type="date"
              className="ax-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--ax-border, #cbd5e1)',
                background: 'var(--ax-surface-solid, #ffffff)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)', marginBottom: '4px' }}>
              Till Date
            </label>
            <input
              type="date"
              className="ax-input"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--ax-border, #cbd5e1)',
                background: 'var(--ax-surface-solid, #ffffff)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)', marginBottom: '4px' }}>
              Select Vendor
            </label>
            <select
              className="ax-input"
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--ax-border, #cbd5e1)',
                background: 'var(--ax-surface-solid, #ffffff)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Vendors</option>
              {vendorsList.map((v) => (
                <option key={v.id} value={v.company_name}>
                  {v.company_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={fetchReports}
              style={{
                height: '36px',
                padding: '0 18px',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Filter Data
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleResetFilters}
              style={{
                height: '36px',
                padding: '0 16px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Daily Progress Log</h2>
            <p className="ax-card__subtitle">
              Showing {filteredReports.length} daily progress {filteredReports.length === 1 ? 'entry' : 'entries'} across active installations
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
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  pagination.setPage(1);
                }}
                placeholder="Search vendor, work order, district..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredReports, exportCols)}
                onExportCSV={() => exportToCSV(filteredReports, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredReports, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredReports, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1250 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: '48px', textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Work Order</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>WO Quantity</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Site Images</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Report</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading daily progress...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <TableEmptyState
                      title="No progress entries found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No progress records match the selected filter.'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((r, index) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + index + 1;
                  const img1 = r.images?.[0];
                  const img2 = r.images?.[1];

                  return (
                    <tr key={r.id}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ax-text-muted)' }}>
                        {globalIdx}
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>{r.date}</span>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text, #0f172a)' }}>
                          {r.workorder}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text, #0f172a)' }}>{r.vendor_name}</div>
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 500 }}>{r.state}</span>
                      </td>
                      <td className="ax-table__td">{r.district}</td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>
                          {Number(r.workorder_quantity || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {img1 ? (
                            <img
                              src={img1}
                              alt="Site 1"
                              onClick={() => setActiveLightboxImg(img1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: '1px solid var(--ax-border, #cbd5e1)',
                              }}
                              title="Click to view full image"
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>—</span>
                          )}

                          {img2 ? (
                            <img
                              src={img2}
                              alt="Site 2"
                              onClick={() => setActiveLightboxImg(img2)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: '1px solid var(--ax-border, #cbd5e1)',
                              }}
                              title="Click to view full image"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-badge ax-badge--soft ax-badge--info"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                          }}
                          onClick={() => setSelectedReportForView(r)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          PDF
                        </button>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => setSelectedReportForView(r)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View
                        </button>
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

      {/* Progress Report Overview Modal */}
      <Modal
        open={!!selectedReportForView}
        onClose={() => setSelectedReportForView(null)}
        title="Daily Progress Overview"
        subtitle={selectedReportForView ? `${selectedReportForView.vendor_name} • ${selectedReportForView.date}` : ''}
        maxWidth={640}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setSelectedReportForView(null)}
          >
            Close
          </button>
        }
      >
        {selectedReportForView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>VENDOR & WORK ORDER</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedReportForView.vendor_name}</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>{selectedReportForView.workorder}</div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>EXECUTION METRICS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                  {selectedReportForView.workorder_quantity} Sites Completed
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Date: {selectedReportForView.date}</div>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>LOCATION</div>
              <div style={{ fontSize: '13px', color: '#334155' }}>
                District: <strong>{selectedReportForView.district}</strong>, State: <strong>{selectedReportForView.state}</strong>
              </div>
            </div>

            {selectedReportForView.images && selectedReportForView.images.length > 0 && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>SITE PHOTOS</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedReportForView.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Site Photo ${i + 1}`}
                      onClick={() => setActiveLightboxImg(img)}
                      style={{
                        width: '120px',
                        height: '80px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: '1px solid #cbd5e1',
                      }}
                      title="Click to zoom in lightbox"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Lightbox Viewer */}
      {activeLightboxImg && (
        <div className="ax-lightbox-modal" onClick={() => setActiveLightboxImg(null)}>
          <button
            type="button"
            className="ax-lightbox-close"
            onClick={() => setActiveLightboxImg(null)}
            aria-label="Close image lightbox"
          >
            ✕
          </button>
          <img
            src={activeLightboxImg}
            alt="Enlarged site proof"
            className="ax-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default VendorDailyProgressReport;
