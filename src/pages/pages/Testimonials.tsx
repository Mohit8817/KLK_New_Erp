/*
 * Vireo React — Testimonials (route "pages/testimonials").
 *
 * Faithful re-expression of src/html/pages/testimonials.html: a featured quote,
 * role filter chips (Alpine `filter` ported to React state), a masonry wall of
 * rated testimonial cards and a trusted-by logo strip. The masonry CSS lives in
 * a scoped <style> exactly as the reference. DOM classes + ARIA match 1:1.
 */
import { useState, type ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';

const STAR_PATH = 'M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z';

function Stars({ count, sm }: { count: number; sm?: boolean }) {
  return (
    <span className={`ax-rating${sm ? ' ax-rating--sm' : ''}`} aria-label={`Rated ${count} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`ax-rating__star${i < count ? ' ax-rating__star--full' : ''}`}
          viewBox="0 0 24 24"
          fill={i < count ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

interface Quote {
  role: string; stars: number; body: string; init: string; tint: string; name: string; meta: string; label: string;
}

const QUOTES: Quote[] = [
  { role: 'engineer', stars: 5, body: "The component library is genuinely the best I've used. Tokens are clean, dark mode just works, and the charts re-theme with the accent automatically. Saved us weeks.", init: 'MB', tint: 'var(--ax-viz-cyan)', name: 'Marcus Bell', meta: 'Staff Engineer · Quanta', label: 'Testimonial from Marcus Bell' },
  { role: 'founder', stars: 5, body: 'We launched our SaaS admin on Vireo and closed our first enterprise deal partly because the product looked so polished in the demo. It punches way above a template.', init: 'PA', tint: 'var(--ax-viz-pink)', name: 'Priya Anand', meta: 'Co-founder & CEO · Cadence', label: 'Testimonial from Priya Anand' },
  { role: 'designer', stars: 4, body: "As a designer I'm picky about spacing and type. Vireo is the first template where I didn't immediately want to rip out the styles. The Aurora glass is tasteful.", init: 'TR', tint: 'var(--ax-viz-amber)', name: 'Tom Riley', meta: 'Lead Product Designer · Vellum', label: 'Testimonial from Tom Riley' },
  { role: 'pm', stars: 5, body: 'Onboarding new PMs is so much faster now — every internal tool shares the same Vireo shell, so people already know where everything lives.', init: 'SC', tint: 'var(--ax-viz-emerald)', name: 'Sofia Castellano', meta: 'Group PM · Helio', label: 'Testimonial from Sofia Castellano' },
  { role: 'engineer', stars: 5, body: "The Vite + Tailwind v4 setup is exactly how I'd build it myself. No fighting the framework. I added a custom dashboard in an afternoon and it felt native.", init: 'DO', tint: 'var(--ax-viz-cyan)', name: 'Daniel Okonkwo', meta: 'Frontend Lead · Brightside', label: 'Testimonial from Daniel Okonkwo' },
  { role: 'founder', stars: 5, body: 'Support has been outstanding — a real engineer answered my edge-case question within hours with a working snippet. That\'s rare for a one-time purchase.', init: 'HL', tint: 'var(--ax-viz-violet)', name: 'Hannah Lindqvist', meta: 'Founder · Tideway', label: 'Testimonial from Hannah Lindqvist' },
  { role: 'designer', stars: 5, body: '12 accent presets and they all stay accessible. I switched our brand to teal in one click and every chart, badge and button followed. Honestly delightful.', init: 'KW', tint: 'var(--ax-viz-pink)', name: 'Kenji Watanabe', meta: 'Design Systems · Pace', label: 'Testimonial from Kenji Watanabe' },
  { role: 'pm', stars: 4, body: 'The breadth is impressive — 17 dashboards, e-commerce, CRM, all consistent. We picked the analytics dashboard as our starting point and barely changed a thing.', init: 'GM', tint: 'var(--ax-viz-amber)', name: 'Grace Mwangi', meta: 'Senior PM · Loftworks', label: 'Testimonial from Grace Mwangi' },
];

const CHIPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'founder', label: 'Founders' },
  { id: 'engineer', label: 'Engineers' },
  { id: 'designer', label: 'Designers' },
  { id: 'pm', label: 'Product' },
];

const LOGOS: { name: string; icon: ReactElement }[] = [
  { name: 'Northwind', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9z" /></svg> },
  { name: 'Cadence', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 3v18" /></svg> },
  { name: 'Vellum', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4l16 0l0 16l-16 0z" /><path d="M9 9l6 6" /></svg> },
  { name: 'Helio', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l9 17l-18 0z" /></svg> },
  { name: 'Tideway', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M12 5v14" /></svg> },
  { name: 'Brightside', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l8 -4l8 4l-8 4z" /><path d="M4 7v10l8 4l8 -4v-10" /></svg> },
];

export function Testimonials() {
  const [filter, setFilter] = useState('all');

  return (
    <>
      <PageHead
        title="Testimonials"
        subtitle="What product teams, founders and engineers say about building on Vireo."
        actions={
          <>
            <a className="ax-btn ax-btn--secondary" href="#"><span className="ax-btn__label">See pricing</span></a>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /><path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /></svg>
              <span className="ax-btn__label">Share your story</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12 ax-card--accent-edge" role="region" aria-label="Featured testimonial">
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)', padding: 'var(--ax-space-8)' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--ax-accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.9 }}><path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /><path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /></svg>
            <blockquote style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-xl)', lineHeight: 1.5, color: 'var(--ax-text-strong)', fontWeight: 500, maxWidth: '60ch' }}>
              Vireo replaced three separate tools for us. The Aurora design system meant we shipped a fully branded admin in a weekend, not a quarter — and our customers actually compliment the dashboards now.
            </blockquote>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'center' }}>
              <span className="ax-avatar ax-avatar--lg ax-avatar--ringed" style={{ background: 'color-mix(in oklab,var(--ax-viz-violet) 22%,transparent)', color: 'var(--ax-viz-violet)' }}><span className="ax-avatar__initials">EM</span></span>
              <div style={{ flex: '1 1 auto' }}>
                <p style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>Elena Márquez</p>
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>VP Engineering · Northwind Labs</p>
              </div>
              <Stars count={5} />
            </div>
          </div>
        </section>
      </div>

      <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', marginBlock: 'var(--ax-space-6) var(--ax-space-5)' }} role="group" aria-label="Filter testimonials by role">
        {CHIPS.map((c) => (
          <button key={c.id} type="button" className={`ax-btn ax-btn--pill ax-btn--sm ${filter === c.id ? 'ax-btn--primary' : 'ax-btn--secondary'}`} onClick={() => setFilter(c.id)}>{c.label}</button>
        ))}
      </div>

      <div className="ax-masonry">
        {QUOTES.filter((q) => filter === 'all' || filter === q.role).map((q) => (
          <article key={q.name} className="ax-card" role="region" aria-label={q.label}>
            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <Stars count={q.stars} sm />
              <p style={{ color: 'var(--ax-text)', lineHeight: 1.65, fontSize: 'var(--ax-text-md)' }}>{q.body}</p>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'center' }}>
                <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${q.tint} 22%,transparent)`, color: q.tint }}><span className="ax-avatar__initials">{q.init}</span></span>
                <div><p style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{q.name}</p><p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{q.meta}</p></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="ax-dash-grid" style={{ marginBlockStart: 'var(--ax-space-8)' }}>
        <section className="ax-card ax-col--12" role="region" aria-label="Companies building on Vireo">
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-5)', paddingBlock: 'var(--ax-space-7)' }}>
            <p className="ax-eyebrow" style={{ textAlign: 'center' }}>Trusted by teams at</p>
            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-8)', flexWrap: 'wrap', color: 'var(--ax-text-subtle)' }}>
              {LOGOS.map((l) => (
                <span key={l.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-2)', fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-lg)' }}>{l.icon}{l.name}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .ax-masonry { column-count: 1; column-gap: var(--ax-space-6); }
        .ax-masonry > .ax-card { break-inside: avoid; margin-bottom: var(--ax-space-6); display: inline-block; width: 100%; }
        @media (min-width: 768px)  { .ax-masonry { column-count: 2; } }
        @media (min-width: 1200px) { .ax-masonry { column-count: 3; } }
      `}</style>
    </>
  );
}

export default Testimonials;
