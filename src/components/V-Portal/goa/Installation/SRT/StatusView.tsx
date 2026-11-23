import { useState, useMemo, useEffect, useCallback, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtInstalledSiteItem,
} from '../../goa-services/goaSrtInstallationService';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  KpiSkeleton,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

/* ───────── Field helpers (API field-name mismatch fix) ───────── */
const pick = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

// Page key -> possible API keys (first non-empty wins)
const ALIASES: Record<string, string[]> = {
  id: ['id', 'uid'],
  site_name: ['site_name', 'name', 'farmer_name', 'consumer_name'],
  state: ['state', 'State'],
  district: ['district', 'District'],
  location: ['location', 'site_location', 'address'],
  dept_name: ['dept_name', 'department', 'department_name'],
  firm_name: ['firm_name', 'agency_name', 'company_name'],
  ca_no: ['ca_no', 'ca_number', 'consumer_no', 'account_no'],
  sanction_load: ['sanction_load', 'load', 'capacity', 'volume'],
  wo_no: ['wo_no', 'work_order_no', 'work_order'],
  phase: ['phase', 'connection_phase'],
  plant_sc: ['plant_sc', 'plant_code'],
  discom: ['discom', 'discom_name'],
  contact_person: ['contact_person', 'consumer_name', 'beneficiary_name', 'contact_person_name'],
  contact_number: ['contact_number', 'contact_no', 'mobile_no', 'phone', 'contact'],
  vendor: ['vendor', 'inst_vendor', 'vendor_id', 'installer_name'],
  assign_date: ['inst_assign_date', 'assign_date', 'assigned_date'],
  deadline_date: ['inst_deadline', 'deadline_date', 'deadline'],
  install_date: ['installation_date', 'inst_date', 'date', 'created_at'],
  solar_meter_no: ['solar_meter_no', 'solarmeter_no', 'sm_no'],
  inverter_no: ['inverter_no', 'inv_no'],
  net_smart_meter_no: ['net_smart_meter_no', 'nm_sm_no', 'smart_meter_no', 'smart_meter'],
  logger_no: ['loger_no', 'logger_no'],
  latitude: ['latitude', 'inst_latitude'],
  longitude: ['longitude', 'inst_longitude'],
  remark: ['inst_remarks', 'remark', 'remarks', 'agency_remarks'],
  material_invoice_date: ['material_i_date', 'material_invoice_date'],
  material_bill_invoice: ['mb_invoice', 'material_bill_invoice'],
  meter_i_date: ['meter_i_date', 'meter_inspection_date'],
  net_meter_submit_date: ['net_meter_submit_date', 'nm_submit_date'],
  bill_i_no: ['bill_i_no', 'ic_bill_no'],
  rms_url: ['rms_url', 'rms_link'],
  rms_id: ['rms_id', 'rms_user'],
  rms_pass: ['rms_pass', 'rms_password'],
  wms_login: ['wms_login', 'wms'],
};

