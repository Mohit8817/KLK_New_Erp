import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaAdminService,
  resolveGoaMediaUrl,
  type GoaAmcVendor,
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
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved' || r === 'verified') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const AmcStatusBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'done' || r === 'complete' || r === 'completed') {
    return <Badge tone="success">Completed</Badge>;
  }
  return <Badge tone="warning">Pending</Badge>;
};

export interface StatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const GOA_AMC_STATUS_LIST: StatusMeta[] = [
  { key: 'total-site', label: 'All AMC Sites', tone: 'accent', desc: 'All rooftop solar AMC contracts across Goa' },
  { key: 'amc-assigned', label: 'Assigned Sites', tone: 'accent', desc: 'Sites assigned to vendors for maintenance' },
  { key: 'not-assigned', label: 'Unassigned Sites', tone: 'amber', desc: 'Sites pending vendor AMC assignment' },
  { key: 'complete', label: 'Completed AMC Visits', tone: 'emerald', desc: 'Periodic maintenance completed with photographic log' },
  { key: 'pending', label: 'Pending Maintenance', tone: 'amber', desc: 'Sites due for periodic maintenance service' },
  { key: 'verify-approved', label: 'Maintenance Approved', tone: 'cyan', desc: 'Service visits inspected and verified by auditors' },
  { key: 'verify-pending', label: 'Audit Pending', tone: 'amber', desc: 'Uploaded service logs awaiting technical audit' },
  { key: 'verify-reject', label: 'Maintenance Rejected', tone: 'amber', desc: 'Service reports rejected with rectification requirements' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  GOA_AMC_STATUS_LIST.map((m) => [m.key, m])
);

/* ───────── Pure SVG Icons (Zero Emojis) ───────── */
const I_CLOSE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const I_EXTERNAL = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const I_LOCKED = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#64748b' }} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
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
            {I_CLOSE}
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
            {status === 'loading' && (
              <div className="ula-m-stage__msg">
                <span className="ax-spinner" /> Loading media...
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Download / Open File</span>
                  {I_EXTERNAL}
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
                -
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
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>Open in new tab</span>
              {I_EXTERNAL}
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

function AMCThumbnail({
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

export function GoaSRTAMCStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'complete';
  const activeStatus = rawStatus.toLowerCase().replace(/[\s_]+/g, '-');
  const activeDistrict = (searchParams.get('district') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [vendorsList, setVendorsList] = useState<GoaAmcVendor[]>([]);
  const [search, setSearch] = useState('');
  const [allDistricts, setAllDistricts] = useState<string[]>(['North Goa', 'South Goa']);

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Fetch Vendor Names and Drilldown records
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      goaAdminService.getAMCDrilldown(activeStatus),
      goaAdminService.getAMCAssignFormData(),
    ]).then(([drillRes, formRes]) => {
      if (cancelled) return;

      if (drillRes.status === 'fulfilled') {
        setSites(Array.isArray(drillRes.value) ? drillRes.value : []);
      } else {
        console.warn('Drilldown fetch error:', drillRes.reason);
        setError(drillRes.reason?.message || 'Failed to load AMC records');
        setSites([]);
      }

      if (formRes.status === 'fulfilled') {
        const fData = formRes.value;
        if (Array.isArray(fData.vendors)) setVendorsList(fData.vendors);
        if (Array.isArray(fData.district)) {
          const dList = fData.district.map((d: any) => (typeof d === 'string' ? d : d.district)).filter(Boolean);
          if (dList.length > 0) setAllDistricts(Array.from(new Set(dList)));
        }
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeStatus]);

  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendorsList.forEach((v) => map.set(String(v.id), v.name));
    return map;
  }, [vendorsList]);

  const getVendorName = useCallback(
    (vendorId: string | number | null | undefined) => {
      if (!vendorId) return DASH;
      return vendorMap.get(String(vendorId)) || `Vendor #${vendorId}`;
    },
    [vendorMap]
  );

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: activeStatus,
    tone: 'accent',
    desc: `Drilling down AMC by status: "${activeStatus}"`,
  };

  const districtOptions = useMemo(() => {
    const set = new Set<string>(allDistricts);
    sites.forEach((s) => {
      const srt = s.srtdata || {};
      const d = (srt.district || s.district || '').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, sites, activeDistrict]);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sites.filter((s) => {
      const srt = s.srtdata || {};
      const dist = srt.district || s.district || '';

      if (activeDistrict && activeDistrict !== 'All' && dist.toLowerCase() !== activeDistrict.toLowerCase()) {
        return false;
      }
      if (!q) return true;

      const sName = (s.site_name || srt.site_name || '').toLowerCase();
      const sId = String(s.site_id || s.id || '');
      const vName = (s.vendor_name || getVendorName(s.amc_assigned_to || s.vendor)).toLowerCase();
      const caNo = (srt.ca_no || srt.consumer_no || s.ca_number || '').toLowerCase();
      const dept = (srt.dept_name || srt.department_name || '').toLowerCase();
      const loc = (srt.location || srt.address || '').toLowerCase();

      return (
        sId.includes(q) ||
        sName.includes(q) ||
        dist.toLowerCase().includes(q) ||
        vName.includes(q) ||
        caNo.includes(q) ||
        dept.includes(q) ||
        loc.includes(q)
      );
    });
  }, [sites, search, activeDistrict, getVendorName]);

  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination({ data: filteredSites, initialPageSize: 100 });

  const handleStatusChange = (newStatus: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('status', newStatus);
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

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All'));

  const approvedCount = useMemo(
    () => sites.filter((s) => Number(s.amcverify_status ?? s.verify_status) === 1).length,
    [sites]
  );
  const pendingAuditCount = useMemo(
    () => sites.filter((s) => !s.amcverify_status || Number(s.amcverify_status ?? s.verify_status) === 0).length,
    [sites]
  );
  const amcDoneCount = useMemo(
    () => sites.filter((s) => Boolean(s.visit_done || Number(s.amc_status) === 1)).length,
    [sites]
  );

  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => `${idx + 1}` },
      { header: 'AMC Record ID', accessor: (r) => `${r.id || DASH}` },
      { header: 'Site ID', accessor: (r) => `${r.site_id || r.id || DASH}` },
      { header: 'AMC Round', accessor: (r) => (r.amc ? `AMC ${r.amc}` : DASH) },
      { header: 'State', accessor: (r) => r.state || 'Goa' },
      { header: 'District', accessor: (r) => r.srtdata?.district || r.district || DASH },
      { header: 'Dept Name', accessor: (r) => r.srtdata?.dept_name || r.srtdata?.department_name || r.srtdata?.department || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || r.srtdata?.site_name || DASH },
      { header: 'Location', accessor: (r) => r.srtdata?.location || r.srtdata?.address || r.srtdata?.city || DASH },
      { header: 'Firm Name', accessor: (r) => r.srtdata?.firm_name || r.srtdata?.agency_name || DASH },
      { header: 'CA No', accessor: (r) => r.srtdata?.ca_no || r.srtdata?.consumer_no || r.ca_number || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.srtdata?.sanction_load ? `${r.srtdata.sanction_load} kW` : (r.capacity ? `${r.capacity} kW` : DASH)) },
      { header: 'Plant SC', accessor: (r) => r.srtdata?.plant_sc || r.srtdata?.plant_sc_no || r.srtdata?.sc_no || DASH },
      { header: 'WO No', accessor: (r) => r.srtdata?.wo_no || r.srtdata?.work_order_no || r.srtdata?.workorder_no || DASH },
      { header: 'Phase', accessor: (r) => r.srtdata?.phase || r.srtdata?.project_phase || DASH },
      { header: 'Assigned Vendor', accessor: (r) => r.vendor_name || getVendorName(r.amc_assigned_to || r.vendor) },
      { header: 'Assigned Time', accessor: (r) => r.amc_assigned_time || DASH },
      {
        header: 'AMC Status',
        accessor: (r) => (r.visit_done || Number(r.amc_status) === 1 ? 'Completed' : 'Pending'),
      },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.amcverify_status ?? r.verify_status) === 1
            ? 'Approved'
            : Number(r.amcverify_status ?? r.verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_AMC_${activeStatus}_Sites`;
  const fileTitle = `Goa SRT AMC ${currentStatusMeta.label} Register`;

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
        title={`Goa SRT AMC: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : 'All Goa Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Dashboard', href: '/vendor-management/goa/srt/amc/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/vendor-management/goa/srt/amc/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">Back to Dashboard</span>
            </Link>
            <Link to="/vendor-management/goa/srt/amc/view-assign" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Assigned Sites</span>
            </Link>
            <Link to="/vendor-management/goa/srt/amc/verify" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Verify AMC Status</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Failed to load data</div>
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
          value={activeDistrict || 'All Districts'}
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
          sub={`${pendingAuditCount} audit pending in this view`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Maintenance Completed"
          value={loading ? '…' : amcDoneCount.toLocaleString('en-IN')}
          sub="Service visits logged by vendor"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="goa-amc-status-tabpanel" role="tabpanel" aria-label="Goa SRT AMC Status Sites Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {currentStatusMeta.label} Table
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> sites
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {activeDistrict ? ` · District: ${activeDistrict}` : ' · All Districts'}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Status Dropdown */}
              <select
                id="goa_amc_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by AMC status category"
              >
                {GOA_AMC_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="goa_amc_district_filter"
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
                  placeholder="Search site, vendor, CA..."
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
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1650 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 90 }}>Record ID</th>
                <th className="ax-table__th" style={{ width: 90 }}>Site ID</th>
                <th className="ax-table__th">AMC Round</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Dept Name</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Location</th>
                <th className="ax-table__th">Firm Name</th>
                <th className="ax-table__th">CA No</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Plant SC</th>
                <th className="ax-table__th">WO No</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">Assigned Vendor</th>
                <th className="ax-table__th">Assigned Time</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Net Meter Image</th>
                <th className="ax-table__th">AMC Status</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={24} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <span className="ax-spinner" />
                    <p style={{ marginTop: 8, fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                      Fetching {currentStatusMeta.label} records from server...
                    </p>
                  </td>
                </tr>
              )}

              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={24} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Site Records Found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
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
                  const srt = row.srtdata || {};
                  const recordId = row.id || DASH;
                  const siteId = row.site_id || row.id || DASH;
                  const siteLabel = row.site_name || srt.site_name || `Site #${siteId}`;
                  const amcRound = row.amc || srt.amc || null;
                  const vStatus = Number(row.amcverify_status ?? row.verify_status ?? 0);
                  const isVerifyApproved = vStatus === 1;
                  const vendorName = row.vendor_name || getVendorName(row.amc_assigned_to || row.vendor);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          {recordId}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <b>{siteId}</b>
                      </td>
                      <td className="ax-table__td">
                        <span
                          className="ax-badge"
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {amcRound ? `AMC ${amcRound}` : 'AMC'}
                        </span>
                      </td>
                      <td className="ax-table__td">{row.state || 'Goa'}</td>
                      <td className="ax-table__td"><b>{srt.district || row.district || DASH}</b></td>
                      <td className="ax-table__td">{srt.dept_name || srt.department_name || srt.department || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteLabel}</span>
                      </td>
                      <td className="ax-table__td">{srt.location || srt.address || srt.city || DASH}</td>
                      <td className="ax-table__td">{srt.firm_name || srt.agency_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{srt.ca_no || srt.consumer_no || row.ca_number || DASH}</td>
                      <td className="ax-table__td">{srt.sanction_load ? `${srt.sanction_load} kW` : (row.capacity ? `${row.capacity} kW` : DASH)}</td>
                      <td className="ax-table__td" style={monoCell}>{srt.plant_sc || srt.plant_sc_no || srt.sc_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{srt.wo_no || srt.work_order_no || srt.workorder_no || DASH}</td>
                      <td className="ax-table__td">{srt.phase || srt.project_phase || DASH}</td>
                      <td className="ax-table__td">{vendorName}</td>
                      <td className="ax-table__td" style={monoCell}>{row.amc_assigned_time || DASH}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <AMCThumbnail
                          src={row.system_image || srt.system_image}
                          alt={`${siteLabel} - System Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <AMCThumbnail
                          src={row.panel_image || srt.panel_image}
                          alt={`${siteLabel} - Panel Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <AMCThumbnail
                          src={row.inverter_image || srt.inverter_image}
                          alt={`${siteLabel} - Inverter Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <AMCThumbnail
                          src={row.nm_sm_image || srt.nm_sm_image}
                          alt={`${siteLabel} - Net Meter Image`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td">
                        <AmcStatusBadge value={Number(row.amc_status)} raw={row.visit_done ? '1' : row.amc_status} />
                      </td>
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.amcverify_status ?? row.verify_status} />
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isVerifyApproved ? (
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
                            title="AMC Verified & Approved. Actions are locked."
                          >
                            {I_LOCKED}
                            <span>Locked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => navigate(`/vendor-management/goa/srt/amc/verify?site_id=${siteId}`)}
                          >
                            Audit
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

export const StatusView = GoaSRTAMCStatusView;
export default GoaSRTAMCStatusView;
