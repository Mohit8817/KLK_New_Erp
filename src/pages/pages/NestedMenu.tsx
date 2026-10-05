/*
 * Vireo React — Nested Menu (route "pages/nested-menu").
 *
 * Faithful re-expression of src/html/pages/nested-menu.html: a 4-level treeview
 * (role="tree") with expand/collapse, roving-tabindex keyboard model (↑↓→←
 * Home/End), expand-all/collapse-all, and open-branch persistence in
 * localStorage (ax:nested-menu:open). Plus a depth legend and keyboard reference.
 * The Alpine axNestedTree() is ported to React state/refs. DOM + ARIA match 1:1.
 */
import { useCallback, useRef, useState } from 'react';
import { PageHead } from '../../components/shell/PageHead';

type Key = 'dash' | 'ecom' | 'catalog' | 'products' | 'orders' | 'settings';
const KEYS: Key[] = ['dash', 'ecom', 'catalog', 'products', 'orders', 'settings'];

const DEFAULT_OPEN: Record<Key, boolean> = { dash: false, ecom: true, catalog: true, products: true, orders: false, settings: false };

function loadOpen(): Record<Key, boolean> {
  let saved: Partial<Record<Key, boolean>> = {};
  try { saved = JSON.parse(localStorage.getItem('ax:nested-menu:open') || '{}'); } catch { /* ignore */ }
  return { ...DEFAULT_OPEN, ...saved };
}

const caretStyle: React.CSSProperties = { flex: '0 0 auto', color: 'var(--ax-text-subtle)', transition: 'transform var(--ax-motion-base) var(--ax-ease-standard)' };
const nodeStyle = (strong: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-2)', width: '100%', padding: '0 var(--ax-space-2)', border: 0, borderRadius: 'var(--ax-radius-sm)', background: 'transparent', color: strong ? 'var(--ax-text-strong)' : 'var(--ax-text)', cursor: 'pointer', textAlign: 'start', ...(strong ? { fontWeight: 'var(--ax-weight-medium)' } : {}) });
const groupStyle: React.CSSProperties = { listStyle: 'none', margin: 0, paddingInlineStart: 'var(--ax-space-4)', borderInlineStart: '1px solid var(--ax-border)', marginInlineStart: 'var(--ax-space-3)' };
const leafStyle = (cur?: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-2)', padding: '0 var(--ax-space-2)', borderRadius: 'var(--ax-radius-sm)', color: cur ? 'var(--ax-accent)' : 'var(--ax-text)', textDecoration: 'none', ...(cur ? { fontWeight: 'var(--ax-weight-medium)' } : {}) });
const dot = (accent?: boolean): React.CSSProperties => ({ width: 5, height: 5, borderRadius: '50%', background: accent ? 'var(--ax-accent)' : 'var(--ax-text-subtle)', flex: '0 0 auto' });

const Caret = ({ open, hidden }: { open: boolean; hidden?: boolean }) => (
  <svg style={{ ...caretStyle, ...(open ? { transform: 'rotate(90deg)' } : {}) }} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden={hidden}><path d="M9 6l6 6l-6 6" /></svg>
);

