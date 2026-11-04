import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharAmcService,
  getAmcMediaUrl,
  type BiharSslAmcComplaintItem,
} from '../../bihar-services/biharAmcService';
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

type Row = BiharSslAmcComplaintItem;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const panchayatOf = (r: Row) => r.panchyat || r.panchayat;

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

/* ───────── Attachment preview (image lightbox with zoom / file fallback) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function AttachmentPreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isImage ? 'loading' : 'ready');
  }, [url, isImage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ssl-amc-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="ssl-amc-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body">
          {isImage ? (
            <div className="ula-m-stage">
              {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading attachment…</div>}
              {status === 'error' && <div className="ula-m-stage__msg">Attachment could not be loaded. Try opening it in a new tab.</div>}
              <img
                key={url}
                src={url}
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
          ) : (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--ax-text-muted)' }}>
              This document cannot be previewed here. Use “Open in new tab” to view or download it.
            </div>
          )}
        </div>

        <div className="ax-modal__footer">
          {isImage ? (
            <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
              <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
            </div>
          ) : (
            <span />
          )}
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

export function Bihar_AMC_SSL_ComplaintRaised() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [complaints, setComplaints] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [previewDoc, setPreviewDoc] = useState<{ url: string; complaintId: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await biharAmcService.getSslComplaints();
      setComplaints(data || []);
    } catch (err: any) {
      console.error('Failed to load Bihar SSL complaints:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar SSL complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI summary (derived from real data) ── */
  const summary = useMemo(() => {
    const districtSet = new Set<string>();
    const blockSet = new Set<string>();
    const poleSet = new Set<string>();
    let withFile = 0;
    complaints.forEach((r) => {
      if (r.district && String(r.district).trim()) districtSet.add(String(r.district).trim().toLowerCase());
      if (r.block && String(r.block).trim()) blockSet.add(String(r.block).trim().toLowerCase());
      if (r.pole_no && String(r.pole_no).trim()) poleSet.add(String(r.pole_no).trim().toLowerCase());
      if (r.file) withFile += 1;
    });
    return {
      total: complaints.length,
      districts: districtSet.size,
      blocks: blockSet.size,
      poles: poleSet.size,
      withFile,
      withoutFile: complaints.length - withFile,
    };
  }, [complaints]);

  const districts = useMemo(() => {
    const s = new Set<string>();
    complaints.forEach((r) => {
      const d = r.district;
      if (d && String(d).trim()) s.add(String(d).trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [complaints]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((r) => {
      if (districtFilter !== 'all' && String(r.district || '').trim().toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (!q) return true;
      const haystack = [
        r.complaint_id, r.district, r.pole_no, r.block, panchayatOf(r), r.phase, r.ward_no,
        r.beneficiary_name, r.contact_no, r.luminary_no, r.sim_no, r.battery_serial_no, r.module_no, r.complaint,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [complaints, districtFilter, search]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const hasFilters = !!search || districtFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setCurrentPage(1);
  };

  /* ── Export ── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. no.', accessor: (_r, i) => (i !== undefined ? i + 1 : '') },
      { header: 'Complaint ID', accessor: (r) => r.complaint_id || '' },
      { header: 'Complaint Date', accessor: (r) => r.start_date || '' },
      { header: 'Complaint', accessor: (r) => r.complaint || '' },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Panchayat', accessor: (r) => panchayatOf(r) || '' },
      { header: 'Phase', accessor: (r) => r.phase || '' },
      { header: 'Ward No', accessor: (r) => r.ward_no || '' },
      { header: 'Pole No', accessor: (r) => r.pole_no || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact No', accessor: (r) => r.contact_no || '' },
      { header: 'Latitude', accessor: (r) => r.latitude || '' },
      { header: 'Longitude', accessor: (r) => r.longitude || '' },
      { header: 'Along with Pole', accessor: (r) => r.along_with_pole || '' },
      { header: 'Luminary No', accessor: (r) => r.luminary_no || '' },
      { header: 'SIM No', accessor: (r) => r.sim_no || '' },
      { header: 'Battery Serial No', accessor: (r) => r.battery_serial_no || '' },
      { header: 'Module No', accessor: (r) => r.module_no || '' },
      { header: 'Date of Installation', accessor: (r) => r.date_of_installation || '' },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filteredRows, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SSL_AMC_Complaints', filteredRows, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SSL_AMC_Complaints', filteredRows, exportCols);
  const handlePdf = () => printTableData('Bihar SSL AMC - Complaints Raised', filteredRows, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Bihar SSL AMC Complaints Raised"
        subtitle="Master register of breakdown and maintenance complaints logged during SSL AMC site inspections"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'Complaint Raised' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/v/view-biharssl" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">View SSL AMC</span>
            </Link>
            <Link to="/v/edit-biharssl" className="ax-btn ax-btn--primary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="ax-btn__label">Add SSL AMC</span>
            </Link>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
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
              label="Total Complaints"
              value={summary.total.toLocaleString('en-IN')}
              sub={`${summary.poles.toLocaleString('en-IN')} unique poles`}
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
              label="Districts Covered"
              value={summary.districts.toLocaleString('en-IN')}
              sub={`${summary.blocks.toLocaleString('en-IN')} blocks`}
              icon={svgIcon(
                <>
                  <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="With Attachment"
              value={summary.withFile.toLocaleString('en-IN')}
              sub="Complaints with a document / photo"
              icon={svgIcon(
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              )}
            />
            <KpiCard
              tone="amber"
              label="Without Attachment"
              value={summary.withoutFile.toLocaleString('en-IN')}
              sub="No document / photo uploaded"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL AMC Complaints">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Complaints Raised Under Bihar SSL AMC</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{complaints.length}</span> complaints
                {' '}· Districts <b className="ax-num">{summary.districts}</b> · With attachment <b className="ax-num">{summary.withFile}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
                  placeholder="Search complaint ID, pole, contact…"
                  size="sm"
                  ariaLabel="Search complaints"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SSL AMC Complaints</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Complaint ID</th>
                  <th className="ax-table__th" scope="col">Complaint Date</th>
                  <th className="ax-table__th" scope="col">Complaint</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">Ward No.</th>
                  <th className="ax-table__th" scope="col">Pole No.</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Contact No.</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Along with Pole</th>
                  <th className="ax-table__th" scope="col">Luminary No.</th>
                  <th className="ax-table__th" scope="col">SIM No.</th>
                  <th className="ax-table__th" scope="col">Battery Serial No.</th>
                  <th className="ax-table__th" scope="col">Module No.</th>
                  <th className="ax-table__th" scope="col">Date of Installation</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={22} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Bihar SSL complaints from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={22} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={hasFilters ? 'No matching complaints found' : 'No complaints raised'}
                        message={
                          hasFilters
                            ? 'No complaints match your filters. Try clearing filters or search term.'
                            : errorMsg || 'There are currently no complaints recorded under Bihar SSL AMC.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagedRows.map((r, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const fileUrl = r.file ? getAmcMediaUrl(r.file) : '';
                    return (
                      <tr key={r.id || r.complaint_id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>{txt(r.complaint_id)}</td>
                        <td className="ax-table__td">{txt(r.start_date)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }} title={r.complaint}>{txt(r.complaint)}</td>
                        <td className="ax-table__td">{txt(r.state || 'Bihar')}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.district)}</td>
                        <td className="ax-table__td">{txt(r.block)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(panchayatOf(r))}</td>
                        <td className="ax-table__td">{txt(r.phase)}</td>
                        <td className="ax-table__td">{txt(r.ward_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.pole_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(r.beneficiary_name)}</td>
                        <td className="ax-table__td">{txt(r.contact_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.latitude)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.longitude)}</td>
                        <td className="ax-table__td">{txt(r.along_with_pole)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.luminary_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.sim_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.battery_serial_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.module_no)}</td>
                        <td className="ax-table__td">{txt(r.date_of_installation)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '0 8px' }}
                              onClick={() => setPreviewDoc({ url: fileUrl, complaintId: String(r.complaint_id) })}
                            >
                              View File
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
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
                totalItems={filteredRows.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {previewDoc && (
        <AttachmentPreviewModal
          url={previewDoc.url}
          title={`Complaint Attachment: ${previewDoc.complaintId}`}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export default Bihar_AMC_SSL_ComplaintRaised;