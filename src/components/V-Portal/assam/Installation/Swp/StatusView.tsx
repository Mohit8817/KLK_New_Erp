import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  assamSwpService,
  resolveAssamMediaUrl,
  normalizeAssamDashboardStatus,
  type InstalledSiteItem,
  type AssamDashboardStatus,
} from '../../assam-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

const DocBadge = ({ status, docUrl }: { status?: number; docUrl?: string | null }) => {
  const s = Number(status ?? 0);
  const hasDoc = Boolean(docUrl && docUrl !== '—' && docUrl.trim() !== '');
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || hasDoc) return <Badge tone="warning">Submitted (Pending)</Badge>;
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const txt = (row: InstalledSiteItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const fmtSerials = (val?: any): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) {
    const valid = val.map(String).map((s) => s.trim()).filter(Boolean);
    return valid.length > 0 ? valid.join(', ') : DASH;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return DASH;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const valid = parsed.map(String).map((s) => s.trim()).filter(Boolean);
        return valid.length > 0 ? valid.join(', ') : DASH;
      }
    } catch {}
    return trimmed.replace(/[\[\]"']/g, '').trim() || DASH;
  }
  return String(val);
};

/* ── Status Metadata Catalog (APIs 15 & 16) ── */
export interface StatusMeta {
  key: AssamDashboardStatus;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const ASSAM_STATUS_LIST: StatusMeta[] = [
  { key: 'total', label: 'All Allocated Sites', tone: 'accent', desc: 'All accepted solar pump installations across Assam' },
  { key: 'complete', label: 'Installed Sites', tone: 'emerald', desc: 'Sites where pump & panels are installed with photo evidence' },
  { key: 'pending', label: 'Pending Installation', tone: 'amber', desc: 'Allocated sites awaiting field pump installation' },
  { key: 'verify-pending', label: 'Verification Pending', tone: 'amber', desc: 'Completed sites awaiting departmental audit' },
  { key: 'verify-approved', label: 'Verify Approved', tone: 'cyan', desc: 'Sites successfully inspected and approved by auditors' },
  { key: 'verify-reject', label: 'Verification Rejected', tone: 'amber', desc: 'Sites flagged with rework or audit discrepancies' },
  { key: 'doc-approved', label: 'Document Approved', tone: 'violet', desc: 'Sites with approved joint handover sheets and compliance reports' },
  { key: 'doc-pending', label: 'Document Pending', tone: 'amber', desc: 'Sites where handover documents are pending review' },
  { key: 'doc-reject', label: 'Document Rejected', tone: 'amber', desc: 'Handover documents flagged for re-upload' },
  { key: 'claim-raised', label: 'Claim Raised', tone: 'accent', desc: 'Sites with submitted vendor payment invoices' },
  { key: 'claim-approved', label: 'Claim Approved', tone: 'emerald', desc: 'Vendor payment claims reviewed and approved' },
  { key: 'claim-reject', label: 'Claim Rejected', tone: 'amber', desc: 'Payment claims rejected or awaiting clarification' },
  { key: 'pay-complete', label: 'Payment Settled', tone: 'emerald', desc: 'Fully disbursed and settled payment sites' },
  { key: 'pay-partial', label: 'Payment Partial', tone: 'amber', desc: 'Partially settled payment disbursements' },
  { key: 'pay-pending', label: 'Payment Pending', tone: 'amber', desc: 'Claims approved and awaiting financial disbursement' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  ASSAM_STATUS_LIST.map((m) => [m.key, m])
);

/* ── Lightbox Zoom Steps ── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

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
          <div className="ula-m-stage">
            {status === 'loading' && (
              <div className="ula-m-stage__msg">
                <span className="ax-spinner" /> Loading image…
              </div>
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
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
              Open in new tab ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Interactive Image Thumbnail ── */
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
  const resolved = src ? resolveAssamMediaUrl(src) : null;

  if (!resolved || failed) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      style={{
        width: 44,
        height: 44,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(resolved, alt)}
      title="Click to preview"
    />
  );
}

/* ── Top Metric KPI Card ── */
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

export function AssamStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params: status and district
  const rawStatus = searchParams.get('status') || 'complete';
  const activeStatus = normalizeAssamDashboardStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<InstalledSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  // Pre-load all available Assam districts from dashboard summary so user can filter freely
  useEffect(() => {
    let cancelled = false;
    assamSwpService.getDashboardData().then((dash) => {
      if (!cancelled && Array.isArray(dash?.districtwise)) {
        const names = Array.from(new Set(dash.districtwise.map((d) => (d.district || '').trim()).filter(Boolean))).sort();
        if (names.length > 0) setAllDistricts(names);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Interactive Lightbox Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Fetch data on query params change
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let res: { meta?: any; data: InstalledSiteItem[] };
        if (activeDistrict && activeDistrict !== 'All') {
          res = await assamSwpService.getDistrictwiseByStatus(activeStatus, activeDistrict);
        } else {
          res = await assamSwpService.getDashboardByStatus(activeStatus);
        }
        if (!cancelled) {
          setSites(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[AssamStatusView] fetch error:', err);
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

  // Status metadata
  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: activeStatus,
    tone: 'accent',
    desc: `Drilling down sites by status: "${activeStatus}"`,
  };

  // Unique districts for filter dropdown (merged with all territory districts)
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

  // Client-side search filtering
  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      const ser = fmtSerials(s.module_serial_no || s.module_serials);
      const lat = String(s.latitude || s.inst_latitude || '');
      const lng = String(s.longitude || s.inst_longitude || '');
      return (
        String(s.id).includes(q) ||
        txt(s, 'state').toLowerCase().includes(q) ||
        txt(s, 'district').toLowerCase().includes(q) ||
        txt(s, 'block').toLowerCase().includes(q) ||
        txt(s, 'village').toLowerCase().includes(q) ||
        (s.farmer_name || '').toLowerCase().includes(q) ||
        (s.father_name || '').toLowerCase().includes(q) ||
        (s.farmer_contact || '').toLowerCase().includes(q) ||
        (s.pump_capacity || '').toLowerCase().includes(q) ||
        (s.pump_type || '').toLowerCase().includes(q) ||
        (s.inverter_no || '').toLowerCase().includes(q) ||
        (s.vfd_no || '').toLowerCase().includes(q) ||
        ser.toLowerCase().includes(q) ||
        lat.includes(q) ||
        lng.includes(q)
      );
    });
  }, [sites, search]);

  // Pagination
  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination(filteredSites, 25);

  // Status change handler
  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeAssamDashboardStatus(newStatus);
    const p = new URLSearchParams(searchParams);
    p.set('status', valid);
    setSearchParams(p);
    setPage(1);
  };

  // District change handler
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

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    const p = new URLSearchParams();
    p.set('status', activeStatus);
    setSearchParams(p);
    setPage(1);
  };

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All'));

