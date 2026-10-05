/*
 * Vireo React — NFT Marketplace dashboard (route "dashboards/nft").
 *
 * Faithful re-expression of src/html/dashboards/nft.html: a full-width "Key
 * figures" .ax-statgroup band on a --filled card, a Volume & Floor mixed chart,
 * sales-by-category donut, a live-auctions tile grid, trending-collections
 * table, top-creators rail and a recent-activity table. Spans come from the
 * shared .ax-dash-grid defaults + ax-col--N. Charts via <ApexChart>.
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
const ICON_WALLET = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3" /><path d="M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4" /><path d="M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0s3 -1.526 3 -2.598s-1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0s-3 1.526 -3 2.598" /><path d="M3 6v10c0 .888 .772 1.45 2 2" /></svg>
);
const ICON_CREATE = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 5h12l3 5l-8.5 9.5a.7 .7 0 0 1 -1 0l-8.5 -9.5l3 -5" /><path d="M10 12l-2 -2.2l.6 -1" /></svg>
);
const CLOCK_ICON = (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></svg>
);

interface Stat { icon: ReactElement; iconClass?: string; label: string; value: string; delta: string; }
const STATS: Stat[] = [
  { label: 'Total Volume', value: '1,284 ETH', delta: '+14.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 12l6 -9l6 9l-6 9l-6 -9" /><path d="M6 12l6 -3l6 3l-6 2l-6 -2" /></svg> },
  { label: 'Floor Price', value: '2.4 ETH', delta: '+3.2%', iconClass: 'ax-statgroup__icon--c2', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 5h12l3 5l-8.5 9.5a.7 .7 0 0 1 -1 0l-8.5 -9.5l3 -5" /><path d="M10 12l-2 -2.2l.6 -1" /></svg> },
  { label: 'Items Sold (24h)', value: '318', delta: '+6.1%', iconClass: 'ax-statgroup__icon--c3', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></svg> },
  { label: 'Unique Owners', value: '5,210', delta: '+1.0%', iconClass: 'ax-statgroup__icon--c4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg> },
];

const CATS = [
  { label: 'Art', pct: '42%', color: '#38BDF8' },
  { label: 'Collectibles', pct: '26%', color: '#A78BFA' },
  { label: 'Gaming', pct: '20%', color: '#F472B6' },
  { label: 'Music', pct: '12%', color: '#FBBF24' },
];
const AUCTIONS = [
  { grad: 'linear-gradient(135deg, color-mix(in oklab,var(--ax-viz-violet) 60%,transparent), color-mix(in oklab,var(--ax-viz-cyan) 55%,transparent))', tick: '00:42:18', name: 'Neon Drifter #218', by: 'by Vortex Labs', bid: '3.8 ETH' },
  { grad: 'linear-gradient(135deg, color-mix(in oklab,var(--ax-viz-pink) 60%,transparent), color-mix(in oklab,var(--ax-viz-amber) 55%,transparent))', tick: '01:14:05', name: 'Pastel Voyage #07', by: 'by Mira Aoki', bid: '2.1 ETH' },
  { grad: 'linear-gradient(135deg, color-mix(in oklab,var(--ax-viz-emerald) 60%,transparent), color-mix(in oklab,var(--ax-viz-cyan) 55%,transparent))', tick: '00:09:51', name: 'Glyph Engine #44', by: 'by Helio Studio', bid: '5.4 ETH' },
  { grad: 'linear-gradient(135deg, color-mix(in oklab,var(--ax-viz-amber) 60%,transparent), color-mix(in oklab,var(--ax-viz-pink) 55%,transparent))', tick: '02:31:40', name: 'Iron Bloom #99', by: 'by Kojima.eth', bid: '1.7 ETH' },
];
const COLLECTIONS = [
  { rank: '1', grad: 'linear-gradient(135deg,#A78BFA,#38BDF8)', name: 'Aurora Genesis', items: '10,000 items', floor: '4.20 ETH', vol: '812 ETH', ch: '+22.4%', chColor: 'var(--ax-viz-emerald)' },
  { rank: '2', grad: 'linear-gradient(135deg,#F472B6,#FBBF24)', name: 'Pixel Nomads', items: '6,000 items', floor: '1.85 ETH', vol: '540 ETH', ch: '+11.7%', chColor: 'var(--ax-viz-emerald)' },
  { rank: '3', grad: 'linear-gradient(135deg,#34D399,#38BDF8)', name: 'Chrome Spirits', items: '8,888 items', floor: '2.40 ETH', vol: '428 ETH', ch: '−4.1%', chColor: 'var(--ax-viz-red)' },
  { rank: '4', grad: 'linear-gradient(135deg,#FBBF24,#FB7185)', name: 'Solar Beasts', items: '4,200 items', floor: '0.92 ETH', vol: '316 ETH', ch: '+8.9%', chColor: 'var(--ax-viz-emerald)' },
  { rank: '5', grad: 'linear-gradient(135deg,#38BDF8,#A78BFA)', name: 'Echo Wardens', items: '3,333 items', floor: '1.10 ETH', vol: '204 ETH', ch: '+3.5%', chColor: 'var(--ax-viz-emerald)' },
];
const CREATORS = [
  { rank: '1', rankColor: 'var(--ax-warning-500)', grad: 'linear-gradient(135deg,#A78BFA,#F472B6)', name: 'Vortex Labs', handle: '@vortex', vol: '312 ETH' },
  { rank: '2', rankColor: 'var(--ax-text-muted)', grad: 'linear-gradient(135deg,#34D399,#38BDF8)', name: 'Mira Aoki', handle: '@miraink', vol: '248 ETH' },
  { rank: '3', rankColor: 'var(--ax-text-subtle)', grad: 'linear-gradient(135deg,#FBBF24,#FB7185)', name: 'Helio Studio', handle: '@helio', vol: '196 ETH' },
  { rank: '4', rankColor: 'var(--ax-text-subtle)', grad: 'linear-gradient(135deg,#38BDF8,#34D399)', name: 'Kojima.eth', handle: '@kojima', vol: '154 ETH' },
  { rank: '5', rankColor: 'var(--ax-text-subtle)', grad: 'linear-gradient(135deg,#F472B6,#A78BFA)', name: 'Nova Reyes', handle: '@novart', vol: '121 ETH' },
];
const ACTIVITY = [
  { grad: 'linear-gradient(135deg,#A78BFA,#38BDF8)', item: 'Aurora Genesis #1822', event: 'Sale', tone: 'success', price: '4.20 ETH', priceColor: 'var(--ax-text-strong)', flow: '0x8a2f → 0x14bd', time: '2m ago' },
  { grad: 'linear-gradient(135deg,#F472B6,#FBBF24)', item: 'Pixel Nomads #441', event: 'Bid', tone: 'info', price: '2.05 ETH', priceColor: 'var(--ax-text-strong)', flow: '0x77c1 → —', time: '6m ago' },
  { grad: 'linear-gradient(135deg,#34D399,#38BDF8)', item: 'Chrome Spirits #309', event: 'Transfer', tone: 'neutral', price: '—', priceColor: 'var(--ax-text-subtle)', flow: '0x2def → 0x9a01', time: '14m ago' },
  { grad: 'linear-gradient(135deg,#FBBF24,#FB7185)', item: 'Solar Beasts #88', event: 'Sale', tone: 'success', price: '0.95 ETH', priceColor: 'var(--ax-text-strong)', flow: '0x55ab → 0xc3f2', time: '23m ago' },
  { grad: 'linear-gradient(135deg,#38BDF8,#A78BFA)', item: 'Echo Wardens #1201', event: 'List', tone: 'warning', price: '1.20 ETH', priceColor: 'var(--ax-text-strong)', flow: '0xb0de → —', time: '38m ago' },
];

export function Nft() {
  return (
    <>
      <PageHead
        title="NFT Marketplace"
        subtitle="Trading volume climbed 14% this week across 5,210 owners."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 7 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_WALLET}<span className="ax-btn__label">My Wallet</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_CREATE}<span className="ax-btn__label">Create NFT</span></button>
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
                  <span className={s.iconClass ? `ax-statgroup__icon ${s.iconClass}` : 'ax-statgroup__icon'}>{s.icon}</span>
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

        {/* HERO: Volume & Floor Trend */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Volume and floor trend">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Marketplace</span>
              <h2 className="ax-card__title">Volume &amp; Floor Trend</h2>
              <p className="ax-card__subtitle">Daily volume (ETH) vs. floor price</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Date range">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">7D</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">30D</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">90D</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Volume (ETH)</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-violet)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Floor (ETH)</small></span>
            </div>
            <ApexChart
              type="line" height={300} legend="none" accent
              ariaLabel="Mixed chart of daily volume columns with floor price line"
              series={[
                { name: 'Volume (ETH)', type: 'column', data: [142, 168, 131, 196, 184, 221, 208, 245, 232, 268] },
                { name: 'Floor (ETH)', type: 'line', data: [1.8, 1.9, 1.85, 2.0, 2.1, 2.05, 2.2, 2.3, 2.35, 2.4] },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-violet')],
                stroke: { width: [0, 3], curve: 'smooth' },
                plotOptions: { bar: { borderRadius: 4, columnWidth: '52%' } },
                yaxis: [
                  { labels: { formatter: (v: number) => String(Math.round(v)) } },
                  { opposite: true, labels: { formatter: (v: number) => v.toFixed(1) } },
                ],
              }}
            />
          </div>
        </section>

        {/* Sales by Category */}
        <section className="ax-card ax-col--4" role="region" aria-label="Sales by category">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Sales by Category</h2></div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Category options">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut chart of sales by category: art 42%, collectibles 26%, gaming 20%, music 12%"
              series={[42, 26, 20, 12]}
              apex={{
                labels: ['Art', 'Collectibles', 'Gaming', 'Music'],
                colors: [cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Sales', formatter: () => '1,284' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {CATS.map((c) => (
                <li key={c.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: c.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{c.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{c.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Live Auctions */}
        <section className="ax-card ax-col--12" role="region" aria-label="Live auctions">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Live Auctions</h2><p className="ax-card__subtitle">Ending soon — current highest bids</p></div><a className="ax-btn ax-btn--link" href="#">Browse all</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--ax-space-4)' }}>
            {AUCTIONS.map((a) => (
              <article key={a.name} className="ax-card ax-card--interactive" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1/1', background: a.grad, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 'var(--ax-space-3)' }}>
                  <span className="ax-badge ax-badge--solid ax-badge--accent ax-badge--pill" style={{ position: 'absolute', top: 'var(--ax-space-3)', left: 'var(--ax-space-3)' }}><span className="ax-badge__dot" />Live</span>
                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{CLOCK_ICON}<span>{a.tick}</span></span>
                </div>
                <div className="ax-card__body" style={{ padding: 'var(--ax-space-3)' }}>
                  <div style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{a.name}</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginBottom: 'var(--ax-space-2)' }}>{a.by}</div>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Current bid</span><b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-accent)' }}>{a.bid}</b></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Trending Collections */}
        <section className="ax-card ax-col--8" role="region" aria-label="Trending collections">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Trending Collections</h2><p className="ax-card__subtitle">Ranked by 24h volume</p></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">#</th>
                  <th className="ax-table__th" scope="col">Collection</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Floor</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Volume</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">24h</th>
                </tr>
              </thead>
              <tbody>
                {COLLECTIONS.map((c) => (
                  <tr key={c.rank} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-subtle)' }}>{c.rank}</td>
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                        <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: c.grad }} />
                        <div><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{c.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{c.items}</div></div>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{c.floor}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{c.vol}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: c.chColor }}>{c.ch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Creators */}
        <section className="ax-card ax-col--4" role="region" aria-label="Top creators">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Top Creators</h2></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {CREATORS.map((c) => (
              <div key={c.rank} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: c.rankColor, width: 18, textAlign: 'center' }}>{c.rank}</b>
                <span className="ax-avatar ax-avatar--squircle" style={{ background: c.grad }} />
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{c.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{c.handle}</div></div>
                <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{c.vol}</b>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent activity">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Activity</h2><p className="ax-card__subtitle">Latest sales, bids &amp; transfers</p></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Item</th>
                  <th className="ax-table__th" scope="col">Event</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Price</th>
                  <th className="ax-table__th" scope="col">From → To</th>
                  <th className="ax-table__th" scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY.map((a, i) => (
                  <tr key={i} className="ax-table__row">
                    <td className="ax-table__td"><div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: a.grad }} /><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{a.item}</div></div></td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${a.tone} ax-badge--pill`}>{a.event}</span></td>
                    {a.price === '—'
                      ? <td className="ax-table__td ax-table__td--num" style={{ color: a.priceColor }}>{a.price}</td>
                      : <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: a.priceColor }}>{a.price}</td>}
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{a.flow}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-subtle)' }}>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

export default Nft;
