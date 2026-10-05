import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { ApexChart } from '../../../../charts/ApexChart';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../../common';
// DLE service: relative URL use karta hai -> Vite proxy API key/secret lagata hai
import { dleService, filterByCompanyStrict } from '../../../../../services/dleServices';

/* ───────────────────────── API CONFIG ─────────────────────────
 * FIELD_KEYS mein har field ke possible naam diye hain; jo pehla mile wahi use hoga.
 * Console mein "[ULA] first record" dekho aur zarurat ho to yahan naam badlo.
 */
const FIELD_KEYS = {
  ca: ['ca_no', 'ca_number', 'caNo', 'ca', 'consumer_number', 'consumer_no'],
  name: ['beneficiary_name', 'beneficiary', 'consumer_name', 'customer_name', 'name'],
  district: ['district', 'district_name', 'districtName'],
  surveyor: ['first_visit_surveyor', 'surveyor_name', 'surveyor', 'surveyorName', 'user_name', 'created_by_name'],
  surveyor2: ['second_visit_surveyor', 'surveyor_name2', 'second_surveyor_name', 'second_surveyor', 'surveyor2_name'],
  first: ['survey_date', 'first_visit_date', 'first_visit_at', 'first_visit_datetime', 'first_visit', 'visit1_date', 'first_visit_on'],
  second: ['second_visit_at', 'second_visit_date', 'second_visit_datetime', 'second_visit', 'visit2_date', 'second_visit_on'],
  firstFlag: ['first_visit_complete', 'first_visit_completed', 'is_first_visit_complete'],
  secondFlag: ['second_visit_complete', 'second_visit_completed', 'is_second_visit_complete'],
} as const;
/* ──────────────────────────────────────────────────────────── */

// Light shades for bar charts / donut
const LIGHT_BLUE = '#8DB8F8';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';

interface Rec { ca: string; name: string; district: string; surveyor: string; surveyor2: string; first: Date | null; second: Date | null; v1: boolean; v2: boolean }
interface Visit { key: string; ts: Date; type: '1st Visit' | '2nd Visit'; ca: string; name: string; district: string; surveyor: string }
interface DistrictRow { name: string; total: number; first: number; second: number; pending: number; today: number; pct: number }
interface SurveyorRow { name: string; first: number; second: number; total: number; today: number; districts: number; last: Date | null }

const pick = (o: any, keys: readonly string[]): any => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const isTrue = (v: any) =>
  v === true || v === 1 || ['true', '1', 'yes', 'completed', 'complete'].includes(String(v ?? '').trim().toLowerCase());

const parseDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/); // dd-mm-yyyy [hh:mm]
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const extractList = (j: any): any[] => {
  if (Array.isArray(j)) return j;
  for (const c of [j?.data, j?.data?.data, j?.data?.rows, j?.data?.list, j?.results, j?.records, j?.rows, j?.list]) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

const normalize = (raw: any): Rec => {
  const first = parseDate(pick(raw, FIELD_KEYS.first));
  const second = parseDate(pick(raw, FIELD_KEYS.second));
  const f1 = pick(raw, FIELD_KEYS.firstFlag);
  const f2 = pick(raw, FIELD_KEYS.secondFlag);
  // Flag mile to flag use karo, warna date se maan lo
  const v2 = f2 !== undefined ? isTrue(f2) : !!second;
  const v1 = f1 !== undefined ? isTrue(f1) : !!first;
  const surveyor = String(pick(raw, FIELD_KEYS.surveyor) ?? '—').trim();
  return {
    ca: String(pick(raw, FIELD_KEYS.ca) ?? ''),
    name: String(pick(raw, FIELD_KEYS.name) ?? ''),
    district: String(pick(raw, FIELD_KEYS.district) ?? '—').trim().toUpperCase(),
    surveyor,
    surveyor2: String(pick(raw, FIELD_KEYS.surveyor2) ?? surveyor).trim(),
    first,
    second,
    v1: v1 || v2, // 2nd visit hua matlab 1st bhi hua
    v2,
  };
};

const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const n = (x: number) => x.toLocaleString('en-IN');
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Enter / Space se bhi click chale (keyboard + accessibility)
const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

// Phone detection (charts ki height / labels adjust karne ke liye)
const useIsMobile = (breakpoint = 640) => {
  const get = () => typeof window !== 'undefined' && window.innerWidth < breakpoint;
  const [m, setM] = useState(get);
  useEffect(() => {
    const onResize = () => setM(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);
  return m;
};

// Scoped styling: spacing + fully responsive layout
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

  /* Card header: title left, actions (search / export) right */
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: wrap; align-items: flex-start;
    justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 0; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: wrap; gap: 8px; max-width: 100%;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-end; }

  /* Tables: sideways scroll on small screens */
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--sm { min-width: 540px; }
  .solar-erp-page .ula-table--md { min-width: 660px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  /* Filter bar */
  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  /* Desktop: search + export toolbar ek hi row mein */
  @media (min-width: 641px) {
    .solar-erp-page .ax-card__actions .ax-export-toolbar { width: auto; }
  }

  /* Tablet */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
  }

  /* Mobile */
  @media (max-width: 760px) {
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: flex-end; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; justify-content: flex-end; }

    /* First column fixed rahe jab table sideways scroll ho */
    .solar-erp-page .ula-sticky-first th:first-child,
    .solar-erp-page .ula-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1;
      background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
  }

  /* Small phones: KPI cards 1 column */
  @media (max-width: 420px) {
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons (Tabler style) ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_CHECK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_WRENCH = svg(<path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5z" />);

/* ───────── KPI card ───────── */
interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  onClick?: () => void;
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
};
function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, onClick }: KpiProps) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
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
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {spark && spark.length > 1 && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <ApexChart key={`${label}-${spark.join(',')}`} type="line" sparkline tooltip={false} height={26} color={t.apex} series={[{ name: label, data: spark }]} style={{ minHeight: 26, width: 68 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap' }}>
      <div className="ax-progress ax-progress--sm" style={{ minWidth: 80, width: 80 }}>
        <div className="ax-progress__track">
          <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }} />
        </div>
      </div>
      <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{pct}%</span>
    </div>
  );
}

