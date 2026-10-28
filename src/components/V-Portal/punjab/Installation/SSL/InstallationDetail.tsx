import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  punjabSslInstallationService,
  getPunjabMediaCandidates,
  resolvePunjabMediaUrl,
  type PunjabInstallDetailSummary,
  type PunjabInstalledLightItem,
} from '../../punjab-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>{children}</span>
);

const vStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_verify_status ?? r.verify_status ?? 0);
const cStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_claim_status ?? r.claim_status ?? 0);
const pStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_pay_status ?? r.payment_status ?? 0);

/* ───────── Image Preview Lightbox Modal (Interactive Zoom, matching Assam SWP) ───────── */
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
    <Modal open onClose={onClose} title={title || 'Media Lightbox'} maxWidth={840}>
      <div style={{ padding: 0 }}>
        <div style={{ minHeight: 340, maxHeight: '60vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative' }}>
          {status === 'loading' && (
            <div style={{ color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ax-spinner" /> Loading photograph…
            </div>
          )}
          {status === 'error' && (
            <div style={{ color: '#f87171', fontSize: 13 }}>
              Photo could not be loaded. Try opening it directly in a new tab.
            </div>
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
                ? { maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              − Zoom Out
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, paddingInline: 8 }}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              + Zoom In
            </button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: '#2563eb' }}>
              Open in new tab ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Light Thumbnail with Candidate Resolver ───────── */
function LightThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getPunjabMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)', fontSize: 12 }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)',
        background: '#f8fafc',
        display: 'block',
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview photograph"
    />
  );
}

/* ───────── Generic Design System Modal ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 720,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'transparent' }} onClick={onClose} />
      <div
        ref={dialogRef}
        style={{
          position: 'relative', zIndex: 1, background: '#ffffff', borderRadius: 16, border: '1px solid var(--ax-border, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', width: '92%', maxWidth, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }} aria-label="Close">
            {X_ICON}
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(85vh - 120px)' }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Top KPI Card Component ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';
const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#ef4444' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '12px 16px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 2, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Layout CSS (matching Assam SWP / Bihar reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-4, 16px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 200px; }
  .solar-erp-page .ax-card__actions { flex: 0 1 auto; margin-left: auto; display: flex; align-items: center; gap: 8px; }

  /* Fully horizontally scrollable table without clipping */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
  }
