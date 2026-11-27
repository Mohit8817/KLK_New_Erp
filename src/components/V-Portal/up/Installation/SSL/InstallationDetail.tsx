import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wInstalledLightItem,
  type UpSsl18wInstallDetailsCount,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

type Row = UpSsl18wInstalledLightItem;

/* ───────── Icons & Constants ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || String(v).trim() === '' ? DASH : String(v));
const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

/* ───────── Status Helpers ───────── */
export const getVerifyStatus = (r: Row): number => {
  const s =
    r.inst_verify_status !== undefined && r.inst_verify_status !== null
      ? Number(r.inst_verify_status)
      : r.verify_status !== undefined && r.verify_status !== null
        ? Number(r.verify_status)
        : 0;
  return Number.isNaN(s) ? 0 : s;
};

export const getClaimStatus = (r: Row): number => {
  const raw: unknown =
    r.inst_claim_status !== undefined && r.inst_claim_status !== null
      ? r.inst_claim_status
      : r.claim_status !== undefined && r.claim_status !== null
        ? r.claim_status
        : 0;

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (s === '2' || s === 'approved' || s === 'claim approved' || s === 'claim-approved') return 2;
    if (s === '3' || s === 'reject' || s === 'rejected' || s === 'claim rejected' || s === 'claim-rejected') return 3;
    if (s === '1' || s === 'claim applicable' || s === 'claim-applicable' || s === 'applicable') return 1;
    if (s === '0' || s === 'not applicable' || s === 'not-applicable' || s === 'not_applicable' || s === 'na' || s === 'n/a') return 0;
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
};

export const getClaimStatusInfo = (r: Row): { status: number; label: string; tone: Tone } => {
  const c = getClaimStatus(r);
  if (c === 2) return { status: 2, label: 'Approved', tone: 'success' };
  if (c === 3) return { status: 3, label: 'Reject', tone: 'danger' };
  if (c === 1) return { status: 1, label: 'Claim Applicable', tone: 'info' };
  return { status: 0, label: 'Not Applicable', tone: 'neutral' };
};

export const getClaimStatusText = (r: Row): string => {
  return getClaimStatusInfo(r).label;
};

const getPayStatus = (r: Row): number => {
  const s =
    r.inst_pay_status !== undefined && r.inst_pay_status !== null
      ? Number(r.inst_pay_status)
      : r.payment_status !== undefined && r.payment_status !== null
        ? Number(r.payment_status)
        : 0;
  return Number.isNaN(s) ? 0 : s;
};

const isVerified = (r: Row) => getVerifyStatus(r) === 1;
const isVerifyRejected = (r: Row) => getVerifyStatus(r) === 2;
const isLocked = (r: Row) => isVerified(r);
const isLightClaimRaised = (r: Row) => {
  const st = getClaimStatus(r);
  return st === 1 || st === 2;
};
const isLightClaimDue = (r: Row) => {
  const st = getClaimStatus(r);
  return st === 1;
};

const getPaymentStatusInfo = (r: Row): { label: string; tone: Tone } => {
  const payStatus = getPayStatus(r);
  const claimStatus = getClaimStatus(r);
  if (payStatus === 1) return { label: 'Paid', tone: 'success' };
  if (payStatus === 2) return { label: 'Partially Paid', tone: 'warning' };
  if (claimStatus === 2) return { label: 'Pending', tone: 'warning' };
  return { label: 'Not Applicable', tone: 'neutral' };
};

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
    : value === 2 ? <Badge tone="danger">Rejected</Badge>
      : <Badge tone="warning">Pending</Badge>;

const PaymentBadge = ({ row }: { row: Row }) => {
  const info = getPaymentStatusInfo(row);
  return <Badge tone={info.tone}>{info.label}</Badge>;
};

const ClaimBadge = ({ row }: { row: Row }) => {
  const info = getClaimStatusInfo(row);
  return (
    <Badge tone={info.tone}>
      {info.status === 2 ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{info.label}</span>
        </span>
      ) : (
        <span>{info.label}</span>
      )}
    </Badge>
  );
};

/* ───────── Duration / Aging Helpers (Goa SRT exact pattern) ───────── */
function parseDateMs(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  if (!s || s === '0000-00-00' || s === '0000-00-00 00:00:00') return null;

  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    if (!Number.isNaN(t)) return t;
  }

  const isoStr = s.replace(' ', 'T');
  const t = new Date(isoStr).getTime();
  if (!Number.isNaN(t)) return t;
  return null;
}

