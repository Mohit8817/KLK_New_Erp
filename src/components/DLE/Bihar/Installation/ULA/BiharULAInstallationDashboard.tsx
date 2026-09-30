import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { ApexChart } from '../../../../charts/ApexChart';
import {
  Pagination,
  usePagination,
  SearchInput,
  ExportButton,
  type ExportColumn,
} from '../../../../../common';

/* ───────────────────────── API CONFIG ─────────────────────────
 * Sirf yahi block API ke hisaab se badalna pad sakta hai.
 * FIELD_KEYS mein har field ke possible naam diye hain; jo pehla mile wahi use hoga.
 */
const API_URL = 'https://klkdle.klkventures.cloud/api/bihar/ula/list';

const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    '';
  return token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' };
};

const FIELD_KEYS = {
  ca: ['ca_no', 'ca_number', 'caNo', 'ca', 'consumer_number', 'consumer_no'],
  name: ['beneficiary_name', 'beneficiary', 'consumer_name', 'customer_name', 'name'],
  district: ['district', 'district_name', 'districtName'],
  surveyor: ['surveyor_name', 'surveyor', 'surveyorName', 'user_name', 'created_by_name'],
  surveyor2: ['second_surveyor_name', 'second_surveyor', 'surveyor2_name'],
  first: ['first_visit_date', 'first_visit_at', 'first_visit_datetime', 'first_visit', 'visit1_date', 'first_visit_on', 'created_at'],
  second: ['second_visit_date', 'second_visit_at', 'second_visit_datetime', 'second_visit', 'visit2_date', 'second_visit_on'],
} as const;
/* ──────────────────────────────────────────────────────────── */

interface Rec { ca: string; name: string; district: string; surveyor: string; surveyor2: string; first: Date | null; second: Date | null }
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

const normalize = (raw: any): Rec => ({
  ca: String(pick(raw, FIELD_KEYS.ca) ?? ''),
  name: String(pick(raw, FIELD_KEYS.name) ?? ''),
  district: String(pick(raw, FIELD_KEYS.district) ?? '—').toUpperCase(),
  surveyor: String(pick(raw, FIELD_KEYS.surveyor) ?? '—'),
  surveyor2: String(pick(raw, FIELD_KEYS.surveyor2) ?? pick(raw, FIELD_KEYS.surveyor) ?? '—'),
  first: parseDate(pick(raw, FIELD_KEYS.first)),
  second: parseDate(pick(raw, FIELD_KEYS.second)),
});

const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const n = (x: number) => x.toLocaleString('en-IN');
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ARROW_UP = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CHECK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);

interface CellProps { icon: React.ReactNode; cls?: string; label: string; value: string; delta?: string; dir?: 'up' | 'down' }
function Cell({ icon, cls = '', label, value, delta, dir = 'up' }: CellProps) {
  return (
    <div className="ax-statgroup__cell">
      <span className={`ax-statgroup__icon${cls ? ` ax-statgroup__icon--${cls}` : ''}`}>{icon}</span>
      <span className="ax-statgroup__text">
        <span className="ax-statgroup__label">{label}</span>
        <span className="ax-statgroup__value ax-num">{value}</span>
      </span>
      {delta && <span className={`ax-statgroup__delta ax-statgroup__delta--${dir}`}>{delta}</span>}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
      {items.map((i) => (
        <span key={i.label} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
          <i style={{ width: 9, height: 9, borderRadius: 3, background: i.color }} />
          <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>{i.label}</small>
        </span>
      ))}
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
      <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{pct}% completed</span>
    </div>
  );
}

const AVATAR_COLORS = ['var(--ax-accent)', 'var(--ax-viz-cyan)', 'var(--ax-viz-violet)', 'var(--ax-viz-amber)', 'var(--ax-viz-pink)'];

