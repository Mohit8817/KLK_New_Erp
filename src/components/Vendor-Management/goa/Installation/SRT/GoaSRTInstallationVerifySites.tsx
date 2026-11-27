import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
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
  resolveGoaMediaUrl,
  type GoaViewInstallationResponse,
} from '../../goa-services';

/* ───────── Responsive Page CSS ───────── */
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

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
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
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// User Exact Table Columns:
// Sr. No. | Unique Id | State | District | Site Name | Vendor | Contact Person | Contact Number | Solar Meter No. | Inverter No. | Net/Smart Meter No. | Loger No. | System Image | Inverter Image | Panel Image | Net Meter/Smart Meter Image | Loger Image | Latitude | Longitude | Remark | Verify Status
export interface GoaInstallationVerifyItem {
  id: number;
  unique_id: string;
  state: string;
  district: string;
  site_name: string;
  vendor: string;
  contact_person: string;
  contact_number: string;
  solar_meter_no: string;
  inverter_no: string;
  net_smart_meter_no: string;
  logger_no: string;
  system_image: string | null;
  inverter_image: string | null;
  panel_image: string | null;
  net_meter_image: string | null;
  logger_image: string | null;
  latitude: string;
  longitude: string;
  remark: string;
  verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string;
  verify_date?: string;
}

