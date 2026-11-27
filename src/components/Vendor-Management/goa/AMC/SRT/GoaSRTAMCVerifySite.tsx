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
  type GoaAmcVerifyViewRecord,
  type GoaAmcVendor,
} from '../../goa-services';

/* ───────── Responsive Page CSS (Exact ERP Reference Standard) ───────── */
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

/* ───────── Clean Pure Inline SVGs (Strict Zero Emojis) ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SVG_CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SVG_ALERT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

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

export function GoaSRTAMCVerifySite() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingList, setPendingList] = useState<GoaAmcVerifyViewRecord[]>([]);
  const [completedList, setCompletedList] = useState<GoaAmcVerifyViewRecord[]>([]);
  const [vendorsList, setVendorsList] = useState<GoaAmcVendor[]>([]);

  // Report Wise Bifurcation
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedForDetails, setSelectedForDetails] = useState<GoaAmcVerifyViewRecord | null>(null);
  const [selectedForVerify, setSelectedForVerify] = useState<GoaAmcVerifyViewRecord | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<string>('1');
  const [verifyRemarksInput, setVerifyRemarksInput] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, formRes] = await Promise.allSettled([
        goaAdminService.getAMCVerifyView(),
        goaAdminService.getAMCAssignFormData(),
      ]);

      if (res.status === 'fulfilled') {
        const payload = res.value;
        setPendingList(Array.isArray(payload.srt) ? payload.srt : []);
        setCompletedList(Array.isArray(payload.coms) ? payload.coms : []);
      } else {
        console.error('Fetch Goa AMC verify error:', res.reason);
        setError(res.reason?.message || 'Failed to fetch AMC verification data.');
      }

      if (formRes.status === 'fulfilled' && Array.isArray(formRes.value.vendors)) {
        setVendorsList(formRes.value.vendors);
      }
    } catch (err: any) {
      console.error('Fetch Goa AMC verify error:', err);
      setError(err?.message || 'Failed to fetch AMC verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Vendor Lookup Map
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendorsList.forEach((v) => map.set(String(v.id), v.name));
    return map;
  }, [vendorsList]);

  const getVendorLabel = useCallback(
    (vId: string | number | null | undefined) => {
      if (!vId) return '—';
      const sId = String(vId);
      return vendorMap.get(sId) || `Vendor #${sId}`;
    },
    [vendorMap]
  );

  // Dynamic KPIs
  const totalAll = pendingList.length + completedList.length;
  const completedVisits = totalAll; // All rows in this audit pool have completed on-site AMC visits
  const pendingCount = pendingList.length;
  const approvedCount = useMemo(
    () => completedList.filter((s) => Number(s.amcverify_status) === 1).length,
    [completedList]
  );
  const rejectedCount = useMemo(
    () => completedList.filter((s) => Number(s.amcverify_status) === 2).length,
    [completedList]
  );

  const currentTabList = useMemo(() => {
    return activeTab === 'pending' ? pendingList : completedList;
  }, [activeTab, pendingList, completedList]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabList;

    return currentTabList.filter((row) => {
      const srt = row.srtdata || {};
      const amcStr = `amc ${row.amc || ''}`.toLowerCase();
      const stateStr = (srt.state || row.state || 'goa').toLowerCase();
      const distStr = (srt.district || row.district || '').toLowerCase();
      const deptStr = (srt.dept_name || srt.department_name || '').toLowerCase();
      const siteStr = (row.site_name || srt.site_name || '').toLowerCase();
      const locStr = (srt.location || srt.address || '').toLowerCase();
      const firmStr = (srt.firm_name || srt.agency_name || '').toLowerCase();
      const caStr = (srt.ca_no || srt.consumer_no || '').toLowerCase();
      const scStr = (srt.plant_sc || srt.sc_no || '').toLowerCase();
      const woStr = (srt.wo_no || srt.work_order_no || '').toLowerCase();
      const phaseStr = String(srt.phase || '').toLowerCase();
      const vStr = getVendorLabel(row.amc_assigned_to).toLowerCase();
      const benNameStr = (row.amc_beneficiary_name || '').toLowerCase();
      const benContactStr = String(row.amc_beneficiary_contact || '').toLowerCase();
      const remStr = (row.amc_remark || '').toLowerCase();

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
        vStr.includes(q) ||
        benNameStr.includes(q) ||
        benContactStr.includes(q) ||
        remStr.includes(q) ||
        String(row.id).includes(q) ||
        String(row.site_id).includes(q)
      );
    });
  }, [currentTabList, searchQuery, getVendorLabel]);

  const pagination = usePagination(filtered, { initialPageSize: 100 });

  // Export Columns matching exact 33 fields
  const exportCols: ExportColumn<GoaAmcVerifyViewRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') },
      { header: 'AMC Type', accessor: (r) => (r.amc ? `AMC ${r.amc}` : '—') },
      { header: 'State', accessor: (r) => (r.srtdata?.state || r.state || 'Goa').toUpperCase() },
      { header: 'District', accessor: (r) => r.srtdata?.district || r.district || '—' },
      { header: 'Dept Name', accessor: (r) => r.srtdata?.dept_name || r.srtdata?.department_name || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || r.srtdata?.site_name || `Site #${r.site_id}` },
      { header: 'Location', accessor: (r) => r.srtdata?.location || r.srtdata?.address || '—' },
      { header: 'Firm Name', accessor: (r) => r.srtdata?.firm_name || r.srtdata?.agency_name || '—' },
      { header: 'CA No', accessor: (r) => r.srtdata?.ca_no || r.srtdata?.consumer_no || '—' },
      { header: 'Sanction Load', accessor: (r) => r.srtdata?.sanction_load ? `${r.srtdata.sanction_load} kW` : '—' },
      { header: 'Plant SC', accessor: (r) => r.srtdata?.plant_sc || r.srtdata?.sc_no || '—' },
      { header: 'WO No', accessor: (r) => r.srtdata?.wo_no || r.srtdata?.work_order_no || '—' },
      { header: 'Phase', accessor: (r) => r.srtdata?.phase || '—' },
      { header: 'Assigned Date', accessor: (r) => r.amc_assigned_time || '—' },
      { header: 'Site Assigned', accessor: (r) => getVendorLabel(r.amc_assigned_to) },
      { header: 'Amc Date', accessor: (r) => r.amc_date || '—' },
      { header: 'Beneficiary Name', accessor: (r) => r.amc_beneficiary_name || '—' },
      { header: 'Beneficiary Contact', accessor: (r) => r.amc_beneficiary_contact || '—' },
      { header: 'AMC Logitude', accessor: (r) => r.amc_longitude || '—' },
      { header: 'Amc Latitude', accessor: (r) => r.amc_latitude || '—' },
      { header: 'Amc Remarks', accessor: (r) => r.amc_remark || '—' },
      {
        header: 'Amc Status',
        accessor: (r) => (Number(r.amc_status) === 1 ? 'Completed' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) => (Number(r.amcverify_status) === 1 ? 'Approved' : Number(r.amcverify_status) === 2 ? 'Rejected' : 'Pending'),
      },
    ],
    [getVendorLabel]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_AMC_Verify_${activeTab}`;
  const fileTitle = `Verify Goa SRT AMC (${activeTab === 'pending' ? 'Verify Pending' : 'Amc Approved/Rejected'})`;

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
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${title}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:5px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:8mm}}
    </style></head><body><h1>${title}</h1><table><thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedForVerify) return;
    setSubmittingAction(true);
    const statusNum = parseInt(verifyStatusChoice, 10);
    try {
      const res = await goaAdminService.verifyAMCStatus(selectedForVerify.id, statusNum);
      const actionLabel = statusNum === 1 ? 'Approved' : statusNum === 2 ? 'Rejected' : 'Pending';
      setSuccessMsg(res?.message || `AMC record #${selectedForVerify.id} decision updated to ${actionLabel}!`);
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
        title="Goa Verify SRT AMC Sites"
        subtitle="Review, audit, approve or reject periodic annual maintenance visits uploaded by vendors for Goa solar rooftop plants."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Verify AMC Status' },
        ]}
      />

      {/* ── Error Alert ── */}
      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {SVG_ALERT}
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── Success Alert ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {SVG_CHECK}
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', padding: 4 }}
            aria-label="Dismiss success message"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── Top 5 KPI Metric Cards (Matching Exact ERP Layout) ── */}
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
          label="Total AMC Sites"
          value={totalAll}
          sub="Total AMC visits registered"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Completed AMC Visits"
          value={completedVisits}
          sub="Completed periodic services"
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
          value={pendingCount}
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
          value={approvedCount}
          sub="QA verified & approved visits"
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
          value={rejectedCount}
          sub="Requires vendor rectification"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            pagination.setPage(1);
          }}
        >
          Verify Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('approved_rejected');
            pagination.setPage(1);
          }}
        >
          Amc Approved/Rejected
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {completedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Verify Pending AMC Visits' : 'Approved/Rejected AMC Data'}
            </h2>
            <p className="ax-card__subtitle">Showing {filtered.length} AMC records with complete on-ground beneficiary data & photographic logs</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  pagination.setPage(1);
                }}
                placeholder="Search site, CA, vendor, beneficiary..."
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

        {/* ── Responsive Horizontal Scroll Table (Exact 33 Requested Columns + Action) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3800 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">AMC Type</th>
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
                <th className="ax-table__th">Site Assigned</th>
                <th className="ax-table__th">Amc Date</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Beneficiary Contact</th>
                <th className="ax-table__th">AMC Logitude</th>
                <th className="ax-table__th">Amc Latitude</th>
                <th className="ax-table__th" style={{ minWidth: 160 }}>Amc Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 1</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 2</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 3</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 4</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 5</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 6</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 7</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 8</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 9</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Image 10</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={34} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading AMC verification records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={34} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this report bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: GoaAmcVerifyViewRecord, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const srt = row.srtdata || {};
                  const isPending = activeTab === 'pending' || Number(row.amcverify_status) === 0;

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">
                        <span
                          className="ax-badge"
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: Number(row.amc) === 1 ? 'rgba(37, 89, 191, 0.1)' : Number(row.amc) === 2 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            color: Number(row.amc) === 1 ? '#2559bf' : Number(row.amc) === 2 ? '#059669' : '#7c3aed',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          {row.amc ? `AMC ${row.amc}` : 'AMC'}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {(srt.state || row.state || 'Goa').toUpperCase()}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {srt.district || row.district || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {srt.dept_name || srt.department_name || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a', maxWidth: 220 }}>
                        {row.site_name || srt.site_name || `Site #${row.site_id}`}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {srt.location || srt.address || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {srt.firm_name || srt.agency_name || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {srt.ca_no || srt.consumer_no || '—'}
                      </td>
                      <td className="ax-table__td">
                        {srt.sanction_load ? `${srt.sanction_load} kW` : '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {srt.plant_sc || srt.sc_no || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {srt.wo_no || srt.work_order_no || '—'}
                      </td>
                      <td className="ax-table__td">{srt.phase || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.amc_assigned_time || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {getVendorLabel(row.amc_assigned_to)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.amc_date || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#1e293b' }}>
                        {row.amc_beneficiary_name || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.amc_beneficiary_contact || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.amc_longitude || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.amc_latitude || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.amc_remark || '—'}
                      </td>

                      {/* AMC Images 1 to 10 */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const imgKey = `amc_image${num}` as keyof GoaAmcVerifyViewRecord;
                        const imgSrc = row[imgKey] as string | undefined;
                        return (
                          <td key={imgKey} className="ax-table__td" style={{ textAlign: 'center' }}>
                            {imgSrc ? (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(resolveGoaMediaUrl(imgSrc))}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title={`Click to preview Amc Image ${num}`}
                              >
                                <img
                                  src={resolveGoaMediaUrl(imgSrc)}
                                  alt={`Amc ${num}`}
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
                        );
                      })}

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {Number(row.amc_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Completed
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {Number(row.amcverify_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : Number(row.amcverify_status) === 2 ? (
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
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForVerify(row);
                                setVerifyStatusChoice(String(row.amcverify_status || '1'));
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

      {/* ── Details Dossier Modal ── */}
      <Modal
        open={Boolean(selectedForDetails)}
        onClose={() => setSelectedForDetails(null)}
        title="Goa SRT AMC Verification Dossier"
        subtitle={selectedForDetails ? `AMC Round ${selectedForDetails.amc} • ${selectedForDetails.site_name || selectedForDetails.srtdata?.site_name} (Site ID: ${selectedForDetails.site_id})` : ''}
        maxWidth={840}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {selectedForDetails && (activeTab === 'pending' || Number(selectedForDetails.amcverify_status) === 0) && (
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={() => {
                  const s = selectedForDetails;
                  setSelectedForDetails(null);
                  setSelectedForVerify(s);
                  setVerifyStatusChoice(String(s.amcverify_status || '1'));
                  setVerifyRemarksInput(s.verify_remarks || '');
                }}
                style={{ padding: '6px 16px', fontSize: 13, fontWeight: 700 }}
              >
                Verify This AMC Visit
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedForDetails(null)}
              style={{ padding: '6px 18px', fontSize: 13, marginLeft: 'auto' }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Site & Vendor Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Site Name</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.site_name || selectedForDetails.srtdata?.site_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Site Assigned (Vendor)</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{getVendorLabel(selectedForDetails.amc_assigned_to)}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>District</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.srtdata?.district || selectedForDetails.district || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Dept Name</span>
                <span style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.srtdata?.dept_name || selectedForDetails.srtdata?.department_name || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Location / Firm</span>
                <span style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.srtdata?.location || '—'} / {selectedForDetails.srtdata?.firm_name || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>CA No. & Sanction Load</span>
                <span style={{ fontSize: 13, display: 'block', fontFamily: 'monospace' }}>
                  {selectedForDetails.srtdata?.ca_no || '—'} ({selectedForDetails.srtdata?.sanction_load ? `${selectedForDetails.srtdata.sanction_load} kW` : '—'})
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>WO No. & Phase</span>
                <span style={{ fontSize: 13, display: 'block' }}>WO: {selectedForDetails.srtdata?.wo_no || '—'} | Phase: {selectedForDetails.srtdata?.phase || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Assigned Date</span>
                <span style={{ fontSize: 13, display: 'block', fontFamily: 'monospace' }}>{selectedForDetails.amc_assigned_time || '—'}</span>
              </div>
            </div>

            {/* On-site Execution Details */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                On-Site Periodic Maintenance Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                <div>AMC Round: <strong>AMC {selectedForDetails.amc}</strong></div>
                <div>AMC Visit Date: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.amc_date || '—'}</strong></div>
                <div>Beneficiary Name: <strong>{selectedForDetails.amc_beneficiary_name || '—'}</strong></div>
                <div>Beneficiary Contact: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.amc_beneficiary_contact || '—'}</strong></div>
                <div>
                  GPS Latitude / Longitude:{' '}
                  {selectedForDetails.amc_latitude && selectedForDetails.amc_longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedForDetails.amc_latitude},${selectedForDetails.amc_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2559bf', fontWeight: 600, textDecoration: 'none' }}
                      title="Open location in Google Maps"
                    >
                      {selectedForDetails.amc_latitude}, {selectedForDetails.amc_longitude}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
                <div>
                  AMC Status:{' '}
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                    {Number(selectedForDetails.amc_status) === 1 ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* All 10 Photographic Evidence Media Gallery */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12 }}>
                Photographic Proof & Maintenance Logs (All 10 Images)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const imgKey = `amc_image${num}` as keyof GoaAmcVerifyViewRecord;
                  const imgSrc = selectedForDetails[imgKey] as string | undefined;
                  const label = `Amc Image ${num}`;
                  return (
                    <div key={imgKey} style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', textAlign: 'center', background: '#f8fafc' }}>
                      <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{label}</div>
                      {imgSrc ? (
                        <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => setLightboxUrl(resolveGoaMediaUrl(imgSrc))}>
                          <img
                            src={resolveGoaMediaUrl(imgSrc)}
                            alt={label}
                            style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <span style={{ fontSize: 9, color: '#2559bf', fontWeight: 600 }}>Click to zoom</span>
                        </div>
                      ) : (
                        <div style={{ padding: 24, color: '#94a3b8', fontSize: 11 }}>No Media</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 6 }}>
                Vendor Maintenance Remarks
              </div>
              <p style={{ fontSize: 13, margin: 0, color: '#334155' }}>{selectedForDetails.amc_remark || 'No remarks entered by vendor.'}</p>
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
        title="Verify AMC Maintenance Quality"
        subtitle={selectedForVerify ? `Site: ${selectedForVerify.site_name || selectedForVerify.srtdata?.site_name} • Round: AMC ${selectedForVerify.amc}` : ''}
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
              <option value="1">Approve (1) - Validates AMC visit & sets site flag to YES</option>
              <option value="2">Reject (2) - Requires vendor re-service / rectification</option>
              <option value="0">Pending (0)</option>
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
              placeholder="Enter technical audit remarks, inspection notes, or defect observations..."
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
                AMC Photographic Proof Preview
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
                    padding: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#64748b',
                  }}
                  aria-label="Close lightbox"
                >
                  {X_ICON}
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

export default GoaSRTAMCVerifySite;
