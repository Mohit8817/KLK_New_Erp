/*
 * Vireo React — Ecommerce / Invoices (route "ecommerce/invoices").
 *
 * Faithful re-expression of src/html/ecommerce/invoices.html: a KPI strip,
 * status sub-tabs, a search/client/sort toolbar, bulk-select bar, and a
 * searchable/sortable invoice table with status pills, an overdue-days hint, a
 * computed totals footer row, empty state and pagination. The Alpine x-data
 * (axInvoices) is ported to React state; classes + ARIA match the reference 1:1.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const C = { cyan: 'var(--ax-viz-cyan)', violet: 'var(--ax-viz-violet)', pink: 'var(--ax-viz-pink)', amber: 'var(--ax-viz-amber)', emerald: 'var(--ax-viz-emerald)', red: 'var(--ax-viz-red)', accent: 'var(--ax-accent)' };
const money = (n: number) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Invoice { id: number; number: string; client: string; email: string; initials: string; issued: string; due: string; amount: number; status: string; overdueDays: number; color: string; }

const STATUS_TABS = [
  { id: '', label: 'All', count: 94 },
  { id: 'paid', label: 'Paid', count: 71 },
  { id: 'unpaid', label: 'Unpaid', count: 11 },
  { id: 'overdue', label: 'Overdue', count: 7 },
  { id: 'draft', label: 'Draft', count: 5 },
];

const INVOICES: Invoice[] = [
  { id: 1, number: '#INV-2026-0142', client: 'Rossi Atelier Ltda.', email: 'finance@rossiatelier.com', initials: 'RA', issued: 'Jun 24, 2026', due: 'Jul 08, 2026', amount: 4820.0, status: 'unpaid', overdueDays: 0, color: C.cyan },
  { id: 2, number: '#INV-2026-0141', client: 'Northwind Furniture', email: 'ap@northwind.co', initials: 'NF', issued: 'Jun 22, 2026', due: 'Jul 06, 2026', amount: 12640.0, status: 'paid', overdueDays: 0, color: C.violet },
  { id: 3, number: '#INV-2026-0140', client: 'Clayhouse Ceramics', email: 'billing@clayhouse.io', initials: 'CC', issued: 'Jun 18, 2026', due: 'Jun 25, 2026', amount: 3180.0, status: 'overdue', overdueDays: 3, color: C.pink },
  { id: 4, number: '#INV-2026-0139', client: 'Voltic Supply Co.', email: 'accounts@voltic.co', initials: 'VS', issued: 'Jun 15, 2026', due: 'Jun 29, 2026', amount: 7420.0, status: 'paid', overdueDays: 0, color: C.amber },
  { id: 5, number: '#INV-2026-0138', client: 'Paperleaf Goods', email: 'hello@paperleaf.com', initials: 'PG', issued: 'Jun 12, 2026', due: 'Jun 19, 2026', amount: 2340.0, status: 'overdue', overdueDays: 9, color: C.emerald },
  { id: 6, number: '#INV-2026-0137', client: 'Brassworks Atelier', email: 'pay@brassworks.studio', initials: 'BA', issued: 'Jun 10, 2026', due: 'Jun 24, 2026', amount: 5610.0, status: 'paid', overdueDays: 0, color: C.cyan },
  { id: 7, number: '#INV-2026-0136', client: 'Inkwell Press', email: 'finance@inkwell.press', initials: 'IP', issued: 'Jun 08, 2026', due: 'Jul 22, 2026', amount: 1890.0, status: 'paid', overdueDays: 0, color: C.red },
  { id: 8, number: '#INV-2026-0135', client: 'Slate & Pine', email: 'orders@slateandpine.com', initials: 'SP', issued: 'Jun 05, 2026', due: '—', amount: 3270.0, status: 'draft', overdueDays: 0, color: C.violet },
  { id: 9, number: '#INV-2026-0134', client: 'Tundra Outdoors', email: 'billing@tundra.io', initials: 'TO', issued: 'Jun 02, 2026', due: 'Jun 16, 2026', amount: 9840.0, status: 'overdue', overdueDays: 12, color: C.amber },
  { id: 10, number: '#INV-2026-0133', client: 'Lumière Studio', email: 'compta@lumiere.fr', initials: 'LS', issued: 'May 28, 2026', due: 'Jun 11, 2026', amount: 6120.0, status: 'paid', overdueDays: 0, color: C.accent },
  { id: 11, number: '#INV-2026-0132', client: 'Driftwood Decor', email: 'ar@driftwood.shop', initials: 'DD', issued: 'May 24, 2026', due: 'Jun 07, 2026', amount: 2880.0, status: 'unpaid', overdueDays: 0, color: C.pink },
  { id: 12, number: '#INV-2026-0131', client: 'Copperline Mugs', email: 'accounts@copperline.co', initials: 'CM', issued: 'May 20, 2026', due: '—', amount: 1450.0, status: 'draft', overdueDays: 0, color: C.emerald },
];

const STATUS_MAP: Record<string, [string, string, ReactElement]> = {
  paid: ['ax-badge--success', 'Paid', <><path d="M9 12l2 2l4 -4" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></>],
  unpaid: ['ax-badge--info', 'Unpaid', <><path d="M12 7v5l3 3" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></>],
  overdue: ['ax-badge--danger', 'Overdue', <><path d="M12 9v4" /><path d="M12 16h.01" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /></>],
  draft: ['ax-badge--neutral', 'Draft', <><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3z" /></>],
};
function StatusPill({ status }: { status: string }) {
  const m = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span className={`ax-badge ax-badge--soft ${m[0]} ax-badge--pill`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 13, height: 13 }}>{m[2]}</svg>{m[1]}
    </span>
  );
}

const KPIS = [
  { region: 'Outstanding $42,180', icon: 'c1', up: false, delta: '5.4%', label: 'Outstanding', value: '$42,180', valueStyle: undefined as React.CSSProperties | undefined, glyph: <><path d="M12 7v5l3 3" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></> },
  { region: 'Overdue $18,240', icon: 'c4', up: true, delta: '2 inv', label: 'Overdue', value: '$18,240', valueStyle: { color: 'var(--ax-danger-500)' } as React.CSSProperties, glyph: <><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></> },
  { region: 'Paid in last 30 days $128,940, up 9.1%', icon: 'c2', up: true, delta: '9.1%', label: 'Paid · 30 days', value: '$128,940', valueStyle: undefined, glyph: <><path d="M9 12l2 2l4 -4" /><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /></> },
];

export function Invoices() {
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fClient, setFClient] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<number[]>([]);

  const clientNames = useMemo(() => [...new Set(INVOICES.map((i) => i.client))].sort(), []);

  const filtered = useMemo(() => {
    let r = INVOICES.filter((iv) => {
      const term = q.trim().toLowerCase();
      if (term && !(iv.number.toLowerCase().includes(term) || iv.client.toLowerCase().includes(term) || iv.email.toLowerCase().includes(term))) return false;
      if (fStatus && iv.status !== fStatus) return false;
      if (fClient && iv.client !== fClient) return false;
      return true;
    });
    const by: Record<string, (a: Invoice, b: Invoice) => number> = {
      'amount-asc': (a, b) => a.amount - b.amount,
      'amount-desc': (a, b) => b.amount - a.amount,
      client: (a, b) => a.client.localeCompare(b.client),
      status: (a, b) => a.status.localeCompare(b.status),
      due: (a, b) => b.overdueDays - a.overdueDays,
      newest: (a, b) => a.id - b.id,
    };
    if (by[sort]) r = [...r].sort(by[sort]);
    return r;
  }, [q, fStatus, fClient, sort]);

  const sumAll = () => filtered.reduce((t, i) => t + i.amount, 0);
  const sumByStatus = (st: string) => filtered.filter((i) => i.status === st).reduce((t, i) => t + i.amount, 0);
  const outstanding = () => filtered.filter((i) => i.status === 'unpaid' || i.status === 'overdue').reduce((t, i) => t + i.amount, 0);
  const allSelected = () => { const ids = filtered.map((i) => i.id); return ids.length > 0 && ids.every((id) => selected.includes(id)); };
  const toggleAll = (on: boolean) => setSelected(on ? filtered.map((i) => i.id) : []);
  const toggleSel = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHead
        title="Invoices"
        subtitle={
          (<><span className="ax-num">94</span> invoices this quarter — <span className="ax-num">7</span> overdue totalling <span className="ax-num">$18,240.00</span>.</>) as unknown as string
        }
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
              <span className="ax-btn__label">Export</span>
            </button>
            <Link className="ax-btn ax-btn--primary" to="/ecommerce/create-invoice">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Create invoice</span>
            </Link>
          </>
        }
      />

      <div className="ax-dash-grid">
        {KPIS.map((k) => (
          <div key={k.label} className="ax-card ax-kpi ax-col--3" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.icon}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{k.glyph}</svg></span>
                <span className={`ax-kpi__delta ax-kpi__delta--${k.up ? 'up' : 'down'}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={k.up ? 'M6 15l6 -6l6 6' : 'M6 9l6 6l6 -6'} /></svg>{k.delta}</span>
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__value ax-num" style={k.valueStyle}>{k.value}</div>
            </div>
          </div>
        ))}
        {/* Drafts KPI — no delta */}
        <div className="ax-card ax-kpi ax-col--3" role="region" aria-label="Drafts 5">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-kpi__icon ax-kpi__icon--c3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3z" /><path d="M16 5l3 3" /></svg></span>
            </div>
            <div className="ax-kpi__label">Drafts</div>
            <div className="ax-kpi__value ax-num">5</div>
          </div>
        </div>

        <section className="ax-card ax-col--12" role="region" aria-label="Invoice list">
          <div className="ax-card__header" style={{ paddingBottom: 0, border: 0 }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-1)', flexWrap: 'wrap' }}>
              {STATUS_TABS.map((t) => (
                <button key={t.id} type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setFStatus(t.id)} style={fStatus === t.id ? { boxShadow: 'inset 0 -2px 0 var(--ax-accent)', color: 'var(--ax-accent)', borderRadius: 0 } : { borderRadius: 0 }}>
                  <span>{t.label}</span>
                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm ax-num" style={{ marginInlineStart: 6 }}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input type="search" className="ax-input" placeholder="Search invoice # or client…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingInlineStart: 36 }} aria-label="Search invoices" />
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></svg>
                <span className="ax-btn__label">This quarter</span>
              </button>
              <select className="ax-select ax-select--sm" value={fClient} onChange={(e) => setFClient(e.target.value)} aria-label="Filter by client" style={{ minWidth: 150 }}>
                <option value="">All clients</option>
                {clientNames.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select className="ax-select ax-select--sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort invoices" style={{ minWidth: 140 }}>
                <option value="newest">Newest</option>
                <option value="due">Due date</option>
                <option value="amount-desc">Amount: High</option>
                <option value="amount-asc">Amount: Low</option>
                <option value="client">Client</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {!!selected.length && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', margin: 'var(--ax-space-4) var(--ax-space-5) 0', padding: 'var(--ax-space-2) var(--ax-space-4)', background: 'var(--ax-accent-wash)', border: '1px solid var(--ax-accent)', borderRadius: 'var(--ax-radius-md)', flexWrap: 'wrap' }}>
              <b className="ax-num" style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-sm)' }}><span>{selected.length}</span> selected</b>
              <span style={{ width: 1, height: 18, background: 'var(--ax-border-strong)' }} />
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">Mark paid</button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">Send</button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">Download</button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: 'var(--ax-danger-500)' }}>Delete</button>
              <span style={{ flex: '1 1 auto' }} />
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Clear selection" onClick={() => setSelected([])}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
            </div>
          )}

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 38 }}><input type="checkbox" className="ax-checkbox" aria-label="Select all" checked={allSelected()} onChange={(e) => toggleAll(e.target.checked)} /></th>
                  <th className="ax-table__th" scope="col">Invoice</th>
                  <th className="ax-table__th" scope="col">Client</th>
                  <th className="ax-table__th" scope="col">Issued</th>
                  <th className="ax-table__th" scope="col">Due</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Amount</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col" style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((iv) => (
                  <tr key={iv.id} className="ax-table__row" style={selected.includes(iv.id) ? { background: 'var(--ax-accent-wash)' } : undefined}>
                    <td className="ax-table__td"><input type="checkbox" className="ax-checkbox" checked={selected.includes(iv.id)} onChange={() => toggleSel(iv.id)} aria-label={'Select ' + iv.number} /></td>
                    <td className="ax-table__td"><Link to="/ecommerce/invoice-details" className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-accent)', fontWeight: 'var(--ax-weight-semibold)', textDecoration: 'none' }}>{iv.number}</Link></td>
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                        <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${iv.color} 18%,transparent)`, color: iv.color }}><span className="ax-avatar__initials">{iv.initials}</span></span>
                        <div style={{ minWidth: 0 }}><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{iv.client}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{iv.email}</div></div>
                      </div>
                    </td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{iv.issued}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', ...(iv.status === 'overdue' ? { color: 'var(--ax-danger-500)', fontWeight: 'var(--ax-weight-medium)' } : { color: 'var(--ax-text-muted)' }) }}>
                      <span>{iv.due}</span>
                      {iv.status === 'overdue' && <span style={{ fontSize: 'var(--ax-text-2xs)', display: 'block' }}>{iv.overdueDays + 'd overdue'}</span>}
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{money(iv.amount)}</td>
                    <td className="ax-table__td"><StatusPill status={iv.status} /></td>
                    <td className="ax-table__td">
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label={'Actions for ' + iv.number}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)' }}>
                  <td className="ax-table__td" colSpan={4} style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>Totals · <span className="ax-num">{filtered.length}</span> shown</td>
                  <td className="ax-table__td" style={{ textAlign: 'right' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--sm" style={{ borderRadius: 'var(--ax-radius-xs)' }}>Paid <span className="ax-num">{money(sumByStatus('paid'))}</span></span>
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{money(sumAll())}</td>
                  <td className="ax-table__td" colSpan={2} style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Outstanding </span><span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-danger-500)', fontWeight: 'var(--ax-weight-semibold)' }}>{money(outstanding())}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 28, height: 28 }}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></svg></span>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No invoices here</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>Try a different status tab or clear your search.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setFStatus(''); setFClient(''); }}>Show all invoices</button>
            </div>
          )}

          {!!filtered.length && (
            <div className="ax-card__footer ax-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>Showing <span>{filtered.length}</span> of 94 invoices</span>
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled aria-disabled="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                <ul className="ax-pagination__pages">
                  <li><a href="#" className="ax-pagination__page is-active" aria-current="page">1</a></li>
                  <li><a href="#" className="ax-pagination__page">2</a></li>
                  <li><a href="#" className="ax-pagination__page">3</a></li>
                  <li><span className="ax-pagination__ellipsis">…</span></li>
                  <li><a href="#" className="ax-pagination__page">8</a></li>
                </ul>
                <button type="button" className="ax-pagination__next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
              </nav>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Invoices;
