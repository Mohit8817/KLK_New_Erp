import { useEffect, useMemo, useRef, useState, type FormEvent, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirInstallationSummaryData,
  type KashmirInstalledSiteItem,
} from '../../kashmir-services';
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

type Row = KashmirInstalledSiteItem;
type TabFilter = 'Completed' | 'Payment';
type VerifyStatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const DASH = '—';
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ───────── Responsive page CSS (Matching Arunachal Reference) ───────── */
const PAGE_CSS = `
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

  /* Modal & Lightbox Styles */
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
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__body {
    padding: 0; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: #0f172a;
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI Card (Arunachal style, extended tones for 12 cards) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'red' | 'violet' | 'indigo';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  red: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#ef4444' },
  violet: { bg: 'rgba(139, 92, 246, 0.12)', fg: '#8b5cf6' },
  indigo: { bg: 'rgba(99, 102, 241, 0.12)', fg: '#6366f1' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--4 ax-col--6@md ax-col--12@sm" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Close Icon ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Image Thumbnail ───────── */
function InstallationThumbnail({
  path,
  alt,
  onPreview,
  size = 36,
}: {
  path?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [path]);

  if (!path || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  const full = getKashmirMediaUrl(path);

  return (
    <img
      src={full}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setHasError(true)}
      onClick={() => onPreview(full, alt)}
      title="Click to preview photograph"
    />
  );
}

/* ───────── Image Preview Modal (Matching Arunachal) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="kashmir-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="kashmir-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Installation Photograph'}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && (
              <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>
            )}
            {status === 'error' && (
              <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>
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

        <div className="ax-modal__footer">
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Raise Claim Modal ───────── */
function RaiseClaimModal({
  site,
  onClose,
  onSuccess,
}: {
  site: Row;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoice, setClaimInvoice] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimAmount || Number(claimAmount) <= 0) {
      setErr('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoice) {
      setErr('Please upload claim invoice file (PDF/Image).');
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('srt_id', String(site.id));
      fd.append('claim_amount', claimAmount);
      fd.append('claim_invoice', claimInvoice);

      const resp = await kashmirSrtService.raiseInstallationClaim(fd);
      onSuccess(resp.message || 'Claim raised Successfully!!!');
      onClose();
    } catch (error: any) {
      setErr(error.message || 'Failed to raise claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth: 520 }}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" style={{ fontSize: 15, fontWeight: 600 }}>Raise Installation Claim</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--ax-text-muted)' }}>
              Site: <b>{site.site_name}</b> (ID: #{site.id})
            </div>
            {err && (
              <div className="ax-alert ax-alert--danger" role="alert">
                <div className="ax-alert__text">{err}</div>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Claim Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="ax-input"
                style={{ width: '100%' }}
                placeholder="Enter claim amount"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Claim Invoice Document (PDF/JPG/PNG max 5MB) *
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="ax-input"
                style={{ width: '100%' }}
                onChange={(e) => setClaimInvoice(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
              Note: Claims are applicable only after 7 days of site installation.
            </div>
          </div>
          <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Document Submit Modal ───────── */
function DocumentSubmitModal({
  site,
  onClose,
  onSuccess,
}: {
  site: Row;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isAlreadySubmitted = site.inst_doc_submit === 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const resp = await kashmirSrtService.submitDocument(site.id);
      onSuccess(resp.message || 'Document Submitted Successfully!!!');
      onClose();
    } catch (error: any) {
      setErr(error.message || 'Failed to submit document.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="kashmir-doc-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth: 520 }}>
        <div className="ax-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: 'var(--ax-primary)' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h2 className="ax-modal__title" id="kashmir-doc-title" style={{ fontSize: 15, fontWeight: 600 }}>
              Submit Installation Document
            </h2>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div className="ax-alert ax-alert--danger" role="alert">
              <div className="ax-alert__text">{err}</div>
            </div>
          )}

          <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: 14, borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{site.site_name || `Site #${site.id}`}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Site ID:</span> <b>#{site.id}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(site.district)}</b></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ color: 'var(--ax-text-muted)' }}>Document Status:</span>
              {isAlreadySubmitted ? (
                <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                  <span className="ax-badge__dot" /> Submitted
                </span>
              ) : (
                <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>
                  <span className="ax-badge__dot" /> Pending Submission
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
            {isAlreadySubmitted
              ? 'The installation document for this site has already been submitted to the department. You can re-submit if needed.'
              : 'Submitting will mark the site documentation as complete and send it to the department for verification.'}
          </p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : isAlreadySubmitted ? 'Re-Submit Document' : 'Submit Document'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── View Detail Modal (New — matching Arunachal pattern) ───────── */
function SiteDetailModal({
  site,
  onClose,
  onPreview,
}: {
  site: Row;
  onClose: () => void;
  onPreview: (url: string, title: string) => void;
}) {
  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="kashmir-detail-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div className="ax-modal__dialog" style={{ maxWidth: 640 }}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="kashmir-detail-title" style={{ fontSize: 15, fontWeight: 600 }}>
            Site Detail: {site.site_name || `Site #${site.id}`}
          </h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>ID:</span> <b>#{site.id}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{site.state || 'Kashmir'}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(site.district)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{txt(site.site_name)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Person:</span> <b>{txt(site.contact_person)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Number:</span> <b>{txt(site.contact_number)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Solar Meter No.:</span> <b>{txt(site.solarmeter_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Inverter No.:</span> <b>{txt(site.inverter_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Net/Smart Meter:</span> <b>{txt(site.nm_sm_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Panel No.:</span> <b>{Array.isArray(site.panel_no) ? site.panel_no.join(', ') : txt(site.panel_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Loger No.:</span> <b>{txt(site.loger_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{txt(site.inst_latitude)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{txt(site.inst_longitude)}</b></div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remark:</span> <b>{txt(site.inst_remarks)}</b></div>
          </div>

          {/* Photo gallery */}
          {[
            { path: site.system_image, label: 'System Photo' },
            { path: site.inverter_image, label: 'Inverter Photo' },
            { path: site.panel_image, label: 'Panel Photo' },
            { path: site.nm_sm_image, label: 'Net Meter/Smart Meter Photo' },
            { path: site.loger_image, label: 'Loger Photo' },
          ].some((img) => img.path) && (
            <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>
                Installation Photographs:
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { path: site.system_image, label: 'System Photo' },
                  { path: site.inverter_image, label: 'Inverter Photo' },
                  { path: site.panel_image, label: 'Panel Photo' },
                  { path: site.nm_sm_image, label: 'Net Meter/Smart Meter Photo' },
                  { path: site.loger_image, label: 'Loger Photo' },
                ].filter((img) => img.path).map((img) => (
                  <div key={img.label} style={{ textAlign: 'center' }}>
                    <img
                      src={getKashmirMediaUrl(img.path!)}
                      alt={img.label}
                      style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                      onClick={() => onPreview(getKashmirMediaUrl(img.path!), `${site.site_name || 'Site'} - ${img.label}`)}
                    />
                    <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', marginTop: 4 }}>{img.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Filter Tabs ───────── */
const FILTER_TABS: { key: TabFilter; label: string }[] = [
  { key: 'Completed', label: 'Completed SRT 70MW' },
  { key: 'Payment', label: 'Payment SRT 70MW' },
];

/* ───────── Main Component ───────── */
export function Kashmir_Installation_Details() {
  const location = useLocation();
  const [tab, setTab] = useState<TabFilter>('Completed');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<KashmirInstallationSummaryData | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const [claimModalSite, setClaimModalSite] = useState<Row | null>(null);
  const [detailModalSite, setDetailModalSite] = useState<Row | null>(null);
  const [docModalSite, setDocModalSite] = useState<Row | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (openActionId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionId]);

  // Sync hash
  useEffect(() => {
    if (location.hash === '#Payment') {
      setTab('Payment');
    } else {
      setTab('Completed');
    }
  }, [location.hash]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await kashmirSrtService.getViewInstallSites();
      setSummary(resp);
    } catch (err: any) {
      console.error('Failed to load installed sites summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeSites: Row[] = summary?.completesite || [];
  const paymentSites: Row[] = summary?.paymentsite || [];
  const currentList = tab === 'Completed' ? completeSites : paymentSites;

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district && String(r.district).trim()) set.add(String(r.district).trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  // Filtered Sites
  const filteredSites = useMemo(() => {
    return currentList.filter((r) => {
      if (districtFilter !== 'all') {
        const d = (r.district || '').toLowerCase();
        if (d !== districtFilter.toLowerCase()) return false;
      }

      if (tab === 'Completed' && verifyFilter !== 'all') {
        const vStatus = Number(r.inst_verify_status ?? 0);
        if (verifyFilter === 'approved' && vStatus !== 1) return false;
        if (verifyFilter === 'pending' && vStatus !== 0) return false;
        if (verifyFilter === 'rejected' && vStatus !== 2) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          r.site_name, r.contact_person, r.contact_number,
          r.inverter_no, r.solarmeter_no, r.nm_sm_no, r.loger_no, r.district,
        ];
        if (!hay.some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      }

      return true;
    });
  }, [currentList, districtFilter, verifyFilter, search, tab]);

  // Pagination
  const pagedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, districtFilter, verifyFilter, search]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || verifyFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    setCurrentPage(1);
  };

  // Export Columns
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (r: Row) => String(r.id || DASH) },
      { header: 'State', accessor: (r) => r.state || 'Kashmir' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Panel No.', accessor: (r) => (Array.isArray(r.panel_no) ? r.panel_no.join(', ') : r.panel_no || DASH) },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => String(r.inst_latitude ?? DASH) },
      { header: 'Longitude', accessor: (r) => String(r.inst_longitude ?? DASH) },
      { header: 'Remark', accessor: (r) => r.inst_remarks || DASH },
      ...(tab === 'Completed'
        ? [
            {
              header: 'Verify Status',
              accessor: (r: Row) =>
                r.inst_verify_status === 1 ? 'Approved' : r.inst_verify_status === 2 ? 'Rejected' : 'Pending',
            },
            {
              header: 'Claim Status',
              accessor: (r: Row) =>
                r.inst_claim_status === 2 ? 'Approved' : r.inst_claim_status === 1 ? 'Raised' : 'Not Raised',
            },
          ]
        : []),
    ],
    [tab]
  );

  // Export handlers
  const handleCopy = () => copyTableDataToClipboard(filteredSites, exportCols);
  const handleCsv = () => exportDataToCSV(`Kashmir_SRT_70MW_${tab}_Installation_Sites`, filteredSites, exportCols);
  const handleExcel = () => exportDataToExcel(`Kashmir_SRT_70MW_${tab}_Installation_Sites`, filteredSites, exportCols);
  const handlePdf = () => printTableData(`Kashmir SRT 70MW ${tab} Installation Sites Report`, filteredSites, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Kashmir SRT 70MW Installation"
        subtitle="Master register of completed solar rooftop installations, payment stage sites, serial verifications, and compliance photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Installation Details' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ax-alert--${toast.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toast.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toast.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row (12 Cards — 3 per row × 4 rows) ── */}
        {loading ? (
          <KpiSkeleton count={12} />
        ) : (
          <>
            {/* Row 1: Main Metrics */}
            <KpiCard
              tone="accent"
              label="Total Assigned Lights"
              value={num(summary?.totalsite)}
              sub="All sites assigned for installation"
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8m8 4H8m2-8H8" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Complete Lights"
              value={num(summary?.complete)}
              sub="Installation completed on-site"
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Pending"
              value={num(summary?.pendingsite)}
              sub="Awaiting installation"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </>
              )}
            />

            {/* Row 2: Verification Status */}
            <KpiCard
              tone="emerald"
              label="Approve Lights"
              value={num(summary?.approvedsite)}
              sub="Verified and approved"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="red"
              label="Reject Lights"
              value={num(summary?.rejectsite)}
              sub="Verification rejected"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6" />
                  <path d="M9 9l6 6" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Verify Pending"
              value={num(summary?.verifypending)}
              sub="Awaiting verification audit"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M12 8v4m0 4h.01" />
                </>
              )}
            />

            {/* Row 3: Claim Metrics */}
            <KpiCard
              tone="violet"
              label="Claim Applicable"
              value={num(summary?.claimedapplicable)}
              sub="Eligible for claim after 7 days"
              icon={svgIcon(
                <>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Claim Raised"
              value={num(summary?.claimraised)}
              sub="Claims submitted for review"
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M12 18v-6" />
                  <path d="M9 15l3-3 3 3" />
                </>
              )}
            />
            <KpiCard
              tone="indigo"
              label="DOC Submit"
              value={num(summary?.docsubmit)}
              sub="Documents submitted for processing"
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />

            {/* Row 4: Payment Metrics */}
            <KpiCard
              tone="emerald"
              label="Payment 80%"
              value={num(summary?.payment80)}
              sub="First tranche disbursed"
              icon={svgIcon(
                <>
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Payment 20%"
              value={num(summary?.payment20)}
              sub="Final tranche disbursed"
              icon={svgIcon(
                <>
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <circle cx="16" cy="15" r="2" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Payment Done"
              value={num(summary?.paymentsitecount)}
              sub="Full payment completed"
              icon={svgIcon(
                <>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installation filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === tab;
              const count = t.key === 'Completed' ? completeSites.length : paymentSites.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setTab(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Data Table ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Kashmir SRT 70MW Installation Details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {tab === 'Completed' ? 'Completed SRT 70MW Data' : 'Payment SRT 70MW Data'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{currentList.length}</span> installations
                {' '}· Total <b className="ax-num">{num(summary?.totalsite)}</b> · Verified <b className="ax-num">{num(summary?.approvedsite)}</b> · Paid <b className="ax-num">{num(summary?.paymentsitecount)}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter */}
                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    aria-label="Filter by district"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {/* Verification Status Filter (completed tab only) */}
                {tab === 'Completed' && (
                  <select
                    className="ax-input ax-input--sm"
                    aria-label="Filter by verify status"
                    style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={verifyFilter}
                    onChange={(e) => { setVerifyFilter(e.target.value as VerifyStatusFilter); setCurrentPage(1); }}
                  >
                    <option value="all">All Verification</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search site, meter, serial…"
                  size="sm"
                  ariaLabel="Search installations"
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

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover"
              style={{ whiteSpace: 'nowrap', minWidth: 2400 }}
            >
              <caption className="ax-visually-hidden">Kashmir SRT 70MW Installation Details</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Panel No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col">System Image</th>
                  <th className="ax-table__th" scope="col">Inverter Image</th>
                  <th className="ax-table__th" scope="col">Panel Image</th>
                  <th className="ax-table__th" scope="col">Net Meter Image</th>
                  <th className="ax-table__th" scope="col">Loger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 140 }}>Remark</th>
                  {tab === 'Completed' ? (
                    <>
                      <th className="ax-table__th" scope="col">Verify Status</th>
                      <th className="ax-table__th" scope="col">Claim Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 120 }}>Action</th>
                    </>
                  ) : (
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 120 }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={tab === 'Completed' ? 22 : 20} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading installation sites from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td colSpan={tab === 'Completed' ? 22 : 20} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={search ? 'No installation sites match your search keyword.' : 'No installation records available.'}
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading && pagedSites.map((item, index) => {
                  const srNo = (currentPage - 1) * pageSize + index + 1;
                  const vStatus = Number(item.inst_verify_status ?? 0);
                  const cStatus = Number(item.inst_claim_status ?? 0);
                  const isApproved = vStatus === 1;
                  const isRejected = vStatus === 2;
                  const isClaimApproved = cStatus === 2;
                  const isClaimRaised = cStatus === 1;

                  return (
                    <tr key={item.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{item.state || 'Kashmir'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {item.site_name || `Site #${item.id}`}
                      </td>
                      <td className="ax-table__td">{txt(item.contact_person)}</td>
                      <td className="ax-table__td">{txt(item.contact_number)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.solarmeter_no)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.inverter_no)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.nm_sm_no)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {Array.isArray(item.panel_no) ? item.panel_no.join(', ') : txt(item.panel_no)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.loger_no)}</td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          path={item.system_image}
                          alt={`${item.site_name || 'Site'} - System Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          path={item.inverter_image}
                          alt={`${item.site_name || 'Site'} - Inverter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          path={item.panel_image}
                          alt={`${item.site_name || 'Site'} - Panel Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          path={item.nm_sm_image}
                          alt={`${item.site_name || 'Site'} - Net Meter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          path={item.loger_image}
                          alt={`${item.site_name || 'Site'} - Loger Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.inst_latitude)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.inst_longitude)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                        {txt(item.inst_remarks)}
                      </td>
                      {tab === 'Completed' && (
                        <>
                          {/* Verify Status Badge (Arunachal style with dot) */}
                          <td className="ax-table__td">
                            <span
                              className={`ax-badge ax-badge--soft ax-badge--pill ${
                                isApproved ? 'ax-badge--success' : isRejected ? 'ax-badge--danger' : 'ax-badge--warning'
                              }`}
                            >
                              <span className="ax-badge__dot" />
                              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                            </span>
                          </td>

                          {/* Claim Status — Raise Claim button when Not Raised */}
                          <td className="ax-table__td">
                            {isClaimApproved ? (
                              <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success">
                                <span className="ax-badge__dot" />
                                Approved
                              </span>
                            ) : isClaimRaised ? (
                              <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--info">
                                <span className="ax-badge__dot" />
                                Raised
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--xs"
                                style={{ padding: '2px 10px', fontSize: 11, whiteSpace: 'nowrap', borderRadius: 9999 }}
                                onClick={() => setClaimModalSite(item)}
                                title="Raise a new claim for this site"
                              >
                                Raise Claim
                              </button>
                            )}
                          </td>
                        </>
                      )}

                      {/* Action Dropdown column (View, Edit, Document) */}
                      <td className="ax-table__td" style={{ textAlign: 'center', position: 'relative' }}>
                        <div
                          className="ax-dropdown"
                          ref={openActionId === item.id ? actionMenuRef : undefined}
                          style={{ position: 'relative', display: 'inline-block' }}
                        >
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{
                              padding: '3px 10px',
                              fontSize: 12,
                              borderRadius: 'var(--ax-radius-pill, 9999px)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontWeight: 500,
                              boxShadow: 'var(--ax-shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(openActionId === item.id ? null : item.id);
                            }}
                            aria-haspopup="true"
                            aria-expanded={openActionId === item.id}
                            title="Actions menu"
                          >
                            <span>Action</span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              style={{
                                width: 12,
                                height: 12,
                                transition: 'transform 0.15s ease',
                                transform: openActionId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </button>

                          {openActionId === item.id && (
                            <div
                              className="ax-menu"
                              style={{
                                position: 'absolute',
                                right: 0,
                                ...(index >= pagedSites.length - 2 && pagedSites.length > 2
                                  ? { bottom: 'calc(100% + 4px)', top: 'auto' }
                                  : { top: 'calc(100% + 4px)' }),
                                minWidth: 140,
                                zIndex: 1050,
                                padding: 4,
                                borderRadius: 8,
                                background: 'var(--ax-surface-solid, #ffffff)',
                                border: '1px solid var(--ax-border, #e2e8f0)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                textAlign: 'left',
                              }}
                            >
                              {/* 1. View */}
                              <button
                                type="button"
                                className="ax-menu__item"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  border: 0,
                                  background: 'transparent',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  color: 'var(--ax-text, #1e293b)',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(null);
                                  setDetailModalSite(item);
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: '#2563eb', flexShrink: 0 }}>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span style={{ fontWeight: 500 }}>View</span>
                              </button>

                              {/* 2. Edit */}
                              <Link
                                to={`/v/kashmir/srt/70mw/installation/site?edit=1&srt_id=${item.id}`}
                                className="ax-menu__item"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  borderRadius: 6,
                                  textDecoration: 'none',
                                  color: 'var(--ax-text, #1e293b)',
                                }}
                                onClick={() => setOpenActionId(null)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span style={{ fontWeight: 500 }}>Edit</span>
                              </Link>

                              {/* 3. Document */}
                              <button
                                type="button"
                                className="ax-menu__item"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  border: 0,
                                  background: 'transparent',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  color: 'var(--ax-text, #1e293b)',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(null);
                                  setDocModalSite(item);
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                <span style={{ fontWeight: 500 }}>Document</span>
                                {item.inst_doc_submit === 1 && (
                                  <span
                                    style={{
                                      marginLeft: 'auto',
                                      fontSize: 9,
                                      fontWeight: 700,
                                      color: '#10b981',
                                      background: '#ecfdf5',
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      border: '1px solid #a7f3d0',
                                    }}
                                    title="Document submitted"
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer & Left-aligned Pagination ── */}
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredSites.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── Raise Claim Modal ── */}
      {claimModalSite && (
        <RaiseClaimModal
          site={claimModalSite}
          onClose={() => setClaimModalSite(null)}
          onSuccess={(msg) => {
            setToast({ type: 'success', text: msg });
            loadData();
          }}
        />
      )}

      {/* ── View Detail Modal ── */}
      {detailModalSite && (
        <SiteDetailModal
          site={detailModalSite}
          onClose={() => setDetailModalSite(null)}
          onPreview={openPreview}
        />
      )}

      {/* ── Document Submit Modal ── */}
      {docModalSite && (
        <DocumentSubmitModal
          site={docModalSite}
          onClose={() => setDocModalSite(null)}
          onSuccess={(msg) => {
            setToast({ type: 'success', text: msg });
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default Kashmir_Installation_Details;