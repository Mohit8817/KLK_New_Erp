import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  karnatakaSwpService,
  resolveKarnatakaMediaUrl,
  type InstalledSiteItem,
  type ViewInstallSiteResponse,
} from '../../karnataka-services';

/* ───────── Responsive page CSS (Exact Solar ERP / ULA reference, all columns scrollable) ───────── */
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

const DASH = '—';

const fmtSerials = (val?: any): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) {
    const valid = val.map(String).map((s) => s.trim()).filter(Boolean);
    return valid.length > 0 ? valid.join(', ') : DASH;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return DASH;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const valid = parsed.map(String).map((s) => s.trim()).filter(Boolean);
        return valid.length > 0 ? valid.join(', ') : DASH;
      }
    } catch {}
    return trimmed.replace(/[\[\]"']/g, '').trim() || DASH;
  }
  return String(val);
};

const countModules = (val?: any): number => {
  if (!val) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.length;
    } catch {}
    const matches = val.match(/[^,\[\]"\s]+/g);
    return matches ? matches.length : 1;
  }
  return 1;
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 820,
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

/* ── Top KPI Card Component (matching reference) ── */
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

export function KarnatakaMaterialDetails() {
  const navigate = useNavigate();

  const [response, setResponse] = useState<ViewInstallSiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');

  // Active Site for Modal
  const [modalSite, setModalSite] = useState<InstalledSiteItem | null>(null);

  // Load Real Data from Server (API 7: View Install Site)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await karnatakaSwpService.getViewInstalledSites();
      setResponse(res);
    } catch (err: any) {
      console.error('Failed to load Karnataka material details:', err);
      setError(err?.message || 'Failed to load Karnataka material details from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rawSites = response?.sites || [];

  // District options
  const districtOptions = useMemo(() => {
    const s = new Set<string>();
    rawSites.forEach((r) => { if (r.district) s.add(r.district); });
    return Array.from(s).sort();
  }, [rawSites]);

  // Capacity options
  const capacityOptions = useMemo(() => {
    const s = new Set<string>();
    rawSites.forEach((r) => { if (r.pump_capacity) s.add(r.pump_capacity); });
    return Array.from(s).sort();
  }, [rawSites]);

  // Filtering
  const filteredSites = useMemo(() => {
    let list = [...rawSites];
    if (districtFilter !== 'all') {
      list = list.filter((s) => String(s.district || '').toLowerCase() === districtFilter.toLowerCase());
    }
    if (capacityFilter !== 'all') {
      list = list.filter((s) => String(s.pump_capacity || '').toLowerCase() === capacityFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => {
        const idMatch = String(s.id).includes(q);
        const nameMatch = (s.f_farmer_name || s.farmer_name || '').toLowerCase().includes(q);
        const fathMatch = (s.father_name || s.f_father_name || '').toLowerCase().includes(q);
        const distMatch = (s.district || '').toLowerCase().includes(q);
        const ctrlMatch = (s.controller_no || '').toLowerCase().includes(q);
        const pumpMatch = (s.pump_no || '').toLowerCase().includes(q);
        const motorMatch = (s.motor_no || '').toLowerCase().includes(q);
        const imeiMatch = (s.imei_no || '').toLowerCase().includes(q);
        const modMatch = fmtSerials(s.module_serial_no).toLowerCase().includes(q);
        return idMatch || nameMatch || fathMatch || distMatch || ctrlMatch || pumpMatch || motorMatch || imeiMatch || modMatch;
      });
    }
    return list;
  }, [rawSites, districtFilter, capacityFilter, search]);

  // Pagination hook (matching reference)
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, capacityFilter]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || capacityFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setCapacityFilter('all');
    setPage(1);
  };

  // Top KPI Metrics
  const totalTrackedSites = rawSites.length;
  const totalPumps = rawSites.filter((s) => Boolean(s.pump_no)).length;
  const totalControllers = rawSites.filter((s) => Boolean(s.controller_no)).length;
  const totalModules = rawSites.reduce((acc, s) => acc + countModules(s.module_serial_no), 0);

  // Export Columns definition
  const exportCols: ExportColumn<InstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: InstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Site ID', accessor: (r) => `${r.id}` },
      { header: 'Farmer Name', accessor: (r) => r.f_farmer_name || r.farmer_name || 'Farmer' },
      { header: 'Father Name', accessor: (r) => r.father_name || r.f_father_name || '—' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Tehsil / Village', accessor: (r) => r.f_tehsil || r.tehsil || r.f_village || r.village || '—' },
      { header: 'Pump Capacity', accessor: (r) => r.pump_capacity || '5HP-DC' },
      { header: 'Pump Type', accessor: (r) => r.pump_type || 'Submersible' },
      { header: 'Controller Serial', accessor: (r) => r.controller_no || '—' },
      { header: 'Pump Serial', accessor: (r) => r.pump_no || '—' },
      { header: 'Motor Serial', accessor: (r) => r.motor_no || '—' },
      { header: 'IMEI Number', accessor: (r) => r.imei_no || '—' },
      { header: 'Module Count', accessor: (r) => String(countModules(r.module_serial_no)) },
      { header: 'Module Serials', accessor: (r) => fmtSerials(r.module_serial_no) },
      { header: 'Coordinates', accessor: (r) => `${r.inst_latitude || r.latitude || '—'}, ${r.inst_longitude || r.longitude || '—'}` },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Karnataka_SWP_Material_Equipment';
  const fileTitle = 'Karnataka SWP Material & Equipment Details';

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
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
      alert('Material details data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Material details data copied to clipboard!');
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

  const headers = [
    'Sr. No.',
    'Site ID',
    'Beneficiary',
    'District / Location',
    'Pump Specification',
    'Controller Serial',
    'Pump Serial',
    'Motor Serial',
    'IMEI Number',
    'PV Modules',
    'Field Evidence',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact pattern) ── */}
      <PageHead
        title="Karnataka SWP Material &amp; Equipment Details"
        subtitle="Inventory tracking, serial number auditing, and equipment specifications for Karnataka Solar Water Pumps"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Karnataka' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Material Details' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/karnataka/installation/swp/view" className="ax-btn ax-btn--secondary ax-btn--sm">
              &larr; View Installations
            </Link>
            <Link to="/v/karnataka/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Installed Site</span>
            </Link>
          </div>
        }
      />

      {/* Error notification */}
      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Material Records</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Tracked Sites"
          value={totalTrackedSites.toLocaleString('en-IN')}
          sub={`${totalPumps} pumps verified & mapped`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Pump Controllers"
          value={totalControllers.toLocaleString('en-IN')}
          sub="Controllers with serial numbers"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="PV Modules Audited"
          value={totalModules.toLocaleString('en-IN')}
          sub="Individual module serial numbers"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pump Units"
          value={totalPumps.toLocaleString('en-IN')}
          sub="Submersible & surface assemblies"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact reference layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Site Material Allocation & Serial Register">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Site Material Allocation &amp; Serial Register</h2>
            <p className="ax-card__subtitle">
              Listing <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{rawSites.length}</span> material sites
              {' '}· Verified Pumps <b className="ax-num">{totalPumps}</b> · Controllers <b className="ax-num">{totalControllers}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter */}
              <select
                id="kswp_mat_dist_filter"
                className="ax-input ax-input--sm"
                style={{ width: 135, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Capacity Filter */}
              <select
                id="kswp_mat_cap_filter"
                className="ax-input ax-input--sm"
                style={{ width: 135, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={capacityFilter}
                onChange={(e) => {
                  setCapacityFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by pump capacity"
              >
                <option value="all">All Capacities</option>
                {capacityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search serial, IMEI, farmer…"
                size="sm"
                ariaLabel="Search material records"
              />

              {/* TableExportToolbar without columns toggle */}
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1500 }}
          >
            <caption className="ax-visually-hidden">Site Material Allocation &amp; Serial Register</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action'
                        ? { textAlign: 'right' }
                        : h === 'Sr. No.' || h === 'Site ID' || h === 'PV Modules' || h === 'Field Evidence'
                        ? { textAlign: 'center' }
                        : undefined
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading material &amp; equipment records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No equipment material records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try resetting your query.'
                          : 'No installed equipment records have been recorded yet.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const modCount = countModules(row.module_serial_no);
                  const photosCount = [row.module_image, row.controller_image, row.structure_image, row.running_water_image, row.foundation_image].filter(Boolean).length;

                  return (
                    <tr key={row.id} className="ax-table__row">
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)', textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Site ID */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#2563eb' }}>{row.id}</span>
                      </td>

                      {/* 3. Beneficiary */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.f_farmer_name || row.farmer_name || 'Farmer'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                          Father: {row.father_name || row.f_father_name || DASH}
                        </div>
                      </td>

                      {/* 4. District / Location */}
                      <td className="ax-table__td">
                        <b>{row.district || 'Karnataka'}</b>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                          {row.f_tehsil || row.tehsil || row.f_village || row.village || DASH}
                        </div>
                      </td>

                      {/* 5. Pump Specification */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: '11px', fontWeight: 600 }}>
                          {row.pump_capacity || '5HP-DC'}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2 }}>
                          {row.pump_type || 'Submersible'}
                        </div>
                      </td>

                      {/* 6. Controller Serial */}
                      <td className="ax-table__td" style={{ fontSize: '12px', fontWeight: 600 }}>
                        {row.controller_no || DASH}
                      </td>

                      {/* 7. Pump Serial */}
                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {row.pump_no || DASH}
                      </td>

                      {/* 8. Motor Serial */}
                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {row.motor_no || DASH}
                      </td>

                      {/* 9. IMEI Number */}
                      <td className="ax-table__td" style={{ fontSize: '11.5px', fontFamily: 'var(--ax-font-mono)' }}>
                        {row.imei_no || DASH}
                      </td>

                      {/* 10. PV Modules */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontSize: '11px', fontWeight: 600 }}>
                          {modCount} {modCount === 1 ? 'Module' : 'Modules'}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }} title={fmtSerials(row.module_serial_no)}>
                          {fmtSerials(row.module_serial_no)}
                        </div>
                      </td>

                      {/* 11. Field Evidence */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className={`ax-badge ax-badge--soft ${photosCount > 0 ? 'ax-badge--success' : 'ax-badge--neutral'}`} style={{ fontSize: '11px' }}>
                          📷 {photosCount} Photos
                        </span>
                      </td>

                      {/* 12. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => setModalSite(row)}
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Equipment Specification & Audit Details Modal ── */}
      <Modal
        open={Boolean(modalSite)}
        onClose={() => setModalSite(null)}
        title={modalSite ? `Equipment Audit · Site ${modalSite.id}` : 'Equipment Audit Details'}
        subtitle={modalSite ? `Beneficiary: ${modalSite.f_farmer_name || modalSite.farmer_name || 'Farmer'} · ${modalSite.district || 'Karnataka'}` : ''}
        maxWidth={840}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setModalSite(null)}>
              Close
            </button>
          </div>
        }
      >
        {modalSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Equipment Grid Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                padding: 16,
                borderRadius: 12,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>Pump Capacity &amp; Type</span>
                <strong style={{ fontSize: 13, color: 'var(--ax-text-strong)' }}>
                  {modalSite.pump_capacity || '5HP-DC'} ({modalSite.pump_type || 'Submersible'})
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>Pump Controller Serial</span>
                <strong style={{ fontSize: 13, color: '#2563eb' }}>{modalSite.controller_no || DASH}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>Pump Serial No.</span>
                <strong style={{ fontSize: 13, color: 'var(--ax-text-strong)' }}>{modalSite.pump_no || DASH}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>Motor Serial No.</span>
                <strong style={{ fontSize: 13, color: 'var(--ax-text-strong)' }}>{modalSite.motor_no || DASH}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>IMEI Number</span>
                <strong style={{ fontSize: 12.5, fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>
                  {modalSite.imei_no || DASH}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', marginBottom: 2 }}>GPS Coordinates</span>
                <strong style={{ fontSize: 12.5, color: 'var(--ax-text-strong)' }}>
                  {modalSite.inst_latitude || modalSite.latitude || DASH}, {modalSite.inst_longitude || modalSite.longitude || DASH}
                </strong>
              </div>
            </div>

            {/* Solar PV Module Serials Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Solar PV Module Serials ({countModules(modalSite.module_serial_no)} Installed)
                </h4>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(() => {
                  const str = fmtSerials(modalSite.module_serial_no);
                  if (str === DASH) {
                    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>No PV module serial numbers recorded.</span>;
                  }
                  return str.split(',').map((sn, idx) => (
                    <span
                      key={idx}
                      className="ax-badge ax-badge--soft ax-badge--neutral"
                      style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12, padding: '5px 10px', borderRadius: 6 }}
                    >
                      <b style={{ color: 'var(--asw-primary)', marginRight: 4 }}>#{idx + 1}</b> {sn.trim()}
                    </span>
                  ));
                })()}
              </div>
            </div>

            {/* Equipment Field Photos */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Field Installation Photos
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {[
                  { label: 'PV Module Array', src: modalSite.module_image },
                  { label: 'Pump Controller', src: modalSite.controller_image },
                  { label: 'Mounting Structure', src: modalSite.structure_image },
                  { label: 'Running Water Output', src: modalSite.running_water_image },
                  { label: 'Foundation Civil Work', src: modalSite.foundation_image },
                ].map((p, idx) => {
                  const resolved = p.src ? resolveKarnatakaMediaUrl(p.src) : '';
                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid var(--ax-border, #e2e8f0)',
                        borderRadius: 10,
                        padding: 8,
                        background: 'var(--ax-surface-subtle, #f8fafc)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                        {p.label}
                      </div>
                      {resolved ? (
                        <a href={resolved} target="_blank" rel="noopener noreferrer" title={`Open ${p.label}`}>
                          <img
                            src={resolved}
                            alt={p.label}
                            style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }}
                          />
                        </a>
                      ) : (
                        <div
                          style={{
                            height: 110,
                            background: 'var(--ax-surface-solid, #ffffff)',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ax-text-muted)',
                            fontSize: 12,
                            border: '1px dashed var(--ax-border)',
                          }}
                        >
                          Not Uploaded
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KarnatakaMaterialDetails;
