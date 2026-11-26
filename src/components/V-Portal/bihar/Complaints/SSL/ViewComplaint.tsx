import { useEffect, useMemo, useState, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharComplaintService,
  getBiharComplaintMediaUrl,
  type BiharComplaintItem,
} from '../../bihar-services';
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

type Row = BiharComplaintItem & Record<string, any>;
type StatusFilter = 'all' | 'pending' | 'closed';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ── Status helpers ──
   Pending = not yet resolved / close_status !== 1
   Closed  = resolved (close_status === 1) */
const isAssigned = (r: Row) => {
  const a = String((r as any).assigned_to ?? '').trim();
  return a !== '' && a !== '0' && a.toLowerCase() !== 'null';
};
const isResolved = (r: Row) => Number(r.close_status) === 1 || Number(r.status) === 1;
const isClosed = (r: Row) => isResolved(r);
const isLocked = (r: Row) => isAssigned(r) || isResolved(r);
const statusLabel = (r: Row) => (isClosed(r) ? 'Closed' : isAssigned(r) ? 'Assigned' : 'Pending');

/* ───────── Responsive page CSS (Exact matching Bihar SSL AMC Reference) ───────── */
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

  /* Modal & Lightbox Styles (Exact from Bihar SSL AMC Reference) */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ax-modal--top { z-index: 10000; }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff; border-radius: 16px;
    border: 1px solid var(--ax-border, #e2e8f0); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--ax-text-muted, #64748b);
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #f1f5f9);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 0; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 14px 20px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
  .ula-m-stage { position: relative; display: flex; overflow: auto; height: min(66vh, 600px); background: #0f172a; }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

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
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Photo lightbox (Zoom controls like Bihar SSL AMC reference) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal ax-modal--top" role="dialog" aria-modal="true" aria-labelledby="ssl-comp-img-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="ssl-comp-img-title" style={{ fontSize: 15, fontWeight: 600 }}>{title}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading document / photo…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Document could not be previewed directly. Try opening it in a new tab.</div>}
            <img
              key={src}
              src={src}
              alt={title}
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
            <a href={src} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Detail modal helpers (Exact from Bihar SSL AMC Reference) ───────── */
function Field({ label, children, span }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block' }}>{label}</span>
      <b>{children}</b>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 12,
          fontSize: 13,
          padding: 14,
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 10,
          background: 'var(--ax-surface-subtle, #f8fafc)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── View SSL Complaint Detail Modal ───────── */
function ComplaintDetailModal({
  item,
  onClose,
  onImageClick,
  onEdit,
  onDelete,
}: {
  item: Row;
  onClose: () => void;
  onImageClick: (src: string, title: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const closed = isClosed(item);
  const assigned = isAssigned(item);
  const locked = isLocked(item);

  const lat = item.latitude;
  const lng = item.longitude;

  // Gather documents & photos
  const docs: { label: string; path?: string | null }[] = [
    { label: 'Defect / Breakdown Photo', path: item.file },
    { label: 'Resolution Photo', path: item.r_file },
    { label: 'Attachment 2', path: item.file2 },
    { label: 'Attachment 3', path: item.file3 },
  ].filter((d) => Boolean(d.path));

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ssl-comp-detail-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth: 900 }}>
        <div className="ax-modal__header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="ax-modal__title" id="ssl-comp-detail-title" style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                SSL Complaint Details: #{item.complaint_id}
              </h2>
              <span className={`ax-badge ax-badge--soft ax-badge--pill ${closed ? 'ax-badge--success' : assigned ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                <span className="ax-badge__dot" />
                {closed ? 'Closed' : assigned ? 'Assigned' : 'Pending'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Pole No: <b style={{ color: 'var(--ax-text-strong)' }}>{txt(item.pole_no)}</b>
              {item.uid ? ` · UID: ${item.uid}` : ''}
              {item.complaint_issue ? ` · Issue: ${item.complaint_issue}` : ''}
            </div>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: Complaint / Grievance Info */}
          <Section title="Complaint & Grievance Information">
            <Field label="Complaint ID">#{item.complaint_id}</Field>
            <Field label="Complaint Date">{txt(item.complaint_date || item.start_date || (item as any).created_at)}</Field>
            <Field label="Complaint Issue">{txt(item.complaint_issue)}</Field>
            <Field label="Complaint Source">{txt(item.complaint_source || (item as any).source)}</Field>
            <Field label="Created By">{txt(item.created_by || item.complaint_raised_by || item.raised_complaint || item.assigned_vendor_name || 'Vendor')}</Field>
            <Field label="Status">
              <span className={`ax-badge ax-badge--soft ax-badge--pill ${closed ? 'ax-badge--success' : assigned ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                {statusLabel(item)}
              </span>
            </Field>
            <Field label="Complaint Description" span>
              <span style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{txt(item.complaint)}</span>
            </Field>
          </Section>

          {/* Section 2: Site & Location */}
          <Section title="Site & Location">
            <Field label="State">{txt(item.state || 'Bihar')}</Field>
            <Field label="District">{txt(item.district)}</Field>
            <Field label="Block">{txt(item.block)}</Field>
            <Field label="Panchayat">{txt(item.panchyat || item.panchayat)}</Field>
            <Field label="Phase">{txt(item.phase)}</Field>
            <Field label="Address / Village">{txt(item.address || item.location || item.village)}</Field>
            <Field label="Ward No.">{txt(item.ward_no)}</Field>
            <Field label="Pole No.">{txt(item.pole_no)}</Field>
            <Field label="Along with Pole">{txt(item.along_with_pole)}</Field>
            <Field label="GPS Latitude">{txt(lat)}</Field>
            <Field label="GPS Longitude">{txt(lng)}</Field>
            {lat && lng && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block' }}>Map Location</span>
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--ghost ax-btn--xs"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  View on Google Maps ↗
                </a>
              </div>
            )}
          </Section>

          {/* Section 3: Beneficiary */}
          <Section title="Beneficiary Information">
            <Field label="Beneficiary Name">{txt(item.beneficiary_name)}</Field>
            <Field label="Contact No.">
              {item.contact_no ? (
                <a href={`tel:${item.contact_no}`} style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}>
                  {item.contact_no}
                </a>
              ) : (
                DASH
              )}
            </Field>
          </Section>

          {/* Section 4: Hardware / Technical Details */}
          <Section title="Hardware / Technical Details">
            <Field label="Light No.">{txt(item.light_no || item.luminary_no)}</Field>
            <Field label="Luminary No.">{txt(item.luminary_no || item.light_no)}</Field>
            <Field label="SIM No.">{txt(item.sim_no)}</Field>
            <Field label="Battery Serial No.">{txt(item.battery_serial_no)}</Field>
            <Field label="Module No.">{txt(item.module_no)}</Field>
            <Field label="Date of Installation">{txt(item.date_of_installation || item.inst_date)}</Field>
          </Section>

          {/* Section 5: Resolution / Closure (if closed) */}
          {(closed || item.remarks || item.resolved_by || item.close_date) && (
            <Section title="Resolution & Closure Information">
              <Field label="Resolved By">{txt(item.resolved_by || (item as any).assigned_vendor_name)}</Field>
              <Field label="Close Date">{txt(item.close_date || item.manual_close_date)}</Field>
              <Field label="Close Beneficiary Name">{txt(item.close_beneficiary_name)}</Field>
              <Field label="Close Beneficiary Contact">{txt(item.close_beneficiary_contact)}</Field>
              <Field label="Resolution Remarks" span>
                <span style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{txt(item.remarks)}</span>
              </Field>
            </Section>
          )}

          {/* Section 6: Documents & Photos */}
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Complaint Documents & Photographs
            </h3>
            {docs.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  border: '1px dashed var(--ax-border, #cbd5e1)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--ax-text-muted)',
                  textAlign: 'center',
                }}
              >
                No documents or photographs attached with this complaint.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {docs.map((doc) => {
                  const url = doc.path ? getBiharComplaintMediaUrl(doc.path, 'ssl') : '';
                  return (
                    <div key={doc.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200 }}>
                      {url ? (
                        <img
                          src={url}
                          alt={doc.label}
                          onClick={() => onImageClick(url, `${doc.label} - Complaint #${item.complaint_id}`)}
                          title="Click to zoom photograph"
                          style={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                            cursor: 'zoom-in',
                            border: '1px solid var(--ax-border, #cbd5e1)',
                            background: 'var(--ax-surface-subtle, #f8fafc)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed var(--ax-border, #cbd5e1)',
                            fontSize: 12,
                            color: 'var(--ax-text-muted)',
                          }}
                        >
                          No document available
                        </div>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{doc.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="ax-modal__footer">
          <div>
            {!locked && onEdit && onDelete && (
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onEdit}>
                  Edit Complaint
                </button>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onDelete} style={{ color: 'var(--ax-danger, #ef4444)' }}>
                  Delete
                </button>
              </div>
            )}
          </div>
          <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All Complaints' },
  { key: 'pending', label: 'Pending Complaints' },
  { key: 'closed', label: 'Closed Complaints' },
];

export function Bihar_Complaint_SSL_ViewComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [complaints, setComplaints] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals (Reference design from Bihar SSL AMC)
  const [detailComplaint, setDetailComplaint] = useState<Row | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await biharComplaintService.getViewSslComplaints();
      const list = Array.isArray(data) ? data : [];
      setComplaints(list);
      if (!list.length) setErrorMsg('No complaint tickets have been submitted yet.');
    } catch (err: any) {
      console.error('Error loading SSL complaints:', err);
      setErrorMsg(err?.message || 'Failed to load complaints from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.district && String(c.district).trim()) set.add(String(c.district).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((item) => {
      if (statusFilter === 'pending' && isClosed(item)) return false;
      if (statusFilter === 'closed' && !isClosed(item)) return false;
      if (selectedDistrict !== 'all' && String(item.district || '').trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (!q) return true;
      const haystack = [
        item.complaint_id,
        item.uid,
        item.complaint_issue,
        item.complaint,
        item.complaint_source,
        item.state,
        item.district,
        item.block,
        item.panchyat || item.panchayat,
        item.phase,
        item.address || item.location || item.village,
        item.ward_no,
        item.pole_no,
        item.light_no,
        item.beneficiary_name,
        item.contact_no,
        item.luminary_no,
        item.sim_no,
        item.battery_serial_no,
        item.module_no,
        item.created_by,
        item.complaint_raised_by,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [complaints, statusFilter, selectedDistrict, search]);

  const pagedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredComplaints.slice(start, start + pageSize);
  }, [filteredComplaints, currentPage, pageSize]);

  const kpis = useMemo(() => {
    const total = complaints.length;
    const closed = complaints.filter(isClosed).length;
    return { total, pending: total - closed, closed };
  }, [complaints]);

  const closedPct = kpis.total > 0 ? Math.round((kpis.closed / kpis.total) * 100) : 0;

  /* ── Export Columns (All 28 data fields matching user list) ── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. no.', accessor: (_r, i) => (i !== undefined ? i + 1 : '') },
      { header: 'Complaint ID', accessor: (r) => r.complaint_id ?? '' },
      { header: 'Complaint Date', accessor: (r) => r.complaint_date || r.start_date || (r as any).created_at || '' },
      { header: 'Complaint Issue', accessor: (r) => r.complaint_issue ?? '' },
      { header: 'Complaint', accessor: (r) => r.complaint ?? '' },
      { header: 'Complaint Source', accessor: (r) => r.complaint_source || (r as any).source || '' },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => r.district ?? '' },
      { header: 'Block', accessor: (r) => r.block ?? '' },
      { header: 'Panchayat', accessor: (r) => r.panchyat || r.panchayat || '' },
      { header: 'Phase', accessor: (r) => r.phase ?? '' },
      { header: 'Address', accessor: (r) => r.address || r.location || r.village || '' },
      { header: 'Ward No', accessor: (r) => r.ward_no ?? '' },
      { header: 'Pole No', accessor: (r) => r.pole_no ?? '' },
      { header: 'Light No', accessor: (r) => r.light_no || r.luminary_no || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name ?? '' },
      { header: 'Contact No', accessor: (r) => r.contact_no ?? '' },
      { header: 'Latitude', accessor: (r) => r.latitude ?? '' },
      { header: 'Longitude', accessor: (r) => r.longitude ?? '' },
      { header: 'Along with Pole', accessor: (r) => r.along_with_pole ?? '' },
      { header: 'Luminary No', accessor: (r) => r.luminary_no || r.light_no || '' },
      { header: 'SIM No', accessor: (r) => r.sim_no ?? '' },
      { header: 'Battery Serial No', accessor: (r) => r.battery_serial_no ?? '' },
      { header: 'Module No', accessor: (r) => r.module_no ?? '' },
      { header: 'Date of Installation', accessor: (r) => r.date_of_installation || r.inst_date || '' },
      {
        header: 'Document',
        accessor: (r) => (r.file || r.r_file ? getBiharComplaintMediaUrl(r.file || r.r_file, 'ssl') : ''),
      },
      { header: 'Complaint Status', accessor: (r) => statusLabel(r) },
      {
        header: 'Created By',
        accessor: (r) => r.created_by || r.complaint_raised_by || r.raised_complaint || r.assigned_vendor_name || 'Vendor',
      },
    ],
    []
  );

  const fileBase = 'Bihar_SSL_Complaints';
  const handleCopy = () => copyTableDataToClipboard(filteredComplaints, exportCols);
  const handleCsv = () => exportDataToCSV(fileBase, filteredComplaints, exportCols);
  const handleExcel = () => exportDataToExcel(fileBase, filteredComplaints, exportCols);
  const handlePdf = () => printTableData('Bihar SSL Complaints Report', filteredComplaints, exportCols);

  /* ── Delete Complaint ── */
  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint #${id}?`)) return;
    const res = await biharComplaintService.deleteSslComplaint(id);
    if (res.success) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      if (detailComplaint?.id === id) setDetailComplaint(null);
      alert(res.message);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const hasFilters = !!search || statusFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Complaints"
        subtitle="Manage Solar Street Light grievance tickets raised by vendor in Bihar"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SSL' },
          { label: 'View Complaints' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadComplaints} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/complaint/bihar/ssl-add-complaint')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Add Complaint</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── KPI Row (Matching Reference) ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Complaints"
              value={kpis.total.toLocaleString('en-IN')}
              sub={`${kpis.closed} closed · ${kpis.pending} pending`}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Pending"
              value={kpis.pending.toLocaleString('en-IN')}
              sub="Waiting for resolution"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Closed"
              value={kpis.closed.toLocaleString('en-IN')}
              sub="Resolved by vendor"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Closed Rate"
              value={`${closedPct}%`}
              sub="Of total complaints"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Complaints filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === statusFilter;
              const count = t.key === 'all' ? kpis.total : t.key === 'pending' ? kpis.pending : kpis.closed;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">
                    {t.label} ({loading ? '…' : count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Complaints">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {statusFilter === 'all' ? 'All SSL Complaints' : statusFilter === 'pending' ? 'Pending SSL Complaints' : 'Closed SSL Complaints'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredComplaints.length}</span> of <span className="ax-num">{complaints.length}</span> complaints
                {' '}· Total <b className="ax-num">{kpis.total}</b> · Pending <b className="ax-num">{kpis.pending}</b> · Closed <b className="ax-num">{kpis.closed}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts ({uniqueDistricts.length})</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

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
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search complaint ID, pole, beneficiary…"
                  size="sm"
                  ariaLabel="Search records"
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-spinner" style={{ width: 24, height: 24, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Loading SSL complaints from server…</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <TableEmptyState
              title="No records found"
              message={
                hasFilters
                  ? 'No complaints match your filters. Try clearing filters or search term.'
                  : errorMsg || 'No complaint tickets have been submitted yet.'
              }
              onClear={hasFilters ? clearFilters : undefined}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
<<<<<<< HEAD
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
=======
                <table className="ax-table ax-table--hover " style={{ whiteSpace: 'nowrap' }}>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                  <caption className="ax-visually-hidden">Bihar SSL Complaints</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. no.</th>
                      <th className="ax-table__th" scope="col">Complaint ID</th>
                      <th className="ax-table__th" scope="col">Complaint Date</th>
                      <th className="ax-table__th" scope="col">Complaint Issue</th>
                      <th className="ax-table__th" scope="col">Complaint</th>
                      <th className="ax-table__th" scope="col">Complaint Source</th>
                      <th className="ax-table__th" scope="col">State</th>
                      <th className="ax-table__th" scope="col">District</th>
                      <th className="ax-table__th" scope="col">Block</th>
                      <th className="ax-table__th" scope="col">Panchayat</th>
                      <th className="ax-table__th" scope="col">Phase</th>
                      <th className="ax-table__th" scope="col">Address</th>
                      <th className="ax-table__th" scope="col">Ward No</th>
                      <th className="ax-table__th" scope="col">Pole No</th>
                      <th className="ax-table__th" scope="col">Light No</th>
                      <th className="ax-table__th" scope="col">Beneficiary Name</th>
                      <th className="ax-table__th" scope="col">Contact No</th>
                      <th className="ax-table__th" scope="col">Latitude</th>
                      <th className="ax-table__th" scope="col">Longitude</th>
                      <th className="ax-table__th" scope="col">Along with Pole</th>
                      <th className="ax-table__th" scope="col">Luminary No</th>
                      <th className="ax-table__th" scope="col">SIM No</th>
                      <th className="ax-table__th" scope="col">Battery Serial No</th>
                      <th className="ax-table__th" scope="col">Module No</th>
                      <th className="ax-table__th" scope="col">Date of Installation</th>
                      <th className="ax-table__th" scope="col">Document</th>
                      <th className="ax-table__th" scope="col">Complaint Status</th>
                      <th className="ax-table__th" scope="col">Created By</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedComplaints.map((item, idx) => {
                      const srNo = (currentPage - 1) * pageSize + idx + 1;
                      const closed = isClosed(item);
                      const assigned = isAssigned(item);
                      const locked = isLocked(item);

                      const docPath = item.file || item.r_file || (item as any).document;
                      const docUrl = docPath ? getBiharComplaintMediaUrl(docPath, 'ssl') : '';

                      return (
                        <tr key={item.id || item.complaint_id || idx} className="ax-table__row">
                          {/* 1. Sr. no. */}
                          <td className="ax-table__td ax-num">{srNo}</td>

                          {/* 2. Complaint ID */}
                          <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                            #{item.complaint_id}
                          </td>

                          {/* 3. Complaint Date */}
                          <td className="ax-table__td">{txt(item.complaint_date || item.start_date || (item as any).created_at)}</td>

                          {/* 4. Complaint Issue */}
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.complaint_issue)}</td>

                          {/* 5. Complaint Description */}
                          <td className="ax-table__td">
                            <div title={item.complaint} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {txt(item.complaint)}
                            </div>
                          </td>

                          {/* 6. Complaint Source */}
                          <td className="ax-table__td">{txt(item.complaint_source || (item as any).source)}</td>

                          {/* 7. State */}
                          <td className="ax-table__td">{txt(item.state || 'Bihar')}</td>

                          {/* 8. District */}
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>

                          {/* 9. Block */}
                          <td className="ax-table__td">{txt(item.block)}</td>

                          {/* 10. Panchayat */}
                          <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                            {txt(item.panchyat || item.panchayat)}
                          </td>

                          {/* 11. Phase */}
                          <td className="ax-table__td">{txt(item.phase)}</td>

                          {/* 12. Address */}
                          <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }} title={item.address || item.location || item.village}>
                            {txt(item.address || item.location || item.village)}
                          </td>

                          {/* 13. Ward No */}
                          <td className="ax-table__td">{txt(item.ward_no)}</td>

                          {/* 14. Pole No */}
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.pole_no)}</td>

                          {/* 15. Light No */}
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {txt(item.light_no || item.luminary_no)}
                          </td>

                          {/* 16. Beneficiary Name */}
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {txt(item.beneficiary_name)}
                          </td>

                          {/* 17. Contact No */}
                          <td className="ax-table__td">
                            {item.contact_no ? (
                              <a href={`tel:${item.contact_no}`} style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}>
                                {item.contact_no}
                              </a>
                            ) : (
                              DASH
                            )}
                          </td>

                          {/* 18. Latitude */}
                          <td className="ax-table__td">{txt(item.latitude)}</td>

                          {/* 19. Longitude */}
                          <td className="ax-table__td">{txt(item.longitude)}</td>

                          {/* 20. Along with Pole */}
                          <td className="ax-table__td">{txt(item.along_with_pole)}</td>

                          {/* 21. Luminary No */}
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {txt(item.luminary_no || item.light_no)}
                          </td>

                          {/* 22. SIM No */}
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {txt(item.sim_no)}
                          </td>

                          {/* 23. Battery Serial No */}
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {txt(item.battery_serial_no)}
                          </td>

                          {/* 24. Module No */}
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {txt(item.module_no)}
                          </td>

                          {/* 25. Date of Installation */}
                          <td className="ax-table__td">{txt(item.date_of_installation || item.inst_date)}</td>

                          {/* 26. Document */}
                          <td className="ax-table__td">
                            {docUrl ? (
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--xs"
                                onClick={() => setPreviewImage({ src: docUrl, title: `Complaint #${item.complaint_id} Document` })}
                                title="Click to view photograph / document"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', color: 'var(--ax-accent)' }}
                              >
                                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View</span>
                              </button>
                            ) : (
                              DASH
                            )}
                          </td>

                          {/* 27. Complaint Status */}
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ax-badge--pill ${closed ? 'ax-badge--success' : assigned ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                              <span className="ax-badge__dot" />
                              {statusLabel(item)}
                            </span>
                          </td>

                          {/* 28. Created By */}
                          <td className="ax-table__td">
                            {txt(item.created_by || item.complaint_raised_by || item.raised_complaint || item.assigned_vendor_name || 'Vendor')}
                          </td>

                          {/* 29. Action */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                onClick={() => setDetailComplaint(item)}
                                title="View detailed complaint record"
                                style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>View</span>
                              </button>

                              {locked ? (
                                <span
                                  className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11, cursor: 'not-allowed' }}
                                  title="Complaint assigned — edit/delete locked"
                                >
                                  <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                  </svg>
                                  Assigned
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="ax-btn ax-btn--secondary ax-btn--sm"
                                    onClick={() => navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${item.id}`)}
                                    title="Edit complaint"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="ax-btn ax-btn--ghost ax-btn--sm"
                                    onClick={() => handleDelete(item.id)}
                                    style={{ color: 'var(--ax-danger, #ef4444)' }}
                                    title="Delete complaint"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Table Footer (100 records fixed default) ── */}
              <div className="ax-card__footer">
                <div className="ula-pagination-left">
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredComplaints.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[100, 200, 300]}
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Detail Modal (Reference Bihar SSL AMC Design) ── */}
      {detailComplaint && (
        <ComplaintDetailModal
          item={detailComplaint}
          onClose={() => setDetailComplaint(null)}
          onImageClick={(src, title) => setPreviewImage({ src, title })}
          onEdit={!isLocked(detailComplaint) ? () => navigate(`/v/complaint/bihar/ssl-add-complaint?edit=${detailComplaint.id}`) : undefined}
          onDelete={!isLocked(detailComplaint) ? () => handleDelete(detailComplaint.id) : undefined}
        />
      )}

      {/* ── Zoom Lightbox Modal (Reference Bihar SSL AMC Design) ── */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export default Bihar_Complaint_SSL_ViewComplaint;
