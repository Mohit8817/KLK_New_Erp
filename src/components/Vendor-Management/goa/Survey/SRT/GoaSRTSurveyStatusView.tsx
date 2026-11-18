import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaAdminService,
  resolveGoaMediaUrl,
  normalizeGoaSurveyStatus,
} from '../../goa-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved' || r === 'verified') return <Badge tone="success">Approved</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const SurveyStatusBadge = ({ value }: { value?: number | string }) => {
  const isDone = Number(value) === 1 || String(value).toLowerCase() === 'done';
  if (isDone) return <Badge tone="success">Survey Done</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

export interface StatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const GOA_SURVEY_STATUS_LIST: StatusMeta[] = [
  { key: '', label: 'All Survey Records', tone: 'accent', desc: 'All rooftop solar survey records across Goa' },
  { key: 'survey-done', label: 'Survey Done', tone: 'emerald', desc: 'Sites with field feasibility survey completed' },
  { key: 'survey-pending', label: 'Pending Survey', tone: 'amber', desc: 'Sites awaiting surveyor field audit' },
  { key: 'assigned', label: 'Assigned Sites', tone: 'accent', desc: 'Sites formally assigned to surveyor vendors' },
  { key: 'not-assigned', label: 'Unassigned Sites', tone: 'amber', desc: 'Sites pending surveyor allotment' },
  { key: 'verify-pending', label: 'Verification Pending', tone: 'amber', desc: 'Surveys done, awaiting engineering audit' },
  { key: 'verify-done', label: 'Audit Approved', tone: 'cyan', desc: 'Surveys approved for solar installation handoff' },
  { key: 'verify-reject', label: 'Verification Rejected', tone: 'amber', desc: 'Surveys flagged with shading/structural issues' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  GOA_SURVEY_STATUS_LIST.map((m) => [m.key, m])
);

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const isPdf = /\.pdf($|\?)/i.test(url);
  const isDoc = /\.(docx?|xlsx?)($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf || isDoc ? 'ready' : 'loading');
  }, [url, isPdf, isDoc]);

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
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title || 'Media Preview'}
            </h4>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
            {status === 'loading' && (
              <div className="ula-m-stage__msg">
                <span className="ax-spinner" /> Loading media…
              </div>
            )}
            {status === 'error' && (
              <div className="ula-m-stage__msg">Media could not be loaded. Try opening it in a new tab.</div>
            )}

            {isPdf ? (
              <iframe
                src={url}
                title={title || 'PDF Document Preview'}
                style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
              />
            ) : isDoc ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  Direct in-browser preview is not supported for this file format.
                </p>
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                >
                  Download / Open File ↗
                </a>
              </div>
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
                    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                    : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
                }}
              />
            )}
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          {!isPdf && !isDoc ? (
            <div className="ula-m-zoom" role="group" aria-label="Zoom">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
                disabled={zoomIdx === 0}
              >
                −
              </button>
              <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
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
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
              Open in new tab ↗
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

function InstallationThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? resolveGoaMediaUrl(src) : null;

  if (!resolved || resolved === DASH || src === DASH) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const isPdf = /\.pdf($|\?)/i.test(resolved);

  return (
    <div
      onClick={() => onPreview(resolved, alt)}
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
      {!isPdf && !failed ? (
        <img
          src={resolved}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
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
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)', lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--ax-text-muted, #64748b)', marginTop: 4 }}>
        {sub}
      </div>
    </div>
  );
}

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
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
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
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

const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
  }
  .solar-erp-page .ax-card { min-width: 0; }
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
  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
    min-width: 180px;
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
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
const monoCell = { fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 'var(--ax-text-xs, 12px)' } as const;

