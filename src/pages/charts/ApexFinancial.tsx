/*
 * Vireo React — Financial Charts (charts/apex-financial).
 *
 * Faithful re-expression of src/html/charts/apex-financial.html via <ApexChart>:
 * 4 KPI tickers (with sparklines), a candlestick + volume brush, OHLC bars, a
 * range-area forecast band, a brush navigator, a boxplot, and a session-tape
 * table. Custom Apex options (brush sync, candlestick colours, rangeArea,
 * boxPlot) pass through the `apex` prop. DOM/classes/ARIA match the reference 1:1.
 */
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const candles = [
  { x: 'Jun 02', y: [412, 420, 408, 418] },
  { x: 'Jun 03', y: [418, 426, 414, 415] },
  { x: 'Jun 04', y: [415, 430, 412, 428] },
  { x: 'Jun 05', y: [428, 432, 420, 424] },
  { x: 'Jun 06', y: [424, 440, 422, 438] },
  { x: 'Jun 09', y: [438, 445, 430, 433] },
  { x: 'Jun 10', y: [433, 442, 429, 440] },
  { x: 'Jun 11', y: [440, 448, 436, 437] },
  { x: 'Jun 12', y: [437, 450, 433, 446] },
  { x: 'Jun 13', y: [446, 452, 438, 441] },
  { x: 'Jun 16', y: [441, 449, 435, 448] },
  { x: 'Jun 17', y: [448, 458, 444, 455] },
];
const volNums = [1190, 1280, 1550, 1410, 1620, 1840, 1720, 1490, 1980, 1610, 1530, 2010];
const volume = candles.map((c, i) => ({ x: c.x, y: volNums[i] }));

const days = Array.from({ length: 40 }, (_, i) => new Date(2025, 4, 1 + i).getTime());
const sessionsRaw = [9.2, 9.8, 10.4, 10.1, 11.2, 12.6, 11.9, 12.4, 13.1, 12.8, 13.6, 14.2, 13.9, 14.8, 15.4, 15.1, 16.0, 16.6, 16.2, 17.1, 17.6, 17.2, 18.0, 18.5, 18.1, 19.0, 19.4, 19.0, 20.1, 20.6, 20.2, 21.0, 21.4, 21.1, 22.0, 22.6, 22.1, 23.0, 23.5, 24.1];
const sessionsData = sessionsRaw.map((v, i) => [days[i], Math.round(v * 1000)] as [number, number]);

const KPIS = [
  { region: 'Last price $438.40, up 3.1%', icon: 'c1', up: true, delta: '3.1%', label: 'Last price (APG)', value: '$438.40', valStyle: undefined as React.CSSProperties | undefined, spark: { color: '--ax-accent', data: [8, 10, 7, 14, 16, 20, 25, 29] }, iconPaths: <><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></> },
  { region: 'Day range $430.20 to $445.00', icon: 'c2', up: true, delta: '1.6%', label: 'Day range', value: '430.20–445.00', valStyle: { fontSize: 'var(--ax-text-xl)' } as React.CSSProperties, spark: null, iconPaths: <><path d="M4 18l5 -5l4 4l8 -8" /><path d="M16 9h5v5" /></> },
  { region: 'Volume 1.84M shares, up 12.0%', icon: 'c3', up: true, delta: '12.0%', label: 'Volume', value: '1.84M', valStyle: undefined, spark: { color: '--ax-viz-violet', data: [14, 12, 18, 15, 22, 17, 24, 26] }, iconPaths: <path d="M3 12h4l3 8l4 -16l3 8h4" /> },
  { region: 'Market cap $3.71B, down 0.4%', icon: 'c4', up: false, delta: '0.4%', label: 'Market cap', value: '$3.71B', valStyle: undefined, spark: { color: '--ax-viz-amber', data: [26, 23, 25, 21, 22, 18, 16, 13] }, iconPaths: <><path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /><path d="M9 9l0 0" /><path d="M9 12l0 0" /><path d="M9 15l0 0" /></> },
];

const ARROW_UP = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>;
const ARROW_DN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>;

const TAPE = [
  { date: 'Jun 09', o: '438.00', h: '445.00', l: '430.20', cl: '433.00', clColor: 'var(--ax-viz-emerald)', vol: '1.84M', tone: 'danger', d: '−1.1%' },
  { date: 'Jun 06', o: '424.00', h: '440.00', l: '422.00', cl: '438.00', clColor: 'var(--ax-viz-emerald)', vol: '1.62M', tone: 'success', d: '+3.3%' },
  { date: 'Jun 05', o: '428.00', h: '432.00', l: '420.00', cl: '424.00', clColor: 'var(--ax-text)', vol: '1.41M', tone: 'danger', d: '−0.9%' },
  { date: 'Jun 04', o: '415.00', h: '430.00', l: '412.00', cl: '428.00', clColor: 'var(--ax-viz-emerald)', vol: '1.55M', tone: 'success', d: '+3.1%' },
  { date: 'Jun 03', o: '418.00', h: '426.00', l: '414.00', cl: '415.00', clColor: 'var(--ax-text)', vol: '1.28M', tone: 'danger', d: '−0.7%' },
  { date: 'Jun 02', o: '412.00', h: '420.00', l: '408.00', cl: '418.00', clColor: 'var(--ax-viz-emerald)', vol: '1.19M', tone: 'success', d: '+1.5%' },
];

export function ApexFinancial() {
  const candleColors = { upward: cv('--ax-success-500') || '#34D399', downward: cv('--ax-danger-500') || '#FB7185' };
  return (
    <>
      <PageHead
        title="Financial Charts"
        subtitle="Candlestick, OHLC, range area & brush — Aperture Goods (APG) ticker, Jun 2025."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
              <span className="ax-btn__label">Jun 2025</span>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
            </button>
            <button type="button" className="ax-btn ax-btn--ghost">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
              <span className="ax-btn__label">Export</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -3" /><path d="M6 4l0 2" /><path d="M6 11l0 9" /><path d="M10 15a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -3" /><path d="M12 4l0 10" /><path d="M12 19l0 1" /><path d="M16 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -4" /><path d="M18 4l0 1" /><path d="M18 11l0 9" /></svg>
              <span className="ax-btn__label">New chart</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI ROW */}
        {KPIS.map((k) => (
          <div key={k.label} className="ax-card ax-kpi ax-col--3" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.icon}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{k.iconPaths}</svg>
                </span>
                <span className={`ax-kpi__delta ax-kpi__delta--${k.up ? 'up' : 'down'}`}>{k.up ? ARROW_UP : ARROW_DN}{k.delta}</span>
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__meta" style={{ justifyContent: 'space-between', width: '100%' }}>
                <div className="ax-kpi__value ax-num" style={k.valStyle}>{k.value}</div>
                {k.spark && (
                  <ApexChart className="ax-kpi__spark" type="line" sparkline tooltip={false} height={40} color={k.spark.color}
                    series={[{ name: 'Trend', data: k.spark.data }]} style={{ minHeight: 40 }} />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* HERO: Candlestick + volume brush (12) */}
        <section className="ax-card ax-card--chart ax-col--12" role="region" aria-label="APG daily candlestick chart with volume brush">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">OHLC · Daily</span>
              <h2 className="ax-card__title">APG — Candlestick</h2>
              <p className="ax-card__subtitle">Open / high / low / close · brush the volume strip below to zoom</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-4)' }}>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-success-500)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Bullish</small></span>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-danger-500)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Bearish</small></span>
              </div>
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Interval">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1D</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">1W</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">1M</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart type="candlestick" height={320} legend="none"
              ariaLabel="Candlestick chart of APG daily OHLC prices, last close $438.40"
              series={[{ name: 'APG', data: candles }]}
              apex={{
                chart: { id: 'ax-candle', toolbar: { show: false } },
                plotOptions: { candlestick: { colors: { upward: candleColors.upward, downward: candleColors.downward }, wick: { useFillColor: true } } },
                xaxis: { type: 'category', tooltip: { enabled: false } },
                yaxis: { tooltip: { enabled: true }, labels: { formatter: (v: number) => '$' + Math.round(v) } },
              }} />
            <div style={{ marginTop: 'var(--ax-space-2)' }}>
              <ApexChart type="bar" height={96} legend="none"
                ariaLabel="Volume brush selector for the candlestick chart"
                series={[{ name: 'Volume', data: volume }]}
                apex={{
                  chart: { id: 'ax-candle-vol', brush: { enabled: true, target: 'ax-candle' }, selection: { enabled: true, xaxis: { min: 4, max: 11 } } },
                  plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
                  colors: [cv('--ax-accent')],
                  xaxis: { type: 'category', labels: { show: false }, axisBorder: { show: false } },
                  yaxis: { labels: { show: false } },
                  grid: { yaxis: { lines: { show: false } } },
                }} />
            </div>
          </div>
        </section>

        {/* OHLC bars (6) */}
        <section className="ax-card ax-card--chart ax-col--6" role="region" aria-label="APG OHLC bar chart">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Bar OHLC</span>
              <h2 className="ax-card__title">OHLC Bars</h2>
              <p className="ax-card__subtitle">Classic open-high-low-close bars</p>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="OHLC chart options">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart type="candlestick" height={300} legend="none"
              ariaLabel="OHLC bar chart of APG daily prices"
              series={[{ name: 'APG', data: candles.slice(2) }]}
              apex={{
                chart: { type: 'candlestick' },
                plotOptions: { candlestick: { colors: { upward: candleColors.upward, downward: candleColors.downward } } },
                stroke: { width: 1 },
                xaxis: { type: 'category' },
                yaxis: { labels: { formatter: (v: number) => '$' + Math.round(v) } },
              }} />
          </div>
        </section>

        {/* Range area (6) */}
        <section className="ax-card ax-card--chart ax-col--6" role="region" aria-label="Revenue forecast range area">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Range area</span>
              <h2 className="ax-card__title">Forecast Band</h2>
              <p className="ax-card__subtitle">Revenue projection — low / mid / high envelope</p>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill"><span className="ax-badge__dot" />On track</span>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart type="rangeArea" height={300} legend="none"
              ariaLabel="Range area chart of revenue forecast with confidence band"
              series={[
                { type: 'rangeArea', name: 'Confidence band', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => ({ x: m, y: [[620, 660, 700, 690, 760, 800, 870, 940][i], [720, 760, 820, 810, 900, 960, 1060, 1180][i]] })) },
                { type: 'line', name: 'Projection', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => ({ x: m, y: [670, 710, 760, 750, 830, 880, 965, 1060][i] })) },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-accent')],
                fill: { opacity: [0.16, 1] },
                stroke: { width: [0, 2.5], curve: 'smooth' },
                yaxis: { labels: { formatter: (v: number) => '$' + Math.round(v) + 'K' } },
              }} />
          </div>
        </section>

        {/* Brush navigator (8) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Sessions with brush navigator">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Brush + sync</span>
              <h2 className="ax-card__title">Brush Navigator</h2>
              <p className="ax-card__subtitle">Drag the lower strip to focus the detail chart above</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart type="area" height={260} legend="none" accent
              ariaLabel="Detail area chart driven by the brush navigator below"
              series={[{ name: 'Sessions', data: sessionsData }]}
              apex={{
                chart: { id: 'ax-brush-target', toolbar: { autoSelected: 'pan', show: false } },
                xaxis: { type: 'datetime' },
                yaxis: { labels: { formatter: (v: number) => (v / 1000).toFixed(1) + 'K' } },
              }} />
            <div style={{ marginTop: 'var(--ax-space-2)' }}>
              <ApexChart type="area" height={90} legend="none"
                ariaLabel="Brush navigator selector"
                series={[{ name: 'Sessions', data: sessionsData }]}
                apex={{
                  chart: { id: 'ax-brush-nav-chart', brush: { target: 'ax-brush-target', enabled: true }, selection: { enabled: true, xaxis: { min: days[18], max: days[34] } } },
                  colors: [cv('--ax-viz-cyan')],
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.32, opacityTo: 0.05 } },
                  xaxis: { type: 'datetime', tooltip: { enabled: false } },
                  yaxis: { tickAmount: 2, labels: { show: false } },
                  grid: { yaxis: { lines: { show: false } } },
                }} />
            </div>
          </div>
        </section>

        {/* Boxplot (4) */}
        <section className="ax-card ax-card--chart ax-col--4" role="region" aria-label="Quarterly price spread boxplot">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Distribution</span>
              <h2 className="ax-card__title">Price Spread</h2>
              <p className="ax-card__subtitle">Quarterly box &amp; whisker</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart type="boxPlot" height={300} legend="none"
              ariaLabel="Boxplot of quarterly APG price spread"
              series={[{ type: 'boxPlot', data: [
                { x: 'Q1', y: [388, 402, 414, 426, 438] },
                { x: 'Q2', y: [408, 418, 430, 442, 458] },
                { x: 'Q3', y: [420, 432, 444, 456, 472] },
                { x: 'Q4', y: [435, 448, 460, 474, 492] },
              ] }]}
              apex={{
                plotOptions: { boxPlot: { colors: { upper: cv('--ax-viz-cyan'), lower: cv('--ax-accent') } } },
                stroke: { colors: [cv('--ax-text-subtle')], width: 1 },
                yaxis: { labels: { formatter: (v: number) => '$' + Math.round(v) } },
              }} />
          </div>
        </section>

        {/* FULL: tick table (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent OHLC session table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Session Tape</h2>
              <p className="ax-card__subtitle">Last six trading sessions · OHLC &amp; volume</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Full history</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Open</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">High</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Low</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Close</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Volume</th>
                  <th className="ax-table__th" scope="col">Trend</th>
                </tr>
              </thead>
              <tbody>
                {TAPE.map((r) => (
                  <tr key={r.date} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{r.date}</td>
                    <td className="ax-table__td ax-table__td--num">{r.o}</td>
                    <td className="ax-table__td ax-table__td--num">{r.h}</td>
                    <td className="ax-table__td ax-table__td--num">{r.l}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: r.clColor }}>{r.cl}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-muted)' }}>{r.vol}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${r.tone} ax-badge--pill`}><span className="ax-badge__dot" />{r.d}</span></td>
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

export default ApexFinancial;
