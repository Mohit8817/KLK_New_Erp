/*
 * Vireo React — Data Table (tables/data-tables).
 *
 * Faithful re-expression of src/html/tables/data-tables.html. The reference
 * Alpine `axDataTable()` (global search, segment filter, column visibility,
 * sortable headers, row selection + bulk bar, per-page paging) is re-built
 * natively with React state + useClickOutside for the columns menu. DOM
 * classes/markup/ARIA match the reference 1:1.
 */
import { useMemo, useRef, useState } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { useClickOutside } from '../../hooks/useClickOutside';

interface Row {
  id: string; name: string; initials: string; email: string; segment: string;
  orders: number; ltv: number; location: string; lastOrder: string; lastDays: number; c: string;
}
const C = { cyan: 'var(--ax-viz-cyan)', violet: 'var(--ax-viz-violet)', pink: 'var(--ax-viz-pink)', amber: 'var(--ax-viz-amber)', emerald: 'var(--ax-viz-emerald)', red: 'var(--ax-viz-red)' };

const ROWS: Row[] = [
  { id: 'cus_001', name: 'Camila Rossi', initials: 'CR', email: 'camila.rossi@mailbox.test', segment: 'VIP', orders: 18, ltv: 6180, location: 'Lisbon', lastOrder: '3h ago', lastDays: 0, c: C.cyan },
  { id: 'cus_007', name: 'Olivia Penrose', initials: 'OP', email: 'o.penrose@meadowmail.test', segment: 'VIP', orders: 21, ltv: 5980, location: 'Bristol', lastOrder: '12h ago', lastDays: 0, c: C.violet },
  { id: 'cus_004', name: 'Erik Lindqvist', initials: 'EL', email: 'erik.l@ridgeline.test', segment: 'Wholesale', orders: 24, ltv: 5240, location: 'Malmö', lastOrder: '2d ago', lastDays: 2, c: C.amber },
  { id: 'cus_012', name: 'Nadia Haddad', initials: 'NH', email: 'nadia.h@harbor.test', segment: 'VIP', orders: 16, ltv: 4720, location: 'Marseille', lastOrder: '6h ago', lastDays: 0, c: C.pink },
  { id: 'cus_011', name: 'Yuki Tanaka', initials: 'YT', email: 'yuki.tanaka@brightmail.test', segment: 'Returning', orders: 11, ltv: 2870, location: 'Osaka', lastOrder: '10h ago', lastDays: 0, c: C.emerald },
  { id: 'cus_005', name: 'Sofia Marchetti', initials: 'SM', email: 'sofia.m@harbor.test', segment: 'Returning', orders: 9, ltv: 2110, location: 'Milan', lastOrder: '1d ago', lastDays: 1, c: C.cyan },
  { id: 'cus_002', name: 'Henry Whitlock', initials: 'HW', email: 'h.whitlock@postoak.test', segment: 'Returning', orders: 7, ltv: 1840, location: 'Leeds', lastOrder: '5h ago', lastDays: 0, c: C.violet },
  { id: 'cus_008', name: 'Rahul Menon', initials: 'RM', email: 'rahul.menon@northstreet.test', segment: 'Returning', orders: 6, ltv: 1490, location: 'Pune', lastOrder: '1d ago', lastDays: 1, c: C.amber },
  { id: 'cus_009', name: 'Greta Hoffmann', initials: 'GH', email: 'greta.h@postoak.test', segment: 'Churn-risk', orders: 4, ltv: 640, location: 'Hamburg', lastOrder: '30d ago', lastDays: 30, c: C.red },
  { id: 'cus_010', name: 'Mateo Alvarez', initials: 'MA', email: 'mateo.a@mailbox.test', segment: 'New', orders: 2, ltv: 210, location: 'Bogotá', lastOrder: '2d ago', lastDays: 2, c: C.pink },
  { id: 'cus_003', name: 'Aisha Bello', initials: 'AB', email: 'aisha.bello@brightmail.test', segment: 'New', orders: 1, ltv: 80, location: 'Lagos', lastOrder: '1d ago', lastDays: 1, c: C.emerald },
  { id: 'cus_006', name: 'Daniel Cho', initials: 'DC', email: 'd.cho@clearbox.test', segment: 'New', orders: 1, ltv: 24, location: 'Seoul', lastOrder: '3d ago', lastDays: 3, c: C.cyan },
];

