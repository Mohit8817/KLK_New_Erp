/*
 * Vireo React — UI · Sortable.
 * Faithful re-expression of src/html/ui/sortable.html: a reorderable task list
 * (drag handle + arrow-key reordering), a two-column kanban-lite (drag cards
 * between lists), and a reorderable image grid. The Alpine axSortable/axBoards
 * components are ported to React state + the native HTML drag-and-drop events.
 * DOM/classes/ARIA 1:1.
 */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const grip = (size: number) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
);

interface Task { id: number; title: string; meta: string; tone: string; }
const TASKS: Task[] = [
  { id: 1, title: 'Connect a data source', meta: 'Setup · due today', tone: 'var(--ax-viz-cyan)' },
  { id: 2, title: 'Invite the design team', meta: 'People · 3 pending', tone: 'var(--ax-viz-violet)' },
  { id: 3, title: 'Publish the weekly report', meta: 'Reports · draft', tone: 'var(--ax-viz-emerald)' },
  { id: 4, title: 'Review churn-risk accounts', meta: 'CRM · 4 flagged', tone: 'var(--ax-viz-amber)' },
  { id: 5, title: 'Approve June payroll', meta: 'Finance · $18.4K', tone: 'var(--ax-viz-pink)' },
];

interface Tile { id: number; n: string; m: string; c1: string; c2: string; }
const TILES: Tile[] = [
  { id: 1, n: 'Aperture Desk Lamp', m: 'Lighting', c1: 'var(--ax-viz-amber)', c2: 'var(--ax-viz-pink)' },
  { id: 2, n: 'Walnut Monitor Riser', m: 'Desk', c1: 'var(--ax-viz-emerald)', c2: 'var(--ax-viz-cyan)' },
  { id: 3, n: 'Matte Ceramic Mug', m: 'Drinkware', c1: 'var(--ax-viz-violet)', c2: 'var(--ax-viz-cyan)' },
  { id: 4, n: 'Brass Task Light', m: 'Lighting', c1: 'var(--ax-viz-cyan)', c2: 'var(--ax-viz-violet)' },
  { id: 5, n: 'Grid Notebook A5', m: 'Stationery', c1: 'var(--ax-viz-pink)', c2: 'var(--ax-viz-amber)' },
  { id: 6, n: 'Stoneware Carafe', m: 'Drinkware', c1: 'var(--ax-viz-emerald)', c2: 'var(--ax-viz-amber)' },
  { id: 7, n: 'Oak Pen Tray', m: 'Decor', c1: 'var(--ax-viz-violet)', c2: 'var(--ax-viz-pink)' },
  { id: 8, n: 'Felt Laptop Sleeve', m: 'Tech', c1: 'var(--ax-viz-cyan)', c2: 'var(--ax-viz-emerald)' },
];

