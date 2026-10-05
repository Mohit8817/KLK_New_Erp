/*
 * Vireo React — Starter Page (route "pages/starter").
 *
 * Faithful re-expression of src/html/pages/starter.html: the canonical empty-state
 * scaffold (first-run CTA, state-variant reference list and a loading-skeleton
 * block). Static markup — DOM classes + ARIA match the reference 1:1.
 */
import { PageHead } from '../../components/shell/PageHead';

const VARIANTS = [
  { tint: 'var(--ax-accent)', bg: 'var(--ax-accent-wash)', title: 'First-run', sub: 'CTA to create the first record', icon: <><path d="M12 5l0 14" /><path d="M5 12l14 0" /></> },
  { tint: 'var(--ax-viz-cyan)', bg: 'color-mix(in oklab,var(--ax-viz-cyan) 18%,transparent)', title: 'Filtered-empty', sub: '"Clear filters" secondary action', icon: <><path d="M4 6h16" /><path d="M6 12h12" /><path d="M9 18h6" /></> },
  { tint: 'var(--ax-viz-violet)', bg: 'color-mix(in oklab,var(--ax-viz-violet) 18%,transparent)', title: 'Search-empty', sub: 'No matches + spelling tips', icon: <><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></> },
  { tint: 'var(--ax-viz-red)', bg: 'color-mix(in oklab,var(--ax-viz-red) 18%,transparent)', title: 'Error-empty', sub: '"Retry" action after a failure', icon: <><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></> },
];

export function Starter() {
  return (
    <>
      <PageHead
        title="Starter Page"
        subtitle="A blank scaffold with the standard page shell — drop your content into the marked region below."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9h1" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
              <span className="ax-btn__label">View docs</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">New item</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--8" role="region" aria-label="Get started">
          <div className="ax-card__body" style={{ paddingBlock: 'var(--ax-space-10)' }}>
            <div style={{ maxWidth: 420, marginInline: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--ax-space-5)' }}>
              <span aria-hidden="true" style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 128, height: 128, borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, var(--ax-accent-wash), transparent 70%)' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed var(--ax-border-strong)' }} />
                <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--ax-text-muted)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                  <path d="M12 11l0 6" stroke="var(--ax-accent)" />
                  <path d="M9 14l3 -3l3 3" stroke="var(--ax-accent)" />
                </svg>
              </span>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-lg)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>Nothing here yet</h2>
                <p style={{ margin: 'var(--ax-space-2) 0 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', lineHeight: 1.55 }}>This is the canonical empty-state pattern reused across every list, table and feed. Create your first item to get going.</p>
              </div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', justifyContent: 'center' }}>
                <button type="button" className="ax-btn ax-btn--primary">
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  <span className="ax-btn__label">Create item</span>
                </button>
                <a className="ax-link" href="#" style={{ fontSize: 'var(--ax-text-sm)' }}>or import from a file</a>
              </div>
            </div>
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Empty-state variants">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">State Variants</h2>
              <p className="ax-card__subtitle">One pattern, four contexts</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-list ax-list--compact">
              {VARIANTS.map((v) => (
                <li key={v.title} className="ax-list__row">
                  <span className="ax-list__leading"><span className="ax-avatar ax-avatar--xs" style={{ background: v.bg, color: v.tint }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg></span></span>
                  <span className="ax-list__content"><span className="ax-list__title">{v.title}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{v.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ax-card ax-col--12" role="region" aria-label="Loading skeleton reference">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Loading Skeleton</h2>
              <p className="ax-card__subtitle">Reserve layout while async data resolves — no content shift</p>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" aria-live="polite">Loading…</span>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--ax-space-4)' }}>
              {[['80%', '55%'], ['70%', '45%'], ['85%', '60%']].map(([w1, w2], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', padding: 'var(--ax-space-3)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                  <span className="ax-skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--ax-radius-md)', flex: '0 0 auto' }} />
                  <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                    <span className="ax-skeleton" style={{ width: w1, height: 10, borderRadius: 'var(--ax-radius-pill)' }} />
                    <span className="ax-skeleton" style={{ width: w2, height: 10, borderRadius: 'var(--ax-radius-pill)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Starter;
