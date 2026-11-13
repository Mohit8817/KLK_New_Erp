import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  punjabAdminService,
  resolvePunjabMediaUrl,
  normalizePunjabDashboardStatus,
  type LightVerificationItem,
  type PunjabDashboardStatus,
  PUNJAB_DISTRICTS,
} from '../../punjab-services';
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

const VerifyBadge = ({ value, raw }: { value: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  if (status === 2) return <Badge tone="success">Payment Settled</Badge>;
  if (status === 1) return <Badge tone="info">Claim Applicable</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const txt = (row: LightVerificationItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

export interface StatusMeta {
  key: PunjabDashboardStatus;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const PUNJAB_STATUS_LIST: StatusMeta[] = [
  { key: 'total', label: 'All Allocated Lights', tone: 'accent', desc: 'All solar street lights allocated across Punjab' },
  { key: 'complete', label: 'Installed Lights', tone: 'emerald', desc: 'Lights where installation is completed on site' },
  { key: 'pending', label: 'Pending Installation', tone: 'amber', desc: 'Assigned lights awaiting field installation execution' },
  { key: 'verify-pending', label: 'Verification Pending', tone: 'amber', desc: 'Installed lights awaiting departmental audit' },
  { key: 'verify-approved', label: 'Verify Approved', tone: 'cyan', desc: 'Lights successfully inspected and authorized' },
  { key: 'verify-reject', label: 'Verification Rejected', tone: 'amber', desc: 'Lights flagged with audit discrepancies' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'violet', desc: 'Lights eligible for vendor payment claims' },
  { key: 'claim-approved', label: 'Claim Approved', tone: 'emerald', desc: 'Vendor payment claims reviewed and authorized' },
  { key: 'pay-done', label: 'Payment Settled', tone: 'emerald', desc: 'Fully disbursed and settled light installations' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  PUNJAB_STATUS_LIST.map((m) => [m.key, m])
);

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const isPdf = /\.pdf($|\?)/i.test(url);
  const isHeic = /\.heic($|\?)/i.test(url);
  const isDoc = /\.(docx?|xlsx?)($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf || isHeic || isDoc ? 'ready' : 'loading');
  }, [url, isPdf, isHeic, isDoc]);

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
              {title || 'Light Installation Photo Preview'}
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
              <div className="ula-m-stage__msg">Photo could not be loaded. Try opening it in a new tab.</div>
            )}

            {isPdf ? (
              <iframe
                src={url}
                title={title || 'Document Preview'}
                style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
              />
            ) : isHeic || isDoc ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  Direct in-browser preview is not supported for this file format ({isHeic ? 'HEIC' : 'DOC'}).
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
          {!isPdf && !isHeic && !isDoc ? (
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
  const resolved = src ? resolvePunjabMediaUrl(src) : null;

  if (!resolved || resolved === '—' || src === '—') {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)', fontSize: 11 }}>No Photo</span>;
  }

  const isPdf = /\.pdf($|\?)/i.test(resolved);
  const isHeic = /\.heic($|\?)/i.test(resolved);
  const isDoc = /\.(docx?|xlsx?)($|\?)/i.test(resolved);

  return (
    <div
      onClick={() => onPreview(resolved, alt)}
      title="Click to preview installation photo"
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
      {!isPdf && !isHeic && !isDoc && !failed ? (
        <img
          src={resolved}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0 }}
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
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
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
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
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
  .solar-erp-page .asw-table-scroll {
    position: relative;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: auto !important;
    overflow-y: visible !important;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .asw-table-scroll table.ax-table {
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .solar-erp-page .asw-table-scroll th,
  .solar-erp-page .asw-table-scroll td {
    white-space: nowrap;
    padding: 10px 14px;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const monoCell = { fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 'var(--ax-text-xs, 12px)' } as const;

export function StatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'complete';
  const activeStatus = normalizePunjabDashboardStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();
  const activeVendor = (searchParams.get('vendor') || '').trim();

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: activeStatus,
    tone: 'accent',
    desc: `Drilling down lights by status: "${activeStatus}"`,
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lights, setLights] = useState<LightVerificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});

  // Modal states
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [selectedLight, setSelectedLight] = useState<LightVerificationItem | null>(null);

  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Fetch districts list from dashboard
  useEffect(() => {
    let cancelled = false;
    punjabAdminService.getDashboard().then((dash) => {
      if (!cancelled && Array.isArray(dash?.districtwise)) {
        const names = Array.from(new Set(dash.districtwise.map((d) => (d.district || '').trim()).filter(Boolean))).sort() as string[];
        if (names.length > 0) setAllDistricts(names);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load Status View Lights
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let listPromise: Promise<LightVerificationItem[]>;
      if (activeVendor && activeVendor !== 'All') {
        listPromise = punjabAdminService.getVendorWiseData(activeStatus, activeVendor);
      } else if (activeDistrict && activeDistrict !== 'All') {
        listPromise = punjabAdminService.getDistrictWiseData(activeStatus, activeDistrict);
      } else {
        listPromise = punjabAdminService.getViewDashboard(activeStatus);
      }

      const [vMap, list] = await Promise.all([
        punjabAdminService.getVendorMap(),
        listPromise,
      ]);
      if (vMap) setVendorMap(vMap);
      setLights(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[PunjabStatusView] fetch error:', err);
      setError(err?.message || 'Failed to load status records from server.');
      setLights([]);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, activeDistrict, activeVendor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getVendorName = useCallback(
    (row: LightVerificationItem | string | number | undefined): string => {
      if (!row) return DASH;
      return punjabAdminService.resolveVendorName(row, vendorMap);
    },
    [vendorMap]
  );

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>(allDistricts.length ? allDistricts : PUNJAB_DISTRICTS);
    lights.forEach((l) => {
      const d = (l.district || '').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, lights, activeDistrict]);

  // Filtered rows
  const filteredLights = useMemo(() => {
    let list = [...lights];
    if (activeVendor && activeVendor !== 'All') {
      list = list.filter((l) => String(l.inst_vendor ?? l.vendor) === String(activeVendor));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const vName = getVendorName(l).toLowerCase();
        const uid = String(l.uid || l.unique_id || l.id || '').toLowerCase();
        const dist = (l.district || '').toLowerCase();
        const blk = (l.block || '').toLowerCase();
        const panch = (l.panchayat || '').toLowerCase();
        const ben = (l.beneficiary_name || '').toLowerCase();
        const contact = (l.beneficiary_contact || l.contact_number || '').toLowerCase();
        const sarpanch = (l.sarpanch_name || '').toLowerCase();
        const lightNo = (l.light_no || '').toLowerCase();
        const battNo = (l.battery_no || '').toLowerCase();
        const panelNo = (l.panel_no || '').toLowerCase();
        const uuidNo = (l.uuid_no || '').toLowerCase();
        const remarks = (l.inst_remark || l.remark || '').toLowerCase();
        return (
          vName.includes(q) ||
          uid.includes(q) ||
          dist.includes(q) ||
          blk.includes(q) ||
          panch.includes(q) ||
          ben.includes(q) ||
          contact.includes(q) ||
          sarpanch.includes(q) ||
          lightNo.includes(q) ||
          battNo.includes(q) ||
          panelNo.includes(q) ||
          uuidNo.includes(q) ||
          remarks.includes(q)
        );
      });
    }
    return list;
  }, [lights, activeVendor, searchQuery, getVendorName]);

  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination({ data: filteredLights, initialPageSize: 100 });

  const handleStatusChange = (newStatus: string) => {
    const valid = normalizePunjabDashboardStatus(newStatus);
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
    setSearchQuery('');
    const p = new URLSearchParams();
    p.set('status', activeStatus);
    setSearchParams(p);
    setPage(1);
  };

  const hasFilters = Boolean(searchQuery || (activeDistrict && activeDistrict !== 'All') || (activeVendor && activeVendor !== 'All'));

  // Metrics
  const approvedCount = useMemo(
    () => lights.filter((s) => Number(s.inst_verify_status ?? s.status) === 1).length,
    [lights]
  );
  const pendingAuditCount = useMemo(
    () => lights.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.status) === 0).length,
    [lights]
  );
  const settledCount = useMemo(
    () => lights.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 2).length,
    [lights]
  );

  // Export Columns (Clean headers, no #)
  const exportCols: ExportColumn<LightVerificationItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (currentPage - 1) * pageSize + idx + 1 },
      { header: 'UID', accessor: (r) => String(r.uid || r.unique_id || r.id || DASH) },
      { header: 'Vendor', accessor: (r) => getVendorName(r) },
      { header: 'State', accessor: (r) => r.state || 'Punjab' },
      { header: 'Volume', accessor: (r) => r.volume || r.phase || '2' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No', accessor: (r) => r.ward_no ?? DASH },
      { header: 'Pole No', accessor: (r) => r.pole_no ?? DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Beneficiary Contact', accessor: (r) => r.beneficiary_contact || r.contact_number || DASH },
      { header: 'Sarpanch Name', accessor: (r) => r.sarpanch_name || DASH },
      { header: 'Sarpanch Contact', accessor: (r) => r.sarpanch_contact || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || DASH },
      { header: 'Battery No.', accessor: (r) => r.battery_no || DASH },
      { header: 'Panel No.', accessor: (r) => r.panel_no || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || r.lat || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || r.lng || DASH },
      { header: 'Remark', accessor: (r) => r.inst_remark || r.remark || DASH },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_verify_status ?? r.status) === 1
            ? 'Approved'
            : Number(r.inst_verify_status ?? r.status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      {
        header: 'Claim Status',
        accessor: (r) =>
          Number(r.inst_claim_status ?? r.claim_status) === 2
            ? 'Payment Settled'
            : Number(r.inst_claim_status ?? r.claim_status) === 1
            ? 'Claim Applicable'
            : 'Pending',
      },
    ],
    [getVendorName, currentPage, pageSize]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Punjab_SSL_${activeStatus}_Lights`;
  const fileTitle = `Punjab SSL ${currentStatusMeta.label} Register`;

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
        title={`Punjab SSL: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : 'All Punjab Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Dashboard', href: '/vendor-management/punjab/ssl/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/punjab/ssl/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/vendor-management/punjab/ssl/view-assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Assigned Lights →</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="alert">
          <div className="ax-alert__title">Failed to load data</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 Row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Category Total"
          value={loading ? '…' : lights.length.toLocaleString('en-IN')}
          sub={`Status: "${currentStatusMeta.label}"`}
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
          value={activeDistrict || 'All Punjab Districts'}
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
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={loading ? '…' : settledCount.toLocaleString('en-IN')}
          sub="Disbursed vendor payment lights"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="ssl-status-tabpanel" role="tabpanel" aria-label="Punjab SSL Status Lights Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {currentStatusMeta.label} Register
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredLights.length}</span> of <span className="ax-num">{lights.length}</span> lights
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {activeDistrict ? ` · District: ${activeDistrict}` : ' · All Districts'}
              {activeVendor ? ` · Vendor: ${punjabAdminService.resolveVendorName(activeVendor, vendorMap)}` : ''}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Status Dropdown */}
              <select
                id="ssl_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 'var(--ax-text-xs, 12px)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by installation status category"
              >
                {PUNJAB_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="ssl_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs, 12px)' }}
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
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs, 12px)' }}
                >
                  Reset
                </button>
              )}

              <div style={{ width: 220 }}>
                <SearchInput
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    setPage(1);
                  }}
                  placeholder="Search UID, vendor, beneficiary…"
                  size="sm"
                  ariaLabel="Search status records"
                />
              </div>

              <TableExportToolbar
                onExportCSV={() => exportToCSV(filteredLights, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredLights, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredLights, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* Status navigation pills */}
        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
          {PUNJAB_STATUS_LIST.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`ax-btn ax-btn--sm ${activeStatus === s.key ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              style={{ borderRadius: 9999, fontSize: 12, padding: '4px 12px', whiteSpace: 'nowrap' }}
              onClick={() => handleStatusChange(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Table Container (23 Columns, Responsive Scroll, NO #) ── */}
        <div className="asw-table-scroll ula-table--wide">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 110 }}>Light UID</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Volume</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Ward No</th>
                <th className="ax-table__th">Pole No</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Beneficiary Contact</th>
                <th className="ax-table__th">Sarpanch Name</th>
                <th className="ax-table__th">Sarpanch Contact</th>
                <th className="ax-table__th">Light No.</th>
                <th className="ax-table__th">Battery No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th">UUID No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Light Photo</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Remarks</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={25} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="ax-spinner" />
                      <span style={{ fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                        Fetching {currentStatusMeta.label} records from server…
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredLights.length === 0 && (
                <tr>
                  <td colSpan={25} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Light Records Found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No lights are currently categorized under "${currentStatusMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedData.map((row, index) => {
                  const globalIdx = (currentPage - 1) * pageSize + index + 1;
                  const vName = getVendorName(row);
                  const uidStr = String(row.uid || row.unique_id || row.id || DASH);
                  const lat = txt(row, 'latitude') || txt(row, 'lat');
                  const lng = txt(row, 'longitude') || txt(row, 'lng');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const lightImg = row.light_file || row.file || row.inst_file;
                  const vStatus = Number(row.inst_verify_status ?? row.status ?? 0);
                  const rawVerifyStr = String(row.inst_verify_status ?? row.status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          {uidStr}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                        {vName}
                      </td>
                      <td className="ax-table__td">{row.state || 'Punjab'}</td>
                      <td className="ax-table__td">{row.volume || row.phase || '2'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td">{row.block || DASH}</td>
                      <td className="ax-table__td">{row.panchayat || DASH}</td>
                      <td className="ax-table__td">{row.ward_no ?? DASH}</td>
                      <td className="ax-table__td">{row.pole_no ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.beneficiary_name || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.beneficiary_contact || row.contact_number || DASH}
                      </td>
                      <td className="ax-table__td">{row.sarpanch_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.sarpanch_contact || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.light_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.battery_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.panel_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.uuid_no || DASH}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={lightImg}
                          alt={`Light ${uidStr} - Installation Photo`}
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
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remark || row.remark || DASH}
                      </td>

                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.status} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={cStatus} />
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => setSelectedLight(row)}
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            Details
                          </button>
                          {isVerifyApproved ? (
                            <span
                              className="ax-badge ax-badge--soft"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--ax-text-muted, #64748b)',
                                background: 'var(--ax-surface-subtle, #f1f5f9)',
                                border: '1px solid var(--ax-border, #cbd5e1)',
                                borderRadius: 6,
                                cursor: 'not-allowed',
                                userSelect: 'none',
                              }}
                              title="Installation Verified & Approved. Actions are locked."
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ width: 11, height: 11, color: '#64748b' }}
                                aria-hidden="true"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Locked</span>
                            </span>
                          ) : (
                            <Link
                              to={`/vendor-management/punjab/ssl/install-light?uid=${row.uid || row.unique_id || row.id}`}
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Working Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              curPage={currentPage}
              totalItems={totalItems}
              total={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Light Details Modal ── */}
      {selectedLight && (
        <div
          className="ax-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedLight(null)}
        >
          <div className="ax-modal__backdrop" />
          <div
            className="ax-modal__dialog"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ax-modal__header">
              <div>
                <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontSize: 11, marginBottom: 4 }}>
                  Punjab SSL Installation Record
                </span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Light UID: {selectedLight.uid || selectedLight.unique_id || selectedLight.id}
                </h3>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setSelectedLight(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13 }}>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Vendor:</strong> <div style={{ fontWeight: 600 }}>{getVendorName(selectedLight)}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>State:</strong> <div>{selectedLight.state || 'Punjab'}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Volume:</strong> <div>{selectedLight.volume || selectedLight.phase || '2'}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>District:</strong> <div style={{ fontWeight: 600 }}>{selectedLight.district || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Block:</strong> <div>{selectedLight.block || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Panchayat:</strong> <div>{selectedLight.panchayat || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Ward No:</strong> <div>{selectedLight.ward_no ?? DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Pole No:</strong> <div>{selectedLight.pole_no ?? DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Beneficiary:</strong> <div style={{ fontWeight: 600 }}>{selectedLight.beneficiary_name || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Beneficiary Contact:</strong> <div>{selectedLight.beneficiary_contact || selectedLight.contact_number || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Sarpanch:</strong> <div>{selectedLight.sarpanch_name || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Sarpanch Contact:</strong> <div>{selectedLight.sarpanch_contact || DASH}</div></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Light No:</strong> <code>{selectedLight.light_no || DASH}</code></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Battery No:</strong> <code>{selectedLight.battery_no || DASH}</code></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>Panel No:</strong> <code>{selectedLight.panel_no || DASH}</code></div>
                <div><strong style={{ color: 'var(--ax-text-muted)' }}>UUID No:</strong> <code>{selectedLight.uuid_no || DASH}</code></div>
                <div>
                  <strong style={{ color: 'var(--ax-text-muted)' }}>Coordinates:</strong>
                  <div>
                    {selectedLight.latitude && selectedLight.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedLight.latitude},${selectedLight.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        {selectedLight.latitude}, {selectedLight.longitude} ↗
                      </a>
                    ) : (
                      DASH
                    )}
                  </div>
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-muted)' }}>Verify Status:</strong>
                  <div style={{ marginTop: 2 }}>
                    <VerifyBadge value={Number(selectedLight.inst_verify_status ?? selectedLight.status ?? 0)} />
                  </div>
                </div>
                {selectedLight.remark && (
                  <div style={{ gridColumn: 'span 2', background: 'var(--ax-surface-subtle, #f8fafc)', padding: 10, borderRadius: 8 }}>
                    <strong style={{ color: 'var(--ax-text-muted)' }}>Remarks:</strong>
                    <div style={{ marginTop: 4 }}>{selectedLight.remark}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedLight(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Preview Lightbox Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export default StatusView;
