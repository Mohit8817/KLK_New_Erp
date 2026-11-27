import { lazy, Suspense, useEffect, useMemo, useState, useDeferredValue } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHead } from '../shell/PageHead';
import { Pagination, usePagination, TableExportToolbar, TableEmptyState, type ExportColumn } from '../../common';
import { SearchInput } from '../../common/search/SearchInput';
import { useAuth } from '../../context/AuthContext';
import { useVPortalPermissions } from '../../services/vPortalPermissionsService';
import { normState } from '../../services/stateAccess';

/* ───────── Dashboard UI blocks (ULA design) ───────── */
const ApexChart = lazy(() => import('../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const useIsMobile = (breakpoint = 640) => {
  const get = () => typeof window !== 'undefined' && window.innerWidth < breakpoint;
  const [m, setM] = useState(get);
  useEffect(() => {
    const onResize = () => setM(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return m;
};

/* ───────── Layout CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: max-content; max-width: 55%; }
  .solar-erp-page .ax-card__title {
    max-width: none; white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { word-break: normal; overflow-wrap: normal; line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 1 1 0; min-width: 0; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important; min-width: 0; width: 100%; justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 120px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export"] .ax-btn { padding-inline: 8px; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--sm { min-width: 540px; }
  .solar-erp-page .ula-table--md { min-width: 720px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  @media (min-width: 641px) {
    .solar-erp-page .ax-card__actions .ax-export-toolbar { width: auto; }
  }
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn span:not([class*="icon"]),
    .solar-erp-page .ax-card__actions [class*="export"] .ax-btn span:not([class*="icon"]) { display: none; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 130px; }
  }
  @media (max-width: 480px) {
    .solar-erp-page .ax-card__header { flex-wrap: wrap; }
    .solar-erp-page .ax-card__titles { min-width: 0; max-width: 100%; flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions { flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-start; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const sectionHeadStyle = { margin: 'var(--ax-space-3) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' } as const;

/* ───────── KPI card ───────── */
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
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {ARROW_UP} {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
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
                  apex={{ yaxis: { min: 0, forceNiceScale: true }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } } }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Progress bar ───────── */
function WelcomeBanner({
  ariaLabel, eyebrow, title, lede, stats,
}: {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  lede: ReactNode;
  stats: { label: string; value: string; sub: string; color: string }[];
}) {
  return (
    <section className="ax-card ax-welcome ax-col--12" role="region" aria-label={ariaLabel}>
      <div className="ax-welcome__body">
        <div className="ax-welcome__text">
          <p className="ax-welcome__eyebrow">{eyebrow}</p>
          <h2 className="ax-card__title">{title}</h2>
          <p className="ax-welcome__lede">{lede}</p>
        </div>
        <dl className="ax-welcome__stats">
          {stats.map((s) => (
            <div key={s.label} className="ax-welcome__stat">
              <dt>{s.label}</dt>
              <dd className="ax-num">{s.value}</dd>
              <small style={{ fontSize: 'var(--ax-text-xs)', color: s.color }}>{s.sub}</small>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ───────── Monthly trend (8 col) ───────── */
function StatusDonutCard({
  eyebrow, title, totalLabel, total, labels, series, colors, items, donutH,
}: {
  eyebrow: string;
  title: string;
  totalLabel: string;
  total: number;
  labels: string[];
  series: number[];
  colors: string[];
  items: { label: string; sub: string; v: number; color: string }[];
  donutH: number;
}) {
  return (
    <section className="ax-card ax-col--4" role="region" aria-label={title}>
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">{eyebrow}</span>
          <h2 className="ax-card__title">{title}</h2>
          <p className="ax-card__subtitle">Total {num(total)} {totalLabel}</p>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0 }}>
        <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
          <ApexChart
            key={`donut-${donutH}-${series.join('-')}`}
            type="donut"
            height={donutH}
            legend="none"
            ariaLabel={title}
            series={series}
            apex={{
              labels,
              colors,
              stroke: { width: 0 },
              plotOptions: {
                pie: {
                  donut: {
                    size: '72%',
                    labels: {
                      show: true,
                      name: { fontFamily: cv('--ax-font-sans') },
                      value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                      total: { show: true, label: totalLabel, formatter: () => num(total) },
                    },
                  },
                },
              },
            }}
          />
        </Suspense>
        <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
          {items.map((s) => (
            <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
              <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
              <span className="ax-list__content">
                <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
              </span>
              <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── District stacked bar (8 col) ───────── */
const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
  if (typeof column.accessor === 'function') return (column.accessor as any)(row);
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

const exportToCSV = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
  if (!dataToExport.length || !columns.length) return;
  const rows = [
    columns.map((c) => c.header ?? c.label ?? ''),
    ...dataToExport.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c)))),
  ];
  const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
};

const copyToClipboard = async <T,>(dataToCopy: T[], columns: ExportColumn<T>[]) => {
  if (!dataToCopy.length || !columns.length) return;
  const text = [
    columns.map((c) => c.header ?? c.label ?? '').join('\t'),
    ...dataToCopy.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
};

const exportToExcel = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
  if (!dataToExport.length || !columns.length) return;
  const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${dataToExport.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
  downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
};

const exportToPDF = <T,>(dataToExport: T[], columns: ExportColumn<T>[], title: string) => {
  if (!dataToExport.length || !columns.length) return;
  const rows = dataToExport.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
    th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
  </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
  w.document.close();
  w.focus();
};

const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
  columns.map((c, i) => ({ key: `${c.header}-${i}`, label: c.header ?? c.label ?? '', visible: !hidden.includes(`${c.header}-${i}`) }));

const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
  columns.filter((c, i) => !hidden.includes(`${c.header}-${i}`));

const toggleIn = (setter: Dispatch<SetStateAction<string[]>>) => (key: string) =>
  setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));








const ICON_EYE = (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);

const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_CLOCK = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_X = svg(<><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></>);

interface WorkOrder {
  id: string;
  site: string;
  state: string;
  district: string;
  module: string;
  technician: string;
  status: 'In Progress' | 'Verified' | 'Commissioned' | 'Pending Survey' | 'Resolved';
  date: string;
  to: string;
}

interface StateOverview {
  state: string;
  totalSites: number;
  activeInstallations: number;
  surveysDone: number;
  amcUnits: number;
  complaints: number;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-8821', site: '70MW SRT Central Sub-station', state: 'Jammu & Kashmir', district: 'JAMMU', module: 'Installation (70MW)', technician: 'Ramesh Sharma', status: 'In Progress', date: '17-10-2026', to: '/jammu/installation/srt-70mw/dashboard' },
  { id: 'WO-8820', site: 'SSL Solar Feeder Line 4', state: 'Uttar Pradesh', district: 'LUCKNOW', module: 'AMC Maintenance', technician: 'Vikas Maurya', status: 'Verified', date: '17-10-2026', to: '/up/amc/ssl/view-assign-light' },
  { id: 'WO-8819', site: 'SWP Pump Station Block C', state: 'Assam', district: 'KAMRUP', module: 'Installation (SWP)', technician: 'Barun Das', status: 'Commissioned', date: '16-10-2026', to: '/assam/swp/dashboard' },
  { id: 'WO-8818', site: 'Kusum C Solar Farm Unit 2', state: 'Uttar Pradesh', district: 'VARANASI', module: 'Installation (Kusum C)', technician: 'Sunil Verma', status: 'Pending Survey', date: '16-10-2026', to: '/up/installation/kusum-c/dashboard' },
  { id: 'WO-8817', site: 'Resco Site Phase-3', state: 'Jammu & Kashmir', district: 'SRINAGAR', module: 'Survey (Resco)', technician: 'Anil Kumar', status: 'Verified', date: '15-10-2026', to: '/jammu/survey/resco/view-survey' },
  { id: 'WO-8816', site: 'SSL High Mast 18W', state: 'Uttar Pradesh', district: 'KANPUR', module: 'AMC (18W)', technician: 'Pradeep Yadav', status: 'Commissioned', date: '15-10-2026', to: '/up/amc/ssl-18w/view-assign-light' },
  { id: 'WO-8815', site: 'SRLM SRT Cluster 9', state: 'Uttar Pradesh', district: 'AYODHYA', module: 'Complaints', technician: 'Deepak Singh', status: 'In Progress', date: '14-10-2026', to: '/up/complaint/srlmsrt/add-complaint' },
  { id: 'WO-8814', site: 'SWP Agriculture Feeder 2', state: 'Assam', district: 'DIBRUGARH', module: 'Installation (SWP)', technician: 'Manoj Bora', status: 'Verified', date: '14-10-2026', to: '/assam/swp/installation-site' },
  { id: 'WO-8813', site: '70MW SRT Field Unit 11', state: 'Jammu & Kashmir', district: 'UDHAMPUR', module: 'Expenses', technician: 'Rajeev Raina', status: 'Resolved', date: '13-10-2026', to: '/jammu/installation-expenses/srt-70mw/view-expenses' },
  { id: 'WO-8812', site: 'Resco Commercial Rooftop', state: 'Uttar Pradesh', district: 'AGRA', module: 'Survey (Resco)', technician: 'Mahesh Pandey', status: 'Commissioned', date: '12-10-2026', to: '/up/survey/resco/view-resco' },
];

const ALL_STATE_SUMMARIES: StateOverview[] = [
  { state: 'Uttar Pradesh', totalSites: 1120, activeInstallations: 580, surveysDone: 340, amcUnits: 240, complaints: 28 },
  { state: 'Bihar', totalSites: 940, activeInstallations: 480, surveysDone: 310, amcUnits: 210, complaints: 16 },
  { state: 'Punjab', totalSites: 860, activeInstallations: 430, surveysDone: 210, amcUnits: 160, complaints: 8 },
  { state: 'Jammu & Kashmir', totalSites: 980, activeInstallations: 520, surveysDone: 310, amcUnits: 190, complaints: 14 },
  { state: 'Assam', totalSites: 745, activeInstallations: 320, surveysDone: 242, amcUnits: 103, complaints: 6 },
  { state: 'Karnataka', totalSites: 680, activeInstallations: 290, surveysDone: 180, amcUnits: 95, complaints: 7 },
  { state: 'Goa', totalSites: 420, activeInstallations: 190, surveysDone: 130, amcUnits: 80, complaints: 4 },
  { state: 'Arunachal Pradesh', totalSites: 510, activeInstallations: 240, surveysDone: 150, amcUnits: 70, complaints: 5 },
  { state: 'Kashmir', totalSites: 590, activeInstallations: 270, surveysDone: 190, amcUnits: 110, complaints: 9 },
];

const STATE_OPTIONS: { code: string; name: string; label: string }[] = [
  { code: 'up', name: 'Uttar Pradesh', label: 'Uttar Pradesh (UP)' },
  { code: 'bihar', name: 'Bihar', label: 'Bihar' },
  { code: 'jammu', name: 'Jammu & Kashmir', label: 'Jammu & Kashmir (J&K)' },
  { code: 'kashmir', name: 'Kashmir', label: 'Kashmir' },
  { code: 'assam', name: 'Assam', label: 'Assam' },
  { code: 'karnataka', name: 'Karnataka', label: 'Karnataka' },
  { code: 'punjab', name: 'Punjab', label: 'Punjab' },
  { code: 'arunachal', name: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { code: 'goa', name: 'Goa', label: 'Goa' },
];

const STATUS_BADGE: Record<WorkOrder['status'], string> = {
  'In Progress': 'ax-badge--info',
  Verified: 'ax-badge--success',
  Commissioned: 'ax-badge--success',
  'Pending Survey': 'ax-badge--warning',
  Resolved: 'ax-badge--neutral',
};

export function VPortalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile(640);
  const { permissions, refresh: refreshPermissions, isStatePermitted } = useVPortalPermissions();

  const [selectedState, setSelectedState] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');
  const [query, setQuery] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const vendorDisplayName = user?.name || user?.vendor_id || 'Vendor Partner';
  const refreshData = () => {
    setUpdatedAt(new Date());
    refreshPermissions();
  };

  // Only states where at least one operation is 1 in the permissions API
  const visibleStateOptions = useMemo(() => {
    return STATE_OPTIONS.filter((s) => isStatePermitted(s.code));
  }, [permissions, isStatePermitted]);

  const visibleStateSummaries = useMemo(() => {
    return ALL_STATE_SUMMARIES.filter((s) => isStatePermitted(normState(s.state)));
  }, [permissions, isStatePermitted]);

  /* ──────── Filtered Work Orders ──────── */
  const deferredQuery = useDeferredValue(query);
  const filteredOrders = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return INITIAL_WORK_ORDERS.filter((item) => {
      // Must be permitted state
      if (!isStatePermitted(normState(item.state))) return false;

      const matchState = selectedState === 'All' || item.state === selectedState;
      const matchModule = selectedModule === 'All' || item.module.toLowerCase().includes(selectedModule.toLowerCase());
      const matchQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.site.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.technician.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q);
      return matchState && matchModule && matchQuery;
    });
  }, [selectedState, selectedModule, deferredQuery, isStatePermitted]);

  const { paginatedData: pagedOrders, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredOrders, initialPageSize: 10 });

  useEffect(() => { setPage(1); }, [query, selectedState, selectedModule, setPage]);

  const tableColumns: ExportColumn<WorkOrder>[] = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Site & Project', accessor: 'site' },
    { header: 'State', accessor: 'state' },
    { header: 'Module', accessor: 'module' },
    { header: 'Assigned Lead', accessor: 'technician' },
    { header: 'Status', accessor: 'status' },
    { header: 'Date', accessor: 'date' },
  ];
  const toolbarColumns = makeToolbarColumns(tableColumns, hiddenColumns);
  const visibleTableColumns = visibleColumns(tableColumns, hiddenColumns);
  const stamp = new Date().toISOString().slice(0, 10);

  const filtersActive = selectedState !== 'All' || selectedModule !== 'All';

  // Overall KPIs
  const totalSites = 2845;
  const activeInstall = 1420;
  const verifiedSurveys = 892;
  const amcTotal = 533;
  const openComplaints = 48;
  const donutSeries = [activeInstall, verifiedSurveys, amcTotal, openComplaints];
  const donutTotal = donutSeries.reduce((a, b) => a + b, 0);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Vendor Dashboard (V-Portal)"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Vendor operations across states · Active field installations &amp; surveys — last updated {fmtTime(updatedAt)}
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> {visibleStateOptions.length} States Active
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={refreshData}>
              {ICON_REFRESH}
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* Filter bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="V-Portal Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)', borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="vp-state-select" style={labelStyle}>State:</label>
                <select id="vp-state-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                  <option value="All">All States ({visibleStateOptions.length})</option>
                  {visibleStateOptions.map((opt) => (
                    <option key={opt.code} value={opt.name}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="vp-module-select" style={labelStyle}>Module:</label>
                <select id="vp-module-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                  <option value="All">All Modules</option>
                  <option value="Installation">Installation System</option>
                  <option value="Survey">Survey Operations</option>
                  <option value="AMC">AMC Maintenance</option>
                  <option value="Complaints">Complaints &amp; Claims</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>

              {filtersActive && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => { setSelectedState('All'); setSelectedModule('All'); }}>
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{filteredOrders.length}</b> work orders · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{fmtDate(updatedAt)}</b>
              </span>
            </div>
          </div>
        </section>

        <WelcomeBanner
          ariaLabel="Vendor Overview"
          eyebrow="Vendor Management System (V-Portal) · State Hub"
          title="Welcome to Vendor Portal Dashboard"
          lede={
            <>
              Vendor overview for <b>{vendorDisplayName}</b>: <b>{num(totalSites)} sites</b> across <b>{visibleStateOptions.length} states</b> and <b>24 districts</b>.
              <b> {num(activeInstall)} (50%)</b> active installations with <b>{num(verifiedSurveys)}</b> field surveys completed.
            </>
          }
          stats={[
            { label: 'Total States', value: String(visibleStateOptions.length), sub: 'Active Permissions', color: 'var(--ax-viz-emerald)' },
            { label: 'Total Sites', value: num(totalSites), sub: 'Authorized Work Orders', color: 'var(--ax-accent)' },
            { label: 'Active Installs', value: num(activeInstall), sub: 'In Field Progress', color: 'var(--ax-viz-cyan)' },
            { label: 'Open Issues', value: num(openComplaints), sub: 'Claims & Complaints', color: 'var(--ax-viz-red)' },
          ]}
        />

       

        <KpiCard icon={I_PIN} tone="accent" label="Total States" value={String(visibleStateOptions.length)} sub={visibleStateOptions.map((s) => s.code.toUpperCase()).join(', ')}
          spark={[1, 2, 2, 3, 3, 3]} onClick={() => setSelectedState('All')} />
        <KpiCard icon={I_USERS} tone="cyan" label="Total Vendor Sites" value={num(totalSites)} unit="Sites" sub="Authorized projects"
          spark={[240, 480, 890, 1420, 2100, 2845]} onClick={() => setSelectedModule('All')} />
        <KpiCard icon={I_BOLT} tone="emerald" label="Active Installations" value={num(activeInstall)} unit="Units" sub="Solar installations active"
          badge="+18% SLA" spark={[120, 280, 540, 890, 1200, 1420]} onClick={() => setSelectedModule('Installation')} />
        <KpiCard icon={I_DONE} tone="cyan" label="Field Surveys Done" value={num(verifiedSurveys)} unit="Surveys" sub="Verified survey records"
          badge="94% Rate" spark={[80, 190, 340, 560, 780, 892]} onClick={() => setSelectedModule('Survey')} />
        <KpiCard icon={I_CLOCK} tone="amber" label="AMC Maintenance" value={num(amcTotal)} unit="Lights" sub="Active maintenance SLA"
          badge="100% SLA" spark={[40, 90, 180, 290, 410, 533]} onClick={() => setSelectedModule('AMC')} />
        <KpiCard icon={I_LIST} tone="accent" label="Today Dispatched" value="28" unit="Orders" sub="New work orders today"
          spark={[4, 8, 12, 18, 22, 28]} />
        <KpiCard icon={I_X} tone="red" label="Open Complaints" value={num(openComplaints)} unit="Issues" sub="Pending field claims"
          badge="-6 Resolved" spark={[65, 58, 54, 50, 48]} onClick={() => setSelectedModule('Complaints')} />
        <KpiCard icon={I_PIN} tone="violet" label="Contractor Districts" value="24" sub="Active execution zones"
          spark={[10, 14, 18, 20, 22, 24]} />

        {/* State chart (8) + status donut (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="State wise work order distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Distribution Analytics</span>
              <h2 className="ax-card__title">State-Wise Work Order Distribution</h2>
              <p className="ax-card__subtitle">{num(visibleStateSummaries.reduce((a, s) => a + s.totalSites, 0))} sites across {visibleStateSummaries.length} states</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, minHeight: chartH }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
              <ApexChart
                key={`state-${chartH}`}
                type="bar"
                height={chartH}
                legend="none"
                ariaLabel="Total sites per state"
                series={[{ name: 'Total Sites', data: visibleStateSummaries.map((s) => s.totalSites) }]}
                apex={{
                  colors: [LIGHT_BLUE, LIGHT_GREEN, LIGHT_AMBER, '#ef6a6a', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80', '#f43f5e'],
                  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%', distributed: true } },
                  dataLabels: { enabled: false },
                  xaxis: { categories: visibleStateSummaries.map((s) => s.state), labels: { style: { fontSize: '11px' } } },
                  yaxis: { min: 0, forceNiceScale: true, labels: { style: { fontSize: '11px' } } },
                  legend: { show: false },
                }}
              />
            </Suspense>
          </div>
        </section>

        <StatusDonutCard
          eyebrow="Status Breakdown"
          title="Operations Status Overview"
          totalLabel="Items"
          total={donutTotal}
          labels={['Active Install', 'Surveys Done', 'AMC Lights', 'Complaints']}
          series={donutSeries}
          colors={[LIGHT_GREEN, LIGHT_BLUE, LIGHT_AMBER, '#ef6a6a']}
          donutH={donutH}
          items={[
            { label: 'Active Install', sub: 'Solar installations active', v: donutSeries[0], color: LIGHT_GREEN },
            { label: 'Surveys Done', sub: 'Verified survey records', v: donutSeries[1], color: LIGHT_BLUE },
            { label: 'AMC Lights', sub: 'Maintenance SLA', v: donutSeries[2], color: LIGHT_AMBER },
            { label: 'Complaints', sub: 'Pending field claims', v: donutSeries[3], color: '#ef6a6a' },
          ]}
        />

        {/* State portals */}
        <div className="ax-col--12">
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <h4 style={sectionHeadStyle}>Integrated Regional Operations &amp; State Portals</h4>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">Contractor Mode: <b>Direct State Access</b></span>
          </div>
        </div>

        {visibleStateSummaries.map((st) => {
          const pct = Math.round((st.activeInstallations / st.totalSites) * 100);
          return (
            <section key={st.state} className="ax-card ax-col--3" role="region" aria-label={`${st.state} operations`}>
              <div className="ax-card__header">
                <div className="ax-card__titles" style={{ minWidth: 0 }}>
                  <span className="ax-card__eyebrow">Regional Operations</span>
                  <h2 className="ax-card__title">{st.state}</h2>
                </div>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{num(st.totalSites)} Sites</span>
              </div>
              <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Active Installations', v: st.activeInstallations, c: 'var(--ax-viz-emerald)' },
                  { l: 'Verified Surveys', v: st.surveysDone, c: 'var(--ax-viz-cyan)' },
                  { l: 'AMC Maintenance', v: st.amcUnits, c: 'var(--ax-viz-amber)' },
                  { l: 'Open Complaints', v: st.complaints, c: 'var(--ax-viz-red)' },
                ].map((r) => (
                  <div key={r.l} className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>{r.l}</span>
                    <b className="ax-num" style={{ color: r.c }}>{num(r.v)}</b>
                  </div>
                ))}
                <div>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Execution Progress</span>
                    <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{pct}%</span>
                  </div>
                  <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${pct}%`, background: 'var(--ax-accent)' }} /></div></div>
                </div>
              </div>
              <div className="ax-card__footer" style={footerStyle}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedState(st.state);
                    const n = normState(st.state);
                    if (n === 'up') navigate('/v/up/view-upssl');
                    else if (n === 'bihar') navigate('/v/ssl/installation-dashboard');
                    else if (n === 'punjab') navigate('/v/punjab/ssl/installation/dashboard');
                    else if (n === 'jammu') navigate('/jammu/installation/srt-70mw/dashboard');
                    else if (n === 'kashmir') navigate('/v/kashmir/srt/70mw/installation/dashboard');
                    else if (n === 'karnataka') navigate('/v/karnataka/installation/swp/dashboard');
                    else if (n === 'goa') navigate('/v/goa/vendor-srt-installation-dashboard');
                    else if (n === 'arunachal') navigate('/v/arunachal/shl/installation/dashboard');
                    else navigate('/assam/swp/dashboard');
                  }}
                >
                  <span className="ax-btn__label">Open {st.state} Modules →</span>
                </button>
              </div>
            </section>
          );
        })}

        {/* Work orders table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor work orders">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Dispatch Registry</span>
              <h2 className="ax-card__title">Vendor Work Orders &amp; Service Directory</h2>
              <p className="ax-card__subtitle">Total {filteredOrders.length} records matching current filter</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={query} onChange={setQuery} placeholder="Search work orders, site, tech…" size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredOrders, visibleTableColumns)}
                  onExportCSV={() => exportToCSV(filteredOrders, visibleTableColumns, `Vendor_Work_Orders_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredOrders, visibleTableColumns, `Vendor_Work_Orders_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredOrders, visibleTableColumns, 'Vendor Work Orders Report')}
                  columns={toolbarColumns}
                  onToggleColumn={toggleIn(setHiddenColumns)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md">
              <thead className="ax-table__head">
                <tr>
                  {visibleTableColumns.map((col) => (
                    <th key={col.header} className="ax-table__th" scope="col">{col.header}</th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={visibleTableColumns.length + 1} style={{ padding: 0 }}>
                    <TableEmptyState title="No work orders found" message="Try adjusting your filters or search." />
                  </td></tr>
                ) : (
                  pagedOrders.map((wo: WorkOrder) => (
                    <tr key={wo.id} className="ax-table__row">
                      {visibleTableColumns.map((col) => {
                        if (col.accessor === 'id') {
                          return <td key={col.header} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-bold)', color: 'var(--ax-accent)' }}>{wo.id}</td>;
                        }
                        if (col.accessor === 'status') {
                          return (
                            <td key={col.header} className="ax-table__td">
                              <span className={`ax-badge ax-badge--soft ${STATUS_BADGE[wo.status]}`} style={{ fontWeight: 600, padding: '2px 8px' }}>{wo.status}</span>
                            </td>
                          );
                        }
                        return <td key={col.header} className="ax-table__td">{(wo as any)[col.accessor as string]}</td>;
                      })}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Link to={wo.to} className="ax-btn ax-btn--secondary ax-btn--sm" style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}>
                          {ICON_EYE}
                          <span className="ax-btn__label">Open</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VPortalDashboard;