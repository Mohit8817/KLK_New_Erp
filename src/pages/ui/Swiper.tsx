/*
 * Vireo React — UI · Swiper.
 * Faithful re-expression of src/html/ui/swiper.html: a hero slider with switchable
 * slide/fade/cards effects, a vertical release-notes slider, and a thumbnail
 * gallery whose main stage and filmstrip stay in sync. The Alpine x-data sliders
 * (including the per-slide styleFor transform math) are ported to React state.
 * DOM/classes/ARIA 1:1.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const ARROW_L = <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg>;
const ARROW_R = <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>;
const CHEV_UP = <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>;
const CHEV_DN = <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>;

const HERO = [
  { tag: 'New release', tone: 'accent', c1: 'var(--ax-viz-violet)', c2: 'var(--ax-viz-cyan)', t: 'Vireo 3.0 is here', d: 'Twelve Aurora accents, a live customizer and 200+ pages — shipped today.' },
  { tag: 'Workshop', tone: 'warning', c1: 'var(--ax-viz-amber)', c2: 'var(--ax-viz-pink)', t: 'Charts that re-theme live', d: 'Switch accent or mode and every chart re-colours in 200ms — no reload, no flash.' },
  { tag: 'Performance', tone: 'success', c1: 'var(--ax-viz-emerald)', c2: 'var(--ax-viz-cyan)', t: '98 Lighthouse, zero jank', d: 'Lazy-loaded plugins and token-only styling keep the bundle lean and fast.' },
  { tag: 'Accessible', tone: 'info', c1: 'var(--ax-viz-cyan)', c2: 'var(--ax-viz-violet)', t: 'Keyboard-first by design', d: 'Arrow keys, focus-visible rings and ARIA roles on every interactive surface.' },
];

const NOTES = [
  { v: 'v3.0', date: 'Jun 2026', c: 'var(--ax-viz-violet)', t: 'Aurora redesign', d: 'Glassy surfaces, ambient glow and a brand-new customizer.' },
  { v: 'v2.6', date: 'Apr 2026', c: 'var(--ax-viz-cyan)', t: 'Vector maps', d: 'jsVectorMap wrapper with choropleth and region selection.' },
  { v: 'v2.4', date: 'Feb 2026', c: 'var(--ax-viz-emerald)', t: 'Editable tables', d: 'Inline cell editing with dirty-state tracking and save.' },
  { v: 'v2.0', date: 'Nov 2025', c: 'var(--ax-viz-amber)', t: '8 stack editions', d: 'HTML, React, Vue, Nuxt, Laravel and more — one design.' },
];

const GALLERY = [
  { n: 'Aperture Desk Lamp', m: 'Lighting · $129', c1: 'var(--ax-viz-amber)', c2: 'var(--ax-viz-pink)' },
  { n: 'Walnut Monitor Riser', m: 'Desk · $96', c1: 'var(--ax-viz-emerald)', c2: 'var(--ax-viz-cyan)' },
  { n: 'Matte Ceramic Mug', m: 'Drinkware · $24', c1: 'var(--ax-viz-violet)', c2: 'var(--ax-viz-cyan)' },
  { n: 'Brass Task Light', m: 'Lighting · $182', c1: 'var(--ax-viz-cyan)', c2: 'var(--ax-viz-violet)' },
  { n: 'Grid Notebook A5', m: 'Stationery · $16', c1: 'var(--ax-viz-pink)', c2: 'var(--ax-viz-amber)' },
  { n: 'Stoneware Carafe', m: 'Drinkware · $52', c1: 'var(--ax-viz-emerald)', c2: 'var(--ax-viz-amber)' },
];

function HeroSlider() {
  const [i, setI] = useState(0);
  const [effect, setEffect] = useState<'slide' | 'fade' | 'cards'>('slide');
  const total = HERO.length;
  const go = (n: number) => setI((n + total) % total);
  const next = () => go(i + 1);
  const prev = () => go(i - 1);

  const styleFor = (n: number): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', inset: 0, transition: 'transform .5s var(--ax-ease-standard),opacity .5s var(--ax-ease-standard)' };
    if (effect === 'fade') {
      return n === i ? { ...base, opacity: 1, transform: 'scale(1)', zIndex: 2 } : { ...base, opacity: 0, transform: 'scale(1.02)', zIndex: 1, pointerEvents: 'none' };
    }
    if (effect === 'cards') {
      const off = n - i;
      if (off === 0) return { ...base, opacity: 1, transform: 'translateX(0) scale(1) rotateY(0)', zIndex: 3 };
      if (off === 1 || off === 1 - total) return { ...base, opacity: 0.5, transform: 'translateX(10%) scale(.9) rotateY(-12deg)', zIndex: 2, pointerEvents: 'none' };
      if (off === -1 || off === total - 1) return { ...base, opacity: 0.5, transform: 'translateX(-10%) scale(.9) rotateY(12deg)', zIndex: 2, pointerEvents: 'none' };
      return { ...base, opacity: 0, transform: 'scale(.8)', zIndex: 1, pointerEvents: 'none' };
    }
    return { ...base, transform: `translateX(${(n - i) * 100}%)`, opacity: 1, zIndex: n === i ? 2 : 1 };
  };

  return (
    <section className="ax-card ax-col--8" role="region" aria-roledescription="carousel" aria-label="Featured slides"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } }} tabIndex={0}>
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Effects</span>
          <h2 className="ax-card__title">Hero slider</h2>
          <p className="ax-card__subtitle">Pick a transition — slide, fade or a stacked cards effect.</p>
        </div>
        <div className="ax-card__actions">
          <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Slide effect">
            {(['slide', 'fade', 'cards'] as const).map((ef) => (
              <button key={ef} type="button" className={`ax-btn ax-btn--sm${effect === ef ? ' is-selected' : ''}`} role="radio" aria-checked={effect === ef} onClick={() => setEffect(ef)} style={{ textTransform: 'capitalize' }}>{ef}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0 }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ax-radius-lg)', perspective: '1200px' }}>
          <div className="ax-ratio" style={{ '--ax-ratio': '16/8' } as React.CSSProperties}>
            {HERO.map((s, n) => (
              <div key={n} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${total}`} style={styleFor(n)}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', borderRadius: 'var(--ax-radius-lg)', overflow: 'hidden', background: `linear-gradient(125deg,color-mix(in oklab,${s.c1} 34%,var(--ax-surface)),color-mix(in oklab,${s.c2} 26%,var(--ax-surface)))` }}>
                  <div style={{ padding: 'var(--ax-space-7)' }}>
                    <span className={`ax-badge ax-badge--solid ax-badge--pill ax-badge--${s.tone}`} style={{ marginBottom: 'var(--ax-space-3)' }}>{s.tag}</span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{s.t}</h3>
                    <p style={{ margin: 'var(--ax-space-1) 0 0', color: 'var(--ax-text-muted)', maxWidth: '48ch' }}>{s.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon" onClick={prev} aria-label="Previous slide" style={{ position: 'absolute', insetBlockStart: '50%', insetInlineStart: 'var(--ax-space-4)', transform: 'translateY(-50%)', zIndex: 5 }}>{ARROW_L}</button>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon" onClick={next} aria-label="Next slide" style={{ position: 'absolute', insetBlockStart: '50%', insetInlineEnd: 'var(--ax-space-4)', transform: 'translateY(-50%)', zIndex: 5 }}>{ARROW_R}</button>
        </div>
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', justifyContent: 'center', marginTop: 'var(--ax-space-4)' }} role="tablist" aria-label="Choose slide">
          {HERO.map((_, n) => (
            <button key={n} type="button" onClick={() => go(n)} role="tab" aria-selected={i === n} aria-label={`Go to slide ${n + 1}`}
              style={{ width: i === n ? 24 : 8, height: 8, borderRadius: 'var(--ax-radius-pill)', border: 0, cursor: 'pointer', transition: 'all var(--ax-motion-base) var(--ax-ease-standard)', background: i === n ? 'var(--ax-accent)' : 'var(--ax-border-strong)' }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VerticalSlider() {
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % NOTES.length);
  const prev = () => setI((p) => (p - 1 + NOTES.length) % NOTES.length);
  return (
    <section className="ax-card ax-col--4" role="region" aria-roledescription="carousel" aria-label="Release notes">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Vertical</span>
          <h2 className="ax-card__title">Release notes</h2>
        </div>
        <div className="ax-card__actions">
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon ax-btn--sm" onClick={prev} aria-label="Previous note">{CHEV_UP}</button>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon ax-btn--sm" onClick={next} aria-label="Next note">{CHEV_DN}</button>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', gap: 'var(--ax-space-4)' }}>
        <div style={{ position: 'relative', overflow: 'hidden', flex: '1 1 auto', height: 230, borderRadius: 'var(--ax-radius-md)' }}>
          <div style={{ transition: 'transform .45s var(--ax-ease-standard)', transform: `translateY(-${i * 230}px)` }}>
            {NOTES.map((s, n) => (
              <div key={n} style={{ height: 230, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--ax-space-2)', padding: 'var(--ax-space-5)', borderRadius: 'var(--ax-radius-md)', background: `linear-gradient(135deg,color-mix(in oklab,${s.c} 22%,var(--ax-surface)),var(--ax-surface-subtle))` }}>
                <span className="ax-badge ax-badge--soft ax-badge--pill ax-num" style={{ color: s.c, background: `color-mix(in oklab,${s.c} 16%,transparent)`, alignSelf: 'flex-start' }}>{s.v}</span>
                <div style={{ fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' }}>{s.date}</div>
                <h3 style={{ margin: 0, fontSize: 'var(--ax-text-lg)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{s.t}</h3>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', lineHeight: 1.55 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)', justifyContent: 'center' }} role="tablist" aria-label="Choose note">
          {NOTES.map((_, n) => (
            <button key={n} type="button" onClick={() => setI(n)} role="tab" aria-selected={i === n} aria-label={`Note ${n + 1}`}
              style={{ width: 8, height: i === n ? 24 : 8, borderRadius: 'var(--ax-radius-pill)', border: 0, cursor: 'pointer', transition: 'all var(--ax-motion-base) var(--ax-ease-standard)', background: i === n ? 'var(--ax-accent)' : 'var(--ax-border-strong)' }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ThumbGallery() {
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % GALLERY.length);
  const prev = () => setI((p) => (p - 1 + GALLERY.length) % GALLERY.length);
  return (
    <section className="ax-card ax-col--12" role="region" aria-roledescription="carousel" aria-label="Product gallery"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } }} tabIndex={0}>
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Thumbs · sync</span>
          <h2 className="ax-card__title">Product gallery</h2>
          <p className="ax-card__subtitle">Main slide and the thumbnail filmstrip stay in sync — click a thumb or use the arrows.</p>
        </div>
        <div className="ax-card__actions">
          <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>{i + 1} / {GALLERY.length}</span>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--ax-space-4)' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ax-radius-lg)' }}>
          <div className="ax-ratio" style={{ '--ax-ratio': '21/8' } as React.CSSProperties}>
            {GALLERY.map((s, n) => (
              i === n && (
                <div key={n} className="ax-flex" style={{ position: 'absolute', inset: 0, alignItems: 'flex-end', background: `linear-gradient(135deg,color-mix(in oklab,${s.c1} 32%,var(--ax-surface)),color-mix(in oklab,${s.c2} 24%,var(--ax-surface)))` }}>
                  <div style={{ padding: 'var(--ax-space-6)' }}>
                    <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-xl)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{s.n}</div>
                    <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', marginTop: 2 }}>{s.m}</div>
                  </div>
                  <svg viewBox="0 0 24 24" width={42} height={42} fill="none" stroke="var(--ax-text-strong)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetBlockStart: 'var(--ax-space-5)', insetInlineEnd: 'var(--ax-space-5)', opacity: 0.7 }}><path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" /></svg>
                </div>
              )
            ))}
          </div>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon" onClick={prev} aria-label="Previous image" style={{ position: 'absolute', insetBlockStart: '50%', insetInlineStart: 'var(--ax-space-4)', transform: 'translateY(-50%)' }}>{ARROW_L}</button>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon" onClick={next} aria-label="Next image" style={{ position: 'absolute', insetBlockStart: '50%', insetInlineEnd: 'var(--ax-space-4)', transform: 'translateY(-50%)' }}>{ARROW_R}</button>
        </div>
        <div className="ax-scroll" style={{ display: 'flex', gap: 'var(--ax-space-3)', overflowX: 'auto', paddingBottom: 'var(--ax-space-1)' }}>
          {GALLERY.map((s, n) => (
            <button key={n} type="button" onClick={() => setI(n)} aria-label={`View ${s.n}`} aria-current={i === n}
              style={{ flex: '0 0 96px', height: 64, borderRadius: 'var(--ax-radius-md)', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all var(--ax-motion-base) var(--ax-ease-standard)', background: `linear-gradient(135deg,color-mix(in oklab,${s.c1} 32%,var(--ax-surface)),color-mix(in oklab,${s.c2} 24%,var(--ax-surface)))`, border: `2px solid ${i === n ? 'var(--ax-accent)' : 'transparent'}`, opacity: i === n ? 1 : 0.6 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Swiper() {
  return (
    <>
      <PageHead
        title="Swiper"
        subtitle="A touch-style slider gallery — switchable effects, a thumbnail filmstrip and a vertical track, all built on pure Alpine and CSS transforms."
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/ui/carousel">
            {ARROW_L}
            <span className="ax-btn__label">Carousel</span>
          </Link>
        }
      />

      <div className="ax-dash-grid">
        <HeroSlider />
        <VerticalSlider />
        <ThumbGallery />
      </div>
    </>
  );
}

export default Swiper;