`;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

type TabKey = 'Completed' | 'Payment';

export function Punjab_Installation_SSL_InstallationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'Payment' : 'Completed';

  const setTab = (k: TabKey) => {
    navigate({ pathname: location.pathname, search: location.search, hash: k === 'Payment' ? '#payment' : '#completed' }, { replace: true });
  };

  const isCompleted = tab === 'Completed';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PunjabInstallDetailSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<PunjabInstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<PunjabInstalledLightItem[]>([]);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState(() => searchParams.get('district') || 'all');
  const [verifyFilter, setVerifyFilter] = useState<string>('all');

  // Preview Lightbox Modal
  const [preview, setPreview] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: '',
  });
  const openPreview = (url: string, title: string) => setPreview({ open: true, url, title });
  const closePreview = () => setPreview({ open: false, url: '', title: '' });

  // View Light Full Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PunjabInstalledLightItem | null>(null);

  // Approve Confirmation Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingItem, setApprovingItem] = useState<PunjabInstalledLightItem | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await punjabSslInstallationService.getCompleteLights();
      if (resp) {
        if (resp.install_detail) setSummary(resp.install_detail);
        const comp = resp.completelights || resp.complete_lights || [];
        const pay = resp.paymentlights || resp.payment_lights || [];
        setCompleteLights(Array.isArray(comp) ? comp : []);
        setPaymentLights(Array.isArray(pay) ? pay : []);
      }
    } catch (err: any) {
      console.error('[Punjab SSL] load complete lights error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeList = isCompleted ? completeLights : paymentLights;

  // Unique districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    activeList.forEach((r) => {
      if (r.district) s.add(r.district.trim());
    });
    return Array.from(s).sort();
  }, [activeList]);

  // Filtered dataset
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return activeList.filter((r) => {
      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (isCompleted && verifyFilter !== 'all') {
        const v = vStatusOf(r);
        if (verifyFilter === 'approved' && v !== 1) return false;
        if (verifyFilter === 'pending' && v !== 0) return false;
        if (verifyFilter === 'rejected' && v !== 2) return false;
      }
      if (q) {
        const match =
          (r.unique_id && r.unique_id.toLowerCase().includes(q)) ||
          (r.beneficiary_name && r.beneficiary_name.toLowerCase().includes(q)) ||
          (r.contact_no && r.contact_no.toLowerCase().includes(q)) ||
          (r.pole_no && r.pole_no.toLowerCase().includes(q)) ||
          (r.uuid_no && r.uuid_no.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [activeList, deferredQuery, districtFilter, verifyFilter, isCompleted]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    pagination.setPage(1);
  }, [deferredQuery, districtFilter, verifyFilter, tab]);

  // Export handling
  const exportCols: ExportColumn<PunjabInstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr.', accessor: (_r, idx) => idx + 1 },
      { header: 'UID', accessor: (r) => r.unique_id || `#${r.id}` },
      { header: 'State', accessor: (r) => r.state || 'Punjab' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Block', accessor: (r) => r.block || '—' },
      { header: 'Panchayat', accessor: (r) => r.panchayat || '—' },
      { header: 'Ward No', accessor: (r) => r.ward_no || '—' },
      { header: 'Pole No', accessor: (r) => r.pole_no || '—' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '—' },
      { header: 'Contact', accessor: (r) => r.contact_no || '—' },
      { header: 'UUID No', accessor: (r) => r.uuid_no || '—' },
      { header: 'Light No', accessor: (r) => r.light_no || '—' },
      { header: 'Panel No', accessor: (r) => r.panel_no || '—' },
      { header: 'Battery No', accessor: (r) => r.battery_serial_no || '—' },
      { header: 'Verify Status', accessor: (r) => (vStatusOf(r) === 1 ? 'Approved' : vStatusOf(r) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Payment Status', accessor: (r) => (pStatusOf(r) === 1 ? 'Paid' : 'Pending') },
    ],
    []
  );

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

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

  const exportToCSV = () => {
    if (!filtered.length) return;
    const out = [
      exportCols.map((c) => c.header),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `Punjab_SSL_${tab}_Lights.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filtered.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${filtered.map((row, idx) => `<tr>${exportCols.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `Punjab_SSL_${tab}_Lights.xls`, 'application/vnd.ms-excel');
  };

  const copyToClipboard = async () => {
    if (!filtered.length) return;
    const t = [
      exportCols.map((c) => c.header).join('\t'),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Table data copied to clipboard!');
    } catch {
      alert('Copy failed, please export CSV instead.');
    }
  };

  const exportToPDF = () => {
    if (!filtered.length) return;
    const body = filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>Punjab SSL ${tab} Lights</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Punjab SSL ${tab} Lights Register</h1><table><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Mark light as verified
  const handleApproveConfirm = () => {
    if (!approvingItem) return;
    setCompleteLights((prev) =>
      prev.map((item) => (item.id === approvingItem.id ? { ...item, inst_verify_status: 1 } : item))
    );
    if (summary) {
      setSummary({
        ...summary,
        verify_approved: (summary.verify_approved || 0) + 1,
        verify_pending: Math.max(0, (summary.verify_pending || 0) - 1),
      });
    }
    setActionSuccessMsg(`Light #${approvingItem.unique_id || approvingItem.id} marked as Approved!`);
    setApproveModalOpen(false);
    setApprovingItem(null);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Page Header (matching Assam SWP / Bihar reference) */}
      <PageHead
        title="View Installation"
        subtitle="Comprehensive register of completed Solar Street Light installations and payment-stage records"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/punjab/ssl/installation/update-light-deatils" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
            </Link>
          </div>
        }
      />

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{actionSuccessMsg}</div>
        </div>
      )}

      {/* Summary KPI Cards (matching Assam SWP metrics) */}
      {summary && (
        <div className="asw-cards-row">
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            tone="accent"
            label="Total Lights"
            value={num(summary.total)}
            sub="Allocated lights"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
            tone="emerald"
            label="Complete"
            value={num(summary.complete)}
            sub="Installed lights"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
            tone="amber"
            label="Pending"
            value={num(summary.pending)}
            sub="Awaiting install"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
            tone="cyan"
            label="Verified Approved"
            value={num(summary.verify_approved)}
            sub="Field verified"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            tone="violet"
            label="Claims Raised"
            value={num(summary.claim_raised)}
            sub="Claimed batches"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
            tone="emerald"
            label="Payment Complete"
            value={num(summary.payment_complete)}
            sub="Settled payments"
          />
        </div>
      )}

      {/* Main Table Card */}
      <section className="ax-card" role="region" aria-label="Installation records">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            {/* Tab switchers matching Assam SWP */}
            <div style={{ display: 'inline-flex', background: 'var(--ax-surface-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--ax-border)', marginBottom: 8 }}>
              <button
                type="button"
                style={{
                  border: 'none', background: isCompleted ? '#ffffff' : 'transparent',
                  color: isCompleted ? '#2563eb' : 'var(--ax-text-muted)',
                  fontWeight: 700, fontSize: 13, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  boxShadow: isCompleted ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setTab('Completed')}
              >
                Completed Lights ({completeLights.length})
              </button>
              <button
                type="button"
                style={{
                  border: 'none', background: !isCompleted ? '#ffffff' : 'transparent',
                  color: !isCompleted ? '#2563eb' : 'var(--ax-text-muted)',
                  fontWeight: 700, fontSize: 13, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  boxShadow: !isCompleted ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setTab('Payment')}
              >
                Payment Stage Lights ({paymentLights.length})
              </button>
            </div>
            <p className="ax-card__subtitle">
              {isCompleted
                ? 'Review fully installed Solar Street Lights, verify hardware serial numbers and inspection photos'
                : 'Review lights eligible for claim verification and completed disbursements'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
              {/* District Filter Dropdown */}
              {districts.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {/* Verify Status Filter (Completed tab only) */}
              {isCompleted && (
                <select
                  value={verifyFilter}
                  onChange={(e) => setVerifyFilter(e.target.value)}
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}

              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search UID, pole, contact..." size="sm" />
              <TableExportToolbar
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
                onCopy={copyToClipboard}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">UID</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Panchayat</th>
                <th className="ax-table__th" scope="col">Ward No.</th>
                <th className="ax-table__th" scope="col">Pole No.</th>
                <th className="ax-table__th" scope="col">Beneficiary</th>
                <th className="ax-table__th" scope="col">Contact</th>
                <th className="ax-table__th" scope="col">UUID No.</th>
                <th className="ax-table__th" scope="col">Light No.</th>
                <th className="ax-table__th" scope="col">Panel No.</th>
                <th className="ax-table__th" scope="col">Battery No.</th>
                <th className="ax-table__th" scope="col">Photo 1</th>
                <th className="ax-table__th" scope="col">Photo 2</th>
                <th className="ax-table__th" scope="col">Verification</th>
                <th className="ax-table__th" scope="col">Claim</th>
                <th className="ax-table__th" scope="col">Payment</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={20} style={{ textAlign: 'center', padding: 28 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed lights…
                  </td>
                </tr>
              )}

              {!loading && pagination.paginatedData.length === 0 && (
                <tr>
                  <td colSpan={20} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed lights found' : 'No payment lights found'}
                      message="No lights match your active search or filter criteria."
                      onClear={() => {
                        setSearchQuery('');
                        setDistrictFilter('all');
                        setVerifyFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                pagination.paginatedData.map((r, idx) => {
                  const isApproved = vStatusOf(r) === 1;
                  const cStatus = cStatusOf(r);
                  const pStatus = pStatusOf(r);
                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#2563eb' }}>
                        {r.unique_id || `#${r.id}`}
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.state || 'Punjab'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.district || DASH}</td>
                      <td className="ax-table__td">{r.block || DASH}</td>
                      <td className="ax-table__td">{r.panchayat || DASH}</td>
                      <td className="ax-table__td ax-num">{r.ward_no ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.pole_no ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.beneficiary_name || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.contact_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.uuid_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.light_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.panel_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.battery_serial_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <LightThumbnail
                          src={r.light_file}
                          alt={`${r.unique_id || r.id} - Photo 1`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <LightThumbnail
                          src={r.light_file2}
                          alt={`${r.unique_id || r.id} - Photo 2`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        {isApproved ? (
                          <Badge tone="success">Approved</Badge>
                        ) : vStatusOf(r) === 2 ? (
                          <Badge tone="danger">Rejected</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {cStatus === 1 ? (
                          <Badge tone="info">Raised</Badge>
                        ) : (
                          <Badge tone="neutral">Not Raised</Badge>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {pStatus === 1 ? (
                          <Badge tone="success">Paid</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', fontWeight: 600 }}
                            onClick={() => {
                              setActiveItem(r);
                              setDetailModalOpen(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => navigate(`/v/punjab/ssl/installation/update-light-deatils?ssl_id=${r.id}&edit=true`)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          {!isApproved && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ background: '#10b981', borderColor: '#10b981', padding: '3px 8px' }}
                              onClick={() => {
                                setApprovingItem(r);
                                setApproveModalOpen(true);
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Lightbox Image Preview Modal ── */}
      {preview.open && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── View Light Details Modal ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Installation Record — ${activeItem?.unique_id || `#${activeItem?.id}`}`}
        subtitle={`State: ${activeItem?.state || 'Punjab'} · District: ${activeItem?.district || '—'} · Block: ${activeItem?.block || '—'}`}
        maxWidth={760}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>Status:</span>
              {activeItem && vStatusOf(activeItem) === 1 ? (
                <Badge tone="success">Verified Approved</Badge>
              ) : (
                <Badge tone="warning">Pending Verification</Badge>
              )}
            </div>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {activeItem && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    navigate(`/v/punjab/ssl/installation/update-light-deatils?ssl_id=${activeItem.id}&edit=true`);
                  }}
                >
                  Edit Installation
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        {activeItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Grid 1: Administrative & Beneficiary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border)' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Beneficiary</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{activeItem.beneficiary_name || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Contact No</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.contact_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Ward No</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.ward_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Panchayat</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.panchayat || '—'}</div>
              </div>
            </div>

            {/* Grid 2: Hardware Identifiers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border)' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Pole No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.pole_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>UUID No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.uuid_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Light Luminary No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.light_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Solar Panel No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.panel_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Battery Serial No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.battery_serial_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>GPS Coordinates</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                  {activeItem.latitude && activeItem.longitude ? `${activeItem.latitude}, ${activeItem.longitude}` : '—'}
                </div>
              </div>
            </div>

            {/* Photos Preview */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Installation Photographs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ border: '1px solid var(--ax-border)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Photo 1 (Pole & Luminary)</span>
                  <LightThumbnail
                    src={activeItem.light_file}
                    alt="Photo 1"
                    size={90}
                    onPreview={openPreview}
                  />
                </div>
                <div style={{ border: '1px solid var(--ax-border)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Photo 2 (Battery Tag)</span>
                  <LightThumbnail
                    src={activeItem.light_file2}
                    alt="Photo 2"
                    size={90}
                    onPreview={openPreview}
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            {activeItem.remark || activeItem.inst_remark ? (
              <div style={{ padding: 12, background: 'var(--ax-surface-subtle)', borderRadius: 8, fontSize: 13 }}>
                <b>Remark:</b> {activeItem.remark || activeItem.inst_remark}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* ── Approve Modal ── */}
      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Installation Record"
        subtitle={`Mark light #${approvingItem?.unique_id || approvingItem?.id} as field-verified and approved`}
        maxWidth={480}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setApproveModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={handleApproveConfirm}
            >
              Confirm Approval
            </button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          Are you sure you want to mark this light installation as verified and approved? Once approved, it will be eligible for claim processing.
        </p>
      </Modal>
    </div>
  );
}

export default Punjab_Installation_SSL_InstallationDetail;