export function GoaSRTInstallationVerifySites() {
  const [data, setData] = useState<GoaViewInstallationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedForDetails, setSelectedForDetails] = useState<any | null>(null);
  const [selectedForVerify, setSelectedForVerify] = useState<any | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<string>('1');
  const [verifyRemarksInput, setVerifyRemarksInput] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await goaAdminService.getViewInstallation();
      setData(res);
    } catch (err: any) {
      console.error('Fetch Goa Installation verify error:', err);
      setError(err?.message || 'Failed to fetch installation verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic KPIs from API
  const totalAssignedSites = data?.totalsite ?? 0;
  const completeSites = data?.complete ?? 0;
  const pendingSites = data?.verifypending ?? (data?.verification || []).length;
  const approveSites = data?.approvedsite ?? (data?.verified || []).filter((s: any) => Number(s.inst_verify_status) === 1).length;
  const rejectSites = data?.rejectsite ?? (data?.verified || []).filter((s: any) => Number(s.inst_verify_status) === 2).length;

  const currentTabList = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'pending') {
      return (data.verification || []).map((s: any) => ({
        ...s,
        unique_id: String(s.unique_id || s.uid || s.id || '—'),
        vendor: typeof s.vendor === 'object' ? s.vendor?.name : String(s.vendor || s.inst_vendor || '—'),
        contact_person: s.contact_person || '—',
        contact_number: s.contact_number || '—',
        solar_meter_no: s.solarmeter_no || '—',
        inverter_no: s.inverter_no || '—',
        net_smart_meter_no: s.nm_sm_no || '—',
        logger_no: s.loger_no || '—',
        system_image: s.system_image || null,
        inverter_image: s.inverter_image || null,
        panel_image: s.panel_image || null,
        net_meter_image: s.nm_sm_image || s.net_meter_image || null,
        logger_image: s.loger_image || s.logger_image || null,
        latitude: s.inst_latitude || s.latitude || '—',
        longitude: s.inst_longitude || s.longitude || '—',
        remark: s.inst_remarks || s.remarks || '—',
        verify_status: Number(s.inst_verify_status ?? 0),
      }));
    }
    return (data.verified || []).map((s: any) => ({
      ...s,
      unique_id: String(s.unique_id || s.uid || s.id || '—'),
      vendor: typeof s.vendor === 'object' ? s.vendor?.name : String(s.vendor || s.inst_vendor || '—'),
      contact_person: s.contact_person || '—',
      contact_number: s.contact_number || '—',
      solar_meter_no: s.solarmeter_no || '—',
      inverter_no: s.inverter_no || '—',
      net_smart_meter_no: s.nm_sm_no || '—',
      logger_no: s.loger_no || '—',
      system_image: s.system_image || null,
      inverter_image: s.inverter_image || null,
      panel_image: s.panel_image || null,
      net_meter_image: s.nm_sm_image || s.net_meter_image || null,
      logger_image: s.loger_image || s.logger_image || null,
      latitude: s.inst_latitude || s.latitude || '—',
      longitude: s.inst_longitude || s.longitude || '—',
      remark: s.inst_remarks || s.remarks || '—',
      verify_status: Number(s.inst_verify_status ?? 1),
    }));
  }, [activeTab, data]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabList;

    return currentTabList.filter((s: any) => {
      return (
        String(s.unique_id).toLowerCase().includes(q) ||
        String(s.site_name).toLowerCase().includes(q) ||
        String(s.vendor).toLowerCase().includes(q) ||
        String(s.district).toLowerCase().includes(q) ||
        String(s.solar_meter_no).toLowerCase().includes(q) ||
        String(s.inverter_no).toLowerCase().includes(q) ||
        String(s.net_smart_meter_no).toLowerCase().includes(q)
      );
    });
  }, [currentTabList, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 100 });

  // Export Columns
  const exportCols: ExportColumn<GoaInstallationVerifyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: GoaInstallationVerifyItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Unique Id', accessor: (r: GoaInstallationVerifyItem) => r.unique_id },
      { header: 'State', accessor: (r: GoaInstallationVerifyItem) => r.state },
      { header: 'District', accessor: (r: GoaInstallationVerifyItem) => r.district },
      { header: 'Site Name', accessor: (r: GoaInstallationVerifyItem) => r.site_name },
      { header: 'Vendor', accessor: (r: GoaInstallationVerifyItem) => r.vendor },
      { header: 'Contact Person', accessor: (r: GoaInstallationVerifyItem) => r.contact_person },
      { header: 'Contact Number', accessor: (r: GoaInstallationVerifyItem) => r.contact_number },
      { header: 'Solar Meter No.', accessor: (r: GoaInstallationVerifyItem) => r.solar_meter_no },
      { header: 'Inverter No.', accessor: (r: GoaInstallationVerifyItem) => r.inverter_no },
      { header: 'Net/Smart Meter No.', accessor: (r: GoaInstallationVerifyItem) => r.net_smart_meter_no },
      { header: 'Loger No.', accessor: (r: GoaInstallationVerifyItem) => r.logger_no },
      { header: 'Latitude', accessor: (r: GoaInstallationVerifyItem) => r.latitude },
      { header: 'Longitude', accessor: (r: GoaInstallationVerifyItem) => r.longitude },
      { header: 'Remark', accessor: (r: GoaInstallationVerifyItem) => r.remark },
      {
        header: 'Verify Status',
        accessor: (r: GoaInstallationVerifyItem) => (r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Rejected' : 'Pending'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_Installation_Verify_${activeTab}`;
  const fileTitle = `Verify Goa SRT Installation (${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected'})`;

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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:5px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:8mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedForVerify) return;
    setSubmittingAction(true);
    const statusNum = parseInt(verifyStatusChoice, 10);
    try {
      await goaAdminService.verifyInstallationStatus(selectedForVerify.id, statusNum as 1 | 2);
      await goaAdminService.updateInspectionStatus(selectedForVerify.id, statusNum as 1 | 2);
      setSuccessMsg(`Installation #${selectedForVerify.unique_id} decision updated to ${statusNum === 1 ? 'Approved' : 'Rejected'}!`);
      setSelectedForVerify(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="Verify Goa SRT Installation"
        subtitle="Physical installation audits, serial number cross-checking (Solar Meter, Inverter, Net Meter, Logger) & Quality Clearance"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Verify Sites' },
        ]}
      />

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

      {/* ── Top 5 KPI Metric Cards (Matching User Exact Standard) ── */}
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
          label="Total Sites"
          value={totalAssignedSites}
          sub="Total sanctioned sites in Goa"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={completeSites}
          sub="Completed solar rooftop sites"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verify Pending"
          value={pendingSites}
          sub="Awaiting quality audit review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          }
          tone="emerald"
          label="Verified Approved"
          value={approveSites}
          sub="QA verified & approved sites"
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
          label="Verified Rejected"
          value={rejectSites}
          sub="Sites requiring re-installation"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills (Exact user labels) ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(data?.verification || []).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved/Rejected SRT Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(data?.verified || []).length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Verification Pending Installations' : 'Approved/Rejected SRT Data'}
            </h2>
            <p className="ax-card__subtitle">Showing {filtered.length} sites with hardware serials & proof images</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search UID, site, meter, inverter..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table (Exact 22 user columns) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Unique Id</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Loger No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Net Meter/Smart Meter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' && (
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 22 : 21} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 22 : 21} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this report bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: GoaInstallationVerifyItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf' }}>
                        {row.unique_id}
                      </td>
                      <td className="ax-table__td">{row.state}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>{row.site_name}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor}</td>
                      <td className="ax-table__td">{row.contact_person}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.contact_number}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.solar_meter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2559bf' }}>{row.inverter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.net_smart_meter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.logger_no}</td>

                      {/* Photographic Media Columns with Thumbnail Preview Buttons */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.system_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveGoaMediaUrl(row.system_image))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to preview System Image"
                          >
                            <img
                              src={resolveGoaMediaUrl(row.system_image)}
                              alt="System"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.inverter_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveGoaMediaUrl(row.inverter_image))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to preview Inverter Image"
                          >
                            <img
                              src={resolveGoaMediaUrl(row.inverter_image)}
                              alt="Inverter"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.panel_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveGoaMediaUrl(row.panel_image))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to preview Panel Image"
                          >
                            <img
                              src={resolveGoaMediaUrl(row.panel_image)}
                              alt="Panel"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.net_meter_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveGoaMediaUrl(row.net_meter_image))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to preview Net/Smart Meter Image"
                          >
                            <img
                              src={resolveGoaMediaUrl(row.net_meter_image)}
                              alt="Net Meter"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.logger_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveGoaMediaUrl(row.logger_image))}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: 2,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                            title="Click to preview Logger Image"
                          >
                            <img
                              src={resolveGoaMediaUrl(row.logger_image)}
                              alt="Logger"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.latitude}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.longitude}</td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remark || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.verify_status === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : row.verify_status === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setSelectedForDetails(row)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#1e293b',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForVerify(row);
                                setVerifyStatusChoice(String(row.verify_status || '1'));
                                setVerifyRemarksInput(row.verify_remarks || '');
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
                            >
                              Verify
                            </button>
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

      {/* ── Details Modal ── */}
      <Modal
        open={Boolean(selectedForDetails)}
        onClose={() => setSelectedForDetails(null)}
        title="Goa SRT Installation Hardware Dossier"
        subtitle={selectedForDetails ? `${selectedForDetails.unique_id} • ${selectedForDetails.site_name}` : ''}
        maxWidth={780}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {selectedForDetails && (
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={() => {
                  const s = selectedForDetails;
                  setSelectedForDetails(null);
                  setSelectedForVerify(s);
                  setVerifyStatusChoice(String(s.verify_status || '1'));
                  setVerifyRemarksInput(s.verify_remarks || '');
                }}
                style={{ padding: '6px 16px', fontSize: 13, fontWeight: 700 }}
              >
                Verify This Installation
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedForDetails(null)}
              style={{ padding: '6px 18px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Site Name</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.site_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Vendor</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.vendor}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>District</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.district}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Contact</span>
                <span style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.contact_person} ({selectedForDetails.contact_number})</span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                Installed Hardware Serial Numbers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                <div>Solar Meter No: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.solar_meter_no}</strong></div>
                <div>Inverter No: <strong style={{ fontFamily: 'monospace', color: '#2559bf' }}>{selectedForDetails.inverter_no}</strong></div>
                <div>Net/Smart Meter No: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.net_smart_meter_no}</strong></div>
                <div>Logger No: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.logger_no}</strong></div>
              </div>
            </div>

            {/* Photographic Evidence Media Gallery */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12 }}>
                Photographic Proof & Inspection Media
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'System Image', img: selectedForDetails.system_image },
                  { label: 'Inverter Image', img: selectedForDetails.inverter_image },
                  { label: 'Panel Image', img: selectedForDetails.panel_image },
                  { label: 'Net Meter Image', img: selectedForDetails.net_meter_image },
                  { label: 'Logger Image', img: selectedForDetails.logger_image },
                ].map((item, i) => (
                  <div key={i} style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', textAlign: 'center', background: '#f8fafc' }}>
                    <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{item.label}</div>
                    {item.img ? (
                      <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => setLightboxUrl(resolveGoaMediaUrl(item.img))}>
                        <img src={resolveGoaMediaUrl(item.img)} alt={item.label} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />
                        <span style={{ fontSize: 9, color: '#2559bf', fontWeight: 600 }}>Click to zoom</span>
                      </div>
                    ) : (
                      <div style={{ padding: 24, color: '#94a3b8', fontSize: 11 }}>No Media</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 6 }}>
                Inspection Remarks
              </div>
              <p style={{ fontSize: 13, margin: 0, color: '#334155' }}>{selectedForDetails.remark}</p>
              {selectedForDetails.verify_remarks && (
                <div style={{ marginTop: 10, padding: 8, background: '#eff6ff', borderRadius: 6, fontSize: 12 }}>
                  <strong style={{ color: '#1e40af' }}>Auditor Clearance Note:</strong> {selectedForDetails.verify_remarks}
                  {selectedForDetails.verify_date && <span style={{ marginLeft: 8, color: '#64748b' }}>({selectedForDetails.verify_date})</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Verify Decision Modal ── */}
      <Modal
        open={Boolean(selectedForVerify)}
        onClose={() => {
          if (!submittingAction) setSelectedForVerify(null);
        }}
        title="Verify Installation Quality & Serials"
        subtitle={selectedForVerify ? `Site: ${selectedForVerify.site_name} • UID: ${selectedForVerify.unique_id}` : ''}
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setSelectedForVerify(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleVerifySubmit}
              disabled={submittingAction}
              style={{ padding: '6px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Submit Decision
            </button>
          </>
        }
      >
        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={verifyStatusChoice}
              onChange={(e) => setVerifyStatusChoice(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approved (Qualifies for Claim)</option>
              <option value="2">Rejected (Requires Rectification)</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Auditor Remarks
            </label>
            <textarea
              rows={3}
              value={verifyRemarksInput}
              onChange={(e) => setVerifyRemarksInput(e.target.value)}
              placeholder="Enter installation audit remarks, wiring clearance, or defect note..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Image Lightbox Modal ── */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Installation Photo Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#2559bf',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <img src={lightboxUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoaSRTInstallationVerifySites;
