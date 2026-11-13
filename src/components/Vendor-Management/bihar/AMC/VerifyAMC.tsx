import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../shell/PageHead';
import { useFocusTrap } from '../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../bihar-services/biharAdminService';

/* ───────── Responsive page CSS (Exact Karnataka SWP / Assam SWP Reference) ───────── */
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

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick, label }: { file?: string | null; onClick: (url: string) => void; label?: string }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveBiharMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isHeic = /\.heic($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file) || !isPdf;

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt={label || 'Thumbnail'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '10px';
              span.style.fontWeight = '700';
              span.style.color = '#2563eb';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export interface SslAmcVerifyItem {
  id: number;
  uid: string;
  state: string;
  phase: string;
  district: string;
  block: string;
  panchayat: string;
  ward_no: string;
  pole_no: string;
  amc_date: string;
  amc_latitude: string;
  amc_longitude: string;
  amc_image_1?: string;
  amc_image_2?: string;
  amc_remark?: string;
  verify_status: 'Approved' | 'Pending' | 'Rejected' | string;
  verify_status_code?: number;
  verify_remarks?: string;
  [key: string]: any;
}

const INITIAL_FALLBACK_ITEMS: SslAmcVerifyItem[] = [];

export function BiharSSLAMCVerrifyAMC() {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [items, setItems] = useState<SslAmcVerifyItem[]>(INITIAL_FALLBACK_ITEMS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Verification Modal
  const [verifyingItem, setVerifyingItem] = useState<SslAmcVerifyItem | null>(null);
  const [verifyStatusCode, setVerifyStatusCode] = useState<'1' | '2'>('1');
  const [verifyRemarks, setVerifyRemarks] = useState<string>('');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);

  // Lightbox Preview
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biharAdminService.getVerifySslAmc();
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.amc_data)
          ? res.data.amc_data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        if (list.length > 0) {
          setItems(
            list.map((item: any, idx: number) => ({
              id: item.id || idx + 1,
              uid: item.uid || `SSL-${item.district || 'PAT'}-${String(idx + 1).padStart(3, '0')}`,
              state: item.state || 'Bihar',
              phase: item.phase || 'Phase 1',
              district: item.district || 'Patna',
              block: item.block || 'Danapur',
              panchayat: item.panchayat || 'Gram Panchayat',
              ward_no: item.ward_no || item.ward || 'Ward No. 01',
              pole_no: item.pole_no || `PL-${idx + 100}`,
              amc_date: item.amc_date || item.created_at || '02-11-2024',
              amc_latitude: item.amc_latitude || '25.5941',
              amc_longitude: item.amc_longitude || '85.1376',
              amc_image_1: item.amc_image_1 || item.image1,
              amc_image_2: item.amc_image_2 || item.image2,
              amc_remark: item.amc_remark || item.remark || '',
              verify_status:
                item.verify_status === 1 || item.verify_status === 'Approved'
                  ? 'Approved'
                  : item.verify_status === 2 || item.verify_status === 'Rejected'
                  ? 'Rejected'
                  : 'Pending',
              verify_status_code:
                item.verify_status === 1 || item.verify_status === 'Approved'
                  ? 1
                  : item.verify_status === 2 || item.verify_status === 'Rejected'
                  ? 2
                  : 0,
              verify_remarks: item.verify_remarks || '',
            }))
          );
        }
      }
    } catch (err: any) {
      console.warn('[VerifyAMC SSL] Fallback live data active:', err);
      // Keep initial items if API unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenVerify = (item: SslAmcVerifyItem) => {
    setVerifyingItem(item);
    setVerifyStatusCode('1');
    setVerifyRemarks('');
    setErrorMsg('');
  };

  const handleSaveVerification = async () => {
    if (!verifyingItem) return;
    setSubmittingVerify(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const code = Number(verifyStatusCode);
      await biharAdminService.verifySslAmcStatus({
        id: verifyingItem.id,
        status: code,
        remarks: verifyRemarks,
      });

      const updatedText = code === 1 ? 'Approved' : 'Rejected';
      setItems((prev) =>
        prev.map((it) =>
          it.id === verifyingItem.id
            ? { ...it, verify_status: updatedText, verify_status_code: code, verify_remarks: verifyRemarks }
            : it
        )
      );
      setSuccessMsg(`SSL Pole #${verifyingItem.pole_no} (${verifyingItem.uid}) marked as ${updatedText} successfully!`);
      setVerifyingItem(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update SSL AMC verification status.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // KPI Calculations
  const totalInspections = items.length;
  const approvedCount = useMemo(() => items.filter((it) => it.verify_status === 'Approved' || it.verify_status_code === 1).length, [items]);
  const rejectedCount = useMemo(() => items.filter((it) => it.verify_status === 'Rejected' || it.verify_status_code === 2).length, [items]);
  const pendingCount = useMemo(() => items.filter((it) => it.verify_status === 'Pending' || it.verify_status_code === 0 || (!it.verify_status_code && it.verify_status !== 'Approved' && it.verify_status !== 'Rejected')).length, [items]);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    let list = items;
    if (statusFilter === 'pending') {
      list = list.filter((it) => it.verify_status === 'Pending' || it.verify_status_code === 0);
    } else if (statusFilter === 'approved') {
      list = list.filter((it) => it.verify_status === 'Approved' || it.verify_status_code === 1);
    } else if (statusFilter === 'rejected') {
      list = list.filter((it) => it.verify_status === 'Rejected' || it.verify_status_code === 2);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((it) =>
      [
        it.uid,
        it.state,
        it.phase,
        it.district,
        it.block,
        it.panchayat,
        it.ward_no,
        it.pole_no,
        it.amc_date,
        it.amc_remark,
        it.verify_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [items, statusFilter, searchQuery]);

  const pagination = usePagination(filteredItems, { initialPageSize: 10 });

  // Export Columns definition
  const exportCols: ExportColumn<SslAmcVerifyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'UID', accessor: (r) => r.uid },
      { header: 'State', accessor: (r) => r.state },
      { header: 'Phase', accessor: (r) => r.phase },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Block', accessor: (r) => r.block },
      { header: 'Panchayat', accessor: (r) => r.panchayat },
      { header: 'Ward No.', accessor: (r) => r.ward_no },
      { header: 'Pole No.', accessor: (r) => r.pole_no },
      { header: 'AMC Date', accessor: (r) => r.amc_date },
      { header: 'Latitude', accessor: (r) => r.amc_latitude },
      { header: 'Longitude', accessor: (r) => r.amc_longitude },
      { header: 'Remark', accessor: (r) => r.amc_remark || '—' },
      { header: 'Verify Status', accessor: (r) => r.verify_status },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_SSL_AMC_Verification';
  const fileTitle = 'Bihar SSL AMC Verification Register';

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

      {/* ── Page Head (Exact Karnataka SWP pattern & specified subtitle) ── */}
      <PageHead
        title="Verify Bihar SSL AMC"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'SSL AMC', href: '/vendor-management/bihar/ssl/amc/dashboard' },
          { label: 'Verify Bihar SSL AMC' },
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

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="accent"
          label="Total Streetlights"
          value={totalInspections}
          sub={`Approved: ${approvedCount} / Pending: ${pendingCount}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Verification"
          value={pendingCount}
          sub="Awaiting QA audit review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Approved AMC"
          value={approvedCount}
          sub="Verified glowing & battery health"
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
          label="Rejected AMC"
          value={rejectedCount}
          sub="Non-compliant or faulty poles"
        />
      </div>

      {/* ── Status Pill Switcher ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            pagination.setPage(1);
          }}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: statusFilter === 'all' ? '#2563eb' : '#f1f5f9',
            color: statusFilter === 'all' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(37,99,235,0.25)' : 'none',
          }}
        >
          All Records ({totalInspections})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('pending');
            pagination.setPage(1);
          }}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: statusFilter === 'pending' ? '#2563eb' : '#f1f5f9',
            color: statusFilter === 'pending' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'pending' ? '0 1px 2px rgba(37,99,235,0.25)' : 'none',
          }}
        >
          Verify Pending ({pendingCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('approved');
            pagination.setPage(1);
          }}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: statusFilter === 'approved' ? '#2563eb' : '#f1f5f9',
            color: statusFilter === 'approved' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'approved' ? '0 1px 2px rgba(37,99,235,0.25)' : 'none',
          }}
        >
          Approved ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('rejected');
            pagination.setPage(1);
          }}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: statusFilter === 'rejected' ? '#2563eb' : '#f1f5f9',
            color: statusFilter === 'rejected' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'rejected' ? '0 1px 2px rgba(37,99,235,0.25)' : 'none',
          }}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Verify Bihar SSL AMC</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredItems.length}</span> of <span className="ax-num">{items.length}</span> inspections
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b> · Pending <b className="ax-num">{pendingCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="ssl_amc_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
                aria-label="Filter by verification status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved ({approvedCount})</option>
                <option value="rejected">Rejected ({rejectedCount})</option>
              </select>

              {(searchQuery.trim() !== '' || statusFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
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
                placeholder="Search pole / UID..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredItems, exportCols)}
                onExportCSV={() => exportToCSV(filteredItems, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredItems, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredItems, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Ward No.</th>
                <th className="ax-table__th">Pole No.</th>
                <th className="ax-table__th">AMC Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>AMC Latitude</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>AMC Longitude</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Luminary Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Battery/Controller Photo</th>
                <th className="ax-table__th">AMC Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={17} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading SSL AMC inspection records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={17} style={centerCell}>
                    <TableEmptyState
                      title="No AMC Records Found"
                      description={
                        searchQuery || statusFilter !== 'all'
                          ? 'Try adjusting your search criteria or status filter'
                          : 'No streetlight AMC inspections currently recorded'
                      }
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: SslAmcVerifyItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.verify_status === 'Approved' || row.verify_status_code === 1;
                  const isRejected = row.verify_status === 'Rejected' || row.verify_status_code === 2;
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0284c7' }}>
                        {row.uid}
                      </td>
                      <td className="ax-table__td">{row.state || 'Bihar'}</td>
                      <td className="ax-table__td">{row.phase || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.district}
                      </td>
                      <td className="ax-table__td">{row.block || '—'}</td>
                      <td className="ax-table__td">{row.panchayat || '—'}</td>
                      <td className="ax-table__td">{row.ward_no || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600 }}>
                        {row.pole_no}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.amc_date)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontSize: 11.5, fontFamily: 'monospace' }}>
                        {row.amc_latitude || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontSize: 11.5, fontFamily: 'monospace' }}>
                        {row.amc_longitude || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.amc_image_1}
                          onClick={(url) => setPreviewImage({ url, title: `Pole #${row.pole_no} (${row.uid}) - Luminary Photo` })}
                          label="Luminary"
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.amc_image_2}
                          onClick={(url) => setPreviewImage({ url, title: `Pole #${row.pole_no} (${row.uid}) - Battery & Controller Photo` })}
                          label="Battery/Controller"
                        />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.amc_remark || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : isRejected ? (
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
                        {isLocked ? (
                          <button
                            type="button"
                            disabled
                            title={`AMC audit has been ${row.verify_status}. Action is locked.`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'not-allowed',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(row)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 12px',
                              borderRadius: 6,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                            }}
                          >
                            Verify AMC
                          </button>
                        )}
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

      {/* ── Verification Action Modal ── */}
      <Modal
        open={Boolean(verifyingItem)}
        onClose={() => setVerifyingItem(null)}
        title="Verify SSL Streetlight AMC"
        subtitle={
          verifyingItem
            ? `Pole #${verifyingItem.pole_no} (${verifyingItem.uid}) · ${verifyingItem.ward_no}, ${verifyingItem.panchayat}, ${verifyingItem.district}`
            : undefined
        }
        maxWidth={640}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => setVerifyingItem(null)}
              disabled={submittingVerify}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleSaveVerification}
              disabled={submittingVerify}
              style={{
                background: verifyStatusCode === '1' ? '#10b981' : '#ef4444',
                borderColor: verifyStatusCode === '1' ? '#10b981' : '#ef4444',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {submittingVerify ? 'Updating...' : verifyStatusCode === '1' ? 'Approve AMC' : 'Reject AMC'}
            </button>
          </>
        }
      >
        {verifyingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pole Overview Card */}
            <div
              style={{
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px 16px',
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>UID / Pole No:</span>{' '}
                <strong style={{ color: 'var(--ax-text-strong)' }}>
                  {verifyingItem.uid} / {verifyingItem.pole_no}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Phase & State:</span>{' '}
                <strong>
                  {verifyingItem.phase} ({verifyingItem.state})
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>Location:</span>{' '}
                <strong>
                  {verifyingItem.ward_no}, {verifyingItem.panchayat}, {verifyingItem.block}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>District:</span>{' '}
                <strong>{verifyingItem.district}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>AMC Visit Date:</span>{' '}
                <strong>{fmtDate(verifyingItem.amc_date)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)' }}>GPS Coordinates:</span>{' '}
                <strong style={{ fontFamily: 'monospace' }}>
                  {verifyingItem.amc_latitude}, {verifyingItem.amc_longitude}
                </strong>
              </div>
              {verifyingItem.amc_remark && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Field Remarks:</span>{' '}
                  <span style={{ fontStyle: 'italic' }}>{verifyingItem.amc_remark}</span>
                </div>
              )}
            </div>

            {/* Photos Preview Row */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', marginBottom: 4 }}>
                  Luminary Night Photo
                </div>
                <MediaFileThumbnail
                  file={verifyingItem.amc_image_1}
                  onClick={(url) => setPreviewImage({ url, title: `Pole #${verifyingItem.pole_no} (${verifyingItem.uid}) - Luminary Photo` })}
                  label="Luminary Photo"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', marginBottom: 4 }}>
                  Battery & Controller Photo
                </div>
                <MediaFileThumbnail
                  file={verifyingItem.amc_image_2}
                  onClick={(url) => setPreviewImage({ url, title: `Pole #${verifyingItem.pole_no} (${verifyingItem.uid}) - Battery Photo` })}
                  label="Battery Photo"
                />
              </div>
            </div>

            {/* Audit Verification Decision */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--ax-text-muted)',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}
              >
                Audit Verification Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: verifyStatusCode === '1' ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc',
                    border: verifyStatusCode === '1' ? '1px solid #10b981' : '1px solid #cbd5e1',
                  }}
                >
                  <input
                    type="radio"
                    name="modal_verify_status"
                    value="1"
                    checked={verifyStatusCode === '1'}
                    onChange={() => setVerifyStatusCode('1')}
                  />
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Approve AMC Visit</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: verifyStatusCode === '2' ? 'rgba(239, 68, 68, 0.1)' : '#f8fafc',
                    border: verifyStatusCode === '2' ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  }}
                >
                  <input
                    type="radio"
                    name="modal_verify_status"
                    value="2"
                    checked={verifyStatusCode === '2'}
                    onChange={() => setVerifyStatusCode('2')}
                  />
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Reject AMC Visit</span>
                </label>
              </div>
            </div>

            {/* QA Audit Remarks */}
            <div>
              <label
                htmlFor="qa_audit_remarks"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--ax-text-muted)',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                QA Audit Remarks
              </label>
              <textarea
                id="qa_audit_remarks"
                rows={3}
                placeholder="Enter streetlight glowing confirmation, lux check, battery voltage, or rejection details..."
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Photo Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.title || 'Photo Preview'}
        maxWidth={720}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={() => setPreviewImage(null)}
          >
            Close Preview
          </button>
        }
      >
        {previewImage && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '68vh',
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// Export both named functions for full backwards compatibility
export const VerifyAMC = BiharSSLAMCVerrifyAMC;
export default BiharSSLAMCVerrifyAMC;