export function BiharULAInstallationDashboard() {
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [qVisits, setQVisits] = useState('');
  const [qDistrict, setQDistrict] = useState('');
  const [qSurveyor, setQSurveyor] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders(), signal });
      if (!res.ok) throw new Error(`API error ${res.status}${res.status === 401 ? ' — login token missing/expired' : ''}`);
      const json = await res.json();
      const list = extractList(json);
      // debug: console mein dekho API se kya aaya (field names match karne ke liye)
      console.info('[ULA] rows:', list.length, 'first record:', list[0], 'raw:', list.length ? undefined : json);
      setRecords(list.map(normalize));
      setUpdatedAt(new Date());
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const { stats, visits, districts, surveyors } = useMemo(() => {
    const now = new Date();
    const vs: Visit[] = [];
    records.forEach((r, i) => {
      if (r.first) vs.push({ key: `${i}-1`, ts: r.first, type: '1st Visit', ca: r.ca, name: r.name, district: r.district, surveyor: r.surveyor });
      if (r.second) vs.push({ key: `${i}-2`, ts: r.second, type: '2nd Visit', ca: r.ca, name: r.name, district: r.district, surveyor: r.surveyor2 });
    });
    const today = vs.filter((v) => sameDay(v.ts, now)).sort((a, b) => b.ts.getTime() - a.ts.getTime());

    const total = records.length;
    const hasFirstField = records.some((r) => r.first);
    const first = hasFirstField ? records.filter((r) => r.first || r.second).length : total;
    const second = records.filter((r) => r.second).length;

    const dMap = new Map<string, DistrictRow>();
    records.forEach((r) => {
      const d = dMap.get(r.district) || { name: r.district, total: 0, first: 0, second: 0, pending: 0, today: 0, pct: 0 };
      d.total += 1;
      if (!hasFirstField || r.first || r.second) d.first += 1;
      if (r.second) d.second += 1;
      dMap.set(r.district, d);
    });
    today.forEach((v) => { const d = dMap.get(v.district); if (d) d.today += 1; });
    const districtRows = [...dMap.values()]
      .map((d) => ({ ...d, pending: d.first - d.second, pct: d.total ? Math.round((d.second / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    const sMap = new Map<string, SurveyorRow & { ds: Set<string> }>();
    vs.forEach((v) => {
      const s = sMap.get(v.surveyor) || { name: v.surveyor, first: 0, second: 0, total: 0, today: 0, districts: 0, last: null, ds: new Set<string>() };
      if (v.type === '1st Visit') s.first += 1; else s.second += 1;
      s.total += 1;
      s.ds.add(v.district);
      if (sameDay(v.ts, now)) s.today += 1;
      if (!s.last || v.ts > s.last) s.last = v.ts;
      sMap.set(v.surveyor, s);
    });
    const surveyorRows: SurveyorRow[] = [...sMap.values()]
      .map((s) => ({ name: s.name, first: s.first, second: s.second, total: s.total, today: s.today, districts: s.ds.size, last: s.last }))
      .sort((a, b) => b.total - a.total);

    return {
      visits: today,
      districts: districtRows,
      surveyors: surveyorRows,
      stats: {
        total, first, second,
        pending2: first - second,
        pending1: total - first,
        districtCount: dMap.size,
        surveyorCount: sMap.size,
        todayVisits: today.length,
        today1: today.filter((v) => v.type === '1st Visit').length,
        today2: today.filter((v) => v.type === '2nd Visit').length,
        activeToday: new Set(today.map((v) => v.surveyor)).size,
        pct1: total ? Math.round((first / total) * 100) : 0,
        pct2: total ? Math.round((second / total) * 100) : 0,
      },
    };
  }, [records]);

  const match = (q: string, ...vals: string[]) => !q || vals.some((v) => v.toLowerCase().includes(q.toLowerCase()));
  const fVisits = useMemo(() => visits.filter((v) => match(qVisits, v.ca, v.name, v.surveyor, v.district)), [visits, qVisits]);
  const fDistricts = useMemo(() => districts.filter((d) => match(qDistrict, d.name)), [districts, qDistrict]);
  const fSurveyors = useMemo(() => surveyors.filter((s) => match(qSurveyor, s.name)), [surveyors, qSurveyor]);

  const pV = usePagination({ data: fVisits, initialPageSize: 10 });
  const pD = usePagination({ data: fDistricts, initialPageSize: 10 });
  const pS = usePagination({ data: fSurveyors, initialPageSize: 10 });

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

  const todayLabel = fmtDate(new Date());
  const stamp = new Date().toISOString().slice(0, 10);
  const dash = (v: number) => (loading && !records.length ? '…' : n(v));
  const topSurveyors = surveyors.slice(0, 5);
  const latest = visits.slice(0, 5);
  const footerStyle = { borderTop: '1px solid var(--ax-border-subtle)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

  return (
    <>
      <PageHead
        title="ULA Installation Dashboard"
        subtitle={`Bihar · ULA installation survey progress — last updated ${updatedAt ? fmtTime(updatedAt) : '—'}.`}
        breadcrumbs={[{ label: 'DLE' }, { label: 'Bihar' }, { label: 'Installation' }, { label: 'ULA' }, { label: 'Dashboard' }]}
        actions={
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => load()} disabled={loading}>
            {ICON_REFRESH}
          </button>
        }
      />

      <div className="ax-dash-grid">
        {error && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            <b>Error:</b> {error}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => load()}>Retry</button>
          </div>
        )}

        {!error && !loading && records.length === 0 && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', color: 'var(--ax-text-strong)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            API se koi record nahi mila. Browser console mein <b>[ULA]</b> log dekho ya Network tab mein <code>ula/list</code> ka response check karo.
          </div>
        )}

        {/* OPENER: survey overview band */}
        <section className="ax-card ax-card--filled ax-col--12" role="region" aria-label="Survey overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Records</span>
              <h2 className="ax-card__title">Welcome to, ULA Installation Dashboard</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
              <Cell icon={I_LIST} label="Total Installations" value={dash(stats.total)} />
              <Cell icon={I_CHECK} cls="c2" label="1st Visit Completed" value={dash(stats.first)} delta={`${stats.pct1}%`} />
              <Cell icon={I_DONE} cls="c3" label="2nd Visit Completed" value={dash(stats.second)} delta={`${stats.pct2}%`} />
              <Cell icon={I_CLOCK} cls="c4" label="2nd Visit Pending" value={dash(stats.pending2)} dir="down" />
              <Cell icon={I_PIN} cls="c5" label="Total Districts" value={dash(stats.districtCount)} />
              <Cell icon={I_USERS} cls="c6" label="Total Surveyors" value={dash(stats.surveyorCount)} />
            </div>
          </div>
        </section>

        {/* Today's activity band */}
        <section className="ax-card ax-col--12" role="region" aria-label="Today's activity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Live · {todayLabel}</span>
              <h2 className="ax-card__title">Today&apos;s Activity</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
              <Cell icon={I_BOLT} label="Today's Visits" value={dash(stats.todayVisits)} />
              <Cell icon={I_CHECK} cls="c2" label="Today's 1st Visits" value={dash(stats.today1)} />
              <Cell icon={I_DONE} cls="c3" label="Today's 2nd Visits" value={dash(stats.today2)} />
              <Cell icon={I_USERS} cls="c4" label="Active Surveyors Today" value={dash(stats.activeToday)} />
            </div>
          </div>
        </section>

        {/* HERO: District installations (7) + Visit status (5) */}
        <section className="ax-card ax-card--chart ax-col--7" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">Installations by visit progress</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Legend items={[
              { label: 'Completed (2 visits)', color: 'var(--ax-accent)' },
              { label: '2nd visit pending', color: 'var(--ax-viz-cyan)' },
              { label: '1st visit pending', color: 'var(--ax-viz-amber)' },
            ]} />
            <ApexChart
              key={`bar-${districts.length}-${stats.total}-${stats.second}`}
              type="bar" height={Math.min(520, Math.max(320, districts.length * 44))} legend="none" stacked
              ariaLabel="Horizontal stacked bar of installations per district by visit progress"
              series={[
                { name: 'Completed (2 visits)', data: districts.map((d) => d.second) },
                { name: '2nd visit pending', data: districts.map((d) => d.pending) },
                { name: '1st visit pending', data: districts.map((d) => d.total - d.first) },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-amber')],
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                xaxis: { categories: districts.map((d) => d.name) },
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--5" role="region" aria-label="Visit status">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Visit Status</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`donut-${stats.second}-${stats.pending2}-${stats.pending1}`}
              type="donut" height={230} legend="none"
              ariaLabel="Donut chart of installations by visit status"
              series={[stats.second, stats.pending2, stats.pending1]}
              apex={{
                labels: ['Completed (2 visits)', '2nd Visit Pending', '1st Visit Pending'],
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Installations', formatter: () => n(stats.total) } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {[
                { label: 'Completed (2 visits)', v: stats.second, color: 'var(--ax-accent)' },
                { label: '2nd Visit Pending', v: stats.pending2, color: 'var(--ax-viz-cyan)' },
                { label: '1st Visit Pending', v: stats.pending1, color: 'var(--ax-viz-amber)' },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{n(s.v)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Today's visits (8) + Top surveyors (4) */}
        <section className="ax-card ax-col--8" role="region" aria-label="Today's visits">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Today&apos;s Visits</h2><p className="ax-card__subtitle">1st &amp; 2nd visits recorded today</p></div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchInput value={qVisits} onChange={setQVisits} placeholder="Search CA no., beneficiary, surveyor..." size="sm" style={{ minWidth: 220 }} />
                <ExportButton data={fVisits} columns={visitCols} filename={`ULA_Todays_Visits_${stamp}`} label="Export" />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
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
                  <tr><td className="ax-table__td" colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' }}>{loading ? 'Loading…' : 'No visits recorded today.'}</td></tr>
                )}
                {pV.paginatedData.map((v) => (
                  <tr key={v.key} className="ax-table__row">
                    <td className="ax-table__td"><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{v.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{v.ca}</div></td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${v.type === '2nd Visit' ? 'success' : 'info'} ax-badge--pill`}><span className="ax-badge__dot" />{v.type}</span></td>
                    <td className="ax-table__td">{v.district}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{v.surveyor}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', textAlign: 'right' }}>{fmtTime(v.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <Pagination currentPage={pV.currentPage} totalItems={pV.totalItems} pageSize={pV.pageSize} onPageChange={pV.setPage} onPageSizeChange={pV.setPageSize} pageSizeOptions={[10, 25, 50]} />
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Top surveyors">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Top Surveyors</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {topSurveyors.length === 0 && <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>{loading ? 'Loading…' : 'No surveyor data.'}</div>}
            {topSurveyors.map((s, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={s.name} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                  <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${c} 22%,transparent)`, color: c, fontWeight: 600 }}>{initials(s.name)}</span>
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.name}</div>
                    <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{n(s.first)} 1st · {n(s.second)} 2nd</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{n(s.total)}</b>
                    {s.today > 0 && <span className="ax-kpi__delta ax-kpi__delta--up" style={{ display: 'flex', justifyContent: 'flex-end' }}>{ARROW_UP}{s.today} today</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* District wise data */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">District Wise Data</h2><p className="ax-card__subtitle">Visit progress per district</p></div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" style={{ minWidth: 180 }} />
                <ExportButton data={fDistricts} columns={districtCols} filename={`ULA_District_Wise_${stamp}`} label="Export" />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
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
                  <tr key={d.name} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{d.name}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(d.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(d.first)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>{n(d.second)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{n(d.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(d.today)}</td>
                    <td className="ax-table__td"><Bar pct={d.pct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <Pagination currentPage={pD.currentPage} totalItems={pD.totalItems} pageSize={pD.pageSize} onPageChange={pD.setPage} onPageSizeChange={pD.setPageSize} pageSizeOptions={[10, 25, 50]} />
          </div>
        </section>

        {/* Surveyor wise data */}
        <section className="ax-card ax-col--12" role="region" aria-label="Surveyor wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Surveyor Wise Data</h2><p className="ax-card__subtitle">Visits done by each field surveyor</p></div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchInput value={qSurveyor} onChange={setQSurveyor} placeholder="Search surveyor..." size="sm" style={{ minWidth: 180 }} />
                <ExportButton data={fSurveyors} columns={surveyorCols} filename={`ULA_Surveyor_Wise_${stamp}`} label="Export" />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
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
                  <tr key={s.name} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.name}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(s.first)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(s.second)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>{n(s.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{n(s.today)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{s.districts}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', textAlign: 'right' }}>{fmtDate(s.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <Pagination currentPage={pS.currentPage} totalItems={pS.totalItems} pageSize={pS.pageSize} onPageChange={pS.setPage} onPageSizeChange={pS.setPageSize} pageSizeOptions={[10, 25, 50]} />
          </div>
        </section>

        {/* Recent activity */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent activity">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Activity</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {latest.length === 0 ? (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>{loading ? 'Loading…' : 'No visits recorded today.'}</div>
            ) : (
              <ul className="ax-timeline">
                {latest.map((v) => (
                  <li key={v.key} className={`ax-timeline__item${v.type === '2nd Visit' ? ' ax-timeline__item--success' : ''}`}>
                    <span className="ax-timeline__marker" style={v.type === '1st Visit' ? { color: 'var(--ax-viz-cyan)' } : undefined}>
                      {svg(v.type === '2nd Visit' ? <path d="M5 12l5 5l10 -10" /> : <><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>)}
                    </span>
                    <div className="ax-timeline__content">
                      <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>{v.surveyor}</b> completed {v.type.toLowerCase()} — <span style={{ color: 'var(--ax-accent)' }}>{v.name}</span> · {v.district}</p>
                      <span className="ax-timeline__time">{fmtTime(v.ts)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default BiharULAInstallationDashboard;