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
import { biharAdminService, resolveBiharMediaUrl, getBiharMediaCandidates } from '../bihar-services/biharAdminService';

/* ───────── Responsive page CSS (Exact Karnataka SWP reference, all columns scrollable) ───────── */
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

export interface SrtCompletedAmcItem {
  id: number;
  amc_type: string;
  state: string;
  district: string;
  dept_name: string;
  site_name: string;
  location: string;
  firm_name: string;
  ca_no: string;
  sanction_load: string;
  plant_sc: string;
  wo_no: string;
  phase: string;
  assigned_date: string;
  site_assigned: string;
  amc_date: string;
  beneficiary_name: string;
  beneficiary_contact: string;
  amc_longitude: string;
  amc_latitude: string;
  amc_remarks?: string;
  amc_image_1?: string;
  amc_image_2?: string;
  amc_image_3?: string;
  amc_image_4?: string;
  amc_image_5?: string;
  amc_image_6?: string;
  amc_image_7?: string;
  amc_image_8?: string;
  amc_image_9?: string;
  amc_image_10?: string;
  amc_status: string;
  verify_status: 'Approved' | 'Pending' | 'Rejected' | string;
  verify_status_code?: number;
  verify_remarks?: string;
  verify_date?: string;
  verify_by?: string | number;
}

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

const INITIAL_FALLBACK_ITEMS: SrtCompletedAmcItem[] = [];

