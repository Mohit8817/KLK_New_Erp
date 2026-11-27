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
  goaAdminService,
  type GoaAmcAssignRecord,
  type GoaAmcVendor,
  type GoaAmcDistrict,
} from '../../goa-services';

/* ───────── Responsive Page CSS (Exact ERP Reference Standard) ───────── */
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
    color: var(--ax-text-muted, #64748b);
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

/* ── Pure Clean SVG Icons (Zero Emojis) ── */
const SVG_CLOSE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SVG_ALERT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SVG_INFO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {SVG_CLOSE}
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (val?: string | null): string => {
  if (!val || val === '—') return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

const getAmcLabel = (amcVal?: string | number): string => {
  const n = Number(amcVal);
  if (n === 1) return '1st AMC';
  if (n === 2) return '2nd AMC';
  if (n === 3) return '3rd AMC';
  if (n === 4) return '4th AMC';
  if (n === 5) return '5th AMC';
  return amcVal ? `AMC ${amcVal}` : '—';
};

export function GoaSRTAMCAssignViewSite() {
  const [assigns, setAssigns] = useState<GoaAmcAssignRecord[]>([]);
  const [vendors, setVendors] = useState<GoaAmcVendor[]>([]);
  const [districts, setDistricts] = useState<GoaAmcDistrict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [amcFilter, setAmcFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  // Selected assign for full detail modal
  const [selectedAssign, setSelectedAssign] = useState<GoaAmcAssignRecord | null>(null);

  // Fetch API: GET /goa/srt/amc/view-assign
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await goaAdminService.getAMCViewAssign();
      setAssigns(Array.isArray(res?.assignsite) ? res.assignsite : []);
      setVendors(Array.isArray(res?.vendors) ? res.vendors : []);
      const dists = Array.isArray(res?.district) ? res.district : [];
      setDistricts(dists.length > 0 ? dists : [{ district: 'North Goa' }, { district: 'South Goa' }]);
    } catch (err: any) {
      console.warn('Failed to load Goa SRT AMC assignments:', err);
      setErrorMsg(err?.message || 'Failed to fetch assigned AMC sites from server.');
      setAssigns([]);
      setVendors([]);
      setDistricts([{ district: 'North Goa' }, { district: 'South Goa' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Vendor Lookup map
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach((v) => {
      if (v?.id != null) map.set(String(v.id), v.name);
    });
    return map;
  }, [vendors]);

  const getVendorName = useCallback(
    (vId?: string | number) => {
      if (vId == null || vId === '') return '—';
      return vendorMap.get(String(vId)) || `Vendor #${vId}`;
    },
    [vendorMap]
  );

  // Filtered assigns
  const filteredAssigns = useMemo(() => {
    let list = assigns;

    if (amcFilter !== 'all') {
      list = list.filter((r) => String(r.amc) === amcFilter);
    }

    if (districtFilter !== 'all') {
      list = list.filter((r) => {
        const d = (r.srtdata?.district || r.district || '').toLowerCase();
        return d === districtFilter.toLowerCase();
      });
    }

    if (vendorFilter !== 'all') {
      list = list.filter((r) => String(r.amc_assigned_to) === vendorFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((row) => {
      const srt = row.srtdata || {};
      const amcStr = getAmcLabel(row.amc).toLowerCase();
      const stateStr = (srt.state || row.state || 'goa').toLowerCase();
      const distStr = (srt.district || row.district || '').toLowerCase();
      const deptStr = (srt.dept_name || srt.department_name || srt.department || '').toLowerCase();
      const siteStr = (row.site_name || srt.site_name || '').toLowerCase();
      const locStr = (srt.location || srt.address || srt.city || srt.taluka || '').toLowerCase();
      const firmStr = (srt.firm_name || srt.agency_name || srt.agency || '').toLowerCase();
      const caStr = (srt.ca_no || srt.consumer_no || '').toLowerCase();
      const scStr = (srt.plant_sc || srt.plant_sc_no || srt.sc_no || '').toLowerCase();
      const woStr = (srt.wo_no || srt.work_order_no || srt.workorder_no || '').toLowerCase();
      const phaseStr = (srt.phase || srt.project_phase || '').toLowerCase();
      const vName = getVendorName(row.amc_assigned_to).toLowerCase();
      const idStr = String(row.id || '');
      const siteIdStr = String(row.site_id || '');

      return (
        amcStr.includes(q) ||
        stateStr.includes(q) ||
        distStr.includes(q) ||
        deptStr.includes(q) ||
        siteStr.includes(q) ||
        locStr.includes(q) ||
        firmStr.includes(q) ||
        caStr.includes(q) ||
        scStr.includes(q) ||
        woStr.includes(q) ||
        phaseStr.includes(q) ||
        vName.includes(q) ||
        idStr.includes(q) ||
        siteIdStr.includes(q)
      );
    });
  }, [assigns, amcFilter, districtFilter, vendorFilter, searchQuery, getVendorName]);

  const {
    paginatedData: pagedAssigns,
    currentPage: curPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredAssigns, initialPageSize: 100 });

  // Export Columns definition matching user request exactly
  const exportCols: ExportColumn<GoaAmcAssignRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Amc Type', accessor: (r) => getAmcLabel(r.amc) },
      { header: 'State', accessor: (r) => (r.srtdata?.state || r.state || 'Goa').toUpperCase() },
      { header: 'District', accessor: (r) => r.srtdata?.district || r.district || '—' },
      { header: 'Dept Name', accessor: (r) => r.srtdata?.dept_name || r.srtdata?.department_name || r.srtdata?.department || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || r.srtdata?.site_name || `Site #${r.site_id}` },
      { header: 'Location', accessor: (r) => r.srtdata?.location || r.srtdata?.address || r.srtdata?.city || r.srtdata?.taluka || '—' },
      { header: 'Firm Name', accessor: (r) => r.srtdata?.firm_name || r.srtdata?.agency_name || r.srtdata?.agency || '—' },
      { header: 'CA No', accessor: (r) => r.srtdata?.ca_no || r.srtdata?.consumer_no || '—' },
      { header: 'Sanction Load', accessor: (r) => r.srtdata?.sanction_load ? `${r.srtdata.sanction_load} kW` : '—' },
      { header: 'Plant SC', accessor: (r) => r.srtdata?.plant_sc || r.srtdata?.plant_sc_no || r.srtdata?.sc_no || '—' },
      { header: 'WO No', accessor: (r) => r.srtdata?.wo_no || r.srtdata?.work_order_no || r.srtdata?.workorder_no || '—' },
      { header: 'Phase', accessor: (r) => r.srtdata?.phase || r.srtdata?.project_phase || '—' },
      { header: 'Assigned Date', accessor: (r) => fmtDate(r.amc_assigned_time || r.created_at) },
      { header: 'Assigned Vendor', accessor: (r) => getVendorName(r.amc_assigned_to) },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Goa_SRT_AMC_Assigned_Sites';
  const fileTitle = 'Goa SRT AMC Assigned Sites Register';

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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // KPI Calculations
  const totalCount = assigns.length;
  const amc1Count = assigns.filter((a) => Number(a.amc) === 1).length;
  const amc2Count = assigns.filter((a) => Number(a.amc) === 2).length;
  const amcHigherCount = assigns.filter((a) => Number(a.amc) >= 3).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Goa Assigned SRT AMC Sites"
        subtitle="View Assign Goa SRT Site · Report Wise Bifurcation and Contractor Servicing Schedules"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Goa Assigned SRT AMC Sites' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
            <Link to="/vendor-management/goa/srt/amc/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              + Assign AMC Sites
            </Link>
            <Link to="/vendor-management/goa/srt/amc/verify" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify AMC Status
            </Link>
            <Link to="/vendor-management/goa/srt/amc/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              AMC Dashboard
            </Link>
          </div>
        }
      />

      {/* ── Error Feedback Banner ── */}
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {SVG_ALERT} {errorMsg}
          </span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 4 }}
            aria-label="Close error banner"
          >
            {SVG_CLOSE}
          </button>
        </div>
      )}

      {/* ── Top 4 KPI Summary Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
            </svg>
          }
          tone="accent"
          label="Total AMC Assigned"
          value={totalCount}
          sub="Sites assigned to registered vendors"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="cyan"
          label="1st AMC Visits"
          value={amc1Count}
          sub="Year 1 servicing active"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
          tone="emerald"
          label="2nd AMC Visits"
          value={amc2Count}
          sub="Year 2 maintenance cycle"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          tone="violet"
          label="3rd–5th AMC Cycles"
          value={amcHigherCount}
          sub="Long-term solar support cycles"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Goa Assigned SRT AMC Sites</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredAssigns.length}</span> of <span className="ax-num">{assigns.length}</span> allocations
              {' '}· 1st AMC: <b className="ax-num">{amc1Count}</b> · 2nd AMC: <b className="ax-num">{amc2Count}</b> · 3rd–5th AMC: <b className="ax-num">{amcHigherCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* AMC Type Filter */}
              <select
                id="amc_type_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={amcFilter}
                onChange={(e) => {
                  setAmcFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by AMC round"
              >
                <option value="all">All AMC Types</option>
                <option value="1">1st AMC</option>
                <option value="2">2nd AMC</option>
                <option value="3">3rd AMC</option>
                <option value="4">4th AMC</option>
                <option value="5">5th AMC</option>
              </select>

              {/* District Filter */}
              <select
                id="amc_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districts.map((d: any) => {
                  const dName = typeof d === 'string' ? d : d?.district || String(d);
                  return (
                    <option key={dName} value={dName}>
                      {dName}
                    </option>
                  );
                })}
              </select>

              {/* Vendor Filter */}
              <select
                id="amc_vendor_filter"
                className="ax-input ax-input--sm"
                style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={vendorFilter}
                onChange={(e) => {
                  setVendorFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by vendor"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.name}
                  </option>
                ))}
              </select>

              {(searchQuery.trim() !== '' || amcFilter !== 'all' || districtFilter !== 'all' || vendorFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setAmcFilter('all');
                    setDistrictFilter('all');
                    setVendorFilter('all');
                    setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <Link
                to="/vendor-management/goa/srt/amc/assign"
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
                + Assign New AMC
              </Link>

              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setPage(1);
                }}
                placeholder="Search site, vendor, CA, WO..."
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

        {/* ── Responsive Horizontal Scroll Table (15 Fields Requested) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1550 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th">Amc Type</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Dept Name</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Location</th>
                <th className="ax-table__th">Firm Name</th>
                <th className="ax-table__th">CA No</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Plant SC</th>
                <th className="ax-table__th">WO No</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">Assigned Date</th>
                <th className="ax-table__th">Assigned Vendor</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading assigned AMC sites...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedAssigns.length === 0 ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <TableEmptyState
                      title="No AMC assignments found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No AMC site batches have been assigned yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagedAssigns.map((row, idx) => {
                  const globalIdx = (curPage - 1) * pageSize + idx + 1;
                  const srt = row.srtdata || {};
                  const amcBadgeText = getAmcLabel(row.amc);
                  const stateVal = (srt.state || row.state || 'Goa').toUpperCase();
                  const distVal = srt.district || row.district || '—';
                  const deptVal = srt.dept_name || srt.department_name || srt.department || '—';
                  const siteVal = row.site_name || srt.site_name || `Site #${row.site_id}`;
                  const locVal = srt.location || srt.address || srt.city || srt.taluka || '—';
                  const firmVal = srt.firm_name || srt.agency_name || srt.agency || '—';
                  const caVal = srt.ca_no || srt.consumer_no || '—';
                  const loadVal = srt.sanction_load ? `${srt.sanction_load} kW` : '—';
                  const scVal = srt.plant_sc || srt.plant_sc_no || srt.sc_no || '—';
                  const woVal = srt.wo_no || srt.work_order_no || srt.workorder_no || '—';
                  const phaseVal = srt.phase || srt.project_phase || '—';
                  const assignDateVal = fmtDate(row.amc_assigned_time || row.created_at);
                  const vendorName = getVendorName(row.amc_assigned_to);

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">
                        <span
                          className="ax-badge"
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: Number(row.amc) === 1 ? 'rgba(37, 99, 235, 0.1)' : Number(row.amc) === 2 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            color: Number(row.amc) === 1 ? '#2563eb' : Number(row.amc) === 2 ? '#059669' : '#7c3aed',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          {amcBadgeText}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>{stateVal}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{distVal}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{deptVal}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', maxWidth: 220 }}>
                        <span title={siteVal}>{siteVal}</span>
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{locVal}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{firmVal}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>{caVal}</td>
                      <td className="ax-table__td">{loadVal}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>{scVal}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>{woVal}</td>
                      <td className="ax-table__td">{phaseVal}</td>
                      <td className="ax-table__td">{assignDateVal}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                        {vendorName}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedAssign(row)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'var(--ax-surface-subtle, #f1f5f9)',
                            border: '1px solid var(--ax-border, #cbd5e1)',
                            color: '#2563eb',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {SVG_INFO} Details
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
              currentPage={curPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Modal Dialog: Full Site Details ── */}
      <Modal
        open={Boolean(selectedAssign)}
        onClose={() => setSelectedAssign(null)}
        title={`AMC Allocation Details: ${selectedAssign?.site_name || selectedAssign?.srtdata?.site_name || `Site #${selectedAssign?.site_id}`}`}
        subtitle={`Record ID #${selectedAssign?.id} • Round: ${getAmcLabel(selectedAssign?.amc)} • Assigned to: ${getVendorName(selectedAssign?.amc_assigned_to)}`}
        maxWidth={840}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setSelectedAssign(null)}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        }
      >
        {selectedAssign && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Assigned Vendor</span>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>{getVendorName(selectedAssign.amc_assigned_to)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>AMC Cycle</span>
                <strong style={{ fontSize: 13, color: '#2563eb' }}>{getAmcLabel(selectedAssign.amc)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Assignment Date</span>
                <strong style={{ fontSize: 13 }}>{fmtDate(selectedAssign.amc_assigned_time || selectedAssign.created_at)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                  Site & Plant Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Site ID:</span> <b>#{selectedAssign.site_id}</b></div>
                  <div><span style={{ color: '#64748b' }}>Site Name:</span> <b>{selectedAssign.site_name || selectedAssign.srtdata?.site_name || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>State:</span> <b>{(selectedAssign.srtdata?.state || selectedAssign.state || 'Goa').toUpperCase()}</b></div>
                  <div><span style={{ color: '#64748b' }}>District:</span> <b>{selectedAssign.srtdata?.district || selectedAssign.district || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Dept Name:</span> <b>{selectedAssign.srtdata?.dept_name || selectedAssign.srtdata?.department_name || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Location:</span> <b>{selectedAssign.srtdata?.location || selectedAssign.srtdata?.address || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Firm Name:</span> <b>{selectedAssign.srtdata?.firm_name || selectedAssign.srtdata?.agency_name || '—'}</b></div>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                  Technical & Sanction Identifiers
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>CA Number:</span> <code style={{ fontWeight: 600 }}>{selectedAssign.srtdata?.ca_no || selectedAssign.srtdata?.consumer_no || '—'}</code></div>
                  <div><span style={{ color: '#64748b' }}>Sanction Load:</span> <b>{selectedAssign.srtdata?.sanction_load ? `${selectedAssign.srtdata.sanction_load} kW` : '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Plant SC:</span> <code style={{ fontWeight: 600 }}>{selectedAssign.srtdata?.plant_sc || selectedAssign.srtdata?.plant_sc_no || '—'}</code></div>
                  <div><span style={{ color: '#64748b' }}>Work Order (WO):</span> <code style={{ fontWeight: 600 }}>{selectedAssign.srtdata?.wo_no || selectedAssign.srtdata?.work_order_no || '—'}</code></div>
                  <div><span style={{ color: '#64748b' }}>Phase:</span> <b>{selectedAssign.srtdata?.phase || selectedAssign.srtdata?.project_phase || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>AMC Status:</span> <b>{selectedAssign.amc_status === 1 ? 'Servicing Done' : 'Pending'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Verify Status:</span> <b>{selectedAssign.amcverify_status === 1 ? 'Approved' : selectedAssign.amcverify_status === 2 ? 'Rejected' : 'Pending Audit'}</b></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GoaSRTAMCAssignViewSite;
