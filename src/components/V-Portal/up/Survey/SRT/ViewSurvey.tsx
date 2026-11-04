import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSrtSurveyRecord,
} from '../../up-services';
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

const DASH = '—';

/* ───────── KPI Card (same style as Goa SRT) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
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
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  /* Image preview stage */
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

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
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

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Helpers ───────── */
const isVerified = (row: UpSrtSurveyRecord) => {
  const v = (row.verification || '').toLowerCase().trim();
  return v === 'verified' || v === 'approved';
};

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ───────── Image preview modal ───────── */
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
    <Modal open onClose={onClose} labelledBy="preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="preview-title">{title || 'Document Preview'}</h2>
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
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const }
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

/* ───────── Detail Section Block ───────── */
function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
      <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>{title}</h4>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span style={{ color: 'var(--ax-text-muted)' }}>{label}: </span>
      <strong>{value || DASH}</strong>
    </div>
  );
}

/* ───────── Main Component ───────── */
export function UP_Survey_SRT_ViewSurvey() {
  const [records, setRecords] = useState<UpSrtSurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [detailItem, setDetailItem] = useState<UpSrtSurveyRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await upSurveyService.getViewSrtSurveys();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('[UP SRT ViewSurvey] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load SRT survey records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  /* ── Summary ── */
  const summary = useMemo(() => {
    const verified = records.filter(isVerified).length;
    return { total: records.length, verified, pending: records.length - verified };
  }, [records]);

  /* ── Districts ── */
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district && r.district.trim()) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  /* ── Filtered records ── */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (verificationFilter === 'verified' && !isVerified(r)) return false;
      if (verificationFilter === 'pending' && isVerified(r)) return false;

      if (districtFilter !== 'all' && (r.district || '').toLowerCase() !== districtFilter.toLowerCase()) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          r.district, r.block, r.panchayat, r.village,
          r.beneficiary, r.phone, r.email, r.aadhaar_no,
          r.ca_no, r.pan_no, String(r.id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, verificationFilter, districtFilter, search]);

  /* ── Paginated ── */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || verificationFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setVerificationFilter('all');
    setCurrentPage(1);
  };

  const setVerifFilter = (v: 'all' | 'pending' | 'verified') => {
    setVerificationFilter(v);
    setCurrentPage(1);
  };

  /* ── Export columns ── */
  const exportCols: ExportColumn<UpSrtSurveyRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => i + 1 },
      { header: 'Survey Date', accessor: (r) => r.survey_date || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
      { header: 'Address', accessor: (r) => r.address || DASH },
      { header: 'Beneficiary', accessor: (r) => r.beneficiary || DASH },
      { header: 'Phone', accessor: (r) => r.phone || DASH },
      { header: 'Email', accessor: (r) => r.email || DASH },
      { header: 'Aadhaar No.', accessor: (r) => r.aadhaar_no || DASH },
      { header: 'PAN No.', accessor: (r) => r.pan_no || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanctioned Load', accessor: (r) => r.sanctioned_load || DASH },
      { header: 'Load Demand', accessor: (r) => r.load_demand || DASH },
      { header: 'Consumption', accessor: (r) => r.consumption || DASH },
      { header: 'Quotation', accessor: (r) => r.quotation || DASH },
      { header: 'Area (sq ft)', accessor: (r) => r.area_sqft || DASH },
      { header: 'Bank', accessor: (r) => r.bank || DASH },
      { header: 'Account Holder', accessor: (r) => r.account_holder || DASH },
      { header: 'Account No.', accessor: (r) => r.account_no || DASH },
      { header: 'IFSC', accessor: (r) => r.ifsc || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.remark || DASH },
      { header: 'Verification', accessor: (r) => r.verification || 'Pending' },
      { header: 'Verify By', accessor: (r) => r.verify_by || DASH },
    ],
    [],
  );

  /* ── Photo link helper ── */
  const renderDocLink = (path: string | undefined | null, label: string) => {
    if (!path) return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
    const url = getUpSurveyMediaUrl(path);
    return (
      <button
        type="button"
        className="ax-btn ax-btn--ghost ax-btn--xs"
        style={{ padding: '0 6px', fontSize: 11, color: 'var(--ax-accent, #2563eb)' }}
        onClick={() => setPreviewFile({ url, title: label })}
      >
        Survey document
      </button>
    );
  };

  const TOTAL_COLUMNS = 34;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View UP SRT Survey"
        subtitle="Welcome to, Rooftop solar survey verification records for Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SRT Survey' },
          { label: 'View Survey' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards (click to filter) ── */}
      {!loading && (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <KpiCard
            tone="accent"
            label="Total Surveys"
            value={summary.total.toLocaleString('en-IN')}
            sub="All survey records"
            active={verificationFilter === 'all'}
            onClick={() => setVerifFilter('all')}
            icon={svg(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />
          <KpiCard
            tone="amber"
            label="Pending Verification"
            value={summary.pending.toLocaleString('en-IN')}
            sub="Waiting for verification"
            active={verificationFilter === 'pending'}
            onClick={() => setVerifFilter('pending')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </>
            )}
          />
          <KpiCard
            tone="emerald"
            label="Verified"
            value={summary.verified.toLocaleString('en-IN')}
            sub="Verification completed"
            active={verificationFilter === 'verified'}
            onClick={() => setVerifFilter('verified')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="SRT Survey Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">SRT SURVEY</span>
              <h2 className="ax-card__title">UP SRT Survey Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredRecords.length} of {records.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  id="verif_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={verificationFilter}
                  onChange={(e) => setVerifFilter(e.target.value as 'all' | 'pending' | 'verified')}
                  aria-label="Filter by verification"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search beneficiary, district, phone…"
                  size="sm"
                  ariaLabel="Search surveys"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredRecords, exportCols)}
                  onExportCSV={() => exportDataToCSV('UP_SRT_Surveys', filteredRecords, exportCols)}
                  onExportExcel={() => exportDataToExcel('UP_SRT_Surveys', filteredRecords, exportCols)}
                  onExportPDF={() => printTableData('Vendor UP SRT Survey Records', filteredRecords, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2200 }}
            >
              <caption className="ax-visually-hidden">UP SRT Survey Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Survey Date</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Ward No.</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 180 }}>Address</th>
                  <th className="ax-table__th" scope="col">Beneficiary</th>
                  <th className="ax-table__th" scope="col">Phone</th>
                  <th className="ax-table__th" scope="col">Email</th>
                  <th className="ax-table__th" scope="col">Aadhaar No.</th>
                  <th className="ax-table__th" scope="col">PAN No.</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Sanctioned Load</th>
                  <th className="ax-table__th" scope="col">Load Demand</th>
                  <th className="ax-table__th" scope="col">Consumption</th>
                  <th className="ax-table__th" scope="col">Quotation</th>
                  <th className="ax-table__th" scope="col">Area (sq ft)</th>
                  <th className="ax-table__th" scope="col">Bank</th>
                  <th className="ax-table__th" scope="col">Account Holder</th>
                  <th className="ax-table__th" scope="col">Account No.</th>
                  <th className="ax-table__th" scope="col">IFSC</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Aadhaar Photo</th>
                  <th className="ax-table__th" scope="col">PAN Photo</th>
                  <th className="ax-table__th" scope="col">Electricity Bill</th>
                  <th className="ax-table__th" scope="col">Bank Passbook</th>
                  <th className="ax-table__th" scope="col">Rooftop Photo</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verification</th>
                  <th className="ax-table__th" scope="col">Verify By</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 2 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SRT survey records…
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'There are currently no SRT survey records.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const verified = isVerified(row);

                    return (
                      <tr key={row.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{row.survey_date || DASH}</td>
                        <td className="ax-table__td">{row.district || DASH}</td>
                        <td className="ax-table__td">{row.block || DASH}</td>
                        <td className="ax-table__td">{row.panchayat || DASH}</td>
                        <td className="ax-table__td">{row.village || DASH}</td>
                        <td className="ax-table__td">{row.ward_no || DASH}</td>
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.address || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>{row.beneficiary || DASH}</td>
                        <td className="ax-table__td">{row.phone || DASH}</td>
                        <td className="ax-table__td">{row.email || DASH}</td>
                        <td className="ax-table__td">{row.aadhaar_no || DASH}</td>
                        <td className="ax-table__td">{row.pan_no || DASH}</td>
                        <td className="ax-table__td">{row.ca_no || DASH}</td>
                        <td className="ax-table__td">{row.sanctioned_load || DASH}</td>
                        <td className="ax-table__td">{row.load_demand || DASH}</td>
                        <td className="ax-table__td">{row.consumption || DASH}</td>
                        <td className="ax-table__td">{row.quotation ? `₹${row.quotation}` : DASH}</td>
                        <td className="ax-table__td">{row.area_sqft || DASH}</td>
                        <td className="ax-table__td">{row.bank || DASH}</td>
                        <td className="ax-table__td">{row.account_holder || DASH}</td>
                        <td className="ax-table__td">{row.account_no || DASH}</td>
                        <td className="ax-table__td">{row.ifsc || DASH}</td>
                        <td className="ax-table__td">{row.latitude || DASH}</td>
                        <td className="ax-table__td">{row.longitude || DASH}</td>
                        <td className="ax-table__td">{renderDocLink(row.aadhaar_photo, 'Aadhaar Photo')}</td>
                        <td className="ax-table__td">{renderDocLink(row.pan_photo, 'PAN Photo')}</td>
                        <td className="ax-table__td">{renderDocLink(row.electricity_bill, 'Electricity Bill')}</td>
                        <td className="ax-table__td">{renderDocLink(row.bank_passbook, 'Bank Passbook')}</td>
                        <td className="ax-table__td">{renderDocLink(row.rooftop_photo, 'Rooftop Photo')}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{row.remark || DASH}</td>
                        <td className="ax-table__td">
                          {verified ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Verified</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td">{row.verify_by || DASH}</td>
                        <td
                          className="ax-table__td"
                          style={{
                            textAlign: 'center',
                            position: 'sticky',
                            right: 0,
                            background: 'var(--ax-surface-solid, #ffffff)',
                            zIndex: 2,
                            boxShadow: '-2px 0 6px rgba(0,0,0,0.05)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="ax-btn ax-btn--subtle"
                            style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6 }}
                          >
                            View
                          </button>
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
                pageSize={pageSize}
                totalItems={filteredRecords.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Detail Modal ── */}
      {detailItem && (
        <Modal
          open={!!detailItem}
          onClose={() => setDetailItem(null)}
          labelledBy="srt-detail-title"
          dialogStyle={{ maxWidth: 740 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>SRT Survey Details</span>
              <h3 id="srt-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
                {detailItem.beneficiary} ({detailItem.ca_no || `Survey #${detailItem.id}`})
              </h3>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close modal">{X_ICON}</button>
          </div>

          <div className="ax-modal__body" style={{ padding: 20, overflowY: 'auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Location */}
            <DetailSection title="Location Details">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
                <DetailField label="District" value={detailItem.district} />
                <DetailField label="Block" value={detailItem.block} />
                <DetailField label="Panchayat" value={detailItem.panchayat} />
                <DetailField label="Village" value={detailItem.village} />
                <DetailField label="Ward No." value={detailItem.ward_no} />
                <DetailField label="Coordinates" value={detailItem.latitude ? `${detailItem.latitude}, ${detailItem.longitude}` : DASH} />
                <div style={{ gridColumn: 'span 3' }}>
                  <DetailField label="Address" value={detailItem.address} />
                </div>
              </div>
            </DetailSection>

            {/* Beneficiary */}
            <DetailSection title="Beneficiary Details">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
                <DetailField label="Beneficiary" value={detailItem.beneficiary} />
                <DetailField label="Phone No." value={detailItem.phone} />
                <DetailField label="Email" value={detailItem.email} />
                <DetailField label="Aadhaar No." value={detailItem.aadhaar_no} />
                <DetailField label="PAN No." value={detailItem.pan_no} />
                <DetailField label="CA No." value={detailItem.ca_no} />
              </div>
            </DetailSection>

            {/* Electricity & Rooftop */}
            <DetailSection title="Electricity & Rooftop Details">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
                <DetailField label="Sanctioned Load" value={detailItem.sanctioned_load ? `${detailItem.sanctioned_load} kW` : DASH} />
                <DetailField label="Load Demand" value={detailItem.load_demand ? `${detailItem.load_demand} kW` : DASH} />
                <DetailField label="Consumption" value={detailItem.consumption ? `${detailItem.consumption} Units/M` : DASH} />
                <DetailField label="Quotation" value={detailItem.quotation ? `₹${detailItem.quotation}` : DASH} />
                <DetailField label="Rooftop Area" value={detailItem.area_sqft ? `${detailItem.area_sqft} Sq.Ft` : DASH} />
              </div>
            </DetailSection>

            {/* Bank */}
            <DetailSection title="Bank Details">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
                <DetailField label="Bank Name" value={detailItem.bank} />
                <DetailField label="Account Holder" value={detailItem.account_holder} />
                <DetailField label="Account No." value={detailItem.account_no} />
                <DetailField label="IFSC Code" value={detailItem.ifsc} />
              </div>
            </DetailSection>

            {/* Documents */}
            <DetailSection title="Survey Documents">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {detailItem.aadhaar_photo && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={getUpSurveyMediaUrl(detailItem.aadhaar_photo)}
                      alt="Aadhaar"
                      style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in', borderRadius: 0 }}
                      onClick={() => setPreviewFile({ url: getUpSurveyMediaUrl(detailItem.aadhaar_photo!), title: 'Aadhaar Photo' })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Aadhaar</span>
                  </div>
                )}
                {detailItem.pan_photo && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={getUpSurveyMediaUrl(detailItem.pan_photo)}
                      alt="PAN"
                      style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in', borderRadius: 0 }}
                      onClick={() => setPreviewFile({ url: getUpSurveyMediaUrl(detailItem.pan_photo!), title: 'PAN Photo' })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>PAN</span>
                  </div>
                )}
                {detailItem.electricity_bill && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={getUpSurveyMediaUrl(detailItem.electricity_bill)}
                      alt="Electricity Bill"
                      style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in', borderRadius: 0 }}
                      onClick={() => setPreviewFile({ url: getUpSurveyMediaUrl(detailItem.electricity_bill!), title: 'Electricity Bill' })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Electricity Bill</span>
                  </div>
                )}
                {detailItem.bank_passbook && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={getUpSurveyMediaUrl(detailItem.bank_passbook)}
                      alt="Bank Passbook"
                      style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in', borderRadius: 0 }}
                      onClick={() => setPreviewFile({ url: getUpSurveyMediaUrl(detailItem.bank_passbook!), title: 'Bank Passbook' })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Passbook</span>
                  </div>
                )}
                {detailItem.rooftop_photo && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={getUpSurveyMediaUrl(detailItem.rooftop_photo)}
                      alt="Rooftop"
                      style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in', borderRadius: 0 }}
                      onClick={() => setPreviewFile({ url: getUpSurveyMediaUrl(detailItem.rooftop_photo!), title: 'Rooftop Photo' })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Rooftop</span>
                  </div>
                )}
                {!detailItem.aadhaar_photo && !detailItem.pan_photo && !detailItem.electricity_bill && !detailItem.bank_passbook && !detailItem.rooftop_photo && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)' }}>No documents uploaded for this survey.</p>
                )}
              </div>
            </DetailSection>
          </div>

          <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setDetailItem(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Image Preview Modal ── */}
      {previewFile && (
        <ImagePreviewModal
          url={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

export const UPSurveySRTView = UP_Survey_SRT_ViewSurvey;
export default UP_Survey_SRT_ViewSurvey;