/** axSortable: a single reorderable list/grid with drag + keyboard move + reset. */
function useSortable<T extends { id: number }>(initial: T[]) {
  const original = useRef(initial);
  const [items, setItems] = useState<T[]>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const onDragStart = (idx: number, e: React.DragEvent) => {
    setDragIndex(idx);
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(idx)); } catch { /* noop */ } }
  };
  const onDragOver = (idx: number) => setOverIndex(idx);
  const onDragEnd = () => { setDragIndex(null); setOverIndex(null); };
  const onDrop = (idx: number) => {
    setItems((cur) => {
      if (dragIndex === null || dragIndex === idx) return cur;
      const next = cur.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    onDragEnd();
  };
  const focusAt = (i: number) => {
    const els = rootRef.current?.querySelectorAll<HTMLElement>('[draggable="true"]');
    els?.[i]?.focus();
  };
  const moveUp = (idx: number) => { if (idx > 0) { setItems((c) => { const n = c.slice(); const [m] = n.splice(idx, 1); n.splice(idx - 1, 0, m); return n; }); requestAnimationFrame(() => focusAt(idx - 1)); } };
  const moveDown = (idx: number) => { setItems((c) => { if (idx >= c.length - 1) return c; const n = c.slice(); const [m] = n.splice(idx, 1); n.splice(idx + 1, 0, m); return n; }); if (idx < items.length - 1) requestAnimationFrame(() => focusAt(idx + 1)); };
  const reset = () => setItems(original.current);

  return { items, dragIndex, overIndex, rootRef, onDragStart, onDragOver, onDragEnd, onDrop, moveUp, moveDown, reset };
}

interface Card { id: number; title: string; }
type Cols = { backlog: Card[]; active: Card[] };

function Boards() {
  const [lists, setLists] = useState<Cols>({
    backlog: [{ id: 11, title: 'Dark-mode chart audit' }, { id: 12, title: 'Empty-state illustrations' }, { id: 13, title: 'Export to CSV polish' }],
    active: [{ id: 21, title: 'Customizer accent presets' }, { id: 22, title: 'Editable table validation' }],
  });
  const [from, setFrom] = useState<{ col: keyof Cols | null; idx: number | null }>({ col: null, idx: null });
  const [overCol, setOverCol] = useState<keyof Cols | null>(null);

  const onStart = (col: keyof Cols, idx: number, e: React.DragEvent) => {
    setFrom({ col, idx });
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', `${col}:${idx}`); } catch { /* noop */ } }
  };
  const onEnd = () => { setFrom({ col: null, idx: null }); setOverCol(null); };
  const onDrop = (col: keyof Cols) => {
    if (from.col === null || from.idx === null) { setOverCol(null); return; }
    setLists((cur) => {
      const next: Cols = { backlog: cur.backlog.slice(), active: cur.active.slice() };
      const [card] = next[from.col as keyof Cols].splice(from.idx as number, 1);
      next[col].push(card);
      return next;
    });
    onEnd();
  };

  return (
    <div className="ax-card__body" style={{ paddingTop: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-4)' }}>
      {(['backlog', 'active'] as const).map((col) => (
        <div key={col} onDragOver={(e) => { e.preventDefault(); setOverCol(col); }} onDrop={(e) => { e.preventDefault(); onDrop(col); }}
          style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', padding: 'var(--ax-space-3)', borderRadius: 'var(--ax-radius-md)', minHeight: 180,
            transition: 'background var(--ax-motion-fast),box-shadow var(--ax-motion-fast)',
            background: overCol === col ? 'var(--ax-accent-wash)' : 'var(--ax-surface-subtle)',
            boxShadow: overCol === col ? 'inset 0 0 0 1.5px var(--ax-accent)' : 'inset 0 0 0 1px var(--ax-border)',
          }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' }}>{col === 'backlog' ? 'Backlog' : 'In progress'}</span>
            <span className="ax-badge ax-badge--soft ax-badge--pill ax-num">{lists[col].length}</span>
          </div>
          {lists[col].map((card, idx) => (
            <div key={card.id} draggable onDragStart={(e) => onStart(col, idx, e)} onDragEnd={onEnd}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--ax-space-2)', padding: 'var(--ax-space-3)', background: 'var(--ax-surface-solid)',
                border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-sm)', boxShadow: 'var(--ax-shadow-sm)', cursor: 'grab', transition: 'opacity var(--ax-motion-fast)',
                opacity: from.col === col && from.idx === idx ? 0.4 : 1,
              }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ax-text-subtle)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{card.title}</span>
            </div>
          ))}
          {lists[col].length === 0 && <p style={{ margin: 'auto 0', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Drop a card here</p>}
        </div>
      ))}
    </div>
  );
}

