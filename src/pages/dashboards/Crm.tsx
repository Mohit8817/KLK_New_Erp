/*
 * Vireo React — CRM dashboard (route "dashboards/crm").
 *
 * Faithful re-expression of src/html/dashboards/crm.html: 4 KPI cards, a
 * Deals-by-stage horizontal stacked bar, lead-source donut, revenue forecast
 * range-area, sales-target radial, activities-due agenda, recent deals table,
 * top reps, and a recent-activity timeline. Charts via <ApexChart>; 1:1 DOM.
 */
import type { ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const ICON_CAL = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
);
const ICON_CHEV = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);
const ARROW_UP = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>);
const ARROW_DN = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>);

/* The pipeline band walks the process left-to-right — no KPI tiles on this page. */
interface Stage { icon: ReactElement; iconClass: string; label: string; value: string; delta: string; dir: string; }
const PIPELINE: Stage[] = [
  { iconClass: 'ax-statgroup__icon', label: 'Prospecting', value: '$412K', delta: '98', dir: 'up', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v3l-6 6v6l-4 2v-8l-6 -6z" /></svg> },
  { iconClass: 'ax-statgroup__icon ax-statgroup__icon--c2', label: 'Qualified', value: '$338K', delta: '74', dir: 'up', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg> },
  { iconClass: 'ax-statgroup__icon ax-statgroup__icon--c3', label: 'Proposal', value: '$286K', delta: '61', dir: 'up', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 17h6" /></svg> },
  { iconClass: 'ax-statgroup__icon ax-statgroup__icon--c4', label: 'Negotiation', value: '$154K', delta: '48', dir: 'down', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" /></svg> },
  { iconClass: 'ax-statgroup__icon ax-statgroup__icon--c5', label: 'Won this quarter', value: '$248K', delta: '31', dir: 'up', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1 -10 0z" /><path d="M17 5h2a2 2 0 0 1 0 4h-.5" /><path d="M7 5h-2a2 2 0 0 0 0 4h.5" /></svg> },
  { iconClass: 'ax-statgroup__icon ax-statgroup__icon--c6', label: 'Win rate', value: '24.6%', delta: '+1.9%', dir: 'up', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6 -6l4 4l8 -8" /><path d="M14 7l7 0l0 7" /></svg> },
];

const SOURCES = [
  { label: 'Inbound', pct: '38%', color: 'var(--ax-accent)' },
  { label: 'Referral', pct: '24%', color: 'var(--ax-viz-cyan)' },
  { label: 'Outbound', pct: '20%', color: 'var(--ax-viz-violet)' },
  { label: 'Events', pct: '11%', color: 'var(--ax-viz-pink)' },
  { label: 'Partner', pct: '7%', color: 'var(--ax-viz-amber)' },
];
const ACTIVITIES = [
  { time: '09:30', title: 'Call — Northwind Ltd', sub: 'Discovery · Priya Nair', badge: 'Call', tone: 'info' },
  { time: '11:00', title: 'Demo — Vertex Group', sub: 'Proposal · Tomás Herrera', badge: 'Demo', tone: 'success' },
  { time: '14:15', title: 'Follow-up — Acme Co', sub: 'Negotiation · Devon Okafor', badge: 'Email', tone: 'warning' },
  { time: '16:45', title: 'Contract — Helix Media', sub: 'Closing · Lena Brandt', badge: 'Sign', tone: 'info' },
];
const DEALS = [
  { name: 'Platform rollout', co: 'Vertex Group', stage: 'Negotiation', tone: 'success', value: '$184,000', owner: 'Tomás Herrera', close: 'Jul 02' },
  { name: 'Annual license', co: 'Northwind Ltd', stage: 'Proposal', tone: 'info', value: '$96,500', owner: 'Priya Nair', close: 'Jul 09' },
  { name: 'Seat expansion', co: 'Acme Co', stage: 'Qualified', tone: 'warning', value: '$42,800', owner: 'Devon Okafor', close: 'Jul 18' },
  { name: 'Enterprise tier', co: 'Helix Media', stage: 'Won', tone: 'success', value: '$128,000', owner: 'Lena Brandt', close: 'Jun 11' },
  { name: 'Pilot program', co: 'Lumen Labs', stage: 'Lead', tone: '', value: '$18,200', owner: 'Ava Sutton', close: 'Aug 01' },
];
const REPS = [
  { initials: 'TH', name: 'Tomás Herrera', sub: '14 won · 31% win', amount: '$412K', up: true, delta: '9%', color: 'var(--ax-accent)' },
  { initials: 'PN', name: 'Priya Nair', sub: '11 won · 28% win', amount: '$338K', up: true, delta: '6%', color: 'var(--ax-viz-cyan)' },
  { initials: 'DO', name: 'Devon Okafor', sub: '9 won · 24% win', amount: '$276K', up: false, delta: '3%', color: 'var(--ax-viz-violet)' },
  { initials: 'LB', name: 'Lena Brandt', sub: '8 won · 22% win', amount: '$214K', up: true, delta: '4%', color: 'var(--ax-viz-amber)' },
];

export function Crm() {
  return (
    <>
      <PageHead
        title="CRM"
        subtitle="Pipeline health, leads & rep performance — last 30 days."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 30 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard">{ICON_REFRESH}</button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">New deal</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* OPENER (P5 · STRIP): pipeline band (12), then an asymmetric 7+5 */}
        <section className="ax-card ax-card--filled ax-col--12" role="region" aria-label="Deal pipeline by stage">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Q2 · 312 open deals</span>
              <h2 className="ax-card__title">Pipeline</h2>
            </div>
            <div className="ax-card__actions">
              <a className="ax-btn ax-btn--link" href="#">Forecast detail</a>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
              {PIPELINE.map((s) => (
                <div key={s.label} className="ax-statgroup__cell">
                  <span className={s.iconClass}>{s.icon}</span>
                  <span className="ax-statgroup__text">
                    <span className="ax-statgroup__label">{s.label}</span>
                    <span className="ax-statgroup__value ax-num">{s.value}</span>
                  </span>
                  <span className={`ax-statgroup__delta ax-statgroup__delta--${s.dir}`}>{s.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HERO: Deals by Stage (7) + Lead Source (5) */}
        <section className="ax-card ax-card--chart ax-col--7" role="region" aria-label="Deals pipeline by stage">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Pipeline</span>
              <h2 className="ax-card__title">Deals by Stage</h2>
              <p className="ax-card__subtitle">Deal value moving through the pipeline</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Team">
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">All teams</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">Enterprise</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">SMB</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Won</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Open</small></span>
            </div>
            <ApexChart
              type="bar" height={320} legend="none" stacked
              ariaLabel="Horizontal funnel bar of pipeline stages: lead, qualified, proposal, negotiation, won"
              series={[
                { name: 'Won', data: [62, 88, 96, 84, 312] },
                { name: 'Open', data: [820, 540, 360, 196, 0] },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan')],
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                xaxis: { categories: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'], labels: { formatter: (v: string) => '$' + v + 'K' } },
              }}
            />
          </div>
        </section>

        {/* Lead Source */}
        <section className="ax-card ax-col--5" role="region" aria-label="Lead source">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Lead Source</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={230} legend="none"
              ariaLabel="Donut chart of lead source: inbound 38%, referral 24%, outbound 20%, events 11%, partner 7%"
              series={[38, 24, 20, 11, 7]}
              apex={{
                labels: ['Inbound', 'Referral', 'Outbound', 'Events', 'Partner'],
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Leads', formatter: () => '1,180' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {SOURCES.map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{s.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Revenue Forecast (range area) */}
        <section className="ax-card ax-card--chart ax-col--4" role="region" aria-label="Revenue forecast">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Revenue Forecast</h2><p className="ax-card__subtitle">Committed vs. best-case</p></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Committed</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)', opacity: 0.5 }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Best-case range</small></span>
            </div>
            <ApexChart
              type="rangeArea" height={240} legend="none"
              ariaLabel="Range area chart of committed revenue versus best-case forecast over six months"
              series={[
                { name: 'Best-case range', type: 'rangeArea', data: [{ x: 'Jul', y: [180, 240] }, { x: 'Aug', y: [200, 280] }, { x: 'Sep', y: [220, 320] }, { x: 'Oct', y: [250, 360] }, { x: 'Nov', y: [280, 410] }, { x: 'Dec', y: [310, 460] }] },
                { name: 'Committed', type: 'line', data: [{ x: 'Jul', y: 200 }, { x: 'Aug', y: 232 }, { x: 'Sep', y: 258 }, { x: 'Oct', y: 290 }, { x: 'Nov', y: 332 }, { x: 'Dec', y: 372 }] },
              ]}
              apex={{
                colors: [cv('--ax-viz-cyan'), cv('--ax-accent')],
                fill: { opacity: [0.22, 1] },
                stroke: { width: [0, 2.5], curve: 'smooth' },
                yaxis: { labels: { formatter: (v: number) => '$' + v + 'K' } },
              }}
            />
          </div>
        </section>

        {/* Sales Target radial */}
        <section className="ax-card ax-col--4" role="region" aria-label="Sales target attainment">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Sales Target</h2><p className="ax-card__subtitle">Q2 quota attainment</p></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0, textAlign: 'center' }}>
            <ApexChart
              type="radialBar" height={240} legend="none"
              ariaLabel="Radial gauge showing 78 percent of quarterly quota attained"
              series={[78]}
              apex={{
                labels: ['Attained'],
                colors: [cv('--ax-accent')],
                plotOptions: { radialBar: { hollow: { size: '64%' }, track: { background: cv('--ax-surface-subtle') }, dataLabels: { name: { offsetY: 22, color: cv('--ax-text-muted'), fontSize: '13px' }, value: { offsetY: -14, fontFamily: cv('--ax-font-mono'), fontWeight: 700, fontSize: '30px', color: cv('--ax-text-strong') } } } },
              }}
            />
            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-6)', marginTop: 'var(--ax-space-3)' }}>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>Closed</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>$936K</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>Quota</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>$1.20M</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>Gap</small><b className="ax-num" style={{ color: 'var(--ax-viz-amber)', fontSize: 'var(--ax-text-md)' }}>$264K</b></div>
            </div>
          </div>
        </section>

        {/* Activities Due */}
        <section className="ax-card ax-col--4" role="region" aria-label="Activities due">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Activities Due</h2></div><a className="ax-btn ax-btn--link" href="#">Calendar</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-list ax-list--compact">
              {ACTIVITIES.map((a) => (
                <li key={a.time} className="ax-list__row" style={{ paddingInline: 0 }}>
                  <span className="ax-list__leading"><span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)' }}>{a.time}</span></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{a.title}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{a.sub}</span></span>
                  <span className="ax-list__trailing"><span className={`ax-badge ax-badge--soft ax-badge--${a.tone}`}>{a.badge}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Recent Deals */}
        <section className="ax-card ax-col--8" role="region" aria-label="Recent deals">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Deals</h2><p className="ax-card__subtitle">Latest pipeline movement</p></div><a className="ax-btn ax-btn--link" href="#">All deals</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Deal</th>
                  <th className="ax-table__th" scope="col">Stage</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Value</th>
                  <th className="ax-table__th" scope="col">Owner</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Close</th>
                </tr>
              </thead>
              <tbody>
                {DEALS.map((d) => (
                  <tr key={d.name} className="ax-table__row">
                    <td className="ax-table__td"><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{d.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{d.co}</div></td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ${d.tone ? `ax-badge--${d.tone} ` : ''}ax-badge--pill`}><span className="ax-badge__dot" />{d.stage}</span></td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>{d.value}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{d.owner}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{d.close}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Reps */}
        <section className="ax-card ax-col--4" role="region" aria-label="Top sales reps">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Top Sales Reps</h2></div><a className="ax-btn ax-btn--link" href="#">Leaderboard</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {REPS.map((r) => (
              <div key={r.initials} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${r.color} 22%,transparent)`, color: r.color, fontWeight: 600 }}>{r.initials}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{r.sub}</div></div>
                <div style={{ textAlign: 'right' }}><b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{r.amount}</b><span className={`ax-kpi__delta ax-kpi__delta--${r.up ? 'up' : 'down'}`} style={{ display: 'flex', justifyContent: 'flex-end' }}>{r.up ? ARROW_UP : ARROW_DN}{r.delta}</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent activity">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Activity</h2></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-timeline">
              <li className="ax-timeline__item ax-timeline__item--success">
                <span className="ax-timeline__marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
                <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Lena Brandt</b> closed <span style={{ color: 'var(--ax-accent)' }}>Helix Media</span> — $128,000</p><span className="ax-timeline__time">22m ago</span></div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-violet)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l18 0" /><path d="M4 18l10 -10l3 3l-10 10l-3 0l0 -3" /></svg></span>
                <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Tomás Herrera</b> moved <span style={{ color: 'var(--ax-text)' }}>Vertex Group</span> to Negotiation</p><span className="ax-timeline__time">48m ago</span></div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-cyan)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M3 7l9 6l9 -6" /></svg></span>
                <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Priya Nair</b> emailed proposal to <span style={{ color: 'var(--ax-text)' }}>Northwind Ltd</span></p><span className="ax-timeline__time">1h ago</span></div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-amber)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11h6m-3 -3v6" /></svg></span>
                <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Ava Sutton</b> added 24 leads from <span style={{ color: 'var(--ax-text)' }}>SaaStr</span> event</p><span className="ax-timeline__time">3h ago</span></div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export default Crm;
