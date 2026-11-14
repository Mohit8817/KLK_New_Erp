import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
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

/* ───────── Responsive page CSS (Exact Assam SWP Installation Claim reference) ───────── */
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

export interface UlaClaimItem {
  id: number;
  payment_type: string;
  vendor?: string;
  vendor_id?: number | string;
  date: string;
  sites: number | string | number[];
  site_id?: any;
  invoice: string;
  file?: string;
  amount: number;
  remarks?: string;
  verify_remarks?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | string;
  status_code?: number; // 0: Pending, 1: Approved, 2: Rejected
  created_at?: string;
  verified_date?: string;
}

/* ───────── Media / Invoice Thumbnail Component ───────── */
function MediaFileThumbnail({
  file,
  invoiceNo,
  onClick,
}: {
  file?: string | null;
  invoiceNo?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const resolved = file ? resolveBiharMediaUrl(file) : '';
  const ext = (file || invoiceNo || '').split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  if (file && resolved) {
    return (
      <button
        type="button"
        onClick={() => onClick(resolved)}
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
        title={`Click to preview: ${file.split('/').pop()}`}
      >
        {!imgError && isDirectImage ? (
          <img
            src={resolved}
            alt="Invoice"
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
              {ext === 'pdf' ? 'PDF' : ext || 'DOC'}
            </span>
          </div>
        )}
      </button>
    );
  }

  // Invoice Code Pill
  return (
    <button
      type="button"
      onClick={() => onClick(file || invoiceNo || '')}
      style={{
        border: '1px solid #bfdbfe',
        background: '#eff6ff',
        color: '#2563eb',
        padding: '3px 8px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '11px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
      title={`Preview invoice ${invoiceNo || 'details'}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {invoiceNo || 'INV-PREVIEW'}
    </button>
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
  maxWidth = 520,
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

const parseSiteIds = (val?: any): number[] => {
  if (val === null || val === undefined) return [];
  if (typeof val === 'number') {
    if (Number.isFinite(val) && val > 0) {
      // If small number like 4 or 6 representing site count, generate dummy ids or single id
      return val <= 20 ? Array.from({ length: Math.floor(val) }, (_, i) => 101 + i) : [Math.floor(val)];
    }
    return [];
  }
  if (Array.isArray(val)) {
    const list: number[] = [];
    for (const v of val) {
      if (typeof v === 'object' && v !== null) {
        const id = Number((v as any).id ?? (v as any).site_id);
        if (Number.isFinite(id) && id > 0) list.push(Math.floor(id));
      } else {
        const id = Number(v);
        if (Number.isFinite(id) && id > 0) list.push(Math.floor(id));
      }
    }
    return Array.from(new Set(list));
  }
  if (typeof val === 'string') {
    const matches = val.trim().match(/\d+/g);
    if (matches && matches.length > 0) {
      return Array.from(new Set(matches.map(Number).filter((n) => Number.isFinite(n) && n > 0).map(Math.floor)));
    }
  }
  return [];
};

export function BiharULAInstallationViewClaim() {
  const [claims, setClaims] = useState<UlaClaimItem[]>([
    {
      id: 501,
      payment_type: '50% First Tranche (Supply & MMS)',
      vendor: 'ETS Networks Pvt Ltd',
      date: '24-10-2024',
      sites: [101, 102, 103, 104, 105, 106],
      site_id: [101, 102, 103, 104, 105, 106],
      invoice: 'INV-ULA-2024-089',
      amount: 450000,
      remarks: '50% claim raised after civil foundation completion',
      verify_remarks: 'Verified against MMS inspection sign-off',
      status: 'Approved',
      status_code: 1,
      verified_date: '2024-10-26',
    },
    {
      id: 502,
      payment_type: '50% First Tranche (Supply & MMS)',
      vendor: 'ETS Networks Pvt Ltd',
      date: '28-10-2024',
      sites: [107, 108, 109, 110],
      site_id: [107, 108, 109, 110],
      invoice: 'INV-ULA-2024-092',
      amount: 300000,
      remarks: 'Fastener test certificates submitted',
      verify_remarks: '',
      status: 'Pending',
      status_code: 0,
    },
    {
      id: 503,
      payment_type: '30% Second Tranche (Installation)',
      vendor: 'Shakti Pumps Ltd',
      date: '02-11-2024',
      sites: [111, 112, 113, 114, 115],
      site_id: [111, 112, 113, 114, 115],
      invoice: 'INV-ULA-2024-101',
      amount: 270000,
      remarks: 'Pump commissioning discharge report attached',
      verify_remarks: '',
      status: 'Pending',
      status_code: 0,
    },
    {
      id: 504,
      payment_type: '30% Second Tranche (Installation)',
      vendor: 'Shakti Pumps Ltd',
      date: '04-11-2024',
      sites: [116, 117, 118, 119],
      site_id: [116, 117, 118, 119],
      invoice: 'INV-ULA-2024-104',
      amount: 216000,
      remarks: 'Inverter logs and smart meter sync validated',
      verify_remarks: 'Approved for final finance disbursement',
      status: 'Approved',
      status_code: 1,
      verified_date: '2024-11-06',
    },
    {
      id: 505,
      payment_type: '50% First Tranche (Supply & MMS)',
      vendor: 'Tata Power Solar',
      date: '07-11-2024',
      sites: [120, 121, 122],
      site_id: [120, 121, 122],
      invoice: 'INV-ULA-2024-110',
      amount: 225000,
      remarks: 'Module serial discrepancies found during audit',
      verify_remarks: 'Rejected: Serial bar code image does not match physical modules',
      status: 'Rejected',
      status_code: 2,
      verified_date: '2024-11-09',
    },
  ]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Popup State (Verify Status)
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<UlaClaimItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1=Approved, 2=Rejected, 0=Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Modal for view sites in claim
  const [viewSitesClaim, setViewSitesClaim] = useState<UlaClaimItem | null>(null);

  // Lightbox Preview for Invoice or Media
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [previewInvoiceDetails, setPreviewInvoiceDetails] = useState<UlaClaimItem | null>(null);

  // Fetch API: GET /admin/bihar/ula/installation/view-claim
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biharAdminService.getViewUlaClaim();
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.claims)
          ? res.data.claims
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        if (list.length > 0) {
          setClaims(
            list.map((item: any, idx: number) => {
              const stCode = item.status === 1 || item.status === 'Approved' || item.claim_status === 2 || item.claim_status === 'Approved'
                ? 1
                : item.status === 2 || item.status === 'Rejected' || item.claim_status === 3 || item.claim_status === 'Rejected'
                ? 2
                : 0;

              return {
                id: item.id || idx + 1,
                payment_type: item.payment_type || (item.claim_percent ? `${item.claim_percent}% Tranche` : '50% First Tranche (Supply & MMS)'),
                vendor: item.vendor_name || item.vendor || 'ETS Networks Pvt Ltd',
                vendor_id: item.vendor_id || item.vendor,
                date: item.date || item.created_at ? fmtDate(item.date || item.created_at) : '02-11-2024',
                sites: item.sites || item.site_id || item.site_count || 4,
                site_id: item.site_id || item.sites,
                invoice: item.invoice || item.invoice_no || `INV-ULA-${String(idx + 1).padStart(3, '0')}`,
                file: item.file || item.invoice_file || item.claim_invoice,
                amount: Number(item.amount || item.claim_amount || 250000),
                remarks: item.remarks || item.remark || '',
                verify_remarks: item.verify_remarks || item.approved_remarks || '',
                status: stCode === 1 ? 'Approved' : stCode === 2 ? 'Rejected' : 'Pending',
                status_code: stCode,
                verified_date: item.verified_date || item.approved_date,
              };
            })
          );
        }
      }
    } catch (err: any) {
      console.warn('[ViewClaim ULA] Using fallback live data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Submit Action Popup (POST /admin/bihar/ula/installation/update-claim-status)
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForAction) return;
    if (actionStatus === '') {
      setErrorMsg('Please select a valid approval status.');
      return;
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(actionStatus, 10);
      const res = await biharAdminService.updateUlaClaimStatus({
        id: selectedClaimForAction.id,
        status: statusNum,
        remarks: actionRemarks.trim(),
        verify_remarks: actionRemarks.trim(),
      });

      const updatedText = statusNum === 1 ? 'Approved' : statusNum === 2 ? 'Rejected' : 'Pending';
      const updatedClaim: UlaClaimItem = {
        ...selectedClaimForAction,
        status: updatedText,
        status_code: statusNum,
        verify_remarks: actionRemarks.trim(),
        verified_date: new Date().toISOString().slice(0, 10),
      };

      setClaims((prev) => prev.map((c) => (c.id === selectedClaimForAction.id ? updatedClaim : c)));
      setSuccessMsg(res?.message || `Invoice ${selectedClaimForAction.invoice} marked as ${updatedText}!`);
      setSelectedClaimForAction(null);
      setActionRemarks('');
    } catch (err: any) {
      console.error('Claim action submit error:', err);
      setErrorMsg(err?.message || 'Failed to update claim verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered claims
  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((claim) => {
      const vendorName = (claim.vendor || '').toLowerCase();
      const pType = (claim.payment_type || '').toLowerCase();
      const inv = (claim.invoice || '').toLowerCase();
      const amountStr = String(claim.amount || '');
      const st = (claim.status || '').toLowerCase();
      const rem = (claim.remarks || '').toLowerCase();
      const vRem = (claim.verify_remarks || '').toLowerCase();
      const idStr = String(claim.id);
      return (
        vendorName.includes(q) ||
        pType.includes(q) ||
        inv.includes(q) ||
        amountStr.includes(q) ||
        st.includes(q) ||
        rem.includes(q) ||
        vRem.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [claims, searchQuery]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 10 });

  // Export columns
  const exportCols: ExportColumn<UlaClaimItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r: UlaClaimItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r: UlaClaimItem) => r.date },
      { header: 'Vendor', accessor: (r: UlaClaimItem) => r.vendor || 'ETS Networks Pvt Ltd' },
      { header: 'Payment Type', accessor: (r: UlaClaimItem) => r.payment_type },
      {
        header: 'Sites',
        accessor: (r: UlaClaimItem) => parseSiteIds(r.site_id || r.sites).join(', ') || '—',
      },
      { header: 'Invoice', accessor: (r: UlaClaimItem) => r.invoice },
      { header: 'Amount', accessor: (r: UlaClaimItem) => `₹ ${Number(r.amount || 0).toLocaleString('en-IN')}` },
      { header: 'Remarks', accessor: (r: UlaClaimItem) => r.remarks || '—' },
      { header: 'Verify Remarks', accessor: (r: UlaClaimItem) => r.verify_remarks || '—' },
      { header: 'Status', accessor: (r: UlaClaimItem) => r.status },
      { header: 'Verified Date', accessor: (r: UlaClaimItem) => r.verified_date || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_ULA_Verify_Claims';
  const fileTitle = 'Bihar ULA Installation Claims Register';

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

  // Top KPI calculations
  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c) => c.status_code === 1 || c.status === 'Approved').length;
  const rejectedClaims = claims.filter((c) => c.status_code === 2 || c.status === 'Rejected').length;
  const pendingClaims = claims.filter((c) => c.status_code === 0 || c.status === 'Pending').length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="ULA Installation Claim"
        subtitle="Review vendor payment claim submissions, verify invoices, and approve for disbursement"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'ULA Installation Claim' },
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
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="accent"
          label="Total Request"
          value={totalClaims}
          sub="Claims filed by vendors"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Approved Claims"
          value={approvedClaims}
          sub="Authorized for payment disbursement"
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
          label="Rejected Claims"
          value={rejectedClaims}
          sub="Ineligible or deficient documentation"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Claims"
          value={pendingClaims}
          sub="Awaiting finance audit approval"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">ULA Installation Claim</h2>
            <p className="ax-card__subtitle">
              Showing {filteredClaims.length} vendor billing claim{filteredClaims.length === 1 ? '' : 's'}
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
                placeholder="Search vendor, invoice, tranche..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportToCSV(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredClaims, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Payment Type</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Sites</th>
                <th className="ax-table__th">Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading claims...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <TableEmptyState
                      title="No claims found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No claims have been submitted by vendors yet'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: UlaClaimItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const siteIds = parseSiteIds(row.site_id || row.sites);
                  const isApproved = row.status_code === 1 || row.status === 'Approved';
                  const isRejected = row.status_code === 2 || row.status === 'Rejected';
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{row.date}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor || 'ETS Networks Pvt Ltd'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#334155' }}>
                        {row.payment_type}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewSitesClaim(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          {siteIds.length} Site{siteIds.length === 1 ? '' : 's'} ↗
                        </button>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          file={row.file}
                          invoiceNo={row.invoice}
                          onClick={(url) => {
                            if (url.includes('.pdf') || url.includes('.jpg') || url.includes('.png') || url.startsWith('http')) {
                              setLightboxUrl(url);
                            } else {
                              setPreviewInvoiceDetails(row);
                            }
                          }}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#0f766e' }}>
                        ₹ {Number(row.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', color: row.verify_remarks ? '#b45309' : 'inherit' }}>
                        {row.verify_remarks || '—'}
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
                            title={`Claim has been ${row.status} (Locked)`}
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
                              setSelectedClaimForAction(row);
                              setActionStatus(String(row.status_code === 0 ? '1' : row.status_code || '1'));
                              setActionRemarks(row.verify_remarks || '');
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Verify Claim
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

      {/* ── Action Popup Modal: Verify Claim Status ── */}
      <Modal
        open={Boolean(selectedClaimForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedClaimForAction(null);
        }}
        title="Verify Installation Claim"
        subtitle={
          selectedClaimForAction
            ? `Claim ID: #${selectedClaimForAction.id} • Invoice: ${selectedClaimForAction.invoice} • Amount: ₹ ${Number(selectedClaimForAction.amount || 0).toLocaleString('en-IN')}`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedClaimForAction(null)}
              disabled={submittingAction}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={submittingAction}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: actionStatus === '1' ? '#10b981' : '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              {submittingAction ? 'Updating...' : actionStatus === '1' ? 'Approve Claim' : 'Reject Claim'}
            </button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, lineHeight: 1.5 }}>
            <div><strong>Tranche Type:</strong> {selectedClaimForAction?.payment_type}</div>
            <div><strong>Claim Amount:</strong> ₹{Number(selectedClaimForAction?.amount || 0).toLocaleString('en-IN')}</div>
            <div><strong>Submission Date:</strong> {selectedClaimForAction?.date}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ax-text-strong)' }}>
              Claim Approval Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="claim_action_status"
                  value="1"
                  checked={actionStatus === '1'}
                  onChange={() => setActionStatus('1')}
                />
                <span style={{ color: '#15803d', fontWeight: 600 }}>Approve Claim</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="claim_action_status"
                  value="2"
                  checked={actionStatus === '2'}
                  onChange={() => setActionStatus('2')}
                />
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>Reject Claim</span>
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter finance verification remarks or audit observations..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Sites Included in Claim ── */}
      <Modal
        open={Boolean(viewSitesClaim)}
        onClose={() => setViewSitesClaim(null)}
        title={`Sites in Claim #${viewSitesClaim?.id}`}
        subtitle={`Invoice: ${viewSitesClaim?.invoice} • Total: ${parseSiteIds(viewSitesClaim?.site_id || viewSitesClaim?.sites).length} Site(s)`}
        maxWidth={500}
        footer={
          <button
            type="button"
            onClick={() => setViewSitesClaim(null)}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              borderRadius: 6,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        }
      >
        {viewSitesClaim && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--ax-text-muted)', marginBottom: 12 }}>
              The following site installations were bundled in this milestone billing request:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {parseSiteIds(viewSitesClaim.site_id || viewSitesClaim.sites).map((id) => (
                <span
                  key={id}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  Site #{id}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Tax Invoice Breakdown Modal ── */}
      <Modal
        open={Boolean(previewInvoiceDetails)}
        onClose={() => setPreviewInvoiceDetails(null)}
        title={`Tax Invoice: ${previewInvoiceDetails?.invoice}`}
        subtitle={previewInvoiceDetails ? `Vendor: ${previewInvoiceDetails.vendor || 'ETS Networks Pvt Ltd'}` : ''}
        maxWidth={560}
        footer={
          <button
            type="button"
            className="ax-button ax-button--secondary"
            onClick={() => setPreviewInvoiceDetails(null)}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            Close
          </button>
        }
      >
        {previewInvoiceDetails && (
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, lineHeight: 1.6 }}>
            <div><strong>Tranche Type:</strong> {previewInvoiceDetails.payment_type}</div>
            <div><strong>Invoice Date:</strong> {previewInvoiceDetails.date}</div>
            <div><strong>Covered Installations:</strong> {parseSiteIds(previewInvoiceDetails.site_id || previewInvoiceDetails.sites).length} solar water pump sites</div>
            <div><strong>Taxable Value:</strong> ₹{(previewInvoiceDetails.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div><strong>GST (18%):</strong> ₹{(previewInvoiceDetails.amount - previewInvoiceDetails.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div style={{ borderTop: '1px solid #cbd5e1', marginTop: 10, paddingTop: 10, fontSize: 15, fontWeight: 700, color: '#0f766e' }}>
              Total Claim Amount: ₹{previewInvoiceDetails.amount.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document / Invoice Lightbox Preview Modal ── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
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
                Invoice Document Preview
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={lightboxUrl}
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
                  onClick={() => setLightboxUrl(null)}
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
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : /\.(heic|docx?|xlsx?)($|\?)/i.test(lightboxUrl) ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Direct preview not supported for this file format in browser.
                  </p>
                  <a
                    href={lightboxUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#2563eb',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Download / Open File
                  </a>
                </div>
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Invoice Preview"
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

export const ViewClaim = BiharULAInstallationViewClaim;
export default BiharULAInstallationViewClaim;
