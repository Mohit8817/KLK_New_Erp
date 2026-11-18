/*
 * KLK Ventures ERP — State Project Operations Dashboard
 * Clean, professional, user-friendly template design matching DLE Dashboard design system.
 * Balanced professional padding across all cards and sections, perfectly sized icons.
 */

import { lazy, Suspense, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';
import { Pagination, usePagination, TableExportToolbar, type ExportColumn } from '../../common';
import { SearchInput } from '../../common/search/SearchInput';

// Code-split ApexCharts so page renders immediately
const ApexChart = lazy(() => import('../../components/charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Chart color tokens matching DLE Dashboard standard
const LIGHT_BLUE = '#2f7df2';
const LIGHT_GREEN = '#86DDB2';

const num = (x: number) => (typeof x === 'number' ? x.toLocaleString('en-IN') : '0');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ───────── Scoped Template CSS with Balanced Professional Padding ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    padding-bottom: var(--ax-space-6, 24px);
  }
  .solar-erp-page .ax-page-head {
    margin-block-end: 14px;
  }
  .solar-erp-page .ax-page-head .ax-breadcrumb {
    margin-block-end: 4px;
  }
  .solar-erp-page .ax-dash-grid {
    margin-top: 0;
    gap: var(--ax-space-4, 16px);
  }
  .solar-erp-page .ax-card {
    min-width: 0;
    border: 1px solid var(--ax-border);
    border-radius: var(--ax-radius-lg, 12px);
    background: var(--ax-bg-surface);
  }
  .solar-erp-page .ax-card__footer {
    width: 100%;
    box-sizing: border-box;
  }
  .solar-erp-page .state-pagination-left {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    overflow-x: auto;
  }
  .solar-erp-page .state-pagination-left > * {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  /* Card Header styling with balanced padding */
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
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
  .solar-erp-page .ax-card__subtitle {
    line-height: 1.45;
    margin-top: 2px;
  }

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

  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 100px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input {
    min-width: 0;
    width: 100%;
    height: 32px;
  }

  .solar-erp-page .ax-card__actions .ax-export-toolbar {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }

  .solar-erp-page .ax-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    padding: 10px 14px;
  }

  .solar-erp-page .ax-kpi {
    border: 1px solid var(--ax-border);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .solar-erp-page .ax-kpi:hover {
    border-color: var(--ax-border-strong, var(--ax-accent));
    box-shadow: var(--ax-shadow-sm);
  }

  .solar-erp-page .scheme-tile {
    border: 1px solid var(--ax-border);
    background: var(--ax-bg-surface);
    border-radius: var(--ax-radius-lg, 12px);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    display: flex;
    flex-direction: column;
    justifyContent: space-between;
  }
  .solar-erp-page .scheme-tile:hover {
    border-color: var(--ax-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }

  /* Standardized Welcome banner spacing */
  .solar-erp-page .ax-welcome__body {
    padding: 18px 22px;
  }

  /* Responsive fixes */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 {
      grid-column: span 12 !important;
    }
    .solar-erp-page .scheme-tile {
      grid-column: span 6 !important;
    }
  }
  @media (max-width: 640px) {
    .solar-erp-page .scheme-tile,
    .solar-erp-page .ax-kpi {
      grid-column: span 12 !important;
    }
    .solar-erp-page .ax-card__header {
      flex-wrap: wrap;
      padding: 12px 14px;
    }
    .solar-erp-page .ax-welcome__body {
      padding: 14px 16px;
    }
  }
`;

/* ───────── Strictly Sized Icons (Prevents SVG stretching) ───────── */
const createSvg = (children: React.ReactNode, size = 16) => (
  <svg
    style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0, display: 'inline-block' }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICON_FILTER = createSvg(<path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" />, 14);
const I_SUN = createSvg(<><circle cx="12" cy="12" r="4" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1M5.6 5.6l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></>, 16);
const I_BOLT = createSvg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />, 16);
const I_PUMP = createSvg(<><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1" /><path d="M7 16a4 4 0 0 0 8 0" /><path d="M12 9v7" /><path d="M12 21a9 9 0 0 0 9 -9h-3a6 6 0 0 1 -6 6v3" /></>, 16);
const I_LAMP = createSvg(<><path d="M12 3v5" /><path d="M10 8h4" /><path d="M12 8l4 13" /><path d="M12 8l-4 13" /><path d="M6 13h12" /></>, 16);
const I_HOME = createSvg(<><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></>, 16);
const I_PLUG = createSvg(<><path d="M9.785 6l8.215 8.215l-2.054 2.054a5.81 5.81 0 1 1 -8.215 -8.215l2.054 -2.054z" /><path d="M4 20l3.5 -3.5" /><path d="M15 4l-3.5 3.5" /><path d="M20 9l-3.5 3.5" /></>, 16);
const I_BATTERY = createSvg(<><path d="M6 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2" /><path d="M21 10v4" /><path d="M7 10v4" /><path d="M10 10v4" /></>, 16);
const I_REFRESH = createSvg(<><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>, 14);
const I_ARROW_LEFT = createSvg(<><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></>, 14);
const I_PLUS = createSvg(<><path d="M12 5l0 14" /><path d="M5 12l14 0" /></>, 14);
const I_DONE = createSvg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>, 16);
const I_CHECK = createSvg(<><path d="M5 12l5 5l10 -10" /></>, 16);

/* ───────── KPI Card (1:1 with DLEDashboard Component Architecture) ───────── */
interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';
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
  accent: { bg: 'rgba(var(--ax-accent-rgb, 47, 125, 242), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-kpi ax-card--flat ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg)',
        background: 'var(--ax-bg-surface)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
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

/* ───────── Scheme Data Contracts ───────── */
export interface SchemeItem {
  id: string;
  name: string;
  code: string;
  shortCode: string;
  category: 'Grid-Connected' | 'Off-Grid & Agri' | 'Street Lighting' | 'Storage & BOOT';
  tagline: string;
  count: number;
  capacity: string;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';
  icon: React.ReactNode;
  status: 'Commissioned' | 'Active Execution' | 'Survey Open';
  progress: number;
  route?: string;
}

export interface ComplaintDeskItem {
  id: string;
  title: string;
  code: string;
  resolved: number;
  pending: number;
  rate: number;
  statusNote: string;
}

export interface DistrictMetric {
  id: string;
  district: string;
  state: string;
  ssl: number;
  srt70: number;
  swp: number;
  capacityKw: number;
  dles: number;
  status: 'Operational' | 'Inspection Active' | 'Target Met';
}

export interface StateConfig {
  id: string;
  name: string;
  code: string;
  region: string;
  nodalAgency: string;
  discom: string;
  officialHeading: string;
  kpis: {
    onGrid: number;
    powerPack: number;
    srt: number;
    swp: number;
    ssl: number;
    shl: number;
    srt70mw: number;
    totalUnits: number;
    capacityMw: number;
    activeDles: number;
    amcHealth: number;
  };
  schemes: SchemeItem[];
  complaints: ComplaintDeskItem[];
  districts: DistrictMetric[];
}

const ALL_STATES_CONFIG: Record<string, StateConfig> = {
  jammu: {
    id: 'jammu',
    name: 'Jammu',
    code: 'JM',
    region: 'North',
    nodalAgency: 'JAKEDA (J&K Energy Development Agency) & PDD',
    discom: 'JPDCL (Jammu Power Distribution Corporation Ltd.)',
    officialHeading: 'PROJECT UNDER JAMMU GOVERNMENT',
    kpis: {
      onGrid: 0,
      powerPack: 0,
      srt: 61,
      swp: 681,
      ssl: 15385,
      shl: 0,
      srt70mw: 3086,
      totalUnits: 19213,
      capacityMw: 84.6,
      activeDles: 48,
      amcHealth: 98.4,
    },
    schemes: [
      { id: 'srt', name: 'Solar RoofTop', code: 'SRT', shortCode: 'SRT Grid', category: 'Grid-Connected', tagline: 'Residential & commercial grid-tied rooftops', count: 61, capacity: '425 kW', tone: 'cyan', icon: I_SUN, status: 'Active Execution', progress: 88, route: '/dle/dashboard' },
      { id: 'srt70mw', name: '70 MW Solar RoofTop', code: '70MW SRT', shortCode: 'Mega SRT', category: 'Grid-Connected', tagline: 'Flagship J&K Govt distributed rooftop initiative', count: 3086, capacity: '28.38 MW', tone: 'accent', icon: I_HOME, status: 'Active Execution', progress: 94, route: '/dle/dashboard' },
      { id: 'swp', name: 'Solar Irrigation Pump', code: 'SWP', shortCode: 'KUSUM-B', category: 'Off-Grid & Agri', tagline: 'Agricultural solar water pumping (PM-KUSUM)', count: 681, capacity: '3,405 HP', tone: 'emerald', icon: I_PUMP, status: 'Active Execution', progress: 91, route: '/dle/dashboard' },
      { id: 'ssl', name: 'Solar Street Light', code: 'SSL', shortCode: 'Smart SSL', category: 'Street Lighting', tagline: 'Gram Panchayat & municipal dusk-to-dawn LED lights', count: 15385, capacity: '369.2 kW', tone: 'amber', icon: I_LAMP, status: 'Commissioned', progress: 100, route: '/dle/dashboard' },
      { id: 'shl', name: 'Solar Home Lighting', code: 'SHL', shortCode: 'Home Kit', category: 'Off-Grid & Agri', tagline: 'Decentralized domestic DC solar lighting kits', count: 0, capacity: '1,200 Allotted', tone: 'amber', icon: I_HOME, status: 'Survey Open', progress: 20, route: '/dle/dashboard' },
      { id: 'resco', name: 'Resco', code: 'RESCO', shortCode: 'PPA Model', category: 'Storage & BOOT', tagline: 'Renewable energy service company BOOT plants', count: 18, capacity: '4.20 MW', tone: 'emerald', icon: I_BOLT, status: 'Active Execution', progress: 82, route: '/dle/dashboard' },
      { id: 'offgrid', name: 'Off Grid', code: 'OFFGRID', shortCode: 'Microgrid', category: 'Off-Grid & Agri', tagline: 'Isolated hybrid solar PV & inverter microgrids', count: 12, capacity: '650 kWp', tone: 'violet', icon: I_PLUG, status: 'Active Execution', progress: 78, route: '/dle/dashboard' },
      { id: 'powerpack', name: 'Power Pack', code: 'BESS', shortCode: 'Storage', category: 'Storage & BOOT', tagline: 'Institutional LiFePO4 battery energy storage packs', count: 0, capacity: '250 kWh Allotted', tone: 'violet', icon: I_BATTERY, status: 'Active Execution', progress: 40, route: '/dle/dashboard' },
    ],
    complaints: [
      { id: 'ssl_c', title: 'SSL Complaints', code: 'SSL', resolved: 0, pending: 0, rate: 100, statusNote: 'All street lights fully functional' },
      { id: 'srt_c', title: 'SRT 70MW Complaints', code: '70MW SRT', resolved: 0, pending: 0, rate: 100, statusNote: 'Zero outstanding rooftop faults' },
      { id: 'swp_c', title: 'SWP Complaints', code: 'SWP', resolved: 293, pending: 30, rate: 90.7, statusNote: '30 tickets currently assigned to DLE technicians' },
      { id: 'shl_c', title: 'SHL Complaints', code: 'SHL', resolved: 0, pending: 0, rate: 100, statusNote: 'No breakdown records reported' },
    ],
    districts: [
      { id: 'jm_1', district: 'JAMMU', state: 'Jammu', ssl: 5420, srt70: 1240, swp: 210, capacityKw: 11400, dles: 18, status: 'Operational' },
      { id: 'jm_2', district: 'KATHUA', state: 'Jammu', ssl: 3410, srt70: 680, swp: 160, capacityKw: 6820, dles: 11, status: 'Operational' },
      { id: 'jm_3', district: 'SAMBA', state: 'Jammu', ssl: 2180, srt70: 510, swp: 95, capacityKw: 4920, dles: 7, status: 'Operational' },
      { id: 'jm_4', district: 'UDHAMPUR', state: 'Jammu', ssl: 1850, srt70: 340, swp: 84, capacityKw: 3180, dles: 6, status: 'Inspection Active' },
      { id: 'jm_5', district: 'RAJOURI', state: 'Jammu', ssl: 1120, srt70: 180, swp: 58, capacityKw: 1850, dles: 4, status: 'Inspection Active' },
      { id: 'jm_6', district: 'REASI', state: 'Jammu', ssl: 780, srt70: 82, swp: 42, capacityKw: 920, dles: 3, status: 'Target Met' },
      { id: 'jm_7', district: 'POONCH', state: 'Jammu', ssl: 625, srt70: 54, swp: 32, capacityKw: 760, dles: 2, status: 'Inspection Active' },
    ],
  },
  kashmir: {
    id: 'kashmir',
    name: 'Kashmir',
    code: 'JK',
    region: 'North',
    nodalAgency: 'JAKEDA (J&K Energy Development Agency) - Kashmir Division',
    discom: 'KPDCL (Kashmir Power Distribution Corporation Ltd.)',
    officialHeading: 'PROJECT UNDER KASHMIR GOVERNMENT',
    kpis: {
      onGrid: 14,
      powerPack: 2,
      srt: 84,
      swp: 412,
      ssl: 9840,
      shl: 120,
      srt70mw: 1840,
      totalUnits: 12312,
      capacityMw: 52.4,
      activeDles: 32,
      amcHealth: 97.2,
    },
    schemes: [
      { id: 'srt', name: 'Solar RoofTop', code: 'SRT', shortCode: 'SRT Grid', category: 'Grid-Connected', tagline: 'Residential & commercial grid-tied rooftops', count: 84, capacity: '610 kW', tone: 'cyan', icon: I_SUN, status: 'Active Execution', progress: 85 },
      { id: 'srt70mw', name: '70 MW Solar RoofTop', code: '70MW SRT', shortCode: 'Mega SRT', category: 'Grid-Connected', tagline: 'Distributed rooftop initiative', count: 1840, capacity: '16.9 MW', tone: 'accent', icon: I_HOME, status: 'Active Execution', progress: 92 },
      { id: 'swp', name: 'Solar Irrigation Pump', code: 'SWP', shortCode: 'KUSUM-B', category: 'Off-Grid & Agri', tagline: 'Agricultural solar water pumping (PM-KUSUM)', count: 412, capacity: '2,060 HP', tone: 'emerald', icon: I_PUMP, status: 'Active Execution', progress: 89 },
      { id: 'ssl', name: 'Solar Street Light', code: 'SSL', shortCode: 'Smart SSL', category: 'Street Lighting', tagline: 'Smart dusk-to-dawn street lighting', count: 9840, capacity: '236 kW', tone: 'amber', icon: I_LAMP, status: 'Commissioned', progress: 96 },
      { id: 'shl', name: 'Solar Home Lighting', code: 'SHL', shortCode: 'Home Kit', category: 'Off-Grid & Agri', tagline: 'Decentralized domestic DC solar lighting kits', count: 120, capacity: '72 kW', tone: 'amber', icon: I_HOME, status: 'Active Execution', progress: 65 },
      { id: 'resco', name: 'Resco', code: 'RESCO', shortCode: 'PPA Model', category: 'Storage & BOOT', tagline: 'Institutional BOOT plants', count: 14, capacity: '3.1 MW', tone: 'emerald', icon: I_BOLT, status: 'Active Execution', progress: 80 },
      { id: 'offgrid', name: 'Off Grid', code: 'OFFGRID', shortCode: 'Microgrid', category: 'Off-Grid & Agri', tagline: 'Isolated hybrid solar PV microgrids', count: 18, capacity: '890 kWp', tone: 'violet', icon: I_PLUG, status: 'Active Execution', progress: 75 },
      { id: 'powerpack', name: 'Power Pack', code: 'BESS', shortCode: 'Storage', category: 'Storage & BOOT', tagline: 'LiFePO4 battery energy storage packs', count: 2, capacity: '60 kWh', tone: 'violet', icon: I_BATTERY, status: 'Active Execution', progress: 50 },
    ],
    complaints: [
      { id: 'ssl_c', title: 'SSL Complaints', code: 'SSL', resolved: 14, pending: 2, rate: 87.5, statusNote: '2 pending inspection tickets' },
      { id: 'srt_c', title: 'SRT 70MW Complaints', code: '70MW SRT', resolved: 6, pending: 1, rate: 85.7, statusNote: '1 inverter replacement pending' },
      { id: 'swp_c', title: 'SWP Complaints', code: 'SWP', resolved: 142, pending: 18, rate: 88.8, statusNote: '18 controller repairs in progress' },
      { id: 'shl_c', title: 'SHL Complaints', code: 'SHL', resolved: 1, pending: 0, rate: 100, statusNote: 'All systems resolved' },
    ],
    districts: [
      { id: 'ks_1', district: 'SRINAGAR', state: 'Kashmir', ssl: 3820, srt70: 890, swp: 85, capacityKw: 9200, dles: 12, status: 'Operational' },
      { id: 'ks_2', district: 'ANANTNAG', state: 'Kashmir', ssl: 2450, srt70: 410, swp: 120, capacityKw: 4800, dles: 8, status: 'Operational' },
      { id: 'ks_3', district: 'BARAMULLA', state: 'Kashmir', ssl: 1980, srt70: 320, swp: 110, capacityKw: 3900, dles: 7, status: 'Inspection Active' },
      { id: 'ks_4', district: 'PULWAMA', state: 'Kashmir', ssl: 1120, srt70: 140, swp: 62, capacityKw: 1720, dles: 5, status: 'Target Met' },
    ],
  },
  up: {
    id: 'up',
    name: 'Uttar Pradesh',
    code: 'UP',
    region: 'North',
    nodalAgency: 'UPNEDA (Uttar Pradesh New & Renewable Energy Development Agency)',
    discom: 'UPPCL (MVVNL, PVVNL, DVVNL, PuVVNL)',
    officialHeading: 'PROJECT UNDER UTTAR PRADESH GOVERNMENT',
    kpis: {
      onGrid: 128,
      powerPack: 16,
      srt: 420,
      swp: 3840,
      ssl: 48920,
      shl: 640,
      srt70mw: 12400,
      totalUnits: 66364,
      capacityMw: 245.8,
      activeDles: 142,
      amcHealth: 96.8,
    },
    schemes: [
      { id: 'srt', name: 'Solar RoofTop', code: 'SRT', shortCode: 'SRT Grid', category: 'Grid-Connected', tagline: 'Residential & commercial grid-tied rooftops', count: 420, capacity: '3.8 MW', tone: 'cyan', icon: I_SUN, status: 'Active Execution', progress: 91, route: '/dle/up/ssl/amc/view-assign-light' },
      { id: 'srt70mw', name: '70 MW Solar RoofTop', code: '70MW SRT', shortCode: 'Mega SRT', category: 'Grid-Connected', tagline: 'Distributed rooftop initiative', count: 12400, capacity: '112.5 MW', tone: 'accent', icon: I_HOME, status: 'Active Execution', progress: 95 },
      { id: 'swp', name: 'Solar Irrigation Pump', code: 'SWP', shortCode: 'KUSUM-B', category: 'Off-Grid & Agri', tagline: 'Agricultural solar water pumping (PM-KUSUM)', count: 3840, capacity: '19,200 HP', tone: 'emerald', icon: I_PUMP, status: 'Active Execution', progress: 94 },
      { id: 'ssl', name: 'Solar Street Light', code: 'SSL', shortCode: 'Smart SSL', category: 'Street Lighting', tagline: 'Gram Panchayat & Smart City solar lighting', count: 48920, capacity: '1.17 MW', tone: 'amber', icon: I_LAMP, status: 'Commissioned', progress: 98, route: '/dle/up/ssl/amc/view-assign-light' },
      { id: 'shl', name: 'Solar Home Lighting', code: 'SHL', shortCode: 'Home Kit', category: 'Off-Grid & Agri', tagline: 'Decentralized domestic DC solar lighting kits', count: 640, capacity: '380 kW', tone: 'amber', icon: I_HOME, status: 'Active Execution', progress: 85 },
      { id: 'resco', name: 'Resco', code: 'RESCO', shortCode: 'PPA Model', category: 'Storage & BOOT', tagline: 'Government buildings solar rooftop BOOT', count: 85, capacity: '18.4 MW', tone: 'emerald', icon: I_BOLT, status: 'Active Execution', progress: 88 },
      { id: 'offgrid', name: 'Off Grid', code: 'OFFGRID', shortCode: 'Microgrid', category: 'Off-Grid & Agri', tagline: 'Mini-grid solar for un-electrified villages', count: 42, capacity: '2.1 MWp', tone: 'violet', icon: I_PLUG, status: 'Active Execution', progress: 82 },
      { id: 'powerpack', name: 'Power Pack', code: 'BESS', shortCode: 'Storage', category: 'Storage & BOOT', tagline: 'Primary health centers LiFePO4 energy packs', count: 16, capacity: '480 kWh', tone: 'violet', icon: I_BATTERY, status: 'Active Execution', progress: 90 },
    ],
    complaints: [
      { id: 'ssl_c', title: 'SSL Complaints', code: 'SSL', resolved: 182, pending: 24, rate: 88.3, statusNote: '24 fixtures queued for replacement' },
      { id: 'srt_c', title: 'SRT 70MW Complaints', code: '70MW SRT', resolved: 45, pending: 8, rate: 84.9, statusNote: '8 grid sync inspections pending' },
      { id: 'swp_c', title: 'SWP Complaints', code: 'SWP', resolved: 812, pending: 94, rate: 89.6, statusNote: '94 technician site visits scheduled' },
      { id: 'shl_c', title: 'SHL Complaints', code: 'SHL', resolved: 12, pending: 3, rate: 80.0, statusNote: '3 battery replacements pending' },
    ],
    districts: [
      { id: 'up_1', district: 'LUCKNOW', state: 'Uttar Pradesh', ssl: 8400, srt70: 2850, swp: 380, capacityKw: 38500, dles: 24, status: 'Operational' },
      { id: 'up_2', district: 'VARANASI', state: 'Uttar Pradesh', ssl: 7200, srt70: 2100, swp: 410, capacityKw: 29800, dles: 19, status: 'Operational' },
      { id: 'up_3', district: 'AYODHYA', state: 'Uttar Pradesh', ssl: 6800, srt70: 1950, swp: 320, capacityKw: 26400, dles: 18, status: 'Operational' },
      { id: 'up_4', district: 'PRAYAGRAJ', state: 'Uttar Pradesh', ssl: 5900, srt70: 1620, swp: 460, capacityKw: 24100, dles: 16, status: 'Inspection Active' },
      { id: 'up_5', district: 'KANPUR', state: 'Uttar Pradesh', ssl: 5400, srt70: 1480, swp: 390, capacityKw: 21900, dles: 15, status: 'Operational' },
    ],
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    region: 'East',
    nodalAgency: 'BREDA (Bihar Renewable Energy Development Agency)',
    discom: 'NBPDCL / SBPDCL (Bihar State Power Holding Company)',
    officialHeading: 'PROJECT UNDER BIHAR GOVERNMENT',
    kpis: {
      onGrid: 42,
      powerPack: 8,
      srt: 210,
      swp: 2640,
      ssl: 32400,
      shl: 340,
      srt70mw: 6840,
      totalUnits: 42522,
      capacityMw: 168.4,
      activeDles: 95,
      amcHealth: 95.9,
    },
    schemes: [
      { id: 'srt', name: 'Solar RoofTop', code: 'SRT', shortCode: 'SRT Grid', category: 'Grid-Connected', tagline: 'Residential & commercial grid-tied rooftops', count: 210, capacity: '2.1 MW', tone: 'cyan', icon: I_SUN, status: 'Active Execution', progress: 87, route: '/dle/bihar/ssl/amc/view-assign-light' },
      { id: 'srt70mw', name: '70 MW Solar RoofTop', code: '70MW SRT', shortCode: 'Mega SRT', category: 'Grid-Connected', tagline: 'Distributed rooftop initiative', count: 6840, capacity: '61.5 MW', tone: 'accent', icon: I_HOME, status: 'Active Execution', progress: 93 },
      { id: 'swp', name: 'Solar Irrigation Pump', code: 'SWP', shortCode: 'KUSUM-B', category: 'Off-Grid & Agri', tagline: 'Agricultural solar water pumping (PM-KUSUM)', count: 2640, capacity: '13,200 HP', tone: 'emerald', icon: I_PUMP, status: 'Active Execution', progress: 92 },
      { id: 'ssl', name: 'Solar Street Light', code: 'SSL', shortCode: 'Smart SSL', category: 'Street Lighting', tagline: 'Mukhyamantri Gramin Solar Street Light Yojana', count: 32400, capacity: '777 kW', tone: 'amber', icon: I_LAMP, status: 'Commissioned', progress: 97, route: '/dle/bihar/ssl/amc/view-assign-light' },
      { id: 'shl', name: 'Solar Home Lighting', code: 'SHL', shortCode: 'Home Kit', category: 'Off-Grid & Agri', tagline: 'Decentralized domestic DC solar lighting kits', count: 340, capacity: '204 kW', tone: 'amber', icon: I_HOME, status: 'Active Execution', progress: 78 },
      { id: 'resco', name: 'Resco', code: 'RESCO', shortCode: 'PPA Model', category: 'Storage & BOOT', tagline: 'Hospital & campus solar BOOT plants', count: 48, capacity: '9.8 MW', tone: 'emerald', icon: I_BOLT, status: 'Active Execution', progress: 84 },
      { id: 'offgrid', name: 'Off Grid', code: 'OFFGRID', shortCode: 'Microgrid', category: 'Off-Grid & Agri', tagline: 'Riverine belt standalone microgrids', count: 24, capacity: '1.2 MWp', tone: 'violet', icon: I_PLUG, status: 'Active Execution', progress: 79 },
      { id: 'powerpack', name: 'Power Pack', code: 'BESS', shortCode: 'Storage', category: 'Storage & BOOT', tagline: 'Community health centers solar battery backup', count: 8, capacity: '240 kWh', tone: 'violet', icon: I_BATTERY, status: 'Active Execution', progress: 85 },
    ],
    complaints: [
      { id: 'ssl_c', title: 'SSL Complaints', code: 'SSL', resolved: 124, pending: 18, rate: 87.3, statusNote: '18 pole battery inspections ongoing' },
      { id: 'srt_c', title: 'SRT 70MW Complaints', code: '70MW SRT', resolved: 28, pending: 5, rate: 84.8, statusNote: '5 inverter replacements scheduled' },
      { id: 'swp_c', title: 'SWP Complaints', code: 'SWP', resolved: 540, pending: 62, rate: 89.7, statusNote: '62 technician field visits in progress' },
      { id: 'shl_c', title: 'SHL Complaints', code: 'SHL', resolved: 8, pending: 2, rate: 80.0, statusNote: '2 domestic panel checks pending' },
    ],
    districts: [
      { id: 'br_1', district: 'PATNA', state: 'Bihar', ssl: 6800, srt70: 1940, swp: 310, capacityKw: 28400, dles: 21, status: 'Operational' },
      { id: 'br_2', district: 'GAYA', state: 'Bihar', ssl: 5200, srt70: 1120, swp: 480, capacityKw: 19200, dles: 16, status: 'Operational' },
      { id: 'br_3', district: 'MUZAFFARPUR', state: 'Bihar', ssl: 4900, srt70: 980, swp: 390, capacityKw: 17400, dles: 14, status: 'Operational' },
      { id: 'br_4', district: 'BHAGALPUR', state: 'Bihar', ssl: 4100, srt70: 820, swp: 340, capacityKw: 14600, dles: 12, status: 'Inspection Active' },
      { id: 'br_5', district: 'NALANDA', state: 'Bihar', ssl: 3800, srt70: 740, swp: 290, capacityKw: 13100, dles: 11, status: 'Operational' },
    ],
  },
};

const getStateConfig = (rawId?: string): StateConfig => {
  const normKey = (rawId || 'jammu').toLowerCase().trim();
  if (ALL_STATES_CONFIG[normKey]) {
    return ALL_STATES_CONFIG[normKey];
  }
  return ALL_STATES_CONFIG.jammu;
};

const AVAILABLE_STATES = [
  { id: 'jammu', name: 'Jammu', code: 'JM' },
  { id: 'kashmir', name: 'Kashmir', code: 'JK' },
  { id: 'up', name: 'Uttar Pradesh', code: 'UP' },
  { id: 'bihar', name: 'Bihar', code: 'BR' },
  { id: 'assam', name: 'Assam', code: 'AS' },
  { id: 'himachal', name: 'Himachal Pradesh', code: 'HP' },
  { id: 'haryana', name: 'Haryana', code: 'HR' },
  { id: 'punjab', name: 'Punjab', code: 'PB' },
  { id: 'jharkhand', name: 'Jharkhand', code: 'JH' },
  { id: 'goa', name: 'Goa', code: 'GA' },
  { id: 'karnataka', name: 'Karnataka', code: 'KA' },
  { id: 'tripura', name: 'Tripura', code: 'TR' },
  { id: 'arunachal', name: 'Arunachal Pradesh', code: 'AR' },
];

export function StateProjectDashboard() {
  const params = useParams<{ stateId?: string }>();
  const navigate = useNavigate();
  const currentKey = (params.stateId || 'jammu').toLowerCase();
  const stateData = useMemo(() => getStateConfig(currentKey), [currentKey]);

  // Operational filters
  const [selectedSchemeCategory, setSelectedSchemeCategory] = useState<string>('All');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('All');
  const [districtQuery, setDistrictQuery] = useState('');
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);
  const [showHindiQuote, setShowHindiQuote] = useState(true);

  // Modals & toast
  const [selectedSchemeModal, setSelectedSchemeModal] = useState<SchemeItem | null>(null);
  const [addComplaintScheme, setAddComplaintScheme] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  /* ───────── District Table (Search, Filter, Pagination, Export) ───────── */
  const deferredDistrictQuery = useDeferredValue(districtQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return stateData.districts.filter((d) => {
      const matchDistrict = selectedDistrictFilter === 'All' || d.district === selectedDistrictFilter;
      const matchQuery = !q || d.district.toLowerCase().includes(q) || d.state.toLowerCase().includes(q);
      return matchDistrict && matchQuery;
    });
  }, [stateData.districts, selectedDistrictFilter, deferredDistrictQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtQuery, selectedDistrictFilter, currentKey]);

  // Table columns & export
  const districtCols: ExportColumn<DistrictMetric>[] = [
    { header: 'District', accessor: 'district' },
    { header: 'State', accessor: 'state' },
    { header: 'SSL Lights', accessor: (d) => num(d.ssl) },
    { header: '70MW SRT Sites', accessor: (d) => num(d.srt70) },
    { header: 'SWP Pumps', accessor: (d) => num(d.swp) },
    { header: 'Capacity (kW)', accessor: (d) => num(d.capacityKw) },
    { header: 'DLE Partners', accessor: (d) => String(d.dles) },
    { header: 'Operational Status', accessor: 'status' },
  ];

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((column, index) => ({
      key: `${column.header}-${index}`,
      label: column.header,
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const escapeExportValue = (value: unknown) => String(value ?? '');
  const getExportValue = <T,>(row: T, column: ExportColumn<T>) =>
    typeof column.accessor === 'function'
      ? column.accessor(row)
      : (row as Record<string, unknown>)[column.accessor as string];

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

  const exportToCSV = <T,>(data: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const csvRows = [
      columns.map((column) => column.header),
      ...data.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = csvRows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(data: T[], columns: ExportColumn<T>[]) => {
    if (!data.length || !columns.length) return;
    const textToCopy = [
      columns.map((column) => column.header).join('\t'),
      ...data.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const exportToExcel = <T,>(data: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(data: T[], columns: ExportColumn<T>[], title: string) => {
    if (!data.length || !columns.length) return;
    const pdfRows = data.map((row) => columns.map((column) => escapeHtml(escapeExportValue(getExportValue(row, column)))));
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${pdfRows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const stamp = new Date().toISOString().slice(0, 10);

  // Scheme list filtered by category
  const filteredSchemes = useMemo(() => {
    if (selectedSchemeCategory === 'All') return stateData.schemes;
    return stateData.schemes.filter((s) => s.category === selectedSchemeCategory);
  }, [stateData.schemes, selectedSchemeCategory]);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--ax-bg-surface, #ffffff)',
            color: 'var(--ax-text-strong)',
            border: '1px solid var(--ax-viz-emerald)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            padding: '10px 18px',
            borderRadius: 'var(--ax-radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 'var(--ax-text-sm)',
          }}
        >
          <span style={{ color: 'var(--ax-viz-emerald)', display: 'inline-flex', alignItems: 'center' }}>
            {I_CHECK}
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ════════════ 1. Page Header (Standard Template Layout) ════════════ */}
      <PageHead
        title={`${stateData.name} State Operations Portal`}
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {stateData.officialHeading} · {stateData.nodalAgency} · Real-time Operational Tracking
          </span>
        }
        breadcrumbs={[
          { label: 'Command Center', href: '/dashboard' },
          { label: 'Territory Operations', href: '/dashboard' },
          { label: `${stateData.name} Project Hub` },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              {I_ARROW_LEFT}
              <span className="ax-btn__label">Command Center</span>
            </Link>

            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              title="Refresh State Telemetry"
              aria-label="Refresh telemetry"
              onClick={() => showToast(`${stateData.name} telemetry updated successfully`)}
            >
              {I_REFRESH}
            </button>

            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => setAddComplaintScheme('SWP')}
            >
              {I_PLUS}
              <span className="ax-btn__label">Log Ticket</span>
            </button>
          </div>
        }
      />

      {/* ════════════ 2. Operational Filter Bar (Standard Clean Spacing) ════════════ */}
      <div className="ax-dash-grid">
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="State Operations Filters"
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--ax-radius-lg)',
            border: '1px solid var(--ax-border)',
            background: 'var(--ax-bg-surface)',
          }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb, 47, 125, 242), 0.08)',
                  borderRadius: 'var(--ax-radius-pill, 999px)',
                  border: '1px solid rgba(var(--ax-accent-rgb, 47, 125, 242), 0.18)',
                  flexShrink: 0,
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              {/* State Filter dropdown */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="state-filter-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  State:
                </label>
                <select
                  id="state-filter-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={stateData.id}
                  onChange={(e) => navigate(`/state/${e.target.value}`)}
                >
                  {AVAILABLE_STATES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheme Category Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="cat-filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  Scheme Category:
                </label>
                <select
                  id="cat-filter"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedSchemeCategory}
                  onChange={(e) => setSelectedSchemeCategory(e.target.value)}
                >
                  <option value="All">All Categories (8 Schemes)</option>
                  <option value="Grid-Connected">Grid-Connected (SRT & 70MW)</option>
                  <option value="Off-Grid & Agri">Off-Grid & Agri (SWP & SHL)</option>
                  <option value="Street Lighting">Street Lighting (SSL)</option>
                  <option value="Storage & BOOT">Storage & BOOT (Resco & BESS)</option>
                </select>
              </div>

              {/* District Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="dist-filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  District:
                </label>
                <select
                  id="dist-filter"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                >
                  <option value="All">All Districts ({stateData.districts.length})</option>
                  {stateData.districts.map((d) => (
                    <option key={d.id} value={d.district}>
                      {d.district}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedSchemeCategory !== 'All' || selectedDistrictFilter !== 'All') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => {
                    setSelectedSchemeCategory('All');
                    setSelectedDistrictFilter('All');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(stateData.kpis.totalUnits)}</b> Commissioned Assets · Capacity: <b style={{ color: 'var(--ax-accent)' }}>{stateData.kpis.capacityMw} MW</b>
              </span>
            </div>
          </div>
        </section>

        {/* ════════════ 3. Executive Welcome Banner (1:1 with DLEDashboard ax-welcome) ════════════ */}
        <section
          className="ax-card ax-welcome ax-col--12"
          role="region"
          aria-label="State Government Project Overview"
        >
          <div className="ax-welcome__body" style={{ gap: '16px' }}>
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">{stateData.nodalAgency}</p>
              <h2 className="ax-card__title" style={{ margin: '4px 0 6px' }}>{stateData.officialHeading}</h2>
              <p className="ax-welcome__lede" style={{ margin: 0 }}>
                Centralized monitoring for <b>{stateData.name} State</b>: <b>{num(stateData.kpis.totalUnits)} solar assets</b> commissioned across <b>{stateData.districts.length} active districts</b> with <b>{stateData.kpis.capacityMw} MW</b> clean capacity and <b>{stateData.kpis.activeDles} verified DLE partner teams</b>.
              </p>
            </div>

            <dl className="ax-welcome__stats" style={{ margin: 0 }}>
              <div className="ax-welcome__stat">
                <dt>Total Commissioned</dt>
                <dd className="ax-num">{num(stateData.kpis.totalUnits)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>All Schemes Deployed</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Total Capacity</dt>
                <dd className="ax-num">{stateData.kpis.capacityMw} <small style={{ fontSize: '11px', fontWeight: 600 }}>MW</small></dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>Clean Energy Grid</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Field Partners</dt>
                <dd className="ax-num">{stateData.kpis.activeDles}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>Active DLE Teams</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>AMC Compliance</dt>
                <dd className="ax-num">{stateData.kpis.amcHealth}%</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>SLA Health Index</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ════════════ 4. The 7 Core Metric KPI Counters (Exact Reference Numbers) ════════════ */}
        <KpiCard
          icon={I_PLUG}
          tone="cyan"
          label="On Grid"
          value={num(stateData.kpis.onGrid)}
          unit="Sites"
          sub="Grid Interactive"
          spark={[0, 0, 1, 0, 0, 0]}
        />

        <KpiCard
          icon={I_BATTERY}
          tone="violet"
          label="Power Pack"
          value={num(stateData.kpis.powerPack)}
          unit="Units"
          sub="BESS Storage"
          spark={[0, 1, 0, 0, 1, 0]}
        />

        <KpiCard
          icon={I_SUN}
          tone="emerald"
          label="SRT (Solar Rooftop)"
          value={num(stateData.kpis.srt)}
          unit="Sites"
          sub="Rooftop Subsidized"
          badge="+8.4%"
          spark={[45, 48, 52, 56, 58, 61]}
        />

        <KpiCard
          icon={I_PUMP}
          tone="accent"
          label="SWP (Irrigation Pump)"
          value={num(stateData.kpis.swp)}
          unit="Pumps"
          sub="PM-KUSUM Agri Feeder"
          badge="+14.2%"
          spark={[520, 560, 610, 645, 665, 681]}
        />

        <KpiCard
          icon={I_LAMP}
          tone="cyan"
          label="SSL (Street Light)"
          value={num(stateData.kpis.ssl)}
          unit="Lights"
          sub="Gram Panchayat Dusk-to-Dawn"
          badge="High Volume"
          spark={[12400, 13200, 14100, 14800, 15150, 15385]}
        />

        <KpiCard
          icon={I_HOME}
          tone="amber"
          label="SHL (Home Lighting)"
          value={num(stateData.kpis.shl)}
          unit="Kits"
          sub="Remote Hamlet DC kits"
          spark={[0, 0, 1, 0, 0, 0]}
        />

        <KpiCard
          icon={I_BOLT}
          tone="red"
          label="70MW SRT"
          value={num(stateData.kpis.srt70mw)}
          unit="Sites"
          sub="Mega Distributed Rooftop"
          badge="Flagship"
          spark={[2100, 2400, 2650, 2890, 3010, 3086]}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Total Installed"
          value={num(stateData.kpis.totalUnits)}
          unit="Assets"
          sub="All State Schemes Combined"
          badge="Verified"
          spark={[15000, 16200, 17400, 18300, 18900, 19213]}
        />

        {/* ════════════ 5. The 8 Scheme Action Hub Tiles (Clean Template Design) ════════════ */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-1)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operational Scheme Directory
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                State Solar Project Schemes ({filteredSchemes.length} of 8 Schemes)
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              State Authority: <b>{stateData.nodalAgency.split('(')[0]}</b>
            </span>
          </div>
        </div>

        {/* 8 Clean Scheme Cards (2 rows x 4 columns) */}
        {filteredSchemes.map((scheme) => {
          const t = TONE[scheme.tone];
          return (
            <div
              key={scheme.id}
              className="ax-card scheme-tile ax-col--3"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--ax-radius-lg)',
                border: '1px solid var(--ax-border)',
                background: 'var(--ax-bg-surface)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Header: Icon + Titles + Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--ax-radius-md)',
                        background: t.bg,
                        color: t.fg,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {scheme.icon}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', fontWeight: 700, color: 'var(--ax-text-strong)', lineHeight: 1.25 }}>
                        {scheme.name}
                      </h4>
                      <small style={{ fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                        {scheme.shortCode}
                      </small>
                    </div>
                  </div>

                  <span
                    className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
                    style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', flexShrink: 0 }}
                  >
                    {scheme.status}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minHeight: 32, lineHeight: 1.4 }}>
                  {scheme.tagline}
                </p>

                {/* Numbers row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--ax-radius-md)',
                    background: 'var(--ax-surface-subtle)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--ax-text-muted)', display: 'block', fontWeight: 500 }}>
                      Installed Sites
                    </span>
                    <span className="ax-num" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      {num(scheme.count)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--ax-text-muted)', display: 'block', fontWeight: 500 }}>
                      Capacity
                    </span>
                    <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, color: t.fg }}>
                      {scheme.capacity}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                    <span>SLA Compliance</span>
                    <b className="ax-num" style={{ color: t.fg }}>{scheme.progress}%</b>
                  </div>
                  <div className="ax-progress ax-progress--sm">
                    <div className="ax-progress__track">
                      <div className="ax-progress__fill" style={{ width: `${scheme.progress}%`, background: t.fg }} />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 4 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, fontSize: '11px', height: 28 }}
                    onClick={() => setSelectedSchemeModal(scheme)}
                  >
                    View Sites
                  </button>
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{ flex: 1, fontSize: '11px', height: 28 }}
                    onClick={() => {
                      if (scheme.route) navigate(scheme.route);
                      else showToast(`Opening ${scheme.name} records workspace`);
                    }}
                  >
                    Manage Hub →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ════════════ 6. Complaints & Field AMC Desk (DLE Dashboard Style) ════════════ */}
        <section
          className="ax-card ax-col--12"
          role="region"
          aria-label="Complaints & Field AMC Desk"
        >
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-viz-emerald)' }}>
                Field Service & Maintenance
              </span>
              <h3 className="ax-card__title">State Complaints & AMC Operations Desk</h3>
              <p className="ax-card__subtitle">
                Field breakdown tickets, warranty claims, and solar asset resolution tracking across {stateData.name}
              </p>
            </div>
            <div className="ax-card__actions">
              <button
                type="button"
                className="ax-btn ax-btn--sm ax-btn--primary"
                onClick={() => setAddComplaintScheme('SWP')}
              >
                {I_PLUS} <span className="ax-btn__label">Log Service Ticket</span>
              </button>
            </div>
          </div>

          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {stateData.complaints.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--ax-radius-md)',
                  border: '1px solid var(--ax-border)',
                  background: 'var(--ax-surface-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      {c.title}
                    </span>
                    <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '10px' }}>
                      {c.code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0' }}>
                    <span className="ax-num" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ax-viz-emerald)' }}>
                      {num(c.resolved)}
                    </span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Resolved</span>
                    <span style={{ color: 'var(--ax-border)', margin: '0 2px' }}>/</span>
                    <span className="ax-num" style={{ fontSize: '1.35rem', fontWeight: 700, color: c.pending > 0 ? 'var(--ax-viz-red)' : 'var(--ax-text-muted)' }}>
                      {num(c.pending)}
                    </span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Pending</span>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                      <span>Resolution Efficiency</span>
                      <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{c.rate}%</b>
                    </div>
                    <div className="ax-progress ax-progress--sm">
                      <div className="ax-progress__track">
                        <div className="ax-progress__fill" style={{ width: `${c.rate}%`, background: 'var(--ax-viz-emerald)' }} />
                      </div>
                    </div>
                  </div>

                  <small style={{ display: 'block', fontSize: '11px', color: 'var(--ax-text-subtle)', marginTop: 8 }}>
                    {c.statusNote}
                  </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--ax-border)' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ height: 26, fontSize: '11px', padding: '0 8px' }}
                    onClick={() => setAddComplaintScheme(c.code)}
                  >
                    <span style={{ marginRight: 4, display: 'inline-flex' }}>{I_PLUS}</span> Add Complaint
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* ════════════ 7. District Wise Asset Distribution Table (With Search, Toolbar, Pagination) ════════════ */}
        <section
          className="ax-card ax-col--8"
          role="region"
          aria-label="District Wise Asset Data"
          style={{
            padding: 0,
            borderRadius: 'var(--ax-radius-lg)',
            border: '1px solid var(--ax-border)',
            background: 'var(--ax-bg-surface)',
            overflow: 'hidden',
          }}
        >
          <div className="ax-card__header" style={{ padding: '14px 18px 12px' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Allocation</span>
              <h2 className="ax-card__title">District Wise Asset Allocation</h2>
              <p className="ax-card__subtitle">
                Solar asset counts and capacity across districts of {stateData.name} ({tableDistricts.length} districts)
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                <SearchInput
                  value={districtQuery}
                  onChange={setDistrictQuery}
                  placeholder="Search district..."
                  ariaLabel="Search districts"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `${stateData.name}_District_Assets_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `${stateData.name}_District_Assets_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `${stateData.name} District Assets`)}
                  columns={districtToolbarColumns}
                  onToggleColumn={(key) =>
                    setHiddenDistrictColumns((prev) =>
                      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">SSL Lights</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">70MW SRT</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">SWP Pumps</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Capacity</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">DLEs</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr key={d.id} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      {d.district}
                    </td>
                    <td className="ax-table__td">
                      <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                        {d.state}
                      </span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(d.ssl)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(d.srt70)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(d.swp)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)', fontWeight: 600 }}>
                      {(d.capacityKw / 1000).toFixed(1)} MW
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">{d.dles}</td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <span
                        className="ax-badge ax-badge--soft ax-badge--pill"
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: d.status === 'Operational' ? 'var(--ax-viz-emerald)' : 'var(--ax-viz-cyan)',
                          background: d.status === 'Operational' ? 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)' : 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)',
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No matching district records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border)', padding: '10px 18px' }}>
            <div className="state-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>

        {/* ════════════ 8. Side Column: Commissioning Velocity Chart + Solar Mission Quote ════════════ */}
        <section
          className="ax-card ax-col--4"
          role="region"
          aria-label="Commissioning Velocity"
        >
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Velocity Trend</span>
              <h3 className="ax-card__title" style={{ fontSize: 'var(--ax-text-base)' }}>Commissioning Pace</h3>
              <p className="ax-card__subtitle">Monthly installations vs inspections (2026)</p>
            </div>
          </div>

          <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <Suspense fallback={<div className="ax-skeleton" style={{ height: 210 }} />}>
                <ApexChart
                  type="area"
                  height={210}
                  legend="none"
                  ariaLabel="Commissioning velocity"
                  series={[
                    { name: 'Installations', data: [120, 190, 260, 310, 420, 480, 560, 680, 740, 890] },
                    { name: 'Inspections', data: [95, 160, 220, 280, 390, 440, 510, 630, 710, 850] },
                  ]}
                  apex={{
                    colors: [LIGHT_BLUE, LIGHT_GREEN],
                    stroke: { curve: 'smooth', width: 1.5 },
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
                    },
                    xaxis: {
                      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                      labels: { style: { fontSize: '10px' } },
                    },
                  }}
                />
              </Suspense>

              <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-3)', marginTop: 8 }}>
                <span className="ax-cluster" style={{ gap: '6px' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: LIGHT_BLUE }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installations</small>
                </span>
                <span className="ax-cluster" style={{ gap: '6px' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: LIGHT_GREEN }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Inspections Passed</small>
                </span>
              </div>
            </div>

            {/* Hindi Solar Quote Card from Reference (Clean Corporate Style - No Flashy Overlays) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--ax-radius-md)',
                background: 'var(--ax-surface-subtle)',
                border: '1px solid var(--ax-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--ax-accent)', display: 'inline-flex', alignItems: 'center' }}>
                    {I_SUN}
                  </span>
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    {showHindiQuote ? 'सौर ऊर्जा: प्राकृतिक संसाधनों का उत्तम उपयोग' : 'Solar Energy: Sustainable Resources'}
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 22, fontSize: '10px', padding: '0 6px' }}
                  onClick={() => setShowHindiQuote(!showHindiQuote)}
                >
                  {showHindiQuote ? 'English' : 'हिंदी'}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '11px', color: 'var(--ax-text-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>
                {showHindiQuote
                  ? 'ऊर्जा स्वतंत्रता की दिशा में एक महत्वपूर्ण कदम बढ़ाने में सहायक हो रहे हैं। सौर ऊर्जा एक सुरक्षित, सामर्थ्यशाली, और अग्रणी ऊर्जा स्रोत है जो हमें विकास के मार्ग पर ले जाता है और हमारे पर्यावरण को संरक्षित रखने में मदद करता है।'
                  : 'Empowering the nation towards clean energy independence. Solar power is a safe, sustainable, and pioneering resource guiding sustainable progress while safeguarding our ecological future.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--ax-border)', paddingTop: 6 }}>
                <small style={{ fontSize: '10px', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>
                  KLK Ventures Pvt Ltd · Clean Tech Hub
                </small>
                <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '9px' }}>
                  State Mission
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ 9. Clean Status Footer Bar ════════════ */}
        <div className="ax-col--12">
          <footer
            className="ax-card ax-card--flat"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: 'var(--ax-radius-lg)',
              border: '1px solid var(--ax-border)',
              background: 'var(--ax-bg-surface)',
              fontSize: 'var(--ax-text-xs)',
              color: 'var(--ax-text-muted)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              Copyright © 2026 KLK ERP — By <strong style={{ color: 'var(--ax-accent)' }}>ETS NETWORKS</strong>. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>Territory: <b style={{ color: 'var(--ax-text-strong)' }}>{stateData.name} ({stateData.code})</b></span>
              <span style={{ color: 'var(--ax-border)' }}>•</span>
              <span>Discom: <b style={{ color: 'var(--ax-text-strong)' }}>{stateData.discom.split('(')[0].trim()}</b></span>
              <span style={{ color: 'var(--ax-border)' }}>•</span>
              <span style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ax-viz-emerald)', display: 'inline-block' }} />
                Live Grid Active
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* ════════════ Modal: Add Service Ticket ════════════ */}
      {addComplaintScheme && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 480,
              borderRadius: 'var(--ax-radius-lg)',
              background: 'var(--ax-bg-surface)',
              border: '1px solid var(--ax-border)',
              boxShadow: 'var(--ax-shadow-lg)',
              padding: 'var(--ax-space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-3)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: 0 }}>
                  Register Service Ticket
                </h3>
                <small style={{ color: 'var(--ax-text-muted)' }}>
                  State: {stateData.name} · Scheme: {addComplaintScheme}
                </small>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setAddComplaintScheme(null)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast(`Ticket registered for ${addComplaintScheme} in ${stateData.name}`);
                setAddComplaintScheme(null);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}
            >
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-strong)', display: 'block', marginBottom: 4 }}>
                  Consumer No / Site Asset ID *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. JM-SSL-2026-9481"
                  className="ax-input"
                  style={{ width: '100%', height: 34, fontSize: 'var(--ax-text-xs)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-strong)', display: 'block', marginBottom: 4 }}>
                    District *
                  </label>
                  <select className="ax-input" style={{ width: '100%', height: 34, fontSize: 'var(--ax-text-xs)' }}>
                    {stateData.districts.map((d) => (
                      <option key={d.id} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-strong)', display: 'block', marginBottom: 4 }}>
                    Priority *
                  </label>
                  <select className="ax-input" style={{ width: '100%', height: 34, fontSize: 'var(--ax-text-xs)' }}>
                    <option value="high">High (24h SLA)</option>
                    <option value="medium">Medium (48h SLA)</option>
                    <option value="critical">Critical Outage</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-strong)', display: 'block', marginBottom: 4 }}>
                  Problem Description *
                </label>
                <textarea
                  required
                  rows={3}
                  className="ax-input"
                  placeholder="Describe failure details (e.g., Inverter code, dusk sensor issue, battery voltage low)..."
                  style={{ width: '100%', fontSize: 'var(--ax-text-xs)', resize: 'none', padding: '6px 8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ax-space-2)', marginTop: 4 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setAddComplaintScheme(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ Modal: View Scheme Sites ════════════ */}
      {selectedSchemeModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 620,
              borderRadius: 'var(--ax-radius-lg)',
              background: 'var(--ax-bg-surface)',
              border: '1px solid var(--ax-border)',
              boxShadow: 'var(--ax-shadow-lg)',
              padding: 'var(--ax-space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-3)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: 0 }}>
                  {selectedSchemeModal.name} ({selectedSchemeModal.code}) Sites
                </h3>
                <small style={{ color: 'var(--ax-text-muted)' }}>
                  State: {stateData.name} · Total Installed: {num(selectedSchemeModal.count)} Sites ({selectedSchemeModal.capacity})
                </small>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setSelectedSchemeModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
              <table className="ax-table ax-table--hover" style={{ fontSize: 'var(--ax-text-xs)' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th">Site ID</th>
                    <th className="ax-table__th">Location</th>
                    <th className="ax-table__th ax-table__th--num">Capacity</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="ax-table__td" style={{ fontWeight: 600 }}>{stateData.code}-{selectedSchemeModal.code}-01</td>
                    <td className="ax-table__td">Govt Complex, {stateData.name} Central</td>
                    <td className="ax-table__td ax-table__td--num ax-num">5.0 kW</td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontSize: '10px' }}>Verified</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="ax-table__td" style={{ fontWeight: 600 }}>{stateData.code}-{selectedSchemeModal.code}-02</td>
                    <td className="ax-table__td">Community Health Centre, Samba</td>
                    <td className="ax-table__td ax-table__td--num ax-num">10.0 kW</td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontSize: '10px' }}>Verified</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="ax-table__td" style={{ fontWeight: 600 }}>{stateData.code}-{selectedSchemeModal.code}-03</td>
                    <td className="ax-table__td">Block Development Office, Kathua</td>
                    <td className="ax-table__td ax-table__td--num ax-num">3.3 kW</td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '10px' }}>In Transit</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ax-space-2)', marginTop: 'var(--ax-space-4)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedSchemeModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => {
                  setSelectedSchemeModal(null);
                  if (selectedSchemeModal.route) navigate(selectedSchemeModal.route);
                  else showToast(`Navigating to ${selectedSchemeModal.name} records`);
                }}
              >
                Open Full Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StateProjectDashboard;
