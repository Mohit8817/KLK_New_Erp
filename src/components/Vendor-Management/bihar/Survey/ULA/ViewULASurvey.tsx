import { useState, useMemo, useRef, useEffect, type ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';
import type { BiharULASurveyItem } from '../../bihar-types';

type Row = BiharULASurveyItem;
type TabType = 'pending' | 'verified';

const DASH = '—';

/* ───────── Responsive page CSS (Exact reference matching Karnataka SWP VerifyDocument) ───────── */
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

/* ── Media File Thumbnail Component ── */
function MediaFileThumbnail({
  file,
  alt = 'Document Preview',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string, title?: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  const fullUrl = resolveBiharMediaUrl(file);
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <button
      type="button"
      onClick={() => onClick(fullUrl, alt)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      title={`Click to preview: ${alt}`}
    >
      {!imgError && (isDirectImage || ext === 'heic') ? (
        <img
          src={fullUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#f1f5f9',
            borderRadius: 4,
            padding: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: 1 }}>
            {ext || 'DOC'}
          </span>
        </div>
      )}
    </button>
  );
}

export function BiharULASurveyViewData() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingList, setPendingList] = useState<Row[]>([]);
  const [verifiedList, setVerifiedList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMsg, setSuccessMsg] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [kpiCounts, setKpiCounts] = useState({
    totalCount: 0,
    completeCount: 0,
    pendingSurveyCount: 0,
    approvedCount: 0,
    pendingVerifyCount: 0,
    rejectedCount: 0,
    feasibleYes: 0,
    feasibleNo: 0,
  });

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Detail Modal
  const [selectedConsumer, setSelectedConsumer] = useState<Row | null>(null);

  // Action Modal
  const [actionItem, setActionItem] = useState<Row | null>(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState<'1' | '2'>('1'); // 1 approve, 2 reject
  const [remarksInput, setRemarksInput] = useState('');

  const loadSurveys = useCallback(() => {
    setLoading(true);
    setErrorMsg('');
    biharAdminService
      .getViewUlaSurveys()
      .then((res: any) => {
        const rawPending = res?.data?.verification || res?.verification || [];
        const rawVerified = res?.data?.verified || res?.verified || [];
        const allSurveys = Array.isArray(res?.data?.surveys)
          ? res.data.surveys
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        const pending = Array.isArray(rawPending) && rawPending.length > 0
          ? rawPending
          : allSurveys.filter((s: any) => !s.verify_status || s.verify_status === 'Pending' || s.verify_status === 0 || s.verify_status === '0');

        const verified = Array.isArray(rawVerified) && rawVerified.length > 0
          ? rawVerified
          : allSurveys.filter((s: any) => s.verify_status === 'Approved' || s.verify_status === 'Rejected' || s.verify_status === 1 || s.verify_status === 2);

        const normalize = (item: any, idx: number): Row => ({
          id: item.id || idx + 1,
          survey_date: item.survey_date || item.created_at || '—',
          vendor_name: item.vendor_name || item.vendor || 'Vendor',
          district: item.district || '—',
          block: item.block || '—',
          panchayat: item.panchayat || '—',
          village: item.village || '—',
          address: item.address || '—',
          consumer_name: item.consumer_name || item.name || `Consumer #${item.id || idx + 1}`,
          gender: item.gender || '—',
          contact_no: item.contact_no || item.phone || '—',
          aadhar_no: item.aadhar_no || item.aadhaar_no || '—',
          ca_number: item.ca_number || item.ca_no || '—',
          smart_meter: item.smart_meter || 'Yes',
          smart_meter_no: item.smart_meter_no || '—',
          meter_functional: item.meter_functional || 'Yes',
          feasible: item.feasible === 'No' || item.feasible === 0 || item.feasible === '0' ? 'No' : 'Yes',
          latitude: item.latitude || '—',
          longitude: item.longitude || '—',
          electricity_bill_photo: resolveBiharMediaUrl(item.electricity_bill_photo || item.bill_photo),
          consent_form_photo: resolveBiharMediaUrl(item.consent_form_photo || item.consent_photo),
          aadhar_card_photo: resolveBiharMediaUrl(item.aadhar_card_photo || item.aadhar_photo),
          remarks: item.remarks || '—',
          status: item.status !== undefined ? String(item.status) : 'Completed',
          verify_status: item.verify_status === 1 || item.verify_status === 'Approved' ? 'Approved' : item.verify_status === 2 || item.verify_status === 'Rejected' ? 'Rejected' : 'Pending',
          verify_remarks: item.verify_remarks || '',
          verify_by: item.verify_by || '',
        });

        const pList = pending.map(normalize);
        const vList = verified.map(normalize);
        const allList = [...pList, ...vList];

        setPendingList(pList);
        setVerifiedList(vList);

        const kpi = res?.data?.kpis || res?.kpis || {};
        const total = kpi.total !== undefined ? Number(kpi.total) : allList.length;
        const comp = kpi.complete !== undefined ? Number(kpi.complete) : allList.length;
        const pend = kpi.pending !== undefined ? Number(kpi.pending) : 0;
        const app = kpi.approved !== undefined ? Number(kpi.approved) : vList.filter((r) => r.verify_status === 'Approved').length;
        const pv = kpi.verify_pending !== undefined ? Number(kpi.verify_pending) : pList.length;
        const rej = kpi.rejected !== undefined ? Number(kpi.rejected) : vList.filter((r) => r.verify_status === 'Rejected').length;
        const fy = kpi.feasible_yes !== undefined ? Number(kpi.feasible_yes) : allList.filter((r) => r.feasible === 'Yes').length;
        const fn = kpi.feasible_no !== undefined ? Number(kpi.feasible_no) : allList.filter((r) => r.feasible === 'No').length;

        setKpiCounts({
          totalCount: total,
          completeCount: comp,
          pendingSurveyCount: pend,
          approvedCount: app,
          pendingVerifyCount: pv,
          rejectedCount: rej,
          feasibleYes: fy,
          feasibleNo: fn,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to load ULA surveys from API:', err);
        setErrorMsg(err?.message || 'Failed to connect to ULA survey verification API.');
        setPendingList([]);
        setVerifiedList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const {
    totalCount,
    completeCount,
    pendingSurveyCount,
    approvedCount,
    pendingVerifyCount,
    rejectedCount,
    feasibleYes,
    feasibleNo,
  } = kpiCounts;

  const activeList = activeTab === 'pending' ? pendingList : verifiedList;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((r) =>
      [
        r.consumer_name,
        r.ca_number,
        r.vendor_name,
        r.district,
        r.block,
        r.panchayat,
        r.village,
        r.contact_no,
        r.aadhar_no,
        r.remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [activeList, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;

    const isApprove = verifyStatusAction === '1';
    setSubmittingAction(true);
    setErrorMsg('');
    try {
      await biharAdminService.verifyUlaSurveyStatus({
        id: actionItem.id,
        verify_status: verifyStatusAction,
        verify_remarks: remarksInput.trim() || undefined,
      });

      const updatedSurvey: Row = {
        ...actionItem,
        verify_status: isApprove ? 'Approved' : 'Rejected',
        verify_remarks: remarksInput.trim(),
        verify_by: 'Super Admin',
      };

      // Optimistically update lists
      setPendingList((prev) => prev.filter((s) => s.id !== actionItem.id));
      setVerifiedList((prev) => [updatedSurvey, ...prev.filter((s) => s.id !== actionItem.id)]);

      // Optimistically update KPI counts
      setKpiCounts((prev) => ({
        ...prev,
        pendingVerifyCount: Math.max(0, prev.pendingVerifyCount - 1),
        approvedCount: isApprove ? prev.approvedCount + 1 : prev.approvedCount,
        rejectedCount: !isApprove ? prev.rejectedCount + 1 : prev.rejectedCount,
      }));

      if (selectedConsumer && selectedConsumer.id === actionItem.id) {
        setSelectedConsumer(updatedSurvey);
      }

      setSuccessMsg(
        `Consumer survey for ${actionItem.consumer_name} (CA: ${actionItem.ca_number}) has been ${isApprove ? 'Approved' : 'Rejected'} successfully!`
      );
      setActionItem(null);
      setRemarksInput('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(`Failed to update verification status: ${err?.message || 'Server error'}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Survey Date', accessor: (r) => r.survey_date },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Block', accessor: (r) => r.block },
      { header: 'Panchayat', accessor: (r) => r.panchayat },
      { header: 'Village', accessor: (r) => r.village },
      { header: 'Address', accessor: (r) => r.address },
      { header: 'Consumer Name', accessor: (r) => r.consumer_name },
      { header: 'Gender', accessor: (r) => r.gender },
      { header: 'Contact No.', accessor: (r) => r.contact_no },
      { header: 'Aadhaar No.', accessor: (r) => r.aadhar_no },
      { header: 'CA No.', accessor: (r) => r.ca_number },
      { header: 'Smart Meter', accessor: (r) => r.smart_meter },
      { header: 'Smart Meter No.', accessor: (r) => r.smart_meter_no },
      { header: 'Meter Functional', accessor: (r) => r.meter_functional },
      { header: 'Feasible', accessor: (r) => r.feasible },
      { header: 'Latitude', accessor: (r) => r.latitude },
      { header: 'Longitude', accessor: (r) => r.longitude },
      { header: 'Remarks', accessor: (r) => r.remarks },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Verify Status', accessor: (r) => r.verify_status },
      ...(activeTab === 'verified'
        ? [
            { header: 'Verify Remarks', accessor: (r: Row) => r.verify_remarks || '—' },
            { header: 'Verify By', accessor: (r: Row) => r.verify_by || '—' },
          ]
        : []),
    ],
    [activeTab]
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_ULA_Survey_${activeTab}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_ULA_Survey_${activeTab}`, filtered, exportCols);
  const handlePdf = () => printTableData(`Verify Bihar ULA Survey - ${activeTab}`, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Bihar ULA Survey"
        subtitle="Validate handover documents, JCR certificates, warranty papers, and signed farmer vouchers"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar ULA', href: '/vendor-management/bihar/ula/survey/view' },
          { label: 'Verify Bihar ULA Survey' },
        ]}
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

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          tone="accent"
          label="Total Surveys"
          value={totalCount}
          sub={`Complete: ${completeCount} | Pending: ${pendingSurveyCount}`}
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
          value={pendingVerifyCount}
          sub="Requires admin scrutiny"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          }
          tone="emerald"
          label="Survey Approved"
          value={approvedCount}
          sub="Dossiers audited & approved"
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
          label="Survey Rejected"
          value={rejectedCount}
          sub="Requires vendor correction"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          }
          tone="cyan"
          label="Feasibility Status"
          value={`${feasibleYes}`}
          sub={`Non-feasible: ${feasibleNo} sites`}
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
            setCurrentPage(1);
          }}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('verified');
            setCurrentPage(1);
          }}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'verified' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Bihar ULA Survey Verification Pending' : 'Bihar ULA Survey Verified Data'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filtered.length} of {activeList.length} consumer survey record{activeList.length === 1 ? '' : 's'} submitted by vendors
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search consumer, CA, vendor, district..."
                size="sm"
                ariaLabel="Search surveys"
              />
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleCsv}
                onExportExcel={handleExcel}
                onExportPDF={handlePdf}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Survey Date</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Address</th>
                <th className="ax-table__th">Consumer Name</th>
                <th className="ax-table__th">Gender</th>
                <th className="ax-table__th">Contact No.</th>
                <th className="ax-table__th">Aadhaar No.</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Smart Meter</th>
                <th className="ax-table__th">Smart Meter No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Meter Functional</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Feasible</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Electricity Bill</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Consent Form</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Aadhaar Card</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'verified' && (
                  <>
                    <th className="ax-table__th">Verify Remarks</th>
                    <th className="ax-table__th">Verify By</th>
                  </>
                )}
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'verified' ? 28 : 26} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Bihar ULA surveys from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'verified' ? 28 : 26} style={centerCell}>
                    <TableEmptyState
                      title="No survey records found"
                      description={search ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                paged.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>
                      <td className="ax-table__td">{r.survey_date}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{r.vendor_name}</td>
                      <td className="ax-table__td">{r.district}</td>
                      <td className="ax-table__td">{r.block}</td>
                      <td className="ax-table__td">{r.panchayat}</td>
                      <td className="ax-table__td">{r.village}</td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.address}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>{r.consumer_name}</td>
                      <td className="ax-table__td">{r.gender}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{r.contact_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{r.aadhar_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {r.ca_number}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${r.smart_meter === 'Yes' ? 'ax-badge--success' : 'ax-badge--neutral'}`}
                          style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {r.smart_meter}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{r.smart_meter_no}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${r.meter_functional === 'Yes' ? 'ax-badge--success' : 'ax-badge--danger'}`}
                          style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {r.meter_functional}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${r.feasible === 'Yes' ? 'ax-badge--success' : 'ax-badge--danger'}`}
                          style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {r.feasible}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.latitude}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.longitude}</td>

                      {/* Photo Thumbnails */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={r.electricity_bill_photo}
                          alt="Electricity Bill Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Electricity Bill Photo' })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={r.consent_form_photo}
                          alt="Consent Form Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Consent Form Photo' })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={r.aadhar_card_photo}
                          alt="Aadhaar Card Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Aadhaar Card Photo' })}
                        />
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.remarks}>
                        {r.remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.verify_status === 'Approved' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : r.verify_status === 'Rejected' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      {activeTab === 'verified' && (
                        <>
                          <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.verify_remarks || '—'}
                          </td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: '#475569' }}>
                            {r.verify_by || '—'}
                          </td>
                        </>
                      )}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedConsumer(r)}
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
                            title="View full consumer survey profile"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {activeTab === 'verified' ? (
                            <button
                              type="button"
                              disabled
                              title={`Survey has been ${r.verify_status} (Locked)`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActionItem(r);
                                setVerifyStatusAction('1');
                                setRemarksInput('');
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#2563eb',
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
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Scrutiny Action Modal ── */}
      <Modal
        open={Boolean(actionItem)}
        onClose={() => {
          if (!submittingAction) setActionItem(null);
        }}
        title="Verify Consumer Survey Dossier"
        subtitle={
          actionItem
            ? `${actionItem.consumer_name} • CA: ${actionItem.ca_number} • ${actionItem.village}, ${actionItem.district}`
            : ''
        }
        maxWidth={540}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setActionItem(null)}
              disabled={submittingAction}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifySubmit}
              disabled={submittingAction}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: verifyStatusAction === '1' ? '#2563eb' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              {verifyStatusAction === '1' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {actionItem && (
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ax-text-strong)' }}>
                Scrutiny Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 14 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${verifyStatusAction === '1' ? '#16a34a' : '#cbd5e1'}`,
                    background: verifyStatusAction === '1' ? '#f0fdf4' : '#ffffff',
                    fontWeight: 600,
                    color: verifyStatusAction === '1' ? '#15803d' : '#475569',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="radio"
                    name="ula_verify_choice"
                    value="1"
                    checked={verifyStatusAction === '1'}
                    onChange={() => setVerifyStatusAction('1')}
                  />
                  Approve Survey
                </label>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${verifyStatusAction === '2' ? '#dc2626' : '#cbd5e1'}`,
                    background: verifyStatusAction === '2' ? '#fef2f2' : '#ffffff',
                    fontWeight: 600,
                    color: verifyStatusAction === '2' ? '#b91c1c' : '#475569',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="radio"
                    name="ula_verify_choice"
                    value="2"
                    checked={verifyStatusAction === '2'}
                    onChange={() => setVerifyStatusAction('2')}
                  />
                  Reject Survey
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="ula_verify_remarks" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
                Verification Remarks {verifyStatusAction === '2' && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <textarea
                id="ula_verify_remarks"
                rows={3}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Enter audit remarks, Aadhaar match confirmation or reasons for rejection..."
                required={verifyStatusAction === '2'}
                className="ax-textarea"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ── Consumer Full Profile Detail Modal ── */}
      <Modal
        open={Boolean(selectedConsumer)}
        onClose={() => setSelectedConsumer(null)}
        title={selectedConsumer ? `Consumer Survey Profile: ${selectedConsumer.consumer_name}` : ''}
        subtitle={
          selectedConsumer
            ? `CA No: ${selectedConsumer.ca_number} • Village: ${selectedConsumer.village}, ${selectedConsumer.block}, ${selectedConsumer.district}`
            : ''
        }
        maxWidth={780}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedConsumer && (
                selectedConsumer.verify_status === 'Approved' || selectedConsumer.verify_status === 'Rejected' ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked ({selectedConsumer.verify_status})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedConsumer;
                      setSelectedConsumer(null);
                      setActionItem(item);
                      setVerifyStatusAction('1');
                      setRemarksInput('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Verify This Survey
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedConsumer(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedConsumer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Top Status & Overview Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>CA Number: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#2563eb' }}>{selectedConsumer.ca_number}</strong>
                <span style={{ marginLeft: 16, fontSize: 12, color: '#64748b' }}>
                  Survey Date: <strong>{selectedConsumer.survey_date}</strong>
                </span>
                <span style={{ marginLeft: 16, fontSize: 12, color: '#64748b' }}>
                  Vendor: <strong>{selectedConsumer.vendor_name}</strong>
                </span>
              </div>
              <div>
                {selectedConsumer.verify_status === 'Approved' ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : selectedConsumer.verify_status === 'Rejected' ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Rejected
                  </span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Uploaded Documents Row with Thumbnails */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Uploaded Verification Documents & Identification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <MediaFileThumbnail
                    file={selectedConsumer.electricity_bill_photo}
                    alt="Electricity Bill Photo"
                    onClick={(url, title) => setLightbox({ url, title: title || 'Electricity Bill Photo' })}
                  />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, display: 'block', color: 'var(--ax-text-strong)' }}>Electricity Bill</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Click to view full image</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <MediaFileThumbnail
                    file={selectedConsumer.consent_form_photo}
                    alt="Consent Form Photo"
                    onClick={(url, title) => setLightbox({ url, title: title || 'Consent Form Photo' })}
                  />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, display: 'block', color: 'var(--ax-text-strong)' }}>Consent Form</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Click to view full image</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <MediaFileThumbnail
                    file={selectedConsumer.aadhar_card_photo}
                    alt="Aadhaar Card Photo"
                    onClick={(url, title) => setLightbox({ url, title: title || 'Aadhaar Card Photo' })}
                  />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, display: 'block', color: 'var(--ax-text-strong)' }}>Aadhaar Card</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Click to view full image</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Details Grids */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Beneficiary Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Beneficiary & Identity
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Consumer Name:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedConsumer.consumer_name}</span>

                  <span style={{ color: '#64748b' }}>Gender:</span>
                  <span>{selectedConsumer.gender}</span>

                  <span style={{ color: '#64748b' }}>Contact No:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedConsumer.contact_no}</span>

                  <span style={{ color: '#64748b' }}>Aadhaar Number:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedConsumer.aadhar_no}</span>

                  <span style={{ color: '#64748b' }}>CA Number:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>{selectedConsumer.ca_number}</span>
                </div>
              </div>

              {/* Technical & Meter Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Smart Meter & Feasibility
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Smart Meter:</span>
                  <span style={{ fontWeight: 600 }}>{selectedConsumer.smart_meter}</span>

                  <span style={{ color: '#64748b' }}>Smart Meter No:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedConsumer.smart_meter_no || '—'}</span>

                  <span style={{ color: '#64748b' }}>Meter Functional:</span>
                  <span style={{ fontWeight: 600, color: selectedConsumer.meter_functional === 'Yes' ? '#16a34a' : '#dc2626' }}>
                    {selectedConsumer.meter_functional}
                  </span>

                  <span style={{ color: '#64748b' }}>Feasibility:</span>
                  <span style={{ fontWeight: 700, color: selectedConsumer.feasible === 'Yes' ? '#16a34a' : '#dc2626' }}>
                    {selectedConsumer.feasible}
                  </span>

                  <span style={{ color: '#64748b' }}>Installation Status:</span>
                  <span>{selectedConsumer.status}</span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Site Location & Geography
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>District / Block</span>
                  <strong>{selectedConsumer.district} / {selectedConsumer.block}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Panchayat / Village</span>
                  <strong>{selectedConsumer.panchayat} / {selectedConsumer.village}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>GPS Coordinates</span>
                  {selectedConsumer.latitude && selectedConsumer.longitude && selectedConsumer.latitude !== '—' ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedConsumer.latitude},${selectedConsumer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {selectedConsumer.latitude}, {selectedConsumer.longitude} ↗
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Full Address</span>
                  <strong>{selectedConsumer.address}</strong>
                </div>
              </div>
            </div>

            {/* Remarks Boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 4 }}>
                  Surveyor Remarks
                </span>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, fontSize: 12, border: '1px solid #e2e8f0', color: '#334155' }}>
                  {selectedConsumer.remarks || 'No surveyor remarks entered.'}
                </div>
              </div>
              {selectedConsumer.verify_remarks && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#047857', display: 'block', marginBottom: 4 }}>
                    Admin Scrutiny Remarks
                  </span>
                  <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: 6, fontSize: 12, border: '1px solid #a7f3d0', color: '#065f46' }}>
                    {selectedConsumer.verify_remarks} — {selectedConsumer.verify_by || 'Admin'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document / Image Lightbox Preview Modal ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                {lightbox.title}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
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
                  Open Original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minWidth: 320,
                minHeight: 240,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightbox.url) ? (
                <iframe
                  src={lightbox.url}
                  title={lightbox.title}
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
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

export const ViewULASurvey = BiharULASurveyViewData;
export default BiharULASurveyViewData;
