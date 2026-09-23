/*
 * Vireo React — Crypto Exchange (route "crypto/exchange").
 *
 * Faithful re-expression of src/html/crypto/exchange.html: crypto pill sub-nav,
 * a pair ticker strip, a 4-zone trading grid (markets list, candlestick chart,
 * order book depth, buy/sell order panel) and a recent-trades table. The
 * candlestick goes through <ApexChart>; the small Alpine bits (side toggle,
 * price/amount total, market search) are ported to React state. DOM 1:1.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';
import { CryptoSubNav } from './CryptoSubNav';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const OHLC = [
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
].map((c) => ({ x: c[0], y: [c[1], c[2], c[3], c[4]] }));

interface Market { sym: string; quote: string; price: string; change: string; up: boolean; color: string; icon: 'btc' | 'eth' | 'sol' | 'avax' | 'ada' | 'dot'; active?: boolean }
const MARKETS: Market[] = [
  { sym: 'BTC', quote: '/USDT', price: '67,840', change: '+2.1%', up: true, color: 'var(--ax-viz-amber)', icon: 'btc', active: true },
  { sym: 'ETH', quote: '/USDT', price: '3,512', change: '+3.7%', up: true, color: 'var(--ax-viz-violet)', icon: 'eth' },
  { sym: 'SOL', quote: '/USDT', price: '184.20', change: '+18.2%', up: true, color: 'var(--ax-viz-emerald)', icon: 'sol' },
  { sym: 'AVAX', quote: '/USDT', price: '38.10', change: '−2.4%', up: false, color: 'var(--ax-viz-pink)', icon: 'avax' },
  { sym: 'ADA', quote: '/USDT', price: '0.452', change: '+1.3%', up: true, color: 'var(--ax-viz-cyan)', icon: 'ada' },
  { sym: 'DOT', quote: '/USDT', price: '6.94', change: '−0.8%', up: false, color: 'var(--ax-viz-red)', icon: 'dot' },
];
const MK_ICON: Record<Market['icon'], React.ReactElement> = {
  btc: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6h8a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-8" /><path d="M8 6l0 12" /><path d="M8 12l6 0" /><path d="M9 3l0 3" /><path d="M13 3l0 3" /></svg>,
  eth: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 12l6 -9l6 9l-6 9l-6 -9" /><path d="M6 12l6 -3l6 3l-6 2l-6 -2" /></svg>,
  sol: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 18h12l4 -4h-12l-4 4" /><path d="M8 14l-4 -4h12l4 4" /><path d="M16 10l4 -4h-12l-4 4" /></svg>,
  avax: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 12l9 -3" /></svg>,
  ada: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M12 12l9 -3" /></svg>,
  dot: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M8 12h8" /></svg>,
};

const ASKS = [
  { price: '68,142.0', amount: '1.842', total: '125.5K', w: 78 },
  { price: '68,058.5', amount: '0.926', total: '63.0K', w: 62 },
  { price: '67,964.0', amount: '0.612', total: '41.6K', w: 48 },
  { price: '67,902.5', amount: '0.388', total: '26.3K', w: 34 },
  { price: '67,861.0', amount: '0.204', total: '13.8K', w: 22 },
];
const BIDS = [
  { price: '67,818.5', amount: '0.296', total: '20.1K', w: 26 },
  { price: '67,762.0', amount: '0.524', total: '35.5K', w: 40 },
  { price: '67,690.5', amount: '0.718', total: '48.6K', w: 55 },
  { price: '67,604.0', amount: '1.084', total: '73.3K', w: 71 },
  { price: '67,540.5', amount: '1.962', total: '132.5K', w: 88 },
];

const TRADES = [
  { side: 'Buy', price: '67,840.20', amount: '0.1842', total: '12,496.16', time: '14:32:08' },
  { side: 'Sell', price: '67,838.50', amount: '0.0512', total: '3,473.33', time: '14:32:05' },
  { side: 'Buy', price: '67,841.00', amount: '0.9020', total: '61,192.58', time: '14:31:58' },
  { side: 'Buy', price: '67,835.75', amount: '0.0246', total: '1,668.76', time: '14:31:51' },
  { side: 'Sell', price: '67,830.10', amount: '0.3380', total: '22,926.57', time: '14:31:44' },
  { side: 'Buy', price: '67,832.40', amount: '0.1500', total: '10,174.86', time: '14:31:39' },
];

export function Exchange() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('67840.20');
  const [amount, setAmount] = useState('0.0500');
  const [placed, setPlaced] = useState(false);
  const [mq, setMq] = useState('');

  const total = useMemo(() => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    return (p * a).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [price, amount]);

  const showMarkets = 'btc usdt eth sol avax ada dot link'.includes(mq.toLowerCase()) || mq === '';
  const estFee = '$' + ((parseFloat(total.replace(/,/g, '')) || 0) * 0.001).toFixed(2);

  return (
    <>
      <PageHead
        title="Exchange"
        subtitle="BTC / USDT spot market · live order book & depth."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 12l2 2l4 -4" /></svg>
              <span className="ax-btn__label">Open orders</span>
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ marginInlineStart: 'var(--ax-space-2)' }}>3</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h12l-3 -3" /><path d="M21 17h-12l3 3" /></svg>
              <span className="ax-btn__label">Convert</span>
            </button>
          </>
        }
      />

      <CryptoSubNav active="exchange" />

      {/* TICKER STRIP */}
      <section className="ax-card" role="region" aria-label="Pair ticker" style={{ marginBottom: 'var(--ax-space-6)' }}>
        <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ax-space-5) var(--ax-space-6)', justifyContent: 'space-between', paddingBlock: 'var(--ax-space-4)' }}>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
            <span className="ax-avatar ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-amber) 18%,transparent)', color: 'var(--ax-viz-amber)' }}>{MK_ICON.btc}</span>
            <div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><b style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-lg)' }}>BTC / USDT</b><span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Spot</span></div>
              <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Bitcoin</div>
            </div>
          </div>
          <div style={{ borderInlineStart: '1px solid var(--ax-border)', paddingInlineStart: 'var(--ax-space-6)' }}>
            <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xl)', fontWeight: 700, color: 'var(--ax-viz-emerald)' }}>$67,840.20</div>
            <div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>+$1,392.10 · +2.10%</div>
          </div>
          <div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>24h High</div><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>$68,910</div></div>
          <div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>24h Low</div><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>$66,120</div></div>
          <div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>24h Vol (BTC)</div><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>41,820</div></div>
          <div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>24h Vol (USDT)</div><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>$2.84B</div></div>
        </div>
      </section>

      {/* TRADING GRID */}
      <div className="ax-dash-grid ax-exchange-grid">
        {/* MARKETS */}
        <section className="ax-card ax-col-markets" role="region" aria-label="Markets">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Markets</h2></div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input type="search" className="ax-input ax-input--sm" placeholder="Search pair…" value={mq} onChange={(e) => setMq(e.target.value)} style={{ paddingInlineStart: 34 }} aria-label="Search markets" />
            </div>
            <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Quote currency" style={{ width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--sm ax-btn--block is-selected" role="radio" aria-checked="true">USDT</button>
              <button type="button" className="ax-btn ax-btn--sm ax-btn--block" role="radio" aria-checked="false">BTC</button>
              <button type="button" className="ax-btn ax-btn--sm ax-btn--block" role="radio" aria-checked="false">ETH</button>
            </div>
            {showMarkets && (
              <ul className="ax-list ax-list--compact" style={{ margin: 0 }}>
                {MARKETS.map((m) => (
                  <li key={m.sym} className={`ax-list__row${m.active ? ' is-active' : ''}`} style={m.active ? { paddingInline: 'var(--ax-space-2)', borderRadius: 'var(--ax-radius-sm)', background: 'var(--ax-accent-wash)' } : { paddingInline: 'var(--ax-space-2)' }}>
                    <span className="ax-list__leading"><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${m.color} 18%,transparent)`, color: m.color }}>{MK_ICON[m.icon]}</span></span>
                    <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: m.active ? 'var(--ax-weight-semibold)' : 'var(--ax-weight-medium)' }}>{m.sym}<small style={{ color: 'var(--ax-text-subtle)' }}>{m.quote}</small></span></span>
                    <span className="ax-list__trailing" style={{ textAlign: 'end' }}><div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{m.price}</div><div className="ax-num" style={{ fontSize: 'var(--ax-text-2xs)', color: m.up ? 'var(--ax-viz-emerald)' : 'var(--ax-viz-red)' }}>{m.change}</div></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* CANDLESTICK */}
        <section className="ax-card ax-card--chart ax-col-candle" role="region" aria-label="Bitcoin price chart">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">BTC / USDT</span>
              <h2 className="ax-card__title">Price Chart</h2>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Candle interval">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">15m</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1H</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">1D</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1W</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="candlestick"
              height={360}
              legend="none"
              ariaLabel="Candlestick chart of BTC/USDT daily price"
              series={[{ data: OHLC }]}
              apex={{
                plotOptions: { candlestick: { colors: { upward: cv('--ax-success-500'), downward: cv('--ax-danger-500') } } },
                xaxis: { type: 'datetime' },
                yaxis: { tooltip: { enabled: true }, labels: { formatter: (v: number) => '$' + (v / 1000).toFixed(1) + 'K' } },
              }}
            />
          </div>
        </section>

        {/* ORDER BOOK */}
        <section className="ax-card ax-col-book" role="region" aria-label="Order book">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Order Book</h2></div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Order book settings">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12l12 0" /><path d="M4 12l0 0" /><path d="M4 18l5 0" /><path d="M13 18l7 0" /></svg>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, fontFamily: 'var(--ax-font-mono)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 'var(--ax-space-2)' }}>
              <span>Price (USDT)</span><span style={{ textAlign: 'end' }}>Amount (BTC)</span><span style={{ textAlign: 'end' }}>Total</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ASKS.map((r, i) => (
                <div key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ax-space-2)', paddingBlock: 3, fontSize: 'var(--ax-text-xs)' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, width: `${r.w}%`, background: 'color-mix(in oklab,var(--ax-viz-red) 12%,transparent)' }} />
                  <span style={{ position: 'relative', color: 'var(--ax-viz-red)' }}>{r.price}</span><span style={{ position: 'relative', textAlign: 'end', color: 'var(--ax-text)' }}>{r.amount}</span><span style={{ position: 'relative', textAlign: 'end', color: 'var(--ax-text-muted)' }}>{r.total}</span>
                </div>
              ))}
            </div>
            <div className="ax-cluster" style={{ justifyContent: 'space-between', paddingBlock: 'var(--ax-space-3)', marginBlock: 'var(--ax-space-2)', borderBlock: '1px solid var(--ax-border)' }}>
              <span className="ax-num" style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald)' }}>67,840.2</span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-1)', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 -6l6 6" /></svg>Spread 0.06%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {BIDS.map((r, i) => (
                <div key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ax-space-2)', paddingBlock: 3, fontSize: 'var(--ax-text-xs)' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, width: `${r.w}%`, background: 'color-mix(in oklab,var(--ax-viz-emerald) 12%,transparent)' }} />
                  <span style={{ position: 'relative', color: 'var(--ax-viz-emerald)' }}>{r.price}</span><span style={{ position: 'relative', textAlign: 'end', color: 'var(--ax-text)' }}>{r.amount}</span><span style={{ position: 'relative', textAlign: 'end', color: 'var(--ax-text-muted)' }}>{r.total}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BUY/SELL PANEL */}
        <section className="ax-card ax-col-trade" role="region" aria-label="Place order">
          <div className="ax-card__body">
            <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Order side" style={{ width: '100%', marginBottom: 'var(--ax-space-4)' }}>
              <button type="button" className={`ax-btn ax-btn--block${side === 'buy' ? ' is-selected' : ''}`} role="radio" aria-checked={side === 'buy'} onClick={() => { setSide('buy'); setPlaced(false); }}>Buy</button>
              <button type="button" className={`ax-btn ax-btn--block${side === 'sell' ? ' is-selected' : ''}`} role="radio" aria-checked={side === 'sell'} onClick={() => { setSide('sell'); setPlaced(false); }}>Sell</button>
            </div>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-4)', marginBottom: 'var(--ax-space-4)', borderBottom: '1px solid var(--ax-border)' }}>
              <button type="button" className="ax-btn ax-btn--link" style={{ paddingBlock: 'var(--ax-space-2)', color: 'var(--ax-text-strong)', borderBottom: '2px solid var(--ax-accent)', borderRadius: 0 }}>Limit</button>
              <button type="button" className="ax-btn ax-btn--link" style={{ paddingBlock: 'var(--ax-space-2)', color: 'var(--ax-text-muted)' }}>Market</button>
              <button type="button" className="ax-btn ax-btn--link" style={{ paddingBlock: 'var(--ax-space-2)', color: 'var(--ax-text-muted)' }}>Stop</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setPlaced(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Available</span>
                <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{side === 'buy' ? '12,300.00 USDT' : '0.586 BTC'}</b>
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ex-price">Price</label>
                <div style={{ position: 'relative' }}>
                  <input className="ax-input ax-num" id="ex-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} style={{ fontFamily: 'var(--ax-font-mono)', paddingInlineEnd: 54 }} />
                  <span style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>USDT</span>
                </div>
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ex-amount">Amount</label>
                <div style={{ position: 'relative' }}>
                  <input className="ax-input ax-num" id="ex-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ fontFamily: 'var(--ax-font-mono)', paddingInlineEnd: 46 }} />
                  <span style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>BTC</span>
                </div>
              </div>
              <div className="ax-btn-group ax-btn-group--segmented" role="group" aria-label="Order size percentage" style={{ width: '100%' }}>
                <button type="button" className="ax-btn ax-btn--sm ax-btn--block" onClick={() => setAmount((0.586 * 0.25).toFixed(4))}>25%</button>
                <button type="button" className="ax-btn ax-btn--sm ax-btn--block" onClick={() => setAmount((0.586 * 0.5).toFixed(4))}>50%</button>
                <button type="button" className="ax-btn ax-btn--sm ax-btn--block" onClick={() => setAmount((0.586 * 0.75).toFixed(4))}>75%</button>
                <button type="button" className="ax-btn ax-btn--sm ax-btn--block" onClick={() => setAmount((0.586).toFixed(4))}>100%</button>
              </div>
              <div style={{ padding: 'var(--ax-space-3)', borderRadius: 'var(--ax-radius-md)', background: 'var(--ax-surface-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Est. fee (0.10%)</span><b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{estFee}</b></div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Order total</span><b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}><span>{total}</span> USDT</b></div>
              </div>
              <button type="submit" className={`ax-btn ax-btn--block ${side === 'buy' ? 'ax-btn--success' : 'ax-btn--danger'}`}>
                <span className="ax-btn__label">{(side === 'buy' ? 'Buy ' : 'Sell ') + 'BTC'}</span>
              </button>
              {placed && (
                <p className="ax-note" style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: side === 'buy' ? 'var(--ax-viz-emerald)' : 'var(--ax-viz-red)' }} role="status">
                  <span>{side === 'buy' ? 'Buy' : 'Sell'}</span> limit order placed for <span className="ax-num">{amount}</span> BTC.
                </p>
              )}
            </form>
          </div>
        </section>

        {/* RECENT TRADES */}
        <section className="ax-card ax-col-full" role="region" aria-label="Recent market trades">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Recent Trades</h2>
              <p className="ax-card__subtitle">BTC / USDT market</p>
            </div>
            <Link className="ax-btn ax-btn--link" to="/crypto/transactions">My history</Link>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Side</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Price (USDT)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Amount (BTC)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total (USDT)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {TRADES.map((t, i) => (
                  <tr key={i} className="ax-table__row">
                    <td className="ax-table__td"><span style={{ color: t.side === 'Buy' ? 'var(--ax-viz-emerald)' : 'var(--ax-viz-red)', fontWeight: 'var(--ax-weight-medium)' }}>{t.side}</span></td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: t.side === 'Buy' ? 'var(--ax-viz-emerald)' : 'var(--ax-viz-red)' }}>{t.price}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{t.amount}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{t.total}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* page-scoped grid spans (from reference inline <style>) */}
      <style>{`
        .ax-exchange-grid > * { grid-column: 1 / -1; }
        @media (min-width: 768px) {
          .ax-exchange-grid > .ax-col-markets { grid-column: span 6; }
          .ax-exchange-grid > .ax-col-candle { grid-column: span 6; }
          .ax-exchange-grid > .ax-col-book { grid-column: span 6; }
          .ax-exchange-grid > .ax-col-trade { grid-column: span 6; }
        }
        @media (min-width: 1200px) {
          .ax-exchange-grid > .ax-col-markets { grid-column: span 3; }
          .ax-exchange-grid > .ax-col-candle { grid-column: span 6; }
          .ax-exchange-grid > .ax-col-book { grid-column: span 3; }
          .ax-exchange-grid > .ax-col-trade { grid-column: span 4; }
          .ax-exchange-grid > .ax-col-full { grid-column: span 8; }
        }
      `}</style>
    </>
  );
}

export default Exchange;
