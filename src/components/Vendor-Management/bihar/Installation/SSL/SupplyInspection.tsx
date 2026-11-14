import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

export interface BiharSSLSupplyItem {
  id: number;
  vendor_name: string;
  state: string;
  district?: string;
  date: string;
  no_of_lights: number;
  amount: string;
  inspection_remark: string;
  file: string;
  inspection_status: string;
  verify_status: string;
  status_code: number; // 0=Pending, 1=Approved/Complete, 2=Rejected
  verify_remark: string;
  verified_at?: string;
  verified_by?: string;
  [key: string]: any;
}

/* ───────── Responsive page CSS (Exact Karnataka SWP reference) ───────── */
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
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
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
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component (Exact Karnataka SWP Reference) ── */
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function BiharSSLInstallationSupplyInspection() {
  const [verifyPending, setVerifyPending] = useState<BiharSSLSupplyItem[]>([]);
  const [verifyComplete, setVerifyComplete] = useState<BiharSSLSupplyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Report Wise Bifurcation tabs: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<BiharSSLSupplyItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1=Approved, 2=Rejected
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<BiharSSLSupplyItem | null>(null);

  // Lightbox Photo/PDF preview
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await biharAdminService.getViewSslSupplyInspections();

      let pendingList: any[] = [];
      let completeList: any[] = [];
      let allRaw: any[] = [];

      const raw = res?.data ?? res;
      if (Array.isArray(raw?.pending) || Array.isArray(raw?.complete) || Array.isArray(raw?.verified)) {
        pendingList = Array.isArray(raw.pending) ? raw.pending : (Array.isArray(raw.verification) ? raw.verification : []);
        completeList = Array.isArray(raw.complete) ? raw.complete : (Array.isArray(raw.verified) ? raw.verified : []);
        allRaw = [...pendingList, ...completeList];
      } else if (Array.isArray(raw)) {
        allRaw = raw;
      } else if (Array.isArray(raw?.inspections)) {
        allRaw = raw.inspections;
      } else if (Array.isArray(raw?.supply_inspections)) {
        allRaw = raw.supply_inspections;
      } else if (Array.isArray(raw?.data)) {
        allRaw = raw.data;
      }

      const mapItem = (item: any, idx: number): BiharSSLSupplyItem => {
        const rawCode = item.status !== undefined ? Number(item.status) : (item.verify_status_code !== undefined ? Number(item.verify_status_code) : undefined);
        const vStatusStr = String(item.verify_status || item.inspection_status || '').toLowerCase();
        let code = 0;
        if (rawCode === 1 || vStatusStr.includes('approv') || vStatusStr.includes('complete')) {
          code = 1;
        } else if (rawCode === 2 || vStatusStr.includes('reject')) {
          code = 2;
        }

        return {
          id: item.id ?? idx + 1,
          vendor_name: item.vendor_name || item.vendor || item.agency_name || item.vendors?.name || '—',
          state: item.state || 'Bihar',
          district: item.district || item.district_name || '—',
          date: item.date || item.created_at || item.inspection_date || '—',
          no_of_lights: Number(item.no_of_lights || item.lights_count || item.site_count || 0),
          amount: item.amount || item.claim_amount || item.total_amount || '—',
          inspection_remark: item.inspection_remark || item.remarks || item.remark || '—',
          file: item.file || item.invoice || item.pdf_file || item.document || '',
          inspection_status:
            item.inspection_status ||
            (code === 1 ? 'Approved' : code === 2 ? 'Rejected' : 'Pending'),
          verify_status:
            item.verify_status ||
            (code === 1 ? 'Complete' : code === 2 ? 'Rejected' : 'Pending'),
          status_code: code,
          verify_remark: item.verify_remark || item.verify_remarks || item.inst_verify_remarks || '—',
          verified_at: item.verified_at || item.verify_date || '—',
          verified_by: item.verified_by || item.verify_by || 'Admin',
        };
      };

      if (pendingList.length > 0 || completeList.length > 0) {
        setVerifyPending(pendingList.map(mapItem));
        setVerifyComplete(completeList.map(mapItem));
      } else {
        const mapped = allRaw.map(mapItem);
        setVerifyPending(mapped.filter((it) => it.status_code === 0));
        setVerifyComplete(mapped.filter((it) => it.status_code === 1 || it.status_code === 2));
      }
    } catch (err: any) {
      console.error('Failed to load Bihar SSL supply inspections:', err);
      setErrorMsg(err?.message || 'Failed to load supply inspection data from server.');
      setVerifyPending([]);
      setVerifyComplete([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Action Popup (POST /admin/bihar/ssl/installation/supply-inspection-status)
  const handleActionSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedSiteForAction) return;

    if (actionStatus === '2' && !actionRemarks.trim()) {
      setActionError('Remarks are required when rejecting a supply inspection.');
      return;
    }

    setSubmittingAction(true);
    setActionError('');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const res = await biharAdminService.updateSslSupplyInspectionStatus({
        id: selectedSiteForAction.id,
        inspection_id: selectedSiteForAction.id,
        status: statusNum,
        verify_status: statusNum,
        inspection_status: statusNum,
        remarks: actionRemarks.trim() || undefined,
        remark: actionRemarks.trim() || undefined,
        verify_remark: actionRemarks.trim() || undefined,
        verify_remarks: actionRemarks.trim() || undefined,
      });

      if (res && (res.status === false || res.success === false)) {
        const errorDetail =
          res.message ||
          (res.errors
            ? Array.isArray(res.errors)
              ? res.errors.join(', ')
              : Object.values(res.errors).flat().join(', ')
            : 'Status update failed.');
        throw new Error(errorDetail);
      }

      const updatedText = statusNum === 1 ? 'Approved' : statusNum === 2 ? 'Rejected' : 'Pending';
      const updatedItem: BiharSSLSupplyItem = {
        ...selectedSiteForAction,
        status_code: statusNum,
        verify_status: statusNum === 1 ? 'Complete' : updatedText,
        inspection_status: updatedText,
        verify_remark: actionRemarks.trim() || '—',
        verified_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        verified_by: 'Super Admin',
      };

      if (statusNum === 1 || statusNum === 2) {
        setVerifyPending((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyComplete((prev) => [updatedItem, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      } else {
        setVerifyComplete((prev) => prev.filter((s) => s.id !== selectedSiteForAction.id));
        setVerifyPending((prev) => [updatedItem, ...prev.filter((s) => s.id !== selectedSiteForAction.id)]);
      }

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedItem);
      }

      setSuccessMsg(
        `Supply inspection for ${selectedSiteForAction.vendor_name} has been ${updatedText} successfully!`
      );
      setSelectedSiteForAction(null);
      setActionRemarks('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Action submit error:', err);
      setActionError(err?.message || 'Failed to update supply inspection status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter current active tab data
  const currentList = activeTab === 'pending' ? verifyPending : verifyComplete;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((item) => {
      const vName = (item.vendor_name || '').toLowerCase();
      const state = (item.state || '').toLowerCase();
      const dist = (item.district || '').toLowerCase();
      const dt = (item.date || '').toLowerCase();
      const amt = (item.amount || '').toLowerCase();
      const inspRem = (item.inspection_remark || '').toLowerCase();
      const verRem = (item.verify_remark || '').toLowerCase();
      const lights = String(item.no_of_lights || '');
      const idStr = String(item.id);
      return (
        vName.includes(q) ||
        state.includes(q) ||
        dist.includes(q) ||
        dt.includes(q) ||
        amt.includes(q) ||
        inspRem.includes(q) ||
        verRem.includes(q) ||
        lights.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<BiharSSLSupplyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: BiharSSLSupplyItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor Name', accessor: (r: BiharSSLSupplyItem) => r.vendor_name },
      { header: 'State', accessor: (r: BiharSSLSupplyItem) => r.state || 'Bihar' },
      { header: 'District', accessor: (r: BiharSSLSupplyItem) => r.district || '—' },
      { header: 'Inspection Date', accessor: (r: BiharSSLSupplyItem) => r.date },
      { header: 'No of Lights', accessor: (r: BiharSSLSupplyItem) => r.no_of_lights },
      { header: 'Claim / Invoice Amount', accessor: (r: BiharSSLSupplyItem) => r.amount },
      { header: 'Inspection Remark', accessor: (r: BiharSSLSupplyItem) => r.inspection_remark },
      { header: 'File / Invoice', accessor: (r: BiharSSLSupplyItem) => r.file || '—' },
      { header: 'Inspection Status', accessor: (r: BiharSSLSupplyItem) => r.inspection_status },
      { header: 'Verification Status', accessor: (r: BiharSSLSupplyItem) => r.verify_status },
      { header: 'Verification Remarks', accessor: (r: BiharSSLSupplyItem) => r.verify_remark },
      { header: 'Verified Date', accessor: (r: BiharSSLSupplyItem) => r.verified_at || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Bihar_SSL_Supply_Inspection_${activeTab}`;
  const fileTitle = `Bihar SSL Supply Inspection Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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

  // Top KPI calculations (matching Karnataka SWP 5 cards)
  const allItems = useMemo(() => [...verifyPending, ...verifyComplete], [verifyPending, verifyComplete]);
  const totalRequestsCount = allItems.length;
  const totalLightsCount = useMemo(
    () => allItems.reduce((acc, it) => acc + (Number(it.no_of_lights) || 0), 0),
    [allItems]
  );
  const pendingCount = verifyPending.length;
  const approvedCount = useMemo(
    () => verifyComplete.filter((s) => s.status_code === 1).length,
    [verifyComplete]
  );
  const rejectedCount = useMemo(
    () => verifyComplete.filter((s) => s.status_code === 2).length,
    [verifyComplete]
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Exact Karnataka SWP Layout) ── */}
      <PageHead
        title="View Bihar SSL Supply Inspection"
        subtitle="Review vendor proof of installations, inspect geo-tagged module photos, and approve sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: 'View Bihar SSL Supply Inspection' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg
                className="ax-btn__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/vendor-management/bihar/ssl/installation/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
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

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row (Exact Karnataka SWP Layout) ── */}
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
          label="Supply Requests"
          value={loading ? '—' : totalRequestsCount}
          sub={`Pending: ${pendingCount} · Processed: ${approvedCount + rejectedCount}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Total Lights"
          value={loading ? '—' : totalLightsCount.toLocaleString('en-IN')}
          sub="Dispatched luminaires across Bihar"
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
          value={loading ? '—' : pendingCount}
          sub="Awaiting admin QA review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Verified Approved"
          value={loading ? '—' : approvedCount}
          sub="QA verified & approved"
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
          value={loading ? '—' : rejectedCount}
          sub="Requires vendor re-inspection"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
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
            {verifyPending.length}
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
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyComplete.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card (Exact Karnataka SWP Layout) ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending'
                ? 'Bihar SSL Supply Inspection Pending Verification'
                : 'Bihar SSL Supply Inspection Verified List'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} inspection record{filteredList.length === 1 ? '' : 's'} with vendor supply proofs & dispatches
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
                onChange={setSearchQuery}
                placeholder="Search vendor, file, amount, remarks..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportToCSV(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredList, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', width: '100%' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Inspection Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>No. of Lights</th>
                <th className="ax-table__th">Claim / Amount</th>
                <th className="ax-table__th">Inspection Remark</th>
                <th className="ax-table__th">Document / Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Inspection Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="ax-spinner" style={{ width: 18, height: 18 }} />
                      <span>Loading supply inspections from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No inspection records found"
                      message={
                        searchQuery
                          ? 'No inspections match your search criteria. Try clearing the search query.'
                          : 'No supply inspections in this category from server.'
                      }
                      onClear={searchQuery ? () => setSearchQuery('') : undefined}
                      clearLabel="Clear search"
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((r: BiharSSLSupplyItem, idx: number) => {
                  const srNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = r.status_code === 1;
                  const isRejected = r.status_code === 2;
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {r.vendor_name}
                      </td>
                      <td className="ax-table__td">{r.state}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.district}</td>
                      <td className="ax-table__td ax-num">{r.date}</td>
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700, padding: '2px 8px' }}>
                          {r.no_of_lights}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#047857' }}>
                        {r.amount !== '—' && !r.amount.startsWith('₹') ? `₹ ${r.amount}` : r.amount}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.inspection_remark}
                      </td>
                      <td className="ax-table__td">
                        {r.file ? (
                          <button
                            type="button"
                            onClick={() => setLightbox({ url: resolveBiharMediaUrl(r.file), title: `Invoice: ${r.vendor_name}` })}
                            style={{
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#2563eb',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>📎</span>
                            <span>{r.file.split('/').pop() || 'View Document'}</span>
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--pill ${
                            isApproved
                              ? 'ax-badge--success'
                              : isRejected
                              ? 'ax-badge--danger'
                              : 'ax-badge--warning'
                          }`}
                        >
                          <span className="ax-badge__dot" />
                          {r.inspection_status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--pill ${
                            isApproved
                              ? 'ax-badge--success'
                              : isRejected
                              ? 'ax-badge--danger'
                              : 'ax-badge--warning'
                          }`}
                        >
                          <span className="ax-badge__dot" />
                          {r.verify_status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.verify_remark}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(r)}
                            className="ax-btn ax-btn--subtle ax-btn--xs"
                            title="View Full Details"
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600 }}
                          >
                            View
                          </button>

                          {isLocked ? (
                            <button
                              type="button"
                              disabled
                              title={`Inspection ${isApproved ? 'Approved' : 'Rejected'} (Locked)`}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSiteForAction(r);
                                setActionStatus('1');
                                setActionRemarks('');
                                setActionError('');
                              }}
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
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

        {/* ── Left Aligned Pagination in Footer (Exact Karnataka SWP Layout) ── */}
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

      {/* ── Verification Action Modal (Exact Karnataka SWP Style) ── */}
      {selectedSiteForAction && (
        <Modal
          open={Boolean(selectedSiteForAction)}
          onClose={() => {
            if (!submittingAction) setSelectedSiteForAction(null);
          }}
          title="Verify Supply Inspection"
          subtitle={`Vendor: ${selectedSiteForAction.vendor_name} • Date: ${selectedSiteForAction.date}`}
          maxWidth={520}
          footer={
            <>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedSiteForAction(null)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={submittingAction}
                className={`ax-btn ax-btn--sm ${actionStatus === '1' ? 'ax-btn--primary' : 'ax-btn--danger'}`}
                style={{
                  background: actionStatus === '1' ? '#2563eb' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12, marginRight: 6 }} />}
                {actionStatus === '1' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </>
          }
        >
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {actionError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {actionError}
              </div>
            )}

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Vendor Name</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{selectedSiteForAction.vendor_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>State / District</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                    {selectedSiteForAction.state} / {selectedSiteForAction.district}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Lights Count</div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginTop: 2 }}>
                    {selectedSiteForAction.no_of_lights} Luminaires
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Claim / Invoice Amount</div>
                  <div style={{ fontWeight: 700, color: '#047857', marginTop: 2 }}>
                    {selectedSiteForAction.amount}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Verification Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                required
                className="ax-select"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                <option value="1">Approve Supply Inspection</option>
                <option value="2">Reject Supply Inspection</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Verification Remarks {actionStatus === '2' && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={actionStatus === '2' ? 'Reason for rejecting supply inspection (required)...' : 'Enter quality assurance notes...'}
                className="ax-textarea"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ── Inspection Dossier Details Modal ── */}
      {selectedSiteForDetails && (
        <Modal
          open={Boolean(selectedSiteForDetails)}
          onClose={() => setSelectedSiteForDetails(null)}
          title={`Supply Inspection Details: ${selectedSiteForDetails.vendor_name}`}
          subtitle={`Inspection ID: #${selectedSiteForDetails.id} • Date: ${selectedSiteForDetails.date}`}
          maxWidth={720}
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                {selectedSiteForDetails.status_code === 1 || selectedSiteForDetails.status_code === 2 ? (
                  <span
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: selectedSiteForDetails.status_code === 1 ? '#ecfdf5' : '#fef2f2',
                      color: selectedSiteForDetails.status_code === 1 ? '#047857' : '#b91c1c',
                      border: `1px solid ${selectedSiteForDetails.status_code === 1 ? '#a7f3d0' : '#fecaca'}`,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Status: {selectedSiteForDetails.verify_status} (Locked)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const it = selectedSiteForDetails;
                      setSelectedSiteForDetails(null);
                      setSelectedSiteForAction(it);
                      setActionStatus('1');
                      setActionRemarks('');
                      setActionError('');
                    }}
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{ fontWeight: 700 }}
                  >
                    Verify This Inspection
                  </button>
                )}
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedSiteForDetails(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Vendor</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{selectedSiteForDetails.vendor_name}</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Region</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                  {selectedSiteForDetails.state} {selectedSiteForDetails.district ? `(${selectedSiteForDetails.district})` : ''}
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Luminaires Inspected</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                  {selectedSiteForDetails.no_of_lights} Lights
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Claim Amount</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#047857', marginTop: 2 }}>
                  {selectedSiteForDetails.amount}
                </div>
              </div>
            </div>

            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                Vendor Inspection Remarks
              </div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                {selectedSiteForDetails.inspection_remark}
              </div>
            </div>

            {selectedSiteForDetails.file && (
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Inspection Proof Document / Invoice
                  </div>
                  <button
                    type="button"
                    onClick={() => setLightbox({ url: resolveBiharMediaUrl(selectedSiteForDetails.file), title: `Invoice: ${selectedSiteForDetails.vendor_name}` })}
                    style={{
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Open Document Preview ↗
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                  {selectedSiteForDetails.file}
                </div>
              </div>
            )}

            {selectedSiteForDetails.verify_remark && selectedSiteForDetails.verify_remark !== '—' && (
              <div style={{ padding: 14, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  QA Verification Audit Note
                </div>
                <div style={{ fontSize: 13, color: '#92400e' }}>
                  {selectedSiteForDetails.verify_remark}
                </div>
                {selectedSiteForDetails.verified_at && (
                  <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                    Verified on: {selectedSiteForDetails.verified_at}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Document / Image Lightbox ── */}
      {lightbox && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setLightbox(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: 900,
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
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
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{lightbox.title}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                  }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minHeight: 350,
                maxHeight: '78vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightbox.url) ? (
                <iframe
                  src={lightbox.url}
                  title="PDF Preview"
                  style={{ width: '85vw', height: '72vh', border: 'none', borderRadius: 6, background: '#ffffff' }}
                />
              ) : (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 6 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiharSSLInstallationSupplyInspection;
