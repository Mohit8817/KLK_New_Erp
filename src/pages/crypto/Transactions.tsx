/*
 * Vireo React — Crypto Transactions (route "crypto/transactions").
 *
 * Faithful re-expression of src/html/crypto/transactions.html: crypto pill
 * sub-nav, a 4-KPI summary strip, and the searchable/filterable transactions
 * table (type + status filters, active filter chips, copyable tx hash, empty
 * state, pagination). The Alpine x-data (axTxns) is ported to React state.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { CryptoSubNav } from './CryptoSubNav';

const ASSET_ICON: Record<string, ReactElement> = {
  btc: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6h8a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-8" /><path d="M8 6l0 12" /><path d="M8 12l6 0" /><path d="M9 3l0 3" /><path d="M13 3l0 3" /></svg>,
  eth: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 12l6 -9l6 9l-6 9l-6 -9" /><path d="M6 12l6 -3l6 3l-6 2l-6 -2" /></svg>,
  sol: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 18h12l4 -4h-12l-4 4" /><path d="M8 14l-4 -4h12l4 4" /><path d="M16 10l4 -4h-12l-4 4" /></svg>,
  gen: <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M9 9h6" /><path d="M9 15h6" /></svg>,
};
const TYPE_ICON: Record<string, ReactElement> = {
  Receive: <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M18 11l-6 6" /><path d="M6 11l6 6" /></svg>,
  Send: <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>,
  Buy: <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6 -6l4 4l8 -8" /><path d="M14 7l7 0l0 7" /></svg>,
  Sell: <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7l6 6l4 -4l8 8" /><path d="M14 17l7 0l0 -7" /></svg>,
  Stake: <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /></svg>,
};
const TYPE_CLASS: Record<string, string> = { Receive: 'ax-badge--success', Send: 'ax-badge--danger', Buy: 'ax-badge--info', Sell: 'ax-badge--warning', Stake: 'ax-badge--accent' };
const STATUS_CLASS: Record<string, string> = { Completed: 'ax-badge--success', Pending: 'ax-badge--warning', Failed: 'ax-badge--danger' };
const ASSET: Record<string, { name: string; color: string; icon: keyof typeof ASSET_ICON }> = {
  BTC: { name: 'Bitcoin', color: 'var(--ax-viz-amber)', icon: 'btc' },
  ETH: { name: 'Ethereum', color: 'var(--ax-viz-violet)', icon: 'eth' },
  SOL: { name: 'Solana', color: 'var(--ax-viz-emerald)', icon: 'sol' },
  AVAX: { name: 'Avalanche', color: 'var(--ax-viz-pink)', icon: 'gen' },
  USDT: { name: 'Tether', color: 'var(--ax-viz-cyan)', icon: 'gen' },
  ADA: { name: 'Cardano', color: 'var(--ax-viz-cyan)', icon: 'gen' },
};

interface Row { type: string; sym: string; amount: string; dir: number; price: string; value: string; fee: string; hash: string; date: string; status: string }
const ROWS: Row[] = [
  { type: 'Receive', sym: 'BTC', amount: '0.0240', dir: 1, price: '$67,840', value: '$1,628.16', fee: '$0.00', hash: '0x9af3c08b21d4e7c21', date: 'Jun 27 · 06:10', status: 'Completed' },
  { type: 'Send', sym: 'ETH', amount: '1.2000', dir: -1, price: '$3,512.00', value: '$4,214.40', fee: '$2.84', hash: '0x71b0e9aa5fd0c812', date: 'Jun 26 · 19:42', status: 'Completed' },
  { type: 'Buy', sym: 'SOL', amount: '12.500', dir: 1, price: '$184.20', value: '$2,302.50', fee: '$11.28', hash: '0x4cd9f1207ab63e90', date: 'Jun 26 · 11:08', status: 'Completed' },
  { type: 'Stake', sym: 'ETH', amount: '2.0000', dir: -1, price: '$3,512.00', value: '$7,024.00', fee: '$1.92', hash: '0x88e2b4c0f7a1d335', date: 'Jun 25 · 09:30', status: 'Pending' },
  { type: 'Sell', sym: 'AVAX', amount: '20.000', dir: -1, price: '$38.10', value: '$762.00', fee: '$3.74', hash: '0x2fa70d63e9b14c08', date: 'Jun 24 · 15:55', status: 'Completed' },
  { type: 'Receive', sym: 'USDT', amount: '1,500.00', dir: 1, price: '$1.00', value: '$1,500.00', fee: '$0.00', hash: '0xb19c4e07da25f661', date: 'Jun 23 · 08:02', status: 'Failed' },
  { type: 'Buy', sym: 'BTC', amount: '0.0500', dir: 1, price: '$66,420', value: '$3,321.00', fee: '$16.28', hash: '0x6e0f9b3c712a8d44', date: 'Jun 22 · 14:18', status: 'Completed' },
  { type: 'Send', sym: 'SOL', amount: '8.0000', dir: -1, price: '$181.40', value: '$1,451.20', fee: '$0.06', hash: '0xa3d71c90fe48b220', date: 'Jun 21 · 22:47', status: 'Completed' },
  { type: 'Receive', sym: 'ADA', amount: '4,200.00', dir: 1, price: '$0.4480', value: '$1,881.60', fee: '$0.00', hash: '0xc92f04ab6d137e50', date: 'Jun 20 · 10:33', status: 'Completed' },
  { type: 'Sell', sym: 'ETH', amount: '0.7500', dir: -1, price: '$3,480.00', value: '$2,610.00', fee: '$1.28', hash: '0x05ba7e2f9c4188d1', date: 'Jun 19 · 17:09', status: 'Pending' },
  { type: 'Stake', sym: 'SOL', amount: '30.000', dir: -1, price: '$179.80', value: '$5,394.00', fee: '$0.04', hash: '0x7d3e1f08c6a92b47', date: 'Jun 18 · 12:55', status: 'Completed' },
  { type: 'Buy', sym: 'AVAX', amount: '40.000', dir: 1, price: '$39.40', value: '$1,576.00', fee: '$7.72', hash: '0xe14a08bd2f603c99', date: 'Jun 17 · 09:01', status: 'Completed' },
];

export function Transactions() {
  const [q, setQ] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');

  const copy = (h: string) => { try { navigator.clipboard?.writeText(h); } catch { /* noop */ } };

  const filtered = useMemo(() => ROWS.filter((t) => {
    const m = (ASSET[t.sym].name + ' ' + t.sym + ' ' + t.hash).toLowerCase().includes(q.toLowerCase());
    return m && (!fType || t.type === fType) && (!fStatus || t.status === fStatus);
  }), [q, fType, fStatus]);

  const clearAll = () => { setQ(''); setFType(''); setFStatus(''); };

  return (
    <>
      <PageHead
        title="Transactions"
        subtitle="Every wallet movement — buys, sells, sends, receives and staking."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></svg>
              <span className="ax-btn__label">Last 30 days</span>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
              <span className="ax-btn__label">Export CSV</span>
            </button>
          </>
        }
      />

      <CryptoSubNav active="transactions" />

      {/* SUMMARY STRIP */}
      <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-6)' }}>
        <div className="ax-card ax-kpi ax-col--3" role="region" aria-label="Total transactions this month">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></svg></span>
              <span className="ax-kpi__delta ax-kpi__delta--up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>12</span>
            </div>
            <div className="ax-kpi__label">Transactions</div>
            <div className="ax-kpi__value ax-num">248</div>
          </div>
        </div>
        <div className="ax-card ax-kpi ax-col--3" role="region" aria-label="Total inflow">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M18 11l-6 6" /><path d="M6 11l6 6" /></svg></span>
              <span className="ax-kpi__delta ax-kpi__delta--up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>8.1%</span>
            </div>
            <div className="ax-kpi__label">Inflow</div>
            <div className="ax-kpi__value ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>+$42,180</div>
          </div>
        </div>
        <div className="ax-card ax-kpi ax-col--3" role="region" aria-label="Total outflow">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l0 -14" /><path d="M18 13l-6 -6" /><path d="M6 13l6 -6" /></svg></span>
              <span className="ax-kpi__delta ax-kpi__delta--down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>3.4%</span>
            </div>
            <div className="ax-kpi__label">Outflow</div>
            <div className="ax-kpi__value ax-num">−$28,640</div>
          </div>
        </div>
        <div className="ax-card ax-kpi ax-col--3" role="region" aria-label="Total fees paid">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3" /><path d="M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4" /><path d="M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0s3 -1.526 3 -2.598s-1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0s-3 1.526 -3 2.598" /><path d="M3 6v10c0 .888 .772 1.45 2 2" /></svg></span>
            </div>
            <div className="ax-kpi__label">Fees Paid</div>
            <div className="ax-kpi__value ax-num">$214.80</div>
          </div>
        </div>
      </div>

      {/* TX TABLE */}
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Transactions table">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">All Transactions</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}><span>{filtered.length}</span> of <span>{ROWS.length}</span> shown</p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 260 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                <input type="search" className="ax-input ax-input--sm" placeholder="Search asset or hash…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search transactions" style={{ paddingInlineStart: 34 }} />
              </div>
              <select className="ax-select ax-select--sm" value={fType} onChange={(e) => setFType(e.target.value)} aria-label="Filter by type" style={{ minWidth: 130 }}>
                <option value="">All types</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
                <option value="Send">Send</option>
                <option value="Receive">Receive</option>
                <option value="Stake">Stake</option>
              </select>
              <select className="ax-select ax-select--sm" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by status" style={{ minWidth: 140 }}>
                <option value="">All statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {(fType || fStatus || q) && (
            <div className="ax-card__body" style={{ paddingBlock: 0 }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', paddingBlock: 'var(--ax-space-3)' }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Filters:</span>
                {q && <button type="button" className="ax-badge ax-badge--soft ax-badge--pill" onClick={() => setQ('')} style={{ cursor: 'pointer', border: 0 }}>“<span>{q}</span>” ✕</button>}
                {fType && <button type="button" className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" onClick={() => setFType('')} style={{ cursor: 'pointer', border: 0 }}><span>{fType}</span> ✕</button>}
                {fStatus && <button type="button" className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" onClick={() => setFStatus('')} style={{ cursor: 'pointer', border: 0 }}><span>{fStatus}</span> ✕</button>}
                <button type="button" className="ax-btn ax-btn--link ax-btn--sm" onClick={clearAll}>Clear all</button>
              </div>
            </div>
          )}

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Type</th>
                  <th className="ax-table__th" scope="col">Asset</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Amount</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Price</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Value</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Fee</th>
                  <th className="ax-table__th" scope="col">Tx Hash</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const a = ASSET[t.sym];
                  return (
                    <tr key={t.hash} className="ax-table__row">
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--pill ${TYPE_CLASS[t.type]}`}>{TYPE_ICON[t.type]}<span>{t.type}</span></span>
                      </td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                          <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${a.color} 18%,transparent)`, color: a.color }}>{ASSET_ICON[a.icon]}</span>
                          <div><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{a.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{t.sym}</div></div>
                        </div>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: t.dir > 0 ? 'var(--ax-viz-emerald)' : 'var(--ax-text)' }}>{(t.dir > 0 ? '+' : '−') + t.amount}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{t.price}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{t.value}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-subtle)' }}>{t.fee}</td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-1)', flexWrap: 'nowrap' }}>
                          <code className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{t.hash.slice(0, 6) + '…' + t.hash.slice(-4)}</code>
                          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label={'Copy hash ' + t.hash} onClick={() => copy(t.hash)}>
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                          </button>
                        </div>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)', whiteSpace: 'nowrap' }}>{t.date}</td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--pill ${STATUS_CLASS[t.status]}`}><span className="ax-badge__dot" /><span>{t.status}</span></span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={9} style={{ textAlign: 'center', paddingBlock: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>
                      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-text-subtle)', marginBottom: 'var(--ax-space-3)' }}><path d="M3 10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M3 10l9 6l9 -6" /></svg>
                      <p style={{ margin: 0 }}>No transactions match these filters.</p>
                      <button type="button" className="ax-btn ax-btn--link" onClick={clearAll}>Clear filters</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>Showing <span>{filtered.length}</span> of 248 transactions</span>
            <nav className="ax-pagination" aria-label="Pagination">
              <button type="button" className="ax-pagination__prev" disabled aria-disabled="true" aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
              <ul className="ax-pagination__pages">
                <li><a href="#" className="ax-pagination__page is-active" aria-current="page">1</a></li>
                <li><a href="#" className="ax-pagination__page">2</a></li>
                <li><a href="#" className="ax-pagination__page">3</a></li>
                <li><span className="ax-pagination__ellipsis">…</span></li>
                <li><a href="#" className="ax-pagination__page">21</a></li>
              </ul>
              <button type="button" className="ax-pagination__next" aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
            </nav>
          </div>
        </section>
      </div>
    </>
  );
}

export default Transactions;
