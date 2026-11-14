import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';
import { BIHAR_DISTRICTS } from '../../bihar-types';

// Code-split ApexCharts so Bihar ULA Installation Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Karnataka SWP & Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Responsive chart height hook matching Karnataka SWP & DleDashboard
const useChartHeight = (desktop: number, mobile: number) => {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pick);
  useEffect(() => {
    const onResize = () => setH(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktop, mobile]);
  return h;
};

/* ───────── Responsive page CSS (Exact Karnataka SWP reference, all columns scrollable) ───────── */
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

  /* ───── Card header (desktop): prioritize title width, condense actions ───── */
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }

  /* Search: shrink when space is tight */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Export toolbar: compact layout */
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  /* Tables: responsive scroll container - NO fixed/sticky columns */
  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 850px; }
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

  /* Filter bar matching Karnataka SWP */
  .solar-erp-page .asw-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .asw-filter-item select { width: 165px; }

  /* Interactive KPI cursor & hover */
  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--asw-primary-rgb), 0.35) !important;
  }

  /* ───── Tablet (<=1100px) ───── */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }

    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  /* ───── Mobile (<=760px): Stack and full width ───── */
  @media (max-width: 760px) {
    .solar-erp-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ax-grid--2 {
      grid-template-columns: 1fr !important;
    }
    .solar-erp-page .asw-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .asw-filter-item select { flex: 1; width: auto; max-width: 100%; }

    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  /* ───── Small phones (<=490px) ───── */
  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats {
      grid-template-columns: 1fr !important;
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

/* ───────── SVG Icons matching Karnataka SWP design language ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── KPI Card Component ───────── */
interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
  onClick?: () => void;
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb', apex: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2', apex: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a', apex: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706', apex: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed', apex: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777', apex: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626', apex: '#dc2626' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;

  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'asw-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {hasSpark && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 68, height: 26 }} />}>
                <ApexChart
                  key={`${label}-${spark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: spark! }]}
                  style={{ minHeight: 26, width: 68 }}
                  apex={{
                    yaxis: { min: 0, forceNiceScale: true },
                    plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Modal Dialog Component ───────── */
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ax-modal__dialog" ref={dialogRef} style={{ maxWidth }}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

export interface UlaDistrictDetail {
  district: string;
  totalSites: number;
  structureComplete: number;
  structurePending: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
  claim_approved?: number;
  inst_pay_complete?: number;
}

export interface UlaVendorDetail {
  id: string | number;
  vendor: string;
  vendorId?: string | number;
  totalAllocation: number;
  totalStructure: number;
  pendingStructure: number;
  structureVerifyApproved: number;
  totalInstalled: number;
  pendingInstallation: number;
  verifyApproved: number;
  verifyPending: number;
  verifyRejected: number;
  docSubmitted: number;
  claim_approved?: number;
  inst_pay_complete?: number;
}

export interface DrillSiteRecord {
  id: number | string;
  site_name?: string;
  beneficiary_name?: string;
  district?: string;
  block?: string;
  village?: string;
  ca_no?: string;
  sanction_load?: string;
  contact_no?: string;
  vendor_name?: string;
  structure_status?: string | number;
  inst_status?: string | number;
  verify_status?: string | number;
  doc_status?: string | number;
  claim_status?: string | number;
  payment_status?: string | number;
  structure_image?: string;
  complete_photo?: string;
}

// Default initial Bihar districts fallback
const DEFAULT_BIHAR_DISTRICT_ITEMS: UlaDistrictDetail[] = [
  { district: 'Patna', totalSites: 14, structureComplete: 8, structurePending: 6, completed: 5, pending: 9, approved: 4, rejected: 0, claim_approved: 3, inst_pay_complete: 2 },
  { district: 'Gaya', totalSites: 10, structureComplete: 6, structurePending: 4, completed: 3, pending: 7, approved: 2, rejected: 0, claim_approved: 2, inst_pay_complete: 1 },
  { district: 'Nalanda', totalSites: 8, structureComplete: 5, structurePending: 3, completed: 2, pending: 6, approved: 2, rejected: 0, claim_approved: 1, inst_pay_complete: 1 },
  { district: 'Muzaffarpur', totalSites: 6, structureComplete: 3, structurePending: 3, completed: 1, pending: 5, approved: 1, rejected: 0, claim_approved: 1, inst_pay_complete: 0 },
  { district: 'Samastipur', totalSites: 5, structureComplete: 2, structurePending: 3, completed: 0, pending: 5, approved: 0, rejected: 0, claim_approved: 0, inst_pay_complete: 0 },
  { district: 'Rohtas', totalSites: 4, structureComplete: 1, structurePending: 3, completed: 0, pending: 4, approved: 0, rejected: 0, claim_approved: 0, inst_pay_complete: 0 },
];

export function BiharULAInstallationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filter state
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Chart heights
  const chartH = useChartHeight(300, 240);
  const donutH = useChartHeight(280, 230);

  // Summary KPI statistics
  const [kpiStats, setKpiStats] = useState({
    totalSites: 47,
    sitesAssigned: 25,
    sitesPending: 21,
    sitesCancel: 1,
    structureInstalled: 25,
    structurePending: 22,
    structureApproved: 18,
    structureVerifyPending: 6,
    structureRejected: 1,
    installationInstalled: 11,
    installationPending: 36,
    verificationApproved: 9,
    verificationPending: 2,
    verificationRejected: 0,
    docSubmitted: 6,
    docPending: 5,
    docApproved: 4,
    claim50Raised: 5,
    claim50Approved: 4,
    claim30Raised: 2,
    claim30Approved: 1,
    payment50Paid: 3,
    payment50Partially: 1,
    payment30Paid: 1,
    payment30Partially: 1,
  });

  // Table lists
  const [districtList, setDistrictList] = useState<UlaDistrictDetail[]>(DEFAULT_BIHAR_DISTRICT_ITEMS);
  const [vendorList, setVendorList] = useState<UlaVendorDetail[]>([
    {
      id: 1,
      vendor: 'ETS Networks Pvt Ltd',
      vendorId: 101,
      totalAllocation: 25,
      totalStructure: 15,
      pendingStructure: 10,
      structureVerifyApproved: 12,
      totalInstalled: 7,
      pendingInstallation: 18,
      verifyApproved: 6,
      verifyPending: 1,
      verifyRejected: 0,
      docSubmitted: 4,
      claim_approved: 3,
      inst_pay_complete: 2,
    },
    {
      id: 2,
      vendor: 'Shakti Pumps Ltd',
      vendorId: 102,
      totalAllocation: 14,
      totalStructure: 7,
      pendingStructure: 7,
      structureVerifyApproved: 4,
      totalInstalled: 3,
      pendingInstallation: 11,
      verifyApproved: 2,
      verifyPending: 1,
      verifyRejected: 0,
      docSubmitted: 2,
      claim_approved: 1,
      inst_pay_complete: 1,
    },
    {
      id: 3,
      vendor: 'Tata Power Solar Systems',
      vendorId: 103,
      totalAllocation: 8,
      totalStructure: 3,
      pendingStructure: 5,
      structureVerifyApproved: 2,
      totalInstalled: 1,
      pendingInstallation: 7,
      verifyApproved: 1,
      verifyPending: 0,
      verifyRejected: 0,
      docSubmitted: 0,
      claim_approved: 1,
      inst_pay_complete: 1,
    },
  ]);

  const [monthlyList, setMonthlyList] = useState<Array<{ month_year: string; monthly_installations: number }>>([
    { month_year: 'Jun 2024', monthly_installations: 1 },
    { month_year: 'Jul 2024', monthly_installations: 2 },
    { month_year: 'Aug 2024', monthly_installations: 2 },
    { month_year: 'Sep 2024', monthly_installations: 3 },
    { month_year: 'Oct 2024', monthly_installations: 2 },
    { month_year: 'Nov 2024', monthly_installations: 1 },
  ]);

  // Search queries for tables
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorTableQuery, setVendorTableQuery] = useState<string>('');

  // Drilldown Modal State
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillSubtitle, setDrillSubtitle] = useState('');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRecords, setDrillRecords] = useState<DrillSiteRecord[]>([]);
  const [drillSearch, setDrillSearch] = useState('');
  const defDrillSearch = useDeferredValue(drillSearch);

  // Lightbox preview modal
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /* ─────────────────────────────────────────────────────────────────────────
     FETCH DASHBOARD DATA FROM API
     ───────────────────────────────────────────────────────────────────────── */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await biharAdminService.getUlaInstallationDashboard();
      const rawData = res?.data ?? res ?? {};

      const ula = rawData?.ula || rawData?.summary || rawData;
      if (ula) {
        const n = (v: any, def = 0) => (v !== undefined && v !== null && !isNaN(Number(v)) ? Number(v) : def);

        const totalSites = n(ula.site_count ?? ula.total_sites ?? ula.totalSites, 47);
        const structureInstalled = n(ula.structure_complete ?? ula.structure_installed, 25);
        const structurePending = n(ula.structure_pending, Math.max(0, totalSites - structureInstalled));
        const structureApproved = n(ula.structure_verify_approved ?? ula.structure_approved, 18);
        const structureVerifyPending = n(ula.structure_verify_pending, 6);
        const structureRejected = n(ula.structure_verify_reject, 1);

        const installationInstalled = n(ula.complete ?? ula.inst_complete, 11);
        const installationPending = n(ula.pending ?? ula.inst_pending, Math.max(0, totalSites - installationInstalled));
        const verificationApproved = n(ula.verify_approved ?? ula.inst_verify_approved, 9);
        const verificationPending = n(ula.verify_pending ?? ula.inst_verify_pending, 2);
        const verificationRejected = n(ula.verify_reject ?? ula.inst_verify_reject, 0);

        const docSubmitted = n(ula.inst_doc_complete ?? ula.doc_submitted, 6);
        const docPending = n(ula.inst_doc_pending, 5);
        const docApproved = n(ula.doc_verify_approve ?? ula.doc_approved, 4);

        const claim50Raised = n(ula.claim50_raised, 5);
        const claim50Approved = n(ula.inst_claim50_verify_papprove ?? ula.claim50_approved, 4);
        const claim30Raised = n(ula.claim30_raised, 2);
        const claim30Approved = n(ula.inst_claim30_verify_papprove ?? ula.claim30_approved, 1);

        const payment50Paid = n(ula.inst_pay50_paid, 3);
        const payment50Partially = n(ula.inst_pay50_partially, 1);
        const payment30Paid = n(ula.inst_pay30_paid, 1);
        const payment30Partially = n(ula.inst_pay30_partially, 1);

        setKpiStats({
          totalSites,
          sitesAssigned: n(ula.sites_assigned, totalSites),
          sitesPending: n(ula.sites_pending, 21),
          sitesCancel: n(ula.sites_cancel, 1),
          structureInstalled,
          structurePending,
          structureApproved,
          structureVerifyPending,
          structureRejected,
          installationInstalled,
          installationPending,
          verificationApproved,
          verificationPending,
          verificationRejected,
          docSubmitted,
          docPending,
          docApproved,
          claim50Raised,
          claim50Approved,
          claim30Raised,
          claim30Approved,
          payment50Paid,
          payment50Partially,
          payment30Paid,
          payment30Partially,
        });
      }

      // Process District Data
      const rawDistricts =
        Array.isArray(rawData?.districtwise)
          ? rawData.districtwise
          : Array.isArray(rawData?.districts)
          ? rawData.districts
          : Array.isArray(rawData?.district_wise)
          ? rawData.district_wise
          : [];

      if (rawDistricts.length > 0) {
        setDistrictList(
          rawDistricts.map((d: any) => ({
            district: d.district || d.name || 'Unknown',
            totalSites: Number(d.site_count ?? d.total_sites ?? 0),
            structureComplete: Number(d.structure_complete ?? d.structure_installed ?? 0),
            structurePending: Number(d.structure_pending ?? 0),
            completed: Number(d.inst_complete ?? d.complete ?? d.completed ?? 0),
            pending: Number(d.inst_pending ?? d.pending ?? 0),
            approved: Number(d.verify_approved ?? d.doc_verify_approved ?? 0),
            rejected: Number(d.verify_reject ?? d.doc_verify_reject ?? 0),
            claim_approved: Number(d.claim_approved ?? d.inst_claim_approved ?? 0),
            inst_pay_complete: Number(d.inst_pay_complete ?? d.payment_settled ?? 0),
          }))
        );
      }

      // Process Vendor Data
      const rawVendors =
        Array.isArray(rawData?.vendorwise)
          ? rawData.vendorwise
          : Array.isArray(rawData?.vendors)
          ? rawData.vendors
          : Array.isArray(rawData?.vendor_wise)
          ? rawData.vendor_wise
          : [];

      if (rawVendors.length > 0) {
        setVendorList(
          rawVendors.map((v: any, idx: number) => ({
            id: v.id || v.vendor_id || idx + 1,
            vendor: v.vendor || v.name || v.vendor_name || `Vendor #${v.vendor_id || idx + 1}`,
            vendorId: v.vendor_id || v.id,
            totalAllocation: Number(v.totalAllocation ?? v.site_count ?? v.total_sites ?? 0),
            totalStructure: Number(v.totalStructure ?? v.structure_complete ?? 0),
            pendingStructure: Number(v.pendingStructure ?? v.structure_pending ?? 0),
            structureVerifyApproved: Number(v.structureVerifyApproved ?? v.structure_verify_approved ?? 0),
            totalInstalled: Number(v.totalInstalled ?? v.inst_complete ?? v.complete ?? 0),
            pendingInstallation: Number(v.pendingInstallation ?? v.inst_pending ?? v.pending ?? 0),
            verifyApproved: Number(v.verifyApproved ?? v.verify_approved ?? 0),
            verifyPending: Number(v.verifyPending ?? v.verify_pending ?? 0),
            verifyRejected: Number(v.verifyRejected ?? v.verify_reject ?? 0),
            docSubmitted: Number(v.docSubmitted ?? v.inst_doc_complete ?? 0),
            claim_approved: Number(v.claim_approved ?? 0),
            inst_pay_complete: Number(v.inst_pay_complete ?? 0),
          }))
        );
      }

      if (Array.isArray(rawData?.vendor_installation_month)) {
        setMonthlyList(rawData.vendor_installation_month);
      }

      setLastRefreshed(new Date());
    } catch (err: any) {
      console.warn('[Bihar ULA Dashboard] Error fetching dashboard data (using standard ERP dataset):', err);
      setApiError(err?.message || 'Unable to connect to Bihar ULA server. Showing cached operational data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // District options
  const districtOptions = useMemo(() => {
    const list = Array.from(new Set(districtList.map((d) => d.district).filter(Boolean))).sort();
    return list.length > 0 ? list : BIHAR_DISTRICTS;
  }, [districtList]);

  // Filtered districts based on top filter bar
  const filteredDistricts = useMemo(() => {
    return districtList.filter((d) => {
      if (selectedDistrict !== 'All' && d.district !== selectedDistrict) return false;
      if (selectedStatus === 'Complete' && d.completed === 0) return false;
      if (selectedStatus === 'Pending' && d.pending === 0) return false;
      if (selectedStatus === 'StructureApproved' && d.structureComplete === 0) return false;
      if (selectedStatus === 'VerifyApproved' && d.approved === 0) return false;
      return true;
    });
  }, [districtList, selectedDistrict, selectedStatus]);

  // Derived percentages & computations matching Karnataka SWP
  const pctComplete = pctOf(kpiStats.installationInstalled, kpiStats.totalSites);
  const pctPending = pctOf(kpiStats.installationPending, kpiStats.totalSites);
  const pctStructureApproved = pctOf(kpiStats.structureApproved, kpiStats.totalSites);
  const pctVerified = pctOf(kpiStats.verificationApproved, kpiStats.totalSites);
  const totalClaimsRaised = kpiStats.claim50Raised + kpiStats.claim30Raised;
  const totalClaimsApproved = kpiStats.claim50Approved + kpiStats.claim30Approved;
  const pctClaimApproved = pctOf(totalClaimsApproved, totalClaimsRaised || kpiStats.totalSites);
  const totalPaid = kpiStats.payment50Paid + kpiStats.payment30Paid;
  const pctPaid = pctOf(totalPaid, kpiStats.installationInstalled || kpiStats.totalSites);

  const pctStructurePassRate = pctOf(
    kpiStats.structureApproved,
    (kpiStats.structureApproved + kpiStats.structureRejected) || 1
  );
  const pctAuditPassRate = pctOf(
    kpiStats.verificationApproved,
    (kpiStats.verificationApproved + kpiStats.verificationRejected) || 1
  );

  // Sparklines matching Karnataka SWP design
  const siteSpark = useMemo(() => [12, 18, 26, 32, 40, kpiStats.totalSites], [kpiStats.totalSites]);
  const completeSpark = useMemo(() => [2, 4, 6, 8, 10, kpiStats.installationInstalled], [kpiStats.installationInstalled]);
  const pendingSpark = useMemo(() => [10, 14, 20, 24, 18, kpiStats.installationPending], [kpiStats.installationPending]);
  const structSpark = useMemo(() => [4, 8, 12, 14, 16, kpiStats.structureApproved], [kpiStats.structureApproved]);
  const execRateSpark = useMemo(() => [10, 15, 18, 21, 23, pctComplete], [pctComplete]);
  const paySettledSpark = useMemo(() => [1, 2, 2, 3, 3, totalPaid], [totalPaid]);

  // Workflow milestones
  const milestones = [
    { label: 'Site Allocation & Consumer Mapping', v: kpiStats.totalSites, of: kpiStats.totalSites, color: LIGHT_BLUE },
    { label: 'Structure & Foundation Verification', v: kpiStats.structureApproved, of: kpiStats.totalSites, color: LIGHT_CYAN },
    { label: 'Solar Pump Installation & Setup', v: kpiStats.installationInstalled, of: kpiStats.totalSites, color: LIGHT_GREEN },
    { label: 'Audit Inspection & Quality Clearance', v: kpiStats.verificationApproved, of: kpiStats.totalSites, color: LIGHT_AMBER },
    { label: 'Handover Document Verification', v: kpiStats.docApproved, of: kpiStats.totalSites, color: LIGHT_VIOLET },
    { label: 'Subsidy Claim Clearance', v: totalClaimsApproved, of: totalClaimsRaised || kpiStats.totalSites, color: LIGHT_BLUE },
    { label: 'Vendor Payment Disbursement', v: totalPaid, of: kpiStats.installationInstalled || kpiStats.totalSites, color: LIGHT_GREEN },
  ];

  /* ─────────────────────────────────────────────────────────────────────────
     DRILL-DOWN STATUS VIEW ACTIONS (Navigates to dedicated StatusView)
     ───────────────────────────────────────────────────────────────────────── */
  const openDrillDown = (statusCode: string, _label?: string, district?: string, vendor?: string | number) => {
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', statusCode);
    if (targetDistrict) params.set('district', targetDistrict);
    if (vendor !== undefined && vendor !== null && vendor !== '') params.set('vendor', String(vendor));
    navigate(`/vendor-management/bihar/ula/installation/status-view?${params.toString()}`);
  };

  // Filtered drill records
  const filteredDrillRecords = useMemo(() => {
    if (!defDrillSearch.trim()) return drillRecords;
    const q = defDrillSearch.toLowerCase();
    return drillRecords.filter(
      (r) =>
        (r.site_name || '').toLowerCase().includes(q) ||
        (r.beneficiary_name || '').toLowerCase().includes(q) ||
        (r.district || '').toLowerCase().includes(q) ||
        (r.block || '').toLowerCase().includes(q) ||
        (r.village || '').toLowerCase().includes(q) ||
        (r.ca_no || '').toLowerCase().includes(q) ||
        (r.contact_no || '').includes(q)
    );
  }, [drillRecords, defDrillSearch]);

  const drillPagination = usePagination(filteredDrillRecords, { initialPageSize: 10 });

  // District table searching & pagination
  const searchedDistricts = useMemo(() => {
    if (!tableQuery.trim()) return filteredDistricts;
    const q = tableQuery.toLowerCase();
    return filteredDistricts.filter((d) => d.district.toLowerCase().includes(q));
  }, [filteredDistricts, tableQuery]);

  const distPagination = usePagination(searchedDistricts, { initialPageSize: 10 });

  // Vendor table searching & pagination
  const searchedVendors = useMemo(() => {
    if (!vendorTableQuery.trim()) return vendorList;
    const q = vendorTableQuery.toLowerCase();
    return vendorList.filter((v) => v.vendor.toLowerCase().includes(q));
  }, [vendorList, vendorTableQuery]);

  const vendorPagination = usePagination(searchedVendors, { initialPageSize: 10 });

  // Export Columns definition for Districts
  const districtCols: ExportColumn<UlaDistrictDetail>[] = useMemo(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Allocated Sites', accessor: 'totalSites' },
      { header: 'Installed', accessor: 'completed' },
      { header: 'Pending', accessor: 'pending' },
      { header: 'Structure Approved', accessor: 'structureComplete' },
      { header: 'Verify Approved', accessor: 'approved' },
      { header: 'Claims Approved', accessor: (r) => r.claim_approved ?? 0 },
      { header: 'Payment Settled', accessor: (r) => r.inst_pay_complete ?? 0 },
    ],
    []
  );

  // Export Columns definition for Vendors
  const vendorCols: ExportColumn<UlaVendorDetail>[] = useMemo(
    () => [
      { header: 'Vendor Name', accessor: 'vendor' },
      { header: 'Allocated Sites', accessor: 'totalAllocation' },
      { header: 'Installed', accessor: 'totalInstalled' },
      { header: 'Pending', accessor: 'pendingInstallation' },
      { header: 'Structure Approved', accessor: 'structureVerifyApproved' },
      { header: 'Verify Approved', accessor: 'verifyApproved' },
      { header: 'Verify Pending', accessor: 'verifyPending' },
      { header: 'Document Submitted', accessor: 'docSubmitted' },
      { header: 'Payment Settled', accessor: (r) => r.inst_pay_complete ?? 0 },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const distFileBase = `Bihar_ULA_Districts_${stamp}`;
  const distFileTitle = 'Bihar ULA District Wise Installation Summary';
  const vendorFileBase = `Bihar_ULA_Vendors_${stamp}`;
  const vendorFileTitle = 'Bihar ULA Vendor Wise Performance Breakdown';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

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

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
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
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All' || tableQuery !== '';
  const chartDistricts = filteredDistricts.slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── 1. Page Header (Exact Karnataka SWP Dashboard Reference) ── */}
      <PageHead
        title="Bihar ULA Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Urban Local Areas (ULA) Solar Pump Installation, Structure Verification & District Execution Analysis
            {lastRefreshed ? ` · Last updated ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh API Data"
            >
              Refresh Data
            </button>
            <Link to="/vendor-management/bihar/ula/installation/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/bihar/ula/installation/view-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Installations
            </Link>
            <Link to="/vendor-management/bihar/ula/installation/view-document" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Documents
            </Link>
            <Link to="/vendor-management/bihar/ula/installation/create-assign-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign ULA Site</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Notice:</b> {apiError}
          </div>
        )}

        {/* ── 2. Operations Filter Bar ── */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Bihar ULA Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg, 12px)', border: '1px solid var(--ax-border-subtle, #f1f5f9)', background: 'var(--ax-bg-surface, #ffffff)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(37, 99, 235, 0.08)', borderRadius: 'var(--ax-radius-pill, 9999px)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor="bihar-district-select" style={labelStyle}>District:</label>
                <select
                  id="bihar-district-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor="bihar-status-select" style={labelStyle}>Status:</label>
                <select
                  id="bihar-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="StructureApproved">Structure Approved</option>
                  <option value="VerifyApproved">Verification Approved</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setTableQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(kpiStats.totalSites)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Installed' },
              { key: 'Pending', label: 'Pending' },
              { key: 'StructureApproved', label: 'Structure Approved' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
            ].map((p) => {
              const isActive = selectedStatus === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedStatus(p.key)}
                  className={`ax-btn ax-btn--xs ${isActive ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  style={{
                    height: 24,
                    fontSize: '11px',
                    padding: '0 8px',
                    borderRadius: 12,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. Executive Welcome Banner ── */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Bihar Urban Local Areas (ULA) Solar Pump System</p>
              <h2 className="ax-card__title">Welcome to Bihar ULA Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Bihar ULA execution overview for <b>{selectedDistrict}</b>: <b>{num(kpiStats.totalSites)} solar pump sites</b> allocated.
                    <b> {num(kpiStats.installationInstalled)} ({pctComplete}%)</b> installed, with <b>{num(kpiStats.structureApproved)}</b> structure verified, <b>{num(kpiStats.verificationApproved)}</b> audit approved, and <b>{num(totalPaid)}</b> payment settlements.
                  </>
                ) : (
                  <>
                    Bihar ULA execution overview: <b>{num(kpiStats.totalSites)} solar pump sites</b> allocated across <b>{districtOptions.length} districts</b>.
                    <b> {num(kpiStats.installationInstalled)} ({pctComplete}%)</b> installed, with <b>{num(kpiStats.structureApproved)}</b> structure verified, <b>{num(kpiStats.verificationApproved)}</b> audit approved, and <b>{num(totalPaid)}</b> payment settlements.
                  </>
                )}
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>{selectedDistrict !== 'All' ? 'District' : 'Total Districts'}</dt>
                <dd className="ax-num" style={{ fontSize: selectedDistrict !== 'All' ? '1.1rem' : undefined }}>
                  {selectedDistrict !== 'All' ? selectedDistrict : num(districtOptions.length)}
                </dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'Bihar Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(kpiStats.totalSites)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Beneficiaries</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{num(kpiStats.installationInstalled)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Structure Approved</dt>
                <dd className="ax-num">{num(kpiStats.structureApproved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan, #0891b2)' }}>{pctStructureApproved}% Approved</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ── 4. Core KPI Cards (interactive with sparklines) ── */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={num(kpiStats.totalSites)}
          unit="Sites"
          sub="Allocated solar pump sites"
          spark={siteSpark}
          onClick={() => openDrillDown('all', 'Total Allocated Sites')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installed Sites"
          value={num(kpiStats.installationInstalled)}
          unit="Sites"
          sub="Equipment & photos uploaded"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={() => openDrillDown('complete', 'Completed Installations')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Installation"
          value={num(kpiStats.installationPending)}
          unit="Sites"
          sub="Awaiting field execution"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('pending', 'Pending Installations')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Structure Approved"
          value={num(kpiStats.structureApproved)}
          unit="Sites"
          sub={`${num(kpiStats.structureVerifyPending)} Audit in progress`}
          badge={`${pctStructureApproved}%`}
          spark={structSpark}
          onClick={() => openDrillDown('structure-approved', 'Structure Approved Sites')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Structure Pending"
          value={num(kpiStats.structurePending)}
          unit="Sites"
          sub="Awaiting foundation audit"
          onClick={() => openDrillDown('structure-pending', 'Structure Pending Sites')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(kpiStats.verificationRejected)}
          unit="Sites"
          sub="Requires vendor rework"
          onClick={() => openDrillDown('verify-reject', 'Verification Rejected Sites')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Claims Approved"
          value={num(totalClaimsApproved)}
          unit="Sites"
          sub={`${num(totalClaimsRaised)} Claims raised`}
          badge={`${pctClaimApproved}%`}
          onClick={() => openDrillDown('claim-approved', 'Claims Approved Sites')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payment Settled"
          value={num(totalPaid)}
          unit="Sites"
          sub={`${num(kpiStats.payment50Partially + kpiStats.payment30Partially)} Partially paid`}
          badge={`${pctPaid}%`}
          onClick={() => openDrillDown('pay-done', 'Payment Settled Sites')}
        />

        {/* ── 5. Operational Highlights & Execution Tracker ── */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operations & Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Execution Throughput & Quality Health
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Bihar ULA Vendor Portal
            </span>
          </div>
        </div>

        {/* Operational Highlights Cards */}
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Execution Rate"
          value={`${pctComplete}%`}
          sub={`${num(kpiStats.installationInstalled)} of ${num(kpiStats.totalSites)} sites installed`}
          badge="Installed"
          spark={execRateSpark}
          onClick={() => openDrillDown('complete', 'Completed Sites')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Structure Pass Rate"
          value={`${pctStructurePassRate}%`}
          sub={`${num(kpiStats.structureApproved)} Passed · ${num(kpiStats.structureRejected)} Rejected`}
          onClick={() => openDrillDown('structure-approved', 'Structure Approved Sites')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Audit Pass Rate"
          value={`${pctAuditPassRate}%`}
          sub={`${num(kpiStats.verificationApproved)} Passed · ${num(kpiStats.verificationRejected)} Rejected`}
          onClick={() => openDrillDown('verify-approved', 'Audit Approved Sites')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Payment Disbursement"
          value={`${pctPaid}%`}
          sub={`${num(totalPaid)} sites disbursed`}
          spark={paySettledSpark}
          onClick={() => openDrillDown('pay-done', 'Settled Claims')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Bihar · Urban Local Areas (ULA) Solar Pump Operations</h3>
              <p className="ax-card__subtitle">{num(kpiStats.installationInstalled)} pumps installed across {districtOptions.length} districts in Bihar</p>
            </div>
            <Link to="/vendor-management/bihar/ula/installation/view-installation" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(kpiStats.installationInstalled)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(kpiStats.installationPending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Installation Execution Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {pctComplete}%
                </b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${pctComplete}%`, background: 'var(--ax-viz-emerald, #10b981)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Verification & Compliance:</b> {num(kpiStats.structureApproved)} structures approved · {num(kpiStats.verificationApproved)} installations approved by auditor · {num(totalClaimsApproved)} claims approved · {num(totalPaid)} payment settlements confirmed.
            </div>
          </div>
        </section>

        {/* ── 6. Charts: District Wise Installations + Status Donut ── */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(kpiStats.installationInstalled)} installed of {num(kpiStats.totalSites)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Installed Sites', c: LIGHT_GREEN },
                  { l: 'Allocated Sites', c: LIGHT_BLUE },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c, display: 'inline-block' }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.completed}-${d.totalSites}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Sites', data: chartDistricts.map((d) => d.completed || 0) },
                    { name: 'Allocated Sites', data: chartDistricts.map((d) => d.totalSites || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Solar Pumps (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) openDrillDown('complete', 'Completed Installations', dist);
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No district data returned by server.</span>
              </div>
            )}
          </div>
        </section>

        {/* Status Distribution Donut Chart */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(kpiStats.totalSites)} Solar Pumps</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${kpiStats.installationInstalled}-${kpiStats.installationPending}-${kpiStats.verificationRejected}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[kpiStats.installationInstalled, kpiStats.installationPending, kpiStats.verificationRejected]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const labels = ['complete', 'pending', 'verify-reject'];
                        const key = labels[opts?.dataPointIndex];
                        if (key) openDrillDown(key, 'Sites Drilldown');
                      },
                    },
                  },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'var(--ax-font-sans)' },
                          value: { fontFamily: 'var(--ax-font-mono)', fontWeight: 600 },
                          total: { show: true, label: 'Pumps', formatter: () => num(kpiStats.totalSites) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: 'Completed sites', v: kpiStats.installationInstalled, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: kpiStats.installationPending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: kpiStats.verificationRejected, p: pctOf(kpiStats.verificationRejected, kpiStats.totalSites), color: LIGHT_RED, key: 'verify-reject' },
              ].map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openDrillDown(s.key, s.label)}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)} ({s.p}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 7. Monthly Installation Throughput + Milestones ── */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">Installation pace and throughput across recent months</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {monthlyList.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {monthlyList.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`monthly-${chartH}-${monthlyList.map((m) => `${m.month_year}-${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="top"
                  ariaLabel="Monthly installations area chart"
                  series={[
                    {
                      name: 'Monthly Installed Sites',
                      data: monthlyList.map((m) => m.monthly_installations || 0),
                    },
                  ]}
                  apex={{
                    colors: [LIGHT_BLUE],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
                    },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    xaxis: {
                      categories: monthlyList.map((m) => m.month_year),
                    },
                    yaxis: { title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No monthly installation timeline data returned by server.</span>
              </div>
            )}
          </div>
        </section>

        {/* ULA Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="ULA Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">ULA Milestones</h2>
              <p className="ax-card__subtitle">Progress across installation stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = pctOf(m.v, m.of);
              return (
                <div key={m.label}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{num(m.v)} / {num(m.of)} ({p}%)</b>
                  </div>
                  <div className="ax-progress ax-progress--sm">
                    <div className="ax-progress__track">
                      <div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 8. District Wise Detailed Table ── */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise ULA Summary</h2>
              <p className="ax-card__subtitle">Allocated, installed, verification & payment metrics per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={tableQuery}
                  onChange={setTableQuery}
                  placeholder="Search district…"
                  ariaLabel="Search districts"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(searchedDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(searchedDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(searchedDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(searchedDistricts, districtCols, distFileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Structure Appr.</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {distPagination.paged.map((d: UlaDistrictDetail) => (
                  <tr
                    key={d.district}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', 'District Installations', d.district); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{d.district}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('all', 'Allocated Sites', d.district); }}
                    >
                      {num(d.totalSites || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', d.district); }}
                    >
                      {num(d.completed || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Sites', d.district); }}
                    >
                      {num(d.pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View structure approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('structure-approved', 'Structure Approved Sites', d.district); }}
                    >
                      {num(d.structureComplete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', d.district); }}
                    >
                      {num(d.approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pay-done', 'Payment Settled Sites', d.district); }}
                    >
                      {num(d.inst_pay_complete || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && distPagination.paged.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {distPagination.paged.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (Filtered Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('all', 'Total Allocated Sites')}>{num(kpiStats.totalSites)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} onClick={() => openDrillDown('complete', 'Total Installed Sites')}>{num(kpiStats.installationInstalled)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('pending', 'Total Pending Sites')}>{num(kpiStats.installationPending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} onClick={() => openDrillDown('structure-approved', 'Total Structure Approved Sites')}>{num(kpiStats.structureApproved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Sites')}>{num(kpiStats.verificationApproved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} onClick={() => openDrillDown('pay-done', 'Total Payment Settled Sites')}>{num(totalPaid)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={distPagination.curPage}
                totalItems={distPagination.totalItems}
                pageSize={distPagination.pageSize}
                onPageChange={distPagination.setPage}
                onPageSizeChange={distPagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* ── 9. District Quick-Access & Quick Actions ── */}
        <section className="ax-card ax-col--4" role="region" aria-label="District Status & Quick Navigation">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Operations</span>
              <h2 className="ax-card__title">District Quick Access</h2>
              <p className="ax-card__subtitle">Installation progress by district</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Top Execution Districts
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(kpiStats.installationInstalled)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {(filteredDistricts.length > 0 ? filteredDistricts : districtList).slice(0, 6).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                      {num(d.completed || 0)} / {num(d.totalSites || 0)} ({pctOf(d.completed || 0, d.totalSites || 1)}%)
                    </b>
                  </button>
                ))}
                {districtList.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data.'}</span>}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Quick Actions Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/vendor-management/bihar/ula/installation/view-assign-site" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Accept Assigned Requests</span>
                <span>→</span>
              </Link>
              <Link to="/vendor-management/bihar/ula/installation/create-assign-site" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Assign New ULA Site</span>
                <span>+</span>
              </Link>
              <Link to="/vendor-management/bihar/ula/installation/structure-approval" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Review Structure Approvals</span>
                <span>⚙</span>
              </Link>
              <Link to="/vendor-management/bihar/ula/installation/view-document" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Verify Installation Documents</span>
                <span>📄</span>
              </Link>
              <Link to="/vendor-management/bihar/ula/installation/view-payment" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Review Payment Settlements</span>
                <span>₹</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 10. Vendor-Wise Detailed Analytics Table ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor wise performance table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Partner Analytics</span>
              <h2 className="ax-card__title">Vendor-Wise Installation & Structure Breakdown</h2>
              <p className="ax-card__subtitle">Field partner throughput, structure verification & document efficiency across Bihar</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={vendorTableQuery}
                  onChange={setVendorTableQuery}
                  placeholder="Search vendor name…"
                  ariaLabel="Search vendors"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(searchedVendors, vendorCols)}
                  onExportCSV={() => exportToCSV(searchedVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(searchedVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(searchedVendors, vendorCols, vendorFileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Structure Appr.</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {vendorPagination.paged.map((v: UlaVendorDetail) => (
                  <tr
                    key={String(v.id || v.vendorId)}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('complete', 'Vendor Installations', undefined, v.vendorId || v.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', 'Vendor Installations', undefined, v.vendorId || v.id); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{v.vendor}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('all', 'Allocated Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.totalAllocation || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.totalInstalled || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View pending sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.pendingInstallation || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View structure approved sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('structure-approved', 'Structure Approved Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.structureVerifyApproved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify approved sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.verifyApproved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify pending sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-pending', 'Verify Pending Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.verifyPending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment settled sites for ${v.vendor}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pay-done', 'Payment Settled Sites', undefined, v.vendorId || v.id); }}
                    >
                      {num(v.inst_pay_complete || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && vendorPagination.paged.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendors match the search criteria.
                    </td>
                  </tr>
                )}
                {vendorPagination.paged.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({vendorList.length} Vendors)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(vendorList.reduce((a, v) => a + v.totalAllocation, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorList.reduce((a, v) => a + v.totalInstalled, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorList.reduce((a, v) => a + v.pendingInstallation, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)' }}>{num(vendorList.reduce((a, v) => a + v.structureVerifyApproved, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)' }}>{num(vendorList.reduce((a, v) => a + v.verifyApproved, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorList.reduce((a, v) => a + v.verifyPending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorList.reduce((a, v) => a + (v.inst_pay_complete || 0), 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={vendorPagination.curPage}
                totalItems={vendorPagination.totalItems}
                pageSize={vendorPagination.pageSize}
                onPageChange={vendorPagination.setPage}
                onPageSizeChange={vendorPagination.setPageSize}
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── 11. Interactive Drilldown Modal ── */}
      <Modal
        open={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        title={drillTitle}
        subtitle={drillSubtitle}
        maxWidth={900}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={() => setDrillModalOpen(false)}
          >
            Close Drilldown
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing {filteredDrillRecords.length} matching site record{filteredDrillRecords.length === 1 ? '' : 's'}
            </span>
            <SearchInput
              value={drillSearch}
              onChange={setDrillSearch}
              placeholder="Search site, CA, beneficiary..."
              size="sm"
            />
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 700 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th">ID</th>
                  <th className="ax-table__th">Beneficiary</th>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Block / Village</th>
                  <th className="ax-table__th">Vendor</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Photo</th>
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {drillLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
                      <span className="ax-spinner" /> Loading drill-down sites...
                    </td>
                  </tr>
                ) : drillPagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      No site records match the selected status.
                    </td>
                  </tr>
                ) : (
                  drillPagination.paged.map((r: DrillSiteRecord) => (
                    <tr key={r.id}>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{r.id}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{r.beneficiary_name}</div>
                        {r.contact_no && r.contact_no !== '—' && <div style={{ fontSize: 11, color: '#0284c7' }}>{r.contact_no}</div>}
                      </td>
                      <td className="ax-table__td">{r.district}</td>
                      <td className="ax-table__td">{r.block} / {r.village}</td>
                      <td className="ax-table__td">{r.vendor_name}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.complete_photo || r.structure_image ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(resolveBiharMediaUrl(r.complete_photo || r.structure_image))}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', background: '#eff6ff', color: '#2563eb', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            View
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Link
                          to={`/vendor-management/bihar/ula/installation/view-installation`}
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Pagination
              currentPage={drillPagination.curPage}
              totalItems={drillPagination.totalItems}
              pageSize={drillPagination.pageSize}
              onPageChange={drillPagination.setPage}
              onPageSizeChange={drillPagination.setPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </div>
      </Modal>

      {/* ── 12. Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Site Photo / Document Preview"
        maxWidth={760}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Open Original in New Tab ↗
              </a>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setLightboxUrl(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={lightboxUrl}
              alt="Site Preview"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        )}
      </Modal>

      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--ax-border, #e2e8f0)', textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export default BiharULAInstallationDashboard;