export function Sortable() {
  const list = useSortable(TASKS);
  const grid = useSortable(TILES);

  return (
    <>
      <PageHead
        title="Sortable"
        subtitle="Reorderable lists and grids — grab a handle and drag, or move with the keyboard. Pure Alpine, no drag library."
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/ui/draggable-cards">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /><path d="M14 4m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /><path d="M4 14m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /></svg>
            <span className="ax-btn__label">Draggable cards</span>
          </Link>
        }
      />

      <div className="ax-dash-grid">
        {/* SORTABLE LIST */}
        <section className="ax-card ax-col--6" role="region" aria-label="Sortable task list">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">List · vertical</span>
              <h2 className="ax-card__title">Reorder tasks</h2>
              <p className="ax-card__subtitle">Drag by the handle, or focus a row and press the arrow keys.</p>
            </div>
            <div className="ax-card__actions">
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={list.reset}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
                <span className="ax-btn__label">Reset</span>
              </button>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }} ref={list.rootRef}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }} aria-label="Task list, sortable">
              {list.items.map((item, idx) => (
                <li key={item.id} draggable
                  onDragStart={(e) => list.onDragStart(idx, e)} onDragEnd={list.onDragEnd}
                  onDragOver={(e) => { e.preventDefault(); list.onDragOver(idx); }} onDrop={(e) => { e.preventDefault(); list.onDrop(idx); }}
                  tabIndex={0} role="button"
                  aria-label={`Reorder ${item.title}. Position ${idx + 1} of ${list.items.length}`}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); list.moveUp(idx); } if (e.key === 'ArrowDown') { e.preventDefault(); list.moveDown(idx); } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-subtle)',
                    border: '1px solid', borderRadius: 'var(--ax-radius-md)', transition: 'opacity var(--ax-motion-fast),box-shadow var(--ax-motion-fast),border-color var(--ax-motion-fast)', cursor: 'default',
                    opacity: list.dragIndex === idx ? 0.45 : 1,
                    boxShadow: list.overIndex === idx && list.dragIndex !== null && list.dragIndex !== idx ? 'inset 0 0 0 2px var(--ax-accent)' : 'none',
                    borderColor: list.overIndex === idx && list.dragIndex !== null && list.dragIndex !== idx ? 'var(--ax-accent)' : 'var(--ax-border)',
                  }}>
                  <span style={{ cursor: 'grab', color: 'var(--ax-text-subtle)', display: 'inline-flex', flex: '0 0 auto' }} aria-hidden="true">{grip(18)}</span>
                  <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', width: '1.4em', textAlign: 'center', flex: '0 0 auto' }}>{idx + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 3, flex: '0 0 auto', background: item.tone }} />
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }} className="ax-text-truncate">{item.title}</span>
                    <span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{item.meta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="ax-card__footer">
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Order: <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{list.items.map((i) => i.id).join(' · ')}</span></span>
          </div>
        </section>

        {/* TWO-COLUMN KANBAN-LITE */}
        <section className="ax-card ax-col--6" role="region" aria-label="Move items between lists">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">List · across columns</span>
              <h2 className="ax-card__title">Move between lists</h2>
              <p className="ax-card__subtitle">Drag a card from one column into the other.</p>
            </div>
          </div>
          <Boards />
        </section>

        {/* SORTABLE GRID */}
        <section className="ax-card ax-col--12" role="region" aria-label="Sortable image grid">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Grid · 2D</span>
              <h2 className="ax-card__title">Reorder gallery</h2>
              <p className="ax-card__subtitle">Drag any tile to a new spot — the grid reflows around it.</p>
            </div>
            <div className="ax-card__actions">
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={grid.reset}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
                <span className="ax-btn__label">Reset</span>
              </button>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }} ref={grid.rootRef}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'var(--ax-space-4)' }}>
              {grid.items.map((item, idx) => {
                const over = grid.overIndex === idx && grid.dragIndex !== null && grid.dragIndex !== idx;
                return (
                  <figure key={item.id} draggable
                    onDragStart={(e) => grid.onDragStart(idx, e)} onDragEnd={grid.onDragEnd}
                    onDragOver={(e) => { e.preventDefault(); grid.onDragOver(idx); }} onDrop={(e) => { e.preventDefault(); grid.onDrop(idx); }}
                    aria-label={`${item.n}, position ${idx + 1}`}
                    style={{
                      margin: 0, borderRadius: 'var(--ax-radius-lg)', overflow: 'hidden', border: '1px solid var(--ax-border)', background: 'var(--ax-surface-subtle)', cursor: 'grab',
                      transition: 'opacity var(--ax-motion-fast),box-shadow var(--ax-motion-fast),transform var(--ax-motion-fast)',
                      opacity: grid.dragIndex === idx ? 0.4 : 1,
                      boxShadow: over ? '0 0 0 2px var(--ax-accent)' : 'none',
                      transform: over ? 'scale(1.02)' : 'scale(1)',
                    }}>
                    <div className="ax-ratio" style={{ '--ax-ratio': '4/3', position: 'relative', background: `linear-gradient(135deg,color-mix(in oklab,${item.c1} 32%,var(--ax-surface)),color-mix(in oklab,${item.c2} 24%,var(--ax-surface)))` } as React.CSSProperties}>
                      <span style={{ position: 'absolute', insetBlockStart: 'var(--ax-space-2)', insetInlineEnd: 'var(--ax-space-2)', width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 'var(--ax-radius-sm)', background: 'var(--ax-surface-overlay)', color: 'var(--ax-text-subtle)', boxShadow: 'var(--ax-shadow-sm)' }} aria-hidden="true">{grip(15)}</span>
                    </div>
                    <figcaption style={{ padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
                      <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }} className="ax-text-truncate">{item.n}</div>
                      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{item.m}</div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Sortable;
