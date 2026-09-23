/*
 * Vireo React — Basic Tables (tables/basic).
 *
 * Faithful re-expression of src/html/tables/basic.html: default, striped+hover,
 * bordered, compact, contextual-row and responsive/totals table variants — all
 * static JSX on the shared .ax-table primitive. DOM classes/ARIA match 1:1.
 */
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const ICON_DB = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" /><path d="M3 5v6a8 3 0 0 0 16 0v-6" /><path d="M3 11v6a8 3 0 0 0 16 0v-6" /></svg>
);
const ICON_EXPORT = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
);

export function Basic() {
  return (
    <>
      <PageHead
        title="Basic Tables"
        subtitle="Static table variants — striped, bordered, hover, compact & responsive — built on the Aurora .ax-table primitive."
        actions={
          <>
            <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/tables/data-tables">
              {ICON_DB}
              <span className="ax-btn__label">Data tables</span>
            </Link>
            <button type="button" className="ax-btn ax-btn--primary">
              {ICON_EXPORT}
              <span className="ax-btn__label">Export CSV</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* DEFAULT TABLE */}
        <section className="ax-card ax-col--12" role="region" aria-label="Default table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Base</span>
              <h2 className="ax-card__title">Default Table</h2>
              <p className="ax-card__subtitle">Hairline rows, uppercase eyebrow header, mono numerics — the resting style every variant builds on.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral"><code className="ax-mono" style={{ fontSize: 'var(--ax-text-2xs)' }}>.ax-table</code></span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table">
              <caption className="ax-visually-hidden">Northwind Labs team — directory with role, department and status</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Name</th>
                  <th className="ax-table__th" scope="col">Role</th>
                  <th className="ax-table__th" scope="col">Department</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ava Sutton', 'Operations Lead', 'Operations', 'success', 'Online', 24],
                  ['Marcus Reyes', 'Engineering Manager', 'Engineering', 'success', 'Online', 17],
                  ['Lena Brandt', 'Product Designer', 'Design', 'warning', 'Away', 31],
                  ['Devon Okafor', 'Backend Engineer', 'Engineering', 'success', 'Online', 12],
                  ['Priya Nair', 'Data Analyst', 'Analytics', 'neutral', 'Offline', 9],
                ].map(([name, role, dept, tone, status, tasks]) => (
                  <tr key={name as string} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{name}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{role}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{dept}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}><span className="ax-badge__dot" />{status}</span></td>
                    <td className="ax-table__td ax-table__td--num">{tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* STRIPED + HOVER (avatars) */}
        <section className="ax-card ax-col--6" role="region" aria-label="Striped table with avatars">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Striped &amp; Hover</h2>
              <p className="ax-card__subtitle">Zebra rows for scanability, hover tint for pointer feedback.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--accent"><code className="ax-mono" style={{ fontSize: 'var(--ax-text-2xs)' }}>--striped --hover</code></span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped ax-table--hover">
              <caption className="ax-visually-hidden">Customers with segment and lifetime value</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Customer</th>
                  <th className="ax-table__th" scope="col">Segment</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">LTV</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { v: '--ax-viz-cyan', i: 'CR', n: 'Camila Rossi', city: 'Lisbon', seg: 'VIP', segTone: 'accent', ltv: '$6,180' },
                  { v: '--ax-viz-violet', i: 'OP', n: 'Olivia Penrose', city: 'Bristol', seg: 'VIP', segTone: 'accent', ltv: '$5,980' },
                  { v: '--ax-viz-amber', i: 'EL', n: 'Erik Lindqvist', city: 'Malmö', seg: 'Wholesale', segTone: 'info', ltv: '$5,240' },
                  { v: '--ax-viz-pink', i: 'NH', n: 'Nadia Haddad', city: 'Marseille', seg: 'VIP', segTone: 'accent', ltv: '$4,720' },
                  { v: '--ax-viz-emerald', i: 'YT', n: 'Yuki Tanaka', city: 'Osaka', seg: 'Returning', segTone: 'neutral', ltv: '$2,870' },
                ].map((r) => (
                  <tr key={r.n} className="ax-table__row">
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                        <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,var(${r.v}) 18%,var(--ax-surface-solid))`, color: `var(${r.v})` }}><span className="ax-avatar__initials">{r.i}</span></span>
                        <div style={{ minWidth: 0 }}><div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.n}</div><div className="ax-text-truncate" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{r.city}</div></div>
                      </div>
                    </td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${r.segTone}`}>{r.seg}</span></td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.ltv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BORDERED */}
        <section className="ax-card ax-col--6" role="region" aria-label="Bordered table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Bordered</h2>
              <p className="ax-card__subtitle">Full cell rules — best for dense, spreadsheet-like data.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--accent"><code className="ax-mono" style={{ fontSize: 'var(--ax-text-2xs)' }}>--bordered</code></span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--bordered ax-table--hover">
              <caption className="ax-visually-hidden">Aperture Goods inventory with stock and price</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">SKU</th>
                  <th className="ax-table__th" scope="col">Product</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Stock</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sku: 'APG-0008', p: 'Brass Task Light', stock: '22', stockDanger: false, price: '$182.00' },
                  { sku: 'APG-0001', p: 'Aperture Desk Lamp', stock: '84', stockDanger: false, price: '$129.00' },
                  { sku: 'APG-0004', p: 'Walnut Monitor Riser', stock: '41', stockDanger: false, price: '$96.00' },
                  { sku: 'APG-0002', p: 'Linen Pinboard', stock: '0', stockDanger: true, price: '$58.00' },
                  { sku: 'APG-0003', p: 'Matte Ceramic Mug', stock: '312', stockDanger: false, price: '$24.00' },
                ].map((r) => (
                  <tr key={r.sku} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{r.sku}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.p}</td>
                    <td className="ax-table__td ax-table__td--num" style={r.stockDanger ? { color: 'var(--ax-danger-500)' } : undefined}>{r.stock}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* COMPACT */}
        <section className="ax-card ax-col--6" role="region" aria-label="Compact table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Compact</h2>
              <p className="ax-card__subtitle">40px rows — pack more on screen without losing legibility.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--accent"><code className="ax-mono" style={{ fontSize: 'var(--ax-text-2xs)' }}>--compact</code></span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--compact ax-table--hover">
              <caption className="ax-visually-hidden">Recent ledger entries</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Ref</th>
                  <th className="ax-table__th" scope="col">Counterparty</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ref: 'TXN-88301', cp: 'Camila Rossi', amt: '+$312.00', amtColor: 'var(--ax-viz-emerald)' },
                  { ref: 'TXN-88300', cp: 'Cloud hosting', amt: '−$1,200.00', amtColor: 'var(--ax-text)' },
                  { ref: 'TXN-88298', cp: 'Payroll — June', amt: '−$18,400.00', amtColor: 'var(--ax-text)' },
                  { ref: 'TXN-88297', cp: 'Erik Lindqvist', amt: '+$1,544.00', amtColor: 'var(--ax-viz-emerald)' },
                  { ref: 'TXN-88296', cp: 'Ad spend — Pulse', amt: '−$640.00', amtColor: 'var(--ax-text)' },
                  { ref: 'TXN-88295', cp: 'Sofia Marchetti', amt: '+$104.00', amtColor: 'var(--ax-viz-emerald)' },
                  { ref: 'TXN-88294', cp: 'Stripe payout', amt: '−$9,820.00', amtColor: 'var(--ax-text)' },
                ].map((r) => (
                  <tr key={r.ref} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-accent)' }}>{r.ref}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text)' }}>{r.cp}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: r.amtColor }}>{r.amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CONTEXTUAL ROWS */}
        <section className="ax-card ax-col--6" role="region" aria-label="Contextual rows table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Contextual Rows</h2>
              <p className="ax-card__subtitle">Semantic row tints to surface state at a glance.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--accent"><code className="ax-mono" style={{ fontSize: 'var(--ax-text-2xs)' }}>__row--success</code></span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table">
              <caption className="ax-visually-hidden">Recent orders by fulfilment state</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Order</th>
                  <th className="ax-table__th" scope="col">Customer</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rowMod: 'success', ord: '#10480', cust: 'Aisha Bello', total: '$80.00', tone: 'success', status: 'Delivered' },
                  { rowMod: '', ord: '#10482', cust: 'Camila Rossi', total: '$312.00', tone: 'accent', status: 'Shipped' },
                  { rowMod: 'warning', ord: '#10475', cust: 'Yuki Tanaka', total: '$225.00', tone: 'warning', status: 'Pending' },
                  { rowMod: 'danger', ord: '#10478', cust: 'Daniel Cho', total: '$24.00', tone: 'danger', status: 'Cancelled' },
                  { rowMod: '', ord: '#10477', cust: 'Olivia Penrose', total: '$200.00', tone: 'success', status: 'Delivered' },
                ].map((r) => (
                  <tr key={r.ord} className={`ax-table__row${r.rowMod ? ` ax-table__row--${r.rowMod}` : ''}`}>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{r.ord}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text)' }}>{r.cust}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>{r.total}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${r.tone}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* RESPONSIVE (with totals footer) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Responsive table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Behaviour</span>
              <h2 className="ax-card__title">Responsive &amp; Totals</h2>
              <p className="ax-card__subtitle">Wide tables scroll horizontally below the lg breakpoint; the footer carries the totals row.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-cluster ax-text-muted" style={{ gap: 'var(--ax-space-1)', fontSize: 'var(--ax-text-xs)' }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M5 12l4 4" /><path d="M5 12l4 -4" /><path d="M19 12l-4 4" /><path d="M19 12l-4 -4" /></svg>
                Scroll on small screens
              </span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 760 }}>
              <caption className="ax-visually-hidden">Order ledger with payment, fulfilment and totals</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Order</th>
                  <th className="ax-table__th" scope="col">Customer</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Items</th>
                  <th className="ax-table__th" scope="col">Payment</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ord: '#10482', cust: 'Camila Rossi', date: 'Jun 12', items: 4, payTone: 'success', pay: 'Paid', stTone: 'accent', st: 'Shipped', total: '$312.00' },
                  { ord: '#10479', cust: 'Erik Lindqvist', date: 'Jun 10', items: 9, payTone: 'success', pay: 'Paid', stTone: 'success', st: 'Delivered', total: '$1,544.00' },
                  { ord: '#10477', cust: 'Olivia Penrose', date: 'Jun 8', items: 5, payTone: 'success', pay: 'Paid', stTone: 'success', st: 'Delivered', total: '$200.00' },
                  { ord: '#10475', cust: 'Yuki Tanaka', date: 'Jun 5', items: 5, payTone: 'warning', pay: 'Unpaid', stTone: 'warning', st: 'Pending', total: '$225.00' },
                  { ord: '#10473', cust: 'Nadia Haddad', date: 'Jun 1', items: 3, payTone: 'danger', pay: 'Refunded', stTone: 'danger', st: 'Refunded', total: '$238.00' },
                ].map((r) => (
                  <tr key={r.ord} className="ax-table__row">
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-accent)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.ord}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>{r.cust}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td className="ax-table__td ax-table__td--num">{r.items}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${r.payTone}`}>{r.pay}</span></td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${r.stTone}`}>{r.st}</span></td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="ax-table__foot">
                <tr>
                  <td className="ax-table__td" colSpan={3} style={{ color: 'var(--ax-text-muted)' }}>5 orders · last 12 days</td>
                  <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>26</td>
                  <td className="ax-table__td" colSpan={2} />
                  <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)' }}>$2,519.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

export default Basic;
