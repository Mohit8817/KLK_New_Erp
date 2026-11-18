import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaAdminService,
  resolveGoaMediaUrl,
  normalizeGoaDashboardStatus,
  type GoaSrtSiteRow,
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

const InspectionBadge = ({ value }: { value?: number }) => {
  if (value === 1) return <Badge tone="success">Approved</Badge>;
  if (value === 2) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status, docUrl }: { status?: number; docUrl?: string | null }) => {
  const s = Number(status ?? 0);
  const hasDoc = Boolean(docUrl && docUrl !== DASH && docUrl.trim() !== '');
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || hasDoc) return <Badge tone="warning">Submitted</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

export interface StatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const GOA_STATUS_LIST: StatusMeta[] = [
  { key: 'total-srt-sites', label: 'All Allocated Sites', tone: 'accent', desc: 'All rooftop solar installations across Goa' },
  { key: 'install', label: 'Installed Sites', tone: 'emerald', desc: 'Sites with completed solar panel & inverter installation' },
  { key: 'not-install', label: 'Pending Installation', tone: 'amber', desc: 'Sites awaiting physical on-ground execution' },
  { key: 'total-srt-assign-sites', label: 'Assigned Sites', tone: 'accent', desc: 'Sites formally assigned to empaneled contractors' },
  { key: 'total-srt-pending-sites', label: 'Unassigned Sites', tone: 'amber', desc: 'Sites awaiting contractor allotment' },
  { key: 'total-srt-sites-accepted', label: 'Accepted Sites', tone: 'emerald', desc: 'Sites acknowledged & accepted by contractors' },
  { key: 'verification-pending', label: 'Verification Pending', tone: 'amber', desc: 'Completed installations awaiting engineering audit' },
  { key: 'site-verified', label: 'Audit Approved', tone: 'cyan', desc: 'Installations inspected and cleared by quality auditors' },
  { key: 'site-rejected', label: 'Verification Rejected', tone: 'amber', desc: 'Installations flagged with rectification notices' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'cyan', desc: 'Installations eligible for invoice claim generation' },
  { key: 'claim-raised', label: 'Claim Raised', tone: 'accent', desc: 'Sites with submitted vendor payment invoices' },
  { key: 'inspection-pending', label: 'Inspection Pending', tone: 'amber', desc: 'Sites awaiting DISCOM / CEIG field inspection' },
  { key: 'inspection-done', label: 'Inspection Completed', tone: 'emerald', desc: 'Sites with successful joint inspection clearance' },
  { key: 'doc-submit', label: 'Documents Submitted', tone: 'violet', desc: 'Sites with uploaded handover sheets and commissioning reports' },
  { key: 'doc-pending', label: 'Documents Pending', tone: 'amber', desc: 'Sites awaiting document uploads' },
  { key: 'doc-approve', label: 'Documents Approved', tone: 'emerald', desc: 'Verified and approved commissioning paperwork' },
  { key: 'doc-reject', label: 'Documents Rejected', tone: 'amber', desc: 'Handover papers rejected for corrections' },
  { key: 'pay1-done', label: 'Payment 70% Settled', tone: 'emerald', desc: 'First milestone (70%) disbursed to vendor' },
  { key: 'pay2-done', label: 'Payment 15% Settled', tone: 'emerald', desc: 'Second milestone (15%) disbursed to vendor' },
  { key: 'pay3-done', label: 'Payment 15% Settled', tone: 'emerald', desc: 'Final milestone (15%) disbursed to vendor' },
  { key: 'pay2-pending', label: 'Payment 15% Pending', tone: 'amber', desc: 'Second milestone awaiting disbursement' },
  { key: 'final-payment-done', label: 'Final Payment Complete', tone: 'emerald', desc: 'All milestone payments fully disbursed' },
  { key: 'final-payment-pending', label: 'Final Payment Pending', tone: 'amber', desc: 'Final settlement pending approval' },
  { key: 'site-cancel', label: 'Cancelled Sites', tone: 'amber', desc: 'Sites officially cancelled by department' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  GOA_STATUS_LIST.map((m) => [m.key, m])
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

export function GoaSRTInstallationStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'install';
  const activeStatus = normalizeGoaDashboardStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();
  const activeVendor = (searchParams.get('vendor') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<GoaSrtSiteRow[]>([]);
  const [search, setSearch] = useState('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    goaAdminService
      .getInstallationDashboard()
      .then((dash: any) => {
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

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let list: GoaSrtSiteRow[] = [];
        if (activeVendor && activeVendor !== 'All') {
          list = await goaAdminService.getVendorWiseData(activeStatus, activeVendor);
        } else if (activeDistrict && activeDistrict !== 'All') {
          list = await goaAdminService.getDistrictWiseData(activeStatus, activeDistrict);
        } else {
          list = await goaAdminService.getDashboardViewData(activeStatus);
        }
        if (!cancelled) {
          setSites(Array.isArray(list) ? list : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[GoaSRTInstallationStatusView] fetch error:', err);
          setError(err?.message || 'Failed to load status records from server.');
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
  }, [activeStatus, activeDistrict]);

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
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
      const vendorName = typeof s.vendor === 'object' ? s.vendor?.name || '' : String(s.vendor || s.inst_vendor || '');
      const lat = String(s.inst_latitude || s.latitude || '');
      const lng = String(s.inst_longitude || s.longitude || '');
      return (
        String(s.id).includes(q) ||
        (s.unique_id || '').toLowerCase().includes(q) ||
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        vendorName.toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q) ||
        (s.contact_number || '').includes(q) ||
        (s.solarmeter_no || '').toLowerCase().includes(q) ||
        (s.inverter_no || '').toLowerCase().includes(q) ||
        (s.nm_sm_no || '').toLowerCase().includes(q) ||
        (s.loger_no || '').toLowerCase().includes(q) ||
        lat.includes(q) ||
        lng.includes(q)
      );
    });
  }, [sites, search]);

  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination({ data: filteredSites, initialPageSize: 100 });

  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeGoaDashboardStatus(newStatus);
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

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All'));

  const approvedCount = useMemo(
    () => sites.filter((s) => Number(s.inst_verify_status) === 1).length,
    [sites]
  );
  const pendingAuditCount = useMemo(
    () => sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length,
    [sites]
  );
  const settledCount = useMemo(
    () => sites.filter((s) => Number(s.inst_claim_status) === 2 || Number(s.inst_pay1_status) === 1).length,
    [sites]
  );

  const exportCols: ExportColumn<GoaSrtSiteRow>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => `${idx + 1}` },
      { header: 'Site ID', accessor: (r) => `${r.id}` },
      { header: 'Unique ID', accessor: (r) => r.unique_id || DASH },
      { header: 'State', accessor: (r) => r.state || 'Goa' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      {
        header: 'Vendor',
        accessor: (r) => (typeof r.vendor === 'object' ? r.vendor?.name : String(r.vendor || r.inst_vendor || DASH)),
      },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Logger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => r.inst_latitude || r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.inst_longitude || r.longitude || DASH },
      { header: 'Remarks', accessor: (r) => r.inst_remarks || r.remarks || DASH },
      {
        header: 'Verify Status',
        accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending'),
      },
      {
        header: 'Inspection Status',
        accessor: (r) => (Number(r.inst_inspection) === 1 ? 'Approved' : Number(r.inst_inspection) === 2 ? 'Rejected' : 'Pending'),
      },
      {
        header: 'Document Status',
        accessor: (r) => (Number(r.inst_doc_submit) === 2 ? 'Approved' : Number(r.inst_doc_submit) === 3 ? 'Rejected' : Number(r.inst_doc_submit) === 1 ? 'Submitted' : 'Pending'),
      },
      {
        header: 'Claim Status',
        accessor: (r) => (Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 1 ? 'Raised' : 'Not Raised'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_${activeStatus}_Sites`;
  const fileTitle = `Goa SRT ${currentStatusMeta.label} Register`;

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
        title={`Goa SRT: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : 'All Goa Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Dashboard', href: '/vendor-management/goa/srt/installation/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/vendor-management/goa/srt/installation/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/vendor-management/goa/srt/installation/view-assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Assign Sites →</span>
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
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={loading ? '…' : settledCount.toLocaleString('en-IN')}
          sub="Disbursed vendor payment sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="goa-status-tabpanel" role="tabpanel" aria-label="Goa SRT Status Sites Data">
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
                id="goa_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by installation status category"
              >
                {GOA_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="goa_district_filter"
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
                <th className="ax-table__th" style={{ width: 90 }}>Site ID</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Logger No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>System Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Inverter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Panel Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Net Meter Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Logger Image</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Remarks</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Inspection Status</th>
                <th className="ax-table__th">Document Status</th>
                <th className="ax-table__th">Claim Status</th>
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
                  const lat = row.inst_latitude || row.latitude || '';
                  const lng = row.inst_longitude || row.longitude || '';
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const siteLabel = row.site_name || `Site ${row.id}`;
                  const vStatus = Number(row.inst_verify_status ?? 0);
                  const isVerifyApproved = vStatus === 1;
                  const vendorName =
                    typeof row.vendor === 'object' ? row.vendor?.name : String(row.vendor || row.inst_vendor || DASH);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          {row.id}
                        </span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{row.unique_id || DASH}</td>
                      <td className="ax-table__td">{row.state || 'Goa'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name || DASH}</span>
                      </td>
                      <td className="ax-table__td">{vendorName}</td>
                      <td className="ax-table__td">{row.contact_person || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.contact_number || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.solarmeter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.inverter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.nm_sm_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.loger_no || DASH}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.system_image}
                          alt={`${siteLabel} - System Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.inverter_image}
                          alt={`${siteLabel} - Inverter Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.panel_image}
                          alt={`${siteLabel} - Panel Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.nm_sm_image}
                          alt={`${siteLabel} - Net Meter Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={row.loger_image}
                          alt={`${siteLabel} - Logger Image`}
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
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <InspectionBadge value={Number(row.inst_inspection)} />
                      </td>
                      <td className="ax-table__td">
                        <DocBadge status={Number(row.inst_doc_submit)} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={Number(row.inst_claim_status)} />
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
                            title="Installation Verified & Approved. Actions are locked."
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
                            onClick={() => navigate(`/vendor-management/goa/srt/installation/verify?site_id=${row.id}`)}
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

export const StatusView = GoaSRTInstallationStatusView;
export default GoaSRTInstallationStatusView;
