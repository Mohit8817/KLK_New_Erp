import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upRescoSurveyAdminService,
  resolveUpMediaUrl,
  type UpRescoSurveySiteRow,
} from '../../up-services';
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
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

export function normalizeUpSurveyStatus(raw?: string | null): string {
  const s = String(raw || '').toLowerCase().trim();
  if (!s || s === 'all' || s === 'total') return 'all';
  if (s === 'assigned') return 'assigned';
  if (s === 'not-assigned' || s === 'not_assigned' || s === 'unassigned') return 'not-assigned';
  if (s === 'survey-done' || s === 'survey_done' || s === 'complete' || s === 'completed' || s === 'done')
    return 'survey-done';
  if (s === 'survey-pending' || s === 'survey_pending' || s === 'pending')
    return 'survey-pending';
  if (
    s === 'survey-verify-pending' ||
    s === 'survey_verify_pending' ||
    s === 'verify-pending' ||
    s === 'verify_pending'
  )
    return 'survey-verify-pending';
  if (
    s === 'survey-verify-complete' ||
    s === 'survey_verify_complete' ||
    s === 'verify-complete' ||
    s === 'verify-approved' ||
    s === 'verify_approved' ||
    s === 'approved'
  )
    return 'survey-verify-complete';
  if (
    s === 'survey-verify-reject' ||
    s === 'survey_verify_reject' ||
    s === 'verify-reject' ||
    s === 'verify_reject' ||
    s === 'rejected'
  )
    return 'survey-verify-reject';
  return s;
}

export interface UpSurveyStatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet' | 'danger';
  desc: string;
}

export const UP_SURVEY_STATUS_LIST: UpSurveyStatusMeta[] = [
  { key: 'all', label: 'All Sanctioned Sites', tone: 'accent', desc: 'All sanctioned UP Resco rooftop solar survey sites' },
  { key: 'assigned', label: 'Assigned to Vendors', tone: 'accent', desc: 'Sites allocated to authorized survey partner agencies' },
  { key: 'not-assigned', label: 'Unassigned Sites', tone: 'amber', desc: 'Sanctioned sites waiting for surveyor assignment' },
  { key: 'survey-done', label: 'Survey Completed', tone: 'emerald', desc: 'Sites where on-site feasibility report and photos are uploaded' },
  { key: 'survey-pending', label: 'Survey Pending', tone: 'amber', desc: 'Assigned sites pending physical survey execution' },
  { key: 'survey-verify-pending', label: 'Verification Pending', tone: 'amber', desc: 'Completed surveys awaiting engineering audit approval' },
  { key: 'survey-verify-complete', label: 'Verify Approved', tone: 'cyan', desc: 'Surveys successfully audited and sanctioned for installation' },
  { key: 'survey-verify-reject', label: 'Verification Rejected', tone: 'danger', desc: 'Surveys rejected during audit requiring vendor rework' },
];

const STATUS_META_MAP: Record<string, UpSurveyStatusMeta> = Object.fromEntries(
  UP_SURVEY_STATUS_LIST.map((m) => [m.key, m])
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
              {title || 'Survey Media Preview'}
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
              <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  Direct in-browser preview is not supported for this document format.
                </p>
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 18px',
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

function SurveyThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? resolveUpMediaUrl(src, 'resco') : null;

  if (!resolved || resolved === '—' || src === '—' || src === 'null' || !src) {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)' }}>{DASH}</span>;
  }

  const isPdf = /\.pdf($|\?)/i.test(resolved);

  return (
    <div
      onClick={() => onPreview(resolved, alt)}
      title="Click to preview survey document"
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      )}
    </div>
  );
}

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

const monoCell = {
  fontFamily: 'var(--ax-font-mono, monospace)',
  fontSize: 'var(--ax-text-xs, 12px)',
} as const;

