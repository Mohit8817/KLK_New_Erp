import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSslSiteRecord,
  type UpSslViewDataResponse,
  type UpSslCompletedDetailsResponse,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Constants ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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

/* ───────── KPI Card (Jammu pattern) ───────── */
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

/* ───────── Reusable Modal (Jammu pattern) ───────── */
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

/* ───────── Image Preview Modal (Lightbox Zoom — Jammu pattern) ───────── */
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
    <Modal open onClose={onClose} labelledBy="ssl-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ssl-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Overlay CSS (Jammu pattern) ───────── */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
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
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

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
`;

/* ───────── Responsive Page CSS (Jammu pattern) ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

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

/* ───────── Detail Modal ───────── */
function DetailModal({
  open,
  item,
  onClose,
  onPreview,
}: {
  open: boolean;
  item: UpSslSiteRecord | null;
  onClose: () => void;
  onPreview: (url: string, title: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [completedDetails, setCompletedDetails] = useState<UpSslCompletedDetailsResponse | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setCompletedDetails(null);
    setLoading(true);

    const isComplete = Number(item.v_status) === 1 || String(item.v_status).toLowerCase() === 'complete';
    if (isComplete) {
      upSurveyService
        .getSslViewDetails(item.id)
        .then((res) => {
          if (res) setCompletedDetails(res);
        })
        .catch((err) => {
          console.error('Error fetching completed SSL details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      upSurveyService
        .getSslRecord(item.id)
        .then((rec) => {
          if (rec) {
            setCompletedDetails({
              ssl: rec,
              upload: Array.isArray(rec.images)
                ? rec.images.map((img: any, i: number) => ({
                    id: i,
                    fid: Number(rec.id),
                    type: 'ssl',
                    image1: img.image1,
                    image2: img.image2,
                    latitude: img.latitude,
                    lognitude: img.longitude || img.lognitude,
                    mode: img.mode,
                    remarks: img.remarks,
                  }))
                : [],
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching record details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, item, onClose]);

  if (!open || !item) return null;

  const site = completedDetails?.ssl || item;
  const uploads = completedDetails?.upload || [];

  return (
    <Modal open={open} onClose={onClose} labelledBy="ssl-site-title" dialogClass="ax-modal__dialog--lg">
      {/* Header */}
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SSL Site Survey Details
          </span>
          <h3 id="ssl-site-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
            {txt(site.beneficiary_name)} {site.uid ? `(${site.uid})` : ''}
          </h3>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      {/* Body */}
      <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
            <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
            Loading site details…
          </div>
        ) : (
          <>
            {/* Site Details Grid */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Site Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{(site.state || 'UP').toUpperCase()}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{txt(site.district)}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Village / Block: </span><strong>{txt(site.village || site.block)}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary: </span><strong>{txt(site.beneficiary_name)}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact No.: </span><strong>{txt(site.contact || site.contact_no)}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>UID: </span><strong>{txt(site.uid)}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Survey Status: </span><strong>{Number(site.v_status) === 1 ? 'Complete' : 'Incomplete'}</strong></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Survey Date: </span><strong>{txt(site.v_date || site.installed_date)}</strong></div>
              </div>
            </div>

            {/* Uploaded Survey Visit Photos */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Survey Photos &amp; Inspection Logs</h4>
              {uploads.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {uploads.map((u: any, i: number) => (
                    <div key={i} style={{ borderBottom: i < uploads.length - 1 ? '1px solid var(--ax-border, #e2e8f0)' : 'none', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                        <span><span style={{ color: 'var(--ax-text-muted)' }}>Mode: </span><strong>{u.mode || 'Online'}</strong></span>
                        <span><span style={{ color: 'var(--ax-text-muted)' }}>Coordinates: </span><strong>{u.latitude ? `${u.latitude}, ${u.lognitude}` : DASH}</strong></span>
                      </div>
                      {u.remarks && (
                        <div style={{ fontSize: 12, color: 'var(--ax-text)', marginBottom: 8 }}>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span>{u.remarks}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                        {u.image1 && (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={getUpSurveyMediaUrl(u.image1)}
                              alt="Survey 1"
                              style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                              onClick={() => onPreview(getUpSurveyMediaUrl(u.image1), 'Survey Image 1')}
                            />
                            <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Image 1</span>
                          </div>
                        )}
                        {u.image2 && (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={getUpSurveyMediaUrl(u.image2)}
                              alt="Survey 2"
                              style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                              onClick={() => onPreview(getUpSurveyMediaUrl(u.image2), 'Survey Image 2')}
                            />
                            <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Image 2</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ax-text-muted)' }}>
                  No survey photos uploaded yet for this site.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="ax-modal__footer">
        <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Main Component ───────── */
export function UP_Survey_SSL_ViewData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpSslViewDataResponse>({
    total: 0,
    incomplete_count: 0,
    complete_count: 0,
    incomplete_ssl: [],
    complete_ssl: [],
  });

  const [activeTab, setActiveTab] = useState<'incomplete' | 'complete'>('incomplete');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [detailItem, setDetailItem] = useState<UpSslSiteRecord | null>(null);

  // Photo preview modal (lightbox zoom — Jammu pattern)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load View Data
  const loadData = useCallback(() => {
    setLoading(true);
    upSurveyService
      .getViewSslData()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Error fetching UP SSL view data:', err);
        setToastMsg({ type: 'danger', text: err?.message || 'Failed to load SSL survey data from server.' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current tab items
  const tabList = useMemo(() => {
    return activeTab === 'complete' ? data.complete_ssl : data.incomplete_ssl;
  }, [data, activeTab]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const list = tabList.map((r) => r.district).filter(Boolean);
    return Array.from(new Set(list));
  }, [tabList]);

  // Search + district filter
  const filteredList = useMemo(() => {
    let list = tabList;

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district === districtFilter);
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => {
      return (
        String(s.uid || '').toLowerCase().includes(q) ||
        String(s.state || '').toLowerCase().includes(q) ||
        String(s.district || '').toLowerCase().includes(q) ||
        String(s.block || s.village || '').toLowerCase().includes(q) ||
        String(s.contact || s.contact_no || '').toLowerCase().includes(q) ||
        String(s.beneficiary_name || '').toLowerCase().includes(q)
      );
    });
  }, [tabList, search, districtFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const hasFilters = !!search || districtFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setPage(1);
  };

  // Percentage helper
  const pct = (n: number, total: number) => (total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%');

  // Export Columns definition
  const exportCols: ExportColumn<UpSslSiteRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, i?: number) => (i !== undefined ? i + 1 : 1) },
      { header: 'State', accessor: (r: any) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r: any) => r.district || DASH },
      { header: 'Block', accessor: (r: any) => r.block || r.village || DASH },
      { header: 'Contact NO', accessor: (r: any) => r.contact || r.contact_no || DASH },
      { header: 'Beneficery Name', accessor: (r: any) => r.beneficiary_name || DASH },
      { header: 'UID', accessor: (r: any) => r.uid || DASH },
      { header: 'Survey Status', accessor: () => (activeTab === 'complete' ? 'Complete' : 'Incomplete') },
    ],
    [activeTab]
  );

  /* ── Export handlers ── */
  const handleCopy = () => {
    copyTableDataToClipboard(filteredList, exportCols);
    setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
  };
  const handleCsv = () => exportDataToCSV('UP_SSL_Sites', filteredList, exportCols);
  const handleExcel = () => exportDataToExcel('UP_SSL_Sites', filteredList, exportCols);
  const handlePdf = () => printTableData('Vendor UP SSL Sites', filteredList, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Welcome to, View UP SSl Site"
        subtitle="View and manage Uttar Pradesh Solar Street Light survey sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'SSL' },
          { label: 'View Data' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* Toast notification (Jammu pattern) */}
      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row — Jammu pattern) ── */}
      {loading ? (
        <div className="asw-cards-row"><KpiSkeleton count={4} /></div>
      ) : (
        <div className="asw-cards-row">
          <KpiCard
            tone="accent"
            label="Total Sites"
            value={data.total.toLocaleString('en-IN')}
            sub="All SSL survey sites"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
            }
          />

          <KpiCard
            tone="amber"
            label="Incomplete Sites"
            value={data.incomplete_count.toLocaleString('en-IN')}
            sub="Pending survey"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />

          <KpiCard
            tone="emerald"
            label="Completed Sites"
            value={data.complete_count.toLocaleString('en-IN')}
            sub="Survey completed"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            }
          />

          <KpiCard
            tone="violet"
            label="Completion Rate"
            value={pct(data.complete_count, data.total)}
            sub={`${data.incomplete_count} sites remaining`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            }
          />
        </div>
      )}

      {/* ── Tabs ABOVE Table (Jammu pattern — ax-btn style) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Survey status filter" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'incomplete'}
            className={`ax-btn ax-btn--sm ${activeTab === 'incomplete' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => { setActiveTab('incomplete'); setPage(1); setDistrictFilter('all'); }}
          >
            <span className="ax-btn__label">
              Incomplete ({loading ? '…' : data.incomplete_count})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'complete'}
            className={`ax-btn ax-btn--sm ${activeTab === 'complete' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => { setActiveTab('complete'); setPage(1); setDistrictFilter('all'); }}
          >
            <span className="ax-btn__label">
              Complete ({loading ? '…' : data.complete_count})
            </span>
          </button>
        </div>
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP SSL Survey Sites">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {activeTab === 'complete' ? 'Completed SSL Sites' : 'Incomplete SSL Sites'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredList.length}</span> of <span className="ax-num">{tabList.length}</span> sites
                {' '}· Total <b className="ax-num">{data.total}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter (Jammu pattern) */}
                {distinctDistricts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {distinctDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => { setSearch(val); setPage(1); }}
                  placeholder="Search UID, name, district…"
                  size="sm"
                  ariaLabel="Search SSL sites"
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

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">UP SSL Survey Sites</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Contact NO</th>
                  <th className="ax-table__th" scope="col">Beneficery Name</th>
                  <th className="ax-table__th" scope="col">UID</th>
                  <th className="ax-table__th" scope="col" style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading UP SSL sites…
                    </td>
                  </tr>
                )}
                {!loading && filteredList.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No sites match your filters or search. Try clearing your query.'
                            : `There are currently no ${activeTab} SSL sites.`
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pageData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={row.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{srNo}</td>
                        <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                        <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                        <td className="ax-table__td">{txt(row.block || row.village)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>{txt(row.contact || row.contact_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.beneficiary_name)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 11 }}>{txt(row.uid)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            title="View site details"
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

          {/* ── Footer & Pagination (Jammu pattern) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredList.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                pageSizeOptions={[50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Detail Modal ── */}
      <DetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPreview={openPreview}
      />

      {/* ── Photo Preview Modal (Zoom, Fullscreen — Jammu pattern) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export const UPSurveySSLViewData = UP_Survey_SSL_ViewData;
export default UP_Survey_SSL_ViewData;