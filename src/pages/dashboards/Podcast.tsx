/*
 * Vireo React — Podcast Studio dashboard (route "dashboards/podcast").
 *
 * Faithful re-expression of src/html/dashboards/podcast.html: a full-width "Key
 * figures" .ax-statgroup band on an .ax-card--filled, a
 * plays+subscribers mixed chart, a native "Now Playing" media card with a
 * play/pause toggle, a listens-by-platform donut, a listener-retention line
 * chart, a top-episodes table, an upcoming-releases timeline and a recent-reviews
 * grid. Charts go through <ApexChart>; DOM classes/ARIA match the reference 1:1.
 */
import { useState } from 'react';
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
const ICON_UPLOAD = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>
);

interface Stat { icon: ReactElement; iconClass: string; label: string; value: string; delta: string }
const STATS: Stat[] = [
  { iconClass: '', label: 'Total Plays', value: '1.82M', delta: '+9.5%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v16l13 -8l-13 -8" /></svg> },
  { iconClass: ' ax-statgroup__icon--c2', label: 'Subscribers', value: '64,200', delta: '+4.2%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2l0 -3" /><path d="M15 15a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2l0 -3" /><path d="M4 15v-3a8 8 0 0 1 16 0v3" /></svg> },
  { iconClass: ' ax-statgroup__icon--c3', label: 'Avg Listen-Through', value: '71%', delta: '+1.8%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6 -6l4 4l8 -8" /><path d="M14 7l7 0l0 7" /></svg> },
  { iconClass: ' ax-statgroup__icon--c4', label: 'Revenue (30D)', value: '$12,400', delta: '+7.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg> },
];

const PLATFORMS = [
  { label: 'Spotify', color: 'var(--ax-viz-cyan)', pct: '46%' },
  { label: 'Apple Podcasts', color: 'var(--ax-viz-violet)', pct: '31%' },
  { label: 'YouTube', color: 'var(--ax-viz-pink)', pct: '15%' },
  { label: 'Web player', color: 'var(--ax-viz-amber)', pct: '8%' },
];

const EPISODES = [
  { rank: '1', rankColor: 'var(--ax-viz-amber)', weight: 700, title: 'Why Founders Burn Out', sub: 'EP 142 · with Dr. Reyes', plays: '312K', completion: '79%', cColor: 'var(--ax-viz-emerald)', duration: '48:22', released: 'May 14' },
  { rank: '2', rankColor: 'var(--ax-text-muted)', weight: 700, muted: true, title: 'The AI Hype Cycle, Honestly', sub: 'EP 139 · solo', plays: '284K', completion: '76%', cColor: 'var(--ax-viz-emerald)', duration: '41:09', released: 'Apr 30' },
  { rank: '3', rankColor: 'var(--ax-viz-pink)', weight: 700, title: 'Designing for Trust', sub: 'EP 135 · with L. Brandt', plays: '241K', completion: '72%', cColor: 'var(--ax-text)', duration: '52:47', released: 'Apr 2' },
  { rank: '4', rankColor: 'var(--ax-viz-cyan)', weight: 600, title: 'Remote Teams That Last', sub: 'EP 131 · with M. Whitfield', plays: '198K', completion: '68%', cColor: 'var(--ax-text)', duration: '39:55', released: 'Mar 5' },
  { rank: '5', rankColor: 'var(--ax-viz-violet)', weight: 600, title: 'Pricing Without Fear', sub: 'EP 128 · solo', plays: '176K', completion: '70%', cColor: 'var(--ax-text)', duration: '34:18', released: 'Feb 12' },
];

const RELEASES = [
  { date: 'Jun 30', dateColor: 'var(--ax-accent)', title: 'EP 149 — Hiring Slow', sub: 'Editing · with R. Okafor' },
  { date: 'Jul 7', dateColor: 'var(--ax-text-muted)', title: 'EP 150 — Milestone Q&A', sub: 'Recording · live audience' },
  { date: 'Jul 14', dateColor: 'var(--ax-text-muted)', title: 'EP 151 — Open Source $', sub: 'Scheduled · with K. Devi' },
  { date: 'Jul 21', dateColor: 'var(--ax-text-muted)', title: 'EP 152 — Listener Mailbag', sub: 'Outlining · solo' },
];

const REVIEWS = [
  { initials: 'JD', color: 'var(--ax-viz-cyan)', handle: 'jordan_d', stars: '★★★★★', text: '"Best episode on burnout I\'ve heard. The pacing is perfect and the guest was incredible."', meta: 'Apple Podcasts · 2d ago' },
  { initials: 'SP', color: 'var(--ax-viz-violet)', handle: 's.peralta', stars: '★★★★☆', text: '"Great show overall — would love slightly shorter episodes for the commute, but content is gold."', meta: 'Spotify · 4d ago' },
  { initials: 'MN', color: 'var(--ax-viz-pink)', handle: 'm.nakajima', stars: '★★★★★', text: '"The pricing episode changed how I run my freelance business. Practical and honest. Subscribed!"', meta: 'YouTube · 5d ago' },
];

export function Podcast() {
  const [playing, setPlaying] = useState(false);
  const progress = 38;

  return (
    <>
      <PageHead
        title="Podcast Studio"
        subtitle="Listens, subscribers and episode performance — The Signal show."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 30 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_EXPORT}<span className="ax-btn__label">Export</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_UPLOAD}<span className="ax-btn__label">Upload Episode</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* KEY FIGURES — one band, not a row of four separate tiles */}
        <section className="ax-card ax-card--filled ax-col--12" role="region" aria-label="Key figures">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Key figures</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
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

        {/* HERO: Plays & Subscribers mixed (7) */}
        <section className="ax-card ax-card--chart ax-col--7" role="region" aria-label="Plays and subscribers">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Performance</span>
              <h2 className="ax-card__title">Plays &amp; Subscribers</h2>
              <p className="ax-card__subtitle">Weekly plays vs. net new subscribers</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Plays</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Net subs</small></span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="line" height={310} legend="none" accent
              ariaLabel="Mixed chart: weekly plays area with net new subscriber columns"
              series={[
                { name: 'Plays', type: 'line', data: [128, 142, 136, 158, 150, 172, 166, 188, 180, 204, 196, 224] },
                { name: 'Net subs', type: 'column', data: [38, 44, 40, 52, 48, 58, 54, 64, 60, 72, 68, 82] },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan')],
                stroke: { width: [3, 0], curve: 'smooth' },
                fill: { type: ['solid', 'solid'], opacity: [1, 0.85] },
                plotOptions: { bar: { columnWidth: '38%', borderRadius: 3 } },
                xaxis: { categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'] },
                yaxis: { labels: { formatter: (v: number) => v + 'K' } },
              }}
            />
          </div>
        </section>

        {/* Now Playing media card (5) */}
        <section className="ax-card ax-col--5" role="region" aria-label="Now playing">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Latest episode</span>
              <h2 className="ax-card__title">Now Playing</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ax-radius-lg)', aspectRatio: '16/9', background: 'var(--ax-gradient-plate)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--ax-space-4)', boxShadow: 'var(--ax-shadow-md)' }}>
              <span aria-hidden="true" style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.16)', filter: 'blur(4px)' }} />
              <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'relative', opacity: 0.95 }}><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
              <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ position: 'absolute', top: 'var(--ax-space-3)', left: 'var(--ax-space-3)', background: 'rgba(0,0,0,.32)', color: '#fff', border: 0 }}>EP 148</span>
            </div>
            <div style={{ marginBottom: 'var(--ax-space-3)' }}>
              <div style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>The Cost of Speed</div>
              <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Maya Okonkwo &amp; guest Theo Park</div>
            </div>
            <div className="ax-progress ax-progress--sm" style={{ marginBottom: 6 }}><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${progress}%` }} /></div></div>
            <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-4)' }}>
              <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>16:42</span>
              <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>44:08</span>
            </div>
            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-4)' }}>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Previous episode">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 5v14l-12 -7l12 -7" /><path d="M4 5l0 14" /></svg>
              </button>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--icon" style={{ width: 52, height: 52, borderRadius: 'var(--ax-radius-pill)' }} onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                {!playing
                  ? <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v16l13 -8l-13 -8" /></svg>
                  : <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /></svg>}
              </button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Next episode">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5v14l12 -7l-12 -7" /><path d="M20 5l0 14" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* By Platform donut (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Listens by platform">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">By Platform</h2>
              <p className="ax-card__subtitle">Share of listens</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut: Spotify, Apple Podcasts, YouTube, Web"
              series={[46, 31, 15, 8]}
              apex={{
                labels: ['Spotify', 'Apple Podcasts', 'YouTube', 'Web'],
                colors: [cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Plays', formatter: () => '1.82M' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {PLATFORMS.map((p) => (
                <li key={p.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: p.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{p.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{p.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Listener Retention line (8) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Listener retention">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Listener Retention</h2>
              <p className="ax-card__subtitle">Drop-off across episode 148 duration</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">All episodes</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="line" height={290} legend="none" accent
              ariaLabel="Line chart of listener retention decreasing across episode duration"
              series={[{ name: 'Listeners', data: [100, 98, 95, 91, 88, 86, 83, 80, 78, 75, 72, 69, 66, 62, 58, 54, 49, 44] }]}
            />
          </div>
        </section>

        {/* Top Episodes (8) */}
        <section className="ax-card ax-col--8" role="region" aria-label="Top episodes">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Top Episodes</h2>
              <p className="ax-card__subtitle">Most played in the last 90 days</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">View all</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Episode</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Plays</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Completion</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Duration</th>
                  <th className="ax-table__th" scope="col">Released</th>
                </tr>
              </thead>
              <tbody>
                {EPISODES.map((e) => (
                  <tr key={e.title} className="ax-table__row">
                    <td className="ax-table__td"><div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${e.muted ? 'var(--ax-text-subtle)' : e.rankColor} ${e.muted ? 22 : (e.weight === 700 ? 20 : 18)}%,transparent)`, color: e.muted ? 'var(--ax-text-muted)' : e.rankColor, fontWeight: e.weight }}>{e.rank}</span><div><div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', maxWidth: 260 }}>{e.title}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{e.sub}</div></div></div></td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>{e.plays}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: e.cColor }}>{e.completion}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{e.duration}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{e.released}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Upcoming Releases (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Upcoming releases">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Upcoming Releases</h2>
              <p className="ax-card__subtitle">Production schedule</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Calendar</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            {RELEASES.map((r) => (
              <div key={r.title} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: r.dateColor, minWidth: 54, fontWeight: 600 }}>{r.date}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0, borderLeft: '2px solid var(--ax-border)', paddingLeft: 'var(--ax-space-3)' }}>
                  <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.title}</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Reviews (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent reviews">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Recent Reviews</h2>
              <p className="ax-card__subtitle">Latest listener ratings across platforms</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">All reviews</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 'var(--ax-space-2)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--ax-space-5)' }}>
            {REVIEWS.map((r) => (
              <div key={r.handle} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between' }}>
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${r.color} 18%,transparent)`, color: r.color, fontWeight: 600 }}>{r.initials}</span><b style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{r.handle}</b></div>
                  <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'calc(var(--ax-text-md) * 1.25)', letterSpacing: 2, color: 'var(--ax-viz-amber)' }}>{r.stars}</span>
                </div>
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>{r.text}</p>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{r.meta}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Podcast;
