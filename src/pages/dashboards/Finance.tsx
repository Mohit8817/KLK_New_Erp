/*
 * Vireo React — Finance & Banking dashboard (route "dashboards/finance").
 *
 * Faithful re-expression of src/html/dashboards/finance.html: 4 KPI cards, a
 * diverging Income vs. Expenses mixed chart, a Total Balance gradient plate,
 * spending donut, accounts list, budget rings, recent transactions table and
 * upcoming bills. Charts via <ApexChart>; DOM/classes/ARIA match 1:1.
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

interface Kpi { region: string; icon: ReactElement; iconClass: string; deltaDir: 'up' | 'down'; delta: string; label: string; value: string; color: string; spark: number[]; }
const KPIS: Kpi[] = [
  { region: 'Total Balance $312,540, up 3.1%', iconClass: 'c1', deltaDir: 'up', delta: '3.1%', label: 'Total Balance', value: '$312,540', color: '--ax-accent', spark: [8, 10, 9, 14, 16, 20, 23, 27], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10l9 -6l9 6" /><path d="M4 10v10h16v-10" /><path d="M9 20v-6h6v6" /></svg> },
  { region: 'Monthly Income $48,200, up 4.0%', iconClass: 'c2', deltaDir: 'up', delta: '4.0%', label: 'Monthly Income', value: '$48,200', color: '--ax-viz-emerald', spark: [7, 10, 9, 16, 18, 22, 25, 29], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l9 -10" /><path d="M12 5v6" /><path d="M9 8l3 3l3 -3" /></svg> },
  { region: 'Monthly Expenses $31,760, up 6.7 percent which is unfavourable', iconClass: 'c3', deltaDir: 'down', delta: '6.7%', label: 'Monthly Expenses', value: '$31,760', color: '--ax-viz-red', spark: [12, 14, 12, 17, 16, 21, 20, 25], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 -5l9 10" /><path d="M12 19v-6" /><path d="M9 16l3 3l3 -3" /></svg> },
  { region: 'Net Savings Rate 34 percent, up 1.5%', iconClass: 'c4', deltaDir: 'up', delta: '1.5%', label: 'Net Savings Rate', value: '34%', color: '--ax-viz-amber', spark: [10, 12, 11, 16, 15, 20, 19, 23], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8a4 4 0 0 1 4 -4h7l6 6v6a4 4 0 0 1 -4 4h-1" /><path d="M12 15m-3 0a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M5 13h2" /></svg> },
];
// expenses KPI uses the down delta class but the up-chevron arrow (matches reference markup)
const EXP_ARROW = ARROW_UP;

const SPEND = [
  { label: 'Payroll', value: '$13,974', color: 'var(--ax-accent)' },
  { label: 'Software', value: '$5,717', color: 'var(--ax-viz-cyan)' },
  { label: 'Marketing', value: '$4,764', color: 'var(--ax-viz-violet)' },
  { label: 'Office', value: '$4,129', color: 'var(--ax-viz-pink)' },
  { label: 'Other', value: '$3,176', color: 'var(--ax-viz-amber)' },
];
const ACCOUNTS: { name: string; sub: string; amount: string; amountColor: string; meta: string; metaDelta?: string; metaUp?: boolean; color: string; icon: ReactElement }[] = [
  { name: 'Operating Checking', sub: '•••• 7045', amount: '$184,210', amountColor: 'var(--ax-text-strong)', meta: '', metaDelta: '2.4%', metaUp: true, color: 'var(--ax-accent)', icon: <><path d="M3 10h18" /><path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2" /></> },
  { name: 'High-Yield Savings', sub: '•••• 2208', amount: '$96,400', amountColor: 'var(--ax-text-strong)', meta: '', metaDelta: '4.0%', metaUp: true, color: 'var(--ax-viz-cyan)', icon: <><path d="M3 8a4 4 0 0 1 4 -4h7l6 6v6a4 4 0 0 1 -4 4h-1" /><path d="M12 15m-3 0a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></> },
  { name: 'Corporate Card', sub: '•••• 3391', amount: '−$8,420', amountColor: 'var(--ax-viz-red)', meta: 'due Jun 28', color: 'var(--ax-viz-violet)', icon: <><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /></> },
  { name: 'Tax Reserve', sub: '•••• 0117', amount: '$40,350', amountColor: 'var(--ax-text-strong)', meta: 'locked', color: 'var(--ax-viz-amber)', icon: <><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 12v4h-4a2 2 0 0 1 0 -4z" /></> },
];
const BUDGETS = [
  { label: 'Payroll', value: '$13.9K / $15K', valueColor: 'var(--ax-text-strong)', pct: 93, color: 'var(--ax-accent)' },
  { label: 'Software', value: '$5.7K / $6K', valueColor: 'var(--ax-text-strong)', pct: 95, color: 'var(--ax-viz-cyan)' },
  { label: 'Marketing', value: '$4.8K / $4K', valueColor: 'var(--ax-viz-red)', pct: 100, color: 'var(--ax-danger-500)' },
  { label: 'Office', value: '$4.1K / $5K', valueColor: 'var(--ax-text-strong)', pct: 82, color: 'var(--ax-viz-violet)' },
];
const TXNS = [
  { date: 'Jun 12', payee: 'Stripe Payout', cat: 'Revenue', acct: 'Checking •7045', amount: '+$18,420.00', amountColor: 'var(--ax-viz-emerald)' },
  { date: 'Jun 11', payee: 'Gusto Payroll', cat: 'Payroll', acct: 'Checking •7045', amount: '−$13,974.00', amountColor: 'var(--ax-text)' },
  { date: 'Jun 11', payee: 'AWS', cat: 'Software', acct: 'Card •3391', amount: '−$2,840.00', amountColor: 'var(--ax-text)' },
  { date: 'Jun 10', payee: 'Pulse Ads', cat: 'Marketing', acct: 'Card •3391', amount: '−$1,640.00', amountColor: 'var(--ax-text)' },
  { date: 'Jun 09', payee: 'Acme Co Invoice', cat: 'Revenue', acct: 'Checking •7045', amount: '+$9,200.00', amountColor: 'var(--ax-viz-emerald)' },
  { date: 'Jun 08', payee: 'WeWork', cat: 'Office', acct: 'Checking •7045', amount: '−$4,129.00', amountColor: 'var(--ax-text)' },
];
const BILLS: { name: string; due: string; amount: string; days: string; tone: string; color: string; icon: ReactElement }[] = [
  { name: 'Corporate Card', due: 'Due Jun 28', amount: '$8,420', days: '2 days', tone: 'danger', color: 'var(--ax-danger-500)', icon: <><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10h18" /></> },
  { name: 'Office Lease', due: 'Due Jul 01', amount: '$4,129', days: '5 days', tone: 'warning', color: 'var(--ax-warning-500)', icon: <><path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /></> },
  { name: 'SaaS Stack', due: 'Due Jul 05', amount: '$2,840', days: '9 days', tone: '', color: 'var(--ax-viz-cyan)', icon: <><path d="M3 9l4.5 0" /><path d="M3 6l9 0" /><path d="M14 6l6 0l0 13l-6 0z" /></> },
  { name: 'Quarterly Tax', due: 'Due Jul 15', amount: '$22,100', days: '19 days', tone: '', color: 'var(--ax-viz-violet)', icon: <><path d="M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3" /><path d="M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4" /><path d="M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0s3 -1.526 3 -2.598s-1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0s-3 1.526 -3 2.598" /><path d="M3 6v10c0 .888 .772 1.45 2 2" /></> },
];

export function Finance() {
  return (
    <>
      <PageHead
        title="Finance & Banking"
        subtitle="Balances, cash flow & budgets — last 30 days."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_CAL}<span className="ax-btn__label">Last 30 days</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard">{ICON_REFRESH}</button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">Add transaction</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* OPENER (P2 · WELCOME): band (12), then the KPI row */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Account summary">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Personal finance</p>
              <h2 className="ax-welcome__title">You saved $16,440 this month</h2>
              <p className="ax-welcome__lede">That is 34% of income put aside — your best month since February. Three bills fall due in the next seven days.</p>
              <div className="ax-welcome__actions">
                <button type="button" className="ax-btn ax-btn--primary ax-btn--sm">
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
                  <span className="ax-btn__label">Transfer</span>
                </button>
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm">
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></svg>
                  <span className="ax-btn__label">Pay bills</span>
                </button>
              </div>
            </div>
            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat"><dt>Savings rate</dt><dd className="ax-num">34%</dd></div>
              <div className="ax-welcome__stat"><dt>Bills due</dt><dd className="ax-num">3</dd></div>
              <div className="ax-welcome__stat"><dt>Budgets over</dt><dd className="ax-num">1</dd></div>
            </dl>
          </div>
        </section>

        {KPIS.map((k) => (
          <div key={k.label} className="ax-card ax-kpi ax-col--3" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.iconClass}`}>{k.icon}</span>
                <span className={`ax-kpi__delta ax-kpi__delta--${k.deltaDir}`}>{EXP_ARROW}{k.delta}</span>
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__meta" style={{ justifyContent: 'space-between', width: '100%' }}>
                <div className="ax-kpi__value ax-num">{k.value}</div>
                <ApexChart className="ax-kpi__spark" type="line" sparkline tooltip={false} height={40} color={k.color} series={[{ name: 'Trend', data: k.spark }]} style={{ minHeight: 40 }} />
              </div>
            </div>
          </div>
        ))}

        {/* HERO: Income vs. Expenses */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Cash flow">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Cash flow</span>
              <h2 className="ax-card__title">Income vs. Expenses</h2>
              <p className="ax-card__subtitle">Monthly inflow, outflow &amp; net position</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Date range">
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">6M</button>
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">12M</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">YTD</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)', marginBlockEnd: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-success-500)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Income</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-danger-500)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Expenses</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Net</small></span>
            </div>
            <ApexChart
              type="line" height={320} legend="none"
              ariaLabel="Mixed chart of income columns up, expenses columns down, and net cash line"
              series={[
                { name: 'Income', type: 'column', data: [38, 40, 39, 43, 45, 42, 46, 47, 45, 48, 47, 48.2] },
                { name: 'Expenses', type: 'column', data: [-26, -28, -27, -29, -31, -30, -32, -33, -31, -32, -33, -31.76] },
                { name: 'Net', type: 'line', data: [12, 12, 12, 14, 14, 12, 14, 14, 14, 16, 14, 16.44] },
              ]}
              apex={{
                colors: [cv('--ax-success-500'), cv('--ax-danger-500'), cv('--ax-accent')],
                stroke: { width: [0, 0, 2.5], curve: 'smooth' },
                plotOptions: { bar: { borderRadius: 4, columnWidth: '52%' } },
                yaxis: { labels: { formatter: (v: number) => '$' + Math.abs(v).toFixed(0) + 'K' } },
                xaxis: { categories: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
              }}
            />
          </div>
        </section>

        {/* Total Balance plate */}
        <section className="ax-card ax-card--balance ax-col--4" role="region" aria-label="Total balance">
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Total Balance</h2></div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Currency">
                <button type="button" className="ax-btn ax-btn--sm is-selected" role="radio" aria-checked="true">USD</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">GBP</button>
                <button type="button" className="ax-btn ax-btn--sm" role="radio" aria-checked="false">EUR</button>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ax-radius-lg)', padding: 'var(--ax-space-5)', background: 'var(--ax-gradient-plate)', boxShadow: 'var(--ax-shadow-md)', color: '#fff', minHeight: 172, display: 'flex', flexDirection: 'column' }}>
              <span aria-hidden="true" style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.18)', filter: 'blur(6px)' }} />
              <span aria-hidden="true" style={{ position: 'absolute', bottom: -50, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
              <div className="ax-cluster" style={{ justifyContent: 'space-between', position: 'relative' }}>
                <b style={{ fontFamily: 'var(--ax-font-display)', letterSpacing: '.02em', color: 'inherit' }}>Vireo · Operating</b>
                <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.9 }}><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /><path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2" /></svg>
              </div>
              <div style={{ marginTop: 'auto', position: 'relative' }}>
                <div style={{ fontSize: 'var(--ax-text-xs)', opacity: 0.85 }}>Available balance</div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.01em' }}>$312,540.00</div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', letterSpacing: '.12em', opacity: 0.92, marginTop: 'var(--ax-space-3)' }}>4921&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;7045</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)' }}>
              <button type="button" className="ax-btn ax-btn--solid ax-btn--block">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
                <span className="ax-btn__label">Transfer</span>
              </button>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--block">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M18 13l-6 6" /><path d="M6 13l6 6" /></svg>
                <span className="ax-btn__label">Deposit</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--ax-space-3)', textAlign: 'center' }}>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Income</small><b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-md)' }}>+$48,200</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Expenses</small><b className="ax-num" style={{ color: 'var(--ax-viz-red)', fontSize: 'var(--ax-text-md)' }}>−$31,760</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Saved</small><b className="ax-num" style={{ color: 'var(--ax-viz-cyan)', fontSize: 'var(--ax-text-md)' }}>$16,440</b></div>
            </div>
          </div>
        </section>

        {/* Spending by Category */}
        <section className="ax-card ax-col--4" role="region" aria-label="Spending by category">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Spending by Category</h2></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={230} legend="none"
              ariaLabel="Donut chart of spending: payroll 44%, software 18%, marketing 15%, office 13%, other 10%"
              series={[44, 18, 15, 13, 10]}
              apex={{
                labels: ['Payroll', 'Software', 'Marketing', 'Office', 'Other'],
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Spent', formatter: () => '$31.8K' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {SPEND.map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Accounts */}
        <section className="ax-card ax-col--4" role="region" aria-label="Accounts">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Accounts</h2></div><a className="ax-btn ax-btn--link" href="#">Manage</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {ACCOUNTS.map((a) => (
              <div key={a.name} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <span className="ax-avatar ax-avatar--squircle" style={{ background: `color-mix(in oklab,${a.color} 18%,transparent)`, color: a.color }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{a.icon}</svg></span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{a.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{a.sub}</div></div>
                <div style={{ textAlign: 'right' }}><b className="ax-num" style={{ color: a.amountColor }}>{a.amount}</b>{a.metaDelta ? <div className={`ax-kpi__delta ax-kpi__delta--${a.metaUp ? 'up' : 'down'}`} style={{ justifyContent: 'flex-end' }}>{ARROW_UP}{a.metaDelta}</div> : <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{a.meta}</div>}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Budget Utilization */}
        <section className="ax-card ax-card--flat ax-col--4" role="region" aria-label="Budget utilization">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Budget Utilization</h2><p className="ax-card__subtitle">June envelopes</p></div></div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {BUDGETS.map((b) => (
              <div key={b.label}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{b.label}</span><b className="ax-num" style={{ color: b.valueColor, fontSize: 'var(--ax-text-sm)' }}>{b.value}</b></div>
                <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${b.pct}%`, background: b.color }} /></div></div>
              </div>
            ))}
            <div className="ax-alert ax-alert--danger" role="status">
              <svg className="ax-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
              <div className="ax-alert__content"><p className="ax-alert__message">Marketing is 19% over budget.</p></div>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="ax-card ax-col--8" role="region" aria-label="Recent transactions">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Recent Transactions</h2><p className="ax-card__subtitle">Latest movements across accounts</p></div><a className="ax-btn ax-btn--link" href="#">View all</a></div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">Payee</th>
                  <th className="ax-table__th" scope="col">Category</th>
                  <th className="ax-table__th" scope="col">Account</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {TXNS.map((t, i) => (
                  <tr key={i} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{t.date}</td>
                    <td className="ax-table__td"><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{t.payee}</div></td>
                    <td className="ax-table__td"><span className="ax-badge ax-badge--soft">{t.cat}</span></td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{t.acct}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: t.amountColor }}>{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Upcoming Bills */}
        <section className="ax-card ax-col--4" role="region" aria-label="Upcoming bills">
          <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Upcoming Bills</h2></div><a className="ax-btn ax-btn--link" href="#">Schedule</a></div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-list ax-list--compact">
              {BILLS.map((b) => (
                <li key={b.name} className="ax-list__row" style={{ paddingInline: 0 }}>
                  <span className="ax-list__leading"><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${b.color} 18%,transparent)`, color: b.color }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{b.icon}</svg></span></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{b.name}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{b.due}</span></span>
                  <span className="ax-list__trailing"><b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{b.amount}</b><div><span className={`ax-badge ax-badge--soft ${b.tone ? `ax-badge--${b.tone}` : ''}`}>{b.days}</span></div></span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export default Finance;