export function GoaSRTSurveyStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || '';
  const activeStatus = normalizeGoaSurveyStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();
  const activeVendor = (searchParams.get('vendor') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [detailsRecord, setDetailsRecord] = useState<any | null>(null);

  // Fetch districts list from survey dashboard for the filter dropdown
  useEffect(() => {
    let cancelled = false;
    goaAdminService
      .getSurveyDashboard()
      .then((dash) => {
        if (!cancelled && Array.isArray(dash?.districtwise)) {
          const names = Array.from(
            new Set(dash.districtwise.map((d: any) => (d.district || '').trim()).filter(Boolean))
          ).sort() as string[];
          if (names.length > 0) setAllDistricts(names);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Fetch survey drill-down records from real API (#8, #9, #10)
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let list: any[] = [];
        if (activeVendor && activeVendor !== 'All') {
          list = await goaAdminService.getSurveyVendorwiseDashboard(activeStatus || 'assigned', activeVendor);
        } else if (activeDistrict && activeDistrict !== 'All') {
          list = await goaAdminService.getSurveyDistrictwiseDashboard(activeStatus || 'assigned', activeDistrict);
        } else {
          list = await goaAdminService.getSurveyViewDashboard(activeStatus);
        }
        if (!cancelled) {
          setSurveys(Array.isArray(list) ? list : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[GoaSRTSurveyStatusView] fetch error:', err);
          setError(err?.message || 'Failed to load survey records from server.');
          setSurveys([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [activeStatus, activeDistrict, activeVendor]);

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: activeStatus ? activeStatus.replace(/-/g, ' ').toUpperCase() : 'All Survey Records',
    tone: 'accent',
    desc: `Drilling down survey records by status: "${activeStatus || 'All'}"`,
  };

  const districtOptions = useMemo(() => {
    const set = new Set<string>(allDistricts);
    surveys.forEach((s) => {
      const d = (s.district || '').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, surveys, activeDistrict]);

  const filteredSurveys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surveys;
    return surveys.filter((s) => {
      const vendorName = typeof s.vendor === 'object' ? s.vendor?.name || '' : String(s.vendor || s.survey_vendor || '');
      const lat = String(s.latitude || '');
      const lng = String(s.longitude || '');
      return (
        String(s.id).includes(q) ||
        (s.uid || s.unique_id || '').toLowerCase().includes(q) ||
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        (s.dept_name || '').toLowerCase().includes(q) ||
        vendorName.toLowerCase().includes(q) ||
        (s.agency_person_name || '').toLowerCase().includes(q) ||
        (s.agency_person_mobile || '').includes(q) ||
        (s.nodal_person_name || '').toLowerCase().includes(q) ||
        (s.meter_no || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        lat.includes(q) ||
        lng.includes(q)
      );
    });
  }, [surveys, search]);

  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination({ data: filteredSurveys, initialPageSize: 100 });

  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeGoaSurveyStatus(newStatus);
    const p = new URLSearchParams(searchParams);
    if (valid) {
      p.set('status', valid);
    } else {
      p.delete('status');
    }
    setSearchParams(p);
    setPage(1);
  };

  const handleDistrictChange = (newDistrict: string) => {
    const p = new URLSearchParams(searchParams);
    if (!newDistrict || newDistrict === 'All') {
      p.delete('district');
    } else {
      p.set('district', newDistrict);
    }
    setSearchParams(p);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    const p = new URLSearchParams();
    if (activeStatus) p.set('status', activeStatus);
    setSearchParams(p);
    setPage(1);
  };

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All') || (activeVendor && activeVendor !== 'All'));

  const approvedCount = useMemo(
    () => surveys.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 1).length,
    [surveys]
  );
  const surveyDoneCount = useMemo(
    () => surveys.filter((s) => Number(s.survey_status ?? s.status) === 1 || Boolean(s.survey_done)).length,
    [surveys]
  );
  const pendingAuditCount = useMemo(
    () => surveys.filter((s) => !s.survey_verify_status || Number(s.survey_verify_status ?? s.verify_status) === 0).length,
    [surveys]
  );

  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => `${idx + 1}` },
      { header: 'Survey ID', accessor: (r) => `${r.id}` },
      { header: 'Unique ID', accessor: (r) => r.uid || r.unique_id || DASH },
      { header: 'State', accessor: (r) => r.state || 'Goa' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Division', accessor: (r) => r.division || DASH },
      { header: 'Sub Division', accessor: (r) => r.sub_division || DASH },
      { header: 'Department', accessor: (r) => r.dept_name || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      {
        header: 'Surveyor Vendor',
        accessor: (r) => (typeof r.vendors === 'object' ? r.vendors?.name : r.vendor_name || (r.vendor || r.survey_vendor ? `Vendor ${r.vendor || r.survey_vendor}` : DASH)),
      },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Agency Contact', accessor: (r) => r.agency_person_name || DASH },
      { header: 'Agency Mobile', accessor: (r) => r.agency_person_mobile || DASH },
      { header: 'Nodal Person', accessor: (r) => r.nodal_person_name || DASH },
      { header: 'Nodal Contact', accessor: (r) => r.nodal_person_mobile || DASH },
      { header: 'Meter No.', accessor: (r) => r.meter_no || DASH },
      { header: 'Sanction Load (kW)', accessor: (r) => (r.sanction_load ? `${r.sanction_load}` : DASH) },
      { header: 'Connected Load (kW)', accessor: (r) => (r.connected_load ? `${r.connected_load}` : DASH) },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Survey Remarks', accessor: (r) => r.survey_remarks || r.remarks || DASH },
      {
        header: 'Survey Status',
        accessor: (r) => (Number(r.survey_status ?? r.status) === 1 || r.survey_done ? 'Done' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) => {
          const v = Number(r.survey_verify_status ?? r.verify_status ?? 0);
          return v === 1 ? 'Approved' : v === 2 ? 'Rejected' : 'Pending';
        },
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_Survey_${activeStatus || 'all'}_Register`;
  const fileTitle = `Goa SRT Survey ${currentStatusMeta.label} Register`;

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };

  const escapeExportValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""');
  };

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index))}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
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
        title={`Goa SRT Survey: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : activeVendor ? `Vendor ${activeVendor}` : 'All Goa Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Survey' },
          { label: 'SRT Survey' },
          { label: 'Dashboard', href: '/vendor-management/goa/srt/survey/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/vendor-management/goa/srt/survey/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/vendor-management/goa/srt/survey/assign-view" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">Assigned Surveys</span>
            </Link>
            <Link to="/vendor-management/goa/srt/survey/verify" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Verify Surveys →</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Failed to load survey data</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Category Total"
          value={loading ? '…' : surveys.length.toLocaleString('en-IN')}
          sub={`Status: "${currentStatusMeta.key || 'All'}"`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Selected Territory"
          value={activeDistrict || (activeVendor ? `Vendor ${activeVendor}` : 'All Districts')}
          sub={activeDistrict ? 'Single district filter active' : `${districtOptions.length} districts recorded`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Surveys Completed"
          value={loading ? '…' : surveyDoneCount.toLocaleString('en-IN')}
          sub={`${surveys.length - surveyDoneCount} field surveys pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Audit Approved"
          value={loading ? '…' : approvedCount.toLocaleString('en-IN')}
          sub={`${pendingAuditCount} audit pending in this view`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="goa-survey-status-tabpanel" role="tabpanel" aria-label="Goa SRT Survey Status Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {currentStatusMeta.label} Register
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSurveys.length}</span> of <span className="ax-num">{surveys.length}</span> survey records
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {activeDistrict ? ` · District: ${activeDistrict}` : activeVendor ? ` · Vendor: ${activeVendor}` : ' · All Districts'}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Status Dropdown */}
              <select
                id="goa_survey_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by survey status category"
              >
                {GOA_SURVEY_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="goa_survey_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeDistrict || 'All'}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="All">All Districts</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
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

              <div style={{ width: 220 }}>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                  placeholder="Search site, vendor, ID…"
                  size="sm"
                  ariaLabel="Search status records"
                />
              </div>

              <TableExportToolbar
                onExportCSV={() => exportToCSV(filteredSurveys, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSurveys, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSurveys, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container (Wide Horizontal Scrolling) ── */}
        <div className="ax-table-wrap ula-table--wide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2200 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 85 }}>Survey ID</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Division</th>
                <th className="ax-table__th">Sub Division</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Surveyor Vendor</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Agency Contact</th>
                <th className="ax-table__th">Agency Mobile</th>
                <th className="ax-table__th">Nodal Person</th>
                <th className="ax-table__th">Nodal Mobile</th>
                <th className="ax-table__th">Meter No.</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Connected Load</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Building Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Roof Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Control Room</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Other Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Survey PDF</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Survey Date</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Remarks</th>
                <th className="ax-table__th">Survey Status</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={30} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <span className="ax-spinner" />
                    <p style={{ marginTop: 8, fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                      Fetching {currentStatusMeta.label} records from server…
                    </p>
                  </td>
                </tr>
              )}

              {!loading && filteredSurveys.length === 0 && (
                <tr>
                  <td colSpan={30} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Survey Records Found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No survey records are currently categorized under "${currentStatusMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = row.latitude ? String(row.latitude) : '';
                  const lng = row.longitude ? String(row.longitude) : '';
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const siteLabel = row.site_name || `Survey ${row.id}`;
                  const vStatus = Number(row.survey_verify_status ?? row.verify_status ?? 0);
                  const isVerifyApproved = vStatus === 1;
                  const vendorName =
                    typeof row.vendors === 'object'
                      ? row.vendors?.name
                      : row.vendor_name || (row.vendor || row.survey_vendor ? `Vendor ${row.vendor || row.survey_vendor}` : DASH);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          {row.id}
                        </span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{row.uid || row.unique_id || DASH}</td>
                      <td className="ax-table__td">{row.state || 'Goa'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td">{row.division || DASH}</td>
                      <td className="ax-table__td">{row.sub_division || DASH}</td>
                      <td className="ax-table__td">{row.dept_name || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name || DASH}</span>
                      </td>
                      <td className="ax-table__td">{vendorName}</td>
                      <td className="ax-table__td" style={monoCell}>{row.ca_no || DASH}</td>
                      <td className="ax-table__td">{row.agency_person_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.agency_person_mobile || DASH}</td>
                      <td className="ax-table__td">{row.nodal_person_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.nodal_person_mobile || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.meter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.sanction_load ? `${row.sanction_load} kW` : DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.connected_load ? `${row.connected_load} kW` : DASH}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.image1}
                          alt={`${siteLabel} - Building Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.image2}
                          alt={`${siteLabel} - Roof Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.image3}
                          alt={`${siteLabel} - Control Room Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.image4}
                          alt={`${siteLabel} - Other Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.pdf_file}
                          alt={`${siteLabel} - Survey PDF`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open coordinates in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.survey_date || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.survey_remarks || row.remarks || DASH}
                      </td>

                      <td className="ax-table__td">
                        <SurveyStatusBadge value={row.survey_status ?? row.status} />
                      </td>
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.survey_verify_status} />
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => setDetailsRecord(row)}
                          title="View complete survey inspection parameters"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Media Zoom Preview Modal */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* Complete Inspection Details Modal */}
      {detailsRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true" onClick={() => setDetailsRecord(null)}>
          <div className="ax-modal__backdrop" />
          <div
            className="ax-modal__dialog ax-modal__dialog--lg"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840 }}
          >
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Survey Details · {detailsRecord.site_name || `Survey ${detailsRecord.id}`}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Survey ID: <b>{detailsRecord.id}</b> | Unique ID: <b>{detailsRecord.uid || detailsRecord.unique_id || DASH}</b> | District: <b>{detailsRecord.district || DASH}</b>
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailsRecord(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>DEPARTMENT</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.dept_name || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>DIVISION / SUB-DIVISION</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.division || DASH} / {detailsRecord.sub_division || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>CA NUMBER</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.ca_no || DASH}</div>
                </div>

                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>AGENCY CONTACT PERSON</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.agency_person_name || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>AGENCY MOBILE</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.agency_person_mobile || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>NODAL PERSON / PHONE</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.nodal_person_name || DASH} ({detailsRecord.nodal_person_mobile || DASH})</div>
                </div>

                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>SANCTION LOAD</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.sanction_load ? `${detailsRecord.sanction_load} kW` : DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>CONNECTED LOAD</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.connected_load ? `${detailsRecord.connected_load} kW` : DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>METER NO. / TYPE</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.meter_no || DASH} ({detailsRecord.meter_type || DASH})</div>
                </div>

                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>TOTAL ROOF AREA</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.total_roof_area || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>FREE SPACE FOR SOLAR</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.free_space_for_solar || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>ROOF CONDITION</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.roof_condition || DASH}</div>
                </div>

                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>ACCESS TO ROOF / HEIGHT</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.access_to_roof || DASH} ({detailsRecord.rooftop_height || DASH})</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>GRID POWER AVAILABILITY</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.grid_power_availability || DASH}</div>
                </div>
                <div>
                  <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>THREE-PHASE AVAILABILITY</small>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detailsRecord.three_phase_availability || DASH}</div>
                </div>
              </div>

              {/* Photos Gallery */}
              <div style={{ marginTop: 20 }}>
                <small style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SURVEY PHOTOGRAPHS & DOCUMENTS
                </small>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  {detailsRecord.image1 && (
                    <div style={{ textAlign: 'center' }}>
                      <InstallationThumbnail src={detailsRecord.image1} alt="Building Image" onPreview={openPreview} />
                      <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>Building</div>
                    </div>
                  )}
                  {detailsRecord.image2 && (
                    <div style={{ textAlign: 'center' }}>
                      <InstallationThumbnail src={detailsRecord.image2} alt="Roof Image" onPreview={openPreview} />
                      <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>Roof</div>
                    </div>
                  )}
                  {detailsRecord.image3 && (
                    <div style={{ textAlign: 'center' }}>
                      <InstallationThumbnail src={detailsRecord.image3} alt="Control Room" onPreview={openPreview} />
                      <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>Control Room</div>
                    </div>
                  )}
                  {detailsRecord.image4 && (
                    <div style={{ textAlign: 'center' }}>
                      <InstallationThumbnail src={detailsRecord.image4} alt="Other Image" onPreview={openPreview} />
                      <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>Other</div>
                    </div>
                  )}
                  {detailsRecord.pdf_file && (
                    <div style={{ textAlign: 'center' }}>
                      <InstallationThumbnail src={detailsRecord.pdf_file} alt="Survey PDF" onPreview={openPreview} />
                      <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>Survey PDF</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginTop: 18, padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)' }}>Vendor Remarks:</div>
                <div style={{ fontSize: 12.5, color: 'var(--ax-text-muted)', marginTop: 2 }}>{detailsRecord.survey_remarks || detailsRecord.remarks || DASH}</div>
                {detailsRecord.survey_verify_remarks && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)' }}>Verification Audit Remarks:</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ax-text-muted)', marginTop: 2 }}>{detailsRecord.survey_verify_remarks}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="ax-modal__footer">
              <Link
                to="/vendor-management/goa/srt/survey/verify"
                className="ax-btn ax-btn--primary ax-btn--sm"
              >
                Go to Verification Desk →
              </Link>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailsRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
