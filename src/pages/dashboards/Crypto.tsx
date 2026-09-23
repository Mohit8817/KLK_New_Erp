/*
 * Vireo React — Crypto dashboard (route "dashboards/crypto").
 *
 * Faithful re-expression of src/html/dashboards/crypto.html: 4 KPI cards, a
 * market-movers ticker strip, portfolio-performance area + allocation donut,
 * BTC candlestick, a native Trade form (port of the Alpine x-data), a Fear &
 * Greed semi-gauge, holdings table and a watchlist rail. Spans come from the
 * shared .ax-dash-grid defaults + ax-col--N; the hero chart is --bleed and the
 * watchlist rail is --flat. Charts via <ApexChart>.
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
const ICON_BTC = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6h8a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-8" /><path d="M8 6l0 12" /><path d="M8 12l6 0" /><path d="M9 3l0 3" /><path d="M13 3l0 3" /><path d="M9 18l0 3" /><path d="M13 18l0 3" /></svg>
);
const ARROW_UP = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>);
const ARROW_DN = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>);

const COIN_ICON: Record<string, ReactElement> = {
  btc: <path d="M6 6h8a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-8M8 6l0 12M8 12l6 0M9 3l0 3M13 3l0 3M9 18l0 3M13 18l0 3" />,
  eth: <><path d="M6 12l6 -9l6 9l-6 9l-6 -9" /><path d="M6 12l6 -3l6 3l-6 2l-6 -2" /></>,
  sol: <><path d="M4 18h12l4 -4h-12l-4 4" /><path d="M8 14l-4 -4h12l4 4" /><path d="M16 10l4 -4h-12l-4 4" /></>,
  avax: <><path d="M9 6l6 6l-6 6" /><path d="M5 9l3 3l-3 3" /></>,
  ada: <><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 12l9 -3" /></>,
  dot: <><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M8 12h8" /></>,
  usdt: <><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M9 9h6" /><path d="M9 15h6" /></>,
  link: <><path d="M9 6l6 6l-6 6" /><path d="M5 9l3 3l-3 3" /></>,
  matic: <><path d="M12 3a9 9 0 1 0 9 9" /><path d="M7 12h10" /><path d="M12 7v10" /></>,
  ltc: <path d="M12 3l8 6l-8 12l-8 -12z" />,
};

interface Kpi { region: string; icon: ReactElement; iconClass: string; up: boolean; delta: string; label: string; value: string; valueColor?: string; color: string; spark: number[]; }
const KPIS: Kpi[] = [
  { region: 'Portfolio Value $86,420, up 4.8% over 24 hours', iconClass: 'c1', up: true, delta: '4.8%', label: 'Portfolio Value', value: '$86,420', color: '--ax-accent', spark: [7, 10, 9, 15, 18, 22, 26, 29], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" /></svg> },
  { region: '24 hour profit and loss positive $3,940, up 4.8%', iconClass: 'c2', up: true, delta: '4.8%', label: '24h Profit / Loss', value: '+$3,940', valueColor: 'var(--ax-viz-emerald)', color: '--ax-viz-emerald', spark: [8, 12, 10, 17, 15, 22, 20, 28], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6 -6l4 4l8 -8" /><path d="M14 7l7 0l0 7" /></svg> },
  { region: 'Best performer SOL up 18.2%', iconClass: 'c3', up: true, delta: '18.2%', label: 'Best Performer', value: 'SOL', color: '--ax-viz-violet', spark: [4, 7, 11, 10, 18, 20, 25, 31], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 18h12l4 -4h-12l-4 4" /><path d="M8 14l-4 -4h12l4 4" /><path d="M16 10l4 -4h-12l-4 4" /></svg> },
  { region: 'Available balance $12,300, down 1.1%', iconClass: 'c4', up: false, delta: '1.1%', label: 'Available Balance', value: '$12,300', color: '--ax-viz-amber', spark: [22, 20, 23, 18, 20, 15, 17, 13], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg> },
];

const MOVERS = [
  { sym: 'BTC', pct: '+2.1%', pctColor: 'var(--ax-viz-emerald)', price: '$67,840', color: '#FBBF24', icon: 'btc' },
  { sym: 'ETH', pct: '+3.7%', pctColor: 'var(--ax-viz-emerald)', price: '$3,512', color: '#A78BFA', icon: 'eth' },
  { sym: 'SOL', pct: '+18.2%', pctColor: 'var(--ax-viz-emerald)', price: '$184.20', color: '#34D399', icon: 'sol' },
  { sym: 'AVAX', pct: '−2.4%', pctColor: 'var(--ax-viz-red)', price: '$38.10', color: '#38BDF8', icon: 'avax' },
  { sym: 'ADA', pct: '+1.3%', pctColor: 'var(--ax-viz-emerald)', price: '$0.452', color: '#F472B6', icon: 'ada' },
  { sym: 'DOT', pct: '−0.8%', pctColor: 'var(--ax-viz-red)', price: '$6.94', color: '#FB7185', icon: 'dot' },
];
const ALLOC = [
  { label: 'Bitcoin', pct: '46%', color: '#FBBF24' },
  { label: 'Ethereum', pct: '28%', color: '#A78BFA' },
  { label: 'Solana', pct: '16%', color: '#34D399' },
  { label: 'Tether', pct: '10%', color: '#38BDF8' },
];
const HOLDINGS = [
  { name: 'Bitcoin', sym: 'BTC', icon: 'btc', color: '#FBBF24', holdings: '0.586', price: '$67,840', ch: '+2.1%', chColor: 'var(--ax-viz-emerald)', value: '$39,754' },
  { name: 'Ethereum', sym: 'ETH', icon: 'eth', color: '#A78BFA', holdings: '6.892', price: '$3,512', ch: '+3.7%', chColor: 'var(--ax-viz-emerald)', value: '$24,205' },
  { name: 'Solana', sym: 'SOL', icon: 'sol', color: '#34D399', holdings: '74.50', price: '$184.20', ch: '+18.2%', chColor: 'var(--ax-viz-emerald)', value: '$13,723' },
  { name: 'Tether', sym: 'USDT', icon: 'usdt', color: '#38BDF8', holdings: '8,738', price: '$1.00', ch: '0.0%', chColor: 'var(--ax-text-subtle)', value: '$8,738' },
  { name: 'Avalanche', sym: 'AVAX', icon: 'dot', color: '#FB7185', holdings: '42.10', price: '$38.10', ch: '−2.4%', chColor: 'var(--ax-viz-red)', value: '$1,604' },
];
const WATCHLIST = [
  { name: 'Cardano', sym: 'ADA', icon: 'ada', color: '#38BDF8', price: '$0.452', ch: '+1.3%', chColor: 'var(--ax-viz-emerald)' },
  { name: 'Polkadot', sym: 'DOT', icon: 'dot', color: '#FB7185', price: '$6.94', ch: '−0.8%', chColor: 'var(--ax-viz-red)' },
  { name: 'Chainlink', sym: 'LINK', icon: 'link', color: '#A78BFA', price: '$14.82', ch: '+5.4%', chColor: 'var(--ax-viz-emerald)' },
  { name: 'Polygon', sym: 'MATIC', icon: 'matic', color: '#FBBF24', price: '$0.728', ch: '+2.9%', chColor: 'var(--ax-viz-emerald)' },
  { name: 'Litecoin', sym: 'LTC', icon: 'ltc', color: '#34D399', price: '$84.10', ch: '−1.2%', chColor: 'var(--ax-viz-red)' },
];

function CoinAvatar({ icon, color, sm }: { icon: string; color: string; sm?: boolean }) {
  return (
    <span className={`ax-avatar ${sm ? 'ax-avatar--sm ' : ''}ax-avatar--squircle`} style={{ background: `color-mix(in oklab,${color} 18%,transparent)`, color }}>
      <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{COIN_ICON[icon]}</svg>
    </span>
  );
}

export function Crypto() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('BTC');
  const [amount, setAmount] = useState('0.05');
  const [sent, setSent] = useState(false);

  const ohlc = ([
    [1718150400000, 64200, 65100, 63800, 64900],
    [1718236800000, 64900, 66200, 64500, 65800],
    [1718323200000, 65800, 66100, 64200, 64600],
    [1718409600000, 64600, 65900, 64100, 65500],
    [1718496000000, 65500, 67200, 65300, 66900],
    [1718582400000, 66900, 67100, 65800, 66100],
    [1718668800000, 66100, 66800, 64900, 65200],
    [1718755200000, 65200, 67400, 65000, 67100],
    [1718841600000, 67100, 68200, 66800, 67900],
    [1718928000000, 67900, 68100, 66400, 66700],
    [1719014400000, 66700, 68400, 66500, 68200],
    [1719100800000, 68200, 68900, 67200, 67840],
  ] as number[][]).map((c) => ({ x: c[0], y: [c[1], c[2], c[3], c[4]] }));

  return (
    <>
      <PageHead
        title="Crypto"
        subtitle="Your portfolio is up 4.8% in the last 24 hours."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 24 hours</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_EXPORT}<span className="ax-btn__label">Export</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_BTC}<span className="ax-btn__label">Buy Crypto</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI ROW */}
        {KPIS.map((k) => (
          <div key={k.label} className="ax-card ax-kpi" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.iconClass}`}>{k.icon}</span>
                <span className={`ax-kpi__delta ax-kpi__delta--${k.up ? 'up' : 'down'}`}>{k.up ? ARROW_UP : ARROW_DN}{k.delta}</span>
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__meta" style={{ justifyContent: 'space-between', width: '100%' }}>
                <div className="ax-kpi__value ax-num" style={k.valueColor ? { color: k.valueColor } : undefined}>{k.value}</div>
                <ApexChart className="ax-kpi__spark" type="line" sparkline tooltip={false} height={40} color={k.color} series={[{ name: 'Trend', data: k.spark }]} style={{ minHeight: 40 }} />
              </div>
            </div>
          </div>
        ))}

        {/* MARKET MOVERS STRIP */}
        <section className="ax-card ax-col--12" role="region" aria-label="Market movers">
          <div className="ax-card__body" style={{ display: 'flex', gap: 'var(--ax-space-3)', overflowX: 'auto', paddingBlock: 'var(--ax-space-4)' }}>
            {MOVERS.map((m) => (
              <div key={m.sym} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flex: '0 0 auto', minWidth: 178, padding: 'var(--ax-space-3) var(--ax-space-4)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-surface-subtle)' }}>
                <CoinAvatar icon={m.icon} color={m.color} sm />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', gap: 'var(--ax-space-2)' }}><b style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{m.sym}</b><span className="ax-num" style={{ color: m.pctColor, fontSize: 'var(--ax-text-xs)' }}>{m.pct}</span></div>
                  <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)', fontSize: 'var(--ax-text-sm)' }}>{m.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HERO: Portfolio Performance */}
        <section className="ax-card ax-card--chart ax-card--bleed ax-col--7" role="region" aria-label="Portfolio performance">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Performance</span>
              <h2 className="ax-card__title">Portfolio Performance</h2>
              <p className="ax-card__subtitle">Total holdings value over time</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Timeframe">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">24H</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">7D</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">30D</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1Y</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <div><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Current value</span><div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>$86,420.55</div></div>
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ alignSelf: 'center' }}><svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>+$3,940 (4.8%)</span>
            </div>
            <ApexChart
              type="area" height={300} legend="none" accent
              ariaLabel="Area chart of total portfolio value over the last 7 days"
              series={[{ name: 'Portfolio', data: [78200, 79100, 77600, 81400, 80200, 83100, 82400, 85600, 84100, 86420] }]}
            />
          </div>
        </section>

        {/* Asset Allocation */}
        <section className="ax-card ax-col--5" role="region" aria-label="Asset allocation">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Asset Allocation</h2></div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Allocation options">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut chart of asset allocation: Bitcoin 46%, Ethereum 28%, Solana 16%, Tether 10%"
              series={[46, 28, 16, 10]}
              apex={{
                labels: ['Bitcoin', 'Ethereum', 'Solana', 'Tether'],
                colors: [cv('--ax-viz-amber'), cv('--ax-viz-violet'), cv('--ax-viz-emerald'), cv('--ax-viz-cyan')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Total', formatter: () => '$86.4K' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {ALLOC.map((a) => (
                <li key={a.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: a.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{a.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{a.pct}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* BTC candlestick */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Bitcoin price chart">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">BTC / USD</span>
              <h2 className="ax-card__title">Bitcoin Price</h2>
              <p className="ax-card__subtitle">$67,840.20 <span style={{ color: 'var(--ax-viz-emerald)' }}>+2.1%</span> · 24h vol $28.4B</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Candle interval">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1H</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">1D</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1W</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="candlestick" height={320} legend="none"
              ariaLabel="Candlestick chart of Bitcoin daily price"
              series={[{ data: ohlc }]}
              apex={{
                plotOptions: { candlestick: { colors: { upward: cv('--ax-success-500'), downward: cv('--ax-danger-500') } } },
                xaxis: { type: 'datetime' },
                yaxis: { tooltip: { enabled: true }, labels: { formatter: (v: number) => '$' + (v / 1000).toFixed(1) + 'K' } },
              }}
            />
          </div>
        </section>

        {/* Buy / Sell + Fear & Greed */}
        <div className="ax-col--4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
          {/* Trade */}
          <section className="ax-card" role="region" aria-label="Buy or sell crypto">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Trade</h2></div></div>
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Order side" style={{ width: '100%', marginBottom: 'var(--ax-space-4)' }}>
                <button type="button" className={`ax-btn ax-btn--sm ax-btn--block${side === 'buy' ? ' is-selected' : ''}`} role="radio" aria-checked={side === 'buy'} onClick={() => setSide('buy')}>Buy</button>
                <button type="button" className={`ax-btn ax-btn--sm ax-btn--block${side === 'sell' ? ' is-selected' : ''}`} role="radio" aria-checked={side === 'sell'} onClick={() => setSide('sell')}>Sell</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="cx-asset">Asset</label>
                  <select className="ax-select" id="cx-asset" value={asset} onChange={(e) => setAsset(e.target.value)}>
                    <option value="BTC">Bitcoin · BTC</option>
                    <option value="ETH">Ethereum · ETH</option>
                    <option value="SOL">Solana · SOL</option>
                    <option value="ADA">Cardano · ADA</option>
                  </select>
                </div>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="cx-amount">Amount</label>
                  <input className="ax-input ax-num" id="cx-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
                  <span className="ax-help">Available: 1.284 <span>{asset}</span></span>
                </div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3)', borderRadius: 'var(--ax-radius-md)', background: 'var(--ax-surface-subtle)' }}>
                  <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Est. total</span>
                  <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>$3,392.00</b>
                </div>
                <button type="submit" className={`ax-btn ax-btn--primary ax-btn--block${side === 'sell' ? ' ax-btn--danger' : ''}`}>
                  <span className="ax-btn__label">{(side === 'buy' ? 'Buy ' : 'Sell ') + asset}</span>
                </button>
                {sent && (
                  <p className="ax-note" style={{ margin: 0, color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-sm)' }} role="status">
                    Trade submitted — your order is being processed.
                  </p>
                )}
              </form>
            </div>
          </section>

          {/* Fear & Greed */}
          <section className="ax-card" role="region" aria-label="Fear and greed index">
            <div className="ax-card__header">
              <div className="ax-card__titles"><h2 className="ax-card__title">Fear &amp; Greed</h2></div>
              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Greed</span>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, textAlign: 'center' }}>
              <ApexChart
                type="radialBar" height={230} legend="none"
                style={{ marginTop: 'calc(-1 * var(--ax-space-3))' }}
                series={[68]}
                apex={{
                  colors: [cv('--ax-warning-500')],
                  plotOptions: { radialBar: { startAngle: -110, endAngle: 110, hollow: { size: '62%' }, track: { background: cv('--ax-fill-hover'), strokeWidth: '100%' }, dataLabels: { name: { show: true, offsetY: 22, color: cv('--ax-text-muted'), fontSize: '13px', fontFamily: cv('--ax-font-sans') }, value: { show: true, offsetY: -16, color: cv('--ax-text-strong'), fontSize: '34px', fontFamily: cv('--ax-font-mono'), fontWeight: 700, formatter: (v: number) => String(v) } } } },
                  labels: ['Greed'],
                  fill: { type: 'solid' },
                }}
              />
              <p style={{ margin: 0, color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Index at <b style={{ color: 'var(--ax-text-strong)' }}>68</b> — market sentiment leans greedy. Yesterday 61.</p>
            </div>
          </section>
        </div>

        {/* Holdings */}
        <section className="ax-card ax-col--8" role="region" aria-label="Holdings">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Holdings</h2><p className="ax-card__subtitle">Your assets &amp; 24h movement</p></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Asset</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Holdings</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Price</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">24h</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h) => (
                  <tr key={h.sym} className="ax-table__row">
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                        <CoinAvatar icon={h.icon} color={h.color} sm />
                        <div><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{h.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{h.sym}</div></div>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{h.holdings}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{h.price}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: h.chColor }}>{h.ch}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Watchlist rail */}
        <section className="ax-card ax-card--flat ax-col--4" role="region" aria-label="Watchlist">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Watchlist</h2></div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Add to watchlist">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {WATCHLIST.map((w) => (
              <div key={w.sym} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <CoinAvatar icon={w.icon} color={w.color} />
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{w.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{w.sym}</div></div>
                <div style={{ textAlign: 'right' }}><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{w.price}</div><div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: w.chColor }}>{w.ch}</div></div>
              </div>
            ))}
          </div>
          <div className="ax-card__footer"><a className="ax-link" href="#">Manage watchlist →</a></div>
        </section>
      </div>
    </>
  );
}

export default Crypto;