const txt = (row: any, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

/* ───────── Installation, Verify & Claim Status Resolvers ───────── */
const isInstalled = (r: any): boolean => {
  const sis = String(r?.site_inst_status ?? '').trim();
  if (sis === '1') return true;
  if (sis === '0') return false;
  const ist = String(r?.inst_status ?? r?.installation_status ?? '').toLowerCase().trim();
  return ist === '1' || ist === 'complete' || ist === 'completed';
};

const verifyOf = (r: any): number => {
  const val = r?.verify_status ?? r?.inst_verify_status ?? r?.verify ?? r?.verification_status;
  if (val === null || val === undefined) return 0;
  const s = String(val).toLowerCase().trim();
  if (s === '1' || s === 'approved' || s === 'approve') return 1;
  if (s === '2' || s === 'rejected' || s === 'reject') return 2;
  return 0; // pending
};

const claimOf = (r: any): number => {
  const val = r?.claim_status ?? r?.inst_claim_status ?? r?.claim;
  if (val === null || val === undefined) return 0;
  const s = String(val).toLowerCase().trim();
  if (s === '2' || s === 'approved' || s === 'approve') return 2;
  if (s === '3' || s === 'rejected' || s === 'reject') return 3;
  if (s === '1' || s === 'raised' || s === 'raise' || s === 'applicable') return 1;
  return 0; // not raised
};

/* ───────── Status Badges ───────── */
const InstallBadge = ({ row }: { row: any }) => {
  const installed = isInstalled(row);
  if (installed) {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Installed</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const v = value !== undefined ? value : verifyOf({ inst_verify_status: raw });
  if (v === 1) return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (v === 2) return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

const ClaimBadge = ({ status, raw }: { status?: number; raw?: any }) => {
  const s = status !== undefined ? status : claimOf({ inst_claim_status: raw });
  if (s === 2) return <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>;
  if (s === 3) return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  if (s === 1) return <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Raised</span>;
};

/* ── Image Candidate Resolvers ── */
const getSitePhoto = (r: any) => r?.geo_image1 || r?.system_image || r?.site_image || r?.image1;
const getInverterPhoto = (r: any) => r?.geo_image2 || r?.inverter_image || r?.image2;
const getPanelPhoto = (r: any) => r?.geo_image3 || r?.panel_image || r?.image3;
const getMeterPhoto = (r: any) => r?.geo_image4 || r?.nm_sm_image || r?.net_smart_meter_image || r?.image4;
const getSlipPhoto = (r: any) => r?.ts_image || r?.fs_image;
const getDocPhoto = (r: any) => r?.cr_doc || r?.iv_curv_doc || r?.abc_photo || r?.insurance_copy;

/* ── Robust Table Image: NO BORDER RADIUS ── */
function RobustImage({
  path,
  alt,
  onClick,
}: {
  path?: string | null;
  alt: string;
  onClick?: (url: string) => void;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(() => getGoaSrtInstallationImageCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
      }}
      onClick={() => onClick?.(currentSrc)}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((prev) => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

/* ───────── KPI Card (same as Karnataka SWP dashboard, with clickable numbers) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_MAP = svg(<><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3z" /><path d="M9 4v13" /><path d="M15 7v13" /></>);

interface KpiSegment {
  label: string;
  count: number | string;
  onClick?: () => void;
}

const onActivate = (fn: () => void) => (e: ReactKeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function KpiCard({
  icon, tone, label, value, unit, sub, badge, onClick, segments,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value?: ReactNode; unit?: string; sub: string; badge?: string;
  onClick?: () => void; segments?: KpiSegment[];
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'asw-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg, 12px)',
        background: 'var(--ax-bg-surface, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md, 8px)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
            {segments && segments.length > 0
              ? segments.map((seg, i) => (
                  <span key={seg.label}>
                    {i > 0 && <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500, margin: '0 4px' }}>/</span>}
                    <span
                      className={seg.onClick ? 'kpi-seg' : undefined}
                      role={seg.onClick ? 'button' : undefined}
                      tabIndex={seg.onClick ? 0 : undefined}
                      title={seg.onClick ? `View ${seg.label} sites` : undefined}
                      onClick={seg.onClick ? (e) => { e.stopPropagation(); seg.onClick!(); } : undefined}
                      onKeyDown={seg.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); seg.onClick!(); } } : undefined}
                    >
                      {seg.count}
                    </span>
                  </span>
                ))
              : value}{' '}
            {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Responsive page CSS (Karnataka SWP design language) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

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

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* Interactive KPI & clickable numbers */
  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--asw-primary-rgb), 0.35) !important;
  }
  .solar-erp-page .kpi-seg {
    cursor: pointer; border-radius: 4px; padding: 0 2px; transition: background 120ms ease, color 120ms ease;
  }
  .solar-erp-page .kpi-seg:hover { background: rgba(var(--asw-primary-rgb), 0.12); color: var(--asw-primary); text-decoration: underline; }
  .solar-erp-page .kpi-seg:focus-visible { outline: 2px solid var(--asw-primary); outline-offset: 1px; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title { font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md); }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: flex-start; margin-left: 0; flex-wrap: wrap; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

const OVERLAY_CSS = `
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

  /* Site Details Modal */
  .goa-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .goa-detail-item {
    background: var(--ax-surface-subtle, #f8fafc);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .goa-detail-label {
    font-size: 11px;
    color: var(--ax-text-muted, #64748b);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .goa-detail-val {
    font-size: 13px;
    font-weight: 600;
    color: var(--ax-text-strong, #0f172a);
    word-break: break-word;
  }
  .goa-media-card {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .goa-media-title {
    font-size: 11px;
    font-weight: 600;
    padding: 6px 8px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    color: var(--ax-text-muted, #64748b);
  }
`;

/* ── Lightbox with Zoom ── */
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
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 860, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
      >
        <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title || 'Media Preview'}</h4>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
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

        <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">Open Full</a>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Site Detail Modal Component ───────── */
function SiteDetailModal({
  site,
  onClose,
  onOpenPreview,
}: {
  site: any;
  onClose: () => void;
  onOpenPreview: (url: string, title: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const siteTitle = txt(site, 'site_name') || `Site #${site.id}`;

  const mediaList: { title: string; path?: string | null }[] = [
    { title: 'Geo Image 1 (Site/Structure)', path: site.geo_image1 || site.system_image },
    { title: 'Geo Image 2 (Inverter/Plant)', path: site.geo_image2 || site.inverter_image },
    { title: 'Geo Image 3 (Panel Array)', path: site.geo_image3 || site.panel_image },
    { title: 'Geo Image 4 (Meter/Connection)', path: site.geo_image4 || site.nm_sm_image },
    { title: 'Test Slip', path: site.ts_image },
    { title: 'Fix Slip', path: site.fs_image },
    { title: 'Commissioning Report', path: site.cr_doc },
    { title: 'IV Curve Document', path: site.iv_curv_doc },
    { title: 'ABC Format Photo', path: site.abc_photo },
    { title: 'Insurance Copy', path: site.insurance_copy },
    { title: 'System Image', path: site.system_image },
    { title: 'Inverter Image', path: site.inverter_image },
    { title: 'Panel Image', path: site.panel_image },
    { title: 'Net / Smart Meter Image', path: site.nm_sm_image },
    { title: 'Logger Image', path: site.loger_image },
    { title: 'Generation Image', path: site.inst_gen_image },
    { title: 'RMS Logger Image', path: site.inst_rms_loger_image },
  ].filter((m) => !!m.path);

  return createPortal(
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--ax-border, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div
          className="ax-modal__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                {siteTitle}
              </h3>
              <span className="ax-badge ax-badge--soft ax-badge--neutral">ID #{site.id}</span>
              <InstallBadge row={site} />
              <VerifyBadge value={verifyOf(site)} />
              <ClaimBadge status={claimOf(site)} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {txt(site, 'district')} · {txt(site, 'location') || 'Goa'} · WO: {txt(site, 'wo_no') || DASH}
            </div>
          </div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ fontSize: 16, width: 32, height: 32, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="ax-modal__body" style={{ padding: 20, overflowY: 'auto' }}>
          {/* Section 1: Site & Location Info */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              1. Site & Location Details
            </h4>
            <div className="goa-detail-grid">
              <div className="goa-detail-item">
                <div className="goa-detail-label">Site Name</div>
                <div className="goa-detail-val">{txt(site, 'site_name') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Department</div>
                <div className="goa-detail-val">{txt(site, 'dept_name') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Location / Address</div>
                <div className="goa-detail-val">{txt(site, 'location') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">District & State</div>
                <div className="goa-detail-val">{txt(site, 'district')} (Goa)</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">CA Number</div>
                <div className="goa-detail-val">{txt(site, 'ca_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Sanction Load</div>
                <div className="goa-detail-val">{txt(site, 'sanction_load') ? `${txt(site, 'sanction_load')} kW` : DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Firm Name</div>
                <div className="goa-detail-val">{txt(site, 'firm_name') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Discom</div>
                <div className="goa-detail-val">{txt(site, 'discom') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Work Order No.</div>
                <div className="goa-detail-val">{txt(site, 'wo_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Phase</div>
                <div className="goa-detail-val">{txt(site, 'phase') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Plant SC</div>
                <div className="goa-detail-val">{txt(site, 'plant_sc') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Company ID</div>
                <div className="goa-detail-val">{txt(site, 'company_id') || DASH}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Vendor Assignment */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              2. Contact & Vendor Assignment
            </h4>
            <div className="goa-detail-grid">
              <div className="goa-detail-item">
                <div className="goa-detail-label">Contact Person</div>
                <div className="goa-detail-val">{txt(site, 'contact_person') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Contact Number</div>
                <div className="goa-detail-val" style={{ fontFamily: 'var(--ax-font-mono)' }}>{txt(site, 'contact_number') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Assigned Vendor</div>
                <div className="goa-detail-val">{txt(site, 'vendor') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Assigned Date</div>
                <div className="goa-detail-val">{txt(site, 'assign_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Deadline Date</div>
                <div className="goa-detail-val">{txt(site, 'deadline_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Assignment Acceptance</div>
                <div className="goa-detail-val">
                  {String(site.inst_accept) === '1' ? 'Accepted' : 'Pending'}
                </div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Assigned ID / By</div>
                <div className="goa-detail-val">{site.inst_assigned_id || site.inst_assigned_by ? `#${site.inst_assigned_id ?? ''} (By #${site.inst_assigned_by ?? ''})` : DASH}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Installation & Verification */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              3. Installation & Verification Status
            </h4>
            <div className="goa-detail-grid">
              <div className="goa-detail-item">
                <div className="goa-detail-label">Field Installation Status</div>
                <div className="goa-detail-val"><InstallBadge row={site} /></div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Installation Date</div>
                <div className="goa-detail-val">{txt(site, 'install_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Audit Verification</div>
                <div className="goa-detail-val"><VerifyBadge value={verifyOf(site)} /></div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Claim Status</div>
                <div className="goa-detail-val"><ClaimBadge status={claimOf(site)} /></div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Document Submission</div>
                <div className="goa-detail-val">
                  {site.inst_doc_submit === 1 || site.inst_doc_submit === '1' ? 'Submitted' : 'Pending'}
                </div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Installation Remarks</div>
                <div className="goa-detail-val">{txt(site, 'remark') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Agency Remarks</div>
                <div className="goa-detail-val">{site.agency_remarks || DASH}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Material & Metering / IC */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              4. Material & Metering / IC Details
            </h4>
            <div className="goa-detail-grid">
              <div className="goa-detail-item">
                <div className="goa-detail-label">Material Dispatch Status</div>
                <div className="goa-detail-val">{site.material_dispatch_status === 1 ? 'Dispatched' : 'Pending'}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Material Invoice Date</div>
                <div className="goa-detail-val">{txt(site, 'material_invoice_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">MB / Bill Invoice</div>
                <div className="goa-detail-val">{txt(site, 'material_bill_invoice') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Material Payment</div>
                <div className="goa-detail-val">{site.material_payment === 1 ? 'Paid' : 'Pending'}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Metering Status</div>
                <div className="goa-detail-val">{site.metering_status === 1 ? 'Complete' : 'Pending'}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Net Meter Submit Date</div>
                <div className="goa-detail-val">{txt(site, 'net_meter_submit_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Meter Inspection Date</div>
                <div className="goa-detail-val">{txt(site, 'meter_i_date') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">IC Bill Submit</div>
                <div className="goa-detail-val">{site.ic_bill_submit === 1 ? 'Submitted' : 'Pending'}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Bill Invoice No.</div>
                <div className="goa-detail-val">{txt(site, 'bill_i_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">IC Payment & Date</div>
                <div className="goa-detail-val">
                  {site.ic_payment === 1 ? 'Paid' : 'Pending'} {site.ic_date ? `(${site.ic_date})` : ''}
                </div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Smart Meter / NM Convert</div>
                <div className="goa-detail-val">{site.smart_meter === 1 || site.convert_nm === 1 ? 'Yes' : 'No'}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Load Enhancement & NDC</div>
                <div className="goa-detail-val">
                  {site.load_enhancement || 'None'} {site.ndc === 1 ? '(NDC Done)' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: RMS & Equipment Serials */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              5. Equipment Serials & RMS Remote Monitoring
            </h4>
            <div className="goa-detail-grid">
              <div className="goa-detail-item">
                <div className="goa-detail-label">Solar Meter No.</div>
                <div className="goa-detail-val">{txt(site, 'solar_meter_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Inverter No.</div>
                <div className="goa-detail-val">{txt(site, 'inverter_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Net / Smart Meter No.</div>
                <div className="goa-detail-val">{txt(site, 'net_smart_meter_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">Logger No.</div>
                <div className="goa-detail-val">{txt(site, 'logger_no') || DASH}</div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">RMS Status</div>
                <div className="goa-detail-val">
                  {site.rms_status === 1 || site.rms_status === '1' ? 'Active' : (site.rms_url ? 'Configured' : 'Inactive')}
                </div>
              </div>
              <div className="goa-detail-item">
                <div className="goa-detail-label">RMS User ID / Login</div>
                <div className="goa-detail-val">{site.rms_id || site.wms_login || DASH}</div>
              </div>
              <div className="goa-detail-item" style={{ gridColumn: 'span 2' }}>
                <div className="goa-detail-label">RMS Portal URL</div>
                <div className="goa-detail-val">
                  {site.rms_url ? (
                    <a href={site.rms_url} target="_blank" rel="noreferrer" style={{ color: 'var(--asw-primary)', textDecoration: 'underline' }}>
                      {site.rms_url} ↗
                    </a>
                  ) : (
                    DASH
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Photos & Evidence Gallery */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--asw-primary, #2563eb)', marginBottom: 8, letterSpacing: '0.04em' }}>
              6. Photos & Evidence ({mediaList.length} Uploaded)
            </h4>
            {mediaList.length === 0 ? (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, padding: 12, background: 'var(--ax-surface-subtle)', borderRadius: 8 }}>
                No site evidence photos or documents uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                {mediaList.map((m) => (
                  <div key={m.title} className="goa-media-card">
                    <div className="goa-media-title" title={m.title}>{m.title}</div>
                    <div style={{ padding: 8, textAlign: 'center', background: '#fdfdfd' }}>
                      <RobustImage
                        path={m.path}
                        alt={m.title}
                        onClick={(url) => onOpenPreview(url, `${siteTitle} - ${m.title}`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="ax-modal__footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── Status Categories ───────── */
export interface StatusOption {
  key: string;
  label: string;
  sub: string;
  tone: KpiTone;
}

export const STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All assigned rooftop sites', tone: 'accent' },
  { key: 'complete', label: 'Installed', sub: 'Completed installations', tone: 'emerald' },
  { key: 'pending', label: 'Pending', sub: 'Pending field installations', tone: 'amber' },
  { key: 'inspection-complete', label: 'Inspection Done', sub: 'Sites with completed inspection', tone: 'violet' },
  { key: 'inspection-pending', label: 'Inspection Pending', sub: 'Sites awaiting inspection', tone: 'amber' },
  { key: 'verify-pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', tone: 'amber' },
  { key: 'verify-approved', label: 'Verify Approved', sub: 'Approved by departmental audit', tone: 'cyan' },
  { key: 'verify-reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', tone: 'red' },
  { key: 'doc-complete', label: 'Doc Submitted', sub: 'Installation documents submitted', tone: 'violet' },
  { key: 'doc-pending', label: 'Doc Pending', sub: 'Documents awaiting submission', tone: 'amber' },
  { key: 'claim-applicable', label: 'Claim Applicable', sub: 'Sites eligible for claim', tone: 'violet' },
  { key: 'claim-raised', label: 'Claim Raised', sub: 'Vendor invoices submitted', tone: 'accent' },
  { key: 'inst-pay1', label: 'Payment 1', sub: '1st 70% disbursement sites', tone: 'cyan' },
  { key: 'inst-pay2', label: 'Payment 2', sub: '2nd 15% disbursement sites', tone: 'amber' },
  { key: 'inst-pay3', label: 'Payment 3', sub: '3rd 15% disbursement sites', tone: 'violet' },
];

export default function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'total';
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [data, setData] = useState<GoaSrtInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filters & pagination
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState(initialDistrict);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const activeMeta = useMemo(() => {
    return (
      STATUS_CATALOG.find((s) => s.key === currentStatus) || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        sub: `Filtered by ${currentStatus}`,
        tone: 'accent' as KpiTone,
      }
    );
  }, [currentStatus]);

  // Sync state from query params (status + district)
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district') || 'all';
    if (s && s !== currentStatus) setCurrentStatus(s);
    if (d !== districtFilter) setDistrictFilter(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load status sites (supports both status & districtwise endpoint)
  const loadStatusData = useCallback(async (statusKey: string, district = 'all', isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let items: any[] = [];
      if (district && district !== 'all' && district !== 'All') {
        items = await goaSrtInstallationService.getDashboardDistrictwiseData(statusKey, district);
        // Fallback to status view data if districtwise endpoint is empty or not implemented
        if (!items || items.length === 0) {
          const allItems = await goaSrtInstallationService.getDashboardViewData(statusKey);
          items = Array.isArray(allItems) ? allItems : [];
        }
      } else {
        items = await goaSrtInstallationService.getDashboardViewData(statusKey);
      }
      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('[Goa StatusView] load error:', err);
      setError(err?.message || 'Failed to load installation status records');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatusData(currentStatus, districtFilter);
  }, [currentStatus, districtFilter, loadStatusData]);

  // Status selection (KPI numbers, dropdown) — keeps the district filter
  const handleSelectStatus = useCallback((key: string) => {
    setCurrentStatus(key);
    const next = new URLSearchParams();
    next.set('status', key);
    if (districtFilter !== 'all') next.set('district', districtFilter);
    setSearchParams(next);
    setSearch('');
    setCurrentPage(1);
  }, [districtFilter, setSearchParams]);

  const handleSelectDistrict = (d: string) => {
    setDistrictFilter(d);
    const next = new URLSearchParams();
    next.set('status', currentStatus);
    if (d !== 'all') next.set('district', d);
    setSearchParams(next);
    setCurrentPage(1);
  };

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = txt(r, 'district');
      if (d) set.add(d.trim());
    });
    if (districtFilter !== 'all') set.add(districtFilter);
    return Array.from(set).sort();
  }, [data, districtFilter]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      const dist = txt(row, 'district').trim();
      if (districtFilter !== 'all' && dist.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (!q) return true;
      const haystack = [
        row.id,
        txt(row, 'site_name'),
        txt(row, 'dept_name'),
        txt(row, 'location'),
        txt(row, 'firm_name'),
        txt(row, 'discom'),
        txt(row, 'ca_no'),
        txt(row, 'sanction_load'),
        txt(row, 'wo_no'),
        txt(row, 'phase'),
        txt(row, 'plant_sc'),
        txt(row, 'contact_person'),
        txt(row, 'contact_number'),
        txt(row, 'vendor'),
        txt(row, 'solar_meter_no'),
        txt(row, 'inverter_no'),
        txt(row, 'net_smart_meter_no'),
        txt(row, 'logger_no'),
        txt(row, 'district'),
        txt(row, 'remark'),
        txt(row, 'bill_i_no'),
        txt(row, 'rms_id'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, districtFilter, search]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // KPIs (real loaded data, after district filter)
  const totalSites = filteredRows.length;
  const verifyApproved = filteredRows.filter((r) => verifyOf(r) === 1).length;
  const verifyRejected = filteredRows.filter((r) => verifyOf(r) === 2).length;
  const verifyPending = totalSites - verifyApproved - verifyRejected;
  const claimRaised = filteredRows.filter((r) => claimOf(r) >= 1).length;
  const claimNotRaised = totalSites - claimRaised;
  const districtCount = new Set(filteredRows.map((r) => txt(r, 'district').trim()).filter(Boolean)).size;

  const exportCols: ExportColumn<GoaSrtInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (r: GoaSrtInstalledSiteItem, idx) => String(idx !== undefined ? idx + 1 : r.id || DASH) },
      { header: 'State', accessor: (r) => txt(r, 'state') || 'Goa' },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') || `Site #${r.id}` },
      { header: 'Department', accessor: (r) => txt(r, 'dept_name') || DASH },
      { header: 'Location', accessor: (r) => txt(r, 'location') || DASH },
      { header: 'Firm Name', accessor: (r) => txt(r, 'firm_name') || DASH },
      { header: 'Discom', accessor: (r) => txt(r, 'discom') || DASH },
      { header: 'CA No.', accessor: (r) => txt(r, 'ca_no') || DASH },
      { header: 'Sanction Load', accessor: (r) => txt(r, 'sanction_load') ? `${txt(r, 'sanction_load')} kW` : DASH },
      { header: 'Work Order No.', accessor: (r) => txt(r, 'wo_no') || DASH },
      { header: 'Phase', accessor: (r) => txt(r, 'phase') || DASH },
      { header: 'Plant SC', accessor: (r) => txt(r, 'plant_sc') || DASH },
      { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r) => txt(r, 'contact_number') || DASH },
      { header: 'Vendor', accessor: (r) => txt(r, 'vendor') || DASH },
      { header: 'Assigned Date', accessor: (r) => txt(r, 'assign_date') || DASH },
      { header: 'Deadline Date', accessor: (r) => txt(r, 'deadline_date') || DASH },
      {
        header: 'Installation Status',
        accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending'),
      },
      { header: 'Installation Date', accessor: (r) => txt(r, 'install_date') || DASH },
      { header: 'Solar Meter No.', accessor: (r) => txt(r, 'solar_meter_no') || DASH },
      { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') || DASH },
      { header: 'Net / Smart Meter No.', accessor: (r) => txt(r, 'net_smart_meter_no') || DASH },
      { header: 'Logger No.', accessor: (r) => txt(r, 'logger_no') || DASH },
      {
        header: 'RMS Status',
        accessor: (r) => (r.rms_status === 1 || r.rms_status === '1' ? 'Active' : r.rms_url ? 'Configured' : 'Inactive'),
      },
      { header: 'Remark', accessor: (r) => txt(r, 'remark') || DASH },
      {
        header: 'Verify Status',
        accessor: (r) => {
          const st = verifyOf(r);
          return st === 1 ? 'Approved' : st === 2 ? 'Rejected' : 'Pending';
        },
      },
      {
        header: 'Claim Status',
        accessor: (r) => {
          const st = claimOf(r);
          return st === 2 ? 'Approved' : st === 3 ? 'Rejected' : st === 1 ? 'Raised' : 'Not Raised';
        },
      },
    ],
    []
  );

  const openPreview = (url: string, title: string) => setPreviewImage({ url, title });

  const hasFilters = !!search || districtFilter !== 'all';

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={`Goa SRT Sites: ${activeMeta.label}${districtFilter !== 'all' ? ` (${districtFilter})` : ''}`}
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {activeMeta.sub} · Showing {num(filteredRows.length)} of {num(data.length)} loaded sites
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/srt/installation/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Goa
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, districtFilter, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/goa/srt/installation/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {error && (
          <div className="ax-col--12" role="alert" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><b>Error loading status records:</b> {error}</span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* ── Summary KPI Cards — click a number to load that status ── */}
        {loading && !data.length ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              icon={I_PIN}
              tone={activeMeta.tone}
              label={activeMeta.label}
              value={num(totalSites)}
              unit="Sites"
              sub={activeMeta.sub}
            />
            <KpiCard
              icon={I_SHIELD}
              tone="cyan"
              label="Verification Status"
              sub="Approved / Pending / Rejected"
              onClick={() => handleSelectStatus('verify-approved')}
              segments={[
                { label: 'Approved', count: num(verifyApproved), onClick: () => handleSelectStatus('verify-approved') },
                { label: 'Verify Pending', count: num(verifyPending), onClick: () => handleSelectStatus('verify-pending') },
                { label: 'Rejected', count: num(verifyRejected), onClick: () => handleSelectStatus('verify-reject') },
              ]}
            />
            <KpiCard
              icon={I_LIST}
              tone="amber"
              label="Claim Status"
              sub="Raised / Not Raised"
              onClick={() => handleSelectStatus('claim-raised')}
              segments={[
                { label: 'Claim Raised', count: num(claimRaised), onClick: () => handleSelectStatus('claim-raised') },
                { label: 'Not Raised', count: num(claimNotRaised) },
              ]}
            />
            <KpiCard
              icon={I_MAP}
              tone="violet"
              label="Districts Covered"
              value={num(districtCount)}
              unit="Districts"
              sub="In the loaded records"
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="status-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>INSTALLATION STATUS</span>
              <h2 id="status-table-title" className="ax-card__title">View {activeMeta.label} Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredRows.length} of {data.length} site records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={currentStatus}
                  onChange={(e) => handleSelectStatus(e.target.value)}
                  aria-label="Filter by status category"
                >
                  {STATUS_CATALOG.map((st) => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                  {!STATUS_CATALOG.some((s) => s.key === currentStatus) && (
                    <option value={currentStatus}>{activeMeta.label}</option>
                  )}
                </select>

                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => handleSelectDistrict(e.target.value)}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearch('');
                      handleSelectDistrict('all');
                    }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                  placeholder="Search site, CA, contact, meter, dept…"
                  size="sm"
                  ariaLabel="Search status records"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                  onExportCSV={() => exportDataToCSV(`Goa_SRT_Status_${currentStatus}`, filteredRows, exportCols)}
                  onExportExcel={() => exportDataToExcel(`Goa_SRT_Status_${currentStatus}`, filteredRows, exportCols)}
                  onExportPDF={() => printTableData(`Goa SRT Installation - ${activeMeta.label}`, filteredRows, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 3200 }}
            >
              <caption className="ax-visually-hidden">View {activeMeta.label} Information</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Department</th>
                  <th className="ax-table__th" scope="col">Location</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Sanction Load</th>
                  <th className="ax-table__th" scope="col">Work Order No.</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">Firm Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assigned Date</th>
                  <th className="ax-table__th" scope="col">Deadline Date</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Install Status</th>
                  <th className="ax-table__th" scope="col">Install Date</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Logger No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Photo (Geo 1)</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Inverter Photo (Geo 2)</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Panel Photo (Geo 3)</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Meter Photo (Geo 4)</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Test / Fix Slip</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Doc / Report</th>
                  <th className="ax-table__th" scope="col">RMS Status</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="ax-table__td" colSpan={33} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" /> Loading {activeMeta.label} sites...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={33} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState
                        title="No sites found"
                        message={
                          hasFilters
                            ? 'No records match your search or district filter.'
                            : `No sites available for status category "${activeMeta.label}".`
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const siteTitle = txt(row, 'site_name') || `Site #${row.id}`;
                    const siteImg = getSitePhoto(row);
                    const invImg = getInverterPhoto(row);
                    const pnlImg = getPanelPhoto(row);
                    const mtrImg = getMeterPhoto(row);
                    const slipImg = getSlipPhoto(row);
                    const docImg = getDocPhoto(row);

                    return (
                      <tr key={row.id ?? `${(row as any).site_id ?? ''}-${idx}`}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{txt(row, 'state') || 'Goa'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row, 'district') || DASH}</td>
                        <td
                          className="ax-table__td"
                          style={{
                            fontWeight: 600,
                            color: 'var(--asw-primary, #2563eb)',
                            maxWidth: 220,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          title={`Click to view details of ${siteTitle}`}
                          onClick={() => setSelectedRecord(row)}
                        >
                          {siteTitle}
                        </td>
                        <td className="ax-table__td">{txt(row, 'dept_name') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'location') || DASH}</td>
                        <td className="ax-table__td">
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">{txt(row, 'ca_no') || DASH}</span>
                        </td>
                        <td className="ax-table__td">
                          {txt(row, 'sanction_load') ? `${txt(row, 'sanction_load')} kW` : DASH}
                        </td>
                        <td className="ax-table__td">{txt(row, 'wo_no') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'phase') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'firm_name') || DASH}</td>
                        <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {txt(row, 'contact_number') || DASH}
                        </td>
                        <td className="ax-table__td">{txt(row, 'vendor') || DASH}</td>
                        <td className="ax-table__td" style={{ fontSize: '11px' }}>{txt(row, 'assign_date') || DASH}</td>
                        <td className="ax-table__td" style={{ fontSize: '11px' }}>{txt(row, 'deadline_date') || DASH}</td>

                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallBadge row={row} />
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '11px' }}>{txt(row, 'install_date') || DASH}</td>

                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'solar_meter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'inverter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'net_smart_meter_no') || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{txt(row, 'logger_no') || DASH}</td>

                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={siteImg} alt="Site" onClick={(url) => openPreview(url, `${siteTitle} - Site / System Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={invImg} alt="Inverter" onClick={(url) => openPreview(url, `${siteTitle} - Inverter Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={pnlImg} alt="Panel" onClick={(url) => openPreview(url, `${siteTitle} - Panel Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={mtrImg} alt="Meter" onClick={(url) => openPreview(url, `${siteTitle} - Meter Image`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={slipImg} alt="Slip" onClick={(url) => openPreview(url, `${siteTitle} - Test / Fix Slip`)} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustImage path={docImg} alt="Doc" onClick={(url) => openPreview(url, `${siteTitle} - Commissioning Report / Doc`)} />
                        </td>

                        <td className="ax-table__td">
                          {row.rms_status === 1 || row.rms_status === '1' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" title={row.rms_url || 'RMS Active'}>Active</span>
                          ) : row.rms_url ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info" title={row.rms_url}>Configured</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral">Inactive</span>
                          )}
                        </td>

                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={txt(row, 'remark')}>
                          {txt(row, 'remark') || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <VerifyBadge value={verifyOf(row)} raw={(row as any).verify} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <ClaimBadge status={claimOf(row)} raw={(row as any).claim} />
                        </td>

                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setSelectedRecord(row)}
                            style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredRows.length}
                onPageChange={setCurrentPage}
                setPage={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Site Details Modal ── */}
      {selectedRecord && (
        <SiteDetailModal
          site={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onOpenPreview={openPreview}
        />
      )}

      {/* ── Photo Preview Modal with Zoom ── */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