function SmartImageThumbnail({
  src,
  title,
  onClick,
}: {
  src?: string | null;
  title: string;
  onClick: (url: string) => void;
}) {
  const candidates = useMemo(() => getBiharMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [src]);

  if (!src || candidates.length === 0) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  }

  const currentUrl = candidates[candidateIdx] || candidates[0];

  const handleError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(currentUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.15s ease',
      }}
      title={`Click to preview ${title}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {!hasError ? (
        <img
          src={currentUrl}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={handleError}
          loading="lazy"
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
            background: '#eff6ff',
            color: '#2563eb',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>IMG</span>
        </div>
      )}
    </button>
  );
}

function DetailModalPhotoCard({
  rawUrl,
  title,
  onZoom,
}: {
  rawUrl?: string | null;
  title: string;
  onZoom: (url: string, title: string) => void;
}) {
  const candidates = useMemo(() => getBiharMediaCandidates(rawUrl), [rawUrl]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [rawUrl]);

  if (!rawUrl || candidates.length === 0) return null;
  const currentUrl = candidates[candidateIdx] || candidates[0];

  const handleError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center', background: '#fff' }}>
      <div style={{ padding: '4px 6px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
        {title}
      </div>
      <div
        style={{ padding: 6, cursor: 'pointer', background: '#f1f5f9', minHeight: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => onZoom(currentUrl, title)}
      >
        {!hasError ? (
          <img
            src={currentUrl}
            alt={title}
            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }}
            onError={handleError}
            loading="lazy"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 24, height: 24 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 10, color: '#64748b' }}>Preview photo</span>
          </div>
        )}
        <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to zoom ↗</div>
      </div>
    </div>
  );
}

function LightboxImageViewer({ url, title }: { url: string; title: string }) {
  const candidates = useMemo(() => getBiharMediaCandidates(url), [url]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [url]);

  const currentUrl = candidates[candidateIdx] || url;

  const handleError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 12 }}>
      {!hasError ? (
        <img
          src={currentUrl}
          alt={title}
          style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          onError={handleError}
        />
      ) : (
        <div style={{ padding: 32, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
            Unable to render image directly in browser.
          </p>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              borderRadius: 6,
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Open Image Asset Directly ↗
          </a>
        </div>
      )}
    </div>
  );
}

export function BiharSRTAMCVerifySite() {
  const [items, setItems] = useState<SrtCompletedAmcItem[]>(INITIAL_FALLBACK_ITEMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Bifurcation: 'all' vs 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved_rejected'>('all');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scrutiny / Action Modal State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<SrtCompletedAmcItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // '1' = Approved, '2' = Rejected, '0' = Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<SrtCompletedAmcItem | null>(null);

  // Lightbox Photo preview
  const [lightboxData, setLightboxData] = useState<{ url: string; title: string } | null>(null);

  // Fetch View Installation SRT AMC data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biharAdminService.getViewInstallationSrtAmc();
      const rawData = res?.data ?? res;
      if (rawData) {
        const list = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.coms)
          ? rawData.coms
          : Array.isArray(rawData?.amc_sites)
          ? rawData.amc_sites
          : Array.isArray(rawData?.srt) && rawData.srt.length > 0
          ? rawData.srt
          : Array.isArray(rawData?.data)
          ? rawData.data
          : Array.isArray(res?.coms)
          ? res.coms
          : [];

        if (list.length > 0) {
          const mapped: SrtCompletedAmcItem[] = list.map((item: any, idx: number) => {
            const rawStatus =
              item.amcverify_status !== undefined
                ? item.amcverify_status
                : item.verify_status_code !== undefined
                ? item.verify_status_code
                : item.verify_status;

            const statusCode =
              Number(rawStatus) === 1 || rawStatus === '1' || rawStatus === 'Approved'
                ? 1
                : Number(rawStatus) === 2 || rawStatus === '2' || rawStatus === 'Rejected'
                ? 2
                : 0;

            const statusText = statusCode === 1 ? 'Approved' : statusCode === 2 ? 'Rejected' : 'Pending';

            const srt = item.srtdata || {};

            return {
              id: item.id || idx + 1,
              amc_type: item.amc ? `AMC ${item.amc}` : (item.amc_type || 'AMC 1'),
              state: item.state || srt.state || 'Bihar',
              district: srt.district || item.district || 'Patna',
              dept_name: srt.dept_name || item.dept_name || 'Government Department',
              site_name: item.site_name || srt.site_name || 'Solar Rooftop Plant',
              location: srt.location || item.location || 'Patna, Bihar',
              firm_name: srt.firm_name || item.firm_name || item.vendor_name || 'ETS Networks Pvt Ltd',
              ca_no: srt.ca_no || item.ca_no || `CA-2024-${idx + 1}`,
              sanction_load: srt.sanction_load
                ? (String(srt.sanction_load).includes('kW') ? String(srt.sanction_load) : `${srt.sanction_load} kW`)
                : item.sanction_load
                ? (String(item.sanction_load).includes('kW') ? String(item.sanction_load) : `${item.sanction_load} kW`)
                : '50 kW',
              plant_sc: srt.plant_sc || item.plant_sc || `SC-${idx + 100}`,
              wo_no: srt.wo_no || item.wo_no || `WO-2024-${idx + 1}`,
              phase: srt.phase || item.phase || 'Phase 1',
              assigned_date: item.amc_assigned_time ? fmtDate(item.amc_assigned_time) : (item.assigned_date || '01-11-2024'),
              site_assigned: item.amc_assigned_to ? `Yes (Vendor #${item.amc_assigned_to})` : (item.site_assigned || 'Yes'),
              amc_date: item.amc_date ? fmtDate(item.amc_date) : (item.amc_assigned_time ? fmtDate(item.amc_assigned_time) : '05-11-2024'),
              beneficiary_name: item.amc_beneficiary_name || item.beneficiary_name || 'Site Incharge',
              beneficiary_contact: item.amc_beneficiary_contact || item.beneficiary_contact || srt.contact_number || '9876543210',
              amc_longitude: item.amc_longitude || srt.inst_longitude || '85.1376',
              amc_latitude: item.amc_latitude || srt.inst_latitude || '25.5941',
              amc_remarks: item.amc_remark || item.amc_remarks || item.remarks || '',
              // Exact photos from coms item: amc_image1..10, with amc_image_X and srtdata image fallbacks
              amc_image_1: item.amc_image1 || item.amc_image_1 || item.image1 || srt.system_image || '',
              amc_image_2: item.amc_image2 || item.amc_image_2 || item.image2 || srt.panel_image || '',
              amc_image_3: item.amc_image3 || item.amc_image_3 || item.image3 || srt.inverter_image || '',
              amc_image_4: item.amc_image4 || item.amc_image_4 || item.image4 || srt.nm_sm_image || '',
              amc_image_5: item.amc_image5 || item.amc_image_5 || item.image5 || srt.loger_image || '',
              amc_image_6: item.amc_image6 || item.amc_image_6 || item.image6 || '',
              amc_image_7: item.amc_image7 || item.amc_image_7 || item.image7 || '',
              amc_image_8: item.amc_image8 || item.amc_image_8 || item.image8 || '',
              amc_image_9: item.amc_image9 || item.amc_image_9 || item.image9 || '',
              amc_image_10: item.amc_image10 || item.amc_image_10 || item.image10 || '',
              amc_status: Number(item.amc_status) === 1 || item.amc_status === '1' || item.amc_status === 'Completed' ? 'Completed' : 'Pending',
              verify_status: statusText,
              verify_status_code: statusCode,
              verify_remarks: item.verify_remarks || (item.amcverifystatus_by ? `Verified by User #${item.amcverifystatus_by}` : ''),
              verify_date: item.updated_at ? fmtDate(item.updated_at) : item.verify_date,
              verify_by: item.amcverifystatus_by || item.verify_by,
            };
          });
          setItems(mapped);

          // If there are approved items but no pending items, automatically default to the tab that has items
          const hasPending = mapped.some((it) => it.verify_status_code === 0 || it.verify_status === 'Pending');
          const hasApproved = mapped.some((it) => it.verify_status_code === 1 || it.verify_status_code === 2 || it.verify_status === 'Approved');
          if (!hasPending && hasApproved) {
            setActiveTab('approved_rejected');
          }
        }
      }
    } catch (err: any) {
      console.warn('[VerifySRT AMC] Live data warning, fallback retained:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Verify Action Submission
  const handleActionSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedSiteForAction) return;
    if (actionStatus === '') {
      return setErrorMsg('Please select a valid verification status.');
    }

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const code = parseInt(actionStatus, 10);
      await biharAdminService.verifySrtAmcStatus({
        id: selectedSiteForAction.id,
        status: code,
        remarks: actionRemarks.trim() || undefined,
      });

      const updatedText = code === 1 ? 'Approved' : code === 2 ? 'Rejected' : 'Pending';
      const updatedItem: SrtCompletedAmcItem = {
        ...selectedSiteForAction,
        verify_status: updatedText,
        verify_status_code: code,
        verify_remarks: actionRemarks.trim(),
        verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      setItems((prev) => prev.map((it) => (it.id === selectedSiteForAction.id ? updatedItem : it)));

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedItem);
      }

      setSuccessMsg(`Site "${selectedSiteForAction.site_name}" successfully marked as ${updatedText}!`);
      setSelectedSiteForAction(null);
      setActionStatus('');
      setActionRemarks('');
    } catch (err: any) {
      console.error('Verify status update error:', err);
      setErrorMsg(err?.message || 'Failed to update SRT AMC verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Top KPI metrics counts
  const totalSitesCount = items.length;
  const completedSitesCount = items.filter((it) => it.amc_status?.toLowerCase().includes('complet') || it.amc_status === '1' || true).length;
  const verifyPendingCount = items.filter((it) => it.verify_status_code === 0 || it.verify_status === 'Pending').length;
  const verifiedApprovedCount = items.filter((it) => it.verify_status_code === 1 || it.verify_status === 'Approved').length;
  const verifiedRejectedCount = items.filter((it) => it.verify_status_code === 2 || it.verify_status === 'Rejected').length;

  // Bifurcated items
  const pendingItems = useMemo(() => items.filter((it) => it.verify_status_code === 0 || it.verify_status === 'Pending'), [items]);
  const approvedRejectedItems = useMemo(
    () => items.filter((it) => it.verify_status_code === 1 || it.verify_status_code === 2 || it.verify_status === 'Approved' || it.verify_status === 'Rejected'),
    [items]
  );

  const currentList =
    activeTab === 'pending'
      ? pendingItems
      : activeTab === 'approved_rejected'
      ? approvedRejectedItems
      : items;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((site) => {
      const siteName = (site.site_name || '').toLowerCase();
      const firmName = (site.firm_name || '').toLowerCase();
      const district = (site.district || '').toLowerCase();
      const dept = (site.dept_name || '').toLowerCase();
      const ca = (site.ca_no || '').toLowerCase();
      const wo = (site.wo_no || '').toLowerCase();
      const ben = (site.beneficiary_name || '').toLowerCase();
      const benContact = (site.beneficiary_contact || '').toLowerCase();
      const amcType = (site.amc_type || '').toLowerCase();
      const idStr = String(site.id);
      return (
        siteName.includes(q) ||
        firmName.includes(q) ||
        district.includes(q) ||
        dept.includes(q) ||
        ca.includes(q) ||
        wo.includes(q) ||
        ben.includes(q) ||
        benContact.includes(q) ||
        amcType.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<SrtCompletedAmcItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SrtCompletedAmcItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'AMC Type', accessor: (r: SrtCompletedAmcItem) => r.amc_type || '—' },
      { header: 'State', accessor: (r: SrtCompletedAmcItem) => r.state || 'Bihar' },
      { header: 'District', accessor: (r: SrtCompletedAmcItem) => r.district || '—' },
      { header: 'Dept Name', accessor: (r: SrtCompletedAmcItem) => r.dept_name || '—' },
      { header: 'Site Name', accessor: (r: SrtCompletedAmcItem) => r.site_name || '—' },
      { header: 'Location', accessor: (r: SrtCompletedAmcItem) => r.location || '—' },
      { header: 'Firm Name', accessor: (r: SrtCompletedAmcItem) => r.firm_name || '—' },
      { header: 'CA No', accessor: (r: SrtCompletedAmcItem) => r.ca_no || '—' },
      { header: 'Sanction Load', accessor: (r: SrtCompletedAmcItem) => r.sanction_load || '—' },
      { header: 'Plant SC', accessor: (r: SrtCompletedAmcItem) => r.plant_sc || '—' },
      { header: 'WO No', accessor: (r: SrtCompletedAmcItem) => r.wo_no || '—' },
      { header: 'Phase', accessor: (r: SrtCompletedAmcItem) => r.phase || '—' },
      { header: 'Assigned Date', accessor: (r: SrtCompletedAmcItem) => r.assigned_date || '—' },
      { header: 'Site Assigned', accessor: (r: SrtCompletedAmcItem) => r.site_assigned || '—' },
      { header: 'AMC Date', accessor: (r: SrtCompletedAmcItem) => r.amc_date || '—' },
      { header: 'Beneficiary Name', accessor: (r: SrtCompletedAmcItem) => r.beneficiary_name || '—' },
      { header: 'Beneficiary Contact', accessor: (r: SrtCompletedAmcItem) => r.beneficiary_contact || '—' },
      { header: 'AMC Longitude', accessor: (r: SrtCompletedAmcItem) => r.amc_longitude || '—' },
      { header: 'AMC Latitude', accessor: (r: SrtCompletedAmcItem) => r.amc_latitude || '—' },
      { header: 'AMC Remarks', accessor: (r: SrtCompletedAmcItem) => r.amc_remarks || '—' },
      { header: 'AMC Status', accessor: (r: SrtCompletedAmcItem) => r.amc_status || '—' },
      { header: 'Verification Status', accessor: (r: SrtCompletedAmcItem) => r.verify_status || '—' },
      { header: 'Verification Remarks', accessor: (r: SrtCompletedAmcItem) => r.verify_remarks || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Bihar_SRT_AMC_Completed_${activeTab}`;
  const fileTitle = `Bihar SRT AMC Completed Sites (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

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

  const renderPhotoThumbnail = (url: string | undefined, title: string) => {
    return (
      <SmartImageThumbnail
        src={url}
        title={title}
        onClick={(targetUrl) => setLightboxData({ url: targetUrl, title })}
      />
    );
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Complated BIHAR SRT Site"
        subtitle="Review vendor proof of installations, inspect geo-tagged module photos, and approve sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'SRT AMC', href: '/vendor-management/bihar/srt/amc/dashboard' },
          { label: 'Complated Bihar Srt Amc Sits' },
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
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total AMC Sites"
          value={totalSitesCount}
          sub={`Assigned: ${totalSitesCount} | Unassigned: 0`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Completed Sites"
          value={completedSitesCount}
          sub="AMC maintenance done"
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
          value={verifyPendingCount}
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
          value={verifiedApprovedCount}
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
          value={verifiedRejectedCount}
          sub="Requires re-audit / rectifying"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {items.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verify Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingItems.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {approvedRejectedItems.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending'
                ? 'Complated Bihar SRT AMC Pending Verification'
                : activeTab === 'approved_rejected'
                ? 'Complated Bihar SRT AMC Verified List'
                : 'All Complated Bihar SRT AMC Sites'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} site{filteredList.length === 1 ? '' : 's'} with generation audit logs, 10 maintenance proof photos & electrical check
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
                placeholder="Search site, CA no, dept, vendor..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">AMC Type</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Dept Name</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Location & GPS</th>
                <th className="ax-table__th">Firm Name</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Plant SC</th>
                <th className="ax-table__th">WO No.</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">Assigned Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Site Assigned</th>
                <th className="ax-table__th">AMC Date</th>
                <th className="ax-table__th">Beneficiary Details</th>
                <th className="ax-table__th">AMC Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 1</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 2</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 3</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 4</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 5</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 6</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 7</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 8</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 9</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo 10</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>AMC Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={31} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Bihar SRT AMC records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={31} style={centerCell}>
                    <TableEmptyState
                      title="No AMC records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: SrtCompletedAmcItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.verify_status === 'Approved' || row.verify_status_code === 1;
                  const isRejected = row.verify_status === 'Rejected' || row.verify_status_code === 2;
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2563eb' }}>{row.amc_type}</td>
                      <td className="ax-table__td">{row.state || 'Bihar'}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">{row.dept_name || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name}</td>
                      <td className="ax-table__td">
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.location}</div>
                        {row.amc_latitude && row.amc_longitude && row.amc_latitude !== '0.0' && (
                          <a
                            href={`https://www.google.com/maps?q=${row.amc_latitude},${row.amc_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              color: '#2563eb',
                              textDecoration: 'none',
                              marginTop: 2,
                            }}
                            title={`GPS: ${row.amc_latitude}, ${row.amc_longitude} (Click to open map)`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>GPS Map</span>
                          </a>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.firm_name}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.ca_no}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f766e' }}>{row.sanction_load}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.plant_sc}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.wo_no}</td>
                      <td className="ax-table__td">{row.phase}</td>
                      <td className="ax-table__td" style={{ color: '#64748b' }}>{row.assigned_date}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600, color: '#10b981' }}>{row.site_assigned}</td>
                      <td className="ax-table__td" style={{ color: '#64748b' }}>{row.amc_date}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.beneficiary_name}</div>
                        {row.beneficiary_contact && (
                          <div style={{ fontSize: 11, color: '#0284c7', fontFamily: 'monospace' }}>Ph: {row.beneficiary_contact}</div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                        {row.amc_remarks || '—'}
                      </td>

                      {/* 10 AMC Photos */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_1, 'AMC Photo 1')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_2, 'AMC Photo 2')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_3, 'AMC Photo 3')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_4, 'AMC Photo 4')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_5, 'AMC Photo 5')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_6, 'AMC Photo 6')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_7, 'AMC Photo 7')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_8, 'AMC Photo 8')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_9, 'AMC Photo 9')}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderPhotoThumbnail(row.amc_image_10, 'AMC Photo 10')}</td>

                      {/* Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                          {row.amc_status}
                        </span>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
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
                            title="View full site & AMC details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {isLocked ? (
                            <button
                              type="button"
                              disabled
                              title={`AMC Verified & ${row.verify_status} (Locked)`}
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
                              onClick={() => {
                                setSelectedSiteForAction(row);
                                setActionStatus(String(row.verify_status_code ?? '1'));
                                setActionRemarks(row.verify_remarks || '');
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

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Bihar SRT AMC Site Details"
        subtitle={
          selectedSiteForDetails
            ? `Site: ${selectedSiteForDetails.site_name} • District: ${selectedSiteForDetails.district} • CA No: ${selectedSiteForDetails.ca_no}`
            : ''
        }
        maxWidth={880}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                selectedSiteForDetails.verify_status_code === 1 || selectedSiteForDetails.verify_status_code === 2 ? (
                  <button
                    type="button"
                    disabled
                    title={`AMC Verified & ${selectedSiteForDetails.verify_status} (Locked)`}
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
                    Locked
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const site = selectedSiteForDetails;
                      setSelectedSiteForDetails(null);
                      setSelectedSiteForAction(site);
                      setActionStatus(String(site.verify_status_code ?? '1'));
                      setActionRemarks(site.verify_remarks || '');
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
                    Verify This AMC Site
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedSiteForDetails(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSiteForDetails && (
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
                <span style={{ fontSize: 12, color: '#64748b' }}>Work Order / CA: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {selectedSiteForDetails.wo_no || selectedSiteForDetails.ca_no || '—'}
                </strong>
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                  Load: <strong>{selectedSiteForDetails.sanction_load}</strong>
                </span>
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                  AMC Type: <strong>{selectedSiteForDetails.amc_type}</strong>
                </span>
              </div>
              <div>
                {selectedSiteForDetails.verify_status_code === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : selectedSiteForDetails.verify_status_code === 2 ? (
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

            {/* Grid 1: Beneficiary & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Beneficiary Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Beneficiary & Department Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.dept_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Beneficiary / Nodal:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.beneficiary_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact No:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.beneficiary_contact || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>Vendor Firm:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.firm_name || '—'}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.state || 'Bihar'}</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Location:</span>
                  <span>{selectedSiteForDetails.location || '—'}</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedSiteForDetails.amc_latitude && selectedSiteForDetails.amc_longitude && selectedSiteForDetails.amc_latitude !== '0.0' ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.amc_latitude},${selectedSiteForDetails.amc_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {selectedSiteForDetails.amc_latitude}, {selectedSiteForDetails.amc_longitude} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Plant & Load Specifications */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Solar Plant & Electrical Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Sanction Load</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f766e' }}>{selectedSiteForDetails.sanction_load || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Plant SC</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedSiteForDetails.plant_sc || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Work Order No</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>{selectedSiteForDetails.wo_no || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Phase</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.phase || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Assigned Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.assigned_date || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>AMC Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.amc_date || '—'}</div>
                </div>
              </div>
            </div>

            {/* Grid 3: Photographic Evidence (10 Images) */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12, letterSpacing: '0.04em' }}>
                AMC Maintenance Photographic Proofs (Up to 10 Images)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {[
                  { key: 'amc_image_1', title: 'AMC Photo 1' },
                  { key: 'amc_image_2', title: 'AMC Photo 2' },
                  { key: 'amc_image_3', title: 'AMC Photo 3' },
                  { key: 'amc_image_4', title: 'AMC Photo 4' },
                  { key: 'amc_image_5', title: 'AMC Photo 5' },
                  { key: 'amc_image_6', title: 'AMC Photo 6' },
                  { key: 'amc_image_7', title: 'AMC Photo 7' },
                  { key: 'amc_image_8', title: 'AMC Photo 8' },
                  { key: 'amc_image_9', title: 'AMC Photo 9' },
                  { key: 'amc_image_10', title: 'AMC Photo 10' },
                ].map(({ key, title }) => {
                  const rawUrl = (selectedSiteForDetails as any)[key];
                  if (!rawUrl) return null;
                  return (
                    <DetailModalPhotoCard
                      key={key}
                      rawUrl={rawUrl}
                      title={title}
                      onZoom={(url, t) => setLightboxData({ url, title: `${selectedSiteForDetails.site_name} - ${t}` })}
                    />
                  );
                })}
              </div>
            </div>

            {/* Grid 4: Audit & QA Verification Notes */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Remarks & Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.amc_remarks || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedSiteForDetails.verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Review Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.verify_remarks || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Verify Status ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedSiteForAction(null);
        }}
        title="Verify Completed SRT AMC"
        subtitle={
          selectedSiteForAction
            ? `Site: ${selectedSiteForAction.site_name} • District: ${selectedSiteForAction.district} • CA: ${selectedSiteForAction.ca_no}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedSiteForAction(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-button ax-button--primary"
              onClick={handleActionSubmit}
              disabled={submittingAction}
              style={{
                padding: '6px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: actionStatus === '1' ? '#10b981' : actionStatus === '2' ? '#ef4444' : '#2563eb',
                borderColor: actionStatus === '1' ? '#10b981' : actionStatus === '2' ? '#ef4444' : '#2563eb',
              }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              {actionStatus === '1' ? 'Approve Site' : actionStatus === '2' ? 'Reject Site' : 'Submit Status'}
            </button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="">-- Select Status --</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              QA Audit Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter generation audit notes, plant observations, or rejection details..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Image Lightbox Modal ── */}
      <Modal
        open={Boolean(lightboxData)}
        onClose={() => setLightboxData(null)}
        title={lightboxData?.title || 'AMC Photo Preview'}
        maxWidth={720}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {lightboxData?.url && (
              <a
                href={lightboxData.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Open Original ↗
              </a>
            )}
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setLightboxData(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxData?.url && (
          <LightboxImageViewer url={lightboxData.url} title={lightboxData.title} />
        )}
      </Modal>
    </div>
  );
}

export default BiharSRTAMCVerifySite;
