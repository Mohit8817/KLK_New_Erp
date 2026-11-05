import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharAmcService,
  getAmcMediaUrl,
  type BiharSslAmcItem,
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

// API fields (village, light_no, amc_latittude, amc_v_remarks...) may not be on the service type yet
type Row = BiharSslAmcItem & Record<string, any>;
type TabType = 'Incomplete' | 'Complete';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ───────── API field helpers ───────── */
const panchayatOf = (r: any) => r.panchyat || r.panchayat; // API typo: "panchyat"
const stateOf = (r: any) => {
  const s = String(r.state || 'Bihar').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Bihar';
};
const villageOf = (r: any) => r.village || r.location;
const luminaryOf = (r: any) => r.luminary_no || r.light_no;
const amcLatOf = (r: any) => r.amc_latittude || r.amc_latitude || r.latitude; // API typo: "amc_latittude"
const amcLngOf = (r: any) => r.amc_longitude || r.longitude;
const remarksOf = (r: any) => r.amc_v_remarks || r.amc_remarks || r.remark || r.remarks;
const isApprovedRow = (r: any) => Number(r?.amc_verify) === 1 || Number(r?.amcverify_status) === 1;

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
  .ax-modal--top { z-index: 10000; }
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

/* ───────── Photo lightbox (zoom) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal ax-modal--top" role="dialog" aria-modal="true" aria-labelledby="ssl-amc-img-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="ssl-amc-img-title" style={{ fontSize: 15, fontWeight: 600 }}>{title}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>}
            <img
              key={src}
              src={src}
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
        </div>
        <div className="ax-modal__footer">
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={src} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Detail modal helpers ───────── */
function Field({ label, children, span }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block' }}>{label}</span>
      <b>{children}</b>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 12,
          fontSize: 13,
          padding: 14,
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 10,
          background: 'var(--ax-surface-subtle, #f8fafc)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── SSL AMC Detail Modal ───────── */
function SslAmcDetailModal({ item, onClose, onImageClick }: { item: Row; onClose: () => void; onImageClick: (src: string, alt: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchFull = async () => {
      if (!item.id) return;
      setLoading(true);
      try {
        const res: any = await biharAmcService.getViewSslAmcDetail(item.id);
        // response may be { data: { site } } | { site } | { data } | plain object
        const payload = res?.data?.site ?? res?.site ?? res?.data ?? res;
        if (active && payload && typeof payload === 'object') setDetailData(payload);
      } catch (err) {
        console.warn('Could not fetch extra SSL AMC details:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchFull();
    return () => {
      active = false;
    };
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const data: any = { ...item, ...(detailData || {}) };
  const approved = isApprovedRow(data);
  const lat = amcLatOf(data);
  const lng = amcLngOf(data);

  const images: { label: string; path?: string }[] = [
    { label: 'AMC Inspection Photo 1', path: data.amc_image1 },
    { label: 'AMC Inspection Photo 2', path: data.amc_image2 },
  ];

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ssl-amc-detail-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth: 900 }}>
        <div className="ax-modal__header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="ax-modal__title" id="ssl-amc-detail-title" style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                SSL AMC Inspection Details
              </h2>
              <span className={`ax-badge ax-badge--soft ax-badge--pill ${approved ? 'ax-badge--success' : 'ax-badge--info'}`}>
                <span className="ax-badge__dot" />
                {approved ? 'Approved' : 'Completed'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Unique ID: <b style={{ color: 'var(--ax-text-strong)' }}>{txt(data.unique_id)}</b>
              {data.pole_no ? ` · Pole No: ${data.pole_no}` : ''}
            </div>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && (
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              <span className="ax-spinner" style={{ marginRight: 6 }} /> Refreshing latest details from server…
            </div>
          )}

          <Section title="Site & Location">
            <Field label="Unique ID">{txt(data.unique_id)}</Field>
            <Field label="State">{txt(stateOf(data))}</Field>
            <Field label="District">{txt(data.district)}</Field>
            <Field label="Block">{txt(data.block)}</Field>
            <Field label="Panchayat">{txt(panchayatOf(data))}</Field>
            <Field label="Village">{txt(villageOf(data))}</Field>
            <Field label="Ward No.">{txt(data.ward_no)}</Field>
            <Field label="Pole No.">{txt(data.pole_no)}</Field>
            <Field label="Phase">{txt(data.phase)}</Field>
          </Section>

          <Section title="Beneficiary">
            <Field label="Beneficiary Name">{txt(data.beneficiary_name)}</Field>
            <Field label="Contact No.">{txt(data.contact_no)}</Field>
            {(data.amc_beneficiary_name || data.amc_beneficiary_contact_no) && (
              <>
                <Field label="AMC Beneficiary Name">{txt(data.amc_beneficiary_name)}</Field>
                <Field label="AMC Beneficiary Contact">{txt(data.amc_beneficiary_contact_no)}</Field>
              </>
            )}
          </Section>

          <Section title="Hardware / Technical">
            <Field label="Luminary / Light No.">{txt(luminaryOf(data))}</Field>
            <Field label="SIM No.">{txt(data.sim_no)}</Field>
            <Field label="Battery Serial No.">{txt(data.battery_serial_no)}</Field>
            <Field label="Module No.">{txt(data.module_no)}</Field>
            <Field label="IMEI No.">{txt(data.imei_no)}</Field>
          </Section>

          <Section title="AMC Inspection & Verification">
            <Field label="Visit / AMC Date">{txt(data.amc_v_date || data.updated_at || data.created_at)}</Field>
            <Field label="GPS Latitude">{txt(lat)}</Field>
            <Field label="GPS Longitude">{txt(lng)}</Field>
            {lat && lng && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block' }}>Map Location</span>
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn ax-btn--ghost ax-btn--xs"
                >
                  View on Google Maps ↗
                </a>
              </div>
            )}
            <Field label="Inspection Remarks" span>
              <span style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{txt(remarksOf(data))}</span>
            </Field>
          </Section>

          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>AMC Inspection Photos</h3>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {images.map((img) => {
                const url = img.path ? getAmcMediaUrl(img.path) : '';
                return (
                  <div key={img.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200 }}>
                    {url ? (
                      <img
                        src={url}
                        alt={img.label}
                        onClick={() => onImageClick(url, img.label)}
                        title="Click to preview photograph"
                        style={{
                          width: '100%', height: 140, objectFit: 'cover', cursor: 'zoom-in',
                          border: '1px solid var(--ax-border, #cbd5e1)', background: 'var(--ax-surface-subtle, #f8fafc)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px dashed var(--ax-border, #cbd5e1)', fontSize: 12, color: 'var(--ax-text-muted)',
                        }}
                      >
                        No photo uploaded
                      </div>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{img.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const TABS: TabType[] = ['Incomplete', 'Complete'];

/* ───────── Main Component ───────── */
export function Bihar_AMC_SSL_ViewData() {
  const [tab, setTab] = useState<TabType>('Incomplete');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [summary, setSummary] = useState({ total: 0, incomplete: 0, complete: 0, approved: 0 });
  const [incompleteList, setIncompleteList] = useState<Row[]>([]);
  const [completeList, setCompleteList] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [detailItem, setDetailItem] = useState<Row | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const resp: any = await biharAmcService.getViewSslAmcData();
      // API shape: { status, message, data: { total, incomplete, complete, approved, ssls, coms } }
      const payload: any = resp?.data && typeof resp.data === 'object' && !Array.isArray(resp.data) ? resp.data : resp;
      const ssls: Row[] = Array.isArray(payload?.ssls) ? payload.ssls : [];
      const coms: Row[] = Array.isArray(payload?.coms) ? payload.coms : [];
      setSummary({
        total: Number(payload?.total ?? ssls.length + coms.length),
        incomplete: Number(payload?.incomplete ?? ssls.length),
        complete: Number(payload?.complete ?? coms.length),
        approved: Number(payload?.approved ?? coms.filter(isApprovedRow).length),
      });
      setIncompleteList(ssls);
      setCompleteList(coms);
    } catch (err: any) {
      console.error('Failed to load Bihar SSL AMC data:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar SSL AMC records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = tab === 'Incomplete' ? incompleteList : completeList;

  const districts = useMemo(() => {
    const s = new Set<string>();
    currentList.forEach((r) => {
      if (r.district && String(r.district).trim()) s.add(String(r.district).trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [currentList]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentList.filter((r) => {
      if (districtFilter !== 'all' && String(r.district || '').trim().toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (!q) return true;
      const haystack = [
        r.unique_id, r.district, r.block, panchayatOf(r), villageOf(r), r.ward_no, r.pole_no,
        r.beneficiary_name, r.contact_no, luminaryOf(r), r.sim_no, r.battery_serial_no,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [currentList, districtFilter, search]);

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
  const incompleteExportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => (i !== undefined ? i + 1 : '') },
      { header: 'Unique Id', accessor: (r) => r.unique_id || '' },
      { header: 'State', accessor: (r) => stateOf(r) },
      { header: 'Phase', accessor: (r) => r.phase || '' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Panchayat', accessor: (r) => panchayatOf(r) || '' },
      { header: 'Village', accessor: (r) => villageOf(r) || '' },
      { header: 'Ward No.', accessor: (r) => r.ward_no || '' },
      { header: 'Pole No.', accessor: (r) => r.pole_no || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no || '' },
      { header: 'Luminary / Light No.', accessor: (r) => luminaryOf(r) || '' },
      { header: 'SIM No.', accessor: (r) => r.sim_no || '' },
      { header: 'Battery Serial No.', accessor: (r) => r.battery_serial_no || '' },
      { header: 'Status', accessor: () => 'Incomplete' },
    ],
    []
  );

  const completeExportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => (i !== undefined ? i + 1 : '') },
      { header: 'Unique Id', accessor: (r) => r.unique_id || '' },
      { header: 'State', accessor: (r) => stateOf(r) },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Panchayat', accessor: (r) => panchayatOf(r) || '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Status', accessor: (r) => (isApprovedRow(r) ? 'Approved' : 'Completed') },
    ],
    []
  );

  const activeCols = tab === 'Incomplete' ? incompleteExportCols : completeExportCols;
  const fileBase = `Bihar_SSL_AMC_${tab}`;

  const handleCopy = () => copyTableDataToClipboard(filteredRows, activeCols);
  const handleCsv = () => exportDataToCSV(fileBase, filteredRows, activeCols);
  const handleExcel = () => exportDataToExcel(fileBase, filteredRows, activeCols);
  const handlePdf = () => printTableData(`Bihar SSL AMC - ${tab} Sites`, filteredRows, activeCols);

  const colCount = tab === 'Incomplete' ? 17 : 10;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Bihar SSL AMC"
        subtitle="Browse SSL AMC inspection records, verify details and track pending site visits"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View Data' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/v/edit-biharssl" className="ax-btn ax-btn--primary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="ax-btn__label">Add SSL AMC</span>
            </Link>
            <Link to="/v/ssl/view-bihar-ssl-complaint" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">Complaint Raised</span>
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
              label="Total Sites"
              value={summary.total.toLocaleString('en-IN')}
              sub="Assigned AMC sites"
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Incomplete Sites"
              value={summary.incomplete.toLocaleString('en-IN')}
              sub="Pending AMC inspection"
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Completed Sites"
              value={summary.complete.toLocaleString('en-IN')}
              sub="AMC inspection submitted"
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="AMC Approved"
              value={summary.approved.toLocaleString('en-IN')}
              sub="Approved by reviewer"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="AMC site tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t === tab;
              const count = t === 'Incomplete' ? incompleteList.length : completeList.length;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setTab(t);
                    setDistrictFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL AMC Sites">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{tab === 'Incomplete' ? 'Incomplete SSL AMC Sites' : 'Completed SSL AMC Sites'}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{currentList.length}</span> sites
                {' '}· Total <b className="ax-num">{summary.total}</b> · Approved <b className="ax-num">{summary.approved}</b>
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
                  placeholder="Search UID, pole, contact…"
                  size="sm"
                  ariaLabel="Search AMC sites"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SSL AMC Sites</caption>
              <thead className="ax-table__head">
                {tab === 'Incomplete' ? (
                  <tr>
                    <th className="ax-table__th" scope="col">Sr. No.</th>
                    <th className="ax-table__th" scope="col">Unique ID</th>
                    <th className="ax-table__th" scope="col">State</th>
                    <th className="ax-table__th" scope="col">Phase</th>
                    <th className="ax-table__th" scope="col">District</th>
                    <th className="ax-table__th" scope="col">Block</th>
                    <th className="ax-table__th" scope="col">Panchayat</th>
                    <th className="ax-table__th" scope="col">Ward No.</th>
                    <th className="ax-table__th" scope="col">Pole No.</th>
                    <th className="ax-table__th" scope="col">Beneficiary Name</th>
                    <th className="ax-table__th" scope="col">Contact No.</th>
                    <th className="ax-table__th" scope="col">Village</th>
                    <th className="ax-table__th" scope="col">Luminary / Light No.</th>
                    <th className="ax-table__th" scope="col">SIM No.</th>
                    <th className="ax-table__th" scope="col">Battery Serial No.</th>
                    <th className="ax-table__th" scope="col">Status</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>AMC</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="ax-table__th" scope="col">Sr. No.</th>
                    <th className="ax-table__th" scope="col">Unique ID</th>
                    <th className="ax-table__th" scope="col">State</th>
                    <th className="ax-table__th" scope="col">District</th>
                    <th className="ax-table__th" scope="col">Block</th>
                    <th className="ax-table__th" scope="col">Panchayat</th>
                    <th className="ax-table__th" scope="col">Contact No.</th>
                    <th className="ax-table__th" scope="col">Beneficiary Name</th>
                    <th className="ax-table__th" scope="col">Status</th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                )}
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Bihar SSL AMC records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={hasFilters ? 'No matching SSL AMC records' : `No ${tab.toLowerCase()} sites found`}
                        message={
                          hasFilters
                            ? 'No sites match your filters. Try clearing filters or search term.'
                            : errorMsg || `There are currently no ${tab.toLowerCase()} SSL AMC records assigned.`
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
                    const key = r.id || r.unique_id || idx;

                    if (tab === 'Incomplete') {
                      return (
                        <tr key={key} className="ax-table__row">
                          <td className="ax-table__td ax-num">{srNo}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>{txt(r.unique_id)}</td>
                          <td className="ax-table__td">{txt(stateOf(r))}</td>
                          <td className="ax-table__td">{txt(r.phase)}</td>
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.district)}</td>
                          <td className="ax-table__td">{txt(r.block)}</td>
                          <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(panchayatOf(r))}</td>
                          <td className="ax-table__td">{txt(r.ward_no)}</td>
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.pole_no)}</td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(r.beneficiary_name)}</td>
                          <td className="ax-table__td">{txt(r.contact_no)}</td>
                          <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }} title={villageOf(r)}>{txt(villageOf(r))}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(luminaryOf(r))}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.sim_no)}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.battery_serial_no)}</td>
                          <td className="ax-table__td">
                            <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--warning">
                              <span className="ax-badge__dot" />
                              Incomplete
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <Link to={`/v/edit-biharssl?uid=${encodeURIComponent(r.unique_id || '')}`} className="ax-btn ax-btn--primary ax-btn--sm">
                             Update AMC
                            </Link>
                          </td>
                        </tr>
                      );
                    }

                    const approved = isApprovedRow(r);
                    return (
                      <tr key={key} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>{txt(r.unique_id)}</td>
                        <td className="ax-table__td">{txt(stateOf(r))}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.district)}</td>
                        <td className="ax-table__td">{txt(r.block)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(panchayatOf(r))}</td>
                        <td className="ax-table__td">{txt(r.contact_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(r.beneficiary_name)}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${approved ? 'ax-badge--success' : 'ax-badge--info'}`}>
                            <span className="ax-badge__dot" />
                            {approved ? 'Approved' : 'Completed'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setDetailItem(r)} title="View AMC inspection details" style={{ padding: '0 8px' }}>
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

      {detailItem && (
        <SslAmcDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onImageClick={(src, alt) => setPreviewImage({ src, alt })}
        />
      )}

      {previewImage && <ImagePreviewModal src={previewImage.src} title={previewImage.alt} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}

export default Bihar_AMC_SSL_ViewData;