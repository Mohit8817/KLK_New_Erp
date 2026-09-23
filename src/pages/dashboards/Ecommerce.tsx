/*
 * Vireo React — eCommerce dashboard (route "dashboards/ecommerce").
 *
 * Faithful re-expression of src/html/dashboards/ecommerce.html: 4 KPI cards, a
 * Revenue & Orders mixed chart, Sales-by-category donut, channel breakdown,
 * inventory status, top products, recent orders table, low-stock alerts and
 * top customers. Charts via <ApexChart>; DOM/classes/ARIA match 1:1.
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
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const ARROW_DN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const WARN_ICON = (
  <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
);

interface Kpi { region: string; icon: ReactElement; iconClass: string; arrow: ReactElement; delta: string; label: string; value: string; color: string; spark: number[]; }
const KPIS: Kpi[] = [
  { region: 'Total Sales $142,800, up 9.8%', iconClass: 'c1', arrow: ARROW_UP, delta: '9.8%', label: 'Total Sales', value: '$142,800', color: '--ax-accent', spark: [6, 10, 9, 16, 19, 23, 27, 30], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg> },
  { region: 'Orders 4,612, up 4.5%', iconClass: 'c2', arrow: ARROW_UP, delta: '4.5%', label: 'Orders', value: '4,612', color: '--ax-viz-cyan', spark: [8, 11, 10, 15, 17, 20, 23, 27], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 17h-11v-14h-2" /><path d="M6 5l14 1l-1 7h-13" /></svg> },
  { region: 'Average Order Value $30.96, up 1.2%', iconClass: 'c3', arrow: ARROW_UP, delta: '1.2%', label: 'Avg. Order Value', value: '$30.96', color: '--ax-viz-violet', spark: [13, 15, 12, 18, 16, 21, 19, 23], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg> },
  { region: 'Cart Abandonment 68.4 percent, down 1.8 percent which is an improvement', iconClass: 'c4', arrow: ARROW_DN, delta: '1.8%', label: 'Cart Abandonment', value: '68.4%', color: '--ax-viz-emerald', spark: [25, 22, 23, 20, 18, 16, 12, 9], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19m0 1a1 1 0 0 0 1 1h.01" /><path d="M6 5h14l-2 7h-12" /><path d="M3 3h2l.5 2" /><path d="M17 17h-11v-4" /><path d="M9 17m-1 0a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M16 17m-1 0a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /></svg> },
];

const QUICKTILES: { label: string; icon: ReactElement }[] = [
  { label: 'Add product', icon: <><path d="M12 5l0 14" /><path d="M5 12l14 0" /></> },
  { label: 'New order', icon: <><path d="M6 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17h-11v-14h-2" /><path d="M6 5l14 1l-1 7h-13" /></> },
  { label: 'Export CSV', icon: <><path d="M12 3l0 12" /><path d="M8 11l4 4l4 -4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /></> },
  { label: 'Discount', icon: <><path d="M9 5h10a2 2 0 0 1 2 2v10" /><path d="M15 19h-10a2 2 0 0 1 -2 -2v-10" /><path d="M12 9v6" /><path d="M9 12h6" /></> },
  { label: 'Fulfil', icon: <><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></> },
  { label: 'Collections', icon: <><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M14 14h6v6h-6z" /></> },
];

const CATEGORIES = [
  { label: 'Apparel', value: '$48.6K', color: 'var(--ax-accent)' },
  { label: 'Electronics', value: '$38.5K', color: 'var(--ax-viz-cyan)' },
  { label: 'Home & Living', value: '$30.0K', color: 'var(--ax-viz-violet)' },
  { label: 'Beauty', value: '$17.1K', color: 'var(--ax-viz-pink)' },
  { label: 'Other', value: '$8.6K', color: 'var(--ax-viz-amber)' },
];
const CHANNELS = [
  { label: 'Web store', value: '$71.4K · 50%', pct: 50, color: 'var(--ax-accent)' },
  { label: 'Mobile app', value: '$38.6K · 27%', pct: 27, color: 'var(--ax-viz-cyan)' },
  { label: 'Marketplace', value: '$22.8K · 16%', pct: 16, color: 'var(--ax-viz-violet)' },
  { label: 'POS / in-store', value: '$10.0K · 7%', pct: 7, color: 'var(--ax-viz-pink)' },
];
const INVENTORY = [
  { label: 'In stock', value: '2,504', color: 'var(--ax-viz-emerald)' },
  { label: 'Low stock', value: '481', color: 'var(--ax-viz-amber)' },
  { label: 'Out of stock', value: '225', color: 'var(--ax-viz-red)' },
];
const PRODUCTS = [
  { name: 'Aurora Wireless Buds', cat: 'Electronics · 1,204 sold', pct: 94, price: '$129', color: 'var(--ax-viz-cyan)', icon: <><path d="M3 9l4.5 0" /><path d="M3 6l9 0" /><path d="M3 12l9 0" /><path d="M14 6l6 0l0 13l-6 0z" /></> },
  { name: 'Linen Oversized Tee', cat: 'Apparel · 982 sold', pct: 77, price: '$42', color: 'var(--ax-viz-violet)', icon: <><path d="M4 8a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M2 8l10 6l10 -6" /></> },
  { name: 'Hydra Glow Serum', cat: 'Beauty · 854 sold', pct: 66, price: '$38', color: 'var(--ax-viz-pink)', icon: <><path d="M9 11l-4 4l4 4" /><path d="M5 15h11a4 4 0 0 0 0 -8h-1" /></> },
  { name: 'Matte Ceramic Planter', cat: 'Home · 611 sold', pct: 48, price: '$28', color: 'var(--ax-viz-amber)', icon: <><path d="M4 7h16" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 11v4" /><path d="M15 11v4" /></> },
];
const ORDERS = [
  { id: '#AX-10428', name: 'Camila Rossi', items: '3 items', date: 'Jun 12', total: '$312.00', status: 'Delivered', tone: 'success' },
  { id: '#AX-10427', name: 'Henry Whitlock', items: '1 item', date: 'Jun 12', total: '$129.00', status: 'Shipped', tone: 'info' },
  { id: '#AX-10426', name: 'Aiko Tanaka', items: '5 items', date: 'Jun 11', total: '$486.40', status: 'Processing', tone: 'warning' },
  { id: '#AX-10425', name: 'Mateo Alvarez', items: '2 items', date: 'Jun 11', total: '$84.00', status: 'Delivered', tone: 'success' },
  { id: '#AX-10424', name: 'Sofia Lindqvist', items: '4 items', date: 'Jun 10', total: '$218.50', status: 'Refunded', tone: 'danger' },
  { id: '#AX-10423', name: 'Daniel Cho', items: '1 item', date: 'Jun 10', total: '$38.00', status: 'Delivered', tone: 'success' },
];
const LOWSTOCK = [
  { name: 'Hydra Glow Serum', sku: 'SKU BTY-2210', left: '8 left', tone: 'warning' },
  { name: 'Aurora Wireless Buds', sku: 'SKU ELC-0042', left: '2 left', tone: 'danger' },
  { name: 'Linen Oversized Tee — M', sku: 'SKU APP-1180', left: '11 left', tone: 'warning' },
];
const TOPCUST = [
  { initials: 'CR', name: 'Camila Rossi', sub: '28 orders', spend: '$4,210', color: 'var(--ax-accent)' },
  { initials: 'AT', name: 'Aiko Tanaka', sub: '22 orders', spend: '$3,684', color: 'var(--ax-viz-cyan)' },
  { initials: 'SL', name: 'Sofia Lindqvist', sub: '19 orders', spend: '$2,940', color: 'var(--ax-viz-violet)' },
];

export function Ecommerce() {
  return (
    <>
      <PageHead
        title="eCommerce"
        subtitle="Store performance, orders & merchandising — last 30 days."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 30 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard">{ICON_REFRESH}</button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">Add product</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* OPENER (P4 · ACTION-LED): quick actions (7) + target gauge (5) */}
        <section className="ax-card ax-col--7" role="region" aria-label="Quick actions">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Storefront</span>
              <h2 className="ax-card__title">Quick actions</h2>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Customise</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-quicktiles">
              {QUICKTILES.map((t) => (
                <button key={t.label} type="button" className="ax-quicktiles__tile">
                  <span className="ax-quicktiles__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg></span>
                  <span className="ax-quicktiles__label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Monthly target — radial gauge */}
        <section className="ax-card ax-col--5" role="region" aria-label="Monthly revenue target, 68% complete">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">August</span>
              <h2 className="ax-card__title">Monthly target</h2>
            </div>
            <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Target period">
              <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">Month</button>
              <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">Quarter</button>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-gauge">
              <ApexChart
                className="ax-gauge__chart"
                type="radialBar" height={220} legend="none" accent
                ariaLabel="Radial gauge: 68% of the monthly revenue target reached"
                series={[68]}
                apex={{
                  plotOptions: {
                    radialBar: {
                      hollow: { size: '64%' },
                      track: { background: cv('--ax-border') },
                      dataLabels: {
                        name: { show: true, fontFamily: cv('--ax-font-sans'), color: cv('--ax-text-muted'), offsetY: 22, fontSize: '12px' },
                        value: { show: true, fontFamily: cv('--ax-font-mono'), color: cv('--ax-text-strong'), fontSize: '28px', fontWeight: 700, offsetY: -12, formatter: (v: number) => v + '%' },
                      },
                    },
                  },
                  labels: ['of target'],
                }}
              />
              <p className="ax-gauge__caption">$142.8K of the $210K target — on pace to close 4 days early.</p>
              <div className="ax-gauge__rows">
                <div className="ax-gauge__row">
                  <span className="ax-gauge__row-label">Booked</span>
                  <span className="ax-gauge__row-value ax-num">$142.8K</span>
                </div>
                <div className="ax-gauge__row">
                  <span className="ax-gauge__row-label">Remaining</span>
                  <span className="ax-gauge__row-value ax-num">$67.2K</span>
                </div>
                <div className="ax-gauge__row">
                  <span className="ax-gauge__row-label">Daily run-rate</span>
                  <span className="ax-gauge__row-value ax-num">$5.9K</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {KPIS.map((k) => (
          <div key={k.label} className="ax-card ax-kpi ax-col--3" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.iconClass}`}>{k.icon}</span>
                <span className="ax-kpi__delta ax-kpi__delta--up">{k.arrow}{k.delta}</span>
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__meta" style={{ justifyContent: 'space-between', width: '100%' }}>
                <div className="ax-kpi__value ax-num">{k.value}</div>
                <ApexChart className="ax-kpi__spark" type="line" sparkline tooltip={false} height={40} color={k.color} series={[{ name: 'Trend', data: k.spark }]} style={{ minHeight: 40 }} />
              </div>
            </div>
          </div>
        ))}

        {/* HERO: Revenue & Orders */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Revenue and orders">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Performance</span>
              <h2 className="ax-card__title">Revenue &amp; Orders</h2>
              <p className="ax-card__subtitle">Monthly revenue against order volume</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Date range">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">Week</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">Month</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">Year</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Revenue</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-cyan)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Orders</small></span>
            </div>
            <ApexChart
              type="line" height={320} legend="none"
              ariaLabel="Mixed chart of monthly revenue area and order volume columns"
              series={[
                { name: 'Revenue', type: 'line', data: [82000, 91000, 88000, 99000, 108000, 104000, 118000, 124000, 121000, 132000, 138000, 142800] },
                { name: 'Orders', type: 'column', data: [2900, 3200, 3100, 3500, 3800, 3700, 4100, 4300, 4200, 4500, 4600, 4612] },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan')],
                stroke: { width: [2.5, 0], curve: 'smooth' },
                fill: { type: ['solid', 'solid'], opacity: [1, 1] },
                plotOptions: { bar: { borderRadius: 4, columnWidth: '46%' } },
                yaxis: [
                  { labels: { formatter: (v: number) => '$' + (v / 1000).toFixed(0) + 'K' } },
                  { opposite: true, labels: { formatter: (v: number) => (v / 1000).toFixed(1) + 'K' } },
                ],
                xaxis: { categories: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
              }}
            />
          </div>
        </section>

        {/* Sales by Category */}
        <section className="ax-card ax-card--flat ax-col--4" role="region" aria-label="Sales by category">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Sales by Category</h2></div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={230} legend="none"
              ariaLabel="Donut chart of sales by category: apparel 34%, electronics 27%, home 21%, beauty 12%, other 6%"
              series={[34, 27, 21, 12, 6]}
              apex={{
                labels: ['Apparel', 'Electronics', 'Home', 'Beauty', 'Other'],
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Net sales', formatter: () => '$142.8K' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {CATEGORIES.map((c) => (
                <li key={c.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: c.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{c.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sales by Channel */}
        <section className="ax-card ax-col--4" role="region" aria-label="Sales by channel">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Sales by Channel</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {CHANNELS.map((c) => (
              <div key={c.label}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{c.label}</span><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{c.value}</b></div>
                <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${c.pct}%`, background: c.color }} /></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Inventory Status */}
        <section className="ax-card ax-col--4" role="region" aria-label="Inventory status">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Inventory Status</h2><p className="ax-card__subtitle">3,210 SKUs tracked</p></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', height: 14, borderRadius: 'var(--ax-radius-pill)', overflow: 'hidden', marginBottom: 'var(--ax-space-4)' }}>
              <span style={{ width: '78%', background: 'var(--ax-viz-emerald)' }} aria-hidden="true" />
              <span style={{ width: '15%', background: 'var(--ax-viz-amber)' }} aria-hidden="true" />
              <span style={{ width: '7%', background: 'var(--ax-viz-red)' }} aria-hidden="true" />
            </div>
            <ul className="ax-list ax-list--compact">
              {INVENTORY.map((i) => (
                <li key={i.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: i.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{i.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{i.value}</span>
                </li>
              ))}
            </ul>
            <div className="ax-divider" style={{ margin: 'var(--ax-space-3) 0' }} />
            <div className="ax-alert ax-alert--warning" role="status">
              {WARN_ICON}
              <div className="ax-alert__content"><p className="ax-alert__message">14 SKUs below reorder threshold.</p></div>
            </div>
          </div>
        </section>

        {/* Top Products */}
        <section className="ax-card ax-col--4" role="region" aria-label="Top products">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Top Products</h2></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {PRODUCTS.map((p) => (
              <div key={p.name} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <span className="ax-avatar ax-avatar--squircle" style={{ background: `color-mix(in oklab,${p.color} 18%,transparent)`, color: p.color }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.icon}</svg></span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{p.name}</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{p.cat}</div>
                  <div className="ax-progress ax-progress--xs" style={{ marginTop: 6 }}><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p.pct}%` }} /></div></div>
                </div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{p.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="ax-card ax-col--8" role="region" aria-label="Recent orders">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Orders</h2><p className="ax-card__subtitle">Latest store orders</p></div><a className="ax-btn ax-btn--link" href="#">All orders</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Order</th>
                  <th className="ax-table__th" scope="col">Customer</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {ORDERS.map((o) => (
                  <tr key={o.id} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{o.id}</td>
                    <td className="ax-table__td"><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{o.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{o.items}</div></td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{o.date}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>{o.total}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${o.tone} ax-badge--pill`}><span className="ax-badge__dot" />{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low-Stock Alerts + Top Customers */}
        <section className="ax-card ax-col--4" role="region" aria-label="Low stock alerts">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Low-Stock Alerts</h2></div><a className="ax-btn ax-btn--link" href="#">Restock</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-list ax-list--compact">
              {LOWSTOCK.map((l) => {
                const c = l.tone === 'danger' ? 'var(--ax-danger-500)' : 'var(--ax-warning-500)';
                return (
                  <li key={l.sku} className="ax-list__row" style={{ paddingInline: 0 }}>
                    <span className="ax-list__leading"><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${c} 20%,transparent)`, color: c }}>{WARN_ICON}</span></span>
                    <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{l.name}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{l.sku}</span></span>
                    <span className="ax-list__trailing"><span className={`ax-badge ax-badge--soft ax-badge--${l.tone}`}>{l.left}</span></span>
                  </li>
                );
              })}
            </ul>
            <div className="ax-card__header" style={{ borderTop: '1px solid var(--ax-border)' }}><div className="ax-card__titles"><h2 className="ax-card__title">Top Customers</h2></div></div>
            <ul className="ax-list ax-list--compact">
              {TOPCUST.map((t) => (
                <li key={t.initials} className="ax-list__row" style={{ paddingInline: 0 }}>
                  <span className="ax-list__leading"><span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${t.color} 22%,transparent)`, color: t.color, fontWeight: 600 }}>{t.initials}</span></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{t.name}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{t.sub}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{t.spend}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export default Ecommerce;
