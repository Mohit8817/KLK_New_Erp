/*
 * Vireo React — Social Media dashboard (route "dashboards/social").
 *
 * Faithful re-expression of src/html/dashboards/social.html: an audience-growth
 * area chart with an "At a glance" .ax-statgroup rail (.ax-card--flat) beside it,
 * an engagement-by-platform goal-bar breakdown, an
 * engagement-types donut, a sentiment semi-gauge (radialBar), a scheduled-posts
 * timeline, a top-posts table and a recent-mentions feed. Charts go through
 * <ApexChart>; DOM classes/ARIA match the reference 1:1.
 */
import type { ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const ICON_CAL = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></svg>
);
const ICON_CHEV = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const ICON_EXPORT = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);

interface Stat { icon: ReactElement; iconClass: string; label: string; value: string; delta: string }
const STATS: Stat[] = [
  { iconClass: '', label: 'Total Followers', value: '482K', delta: '+3.8%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg> },
  { iconClass: ' ax-statgroup__icon--c2', label: 'Engagement Rate', value: '4.6%', delta: '+0.5%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg> },
  { iconClass: ' ax-statgroup__icon--c3', label: 'Impressions (30D)', value: '2.4M', delta: '+12.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg> },
  { iconClass: ' ax-statgroup__icon--c4', label: 'New Followers (30D)', value: '18.2K', delta: '+6.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4" /><path d="M19 16v6" /><path d="M16 19h6" /></svg> },
];

const PLATFORMS = [
  { label: 'Instagram', pct: 38, color: 'var(--ax-accent)' },
  { label: 'TikTok', pct: 27, color: 'var(--ax-viz-cyan)' },
  { label: 'X / Twitter', pct: 16, color: 'var(--ax-viz-violet)' },
  { label: 'LinkedIn', pct: 12, color: 'var(--ax-viz-pink)' },
  { label: 'Facebook', pct: 7, color: 'var(--ax-viz-amber)' },
];

const ENGAGE = [
  { label: 'Likes', color: 'var(--ax-viz-cyan)', value: '684K' },
  { label: 'Comments', color: 'var(--ax-viz-violet)', value: '142K' },
  { label: 'Shares', color: 'var(--ax-viz-pink)', value: '96K' },
  { label: 'Saves', color: 'var(--ax-viz-amber)', value: '58K' },
];

const SCHEDULED = [
  { date: 'Today', dateColor: 'var(--ax-accent)', title: 'Summer collection teaser', sub: 'Instagram · Reel · 18:00' },
  { date: 'Jun 28', dateColor: 'var(--ax-text-muted)', title: 'Behind-the-scenes thread', sub: 'X · Thread · 12:30' },
  { date: 'Jun 29', dateColor: 'var(--ax-text-muted)', title: 'Customer spotlight', sub: 'TikTok · Video · 09:00' },
  { date: 'Jul 1', dateColor: 'var(--ax-text-muted)', title: 'Q3 hiring announcement', sub: 'LinkedIn · Article · 10:00' },
];

const POST_ICONS: Record<string, ReactElement> = {
  ig: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 8h.01" /><path d="M4 4m0 3a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3z" /><path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5" /><path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2" /></svg>,
  tiktok: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v16l13 -8z" /></svg>,
  x: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9h8" /><path d="M8 13h6" /><path d="M9 18l-1 3l3 -2h6a2 2 0 0 0 2 -2v-9a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h3" /></svg>,
  linkedin: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 11m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M16 19h6" /><path d="M19 16v6" /><path d="M21 21l-2 -2" /></svg>,
  igplain: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 8h.01" /><path d="M4 4m0 3a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3z" /><path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5" /></svg>,
};

const POSTS = [
  { color: 'var(--ax-viz-pink)', icon: 'ig', title: 'Sunset launch carousel', platform: 'Instagram', pColor: 'var(--ax-accent)', reach: '412K', engagement: '48.2K', rate: '11.7%', rateColor: 'var(--ax-viz-emerald)' },
  { color: 'var(--ax-viz-cyan)', icon: 'tiktok', title: 'Studio process timelapse', platform: 'TikTok', pColor: 'var(--ax-viz-cyan)', reach: '368K', engagement: '39.6K', rate: '10.8%', rateColor: 'var(--ax-viz-emerald)' },
  { color: 'var(--ax-viz-violet)', icon: 'x', title: 'Why we rebuilt our app', platform: 'X', pColor: 'var(--ax-viz-violet)', reach: '214K', engagement: '19.1K', rate: '8.9%', rateColor: 'var(--ax-text)' },
  { color: 'var(--ax-viz-amber)', icon: 'linkedin', title: 'Hiring: 4 open roles', platform: 'LinkedIn', pColor: 'var(--ax-viz-amber)', reach: '98K', engagement: '7.4K', rate: '7.6%', rateColor: 'var(--ax-text)' },
  { color: 'var(--ax-viz-emerald)', icon: 'igplain', title: 'Customer reviews roundup', platform: 'Instagram', pColor: 'var(--ax-accent)', reach: '76K', engagement: '5.1K', rate: '6.7%', rateColor: 'var(--ax-text)' },
];

export function Social() {
  return (
    <>
      <PageHead
        title="Social Media"
        subtitle="Audience growth and engagement across 5 connected channels."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 30 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_EXPORT}<span className="ax-btn__label">Export</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">Create Post</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* HERO: Audience Growth area (8) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Audience growth">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Reach</span>
              <h2 className="ax-card__title">Audience Growth</h2>
              <p className="ax-card__subtitle">Reach &amp; impressions over the last 12 weeks</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Reach</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Impressions</small></span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="area" height={310} legend="none" accent
              ariaLabel="Area chart of reach and impressions over twelve weeks"
              series={[
                { name: 'Reach', data: [182, 210, 198, 240, 232, 268, 254, 290, 278, 312, 330, 358] },
                { name: 'Impressions', data: [420, 468, 452, 520, 498, 560, 540, 600, 584, 648, 690, 742] },
              ]}
            />
          </div>
        </section>

        {/* KPI RAIL — the headline figures stacked beside the hero */}
        <section className="ax-card ax-card--flat ax-col--4" role="region" aria-label="Key figures">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">At a glance</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup ax-statgroup--stack">
              {STATS.map((s) => (
                <div key={s.label} className="ax-statgroup__cell">
                  <span className={`ax-statgroup__icon${s.iconClass}`}>{s.icon}</span>
                  <span className="ax-statgroup__text">
                    <span className="ax-statgroup__label">{s.label}</span>
                    <span className="ax-statgroup__value ax-num">{s.value}</span>
                  </span>
                  <span className="ax-statgroup__delta ax-statgroup__delta--up">{s.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* By Platform goal bars (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Engagement by platform">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">By Platform</h2>
              <p className="ax-card__subtitle">Share of engagement</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {PLATFORMS.map((p) => (
              <div key={p.label}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{p.label}</span><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{p.pct}%</b></div>
                <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p.pct}%`, background: p.color }} /></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Engagement Types donut (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Engagement types">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Engagement Types</h2>
              <p className="ax-card__subtitle">Last 30 days</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut: Likes, Comments, Shares, Saves"
              series={[684, 142, 96, 58]}
              apex={{
                labels: ['Likes', 'Comments', 'Shares', 'Saves'],
                colors: [cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600, formatter: (v: string) => (Number(v) / 1000).toFixed(0) + 'K' }, total: { show: true, label: 'Total', formatter: () => '980K' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {ENGAGE.map((e) => (
                <li key={e.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: e.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{e.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{e.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Audience Sentiment semi-gauge (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Audience sentiment">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Audience Sentiment</h2>
              <p className="ax-card__subtitle">Mentions analysis</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="radialBar" height={230}
              ariaLabel="Semi-gauge: 72% positive sentiment"
              series={[72]}
              apex={{
                labels: ['Positive'],
                colors: [cv('--ax-viz-emerald')],
                plotOptions: { radialBar: { startAngle: -90, endAngle: 90, hollow: { size: '58%' }, track: { background: cv('--ax-surface-subtle'), startAngle: -90, endAngle: 90 }, dataLabels: { name: { offsetY: -6, color: cv('--ax-text-muted'), fontSize: '13px' }, value: { offsetY: -38, fontFamily: cv('--ax-font-display'), fontWeight: 700, fontSize: '28px', color: cv('--ax-text-strong') } } } },
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--ax-space-3)', textAlign: 'center', marginTop: 'var(--ax-space-2)' }}>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Positive</small><b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-md)' }}>72%</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Neutral</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>21%</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Negative</small><b className="ax-num" style={{ color: 'var(--ax-danger-500)', fontSize: 'var(--ax-text-md)' }}>7%</b></div>
            </div>
          </div>
        </section>

        {/* Scheduled Posts (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Scheduled posts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Scheduled Posts</h2>
              <p className="ax-card__subtitle">Next up in queue</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Queue</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            {SCHEDULED.map((s) => (
              <div key={s.title} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: s.dateColor, minWidth: 54, fontWeight: 600 }}>{s.date}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0, borderLeft: '2px solid var(--ax-border)', paddingLeft: 'var(--ax-space-3)' }}>
                  <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.title}</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Posts (8) */}
        <section className="ax-card ax-col--8" role="region" aria-label="Top performing posts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Top Posts</h2>
              <p className="ax-card__subtitle">Best performers this month</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">View all</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Post</th>
                  <th className="ax-table__th" scope="col">Platform</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Reach</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Engagement</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rate</th>
                </tr>
              </thead>
              <tbody>
                {POSTS.map((p) => (
                  <tr key={p.title} className="ax-table__row">
                    <td className="ax-table__td"><div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${p.color} 18%,transparent)`, color: p.color }}>{POST_ICONS[p.icon]}</span><div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', maxWidth: 240 }}>{p.title}</div></div></td>
                    <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--pill" style={{ color: p.pColor }}>{p.platform}</span></td>
                    <td className="ax-table__td ax-table__td--num">{p.reach}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>{p.engagement}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: p.rateColor }}>{p.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Mentions feed (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent mentions">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Recent Mentions</h2></div>
            <a className="ax-btn ax-btn--link" href="#">Inbox</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-timeline">
              <li className="ax-timeline__item ax-timeline__item--success">
                <span className="ax-timeline__marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 9l-2 2" /><path d="M9 9l.01 0" /><path d="M15 9l.01 0" /><path d="M8 13a4 4 0 1 0 8 0" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>@maria.codes</b> "Obsessed with the new packaging 😍"</p>
                  <span className="ax-timeline__time">6m ago · Instagram</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-cyan)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9h8" /><path d="M8 13h6" /><path d="M9 18l-1 3l3 -2h6a2 2 0 0 0 2 -2v-9a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h3" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>@devon_b</b> asked about restock dates</p>
                  <span className="ax-timeline__time">22m ago · X</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-violet)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>@studioline</b> reshared your launch reel</p>
                  <span className="ax-timeline__time">48m ago · Instagram</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-danger-500)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16h.01" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>@jordan.k</b> reported a shipping delay</p>
                  <span className="ax-timeline__time">1h ago · Facebook</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-amber)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>@techweekly</b> tagged you in a roundup</p>
                  <span className="ax-timeline__time">3h ago · LinkedIn</span>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export default Social;
