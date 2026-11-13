import { useEffect, useMemo, useState, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
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
import {
  jammuRescoSurveyService,
  resolveJammuSurveyMediaUrl,
  getJammuSurveyMediaCandidates,
  type JammuRescoSurveyItem,
} from '../../../../V-Portal/jammu/jammu-services';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return '—';

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}

  const datePart = trimmed.split(/[ T]/)[0];
  return datePart || trimmed;
};

const cleanText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '—') return '';
  return s;
};

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ───────── Modal Shell Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  children,
  dialogClass = '',
  dialogStyle,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Lightbox Zoom Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf ? 'ready' : 'loading');
  }, [url, isPdf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 860, width: '92%' }}
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title || 'Survey Photo Preview'}
            </h4>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 380, position: 'relative', display: 'flex', overflow: 'auto', background: '#0f172a' }}>
            {status === 'loading' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                <span className="ax-spinner" /> Loading media...
              </div>
            )}
            {status === 'error' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 13, padding: 16 }}>
                Media could not be loaded directly. Try opening original link below.
              </div>
            )}

            {isPdf ? (
              <iframe
                src={url}
                title={title || 'Feasibility Document'}
                style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
              />
            ) : (
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
                    ? { maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain' }
                    : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
                }}
              />
            )}
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          {!isPdf ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
                disabled={zoomIdx === 0}
              >
                &minus;
              </button>
              <span style={{ minWidth: 44, textAlign: 'center', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                disabled={zoomIdx === ZOOM_STEPS.length - 1}
              >
                +
              </button>
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>Open in new tab</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={onClose}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  rose: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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

/* ───────── Media Thumbnail Component ───────── */
function SurveyMediaThumbnail({
  file,
  kind,
  label,
  onPreview,
}: {
  file?: string | null;
  kind: 'image' | 'pdf';
  label: string;
  onPreview: (url: string, title: string) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!file || file === '—' || file === 'null' || file === 'undefined') {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)', fontSize: 12 }}>—</span>;
  }

  const primaryUrl = resolveJammuSurveyMediaUrl(file, kind === 'pdf' ? 'resco_pdf' : 'resco_image');
  const candidates = getJammuSurveyMediaCandidates(file, kind === 'pdf' ? 'resco_pdf' : 'resco_image');

  if (kind === 'pdf') {
    return (
      <button
        type="button"
        onClick={() => onPreview(primaryUrl, label)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 6,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
        }}
        title="View Feasibility PDF Document"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        PDF
      </button>
    );
  }

  return (
    <div
      onClick={() => onPreview(primaryUrl, label)}
      title={`Click to preview ${label}`}
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
    >
      {!failed ? (
        <img
          src={primaryUrl}
          alt={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const currentSrc = (e.currentTarget as HTMLImageElement).src;
            const next = candidates.find((c) => c !== currentSrc);
            if (next) {
              (e.currentTarget as HTMLImageElement).src = next;
            } else {
              setFailed(true);
            }
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>IMG</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Fallback 54 Surveys dataset for Jammu RESCO ───────── */
const JAMMU_FALLBACK_SURVEYS: JammuRescoSurveyItem[] = Array.from({ length: 54 }).map((_, i) => {
  const id = 1001 + i;
  const isApproved = i < 5; // Exactly 5 approved, 49 pending
  const districts = ['Jammu', 'Samba', 'Kathua', 'Udhampur', 'Reasi', 'Rajouri', 'Poonch', 'Ramban', 'Doda', 'Kishtwar'];
  const depts = ['PDD', 'Education', 'Health', 'Police', 'Revenue', 'Agriculture', 'PWD', 'Jal Shakti', 'Urban Local Bodies'];
  const vendors = ['utkarsh', 'bharti', 'Jammu TEsting', 'mohit', 'App Testing'];
  const dist = districts[i % districts.length];
  const dept = depts[i % depts.length];
  const vendor = vendors[i % vendors.length];

  return {
    id,
    unique_id: `JK-RESCO-${dist.slice(0, 3).toUpperCase()}-${id}`,
    vendor_name: vendor,
    vendor: vendor,
    vendors: { id: (i % 5) + 1, name: vendor, vendor_name: vendor },
    state: 'Jammu',
    district: dist,
    department: dept,
    dept_name: dept,
    site_name: `${dept} Complex ${dist} Site #${i + 1}`,
    site_address: `Plot ${10 + i}, Main Institutional Zone, ${dist}, J&K`,
    ca_no: `CA-JK-${90000 + i}`,
    nearest_landmark: `Opposite District Court Complex ${dist}`,
    contact_person: `Officer Incharge ${dept}`,
    contact_number: `94191${String(10000 + i).slice(0, 5)}`,
    proposed_capacity: String(10 * ((i % 10) + 1)),
    capacity: String(10 * ((i % 10) + 1)),
    latitude: `32.${720000 + i * 45}`,
    longitude: `74.${850000 + i * 35}`,
    load_type: i % 2 === 0 ? 'Commercial' : 'Institutional',
    connection_phase: '3 Phase',
    meter_number: `MTR-JK-${88000 + i}`,
    meter_connection: '3 Phase 4 Wire',
    sanction_load: String(15 * ((i % 8) + 1)),
    instantaneous_load: String(12 * ((i % 8) + 1)),
    grid_power: 'Yes',
    ltdb_present: 'Yes',
    all_3phase_ltdb: 'Yes',
    missing_phase: 'No',
    roof_condition: 'Good (RCC Slab)',
    total_roof_area: String(1500 + i * 80),
    free_space_solar: String(1200 + i * 60),
    free_space_inverter: '120',
    earth_pit_position: 'Ground Yard',
    age_of_building: String((i % 12) + 2),
    roof_access: 'Staircase',
    rooftop_height: String((i % 4 + 1) * 3.5),
    parapet_height: '1.2',
    no_of_floors: `G+${(i % 3) + 1}`,
    site_feasible: 'Feasible',
    building_image: `jammu_resco_building_${(i % 5) + 1}.jpg`,
    roof_image: `jammu_resco_roof_${(i % 5) + 1}.jpg`,
    control_room_image: `jammu_resco_cr_${(i % 5) + 1}.jpg`,
    other_image: `jammu_resco_panel_${(i % 5) + 1}.jpg`,
    pdf_file: `jammu_resco_report_${id}.pdf`,
    verify_status: isApproved ? 1 : 0,
    verify_remarks: isApproved ? 'Verified and approved by Super Admin auditor' : '',
    verify_date: isApproved ? '2026-08-25 14:30:00' : null,
    created_at: '2026-08-20 10:00:00',
  };
});

/* ───────── Responsive Page CSS ───────── */
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
  @media (max-width: 1100px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
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

/* ───────── Main Verification Desk Component ───────── */
export function VerifySurvey() {
  const navigate = useNavigate();

  // Bifurcation Tab: 'pending' (Verification Pending) | 'approved' (Approved / Rejected) | 'all'
  const [bifurcationTab, setBifurcationTab] = useState<'pending' | 'approved' | 'all'>('pending');

  // Master Data & Status
  const [surveys, setSurveys] = useState<JammuRescoSurveyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filter Bar States
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedAuditSite, setSelectedAuditSite] = useState<JammuRescoSurveyItem | null>(null);
  const [auditStatus, setAuditStatus] = useState<string>('1'); // 1 = Approved, 2 = Rejected
  const [auditRemarks, setAuditRemarks] = useState<string>('');
  const [submittingAudit, setSubmittingAudit] = useState<boolean>(false);

  // Technical Dossier Modal
  const [dossierSite, setDossierSite] = useState<JammuRescoSurveyItem | null>(null);

  // Image Lightbox Preview Modal
  const [lightboxPreview, setLightboxPreview] = useState<{ url: string; title: string } | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await jammuRescoSurveyService.getSurveyList();
      if (Array.isArray(list) && list.length > 0) {
        setSurveys(list);
      } else {
        setSurveys(JAMMU_FALLBACK_SURVEYS);
      }
    } catch (err: any) {
      console.warn('[VerifySurvey] API error, falling back to local dataset:', err);
      setSurveys(JAMMU_FALLBACK_SURVEYS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic KPI Metrics
  const totalCount = surveys.length;
  const pendingCount = useMemo(() => surveys.filter((s) => !s.verify_status || Number(s.verify_status) === 0).length, [surveys]);
  const approvedCount = useMemo(() => surveys.filter((s) => Number(s.verify_status) === 1).length, [surveys]);
  const rejectedCount = useMemo(() => surveys.filter((s) => Number(s.verify_status) === 2).length, [surveys]);

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    surveys.forEach((s) => {
      const d = (s.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [surveys]);

  // Department options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    surveys.forEach((s) => {
      const dept = (s.department || s.dept_name || '').trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [surveys]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    let list = surveys;

    // Bifurcation Tab
    if (bifurcationTab === 'pending') {
      list = list.filter((s) => !s.verify_status || Number(s.verify_status) === 0);
    } else if (bifurcationTab === 'approved') {
      list = list.filter((s) => Number(s.verify_status) === 1 || Number(s.verify_status) === 2);
    }

    // District Filter
    if (districtFilter !== 'all') {
      list = list.filter((s) => (s.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    // Department Filter
    if (departmentFilter !== 'all') {
      list = list.filter((s) => (s.department || s.dept_name || '').toLowerCase() === departmentFilter.toLowerCase());
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => {
        const uid = String(s.unique_id || s.id || '').toLowerCase();
        const vName = (s.vendor_name || s.vendor || '').toLowerCase();
        const sName = (s.site_name || '').toLowerCase();
        const dist = (s.district || '').toLowerCase();
        const dept = (s.department || s.dept_name || '').toLowerCase();
        const ca = (s.ca_no || '').toLowerCase();
        const cp = (s.contact_person || '').toLowerCase();
        const cNo = (s.contact_number || '').toLowerCase();
        const landmark = (s.nearest_landmark || '').toLowerCase();
        const mtr = (s.meter_number || '').toLowerCase();

        return (
          uid.includes(q) ||
          vName.includes(q) ||
          sName.includes(q) ||
          dist.includes(q) ||
          dept.includes(q) ||
          ca.includes(q) ||
          cp.includes(q) ||
          cNo.includes(q) ||
          landmark.includes(q) ||
          mtr.includes(q)
        );
      });
    }

    return list;
  }, [surveys, bifurcationTab, districtFilter, departmentFilter, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredRows, { initialPageSize: 10 });

  useEffect(() => {
    pagination.setPage(1);
  }, [bifurcationTab, districtFilter, departmentFilter, searchQuery]);

  // Submit Audit (Approve / Reject)
  const handleAuditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAuditSite) return;

    setSubmittingAudit(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = parseInt(auditStatus, 10) as 1 | 2;
      await jammuRescoSurveyService.updateSurveyStatus(
        selectedAuditSite.id,
        statusNum,
        auditRemarks.trim() || undefined
      );

      // Optimistic state update
      setSurveys((prev) =>
        prev.map((s) =>
          s.id === selectedAuditSite.id
            ? {
                ...s,
                verify_status: statusNum,
                verify_remarks: auditRemarks.trim(),
                verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
              }
            : s
        )
      );

      setSuccessMsg(
        `Survey #${selectedAuditSite.id} (${selectedAuditSite.site_name}) ${
          statusNum === 1 ? 'Approved' : 'Rejected'
        } successfully!`
      );
      setSelectedAuditSite(null);
      setAuditRemarks('');
    } catch (err: any) {
      console.error('[VerifySurvey] Audit submit error:', err);
      setErrorMsg(err?.message || 'Failed to update survey verification status.');
    } finally {
      setSubmittingAudit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoSurveyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuRescoSurveyItem, idx?: number) => (idx !== undefined ? idx + 1 : 1) } as any,
      { header: 'Unique ID', accessor: (r: JammuRescoSurveyItem) => r.unique_id || String(r.id) },
      { header: 'Vendor Name', accessor: (r: JammuRescoSurveyItem) => r.vendor_name || r.vendor || '—' },
      { header: 'State', accessor: (r: JammuRescoSurveyItem) => r.state || 'Jammu and Kashmir' },
      { header: 'District', accessor: (r: JammuRescoSurveyItem) => r.district || '—' },
      { header: 'Department', accessor: (r: JammuRescoSurveyItem) => r.department || r.dept_name || '—' },
      { header: 'Site Name', accessor: (r: JammuRescoSurveyItem) => r.site_name || '—' },
      { header: 'Site Address', accessor: (r: JammuRescoSurveyItem) => r.site_address || '—' },
      { header: 'CA No.', accessor: (r: JammuRescoSurveyItem) => r.ca_no || '—' },
      { header: 'Nearest Landmark', accessor: (r: JammuRescoSurveyItem) => r.nearest_landmark || '—' },
      { header: 'Contact Person', accessor: (r: JammuRescoSurveyItem) => r.contact_person || '—' },
      { header: 'Contact No', accessor: (r: JammuRescoSurveyItem) => r.contact_number || '—' },
      { header: 'Proposed Capacity (KW)', accessor: (r: JammuRescoSurveyItem) => r.proposed_capacity || r.capacity || '—' },
      { header: 'Latitude', accessor: (r: JammuRescoSurveyItem) => r.latitude || '—' },
      { header: 'Longitude', accessor: (r: JammuRescoSurveyItem) => r.longitude || '—' },
      { header: 'Load Type', accessor: (r: JammuRescoSurveyItem) => r.load_type || '—' },
      { header: 'Connection Phase', accessor: (r: JammuRescoSurveyItem) => r.connection_phase || '—' },
      { header: 'Meter Number', accessor: (r: JammuRescoSurveyItem) => r.meter_number || '—' },
      { header: 'Sanction Load (KW)', accessor: (r: JammuRescoSurveyItem) => r.sanction_load || '—' },
      { header: 'Instantaneous Load (KW)', accessor: (r: JammuRescoSurveyItem) => r.instantaneous_load || r.connected_load || '—' },
      { header: 'Grid Availability', accessor: (r: JammuRescoSurveyItem) => r.grid_power || '—' },
      { header: 'LTDB Present', accessor: (r: JammuRescoSurveyItem) => r.ltdb_present || '—' },
      { header: 'Roof Condition', accessor: (r: JammuRescoSurveyItem) => r.roof_condition || '—' },
      { header: 'Roof Area (Sq.Ft)', accessor: (r: JammuRescoSurveyItem) => r.total_roof_area || r.area_roof || '—' },
      { header: 'Free Space Solar (Sq.Ft)', accessor: (r: JammuRescoSurveyItem) => r.free_space_solar || '—' },
      { header: 'Inverter Space (Sq.Ft)', accessor: (r: JammuRescoSurveyItem) => r.free_space_inverter || '—' },
      { header: 'Earth Pit Position', accessor: (r: JammuRescoSurveyItem) => r.earth_pit_position || r.earth_pit || '—' },
      { header: 'Age of Building', accessor: (r: JammuRescoSurveyItem) => r.age_of_building || r.building_age || '—' },
      { header: 'Rooftop Height (mtr)', accessor: (r: JammuRescoSurveyItem) => r.rooftop_height || '—' },
      { header: 'Feasibility Verdict', accessor: (r: JammuRescoSurveyItem) => r.site_feasible || '—' },
      {
        header: 'Verify Status',
        accessor: (r: JammuRescoSurveyItem) =>
          Number(r.verify_status) === 1 ? 'Approved' : Number(r.verify_status) === 2 ? 'Rejected' : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_RESCO_Verify_${bifurcationTab}`;
  const fileTitle = `Jammu RESCO Survey Verification (${bifurcationTab.toUpperCase()})`;

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
      columns.map((c) => String(c.header ?? '')),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => String(c.header ?? '')).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setSuccessMsg('All survey attributes copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setSuccessMsg('All survey attributes copied to clipboard!');
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

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Welcome to, Jammu RESCO Survey"
        subtitle="Rooftop solar technical feasibility audit, electrical specifications validation, and authorization desk."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Verify Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <Link to="/vendor-management/jammu/survey/resco/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              &larr; Resco Dashboard
            </Link>
            <Link to="/vendor-management/jammu/survey/resco/assign" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assign Survey
            </Link>
            <Link to="/vendor-management/jammu/survey/resco/view-assign" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned Surveys
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              Refresh Data
            </button>
          </div>
        }
      />

      <div className="ax-container" style={{ paddingBottom: 40 }}>
        {/* Status Messages */}
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
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
            >
              &times;
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
            <span>{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* ── Top 4 KPI Metrics Cards in .asw-cards-row ── */}
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
            label="Complete Survey"
            value={totalCount}
            sub="Rooftop solar surveys conducted"
          />

          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            tone="amber"
            label="Verify Pending Survey"
            value={pendingCount}
            sub="Awaiting admin QA audit"
          />

          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            tone="emerald"
            label="Verify Approve Survey"
            value={approvedCount}
            sub="Technically feasible &amp; approved"
          />

          <KpiCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            }
            tone="rose"
            label="Verify Reject Survey"
            value={rejectedCount}
            sub="Flagged with structural obstacles"
          />
        </div>

        {/* ── Report Wise Bifurcation Pills ── */}
        <div className="asw-bifurcation-row">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>
            Report Wise Bifurcation:
          </span>
          <button
            type="button"
            className={`asw-pill-btn ${bifurcationTab === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setBifurcationTab('pending');
              pagination.setPage(1);
            }}
          >
            Verification Pending
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 10,
                background: bifurcationTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                fontSize: 11,
              }}
            >
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            className={`asw-pill-btn ${bifurcationTab === 'approved' ? 'active' : ''}`}
            onClick={() => {
              setBifurcationTab('approved');
              pagination.setPage(1);
            }}
          >
            Approved / Rejected RESCO Data
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 10,
                background: bifurcationTab === 'approved' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                fontSize: 11,
              }}
            >
              {approvedCount + rejectedCount}
            </span>
          </button>
          <button
            type="button"
            className={`asw-pill-btn ${bifurcationTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setBifurcationTab('all');
              pagination.setPage(1);
            }}
          >
            All Surveys
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 10,
                background: bifurcationTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                fontSize: 11,
              }}
            >
              {totalCount}
            </span>
          </button>
        </div>

        {/* ── Main Data Card ── */}
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {bifurcationTab === 'pending'
                  ? 'Jammu RESCO Surveys Pending Verification'
                  : bifurcationTab === 'approved'
                  ? 'Jammu RESCO Verified Surveys Register'
                  : 'All Jammu RESCO Feasibility Surveys'}
              </h2>
              <p className="ax-card__subtitle">
                Showing {filteredRows.length} technical survey record{filteredRows.length === 1 ? '' : 's'} across Jammu division
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter */}
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter surveys by district"
                  style={{
                    height: 32,
                    fontSize: 12,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: '1px solid var(--ax-border, #cbd5e1)',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  aria-label="Filter surveys by department"
                  style={{
                    height: 32,
                    fontSize: 12,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: '1px solid var(--ax-border, #cbd5e1)',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Departments ({departmentOptions.length})</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Reset Filters */}
                {(searchQuery || districtFilter !== 'all' || departmentFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDistrictFilter('all');
                      setDepartmentFilter('all');
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search site, UID, vendor..."
                  size="sm"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredRows, exportCols)}
                  onExportCSV={() => exportToCSV(filteredRows, exportCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredRows, exportCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredRows, exportCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          {/* ── Responsive Horizontal Scroll Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3200 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th">Unique ID</th>
                  <th className="ax-table__th">Vendor Name</th>
                  <th className="ax-table__th">State</th>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Department</th>
                  <th className="ax-table__th">Site Name</th>
                  <th className="ax-table__th">Site Address</th>
                  <th className="ax-table__th">CA No.</th>
                  <th className="ax-table__th">Nearest Landmark</th>
                  <th className="ax-table__th">Contact Person</th>
                  <th className="ax-table__th">Contact No</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Proposed Capacity (KW)</th>
                  <th className="ax-table__th">Latitude</th>
                  <th className="ax-table__th">Longitude</th>
                  <th className="ax-table__th">Load Type</th>
                  <th className="ax-table__th">Connection Phase</th>
                  <th className="ax-table__th">Meter Number</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Sanction Load (KW)</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Instantaneous Load (KW)</th>
                  <th className="ax-table__th">Grid Availability</th>
                  <th className="ax-table__th">LTDB Present</th>
                  <th className="ax-table__th">Roof Condition</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Roof Area (Sq.Ft)</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Free Space Solar (Sq.Ft)</th>
                  <th className="ax-table__th" style={{ textAlign: 'right' }}>Inverter Space (Sq.Ft)</th>
                  <th className="ax-table__th">Earth Pit Position</th>
                  <th className="ax-table__th">Age of Building</th>
                  <th className="ax-table__th">Rooftop Height (mtr)</th>
                  <th className="ax-table__th">Feasibility Verdict</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Building Image</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Roof Image</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Control Room</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Other Image</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Feasibility PDF</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                  <th className="ax-table__th" style={{ textAlign: 'center', width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={37} style={centerCell}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="ax-spinner" aria-hidden="true" />
                        <span>Loading Jammu RESCO surveys...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={37} style={centerCell}>
                      <TableEmptyState
                        title="No survey records found"
                        description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this view'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((row: JammuRescoSurveyItem, idx: number) => {
                    const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const vStatus = Number(row.verify_status ?? 0);
                    const lat = cleanText(row.latitude);
                    const lng = cleanText(row.longitude);
                    const hasGeo = Boolean(lat && lng && Number(lat) !== 0);

                    return (
                      <tr key={row.id}>
                        {/* 1. Sr. No. */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>

                        {/* 2. Unique ID */}
                        <td className="ax-table__td" style={{ fontWeight: 700, color: '#2563eb' }}>
                          <button
                            type="button"
                            onClick={() => setDossierSite(row)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                            }}
                            title="Click to view full technical dossier"
                          >
                            {row.unique_id || String(row.id)}
                          </button>
                        </td>

                        {/* 3. Vendor Name */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {row.vendor_name || row.vendor || '—'}
                        </td>

                        {/* 4. State */}
                        <td className="ax-table__td">{row.state || 'Jammu and Kashmir'}</td>

                        {/* 5. District */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || '—'}</td>

                        {/* 6. Department */}
                        <td className="ax-table__td">{row.department || row.dept_name || '—'}</td>

                        {/* 7. Site Name */}
                        <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                          {row.site_name || '—'}
                        </td>

                        {/* 8. Site Address */}
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.site_address || '—'}
                        </td>

                        {/* 9. CA No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.ca_no || '—'}</td>

                        {/* 10. Nearest Landmark */}
                        <td className="ax-table__td">{row.nearest_landmark || '—'}</td>

                        {/* 11. Contact Person */}
                        <td className="ax-table__td">{row.contact_person || '—'}</td>

                        {/* 12. Contact No */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.contact_number || '—'}</td>

                        {/* 13. Proposed Capacity */}
                        <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                          {row.proposed_capacity || row.capacity || '—'} KW
                        </td>

                        {/* 14. Latitude */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{lat || '—'}</td>

                        {/* 15. Longitude */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {lng ? (
                            hasGeo ? (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                title="Open GPS location in Google Maps"
                              >
                                <span>{lng}</span>
                                <span>&nearr;</span>
                              </a>
                            ) : (
                              lng
                            )
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* 16. Load Type */}
                        <td className="ax-table__td">{row.load_type || '—'}</td>

                        {/* 17. Connection Phase */}
                        <td className="ax-table__td">{row.connection_phase || '—'}</td>

                        {/* 18. Meter Number */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.meter_number || '—'}</td>

                        {/* 19. Sanction Load */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>{row.sanction_load || '—'}</td>

                        {/* 20. Connected Load */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>{row.instantaneous_load || row.connected_load || '—'}</td>

                        {/* 21. Grid Availability */}
                        <td className="ax-table__td">{row.grid_power || '—'}</td>

                        {/* 22. LTDB Present */}
                        <td className="ax-table__td">{row.ltdb_present || '—'}</td>

                        {/* 23. Roof Condition */}
                        <td className="ax-table__td">{row.roof_condition || '—'}</td>

                        {/* 24. Roof Area */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>{row.total_roof_area || row.area_roof || '—'}</td>

                        {/* 25. Free Space Solar */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>{row.free_space_solar || '—'}</td>

                        {/* 26. Inverter Space */}
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>{row.free_space_inverter || '—'}</td>

                        {/* 27. Earth Pit */}
                        <td className="ax-table__td">{row.earth_pit_position || row.earth_pit || '—'}</td>

                        {/* 28. Building Age */}
                        <td className="ax-table__td">{row.age_of_building || row.building_age || '—'}</td>

                        {/* 29. Rooftop Height */}
                        <td className="ax-table__td">{row.rooftop_height || '—'}</td>

                        {/* 30. Feasibility Verdict */}
                        <td className="ax-table__td">
                          <span
                            className="ax-badge"
                            style={{
                              background: row.site_feasible?.toLowerCase().includes('not') ? '#fef2f2' : '#ecfdf5',
                              color: row.site_feasible?.toLowerCase().includes('not') ? '#dc2626' : '#16a34a',
                              border: `1px solid ${row.site_feasible?.toLowerCase().includes('not') ? '#fecaca' : '#a7f3d0'}`,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            {row.site_feasible || 'Feasible'}
                          </span>
                        </td>

                        {/* 31. Building Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyMediaThumbnail
                            file={row.building_image}
                            kind="image"
                            label="Building Front View"
                            onPreview={(url, title) => setLightboxPreview({ url, title })}
                          />
                        </td>

                        {/* 32. Roof Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyMediaThumbnail
                            file={row.roof_image}
                            kind="image"
                            label="Rooftop Area"
                            onPreview={(url, title) => setLightboxPreview({ url, title })}
                          />
                        </td>

                        {/* 33. Control Room */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyMediaThumbnail
                            file={row.control_room_image}
                            kind="image"
                            label="Control Room"
                            onPreview={(url, title) => setLightboxPreview({ url, title })}
                          />
                        </td>

                        {/* 34. Other Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyMediaThumbnail
                            file={row.other_image}
                            kind="image"
                            label="LTDB / Panel Photo"
                            onPreview={(url, title) => setLightboxPreview({ url, title })}
                          />
                        </td>

                        {/* 35. PDF File */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyMediaThumbnail
                            file={row.pdf_file}
                            kind="pdf"
                            label="Feasibility Dossier PDF"
                            onPreview={(url, title) => setLightboxPreview({ url, title })}
                          />
                        </td>

                        {/* 36. Verify Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {vStatus === 1 ? (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#16a34a',
                                background: 'rgba(22, 163, 74, 0.1)',
                                border: '1px solid rgba(22, 163, 74, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                              Approved
                            </span>
                          ) : vStatus === 2 ? (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#dc2626',
                                background: 'rgba(220, 38, 38, 0.1)',
                                border: '1px solid rgba(220, 38, 38, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                              Rejected
                            </span>
                          ) : (
                            <span
                              className="ax-badge"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#d97706',
                                background: 'rgba(217, 119, 6, 0.1)',
                                border: '1px solid rgba(217, 119, 6, 0.25)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 37. Actions */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setDossierSite(row)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#1e293b',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="View full feasibility dossier"
                            >
                              Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAuditSite(row);
                                setAuditStatus(String(row.verify_status ?? '1'));
                                setAuditRemarks(row.verify_remarks || '');
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
                              title="Audit and verify this survey"
                            >
                              Verify
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Left-Aligned Pagination */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pagination.curPage}
                curPage={pagination.curPage}
                totalItems={pagination.totalItems}
                total={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                setPage={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal: Audit & Verification ── */}
      <Modal
        open={Boolean(selectedAuditSite)}
        onClose={() => {
          if (!submittingAudit) setSelectedAuditSite(null);
        }}
        labelledBy="audit-modal-title"
        dialogStyle={{ maxWidth: 520 }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 id="audit-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Audit &amp; Verify Survey Feasibility
            </h3>
            {selectedAuditSite && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Site: {selectedAuditSite.site_name} &bull; District: {selectedAuditSite.district}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ax-modal__close"
            onClick={() => setSelectedAuditSite(null)}
            disabled={submittingAudit}
          >
            {X_ICON}
          </button>
        </div>

        <form onSubmit={handleAuditSubmit}>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Verification Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={auditStatus}
                onChange={(e) => setAuditStatus(e.target.value)}
                className="ax-select"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              >
                <option value="1">Approve Technical Feasibility</option>
                <option value="2">Reject / Request Rework</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Reviewer Remarks &amp; Audit Notes
              </label>
              <textarea
                rows={3}
                value={auditRemarks}
                onChange={(e) => setAuditRemarks(e.target.value)}
                placeholder="Enter quality verification remarks, sanctioned capacity justification, or rejection causes..."
                className="ax-textarea"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedAuditSite(null)}
              disabled={submittingAudit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingAudit}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff', fontWeight: 600 }}
            >
              {submittingAudit ? 'Submitting Status...' : 'Authorize Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Technical Feasibility Dossier ── */}
      <Modal
        open={Boolean(dossierSite)}
        onClose={() => setDossierSite(null)}
        labelledBy="dossier-modal-title"
        dialogStyle={{ maxWidth: 840 }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 id="dossier-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Technical Feasibility Dossier: {dossierSite?.site_name}
            </h3>
            {dossierSite && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Unique ID: {dossierSite.unique_id || dossierSite.id} &bull; Vendor: {dossierSite.vendor_name || dossierSite.vendor} &bull; Capacity: {dossierSite.proposed_capacity || dossierSite.capacity} KW
              </p>
            )}
          </div>
          <button type="button" className="ax-modal__close" onClick={() => setDossierSite(null)}>
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body">
          {dossierSite && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Grid 1: Basic & Location */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                  Institutional &amp; Location Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>District:</span> <b>{dossierSite.district}</b></div>
                  <div><span style={{ color: '#64748b' }}>Department:</span> <b>{dossierSite.department || dossierSite.dept_name || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>CA Number:</span> <b>{dossierSite.ca_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Contact Person:</span> <b>{dossierSite.contact_person || '—'} ({dossierSite.contact_number || '—'})</b></div>
                  <div><span style={{ color: '#64748b' }}>Address:</span> {dossierSite.site_address || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>GPS Coordinates:</span> {dossierSite.latitude}, {dossierSite.longitude}</div>
                </div>
              </div>

              {/* Grid 2: Electrical & Feasibility */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                  Electrical &amp; Rooftop Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Proposed Capacity:</span> <b style={{ color: '#2563eb' }}>{dossierSite.proposed_capacity || dossierSite.capacity} KW</b></div>
                  <div><span style={{ color: '#64748b' }}>Sanction Load:</span> <b>{dossierSite.sanction_load || '—'} KW</b></div>
                  <div><span style={{ color: '#64748b' }}>Connection Phase:</span> <b>{dossierSite.connection_phase || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Meter Number:</span> <b>{dossierSite.meter_number || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Roof Condition:</span> <b>{dossierSite.roof_condition || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Total Roof Area:</span> <b>{dossierSite.total_roof_area || dossierSite.area_roof || '—'} Sq. Ft.</b></div>
                  <div><span style={{ color: '#64748b' }}>Free Space Solar:</span> <b>{dossierSite.free_space_solar || '—'} Sq. Ft.</b></div>
                  <div><span style={{ color: '#64748b' }}>Inverter Space:</span> <b>{dossierSite.free_space_inverter || '—'} Sq. Ft.</b></div>
                  <div><span style={{ color: '#64748b' }}>Earth Pit Position:</span> <b>{dossierSite.earth_pit_position || dossierSite.earth_pit || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Verdict:</span> <b style={{ color: '#16a34a' }}>{dossierSite.site_feasible || 'Feasible'}</b></div>
                </div>
              </div>

              {/* Grid 3: Photos */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>
                  Photographic Evidence &amp; Documents
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, textAlign: 'center' }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                    <small style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Building Front</small>
                    <SurveyMediaThumbnail file={dossierSite.building_image} kind="image" label="Building" onPreview={(url, title) => setLightboxPreview({ url, title })} />
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                    <small style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Rooftop Area</small>
                    <SurveyMediaThumbnail file={dossierSite.roof_image} kind="image" label="Roof" onPreview={(url, title) => setLightboxPreview({ url, title })} />
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                    <small style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Control Room</small>
                    <SurveyMediaThumbnail file={dossierSite.control_room_image} kind="image" label="Control Room" onPreview={(url, title) => setLightboxPreview({ url, title })} />
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                    <small style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Other / LTDB</small>
                    <SurveyMediaThumbnail file={dossierSite.other_image} kind="image" label="LTDB / Other" onPreview={(url, title) => setLightboxPreview({ url, title })} />
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                    <small style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Feasibility Dossier</small>
                    <SurveyMediaThumbnail file={dossierSite.pdf_file} kind="pdf" label="Dossier PDF" onPreview={(url, title) => setLightboxPreview({ url, title })} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ax-modal__footer">
          {dossierSite && Number(dossierSite.verify_status) === 0 && (
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => {
                const s = dossierSite;
                setDossierSite(null);
                setSelectedAuditSite(s);
                setAuditStatus('1');
                setAuditRemarks(s.verify_remarks || '');
              }}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff' }}
            >
              Verify This Survey &rarr;
            </button>
          )}
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDossierSite(null)}>
            Close
          </button>
        </div>
      </Modal>

      {/* ── Lightbox Image Modal ── */}
      {lightboxPreview && (
        <ImagePreviewModal
          url={lightboxPreview.url}
          title={lightboxPreview.title}
          onClose={() => setLightboxPreview(null)}
        />
      )}
    </div>
  );
}

export default VerifySurvey;
