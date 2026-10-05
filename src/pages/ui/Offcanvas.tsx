/*
 * Vireo React — UI · Offcanvas.
 * Faithful re-expression of src/html/ui/offcanvas.html: slide-in drawers from
 * every edge (start filters, end cart, top notifications, bottom share sheet)
 * plus compact/wide/default end-drawer widths and a settings drawer. Alpine
 * axOffcanvas() → native React Offcanvas that teleports to <body>, traps focus,
 * Esc-closes and slides via a logical transform; $toast → page-local store.
 * DOM/classes/ARIA 1:1.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PageHead } from '../../components/shell/PageHead';

interface Toast { id: number; msg: string; }
let TID = 0;

type Edge = 'start' | 'end' | 'top' | 'bottom';
const HIDDEN: Record<Edge, string> = {
  start: 'translateX(-100%)', end: 'translateX(100%)', top: 'translateY(-100%)', bottom: 'translateY(100%)',
};
const SHOWN: Record<Edge, string> = {
  start: 'translateX(0)', end: 'translateX(0)', top: 'translateY(0)', bottom: 'translateY(0)',
};

const X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>;

function Offcanvas({ open, onClose, edge, labelledBy, panelClass = '', children }: {
  open: boolean; onClose: () => void; edge: Edge; labelledBy: string; panelClass?: string; children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useFocusTrap(ref, open);
  useEffect(() => {
    if (!open) { setShown(false); return; }
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(id); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  const edgeClass = edge === 'start' ? 'ax-offcanvas__panel--start' : edge === 'end' ? 'ax-offcanvas__panel--end' : edge === 'top' ? 'ax-offcanvas__panel--top' : 'ax-offcanvas__panel--bottom';
  return createPortal(
    <div className="ax-offcanvas">
      <div className="ax-offcanvas__backdrop" onClick={onClose} />
      <aside
        ref={ref}
        className={`ax-offcanvas__panel ${edgeClass}${panelClass ? ' ' + panelClass : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={{ transition: 'transform var(--ax-motion-base) var(--ax-ease-standard)', transform: shown ? SHOWN[edge] : HIDDEN[edge] }}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}

const CART_ICON = <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9h8v10a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1z" /><path d="M9 6a3 3 0 0 1 6 0" /><path d="M8 9l8 0" /></svg>;
const FILE_ICON = <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>;

export function OffcanvasPage() {
  const [start, setStart] = useState(false);
  const [end, setEnd] = useState(false);
  const [top, setTop] = useState(false);
  const [bottom, setBottom] = useState(false);
  const [small, setSmall] = useState(false);
  const [wide, setWide] = useState(false);
  const [settings, setSettings] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, number>>({});
  const toast = useCallback((msg: string, ttl: number) => {
    const id = ++TID;
    setToasts((t) => [...t, { id, msg }]);
    timers.current[id] = window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  return (
    <>
      <PageHead
        title="Offcanvas"
        subtitle="Slide-in drawers from any edge — filters, cart, notifications, settings and command bars."
        actions={
          <a className="ax-btn ax-btn--secondary ax-btn--pill" href="#">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M4 9h16" /></svg>
            <span className="ax-btn__label">Modals</span>
          </a>
        }
      />

      <div className="ax-dash-grid">
        {/* Edges */}
        <section className="ax-card ax-col--8" role="region" aria-label="Offcanvas edges">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Placement</span>
              <h2 className="ax-card__title">Drawer from any edge</h2>
              <p className="ax-card__subtitle">Start, end, top and bottom — each with header, scrolling body and footer.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setStart(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg>
              <span className="ax-btn__label">From start</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setEnd(true)}>
              <span className="ax-btn__label">From end</span>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setTop(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
              <span className="ax-btn__label">From top</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setBottom(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
              <span className="ax-btn__label">From bottom</span>
            </button>
          </div>
        </section>

        {/* Sizes + settings */}
        <section className="ax-card ax-col--4" role="region" aria-label="Offcanvas sizes">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Sizing</span>
              <h2 className="ax-card__title">Drawer widths</h2>
              <p className="ax-card__subtitle">Compact, default and wide end-drawers.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', alignItems: 'flex-start' }}>
            <div style={{ width: '100%' }}><button type="button" className="ax-btn ax-btn--secondary ax-btn--block" onClick={() => setSmall(true)}>Compact (320px)</button></div>
            <div style={{ width: '100%' }}><button type="button" className="ax-btn ax-btn--secondary ax-btn--block" onClick={() => setWide(true)}>Wide (540px)</button></div>
            <div style={{ width: '100%' }}>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--block" onClick={() => setSettings(true)}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                <span className="ax-btn__label">Settings panel</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ───── Drawers ───── */}
      <Offcanvas open={start} onClose={() => setStart(false)} edge="start" labelledBy="oc-start-title">
        <div className="ax-offcanvas__header">
          <h2 className="ax-offcanvas__title" id="oc-start-title">Filters</h2>
          <button type="button" className="ax-offcanvas__close" onClick={() => setStart(false)} aria-label="Close filters">{X}</button>
        </div>
        <div className="ax-offcanvas__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
          <div className="ax-field">
            <span className="ax-label">Status</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}><input type="checkbox" className="ax-checkbox" defaultChecked /> Delivered</label>
              <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}><input type="checkbox" className="ax-checkbox" defaultChecked /> Shipped</label>
              <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}><input type="checkbox" className="ax-checkbox" /> Pending</label>
              <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}><input type="checkbox" className="ax-checkbox" /> Cancelled</label>
            </div>
          </div>
          <hr className="ax-divider" />
          <div className="ax-field">
            <label className="ax-label" htmlFor="oc-min">Minimum total</label>
            <input id="oc-min" type="text" className="ax-input ax-num" defaultValue="$0" style={{ fontFamily: 'var(--ax-font-mono)' }} />
          </div>
          <div className="ax-field">
            <label className="ax-label" htmlFor="oc-seg">Segment</label>
            <select id="oc-seg" className="ax-select"><option>All segments</option><option>VIP</option><option>Returning</option><option>New</option></select>
          </div>
        </div>
        <div className="ax-offcanvas__footer" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setStart(false)}>Reset</button>
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => { setStart(false); toast('Filters applied', 2500); }}>Apply filters</button>
        </div>
      </Offcanvas>

      <Offcanvas open={end} onClose={() => setEnd(false)} edge="end" labelledBy="oc-cart-title">
        <div className="ax-offcanvas__header">
          <h2 className="ax-offcanvas__title" id="oc-cart-title">Your cart <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill ax-num" style={{ marginInlineStart: 6 }}>4</span></h2>
          <button type="button" className="ax-offcanvas__close" onClick={() => setEnd(false)} aria-label="Close cart">{X}</button>
        </div>
        <div className="ax-offcanvas__body" style={{ padding: 0 }}>
          <ul className="ax-list">
            <li className="ax-list__row">
              <span className="ax-list__leading"><span className="ax-avatar ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-violet) 18%,transparent)', color: 'var(--ax-viz-violet)' }}>{CART_ICON}</span></span>
              <span className="ax-list__content"><span className="ax-list__title">Matte Ceramic Mug</span><span className="ax-list__meta">Qty 2</span></span>
              <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>$48.00</span>
            </li>
            <li className="ax-list__row">
              <span className="ax-list__leading"><span className="ax-avatar ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-cyan) 18%,transparent)', color: 'var(--ax-viz-cyan)' }}>{FILE_ICON}</span></span>
              <span className="ax-list__content"><span className="ax-list__title">Grid Notebook A5</span><span className="ax-list__meta">Qty 1</span></span>
              <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>$16.00</span>
            </li>
            <li className="ax-list__row">
              <span className="ax-list__leading"><span className="ax-avatar ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-amber) 18%,transparent)', color: 'var(--ax-viz-amber)' }}>{CART_ICON}</span></span>
              <span className="ax-list__content"><span className="ax-list__title">Aperture Desk Lamp</span><span className="ax-list__meta">Qty 1</span></span>
              <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>$129.00</span>
            </li>
          </ul>
        </div>
        <div className="ax-offcanvas__footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--ax-space-3)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between' }}><span style={{ color: 'var(--ax-text-muted)' }}>Subtotal</span><b className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', color: 'var(--ax-text-strong)' }}>$193.00</b></div>
          <button type="button" className="ax-btn ax-btn--primary ax-btn--block" onClick={() => { setEnd(false); toast('Proceeding to checkout', 2500); }}>Checkout</button>
        </div>
      </Offcanvas>

      <Offcanvas open={top} onClose={() => setTop(false)} edge="top" labelledBy="oc-top-title">
        <div className="ax-offcanvas__header">
          <h2 className="ax-offcanvas__title" id="oc-top-title">Notifications</h2>
          <button type="button" className="ax-offcanvas__close" onClick={() => setTop(false)} aria-label="Close notifications">{X}</button>
        </div>
        <div className="ax-offcanvas__body">
          <ul className="ax-timeline">
            <li className="ax-timeline__item ax-timeline__item--success">
              <span className="ax-timeline__marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
              <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Tomás Herrera</b> moved deal "Brightway Retail" to Negotiation</p><span className="ax-timeline__time">12m ago</span></div>
            </li>
            <li className="ax-timeline__item">
              <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-violet)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" /></svg></span>
              <div className="ax-timeline__content"><p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Lena Brandt</b> mentioned you in "Design review"</p><span className="ax-timeline__time">1h ago</span></div>
            </li>
            <li className="ax-timeline__item">
              <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-cyan)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M15 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 17h-11v-14h-2" /><path d="M6 5l14 1l-1 7h-13" /></svg></span>
              <div className="ax-timeline__content"><p className="ax-timeline__title">Order <span style={{ color: 'var(--ax-accent)' }}>#10482</span> has shipped</p><span className="ax-timeline__time">2h ago</span></div>
            </li>
          </ul>
        </div>
        <div className="ax-offcanvas__footer"><button type="button" className="ax-btn ax-btn--ghost" onClick={() => { setTop(false); toast('All marked as read', 2500); }}>Mark all read</button><button type="button" className="ax-btn ax-btn--secondary" onClick={() => setTop(false)}>Close</button></div>
      </Offcanvas>

      <Offcanvas open={bottom} onClose={() => setBottom(false)} edge="bottom" labelledBy="oc-bottom-title">
        <div className="ax-offcanvas__header">
          <h2 className="ax-offcanvas__title" id="oc-bottom-title">Share report</h2>
          <button type="button" className="ax-offcanvas__close" onClick={() => setBottom(false)} aria-label="Close share sheet">{X}</button>
        </div>
        <div className="ax-offcanvas__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" style={{ flexDirection: 'column', height: 'auto', padding: 'var(--ax-space-5)', gap: 'var(--ax-space-2)' }}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" /><path d="M3 7l9 6l9 -6" /></svg><span className="ax-btn__label">Email</span></button>
            <button type="button" className="ax-btn ax-btn--secondary" style={{ flexDirection: 'column', height: 'auto', padding: 'var(--ax-space-5)', gap: 'var(--ax-space-2)' }}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M8.7 10.7l6.6 -3.4" /><path d="M8.7 13.3l6.6 3.4" /><path d="M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M18 18m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M6 12m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /></svg><span className="ax-btn__label">Share link</span></button>
            <button type="button" className="ax-btn ax-btn--secondary" style={{ flexDirection: 'column', height: 'auto', padding: 'var(--ax-space-5)', gap: 'var(--ax-space-2)' }}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg><span className="ax-btn__label">Download</span></button>
            <button type="button" className="ax-btn ax-btn--secondary" style={{ flexDirection: 'column', height: 'auto', padding: 'var(--ax-space-5)', gap: 'var(--ax-space-2)' }}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20 4l-12 12" /><path d="M14 4h6v6" /></svg><span className="ax-btn__label">Open in new tab</span></button>
          </div>
          <div className="ax-field" style={{ marginTop: 'var(--ax-space-5)' }}>
            <label className="ax-label" htmlFor="oc-link">Shareable link</label>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap' }}>
              <input id="oc-link" type="text" className="ax-input" readOnly value="https://app.vireo.io/r/748-2k-jun" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)' }} />
              <button type="button" className="ax-btn ax-btn--primary" onClick={() => toast('Link copied', 2000)}>Copy</button>
            </div>
          </div>
        </div>
      </Offcanvas>

      <Offcanvas open={small} onClose={() => setSmall(false)} edge="end" labelledBy="oc-sm-title" panelClass="ax-offcanvas__panel--sm">
        <div className="ax-offcanvas__header"><h2 className="ax-offcanvas__title" id="oc-sm-title">Quick view</h2><button type="button" className="ax-offcanvas__close" onClick={() => setSmall(false)} aria-label="Close">{X}</button></div>
        <div className="ax-offcanvas__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>A narrow 320px rail — for previews, quick edits and contextual help.</p></div>
      </Offcanvas>

      <Offcanvas open={wide} onClose={() => setWide(false)} edge="end" labelledBy="oc-lg-title" panelClass="ax-offcanvas__panel--lg">
        <div className="ax-offcanvas__header"><h2 className="ax-offcanvas__title" id="oc-lg-title">Order detail</h2><button type="button" className="ax-offcanvas__close" onClick={() => setWide(false)} aria-label="Close">{X}</button></div>
        <div className="ax-offcanvas__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>A roomy 540px panel — fits a detail record, an editor or a multi-field form without feeling cramped.</p></div>
      </Offcanvas>

      <Offcanvas open={settings} onClose={() => setSettings(false)} edge="end" labelledBy="oc-set-title">
        <div className="ax-offcanvas__header"><h2 className="ax-offcanvas__title" id="oc-set-title">Notification settings</h2><button type="button" className="ax-offcanvas__close" onClick={() => setSettings(false)} aria-label="Close settings">{X}</button></div>
        <div className="ax-offcanvas__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          <label className="ax-cluster" style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) 0', cursor: 'pointer' }}><span><span style={{ display: 'block', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>Email digests</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>A weekly summary every Monday</span></span><input type="checkbox" className="ax-switch" defaultChecked /></label>
          <hr className="ax-divider" />
          <label className="ax-cluster" style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) 0', cursor: 'pointer' }}><span><span style={{ display: 'block', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>Deal updates</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>When a deal changes stage</span></span><input type="checkbox" className="ax-switch" defaultChecked /></label>
          <hr className="ax-divider" />
          <label className="ax-cluster" style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) 0', cursor: 'pointer' }}><span><span style={{ display: 'block', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>Mentions</span><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>When someone @mentions you</span></span><input type="checkbox" className="ax-switch" /></label>
        </div>
        <div className="ax-offcanvas__footer"><button type="button" className="ax-btn ax-btn--ghost" onClick={() => setSettings(false)}>Cancel</button><button type="button" className="ax-btn ax-btn--primary" onClick={() => { setSettings(false); toast('Preferences saved', 2500); }}>Save</button></div>
      </Offcanvas>

      {/* ───── Toast region ───── */}
      {toasts.length > 0 && createPortal(
        <div className="ax-toast-region" aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 'var(--ax-space-6)', insetInlineEnd: 'var(--ax-space-6)', zIndex: 95, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          {toasts.map((t) => (
            <div key={t.id} className="ax-toast" role="status">
              <div className="ax-toast__content"><p className="ax-toast__message">{t.msg}</p></div>
              <button type="button" className="ax-toast__dismiss" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Dismiss">{X}</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default OffcanvasPage;