const AVATAR_COLORS = ['var(--ax-accent)', 'var(--ax-viz-cyan)', 'var(--ax-viz-violet)', 'var(--ax-viz-amber)', 'var(--ax-viz-pink)'];
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
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
const emptyCellStyle = { textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' } as const;

const ULA_VIEW_ROUTE = '/dle/bihar/ula/installation/view';

export function BiharULAInstallationDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [qVisits, setQVisits] = useState('');
  const [qDistrict, setQDistrict] = useState('');
  const [qSurveyor, setQSurveyor] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedSurveyor, setSelectedSurveyor] = useState('All');

  /* Dashboard -> View ULA.
     Selected District/Surveyor filters automatically carry over; explicit params override them.
     Query params keep refresh/back/share working. */
  const openUlaView = (params: Record<string, string> = {}) => {
    const merged: Record<string, string> = { district: selectedDistrict, surveyor: selectedSurveyor, ...params };
    const search = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== 'All') search.set(key, value);
    });
    const qs = search.toString();
    navigate(`${ULA_VIEW_ROUTE}${qs ? `?${qs}` : ''}`);
  };

  const openDistrict = (district: string) => openUlaView({ district });
  const openSurveyor = (surveyor: string) => openUlaView({ surveyor });
  const openVisitStatus = (status: string) => openUlaView({ visitStatus: status });
  const openToday = () => openUlaView({ today: '1' });

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // dleService relative URL (/api/bihar/ula/list) use karta hai -> Vite proxy
      const json = await dleService.getBiharUlaList(signal);
      const list = extractList(json);
      const mine = filterByCompanyStrict(list); // login user ki company_id se match
      console.info('[ULA] rows:', list.length, '→ my company:', mine.length, 'first record:', list[0]);
      setRecords(mine.map(normalize));
      setUpdatedAt(new Date());
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const msg = e?.message || 'Failed to load data';
        setError(e?.status === 401 ? `${msg} (Vite proxy / DLE API key check karo)` : msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const districtOptions = useMemo(() => [...new Set(records.map((r) => r.district))].sort(), [records]);
  const surveyorOptions = useMemo(
    () => [...new Set(records.flatMap((r) => [r.surveyor, r.surveyor2]).filter((s) => s && s !== '—'))].sort(),
    [records]
  );

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (selectedDistrict === 'All' || r.district === selectedDistrict) &&
          (selectedSurveyor === 'All' || r.surveyor === selectedSurveyor || r.surveyor2 === selectedSurveyor)
      ),
    [records, selectedDistrict, selectedSurveyor]
  );

  const { stats, visits, districts, surveyors, daily, recent } = useMemo(() => {
    const now = new Date();
    const vs: Visit[] = [];
    filtered.forEach((r, i) => {
      if (r.v1 && r.first) vs.push({ key: `${i}-1`, ts: r.first, type: '1st Visit', ca: r.ca, name: r.name, district: r.district, surveyor: r.surveyor });
      if (r.v2 && r.second) vs.push({ key: `${i}-2`, ts: r.second, type: '2nd Visit', ca: r.ca, name: r.name, district: r.district, surveyor: r.surveyor2 });
    });
    const today = vs.filter((v) => sameDay(v.ts, now)).sort((a, b) => b.ts.getTime() - a.ts.getTime());

    const total = filtered.length;
    const first = filtered.filter((r) => r.v1).length;
    const second = filtered.filter((r) => r.v2).length;

    const dMap = new Map<string, DistrictRow>();
    filtered.forEach((r) => {
      const d = dMap.get(r.district) || { name: r.district, total: 0, first: 0, second: 0, pending: 0, today: 0, pct: 0 };
      d.total += 1;
      if (r.v1) d.first += 1;
      if (r.v2) d.second += 1;
      dMap.set(r.district, d);
    });
    today.forEach((v) => { const d = dMap.get(v.district); if (d) d.today += 1; });
    const districtRows = [...dMap.values()]
      .map((d) => ({ ...d, pending: d.first - d.second, pct: d.total ? Math.round((d.second / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    const sMap = new Map<string, SurveyorRow & { ds: Set<string> }>();
    vs.forEach((v) => {
      const key = v.surveyor.toLowerCase();
      const s = sMap.get(key) || { name: v.surveyor, first: 0, second: 0, total: 0, today: 0, districts: 0, last: null, ds: new Set<string>() };
      if (v.type === '1st Visit') s.first += 1; else s.second += 1;
      s.total += 1;
      s.ds.add(v.district);
      if (sameDay(v.ts, now)) s.today += 1;
      if (!s.last || v.ts > s.last) s.last = v.ts;
      sMap.set(key, s);
    });
    const surveyorRows: SurveyorRow[] = [...sMap.values()]
      .map((s) => ({ name: s.name, first: s.first, second: s.second, total: s.total, today: s.today, districts: s.ds.size, last: s.last }))
      .sort((a, b) => b.total - a.total);

    // Last 14 days daily activity (for chart + sparklines)
    const days: Date[] = [];
    for (let k = 13; k >= 0; k--) { const d = new Date(now); d.setDate(d.getDate() - k); days.push(d); }
    const dailyRows = days.map((d) => {
      const dv = vs.filter((v) => sameDay(v.ts, d));
      return {
        label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
        iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        first: dv.filter((v) => v.type === '1st Visit').length,
        second: dv.filter((v) => v.type === '2nd Visit').length,
        active: new Set(dv.map((v) => v.surveyor.toLowerCase())).size,
      };
    });

    return {
      visits: today,
      districts: districtRows,
      surveyors: surveyorRows,
      daily: dailyRows,
      recent: [...vs].sort((a, b) => b.ts.getTime() - a.ts.getTime()).slice(0, 6),
      stats: {
        total, first, second,
        pending2: first - second,
        pending1: total - first,
        districtCount: dMap.size,
        surveyorCount: sMap.size,
        todayVisits: today.length,
        today1: today.filter((v) => v.type === '1st Visit').length,
        today2: today.filter((v) => v.type === '2nd Visit').length,
        activeToday: new Set(today.map((v) => v.surveyor.toLowerCase())).size,
        pct1: pctOf(first, total),
        pct2: pctOf(second, total),
      },
    };
  }, [filtered]);

  /* ───────── Search + pagination ───────── */
  const match = (q: string, ...vals: string[]) => {
    const s = q.trim().toLowerCase();
    return !s || vals.some((v) => v.toLowerCase().includes(s));
  };
  const fVisits = useMemo(() => visits.filter((v) => match(qVisits, v.ca, v.name, v.surveyor, v.district)), [visits, qVisits]);
  const fDistricts = useMemo(() => districts.filter((d) => match(qDistrict, d.name)), [districts, qDistrict]);
  const fSurveyors = useMemo(() => surveyors.filter((s) => match(qSurveyor, s.name)), [surveyors, qSurveyor]);

  const pV = usePagination({ data: fVisits, initialPageSize: 15 });
  const pD = usePagination({ data: fDistricts, initialPageSize: 15 });
  const pS = usePagination({ data: fSurveyors, initialPageSize: 15 });

  // Search / filter badalne par page 1 par wapas jao
  useEffect(() => { pV.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qVisits, selectedDistrict, selectedSurveyor]);
  useEffect(() => { pD.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qDistrict, selectedDistrict, selectedSurveyor]);
  useEffect(() => { pS.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qSurveyor, selectedDistrict, selectedSurveyor]);

  /* ───────── Export (Copy / CSV / Excel / PDF + column toggle) ───────── */
  const [hiddenVisitColumns, setHiddenVisitColumns] = useState<string[]>([]);
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);
  const [hiddenSurveyorColumns, setHiddenSurveyorColumns] = useState<string[]>([]);

  const visitCols: ExportColumn<Visit>[] = [
    { header: 'Time', accessor: (v) => fmtTime(v.ts) },
    { header: 'Visit', accessor: 'type' },
    { header: 'CA No', accessor: 'ca' },
    { header: 'Beneficiary', accessor: 'name' },
    { header: 'District', accessor: 'district' },
    { header: 'Surveyor', accessor: 'surveyor' },
  ];

  const districtCols: ExportColumn<DistrictRow>[] = [
    { header: 'District', accessor: 'name' },
    { header: 'Total', accessor: 'total' },
    { header: '1st Visit', accessor: 'first' },
    { header: '2nd Visit', accessor: 'second' },
    { header: '2nd Pending', accessor: 'pending' },
    { header: "Today's Visits", accessor: 'today' },
    { header: 'Completed %', accessor: (d) => `${d.pct}%` },
  ];

  const surveyorCols: ExportColumn<SurveyorRow>[] = [
    { header: 'Surveyor', accessor: 'name' },
    { header: '1st Visits', accessor: 'first' },
    { header: '2nd Visits', accessor: 'second' },
    { header: 'Total', accessor: 'total' },
    { header: "Today's", accessor: 'today' },
    { header: 'Districts', accessor: 'districts' },
    { header: 'Last Visit', accessor: (s) => fmtDate(s.last) },
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
    if (typeof column.accessor === 'function') return column.accessor(row);
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

  const exportToCSV = <T,>(data: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const rows = [
      columns.map((column) => column.header),
      ...data.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
    const rows = data.map((row) => columns.map((column) => escapeHtml(escapeExportValue(getExportValue(row, column)))));
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((column, index) => ({
      key: `${column.header}-${index}`,
      label: column.header,
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const surveyorToolbarColumns = makeToolbarColumns(surveyorCols, hiddenSurveyorColumns);
  const visitToolbarColumns = makeToolbarColumns(visitCols, hiddenVisitColumns);

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  /* ───────── View helpers ───────── */
  const todayLabel = fmtDate(new Date());
  const dash = (v: number) => (loading && !records.length ? '…' : n(v));
  const topSurveyors = surveyors.slice(0, 5);
  const filtersActive = selectedDistrict !== 'All' || selectedSurveyor !== 'All';
  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, districts.length * (isMobile ? 38 : 44)));

  const milestones = [
    { label: '1. Survey Records Received', v: stats.total, of: stats.total, color: 'var(--ax-viz-emerald)' },
    { label: '2. 1st Visit Completed', v: stats.first, of: stats.total, color: 'var(--ax-viz-cyan)' },
    { label: '3. 2nd Visit Completed', v: stats.second, of: stats.total, color: 'var(--ax-accent)' },
    { label: '4. 2nd Visit Pending', v: stats.pending2, of: stats.total, color: 'var(--ax-viz-amber)' },
    { label: '5. 1st Visit Pending', v: stats.pending1, of: stats.total, color: 'var(--ax-viz-pink)' },
  ];

  const visitStatusOf = (type: Visit['type']) => (type === '1st Visit' ? 'firstCompleted' : 'secondCompleted');

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="ULA Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Bihar State Operations · ULA installation survey progress — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'DLE' }, { label: 'Bihar' }, { label: 'Installation' }, { label: 'ULA' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => load()} disabled={loading}>
              {ICON_REFRESH}
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {error && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            <b>Error:</b> {error}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => load()}>Retry</button>
          </div>
        )}

        {!error && !loading && records.length === 0 && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', color: 'var(--ax-text-strong)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            No records found from the API. Please check the <b>[ULA]</b> logs in the browser console or review the <code>ula/list</code> response in the Network tab.
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="ULA Dashboard Filters"
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
                <label htmlFor="district-select" style={labelStyle}>District:</label>
                <select id="district-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="All">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="surveyor-select" style={labelStyle}>Surveyor:</label>
                <select id="surveyor-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedSurveyor} onChange={(e) => setSelectedSurveyor(e.target.value)}>
                  <option value="All">All Surveyors ({surveyorOptions.length})</option>
                  {surveyorOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {filtersActive && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => { setSelectedDistrict('All'); setSelectedSurveyor('All'); }}>
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(stats.total)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">ULA Installation Management System · State Hub</p>
              <h2 className="ax-welcome__title">Welcome to Bihar ULA Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Bihar state survey overview: <b>{dash(stats.total)} installations</b> tracked across <b>{dash(stats.districtCount)} districts</b> by <b>{dash(stats.surveyorCount)} surveyors</b>.
                <b> {dash(stats.second)} ({stats.pct2}%)</b> completed both visits, with <b>{dash(stats.pending2)}</b> awaiting the 2nd visit.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Installations</dt>
                <dd className="ax-num">{dash(stats.total)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(stats.districtCount)} Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>1st Visit Completed</dt>
                <dd className="ax-num">{dash(stats.first)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{stats.pct1}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>2nd Visit Completed</dt>
                <dd className="ax-num">{dash(stats.second)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{stats.pct2}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>2nd Visit Pending</dt>
                <dd className="ax-num">{dash(stats.pending2)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-red)' }}>{dash(stats.pending1)} 1st Pending</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. KPI Cards */}
        <KpiCard icon={I_CHECK} tone="cyan" label="1st Visit Completed" value={dash(stats.first)} unit="Nos." sub={`${dash(stats.pending1)} Pending`} badge={`${stats.pct1}%`} spark={daily.map((d) => d.first)} onClick={() => openVisitStatus('firstCompleted')} />
        <KpiCard icon={I_DONE} tone="emerald" label="2nd Visit Completed" value={dash(stats.second)} unit="Nos." sub={`${dash(stats.pending2)} Pending`} badge={`${stats.pct2}%`} spark={daily.map((d) => d.second)} onClick={() => openVisitStatus('secondCompleted')} />
        <KpiCard icon={I_CLOCK} tone="amber" label="2nd Visit Pending" value={dash(stats.pending2)} unit="Nos." sub="1st done, 2nd awaited" onClick={() => openVisitStatus('secondPending')} />
        <KpiCard icon={I_PIN} tone="violet" label="Total Districts" value={dash(stats.districtCount)} sub="Districts covered" onClick={() => openUlaView()} />
        <KpiCard icon={I_USERS} tone="accent" label="Total Surveyors" value={dash(stats.surveyorCount)} sub="Field surveyors" onClick={() => openUlaView()} />
        <KpiCard icon={I_BOLT} tone="pink" label="Today's Visits" value={dash(stats.todayVisits)} unit="Nos." sub={`${dash(stats.today1)} 1st · ${dash(stats.today2)} 2nd`} spark={daily.map((d) => d.first + d.second)} onClick={openToday} />
        <KpiCard icon={I_WRENCH} tone="emerald" label="Active Surveyors Today" value={dash(stats.activeToday)} sub={`of ${dash(stats.surveyorCount)} surveyors`} spark={daily.map((d) => d.active)} onClick={() => openUlaView({ today: '1', active: '1' })} />

        {/* 5. Charts: Daily Activity + Visit Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Daily Visit Activity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Throughput</span>
              <h2 className="ax-card__title">Daily Visit Activity</h2>
              <p className="ax-card__subtitle">1st and 2nd visits recorded per day — last 14 days</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: '1st Visits', c: LIGHT_BLUE },
                  { l: '2nd Visits', c: LIGHT_GREEN },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`daily-${chartH}-${daily.map((d) => `${d.first}.${d.second}`).join('-')}`}
              type="bar"
              height={chartH}
              legend="none"
              ariaLabel="Daily 1st and 2nd visit column chart"
              series={[
                { name: '1st Visits', data: daily.map((d) => d.first) },
                { name: '2nd Visits', data: daily.map((d) => d.second) },
              ]}
              apex={{
                colors: [LIGHT_BLUE, LIGHT_GREEN],
                plotOptions: { bar: { borderRadius: 4, columnWidth: isMobile ? '70%' : '55%' } },
                xaxis: { categories: daily.map((d) => d.label), labels: { rotate: -45, hideOverlappingLabels: true, style: { fontSize: '11px' } } },
                yaxis: { title: { text: 'Visits (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const day = daily[opts?.dataPointIndex];
                      if (day) {
                        openUlaView({
                          date: day.iso,
                          visitStatus: opts?.seriesIndex === 0 ? 'firstCompleted' : 'secondCompleted',
                        });
                      }
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Visit Status Breakdown">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Distribution</span>
              <h2 className="ax-card__title">Visit Status</h2>
              <p className="ax-card__subtitle">Total {dash(stats.total)} Installations</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`donut-${donutH}-${stats.second}-${stats.pending2}-${stats.pending1}`}
              type="donut" height={donutH} legend="none"
              ariaLabel="Donut chart of installations by visit status"
              series={[stats.second, stats.pending2, stats.pending1]}
              apex={{
                labels: ['Completed (2 visits)', '2nd Visit Pending', '1st Visit Pending'],
                colors: [LIGHT_GREEN, LIGHT_BLUE, LIGHT_AMBER],
                stroke: { width: 0 },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const status = ['secondCompleted', 'secondPending', 'firstPending'][opts?.dataPointIndex];
                      if (status) openVisitStatus(status);
                    },
                  },
                },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Installations', formatter: () => n(stats.total) } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Completed (2 visits)', sub: `${stats.pct2}% of total`, v: stats.second, color: LIGHT_GREEN },
                { label: '2nd Visit Pending', sub: '1st done, 2nd awaited', v: stats.pending2, color: LIGHT_BLUE },
                { label: '1st Visit Pending', sub: 'Not yet surveyed', v: stats.pending1, color: LIGHT_AMBER },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{n(s.v)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. District chart + Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Installations by visit progress across Bihar</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(stats.districtCount)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`bar-${districtChartH}-${districts.length}-${stats.total}-${stats.second}`}
              type="bar" height={districtChartH} legend="top" stacked
              ariaLabel="Horizontal stacked bar of installations per district by visit progress"
              series={[
                { name: 'Completed (2 visits)', data: districts.map((d) => d.second) },
                { name: '2nd visit pending', data: districts.map((d) => d.pending) },
                { name: '1st visit pending', data: districts.map((d) => d.total - d.first) },
              ]}
              apex={{
                colors: [LIGHT_GREEN, LIGHT_BLUE, LIGHT_AMBER],
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                xaxis: { categories: districts.map((d) => d.name), labels: { style: { fontSize: '11px' } } },
                yaxis: { labels: { maxWidth: isMobile ? 90 : 160, style: { fontSize: '11px' } } },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const district = districts[opts?.dataPointIndex]?.name;
                      if (district) openDistrict(district);
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Survey Progress">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">Survey Milestones</h2>
              <p className="ax-card__subtitle">Progress by survey stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = pctOf(m.v, m.of);
              return (
                <div key={m.label}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{n(m.v)} / {n(m.of)} ({p}%)</b>
                  </div>
                  <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} /></div></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. District Wise Data table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Data</h2>
              <p className="ax-card__subtitle">Visit progress per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" style={{ minWidth: 150 }} />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(fDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(fDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `ULA_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(fDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `ULA_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(fDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'ULA District Wise')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md ula-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">1st Visit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">2nd Visit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">2nd Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Today</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {pD.paginatedData.map((d) => (
                  <tr
                    key={d.name}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDistrict(d.name)}
                    onKeyDown={onActivate(() => openDistrict(d.name))}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{d.name}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{n(d.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{n(d.first)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{n(d.second)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: d.pending > 0 ? 'var(--ax-viz-amber)' : 'var(--ax-text-muted)' }}>{n(d.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{n(d.today)}</td>
                    <td className="ax-table__td"><Bar pct={d.pct} /></td>
                  </tr>
                ))}
                {!loading && fDistricts.length === 0 && (
                  <tr><td className="ax-table__td" colSpan={7} style={emptyCellStyle}>No districts match the filters.</td></tr>
                )}
                {fDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(stats.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{n(stats.first)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{n(stats.second)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{n(stats.pending2)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(stats.todayVisits)}</td>
                    <td className="ax-table__td"><Bar pct={Math.round(stats.pct2)} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pD.currentPage}
                totalItems={pD.totalItems}
                pageSize={pD.pageSize}
                onPageChange={pD.setPage}
                onPageSizeChange={pD.setPageSize}
                pageSizeOptions={[15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* 8. Surveyor Wise Data table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Surveyor wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Workforce</span>
              <h2 className="ax-card__title">Surveyor Wise Data</h2>
              <p className="ax-card__subtitle">Visits done by each field surveyor</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qSurveyor} onChange={setQSurveyor} placeholder="Search surveyor..." size="sm" style={{ minWidth: 150 }} />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(fSurveyors, visibleColumns(surveyorCols, hiddenSurveyorColumns))}
                  onExportCSV={() => exportToCSV(fSurveyors, visibleColumns(surveyorCols, hiddenSurveyorColumns), `ULA_Surveyor_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(fSurveyors, visibleColumns(surveyorCols, hiddenSurveyorColumns), `ULA_Surveyor_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(fSurveyors, visibleColumns(surveyorCols, hiddenSurveyorColumns), 'ULA Surveyor Wise')}
                  columns={surveyorToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenSurveyorColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md ula-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Surveyor</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">1st Visits</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">2nd Visits</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Today</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Districts</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {pS.paginatedData.map((s) => (
                  <tr
                    key={s.name}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openSurveyor(s.name)}
                    onKeyDown={onActivate(() => openSurveyor(s.name))}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{s.name}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{n(s.first)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{n(s.second)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{n(s.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: s.today > 0 ? 'var(--ax-viz-amber)' : 'var(--ax-text-muted)' }}>{n(s.today)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{s.districts}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{fmtDate(s.last)}</td>
                  </tr>
                ))}
                {fSurveyors.length === 0 && (
                  <tr><td className="ax-table__td" colSpan={7} style={emptyCellStyle}>{loading ? 'Loading…' : 'No surveyors match the filters.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pS.currentPage}
                totalItems={pS.totalItems}
                pageSize={pS.pageSize}
                onPageChange={pS.setPage}
                onPageSizeChange={pS.setPageSize}
                pageSizeOptions={[15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* 9. Today's Visits table + Activity timeline & Workforce */}
        <section className="ax-card ax-col--8" role="region" aria-label="Today's visits">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Site Operations · Live {todayLabel}</span>
              <h2 className="ax-card__title">Today&apos;s Visits</h2>
              <p className="ax-card__subtitle">1st &amp; 2nd visits recorded today</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qVisits} onChange={setQVisits} placeholder="Search CA no., beneficiary..." size="sm" style={{ minWidth: 190 }} />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(fVisits, visibleColumns(visitCols, hiddenVisitColumns))}
                  onExportCSV={() => exportToCSV(fVisits, visibleColumns(visitCols, hiddenVisitColumns), `ULA_Todays_Visits_${stamp}`)}
                  onExportExcel={() => exportToExcel(fVisits, visibleColumns(visitCols, hiddenVisitColumns), `ULA_Todays_Visits_${stamp}`)}
                  onExportPDF={() => exportToPDF(fVisits, visibleColumns(visitCols, hiddenVisitColumns), "ULA Today's Visits")}
                  columns={visitToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenVisitColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--sm ula-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Beneficiary</th>
                  <th className="ax-table__th" scope="col">Visit</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Surveyor</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {pV.paginatedData.length === 0 && (
                  <tr><td className="ax-table__td" colSpan={5} style={emptyCellStyle}>{loading ? 'Loading…' : 'No visits recorded today.'}</td></tr>
                )}
                {pV.paginatedData.map((v) => {
                  const go = () => openUlaView({ district: v.district, surveyor: v.surveyor, visitStatus: visitStatusOf(v.type), today: '1' });
                  return (
                    <tr
                      key={v.key}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={go}
                      onKeyDown={onActivate(go)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{v.name}</div>
                        <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 2 }}>{v.ca}</div>
                      </td>
                      <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${v.type === '2nd Visit' ? 'success' : 'info'} ax-badge--pill`}><span className="ax-badge__dot" />{v.type}</span></td>
                      <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', fontWeight: 500 }}>{v.district}</td>
                      <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{v.surveyor}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{fmtTime(v.ts)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pV.currentPage}
                totalItems={pV.totalItems}
                pageSize={pV.pageSize}
                onPageChange={pV.setPage}
                onPageSizeChange={pV.setPageSize}
                pageSizeOptions={[15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Recent Activity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Real-Time Telemetry</span>
              <h2 className="ax-card__title">Operations Activity</h2>
              <p className="ax-card__subtitle">Latest survey visits</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {recent.length === 0 ? (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>{loading ? 'Loading…' : 'No visits recorded yet.'}</div>
            ) : (
              <ul className="ax-timeline">
                {recent.map((v) => {
                  const go = () => openUlaView({ district: v.district, surveyor: v.surveyor, visitStatus: visitStatusOf(v.type) });
                  return (
                    <li
                      key={v.key}
                      className={`ax-timeline__item ax-timeline__item--${v.type === '2nd Visit' ? 'success' : 'info'}`}
                      role="button"
                      tabIndex={0}
                      onClick={go}
                      onKeyDown={onActivate(go)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="ax-timeline__marker">
                        <i style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      </span>
                      <div className="ax-timeline__content">
                        <p className="ax-timeline__title">
                          <b style={{ color: 'var(--ax-text-strong)' }}>{v.surveyor}</b> completed {v.type.toLowerCase()}
                        </p>
                        <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginBlock: '2px 4px' }}>{v.name}</p>
                        <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: '11px', color: 'var(--ax-text-subtle)' }}>
                          <span>District: {v.district}</span>
                          <span>{fmtDate(v.ts)} · {fmtTime(v.ts)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Field workforce mini summary */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>Top Surveyors</span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{dash(stats.activeToday)} Active Today</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-3)' }}>
                {topSurveyors.length === 0 && <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{loading ? 'Loading…' : 'No surveyor data.'}</div>}
                {topSurveyors.map((s, i) => {
                  const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <button
                      key={s.name}
                      type="button"
                      className="ax-cluster"
                      onClick={() => openSurveyor(s.name)}
                      style={{ width: '100%', gap: 'var(--ax-space-3)', flexWrap: 'nowrap', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${c} 22%,transparent)`, color: c, fontWeight: 600 }}>{initials(s.name)}</span>
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div className="ax-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{s.name}</div>
                        <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{n(s.first)} 1st · {n(s.second)} 2nd</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{n(s.total)}</b>
                        {s.today > 0 && <span className="ax-kpi__delta ax-kpi__delta--up" style={{ display: 'flex', justifyContent: 'flex-end' }}>{ARROW_UP}{s.today} today</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default BiharULAInstallationDashboard;