  // Metrics counts
  const approvedCount = useMemo(() => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length, [sites]);
  const pendingAuditCount = useMemo(() => sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length, [sites]);
  const settledCount = useMemo(() => sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 2).length, [sites]);

  // Export Columns definition matching ViewInstallation.tsx
  const exportCols: ExportColumn<InstalledSiteItem>[] = useMemo(() => [
    { header: 'Site ID', accessor: (r) => `#${r.id}` },
    { header: 'State', accessor: (r) => txt(r, 'state') || 'Assam' },
    { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
    { header: 'Block / Village', accessor: (r) => `${txt(r, 'block') ? txt(r, 'block') + ', ' : ''}${txt(r, 'village') || DASH}` },
    { header: 'Farmer Name', accessor: (r) => r.farmer_name || DASH },
    { header: 'Father Name', accessor: (r) => r.father_name || DASH },
    { header: 'Contact', accessor: (r) => r.farmer_contact || DASH },
    { header: 'Pump Capacity', accessor: (r) => r.pump_capacity || DASH },
    { header: 'Pump Type', accessor: (r) => `${txt(r, 'pump_type')} ${txt(r, 'pump_sub_type')}`.trim() || DASH },
    { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
    { header: 'VFD No.', accessor: (r) => r.vfd_no || DASH },
    { header: 'Module Serials', accessor: (r) => fmtSerials(r.module_serial_no || r.module_serials) },
    { header: 'Latitude', accessor: (r) => txt(r, 'latitude') || txt(r, 'inst_latitude') },
    { header: 'Longitude', accessor: (r) => txt(r, 'longitude') || txt(r, 'inst_longitude') },
    { header: 'Remark', accessor: (r) => r.inst_remarks || r.remarks || '' },
    {
      header: 'Verify Status',
      accessor: (r) => {
        const v = Number(r.inst_verify_status ?? r.verify_status);
        const str = String(r.inst_verify_status ?? r.verify_status ?? '').toLowerCase().trim();
        if (v === 1 || str === '1' || str === 'approved') return 'Approved';
        if (v === 2 || str === '2' || str === 'rejected') return 'Rejected';
        return 'Pending';
      },
    },
    {
      header: 'Document Status',
      accessor: (r) => {
        const s = Number(r.inst_doc_status ?? r.document_status);
        const hasDoc = Boolean(r.inst_doc || r.doc_file || r.document);
        if (s === 2) return 'Approved';
        if (s === 3) return 'Rejected';
        if (s === 1 || hasDoc) return 'Submitted (Pending)';
        return 'Not Submitted';
      },
    },
    {
      header: 'Claim Status',
      accessor: (r) => (Number(r.inst_claim_status ?? r.claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status ?? r.claim_status) === 3 ? 'Rejected' : Number(r.inst_claim_status ?? r.claim_status) === 1 ? 'Raised' : 'Not Raised'),
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Assam_SWP_${activeStatus}_Sites`;
  const fileTitle = `Assam SWP ${currentStatusMeta.label} Register`;

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

      {/* ── Page Head (Exact Bihar & Solar ERP pattern) ── */}
      <PageHead
        title={`Assam SWP: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : 'All Assam Districts'}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Dashboard', href: '/v/assam/installation/swp/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/assam/installation/swp/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/v/assam/installation/swp/view" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Master Installation Data →</span>
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

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
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

      {/* ── Main Table Card (exact same design & structure as ViewInstallation) ── */}
      <section className="ax-card ax-col--12" id="swp-status-tabpanel" role="tabpanel" aria-label="Assam SWP Status Sites Data">
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
                id="swp_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 180, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by installation status category"
              >
                {ASSAM_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="swp_district_filter"
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
                  placeholder="Search farmer, district, ID…"
                  size="sm"
                  ariaLabel="Search status records"
                />
              </div>

              <TableExportToolbar
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
                disabled={filteredSites.length === 0}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap ula-table--wide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead>
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 90 }}>Site ID</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block / Village</th>
                <th className="ax-table__th">Farmer Name</th>
                <th className="ax-table__th">Father Name</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Pump Capacity</th>
                <th className="ax-table__th">Pump Type</th>
                <th className="ax-table__th">Inverter / VFD No.</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Module Serials</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Module Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Inverter Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Running Water</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 80 }}>Handover Doc</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Remarks</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Document Status</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={23} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <span className="ax-spinner" />
                    <p style={{ marginTop: 8, fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                      Fetching {currentStatusMeta.label} records from server…
                    </p>
                  </td>
                </tr>
              )}

              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={23} style={{ padding: 0 }}>
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
                  const lat = txt(row, 'latitude') || txt(row, 'inst_latitude');
                  const lng = txt(row, 'longitude') || txt(row, 'inst_longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const farmerLabel = row.farmer_name || `Site #${row.id}`;
                  const docUrl = resolveAssamMediaUrl(row.inst_doc || row.document || row.doc_file);
                  const moduleImg = row.module_image || row.module_photo;
                  const invImg = row.inverter_vfd_image || row.inverter_vfd_photo;
                  const waterImg = row.running_water_image || row.running_water_photo;
                  const ser = fmtSerials(row.module_serial_no || row.module_serials);
                  const blockText = txt(row, 'block') || txt(row, 'tehsil');
                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const rawVerifyStr = String(row.inst_verify_status ?? row.verify_status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const dStatus = Number(row.inst_doc_status ?? row.document_status ?? 0);
                  const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          #{row.id}
                        </span>
                      </td>
                      <td className="ax-table__td">{txt(row, 'state') || 'Assam'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">
                        {blockText ? `${blockText}, ` : ''}{txt(row, 'village') || DASH}
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.farmer_name || DASH}</span>
                      </td>
                      <td className="ax-table__td">{row.father_name || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.farmer_contact || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.pump_capacity || DASH}
                      </td>
                      <td className="ax-table__td">
                        {`${txt(row, 'pump_type')} ${txt(row, 'pump_sub_type')}`.trim() || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.inverter_no || row.vfd_no ? `${row.inverter_no || DASH} / ${row.vfd_no || DASH}` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ ...monoCell, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ser}
                      </td>

                      {/* Photo Thumbnails: Click-to-Zoom Lightbox */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={moduleImg}
                          alt={`${farmerLabel} - Module Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={invImg}
                          alt={`${farmerLabel} - Inverter & VFD Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={waterImg}
                          alt={`${farmerLabel} - Running Water Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* Handover Doc */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {docUrl && docUrl !== '—' ? (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '3px 8px', fontSize: '11.5px', textDecoration: 'none' }}
                            title="View Handover Document"
                          >
                            📄 View
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Geolocation */}
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

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      {/* Status Badges */}
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <DocBadge status={dStatus} docUrl={docUrl} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={cStatus} />
                      </td>

                      {/* Action: Locked if Verify Status is Approved, else Edit Link */}
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
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => navigate(`/v/assam/installation/swp/site?edit_id=${row.id}`)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (Exact Bihar / ULA pagination structure) ── */}
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

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export default AssamStatusView;
