<<<<<<< HEAD
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, type ReactNode } from 'react';
=======
<<<<<<< HEAD
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, type ReactNode } from 'react';
=======
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
<<<<<<< HEAD
import {
  assamSwpService,
  resolveAssamMediaUrl,
  normalizeAssamDashboardStatus,
=======
<<<<<<< HEAD
import {
  assamSwpService,
  resolveAssamMediaUrl,
  normalizeAssamDashboardStatus,
=======
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  assamSwpService,
  resolveAssamMediaUrl,
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  type AssamSwpDashboardResponse,
  type DistrictWiseDetail,
  type InstalledSiteItem,
  type DistrictInstallItem,
  type DistrictMonthItem,
} from '../../assam-services';

// Code-split ApexCharts so Assam SWP Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching DLE & Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number) => x.toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// Responsive chart height hook matching DleDashboard
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

/* ───────── Responsive page CSS (Exact DLE Dashboard & Solar ERP reference, all columns scrollable) ───────── */
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

  /* Filter bar matching DleDashboard */
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: var(--ax-surface-solid, #fff);
    border-radius: var(--ax-radius-lg, 12px); border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); overflow: hidden;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    border: none; background: transparent; cursor: pointer; padding: 4px;
    border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted);
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong); }
  .ax-modal__body { padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 12px 20px; border-top: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
/* ───────── SVG Icons matching DLE & Solar ERP design language ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
<<<<<<< HEAD

=======
<<<<<<< HEAD


=======
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
/* ───────── KPI card Component matching DLE Dashboard ───────── */
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
  const allZeros = hasSpark && spark.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

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
                  key={`${label}-${safeSpark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: safeSpark! }]}
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

<<<<<<< HEAD

=======
<<<<<<< HEAD

=======
/* ───────── Accessible Modal Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 920,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
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
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

export function AssamDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AssamSwpDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  // ── Status Drill-down Modal State (APIs 15 & 16) ──
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillSubtitle, setDrillSubtitle] = useState('');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [drillSites, setDrillSites] = useState<InstalledSiteItem[]>([]);
  const [drillSearch, setDrillSearch] = useState('');

  // Image Zoom Modal
  const [zoomModal, setZoomModal] = useState<{ url: string; title: string } | null>(null);

>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Load Dashboard Data (API 14)
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await assamSwpService.getDashboardData();
      setData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Assam Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

<<<<<<< HEAD
  // ── Status Drill-down Navigation (APIs 15 & 16 Common Page) ──
  const openDrillDown = (statusKey: string, _label?: string, district?: string) => {
    const normalizedStatus = normalizeAssamDashboardStatus(statusKey);
=======
<<<<<<< HEAD
  // ── Status Drill-down Navigation (APIs 15 & 16 Common Page) ──
  const openDrillDown = (statusKey: string, _label?: string, district?: string) => {
    const normalizedStatus = normalizeAssamDashboardStatus(statusKey);
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', normalizedStatus);
    if (targetDistrict) {
      params.set('district', targetDistrict);
    }
    navigate(`/v/assam/installation/swp/status-view?${params.toString()}`);
  };

  // Safe destructuring of API 14 data
  const swp = useMemo(() => data?.swp || {
    site_count: 0,
    complete: 0,
    pending: 0,
    verify_pending: 0,
    verify_approved: 0,
    verify_reject: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
    inst_claim_raised: 0,
    inst_claim_approved: 0,
    inst_claim_reject: 0,
    inst_pay_complete: 0,
    inst_pay_partially: 0,
    inst_pay_pending: 0,
  }, [data]);

=======
  // Open Drill-Down Modal (calling API 15 or API 16)
  const openDrillDown = async (statusKey: string, label: string, district?: string) => {
    setDrillModalOpen(true);
    setDrillLoading(true);
    setDrillError(null);
    setDrillSites([]);
    setDrillSearch('');

>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', normalizedStatus);
    if (targetDistrict) {
      params.set('district', targetDistrict);
    }
    navigate(`/v/assam/installation/swp/status-view?${params.toString()}`);
  };

  // Safe destructuring of API 14 data
  const swp = useMemo(() => data?.swp || {
    site_count: 0,
    complete: 0,
    pending: 0,
    verify_pending: 0,
    verify_approved: 0,
    verify_reject: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
    inst_claim_raised: 0,
    inst_claim_approved: 0,
    inst_claim_reject: 0,
    inst_pay_complete: 0,
    inst_pay_partially: 0,
    inst_pay_pending: 0,
  }, [data]);

>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
  const districtwise: DistrictWiseDetail[] = useMemo(() => data?.districtwise || [], [data]);
  const monthlyInstallations: DistrictMonthItem[] = useMemo(
    () => data?.district_installation_month || data?.monthly_installations || [],
    [data]
  );

  // District options for filter
  const districtOptions = useMemo(
    () => [...new Set(districtwise.map((d) => d.district))].sort(),
    [districtwise]
  );

  // Filtered district rows
  const filteredDistricts = useMemo(() => {
    return districtwise.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = (d.complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'DocApproved') matchStatus = (d.doc_approved || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Table search & pagination matching DLE Dashboard
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter(
      (d) => !q || d.district.toLowerCase().includes(q)
    );
  }, [filteredDistricts, deferredQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => {
    setPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus, setPage]);

  // Percentages & Rates
  const pctComplete = pctOf(swp.complete, swp.site_count);
  const pctPending = pctOf(swp.pending, swp.site_count);
  const pctVerified = pctOf(swp.verify_approved, swp.complete || 1);
  const pctDocApproved = pctOf(swp.doc_approved, swp.complete || 1);
  const pctPaid = pctOf(swp.inst_pay_complete, swp.complete || 1);

  // Milestones list matching DLE Dashboard
  const milestones = [
    { label: '1. Allocated Solar Pump Sites', v: swp.site_count, of: swp.site_count || 1, color: LIGHT_BLUE },
    { label: '2. Equipment Installed & Photos', v: swp.complete, of: swp.site_count || 1, color: LIGHT_GREEN },
    { label: '3. Field Verification Approved', v: swp.verify_approved, of: swp.complete || swp.site_count || 1, color: LIGHT_CYAN },
    { label: '4. Compliance Documents Approved', v: swp.doc_approved, of: swp.complete || swp.site_count || 1, color: LIGHT_VIOLET },
    { label: '5. Payment Disbursement Settled', v: swp.inst_pay_complete, of: swp.complete || swp.site_count || 1, color: LIGHT_AMBER },
  ];

  // Top 15 districts for bar chart
  const chartDistricts = useMemo(
    () => [...districtwise].sort((a, b) => (b.complete || 0) - (a.complete || 0)).slice(0, 15),
    [districtwise]
  );

  // Sparklines datasets
  const siteSpark = districtwise.length > 1 ? districtwise.slice(0, 10).map((d) => d.site_count) : [5, 12, 18, 24, 30];
  const completeSpark = districtwise.length > 1 ? districtwise.slice(0, 10).map((d) => d.complete) : [2, 6, 12, 18, 22];
  const pendingSpark = districtwise.length > 1 ? districtwise.slice(0, 10).map((d) => d.pending) : [3, 6, 6, 6, 8];
  const verifySpark = districtwise.length > 1 ? districtwise.slice(0, 10).map((d) => d.verify_approved) : [1, 4, 8, 14, 18];

  // Export Columns definition for District Table
  const districtCols: ExportColumn<DistrictWiseDetail>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Allocated Sites', accessor: 'site_count' },
    { header: 'Installed Sites', accessor: 'complete' },
    { header: 'Pending Sites', accessor: 'pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Doc Approved', accessor: 'doc_approved' },
    { header: 'Payment Settled', accessor: 'inst_pay_complete' },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Assam_SWP_District_Overview';
  const fileTitle = 'Assam SWP District-Wise Installation Performance';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) =>
    typeof column.accessor === 'function'
      ? (column.accessor as any)(row)
      : (row as Record<string, unknown>)[column.accessor as string];

  const escapeExportValue = (value: unknown) => String(value ?? '');

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
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('District overview data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('District overview data copied to clipboard!');
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
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
<<<<<<< HEAD
=======

<<<<<<< HEAD
  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
=======
  // Filtered drill sites for modal
  const filteredDrillSites = useMemo(() => {
    const q = drillSearch.trim().toLowerCase();
    if (!q) return drillSites;
    return drillSites.filter((s) =>
      String(s.id).includes(q) ||
      (s.farmer_name || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q) ||
      (s.block || '').toLowerCase().includes(q) ||
      (s.village || '').toLowerCase().includes(q) ||
      (s.pump_capacity || '').toLowerCase().includes(q) ||
      (s.customer_no || '').toLowerCase().includes(q)
    );
  }, [drillSites, drillSearch]);
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
<<<<<<< HEAD
=======
      <style>{OVERLAY_CSS}</style>
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

      {/* 1. Page Header (NO refresh button as requested) */}
      <PageHead
        title="Assam SWP Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Water Pump (SWP) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Assam
            </span>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
            <Link to="/v/assam/installation/swp/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/v/assam/installation/swp/request" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Requests
            </Link>
=======
            <Link to="/v/assam/installation/swp/request" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Requests
            </Link>
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
            <Link to="/v/assam/installation/swp/view" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Installations
            </Link>
            <Link to="/v/assam/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add SWP Site</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Error loading dashboard data:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar (matching DLE Dashboard) */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Assam SWP Dashboard Filters"
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
                <label htmlFor="asw-district-select" style={labelStyle}>District:</label>
                <select
                  id="asw-district-select"
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
                <label htmlFor="asw-status-select" style={labelStyle}>Status:</label>
                <select
                  id="asw-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verify Pending</option>
                  <option value="DocApproved">Document Approved</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(swp.site_count)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{districtOptions.length}</b> Districts
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner (matching DLE Dashboard) */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Assam SWP Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Assam Solar Water Pump System</p>
              <h2 className="ax-card__title">Welcome to Assam SWP Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                Assam SWP execution overview: <b>{num(swp.site_count)} solar pump sites</b> allocated across <b>{districtOptions.length} districts</b>.
                <b> {num(swp.complete)} ({pctComplete}%)</b> installed, with <b>{num(swp.verify_approved)}</b> verified approved, <b>{num(swp.doc_approved)}</b> documentation cleared, and <b>{num(swp.inst_pay_complete)}</b> payment settlements.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Districts</dt>
                <dd className="ax-num">{num(districtOptions.length)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>Assam Operational Scope</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(swp.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Beneficiaries</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{num(swp.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(swp.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(swp.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards (interactive with sparklines matching DLE Dashboard) */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={num(swp.site_count)}
          unit="Sites"
          sub="Allocated solar pump sites"
          spark={siteSpark}
<<<<<<< HEAD
          onClick={() => openDrillDown('total', 'Total Allocated Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('total', 'Total Allocated Sites')}
=======
          onClick={() => navigate('/v/assam/installation/swp/request')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installed Sites"
          value={num(swp.complete)}
          unit="Sites"
          sub="Equipment & photos uploaded"
          badge={`${pctComplete}%`}
          spark={completeSpark}
<<<<<<< HEAD
          onClick={() => openDrillDown('complete', 'Completed Installations')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('complete', 'Completed Installations')}
=======
          onClick={() => openDrillDown('Complete', 'Completed Installations')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Installation"
          value={num(swp.pending)}
          unit="Sites"
          sub="Awaiting field execution"
          badge={`${pctPending}%`}
          spark={pendingSpark}
<<<<<<< HEAD
          onClick={() => openDrillDown('pending', 'Pending Installations')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('pending', 'Pending Installations')}
=======
          onClick={() => openDrillDown('Pending', 'Pending Installations')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(swp.verify_approved)}
          unit="Sites"
          sub={`${num(swp.verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-approved', 'Verified Approved Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-approved', 'Verified Approved Sites')}
=======
          onClick={() => openDrillDown('VerifyApproved', 'Verified Approved Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(swp.verify_pending)}
          unit="Sites"
          sub="Field audit pending review"
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-pending', 'Verification Pending Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-pending', 'Verification Pending Sites')}
=======
          onClick={() => openDrillDown('VerifyPending', 'Verification Pending Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(swp.verify_reject)}
          unit="Sites"
          sub="Requires vendor rework"
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-reject', 'Verification Rejected Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-reject', 'Verification Rejected Sites')}
=======
          onClick={() => openDrillDown('VerifyReject', 'Verification Rejected Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Approved"
          value={num(swp.doc_approved)}
          unit="Sites"
          sub={`${num(swp.doc_pending)} Document pending`}
          badge={`${pctDocApproved}%`}
<<<<<<< HEAD
          onClick={() => openDrillDown('doc-approved', 'Document Approved Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('doc-approved', 'Document Approved Sites')}
=======
          onClick={() => openDrillDown('DocApproved', 'Document Approved Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payment Settled"
          value={num(swp.inst_pay_complete)}
          unit="Sites"
          sub={`${num(swp.inst_pay_partially)} Partially paid`}
          badge={`${pctPaid}%`}
<<<<<<< HEAD
          onClick={() => openDrillDown('pay-complete', 'Payment Settled Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('pay-complete', 'Payment Settled Sites')}
=======
          onClick={() => openDrillDown('PaymentComplete', 'Payment Settled Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        {/* 5. Operational Highlights & Execution Tracker (matching section 5 in DLE Dashboard) */}
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
              Assam SWP Vendor Portal
            </span>
          </div>
        </div>

        {/* Operational Highlights Cards */}
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Execution Rate"
          value={`${pctComplete}%`}
          sub={`${num(swp.complete)} of ${num(swp.site_count)} sites installed`}
          badge="Installed"
          spark={[10, 25, 40, 60, pctComplete]}
<<<<<<< HEAD
          onClick={() => openDrillDown('complete', 'Completed Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('complete', 'Completed Sites')}
=======
          onClick={() => openDrillDown('Complete', 'Completed Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Audit Pass Rate"
          value={`${pctOf(swp.verify_approved, (swp.verify_approved + swp.verify_reject) || 1)}%`}
          sub={`${num(swp.verify_approved)} Passed · ${num(swp.verify_reject)} Rejected`}
          spark={[20, 45, 65, 80, pctVerified]}
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-approved', 'Approved Audits')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('verify-approved', 'Approved Audits')}
=======
          onClick={() => openDrillDown('VerifyApproved', 'Approved Audits')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Cleared"
          value={`${pctDocApproved}%`}
          sub={`${num(swp.doc_approved)} compliance docs accepted`}
          spark={[15, 30, 50, 75, pctDocApproved]}
<<<<<<< HEAD
          onClick={() => openDrillDown('doc-approved', 'Document Cleared Sites')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('doc-approved', 'Document Cleared Sites')}
=======
          onClick={() => openDrillDown('DocApproved', 'Document Cleared Sites')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Claim Settlement"
          value={`${pctPaid}%`}
          sub={`${num(swp.inst_pay_complete)} sites disbursed`}
          spark={[5, 15, 30, 45, pctPaid]}
<<<<<<< HEAD
          onClick={() => openDrillDown('pay-complete', 'Settled Claims')}
=======
<<<<<<< HEAD
          onClick={() => openDrillDown('pay-complete', 'Settled Claims')}
=======
          onClick={() => openDrillDown('PaymentComplete', 'Settled Claims')}
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        />

        {/* State Operations Executive Card (matching Bihar/UP ops cards in DLE Dashboard) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assam SWP Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Assam · Solar Water Pump (SWP) Operations</h3>
              <p className="ax-card__subtitle">{num(swp.complete)} pumps installed across {districtOptions.length} districts in Assam</p>
            </div>
            <Link to="/v/assam/installation/swp/view" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(swp.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(swp.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
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
              <b>Verification & Compliance:</b> {num(swp.verify_approved)} sites approved by auditor ({pctVerified}%) · {num(swp.doc_approved)} joint handover sheets approved · {num(swp.inst_pay_complete)} payment settlements confirmed.
            </div>
          </div>
        </section>

        {/* 6. Charts: District Wise Installations + Status Donut (matching DLE Dashboard) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(swp.complete)} installed of {num(swp.site_count)} allocated across {districtOptions.length} districts</p>
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
            <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
              <ApexChart
                key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.complete}-${d.site_count}`).join('-')}`}
                type="bar"
                height={chartH}
                legend="none"
                ariaLabel="District-wise installation comparison"
                series={[
                  { name: 'Installed Sites', data: chartDistricts.map((d) => d.complete || 0) },
                  { name: 'Allocated Sites', data: chartDistricts.map((d) => d.site_count || 0) },
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
<<<<<<< HEAD
                        if (dist) openDrillDown('complete', 'Completed Installations', dist);
=======
<<<<<<< HEAD
                        if (dist) openDrillDown('complete', 'Completed Installations', dist);
=======
                        if (dist) openDrillDown('Complete', 'Completed Installations', dist);
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                      },
                    },
                  },
                }}
              />
            </Suspense>
          </div>
        </section>

        {/* Status Distribution Donut Chart */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(swp.site_count)} Solar Pumps</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${swp.complete}-${swp.pending}-${swp.verify_reject}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[swp.complete, swp.pending, swp.verify_reject]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
<<<<<<< HEAD
                        const labels = ['complete', 'pending', 'verify-reject'];
=======
<<<<<<< HEAD
                        const labels = ['complete', 'pending', 'verify-reject'];
=======
                        const labels = ['Complete', 'Pending', 'VerifyReject'];
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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
                          total: { show: true, label: 'Pumps', formatter: () => num(swp.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
<<<<<<< HEAD
                { label: 'Installed', sub: 'Completed sites', v: swp.complete, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: swp.pending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: swp.verify_reject, p: pctOf(swp.verify_reject, swp.site_count), color: LIGHT_RED, key: 'verify-reject' },
=======
<<<<<<< HEAD
                { label: 'Installed', sub: 'Completed sites', v: swp.complete, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: swp.pending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: swp.verify_reject, p: pctOf(swp.verify_reject, swp.site_count), color: LIGHT_RED, key: 'verify-reject' },
=======
                { label: 'Installed', sub: 'Completed sites', v: swp.complete, p: pctComplete, color: LIGHT_GREEN, key: 'Complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: swp.pending, p: pctPending, color: LIGHT_AMBER, key: 'Pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: swp.verify_reject, p: pctOf(swp.verify_reject, swp.site_count), color: LIGHT_RED, key: 'VerifyReject' },
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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

        {/* 7. Monthly Installation Throughput + Milestones (matching DLE Dashboard) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">Installation pace and throughput across recent months</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {monthlyInstallations.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
              <ApexChart
                key={`monthly-${chartH}-${monthlyInstallations.map((m) => `${m.month_year}-${m.monthly_installations}`).join('-')}`}
                type="area"
                height={chartH}
                legend="top"
                ariaLabel="Monthly installations area chart"
                series={[
                  {
                    name: 'Monthly Installed Sites',
                    data: monthlyInstallations.length > 0
                      ? monthlyInstallations.map((m) => m.monthly_installations)
                      : [12, 28, 45, 70, 95, swp.complete],
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
                    categories: monthlyInstallations.length > 0
                      ? monthlyInstallations.map((m) => m.month_year)
                      : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                  },
                  yaxis: { title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                }}
              />
            </Suspense>
          </div>
        </section>

        {/* SWP Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="SWP Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">SWP Milestones</h2>
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
<<<<<<< HEAD
          </div>
        </section>

        {/* 8. District Wise Detailed Table (matching DLE Dashboard, ALL COLUMNS SCROLLABLE, NO COLUMNS TOGGLE BUTTON) */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SWP Summary</h2>
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
                {/* TableExportToolbar without columns toggle (F 1I Columns section removed) */}
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          {/* Table container: all columns scrollable, NO sticky/fixed column */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Doc Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr
                    key={d.district}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', 'District Installations', d.district); } }}
<<<<<<< HEAD
=======
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{d.district}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Sites', d.district); }}
                    >
                      {num(d.site_count || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', d.district); }}
                    >
                      {num(d.complete || 0)}
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
                      title={`View verify approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', d.district); }}
                    >
                      {num(d.verify_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View doc approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('doc-approved', 'Doc Approved Sites', d.district); }}
                    >
                      {num(d.doc_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pay-complete', 'Payment Settled Sites', d.district); }}
                    >
                      {num(d.inst_pay_complete || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} title="View all allocated sites" onClick={() => openDrillDown('total', 'Total Allocated Sites')}>{num(swp.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View completed sites" onClick={() => openDrillDown('complete', 'Total Installed Sites')}>{num(swp.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} title="View pending sites" onClick={() => openDrillDown('pending', 'Total Pending Sites')}>{num(swp.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} title="View verify approved sites" onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Sites')}>{num(swp.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View doc approved sites" onClick={() => openDrillDown('doc-approved', 'Total Doc Approved Sites')}>{num(swp.doc_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View payment settled sites" onClick={() => openDrillDown('pay-complete', 'Total Payment Settled Sites')}>{num(swp.inst_pay_complete)}</td>
                  </tr>
                )}
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
                pageSizeOptions={[10, 15, 25, 50]}
              />
            </div>
          </div>
        </section>

        {/* 9. District Quick-Access & Recent Activity (matching DLE Dashboard) */}
        <section className="ax-card ax-col--4" role="region" aria-label="District Status & Quick Navigation">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Operations</span>
              <h2 className="ax-card__title">District Quick Access</h2>
              <p className="ax-card__subtitle">Installation progress by district</p>
=======
          </div>
        </section>

        {/* 8. District Wise Detailed Table (matching DLE Dashboard, ALL COLUMNS SCROLLABLE, NO COLUMNS TOGGLE BUTTON) */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SWP Summary</h2>
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
                {/* TableExportToolbar without columns toggle (F 1I Columns section removed) */}
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, fileTitle)}
                />
              </div>
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Top Execution Districts
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(swp.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {districtwise.slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                      {num(d.complete || 0)} / {num(d.site_count || 0)} ({pctOf(d.complete || 0, d.site_count || 1)}%)
                    </b>
                  </button>
                ))}
                {districtwise.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data.'}</span>}
              </div>
            </div>

<<<<<<< HEAD
            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Quick Actions Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/v/assam/installation/swp/request" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Accept Assigned Requests</span>
                <span>→</span>
              </Link>
              <Link to="/v/assam/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Record New Installation</span>
                <span>+</span>
              </Link>
              <Link to="/v/assam/installation/swp/claim" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Submit Payment Claim</span>
                <span>₹</span>
              </Link>
            </div>
=======
          {/* Table container: all columns scrollable, NO sticky/fixed column */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Doc Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr
                    key={d.district}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('Complete', 'District Installations', d.district)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('Complete', 'District Installations', d.district); } }}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{d.district}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Sites', d.district); }}
                    >
                      {num(d.site_count || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', d.district); }}
                    >
                      {num(d.complete || 0)}
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
                      title={`View verify approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', d.district); }}
                    >
                      {num(d.verify_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View doc approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('doc-approved', 'Doc Approved Sites', d.district); }}
                    >
                      {num(d.doc_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pay-complete', 'Payment Settled Sites', d.district); }}
                    >
                      {num(d.inst_pay_complete || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} title="View all allocated sites" onClick={() => openDrillDown('total', 'Total Allocated Sites')}>{num(swp.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View completed sites" onClick={() => openDrillDown('complete', 'Total Installed Sites')}>{num(swp.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} title="View pending sites" onClick={() => openDrillDown('pending', 'Total Pending Sites')}>{num(swp.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} title="View verify approved sites" onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Sites')}>{num(swp.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View doc approved sites" onClick={() => openDrillDown('doc-approved', 'Total Doc Approved Sites')}>{num(swp.doc_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View payment settled sites" onClick={() => openDrillDown('pay-complete', 'Total Payment Settled Sites')}>{num(swp.inst_pay_complete)}</td>
                  </tr>
                )}
              </tbody>
            </table>
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 15, 25, 50]}
              />
            </div>
          </div>
        </section>

        {/* 9. District Quick-Access & Recent Activity (matching DLE Dashboard) */}
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
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(swp.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {districtwise.slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                      {num(d.complete || 0)} / {num(d.site_count || 0)} ({pctOf(d.complete || 0, d.site_count || 1)}%)
                    </b>
                  </button>
                ))}
                {districtwise.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data.'}</span>}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Quick Actions Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/v/assam/installation/swp/request" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Accept Assigned Requests</span>
                <span>→</span>
              </Link>
              <Link to="/v/assam/installation/swp/site" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Record New Installation</span>
                <span>+</span>
              </Link>
              <Link to="/v/assam/installation/swp/claim" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Submit Payment Claim</span>
                <span>₹</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AssamDashboard;