export function UPRescoSurveyStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'survey-done';
  const activeStatus = normalizeUpSurveyStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();
  const activeVendor = (searchParams.get('vendor') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<UpRescoSurveySiteRow[]>([]);
  const [search, setSearch] = useState('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  // Pre-load district list from dashboard
  useEffect(() => {
    let cancelled = false;
    upRescoSurveyAdminService
      .getDashboard()
      .then((dash) => {
        if (!cancelled && Array.isArray(dash?.districtwise)) {
          const names = Array.from(
            new Set(dash.districtwise.map((d) => (d.district || '').trim()).filter(Boolean))
          ).sort();
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

  // Fetch status view data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let list: UpRescoSurveySiteRow[] = [];
        if (activeVendor && activeVendor !== 'All') {
          list = await upRescoSurveyAdminService.getVendorWise(activeStatus, activeVendor);
        } else if (activeDistrict && activeDistrict !== 'All') {
          list = await upRescoSurveyAdminService.getDistrictWise(activeStatus, activeDistrict);
        } else {
          list = await upRescoSurveyAdminService.getViewDashboard(activeStatus);
        }
        if (!cancelled) {
          setSites(Array.isArray(list) ? list : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[UPRescoSurveyStatusView] fetch error:', err);
          setError(err?.message || 'Failed to load survey records from server.');
          setSites([]);
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

  const currentStatusMeta: UpSurveyStatusMeta =
    STATUS_META_MAP[activeStatus] || {
      key: activeStatus,
      label: activeStatus,
      tone: 'accent',
      desc: `Drilling down sites by status: "${activeStatus}"`,
    };

  const districtOptions = useMemo(() => {
    const set = new Set<string>(allDistricts);
    sites.forEach((s) => {
      const d = (s.district || '').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, sites, activeDistrict]);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      const sId = String(s.id || s.site_id || '');
      const sName = (s.site_name || '').toLowerCase();
      const dist = (s.district || '').toLowerCase();
      const ca = (s.ca_no || '').toLowerCase();
      const vName = (s.vendor_name || s.vendors?.name || '').toLowerCase();
      const contact = (s.agency_contact_person_name || s.nodal_person || '').toLowerCase();
      const phone = (s.agency_contact_number || s.nodal_person_contact || '').toLowerCase();
      return (
        sId.includes(q) ||
        sName.includes(q) ||
        dist.includes(q) ||
        ca.includes(q) ||
        vName.includes(q) ||
        contact.includes(q) ||
        phone.includes(q)
      );
    });
  }, [sites, search]);

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredSites, initialPageSize: 100 });

  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeUpSurveyStatus(newStatus);
    const p = new URLSearchParams(searchParams);
    p.set('status', valid);
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
    p.set('status', activeStatus);
    setSearchParams(p);
    setPage(1);
  };

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All') || activeVendor);

  const approvedCount = useMemo(
    () => sites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 1).length,
    [sites]
  );
  const surveyDoneCount = useMemo(
    () => sites.filter((s) => Number(s.survey_status) === 1 || Number(s.survey_verify_status) >= 1).length,
    [sites]
  );

  const exportCols: ExportColumn<UpRescoSurveySiteRow>[] = useMemo(
    () => [
      { header: 'Site ID', accessor: (r) => `${r.id || r.site_id}` },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'State', accessor: (r) => r.state || 'Uttar Pradesh' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Division', accessor: (r) => r.division || DASH },
      { header: 'Department', accessor: (r) => r.dept_name || r.department || DASH },
      { header: 'Location', accessor: (r) => r.site_address || r.location || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Vendor', accessor: (r) => r.vendor_name || r.vendors?.name || (r.survey_vendor ? `Vendor #${r.survey_vendor}` : DASH) },
      { header: 'Agency Contact', accessor: (r) => r.agency_contact_person_name || r.agency_person_name || DASH },
      { header: 'Contact No.', accessor: (r) => r.agency_contact_number || r.agency_person_contact || DASH },
      { header: 'Nodal Person', accessor: (r) => r.nodal_person || DASH },
      { header: 'Survey Date', accessor: (r) => r.survey_date || DASH },
      { header: 'Sanction Load (kW)', accessor: (r) => r.sanction_load || DASH },
      { header: 'Roof Area (sq ft)', accessor: (r) => r.total_roof_area || r.area_roof || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Feasibility', accessor: (r) => (r.site_feasible === '1' || r.site_feasible === 'feasible' ? 'Feasible' : r.site_feasible === '0' ? 'Not Feasible' : DASH) },
      {
        header: 'Survey Status',
        accessor: (r) => (Number(r.survey_status) === 1 ? 'Completed' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) => {
          const v = Number(r.survey_verify_status ?? r.verify_status);
          if (v === 1) return 'Approved';
          if (v === 2) return 'Rejected';
          return 'Pending';
        },
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `UP_Resco_Survey_${activeStatus}_Sites`;
  const fileTitle = `UP Resco Survey ${currentStatusMeta.label} Register`;

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return (column.accessor as any)(row);
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
    const rows = list.map((row) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c))}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
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
        title={`UP Resco Survey: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : activeVendor ? `Vendor #${activeVendor}` : 'All Uttar Pradesh Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Survey' },
          { label: 'Resco Survey', href: '/vendor-management/up/resco/survey/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/vendor-management/up/resco/survey/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/vendor-management/up/resco/survey/verify" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Verify Survey Registry →</span>
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
          value={loading ? '…' : sites.length.toLocaleString('en-IN')}
          sub={`Status: "${currentStatusMeta.key}"`}
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
          value={activeDistrict || (activeVendor ? `Vendor #${activeVendor}` : 'All Districts')}
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
          label="Audit Approved"
          value={loading ? '…' : approvedCount.toLocaleString('en-IN')}
          sub="Technical feasibility verified"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Surveys Done"
          value={loading ? '…' : surveyDoneCount.toLocaleString('en-IN')}
          sub="Field surveys completed"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="resco-survey-status-tabpanel" role="tabpanel" aria-label="UP Resco Survey Status Sites Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {currentStatusMeta.label} Table
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> sites
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {activeDistrict ? ` · District: ${activeDistrict}` : activeVendor ? ` · Vendor #${activeVendor}` : ' · All Districts'}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Status Dropdown */}
              <select
                id="survey_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by survey status category"
              >
                {UP_SURVEY_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="survey_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
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
                  placeholder="Search site, CA, vendor…"
                  size="sm"
                  ariaLabel="Search status records"
                />
              </div>

              <TableExportToolbar
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap ula-table--wide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 85 }}>Site ID</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Site Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Location</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Vendor Partner</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact No.</th>
                <th className="ax-table__th">Nodal Person</th>
                <th className="ax-table__th">Survey Date</th>
                <th className="ax-table__th ax-table__th--num">Sanction Load</th>
                <th className="ax-table__th ax-table__th--num">Roof Area</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Building</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Roof Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Control Room</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Meter Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 80 }}>Survey PDF</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Feasibility</th>
                <th className="ax-table__th">Survey Status</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={26} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <span className="ax-spinner" />
                    <p style={{ marginTop: 8, fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                      Fetching {currentStatusMeta.label} records from server…
                    </p>
                  </td>
                </tr>
              )}

              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={26} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Survey Records Found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query.'
                          : `No sites are currently categorized under "${currentStatusMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedData.map((row, index) => {
                  const sId = row.id || row.site_id;
                  const lat = String(row.latitude || '');
                  const lng = String(row.longitude || '');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const siteLabel = row.site_name || `Site ${sId}`;

                  const vStatus = Number(row.survey_verify_status ?? row.verify_status ?? 0);
                  const isApproved = vStatus === 1;
                  const isRejected = vStatus === 2;
                  const sStatus = Number(row.survey_status ?? 0);

                  const buildingImg = row.building_image || row.image1;
                  const roofImg = row.roof_image || row.image2;
                  const controlImg = row.control_room_image || row.image3;
                  const meterImg = row.meter_image || row.image4;
                  const surveyPdf = row.pdf || row.pdf_file;

                  const isFeasible = row.site_feasible === '1' || row.site_feasible === 'feasible';
                  const isNotFeasible = row.site_feasible === '0' || row.site_feasible === 'not_feasible';

                  return (
                    <tr key={sId || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          #{sId}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || DASH}
                      </td>
                      <td className="ax-table__td">{row.state || 'Uttar Pradesh'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td">{row.dept_name || row.department || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.site_address || row.location || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>{row.ca_no || DASH}</td>
                      <td className="ax-table__td">
                        {row.vendor_name || row.vendors?.name || (row.survey_vendor ? `Vendor #${row.survey_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td">{row.agency_contact_person_name || row.agency_person_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.agency_contact_number || row.agency_person_contact || DASH}</td>
                      <td className="ax-table__td">{row.nodal_person || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.survey_date || DASH}</td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td ax-table__td--num">
                        {row.total_roof_area || row.area_roof ? `${row.total_roof_area || row.area_roof} sq ft` : DASH}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail src={buildingImg} alt={`${siteLabel} - Building Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail src={roofImg} alt={`${siteLabel} - Roof Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail src={controlImg} alt={`${siteLabel} - Control Room Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail src={meterImg} alt={`${siteLabel} - Meter Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail src={surveyPdf} alt={`${siteLabel} - Survey Document`} onPreview={openPreview} />
                      </td>

                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td">
                        {isFeasible ? (
                          <Badge tone="success">Feasible</Badge>
                        ) : isNotFeasible ? (
                          <Badge tone="danger">Not Feasible</Badge>
                        ) : (
                          <Badge tone="neutral">Pending</Badge>
                        )}
                      </td>

                      <td className="ax-table__td">
                        {sStatus === 1 ? (
                          <Badge tone="success">Completed</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>

                      <td className="ax-table__td">
                        {isApproved ? (
                          <Badge tone="success">Approved</Badge>
                        ) : isRejected ? (
                          <Badge tone="danger">Rejected</Badge>
                        ) : (
                          <Badge tone="warning">Pending Audit</Badge>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 11px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--ax-text-muted, #64748b)',
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              borderRadius: 6,
                              cursor: 'not-allowed',
                              userSelect: 'none',
                            }}
                            title="Survey Approved and locked."
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: 13, height: 13, color: '#64748b' }}
                              aria-hidden="true"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => navigate(`/vendor-management/up/resco/survey/verify?site_id=${sId}`)}
                          >
                            Review
                          </button>
                        )}
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
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export const StatusView = UPRescoSurveyStatusView;
export default UPRescoSurveyStatusView;