function computeDurationDays(startStr?: string | null, endStr?: string | null): number | null {
  const startMs = parseDateMs(startStr);
  if (startMs === null) return null;
  const endMs = endStr ? parseDateMs(endStr) : Date.now();
  if (endMs === null) return null;
  return Math.max(0, Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

function formatDurationLabel(days: number | null): string {
  if (days === null) return DASH;
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day';
  return `${days} Days`;
}

function getLightDuration(row: Row): { days: number | null; label: string } {
  const installDate = row.inst_date || row.installation_date || row.created_at;
  const claimDate = row.inst_claim_date || undefined;
  const days = claimDate && installDate
    ? computeDurationDays(installDate, claimDate)
    : installDate
      ? computeDurationDays(installDate)
      : null;
  return { days, label: formatDurationLabel(days) };
}

/* ───────── Modal (Goa SRT exact dialog: portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  children: ReactNode;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal (Goa SRT exact pattern) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="up-ssl-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="up-ssl-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Preview'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            style={{
              display: status === 'ready' ? 'block' : 'none',
              margin: 'auto',
              borderRadius: 0,
              ...(zoom === 1
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Installation Thumbnail: Strict NO BORDER RADIUS (Goa SRT exact pattern) ───────── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const resolvedUrl = useMemo(() => (src ? resolveUpMediaUrl(src) : ''), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed || !resolvedUrl) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      style={{
        width: 34,
        height: 34,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(resolvedUrl, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Overlay CSS (Goa SRT exact styles) ───────── */
const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Page CSS (Goa SRT exact styles) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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

  .solar-erp-page .ssl-kpi-row-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
    margin-top: 4px;
    width: 100%;
  }
  .solar-erp-page .ssl-kpi-row-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
    width: 100%;
  }
  @media (max-width: 900px) {
    .solar-erp-page .ssl-kpi-row-3,
    .solar-erp-page .ssl-kpi-row-2 {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .srt-kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
    margin-top: 4px;
  }
  @media (max-width: 1360px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (max-width: 960px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 420px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: 1fr; }
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── Tabs (one page, two datasets; URL hash: #Completed / #Payment) ───────── */
type TabKey = 'completed' | 'payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'completed', label: 'Completed SSL Data', hash: '#Completed' },
  { key: 'payment', label: 'Payment SSL Data', hash: '#Payment' },
];

const COMMON_HEADERS = [
  'Sr. No.', 'UID', 'State', 'Phase', 'District', 'Block', 'Panchayat', 'Ward No.', 'Pole No.',
  'Beneficiary Name', 'Contact', 'Install Date', 'Duration / Aging',
  'UUID No.', 'Light No.', 'Battery No.', 'Panel No.',
  'Light Image', 'Latitude', 'Longitude', 'Remark',
];

/* ───────── Compact KPI Card (Goa SRT exact pattern) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'danger';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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
  sub?: string;
}) {
  const t = TONE[tone];

  return (
    <div
      className="ax-card"
      style={{
        padding: '12px 14px',
        borderRadius: 10,
        minWidth: 0,
        cursor: 'default',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface, #ffffff)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={label}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 2, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ax-text-muted)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={sub}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Main Component
 * ========================================================================= */
export function UP_Installation_SSL_InstallationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'payment' : 'completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [counts, setCounts] = useState<UpSsl18wInstallDetailsCount>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_submit: 0,
    claim_not_applicable: 0,
    claim_verify_approved: 0,
    claim_verify_pending: 0,
    claim_verify_reject: 0,
    payment_complete: 0,
    payment_pending: 0,
  });

  const [completedSites, setCompletedSites] = useState<Row[]>([]);
  const [paymentSites, setPaymentSites] = useState<Row[]>([]);

  const [search, setSearch] = useState(() => searchParams.get('district') || searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [claimFilter, setClaimFilter] = useState<
    'all' | 'not_applicable' | 'applicable' | 'approved' | 'reject' | 'due' | 'raised' | 'pending'
  >('all');

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // View Detail Modal
  const [detailModalItem, setDetailModalItem] = useState<Row | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getSsl18wInstalledLights();
      setCounts(res.install_details);
      setCompletedSites(res.completed_sites || []);
      setPaymentSites(res.payment_sites || []);
    } catch (err: any) {
      console.error('[UP SSL 18W InstallationDetail] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeItems = tab === 'completed' ? completedSites : paymentSites;
  const isCompleted = tab === 'completed';

  // Available districts for dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach((r) => {
      const d = r.district?.trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [activeItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let list = activeItems;

    if (districtFilter !== 'all') {
      list = list.filter((s) => (s.district || '').trim().toLowerCase() === districtFilter.toLowerCase());
    }

    if (isCompleted) {
      if (statusFilter === 'approved') list = list.filter((s) => isVerified(s));
      else if (statusFilter === 'rejected') list = list.filter((s) => isVerifyRejected(s));
      else if (statusFilter === 'pending') list = list.filter((s) => !isVerified(s) && !isVerifyRejected(s));

      if (claimFilter === 'applicable' || claimFilter === 'due' || (claimFilter as any) === '1') {
        list = list.filter((s) => getClaimStatus(s) === 1);
      } else if (claimFilter === 'approved' || (claimFilter as any) === '2') {
        list = list.filter((s) => getClaimStatus(s) === 2);
      } else if (claimFilter === 'reject' || (claimFilter as any) === '3') {
        list = list.filter((s) => getClaimStatus(s) === 3);
      } else if (claimFilter === 'not_applicable' || claimFilter === 'pending' || (claimFilter as any) === '0') {
        list = list.filter((s) => getClaimStatus(s) === 0);
      } else if (claimFilter === 'raised') {
        list = list.filter((s) => isLightClaimRaised(s));
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const hay = [
          item.uid, item.id, item.wo_no, item.phase, item.beneficiary_name, item.beneficiary_contact,
          item.district, item.block, item.panchayat, item.village, item.ward_no, item.pole_no,
          item.light_no, item.uuid_no, item.panel_no, item.battery_serial_no,
          item.inst_date, item.installation_date, item.inst_remarks, item.remark,
        ];
        return hay.some((v) => String(v ?? '').toLowerCase().includes(q));
      });
    }
    return list;
  }, [activeItems, districtFilter, isCompleted, statusFilter, claimFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredItems, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, districtFilter, statusFilter, claimFilter, tab]);

  const hasFilters =
    search.trim() !== '' ||
    districtFilter !== 'all' ||
    (isCompleted && (statusFilter !== 'all' || claimFilter !== 'all'));

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setClaimFilter('all');
    setPage(1);
  };

  /* ───────── Export Columns (Goa SRT pattern) ───────── */
  const exportCols: ExportColumn<Row>[] = useMemo<ExportColumn<Row>[]>(() => [
    { header: 'Sr. No.', accessor: (_r: Row, idx?: number) => (idx !== undefined ? idx + 1 : '') },
    { header: 'UID', accessor: (r: Row) => r.uid || `UP-SSL-${r.id}` },
    { header: 'State', accessor: (r: Row) => (r.state ? r.state.toUpperCase() : 'UP') },
    { header: 'Phase', accessor: (r: Row) => r.phase || '' },
    { header: 'District', accessor: (r: Row) => r.district || '' },
    { header: 'Block', accessor: (r: Row) => r.block || '' },
    { header: 'Panchayat', accessor: (r: Row) => r.panchayat || '' },
    { header: 'Ward No.', accessor: (r: Row) => r.ward_no || '' },
    { header: 'Pole No.', accessor: (r: Row) => r.pole_no || '' },
    { header: 'Beneficiary Name', accessor: (r: Row) => r.beneficiary_name || '' },
    { header: 'Contact', accessor: (r: Row) => r.beneficiary_contact || '' },
    { header: 'Install Date', accessor: (r: Row) => (r.inst_date || r.installation_date || '').slice(0, 10) },
    { header: 'Duration / Aging', accessor: (r: Row) => getLightDuration(r).label },
    { header: 'UUID No.', accessor: (r: Row) => r.uuid_no || '' },
    { header: 'Light No.', accessor: (r: Row) => r.light_no || '' },
    { header: 'Battery No.', accessor: (r: Row) => r.battery_serial_no || '' },
    { header: 'Panel No.', accessor: (r: Row) => r.panel_no || '' },
    { header: 'Light Image', accessor: (r: Row) => (r.light_file ? 'Uploaded' : '') },
    { header: 'Latitude', accessor: (r: Row) => r.latitude || '' },
    { header: 'Longitude', accessor: (r: Row) => r.longitude || '' },
    { header: 'Remark', accessor: (r: Row) => r.remark || r.inst_remarks || '' },
    { header: 'Verify Status', accessor: (r: Row) => (isVerified(r) ? 'Approved' : isVerifyRejected(r) ? 'Rejected' : 'Pending') },
    { header: 'Verify Remarks', accessor: (r: Row) => r.inst_verify_remarks || '' },
    { header: 'Claim Status', accessor: (r: Row) => getClaimStatusText(r) },
    { header: 'Payment Status', accessor: (r: Row) => getPaymentStatusInfo(r).label },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'UP_SSL_18W_Completed' : 'UP_SSL_18W_Payment';
  const fileTitle = isCompleted ? 'UP SSL 18W Completed Data' : 'UP SSL 18W Payment Data';

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
      columns.map((c) => escapeExportValue(c.header)),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => escapeExportValue(c.header)).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
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

  /* ───────── Edit Navigation Handlers (Redirect to Install Light page) ───────── */
  const getInstallLightUrl = useCallback((id: number | string, uid?: string) => {
    let basePath = '/v/up/ssl-install-18w-light';
    if (location.pathname.startsWith('/up/installation/')) {
      basePath = '/up/installation/ssl/install-light';
    } else if (location.pathname.startsWith('/up/')) {
      basePath = '/up/ssl-install-18w-light';
    }
    const params = new URLSearchParams();
    params.set('id', String(id));
    if (uid) params.set('uid', uid);
    params.set('edit', 'true');
    return `${basePath}?${params.toString()}`;
  }, [location.pathname]);

  const handleNavigateToEdit = useCallback((id: number | string, uid?: string) => {
    navigate(getInstallLightUrl(id, uid));
  }, [navigate, getInstallLightUrl]);

  const headers = [...COMMON_HEADERS, 'Verify Status', 'Claim Status', 'Payment Status', 'Action'];
  const TOTAL_COLUMNS = headers.length;
  const claimRaisedCount = counts.claim_raised ?? counts.claim_submit ?? 0;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Goa SRT exact pattern) ── */}
      <PageHead
        title="UP SSL 18W Installation Detail"
        subtitle="Master register of completed 18W solar street light installations, payment lights, verification evidence, and claim tracking"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W', href: '/v/up/ssl-18w-installation-dashboard' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── 5 Grouped KPI Cards (Row 1: 3 cards, Row 2: 2 cards spanning full width) ── */}
      <div className="ssl-kpi-row-3">
        {/* 1. Lights (Total / Installed / Pending) */}
        <KpiCard
          tone="accent"
          label="Lights"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ color: '#2563eb', cursor: 'pointer' }}
                  title="Total: Click to view all lights"
                  onClick={() => resetFilters()}
                >
                  {num(counts.total)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#16a34a', cursor: 'pointer' }}
                  title="Installed: Click to view installed lights"
                  onClick={() => { setTab('completed'); setStatusFilter('all'); }}
                >
                  {num(counts.complete)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#d97706', cursor: 'pointer' }}
                  title="Pending: Click to view pending lights"
                  onClick={() => { setTab('completed'); setStatusFilter('pending'); }}
                >
                  {num(counts.pending)}
                </span>
              </span>
            )
          }
          sub="Total / Installed / Pending"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
          }
        />

        {/* 2. Verification Status (Approved / Pending / Rejected) */}
        <KpiCard
          tone="cyan"
          label="Verification Status"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ color: '#16a34a', cursor: 'pointer' }}
                  title="Approved: Click to filter approved"
                  onClick={() => { setTab('completed'); setStatusFilter('approved'); }}
                >
                  {num(counts.verify_approved)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#d97706', cursor: 'pointer' }}
                  title="Pending: Click to filter pending verification"
                  onClick={() => { setTab('completed'); setStatusFilter('pending'); }}
                >
                  {num(counts.verify_pending)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#dc2626', cursor: 'pointer' }}
                  title="Rejected: Click to filter rejected verification"
                  onClick={() => { setTab('completed'); setStatusFilter('rejected'); }}
                >
                  {num(counts.verify_reject)}
                </span>
              </span>
            )
          }
          sub="Approved / Pending / Rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />

        {/* 3. Claim Status (Applicable / Submit / Not Applicable) */}
        <KpiCard
          tone="violet"
          label="Claim Status"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ color: '#0891b2', cursor: 'pointer' }}
                  title="Applicable: Click to filter claim applicable"
                  onClick={() => { setTab('completed'); setClaimFilter('applicable'); }}
                >
                  {num(counts.claim_applicable)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#7c3aed', cursor: 'pointer' }}
                  title="Submit: Click to filter claim submitted"
                  onClick={() => { setTab('completed'); setClaimFilter('raised'); }}
                >
                  {num(claimRaisedCount)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#64748b', cursor: 'pointer' }}
                  title="Not Applicable: Click to filter claim not applicable"
                  onClick={() => { setTab('completed'); setClaimFilter('not_applicable'); }}
                >
                  {num(counts.claim_not_applicable)}
                </span>
              </span>
            )
          }
          sub="Applicable / Submit / Not Applicable"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      <div className="ssl-kpi-row-2">
        {/* 4. Claim Verify Status (Approved / Pending / Rejected) */}
        <KpiCard
          tone="emerald"
          label="Claim Verify Status"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ color: '#16a34a', cursor: 'pointer' }}
                  title="Approved: Click to filter claim approved"
                  onClick={() => { setTab('completed'); setClaimFilter('approved'); }}
                >
                  {num(counts.claim_verify_approved)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#d97706', cursor: 'pointer' }}
                  title="Pending: Click to filter claim verify pending"
                  onClick={() => { setTab('completed'); setClaimFilter('pending'); }}
                >
                  {num(counts.claim_verify_pending)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#dc2626', cursor: 'pointer' }}
                  title="Rejected: Click to filter claim rejected"
                  onClick={() => { setTab('completed'); setClaimFilter('reject'); }}
                >
                  {num(counts.claim_verify_reject)}
                </span>
              </span>
            )
          }
          sub="Approved / Pending / Rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />

        {/* 5. Payment Status (Complete / Pending) */}
        <KpiCard
          tone="amber"
          label="Payment Status"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ color: '#16a34a', cursor: 'pointer' }}
                  title="Complete: Click to view payment data"
                  onClick={() => setTab('payment')}
                >
                  {num(counts.payment_complete)}
                </span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>/</span>
                <span
                  style={{ color: '#d97706', cursor: 'pointer' }}
                  title="Pending: Click to view payment pending"
                  onClick={() => setTab('payment')}
                >
                  {num(counts.payment_pending)}
                </span>
              </span>
            )
          }
          sub="Complete / Pending"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 6v2m0 8v2" />
            </svg>
          }
        />
      </div>

      {/* ── Tabs ABOVE Table (Goa SRT exact pattern) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installed UP SSL tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = t.key === 'completed' ? completedSites.length : paymentSites.length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`up-ssl-tab-${t.key}`}
                aria-selected={active}
                aria-controls="up-ssl-tabpanel"
                className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => setTab(t.key)}
              >
                <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Table Card (Goa SRT exact pattern) ── */}
      <section className="ax-card ax-col--12" id="up-ssl-tabpanel" role="tabpanel" aria-labelledby={`up-ssl-tab-${tab}`}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{isCompleted ? 'Completed SSL Data' : 'Payment SSL Data'}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredItems.length}</span> of <span className="ax-num">{activeItems.length}</span> installations
              {isCompleted ? (
                <>
                  {' '}· Completed <b className="ax-num">{counts.complete}</b> / {counts.total} · Approved <b className="ax-num">{counts.verify_approved}</b> · Pending Verify <b className="ax-num">{counts.verify_pending}</b> · Claims Raised <b className="ax-num">{claimRaisedCount}</b> / {counts.claim_applicable} · Rejected <b className="ax-num">{counts.verify_reject}</b>
                </>
              ) : (
                <>
                  {' '}· Payment Complete <b className="ax-num">{counts.payment_complete}</b> · Payment Pending <b className="ax-num">{counts.payment_pending}</b>
                </>
              )}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="up_ssl_district_filter"
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
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {isCompleted && (
                <>
                  <select
                    id="up_ssl_status_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by verify status"
                  >
                    <option value="all">All Verification</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    id="up_ssl_claim_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={claimFilter}
                    onChange={(e) => {
                      setClaimFilter(e.target.value as any);
                      setPage(1);
                    }}
                    aria-label="Filter by claim status"
                  >
                    <option value="all">All Claim Status</option>
                    <option value="not_applicable">Not Applicable (0)</option>
                    <option value="applicable">Claim Applicable (1)</option>
                    <option value="approved">Approved (2)</option>
                    <option value="reject">Reject (3)</option>
                  </select>
                </>
              )}

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
                placeholder="Search UID, name, light no…"
                size="sm"
                ariaLabel="Search installed lights"
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

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: 2650 }}
          >
            <caption className="ax-visually-hidden">{isCompleted ? 'Completed SSL Data' : 'Payment SSL Data'}</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' ? { textAlign: 'center' } : undefined}
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records…
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed installation records found' : 'No payment records found'}
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : isCompleted
                            ? 'Completed solar street lights will appear here once installation work is recorded.'
                            : 'Payment lights will appear here once payments are processed.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = String(row.latitude ?? '').trim();
                  const lng = String(row.longitude ?? '').trim();
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const verifyVal = getVerifyStatus(row);
                  const claimRaised = isLightClaimRaised(row);
                  const claimDue = isLightClaimDue(row);
                  const locked = isLocked(row);
                  const lightDuration = getLightDuration(row);
                  const installDateStr = row.inst_date || row.installation_date || row.created_at;
                  const fmtInstallDate = installDateStr ? String(installDateStr).slice(0, 10) : DASH;
                  const uidLabel = row.uid || `UP-SSL-${row.id}`;

                  return (
                    <tr
                      key={row.id ?? index}
                      className="ax-table__row"
                      style={isCompleted && claimDue ? { background: 'rgba(245, 158, 11, 0.04)' } : undefined}
                    >
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={monoCell}>
                        <span
                          style={{ fontWeight: 700, color: 'var(--ax-accent, #2563eb)', cursor: 'pointer' }}
                          onClick={() => setDetailModalItem(row)}
                          title="Click to view full light details"
                        >
                          {uidLabel}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>{row.state || 'UP'}</td>
                      <td className="ax-table__td">{txt(row.phase)}</td>
                      <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                      <td className="ax-table__td">{txt(row.block)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>{txt(row.panchayat)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.ward_no)}</td>
                      <td className="ax-table__td" style={monoCell}><b>{txt(row.pole_no)}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.beneficiary_name)}</span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.beneficiary_contact)}</td>

                      {/* Install Date */}
                      <td className="ax-table__td" style={monoCell}>{fmtInstallDate}</td>

                      {/* Duration / Aging (Goa SRT exact pattern) */}
                      <td className="ax-table__td">
                        {claimDue ? (
                          <span
                            className="ax-badge ax-badge--soft ax-badge--warning"
                            style={{
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              fontSize: 11,
                              border: '1px solid #fde68a',
                            }}
                            title={`Installation completed ${lightDuration.label} ago. Approved by admin and ready for claim.`}
                          >
                            <span style={{ fontSize: 12 }}>⚡</span>
                            <span>{lightDuration.label} elapsed</span>
                          </span>
                        ) : claimRaised ? (
                          <span
                            style={{ color: 'var(--ax-text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title={`Claim raised. Installation duration: ${lightDuration.label}`}
                          >
                            <span>⏱</span>
                            <span>{lightDuration.label}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>
                            {lightDuration.label !== DASH ? `${lightDuration.label} elapsed` : DASH}
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td" style={monoCell}>{txt(row.uuid_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.light_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.battery_serial_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.panel_no)}</td>

                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.light_file}
                          alt={`${uidLabel} - Installed Light Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
                            title="Open in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {txt(row.remark || row.inst_remarks)}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                          <VerifyBadge value={verifyVal} />
                          {row.inst_verify_remarks && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: verifyVal === 2 ? 'var(--ax-danger, #dc2626)' : 'var(--ax-text-muted)',
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={row.inst_verify_remarks}
                            >
                              {row.inst_verify_remarks}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Claim Status (status only — claims are raised from Claim Request page) */}
                      <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                        <ClaimBadge row={row} />
                      </td>

                      {/* Payment Status (Not Applicable until claim approved / paid) */}
                      <td className="ax-table__td">
                        <PaymentBadge row={row} />
                      </td>

                      {/* Action: View + Locked/Edit (Goa SRT exact Locked/Edit button style) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm ula-action-btn"
                            onClick={() => setDetailModalItem(row)}
                            title="View full light details"
                            style={{ padding: '0 8px' }}
                          >
                            View
                          </button>

                          {isCompleted && (
                            locked ? (
                              <span
                                className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  opacity: 0.6,
                                  cursor: 'not-allowed',
                                  pointerEvents: 'none',
                                  textDecoration: 'none',
                                }}
                                title="Approved — editing is locked"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Locked</span>
                              </span>
                            ) : (
                              <Link
                                to={getInstallLightUrl(row.id, row.uid)}
                                className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
                                title="Edit Installation Details on Install Light page"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>Edit</span>
                              </Link>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (Goa SRT exact pattern) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200, 300]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Lightbox ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── View Light Detail Modal ── */}
      {detailModalItem && (
        <Modal
          open={true}
          onClose={() => setDetailModalItem(null)}
          labelledBy="ssl-view-detail-title"
          dialogStyle={{ maxWidth: 680, width: '100%' }}
        >
          <div className="ax-modal__header">
            <div>
              <h2 className="ax-modal__title" id="ssl-view-detail-title" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                Installation Detail: {detailModalItem.uid || `UP-SSL-${detailModalItem.id}`}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                {txt(detailModalItem.district)}, {(detailModalItem.state || 'UP').toUpperCase()} · WO No: {txt(detailModalItem.wo_no)}
              </p>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setDetailModalItem(null)} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 20, maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>UID:</span> <b>{txt(detailModalItem.uid)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Installation Date:</span> <b>{txt(detailModalItem.installation_date || detailModalItem.inst_date)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{(detailModalItem.state || 'UP').toUpperCase()}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Phase / Volume:</span> <b>{txt(detailModalItem.phase)} / {txt(detailModalItem.volume)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(detailModalItem.district)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Block:</span> <b>{txt(detailModalItem.block)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Panchayat / Village:</span> <b>{txt(detailModalItem.panchayat)}{detailModalItem.village ? ` (${detailModalItem.village})` : ''}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Ward / Pole No.:</span> <b>{txt(detailModalItem.ward_no)} / {txt(detailModalItem.pole_no)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary:</span> <b>{txt(detailModalItem.beneficiary_name)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact:</span> <b>{txt(detailModalItem.beneficiary_contact)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>UUID No.:</span> <b>{txt(detailModalItem.uuid_no)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Light No.:</span> <b>{txt(detailModalItem.light_no)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Panel No.:</span> <b>{txt(detailModalItem.panel_no)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Battery No.:</span> <b>{txt(detailModalItem.battery_serial_no)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{txt(detailModalItem.latitude)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{txt(detailModalItem.longitude)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Status:</span> <VerifyBadge value={getVerifyStatus(detailModalItem)} /></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Date:</span> <b>{txt(detailModalItem.inst_verify_date)}</b></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Claim Status:</span> <ClaimBadge row={detailModalItem} /></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Status:</span> <PaymentBadge row={detailModalItem} /></div>
              {detailModalItem.inst_verify_remarks && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Verify Remarks:</span>{' '}
                  <b style={{ color: isVerifyRejected(detailModalItem) ? 'var(--ax-danger, #dc2626)' : undefined }}>
                    {detailModalItem.inst_verify_remarks}
                  </b>
                </div>
              )}
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remark:</span> <b>{txt(detailModalItem.remark || detailModalItem.inst_remarks)}</b></div>
            </div>

            {detailModalItem.light_file && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>
                  Installation Photograph:
                </span>
                <img
                  src={resolveUpMediaUrl(detailModalItem.light_file)}
                  alt="Installation evidence"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 0, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                  onClick={() => openPreview(resolveUpMediaUrl(detailModalItem.light_file), 'Installation Photograph')}
                />
              </div>
            )}
          </div>

          <div className="ax-modal__footer" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {!isLocked(detailModalItem) && (
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => {
                    const id = detailModalItem.id;
                    const uid = detailModalItem.uid;
                    setDetailModalItem(null);
                    handleNavigateToEdit(id, uid);
                  }}
                >
                  Edit Light
                </button>
              )}
            </div>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailModalItem(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UP_Installation_SSL_InstallationDetail;
