import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
} from '../../up-services';
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

/* Normalized row — API (view-dashboard) fields are mapped into these in normalizeSite() */
interface Row {
  id: number;
  unique_id?: string;
  state?: string;
  district?: string;
  site_name?: string;
  contact_person?: string;
  contact_number?: string;
  installation_date?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_meter_smart_meter_image?: string;
  loger_image?: string;
  latitude?: string;
  longitude?: string;
  remark?: string;
  verify_status: number;
  verify_remarks?: string;
  document_status: number;
  document_file?: string;
  document_remarks?: string;
  inst_status: number;
}

/* first non-empty value (trimmed string) from the given candidates */
const pickStr = (...vals: unknown[]): string | undefined => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
};
const pickNum = (...vals: unknown[]): number => {
  for (const v of vals) {
    if (v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

/* Maps API fields (inst_date, solarmeter_no, nm_sm_no, inst_latitude, inst_verify_status …)
   to the field names used in this page. Old names are kept as fallbacks. */
const normalizeSite = (r: any): Row => ({
  id: r.id,
  unique_id: pickStr(r.unique_id),
  state: pickStr(r.state),
  district: pickStr(r.district),
  site_name: pickStr(r.site_name),
  contact_person: pickStr(r.contact_person),
  contact_number: pickStr(r.contact_number),
  installation_date: pickStr(r.inst_date, r.installation_date),
  solar_meter_no: pickStr(r.solarmeter_no, r.solar_meter_no),
  inverter_no: pickStr(r.inverter_no),
  net_smart_meter_no: pickStr(r.nm_sm_no, r.net_smart_meter_no),
  loger_no: pickStr(r.loger_no),
  system_image: pickStr(r.system_image),
  inverter_image: pickStr(r.inverter_image),
  panel_image: pickStr(r.panel_image),
  net_meter_smart_meter_image: pickStr(r.nm_sm_image, r.net_meter_smart_meter_image),
  loger_image: pickStr(r.loger_image),
  latitude: pickStr(r.inst_latitude, r.latitude),
  longitude: pickStr(r.inst_longitude, r.longitude),
  remark: pickStr(r.inst_remarks, r.remark),
  verify_status: pickNum(r.inst_verify_status, r.verify_status),
  verify_remarks: pickStr(r.inst_verify_remarks, r.verify_remarks),
  document_status: pickNum(r.inst_doc_status, r.document_status),
  document_file: pickStr(r.inst_doc_file, r.document_file),
  document_remarks: pickStr(r.inst_doc_remarks, r.document_remarks),
  inst_status: pickNum(r.inst_status),
});

type VerifyFilter = 'all' | 'approved' | 'pending' | 'rejected';
type TabFilter = 'all' | 'completed' | 'pending';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const isCompleted = (r: Row) => r.inst_status === 1 || !!(r.installation_date && r.inverter_no);
const verifyState = (v?: number | string): 'approved' | 'rejected' | 'pending' => {
  const n = Number(v ?? 0);
  return n === 1 ? 'approved' : n === 2 ? 'rejected' : 'pending';
};
const stateLabel = (s: 'approved' | 'rejected' | 'pending') => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const stateTone = (s: 'approved' | 'rejected' | 'pending') => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const StatusBadge = ({ value }: { value?: number | string }) => {
  const s = verifyState(value);
  return (
    <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${stateTone(s)}`}>
      <span className="ax-badge__dot" />
      {stateLabel(s)}
    </span>
  );
};

/* ───────── Responsive page CSS (same as Arunachal SHL reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Modal & Lightbox Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;
  }
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

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
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

/* ───────── Photo lightbox ───────── */
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="resco-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Installation Photograph'}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>}
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

/* ───────── Thumbnail ───────── */
function Thumb({ path, alt, onPreview }: { path?: string | null; alt: string; onPreview: (url: string, title: string) => void }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [path]);

  if (!path || failed) return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  const url = resolveUpMediaUrl(path);
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: 36, height: 36, borderRadius: 4, objectFit: 'cover', cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)', background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block', flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview photograph"
    />
  );
}

const FILTER_TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'completed', label: 'Installation Completed' },
  { key: 'pending', label: 'Installation Pending' },
];

export function UP_Installation_Resco_InstallationDetail() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [sites, setSites] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const [viewModal, setViewModal] = useState<Row | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upInstallationService.getRescoInstalledSites();
      const list: Row[] = ((res?.data || []) as any[]).map(normalizeSite);
      setSites(list);
      if (list.length === 0) setErrorMsg('No installation records available.');
    } catch (err: any) {
      console.error('[UP Resco Installation] load error:', err);
      setErrorMsg(err?.message || 'Failed to load Resco installations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI summary (derived) ── */
  const summary = useMemo(() => {
    const total = sites.length;
    const complete = sites.filter(isCompleted).length;
    const vApp = sites.filter((s) => verifyState(s.verify_status) === 'approved').length;
    const vRej = sites.filter((s) => verifyState(s.verify_status) === 'rejected').length;
    const dApp = sites.filter((s) => verifyState(s.document_status) === 'approved').length;
    const dRej = sites.filter((s) => verifyState(s.document_status) === 'rejected').length;
    return {
      total,
      complete,
      pending: total - complete,
      vApp,
      vRej,
      vPend: total - vApp - vRej,
      dApp,
      dRej,
      dPend: total - dApp - dRej,
    };
  }, [sites]);

  const tabItems = useMemo(() => {
    if (activeTab === 'completed') return sites.filter(isCompleted);
    if (activeTab === 'pending') return sites.filter((s) => !isCompleted(s));
    return sites;
  }, [sites, activeTab]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    tabItems.forEach((r) => r.district && set.add(r.district.trim()));
    return Array.from(set).sort();
  }, [tabItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabItems.filter((s) => {
      if (verifyFilter !== 'all' && verifyState(s.verify_status) !== verifyFilter) return false;
      if (selectedDistrict !== 'all' && s.district?.trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (q && !Object.values(s).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tabItems, search, verifyFilter, selectedDistrict]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || verifyFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Installation Date', accessor: (r) => r.installation_date || DASH },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.remark || DASH },
      { header: 'Verify Status', accessor: (r) => stateLabel(verifyState(r.verify_status)) },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
      { header: 'Document Status', accessor: (r) => stateLabel(verifyState(r.document_status)) },
      { header: 'Document Remarks', accessor: (r) => r.document_remarks || DASH },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('UP_Resco_Installations', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('UP_Resco_Installations', filtered, exportCols);
  const handlePdf = () => printTableData('UP Resco Installation Report', filtered, exportCols);

  const tabCount = (k: TabFilter) => (k === 'completed' ? summary.complete : k === 'pending' ? summary.pending : summary.total);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="UP Resco Installation Detail"
        subtitle="Rooftop solar installation progress, metering equipment and site verification status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/up/resco-install-site')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Install Site</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Assigned"
              value={summary.total.toLocaleString('en-IN')}
              sub={`${summary.complete} completed · ${summary.pending} pending`}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Verify Approved"
              value={summary.vApp.toLocaleString('en-IN')}
              sub={`${summary.vPend} pending audit · ${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Document Approved"
              value={summary.dApp.toLocaleString('en-IN')}
              sub={`${summary.dPend} pending · ${summary.dRej} rejected`}
              icon={svgIcon(
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              )}
            />
            <KpiCard
              tone="amber"
              label="Installation Pending"
              value={summary.pending.toLocaleString('en-IN')}
              sub={`${summary.complete} sites completed`}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installation filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setSelectedDistrict('all');
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP Resco Installation Details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">UP Resco Installation</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabItems.length}</span> sites
                {' '}· Total <b className="ax-num">{summary.total}</b> · Verified <b className="ax-num">{summary.vApp}</b> · Completed <b className="ax-num">{summary.complete}</b>
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
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as VerifyFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search site, contact, meter…"
                  size="sm"
                  ariaLabel="Search installations"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">UP Resco Installation Details</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Installation Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col">System Image</th>
                  <th className="ax-table__th" scope="col">Inverter Image</th>
                  <th className="ax-table__th" scope="col">Panel Image</th>
                  <th className="ax-table__th" scope="col">Net Meter Image</th>
                  <th className="ax-table__th" scope="col">Loger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col">Document Status</th>
                  <th className="ax-table__th" scope="col">Document File</th>
                  <th className="ax-table__th" scope="col">Document Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={25} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Resco installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={25} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={hasFilters ? 'No sites match your filters. Try clearing filters or search term.' : errorMsg || 'No Resco installations recorded yet.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((item, idx) => {
                    const sr = (currentPage - 1) * pageSize + idx + 1;
                    const docUrl = item.document_file ? resolveUpMediaUrl(item.document_file) : '';
                    return (
                      <tr key={item.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{sr}</td>
                        <td className="ax-table__td">{txt(item.installation_date)}</td>
                        <td className="ax-table__td">{item.state ? item.state.toUpperCase() : 'UP'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>{txt(item.site_name)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(item.contact_person)}</td>
                        <td className="ax-table__td">{txt(item.contact_number)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.solar_meter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.inverter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.net_smart_meter_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.loger_no)}</td>
                        <td className="ax-table__td"><Thumb path={item.system_image} alt={`System image — ${item.site_name || item.id}`} onPreview={openPreview} /></td>
                        <td className="ax-table__td"><Thumb path={item.inverter_image} alt={`Inverter image — ${item.site_name || item.id}`} onPreview={openPreview} /></td>
                        <td className="ax-table__td"><Thumb path={item.panel_image} alt={`Panel image — ${item.site_name || item.id}`} onPreview={openPreview} /></td>
                        <td className="ax-table__td"><Thumb path={item.net_meter_smart_meter_image} alt={`Net meter image — ${item.site_name || item.id}`} onPreview={openPreview} /></td>
                        <td className="ax-table__td"><Thumb path={item.loger_image} alt={`Loger image — ${item.site_name || item.id}`} onPreview={openPreview} /></td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.latitude)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.longitude)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(item.remark)}</td>
                        <td className="ax-table__td"><StatusBadge value={item.verify_status} /></td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(item.verify_remarks)}</td>
                        <td className="ax-table__td"><StatusBadge value={item.document_status} /></td>
                        <td className="ax-table__td">
                          {docUrl ? (
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--xs">View File</a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(item.document_remarks)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setViewModal(item)} title="View site details" style={{ padding: '0 8px' }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── View Site Detail Modal ── */}
      {viewModal && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="resco-view-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setViewModal(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 680 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="resco-view-detail-title" style={{ fontSize: 15, fontWeight: 600 }}>
                Site Detail: {viewModal.site_name || `Site #${viewModal.id}`}
              </h2>
              <button type="button" className="ax-modal__close" onClick={() => setViewModal(null)} aria-label="Close dialog">{X_ICON}</button>
            </div>
            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{viewModal.state ? viewModal.state.toUpperCase() : 'UP'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(viewModal.district)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{txt(viewModal.site_name)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Installation Date:</span> <b>{txt(viewModal.installation_date)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Person:</span> <b>{txt(viewModal.contact_person)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact Number:</span> <b>{txt(viewModal.contact_number)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Solar Meter No.:</span> <b>{txt(viewModal.solar_meter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Inverter No.:</span> <b>{txt(viewModal.inverter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Net/Smart Meter No.:</span> <b>{txt(viewModal.net_smart_meter_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Loger No.:</span> <b>{txt(viewModal.loger_no)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{txt(viewModal.latitude)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{txt(viewModal.longitude)}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Status:</span> <StatusBadge value={viewModal.verify_status} /></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Document Status:</span> <StatusBadge value={viewModal.document_status} /></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remark:</span> <b>{txt(viewModal.remark)}</b></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Verify Remarks:</span> <b>{txt(viewModal.verify_remarks)}</b></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--ax-text-muted)' }}>Document Remarks:</span> <b>{txt(viewModal.document_remarks)}</b></div>
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>Photographs:</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'System', path: viewModal.system_image },
                    { label: 'Inverter', path: viewModal.inverter_image },
                    { label: 'Panel', path: viewModal.panel_image },
                    { label: 'Net Meter', path: viewModal.net_meter_smart_meter_image },
                    { label: 'Loger', path: viewModal.loger_image },
                  ].map((p) => (
                    <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Thumb path={p.path} alt={`${p.label} image`} onPreview={openPreview} />
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UP_Installation_Resco_InstallationDetail;