const money = (v: number) => '$' + v.toLocaleString('en-US');
const segClass = (s: string) => (({ VIP: 'ax-badge--accent', Wholesale: 'ax-badge--info', Returning: 'ax-badge--neutral', New: 'ax-badge--success', 'Churn-risk': 'ax-badge--danger' } as Record<string, string>)[s] || 'ax-badge--neutral');

const SORT_DEFAULT = (<svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>);
const SORT_ASC = (<svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>);
const SORT_DESC = (<svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>);

type SortKey = 'name' | 'segment' | 'orders' | 'ltv' | 'lastDays';
const TOGGLE_COLS = [
  { id: 'email', label: 'Email' },
  { id: 'segment', label: 'Segment' },
  { id: 'location', label: 'Location' },
  { id: 'lastOrder', label: 'Last order' },
];

export function DataTables() {
  const [q, setQ] = useState('');
  const [fSegment, setFSegment] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('ltv');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [colMenu, setColMenu] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({ email: true, segment: true, location: true, lastOrder: true });
  const colMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(colMenuRef, colMenu, () => setColMenu(false));

  const col = (id: string) => visible[id] ?? true;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = ROWS.filter((x) => {
      if (fSegment && x.segment !== fSegment) return false;
      if (term && !(x.name.toLowerCase().includes(term) || x.email.toLowerCase().includes(term) || x.location.toLowerCase().includes(term))) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    r = [...r].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return r;
  }, [q, fSegment, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);
  const rangeStart = filtered.length ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * perPage, filtered.length);

  const pageList: (number | '…')[] = useMemo(() => {
    const tp = totalPages, p = curPage, out: (number | '…')[] = [];
    if (tp <= 7) { for (let i = 1; i <= tp; i++) out.push(i); return out; }
    out.push(1);
    if (p > 3) out.push('…');
    for (let i = Math.max(2, p - 1); i <= Math.min(tp - 1, p + 1); i++) out.push(i);
    if (p < tp - 2) out.push('…');
    out.push(tp);
    return out;
  }, [totalPages, curPage]);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };
  const ariaSort = (k: SortKey): 'ascending' | 'descending' | 'none' => (sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
  const sortGlyph = (k: SortKey) => (sortKey !== k ? SORT_DEFAULT : sortDir === 'asc' ? SORT_ASC : SORT_DESC);

  const pageIds = paged.map((r) => r.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someSelected = pageIds.filter((id) => selected.includes(id)).length > 0 && !allSelected;
  const toggleAll = (on: boolean) => {
    if (on) setSelected((s) => [...new Set([...s, ...pageIds])]);
    else setSelected((s) => s.filter((id) => !pageIds.includes(id)));
  };

  return (
    <>
      <PageHead
        title="Data Table"
        subtitle="A full-feature table — global search, sortable headers, per-page paging, row selection & bulk actions — all client-side."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
              <span className="ax-btn__label">Export</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Add customer</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Customers data table">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Customers</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{filtered.length} of {ROWS.length} records</p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                <input type="search" className="ax-input ax-input--sm" placeholder="Search name, email, location…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ paddingInlineStart: 34, paddingInlineEnd: 30 }} aria-label="Search customers" />
                {q && <button type="button" onClick={() => { setQ(''); setPage(1); }} aria-label="Clear search" style={{ position: 'absolute', insetInlineEnd: 8, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', color: 'var(--ax-text-subtle)', background: 'none', border: 0, cursor: 'pointer' }}><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>}
              </div>
              <select className="ax-select ax-select--sm" value={fSegment} onChange={(e) => { setFSegment(e.target.value); setPage(1); }} aria-label="Filter by segment" style={{ minWidth: 140 }}>
                <option value="">All segments</option>
                <option value="VIP">VIP</option>
                <option value="Returning">Returning</option>
                <option value="New">New</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Churn-risk">Churn-risk</option>
              </select>
              <div style={{ position: 'relative' }} ref={colMenuRef}>
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setColMenu((v) => !v)} aria-expanded={colMenu} aria-label="Toggle column visibility">
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h6v16h-6z" /><path d="M14 4h6v16h-6z" /></svg>
                  <span className="ax-btn__label">Columns</span>
                </button>
                {colMenu && (
                  <div className="ax-dropdown" role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', zIndex: 30, minWidth: 190, padding: 'var(--ax-space-2)' }}>
                    {TOGGLE_COLS.map((c2) => (
                      <label key={c2.id} className="ax-menu__item" style={{ cursor: 'pointer', gap: 'var(--ax-space-2)' }}>
                        <input type="checkbox" className="ax-checkbox" checked={col(c2.id)} onChange={(e) => setVisible((v) => ({ ...v, [c2.id]: e.target.checked }))} />
                        <span>{c2.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', margin: '0 var(--ax-space-5) var(--ax-space-3)', padding: 'var(--ax-space-2) var(--ax-space-4)', background: 'var(--ax-accent-wash)', border: '1px solid var(--ax-accent)', borderRadius: 'var(--ax-radius-md)', flexWrap: 'wrap' }}>
              <b className="ax-num" style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-sm)' }}>{selected.length} selected</b>
              <span style={{ width: 1, height: 18, background: 'var(--ax-border-strong)' }} />
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /><path d="M15 7l5 0" /></svg>
                <span className="ax-btn__label">Email</span>
              </button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.859 6h-2.834a2.025 2.025 0 0 0 -2.025 2.025v9.95a2.025 2.025 0 0 0 2.025 2.025h9.95a2.025 2.025 0 0 0 2.025 -2.025v-2.834" /><path d="M17.999 4.999a3 3 0 0 1 0 4l-7.5 7.5l-4 1l1 -4l7.5 -7.5a3 3 0 0 1 4 0" /></svg>
                <span className="ax-btn__label">Tag</span>
              </button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">Export</button>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: 'var(--ax-danger-500)' }}>Delete</button>
              <span style={{ flex: '1 1 auto' }} />
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Clear selection" onClick={() => setSelected([])}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
            </div>
          )}

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 780 }}>
              <caption className="ax-visually-hidden">Customers, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 38 }}><input type="checkbox" className="ax-checkbox" aria-label="Select all rows on this page" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={(e) => toggleAll(e.target.checked)} /></th>
                  <th className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort('name')} onClick={() => sortBy('name')}>Customer {sortGlyph('name')}</th>
                  {col('email') && <th className="ax-table__th" scope="col">Email</th>}
                  {col('segment') && <th className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort('segment')} onClick={() => sortBy('segment')}>Segment {sortGlyph('segment')}</th>}
                  {col('location') && <th className="ax-table__th" scope="col">Location</th>}
                  <th className="ax-table__th ax-table__th--sortable ax-table__th--num" scope="col" aria-sort={ariaSort('orders')} onClick={() => sortBy('orders')}>Orders {sortGlyph('orders')}</th>
                  <th className="ax-table__th ax-table__th--sortable ax-table__th--num" scope="col" aria-sort={ariaSort('ltv')} onClick={() => sortBy('ltv')}>Lifetime {sortGlyph('ltv')}</th>
                  {col('lastOrder') && <th className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort('lastDays')} onClick={() => sortBy('lastDays')}>Last order {sortGlyph('lastDays')}</th>}
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.id} className="ax-table__row" style={selected.includes(r.id) ? { background: 'var(--ax-accent-wash)' } : undefined}>
                    <td className="ax-table__td"><input type="checkbox" className="ax-checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((id) => id !== r.id)))} aria-label={`Select ${r.name}`} /></td>
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                        <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${r.c} 18%,var(--ax-surface-solid))`, color: r.c }}><span className="ax-avatar__initials">{r.initials}</span></span>
                        <div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.name}</div>
                      </div>
                    </td>
                    {col('email') && <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{r.email}</td>}
                    {col('segment') && <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ${segClass(r.segment)}`}>{r.segment}</span></td>}
                    {col('location') && <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{r.location}</td>}
                    <td className="ax-table__td ax-table__td--num">{r.orders}</td>
                    <td className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{money(r.ltv)}</td>
                    {col('lastOrder') && <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{r.lastOrder}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 28, height: 28 }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg></span>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No matches</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>No customers match your filters. Try widening them.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setFSegment(''); setPage(1); }}>Clear all</button>
            </div>
          )}

          {!!filtered.length && (
            <div className="ax-card__footer ax-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>
                  Showing {rangeStart}–{rangeEnd} of {filtered.length}
                </span>
                <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Rows
                  <select className="ax-select ax-select--sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page" style={{ minWidth: 72 }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(Math.max(1, curPage - 1))} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p, i) => (
                    <li key={`${p}-${i}`}>
                      {p === '…' ? <span className="ax-pagination__ellipsis">…</span> : <button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} onClick={() => setPage(p)}>{p}</button>}
                    </li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(Math.min(totalPages, curPage + 1))} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
              </nav>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default DataTables;
