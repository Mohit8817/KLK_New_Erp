/*
 * Vireo React — Point of Sale dashboard (route "dashboards/pos").
 *
 * Faithful re-expression of src/html/dashboards/pos.html: a full-width "Key
 * figures" .ax-statgroup band on an .ax-card--filled, an hourly sales column
 * chart, a native Quick-Sale form (amount + segmented payment method + simulated
 * charge), a sales-by-category donut, payment-method goal bars, a register-status
 * list, a recent-sales table and low-stock alerts. Charts go through
 * <ApexChart>; DOM classes/ARIA match the reference 1:1.
 */
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const ICON_STORE = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7 -3l7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v3" /><path d="M12 14v3" /><path d="M16 14v3" /></svg>
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
const ALERT_ICON = (
  <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
);

interface Stat { icon: ReactElement; iconClass: string; label: string; value: string; delta: string }
const STATS: Stat[] = [
  { iconClass: '', label: "Today's Sales", value: '$9,840', delta: '+7.2%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg> },
  { iconClass: ' ax-statgroup__icon--c2', label: 'Transactions', value: '412', delta: '+4.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2m4 -14h6m-6 4h6m-2 4h2" /></svg> },
  { iconClass: ' ax-statgroup__icon--c3', label: 'Avg Basket', value: '$23.88', delta: '+1.1%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M5.001 8h13.999a2 2 0 0 1 1.977 2.304l-1.255 7.152a3 3 0 0 1 -2.966 2.544h-9.512a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304" /><path d="M17 10l-2 -6" /><path d="M7 10l2 -6" /></svg> },
  { iconClass: ' ax-statgroup__icon--c4', label: 'Items Sold', value: '1,206', delta: '+5.5%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /><path d="M16 5.25l-8 4.5" /></svg> },
];

const CATS = [
  { label: 'Beverages', color: 'var(--ax-viz-cyan)', pct: '34%' },
  { label: 'Bakery', color: 'var(--ax-viz-violet)', pct: '26%' },
  { label: 'Snacks', color: 'var(--ax-viz-pink)', pct: '18%' },
  { label: 'Produce', color: 'var(--ax-viz-amber)', pct: '13%' },
  { label: 'Household', color: 'var(--ax-viz-emerald)', pct: '9%' },
];

const PAYMENTS = [
  { label: 'Card', value: '$5,920', pct: 60, color: 'var(--ax-accent)' },
  { label: 'Cash', value: '$2,460', pct: 25, color: 'var(--ax-viz-cyan)' },
  { label: 'Mobile wallet', value: '$980', pct: 10, color: 'var(--ax-viz-violet)' },
  { label: 'Split / gift card', value: '$480', pct: 5, color: 'var(--ax-viz-pink)' },
];

const LANES = [
  { num: '1', color: 'var(--ax-viz-emerald)', name: 'Lane 1 — Maya O.', sub: '$3,210 · 138 sales', status: 'Open', tone: 'success' },
  { num: '2', color: 'var(--ax-viz-cyan)', name: 'Lane 2 — Diego R.', sub: '$2,890 · 121 sales', status: 'Open', tone: 'success' },
  { num: '3', color: 'var(--ax-viz-amber)', name: 'Lane 3 — Self-checkout', sub: '$2,470 · 116 sales', status: 'Cash due', tone: 'warning' },
  { num: '4', color: 'var(--ax-text-subtle)', name: 'Lane 4 — Unstaffed', sub: 'Closed since 14:00', status: 'Closed', tone: 'closed' },
];

const SALES = [
  { receipt: '#R-40218', cashier: 'Maya Obi', items: '7', total: '$48.20', totalColor: 'var(--ax-text-strong)', pay: 'Card', payTone: 'info', time: '15:42' },
  { receipt: '#R-40217', cashier: 'Diego Ruiz', items: '3', total: '$14.75', totalColor: 'var(--ax-text-strong)', pay: 'Cash', payTone: 'muted', time: '15:39' },
  { receipt: '#R-40216', cashier: 'Self-checkout', items: '12', total: '$96.40', totalColor: 'var(--ax-text-strong)', pay: 'Card', payTone: 'info', time: '15:35' },
  { receipt: '#R-40215', cashier: 'Maya Obi', items: '2', total: '$8.90', totalColor: 'var(--ax-text-strong)', pay: 'Wallet', payTone: 'wallet', time: '15:31' },
  { receipt: '#R-40214', cashier: 'Diego Ruiz', items: '5', total: '$31.10', totalColor: 'var(--ax-text-strong)', pay: 'Card', payTone: 'info', time: '15:28' },
  { receipt: '#R-40213', cashier: 'Maya Obi', items: '1', total: '−$6.50', totalColor: 'var(--ax-danger-500)', pay: 'Refund', payTone: 'danger', time: '15:24' },
];

const STOCK = [
  { name: 'Cold Brew 1L', sub: 'SKU 4821 · Beverages', left: '4 left', tone: 'var(--ax-danger-500)', bg: 'var(--ax-danger-500)', bgPct: 16 },
  { name: 'Sourdough Loaf', sub: 'SKU 1190 · Bakery', left: '9 left', tone: 'var(--ax-warning-500)', bg: 'var(--ax-warning-500)', bgPct: 16 },
  { name: 'Oat Milk 1L', sub: 'SKU 3302 · Beverages', left: '11 left', tone: 'var(--ax-warning-500)', bg: 'var(--ax-warning-500)', bgPct: 16 },
  { name: 'Sea Salt Chips', sub: 'SKU 2745 · Snacks', left: '14 left', tone: 'var(--ax-warning-500)', bg: 'var(--ax-warning-500)', bgPct: 16 },
];

export function Pos() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSent(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSent(false); setAmount(''); }, 2400);
  };

  return (
    <>
      <PageHead
        title="Point of Sale"
        subtitle="Live retail performance — Downtown flagship store, Thu Jun 27."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_STORE}<span className="ax-btn__label">Downtown</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_EXPORT}<span className="ax-btn__label">Z-Report</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">New Sale</span></button>
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

        {/* HERO: Hourly Sales column (8) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Hourly sales">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Throughput</span>
              <h2 className="ax-card__title">Hourly Sales</h2>
              <p className="ax-card__subtitle">Today vs. yesterday · peak at 1pm</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Today</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Yesterday</small></span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar" height={310} legend="none" accent
              ariaLabel="Column chart of hourly sales today versus yesterday"
              series={[
                { name: 'Today', data: [210, 340, 520, 610, 940, 1280, 1100, 860, 720, 910, 640, 420] },
                { name: 'Yesterday', data: [180, 300, 480, 560, 820, 1140, 1020, 790, 680, 840, 600, 380] },
              ]}
            />
          </div>
        </section>

        {/* Quick Sale form (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Quick sale">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Quick Sale</h2>
              <p className="ax-card__subtitle">Ring up a cash or card sale</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div className="ax-field">
                <label className="ax-label" htmlFor="qs-amount">Amount</label>
                <input id="qs-amount" type="text" inputMode="decimal" className="ax-input" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" />
              </div>
              <div className="ax-field">
                <span className="ax-label">Payment method</span>
                <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Payment method" style={{ width: '100%' }}>
                  <button type="button" className={`ax-btn ax-btn--sm${method === 'cash' ? ' is-selected' : ''}`} role="radio" aria-checked={method === 'cash'} onClick={() => setMethod('cash')} style={{ flex: 1 }}>Cash</button>
                  <button type="button" className={`ax-btn ax-btn--sm${method === 'card' ? ' is-selected' : ''}`} role="radio" aria-checked={method === 'card'} onClick={() => setMethod('card')} style={{ flex: 1 }}>Card</button>
                  <button type="button" className={`ax-btn ax-btn--sm${method === 'wallet' ? ' is-selected' : ''}`} role="radio" aria-checked={method === 'wallet'} onClick={() => setMethod('wallet')} style={{ flex: 1 }}>Wallet</button>
                </div>
              </div>
              <button type="submit" className="ax-btn ax-btn--primary ax-btn--block" disabled={!amount}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                <span className="ax-btn__label">Charge</span>
              </button>
              {sent && (
                <div className="ax-alert ax-alert--success" role="status" aria-live="polite" style={{ margin: 0 }}>
                  <svg className="ax-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                  <div className="ax-alert__content"><p className="ax-alert__message" style={{ color: 'var(--ax-text)' }}>Sale recorded — receipt printed.</p></div>
                </div>
              )}
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)', textAlign: 'center', marginTop: 'var(--ax-space-5)', paddingTop: 'var(--ax-space-4)', borderTop: '1px solid var(--ax-border)' }}>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Drawer</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>$1,284.50</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Register</small><b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-md)' }}>Open</b></div>
            </div>
          </div>
        </section>

        {/* Sales by Category donut (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Sales by category">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Sales by Category</h2>
              <p className="ax-card__subtitle">Share of today's revenue</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut: Beverages, Bakery, Snacks, Produce, Household"
              series={[34, 26, 18, 13, 9]}
              apex={{
                labels: ['Beverages', 'Bakery', 'Snacks', 'Produce', 'Household'],
                colors: [cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber'), cv('--ax-viz-emerald')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Sales', formatter: () => '$9.8K' } } } } },
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

        {/* Payment Methods (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Payment methods">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Payment Methods</h2>
              <p className="ax-card__subtitle">Today's split</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {PAYMENTS.map((p) => (
              <div key={p.label}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{p.label}</span><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{p.value}</b></div>
                <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p.pct}%`, background: p.color }} /></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Register Status (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Register status">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Register Status</h2>
              <p className="ax-card__subtitle">4 lanes</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-list ax-list--compact">
              {LANES.map((l) => (
                <li key={l.num} className="ax-list__row">
                  <span className="ax-list__leading"><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${l.color} 18%,transparent)`, color: l.tone === 'closed' ? 'var(--ax-text-muted)' : l.color, fontWeight: 600 }}>{l.num}</span></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{l.name}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{l.sub}</span></span>
                  <span className="ax-list__trailing">{l.tone === 'closed' ? <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ color: 'var(--ax-text-muted)' }}><span className="ax-badge__dot" />{l.status}</span> : <span className={`ax-badge ax-badge--soft ax-badge--${l.tone} ax-badge--pill`}><span className="ax-badge__dot" />{l.status}</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Recent Sales (8) */}
        <section className="ax-card ax-col--8" role="region" aria-label="Recent sales">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Recent Sales</h2>
              <p className="ax-card__subtitle">Latest receipts across all lanes</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">View all</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Receipt</th>
                  <th className="ax-table__th" scope="col">Cashier</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Items</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th" scope="col">Payment</th>
                  <th className="ax-table__th" scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {SALES.map((s) => (
                  <tr key={s.receipt} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.receipt}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{s.cashier}</td>
                    <td className="ax-table__td ax-table__td--num">{s.items}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: s.totalColor }}>{s.total}</td>
                    <td className="ax-table__td">
                      {s.payTone === 'muted' ? <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ color: 'var(--ax-text-muted)' }}>{s.pay}</span>
                        : s.payTone === 'wallet' ? <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ color: 'var(--ax-viz-violet)' }}>{s.pay}</span>
                          : <span className={`ax-badge ax-badge--soft ax-badge--${s.payTone} ax-badge--pill`}>{s.pay}</span>}
                    </td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low Stock Alerts (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Low stock alerts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Stock Alerts</h2>
              <p className="ax-card__subtitle">Below reorder point</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Reorder</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {STOCK.map((s) => (
              <div key={s.name} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <span className="ax-avatar ax-avatar--squircle" style={{ background: `color-mix(in oklab,${s.bg} 16%,transparent)`, color: s.tone }}>{ALERT_ICON}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{s.sub}</div></div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 600, color: s.tone }}>{s.left}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Pos;