export function NestedMenu() {
  const [open, setOpen] = useState<Record<Key, boolean>>(loadOpen);
  const [focusKey, setFocusKey] = useState<Key>('dash');
  const treeRef = useRef<HTMLUListElement>(null);

  const persist = useCallback((next: Record<Key, boolean>) => {
    try { localStorage.setItem('ax:nested-menu:open', JSON.stringify(next)); } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((k: Key) => setOpen((o) => { const n = { ...o, [k]: !o[k] }; persist(n); return n; }), [persist]);
  const setOpenFor = useCallback((k: Key, v: boolean) => setOpen((o) => { if (o[k] === v) return o; const n = { ...o, [k]: v }; persist(n); return n; }), [persist]);
  const expandAll = useCallback(() => setOpen(() => { const n = Object.fromEntries(KEYS.map((k) => [k, true])) as Record<Key, boolean>; persist(n); return n; }), [persist]);
  const collapseAll = useCallback(() => setOpen(() => { const n = Object.fromEntries(KEYS.map((k) => [k, false])) as Record<Key, boolean>; persist(n); return n; }), [persist]);

  const visibleNodes = useCallback(() => {
    if (!treeRef.current) return [] as HTMLElement[];
    return Array.from(treeRef.current.querySelectorAll<HTMLElement>('.ax-tree__node, .ax-tree__leaf')).filter((el) => el.offsetParent !== null);
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    const nodes = visibleNodes();
    const cur = document.activeElement as HTMLElement | null;
    const i = cur ? nodes.indexOf(cur) : -1;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (i < nodes.length - 1) nodes[i + 1].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) nodes[i - 1].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); nodes[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); nodes[nodes.length - 1]?.focus(); }
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const k = cur?.matches('.ax-tree__node') ? (cur.getAttribute('data-key') as Key | null) : null;
      if (k && !open[k]) setOpenFor(k, true);
      else if (i < nodes.length - 1) nodes[i + 1].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const k = cur?.matches('.ax-tree__node') ? (cur.getAttribute('data-key') as Key | null) : null;
      if (k && open[k]) setOpenFor(k, false);
      else if (i > 0) nodes[i - 1].focus();
    }
  }, [open, visibleNodes, setOpenFor]);

  const nodeProps = (k: Key) => ({
    'data-key': k,
    className: `ax-tree__node${focusKey === k ? ' is-focused' : ''}`,
    tabIndex: focusKey === k ? 0 : -1,
    onClick: () => toggle(k),
    onFocus: () => setFocusKey(k),
  });

  return (
    <>
      <PageHead
        title="Nested Menu"
        subtitle="A multi-level navigation tree — proves the information architecture down to four levels of depth."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={collapseAll}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Collapse all</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={expandAll}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>
              <span className="ax-btn__label">Expand all</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--8" role="region" aria-label="Nested navigation tree">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Information architecture · §5</span>
              <h2 className="ax-card__title">Workspace Navigation</h2>
              <p className="ax-card__subtitle">Use ↑ ↓ to move, → ← to open or close, Enter to open a page</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 'var(--ax-space-2)' }}>
            <ul ref={treeRef} role="tree" aria-label="Workspace navigation" className="ax-tree" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 'var(--ax-text-sm)' }} onKeyDown={onKey}>

              {/* L1: Dashboards */}
              <li role="treeitem" aria-expanded={open.dash}>
                <button type="button" {...nodeProps('dash')} style={nodeStyle(true)}>
                  <svg className="ax-tree__caret" style={{ ...caretStyle, ...(open.dash ? { transform: 'rotate(90deg)' } : {}) }} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-accent)', flex: '0 0 auto' }}><path d="M4 4h6v8h-6z" /><path d="M4 16h6v4h-6z" /><path d="M14 12h6v8h-6z" /><path d="M14 4h6v4h-6z" /></svg>
                  <span style={{ flex: '1 1 auto' }}>Dashboards</span>
                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm ax-num">17</span>
                </button>
                {open.dash && (
                  <ul role="group" style={groupStyle}>
                    <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Sales</a></li>
                    <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Analytics</a></li>
                    <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />eCommerce</a></li>
                  </ul>
                )}
              </li>

              {/* L1: eCommerce (deep) */}
              <li role="treeitem" aria-expanded={open.ecom}>
                <button type="button" {...nodeProps('ecom')} style={nodeStyle(true)}>
                  <Caret open={open.ecom} hidden />
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-accent)', flex: '0 0 auto' }}><path d="M3 21l18 0" /><path d="M3 21v-13l9 -4l9 4v13" /><path d="M13 13h4v8h-10v-6h6" /></svg>
                  <span style={{ flex: '1 1 auto' }}>eCommerce</span>
                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">L1</span>
                </button>
                {open.ecom && (
                  <ul role="group" style={groupStyle}>
                    {/* L2: Catalog */}
                    <li role="treeitem" aria-expanded={open.catalog}>
                      <button type="button" {...nodeProps('catalog')} style={nodeStyle(false)}>
                        <Caret open={open.catalog} hidden />
                        <span style={{ flex: '1 1 auto' }}>Catalog</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">L2</span>
                      </button>
                      {open.catalog && (
                        <ul role="group" style={groupStyle}>
                          {/* L3: Products */}
                          <li role="treeitem" aria-expanded={open.products}>
                            <button type="button" {...nodeProps('products')} style={nodeStyle(false)}>
                              <Caret open={open.products} hidden />
                              <span style={{ flex: '1 1 auto' }}>Products</span>
                              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--sm">L3 · max</span>
                            </button>
                            {open.products && (
                              <ul role="group" style={groupStyle}>
                                <li role="treeitem"><a href="#" className="ax-tree__leaf is-current" aria-current="page" style={leafStyle(true)}><span style={dot(true)} />All products <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--sm ax-num" style={{ marginInlineStart: 'auto' }}>L4</span></a></li>
                                <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Add product</a></li>
                                <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Import / Export</a></li>
                              </ul>
                            )}
                          </li>
                          <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Categories <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm" style={{ marginInlineStart: 'auto' }}>L3</span></a></li>
                          <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Inventory</a></li>
                        </ul>
                      )}
                    </li>
                    {/* L2: Orders */}
                    <li role="treeitem" aria-expanded={open.orders}>
                      <button type="button" {...nodeProps('orders')} style={nodeStyle(false)}>
                        <Caret open={open.orders} hidden />
                        <span style={{ flex: '1 1 auto' }}>Orders</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm ax-num">128</span>
                      </button>
                      {open.orders && (
                        <ul role="group" style={groupStyle}>
                          <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Open orders</a></li>
                          <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Refunds</a></li>
                        </ul>
                      )}
                    </li>
                  </ul>
                )}
              </li>

              {/* L1: Settings */}
              <li role="treeitem" aria-expanded={open.settings}>
                <button type="button" {...nodeProps('settings')} style={nodeStyle(true)}>
                  <Caret open={open.settings} hidden />
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-accent)', flex: '0 0 auto' }}><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                  <span style={{ flex: '1 1 auto' }}>Settings</span>
                </button>
                {open.settings && (
                  <ul role="group" style={groupStyle}>
                    <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Workspace</a></li>
                    <li role="treeitem"><a href="#" className="ax-tree__leaf" style={leafStyle()}><span style={dot()} />Billing</a></li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </section>

        <div className="ax-col--4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
          <section className="ax-card" role="region" aria-label="Depth legend">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">Depth Legend</h2>
                <p className="ax-card__subtitle">Maximum nesting is four levels</p>
              </div>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}><span className="ax-badge ax-badge--soft ax-badge--neutral ax-num" style={{ minWidth: 34, justifyContent: 'center' }}>L1</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Section root — e.g. eCommerce</span></div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', marginInlineStart: 'var(--ax-space-3)' }}><span className="ax-badge ax-badge--soft ax-badge--neutral ax-num" style={{ minWidth: 34, justifyContent: 'center' }}>L2</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Group — Catalog, Orders</span></div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', marginInlineStart: 'var(--ax-space-6)' }}><span className="ax-badge ax-badge--soft ax-badge--neutral ax-num" style={{ minWidth: 34, justifyContent: 'center' }}>L3</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Sub-group — Products</span></div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', marginInlineStart: 'var(--ax-space-8)' }}><span className="ax-badge ax-badge--soft ax-badge--accent ax-num" style={{ minWidth: 34, justifyContent: 'center' }}>L4</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Leaf page — deepest allowed</span></div>
            </div>
          </section>

          <section className="ax-card" role="region" aria-label="Keyboard model">
            <div className="ax-card__header">
              <div className="ax-card__titles"><h2 className="ax-card__title">Keyboard Model</h2></div>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Move between nodes</span><span><kbd className="ax-kbd">↑</kbd> <kbd className="ax-kbd">↓</kbd></span></div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Open / descend</span><kbd className="ax-kbd">→</kbd></div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Close / ascend</span><kbd className="ax-kbd">←</kbd></div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Activate leaf</span><kbd className="ax-kbd">Enter</kbd></div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>First / last node</span><span><kbd className="ax-kbd">Home</kbd> <kbd className="ax-kbd">End</kbd></span></div>
              <hr className="ax-divider" aria-hidden="true" />
              <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Open branches persist in <span className="ax-num">localStorage</span> (<code className="ax-num">ax:nested-menu:open</code>).</p>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .ax-tree__node:hover, .ax-tree__leaf:hover { background: var(--ax-fill-hover); }
        .ax-tree__node.is-focused, .ax-tree__leaf:focus-visible { outline: 2px solid var(--ax-focus-ring); outline-offset: -1px; }
        @media (prefers-reduced-motion: reduce) { .ax-tree svg { transition: none !important; } }
      `}</style>
    </>
  );
}

export default NestedMenu;
