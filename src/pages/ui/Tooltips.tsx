/*
 * Vireo React — UI · Tooltips.
 * Faithful re-expression of src/html/ui/tooltips.html: four placements, glass vs
 * inverse variants, shortcut keys, icon-only affordances, a rich tooltip and the
 * native title fallback. The Alpine `axTooltip` (open on hover/focus, hide on
 * leave/blur) is ported to a small React <Tip> wrapper. DOM/classes/ARIA 1:1.
 */
import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

/**
 * A relative-positioned trigger + role="tooltip" bubble that opens on
 * pointerenter / focus and closes on pointerleave / blur — the axTooltip behavior.
 */
function Tip({ trigger, children, bubbleClass = 'ax-tooltip ax-tooltip--inverse', bubbleStyle, describe = true }: {
  trigger: (props: { onFocus: () => void; onBlur: () => void; 'aria-describedby': string }) => ReactNode;
  children: ReactNode;
  bubbleClass?: string;
  bubbleStyle: React.CSSProperties;
  describe?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {trigger({ onFocus: () => setOpen(true), onBlur: () => setOpen(false), 'aria-describedby': describe ? id : '' })}
      {open && (
        <span id={id} role="tooltip" className={bubbleClass} style={bubbleStyle}>
          {children}
        </span>
      )}
    </div>
  );
}

const ARROW_TOP = <span className="ax-tooltip__arrow" style={{ insetBlockEnd: -4, insetInlineStart: '50%', marginInlineStart: -4 }} />;

export function Tooltips() {
  const [pinned, setPinned] = useState(false);

  return (
    <>
      <PageHead
        title="Tooltips"
        subtitle="Glassy hover bubbles in four placements, with inverse, rich & shortcut variants — every surface is a role token, so all 12 accents retheme for free."
        actions={
          <>
            <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/ui/notifications">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
              <span className="ax-btn__label">Notifications</span>
            </Link>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setPinned((p) => !p)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" /><path d="M9 15l-4.5 4.5" /><path d="M14.5 4l5.5 5.5" /></svg>
              <span className="ax-btn__label">{pinned ? 'Pinned' : 'Pin for preview'}</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* Placements */}
        <section className="ax-card ax-col--12" role="region" aria-label="Tooltip placements">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Anchoring</span>
              <h2 className="ax-card__title">Placements</h2>
              <p className="ax-card__subtitle">Top, bottom, start &amp; end — hover or focus any trigger. The arrow always points back to its anchor.</p>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">Keyboard &amp; pointer accessible</span>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--ax-space-6)', placeItems: 'center', paddingBlock: 'var(--ax-space-6)' }}>
              <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>Top</button>}
                bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                Anchored above{ARROW_TOP}
              </Tip>
              <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>Bottom</button>}
                bubbleStyle={{ insetBlockStart: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                Anchored below<span className="ax-tooltip__arrow" style={{ insetBlockStart: -4, insetInlineStart: '50%', marginInlineStart: -4 }} />
              </Tip>
              <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>Start</button>}
                bubbleStyle={{ insetInlineEnd: 'calc(100% + 10px)', insetBlockStart: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>
                Anchored start<span className="ax-tooltip__arrow" style={{ insetInlineEnd: -4, insetBlockStart: '50%', marginBlockStart: -4 }} />
              </Tip>
              <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>End</button>}
                bubbleStyle={{ insetInlineStart: 'calc(100% + 10px)', insetBlockStart: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>
                Anchored end<span className="ax-tooltip__arrow" style={{ insetInlineStart: -4, insetBlockStart: '50%', marginBlockStart: -4 }} />
              </Tip>
            </div>
          </div>
        </section>

        {/* Variants */}
        <section className="ax-card ax-col--6" role="region" aria-label="Tooltip variants">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Surface</span>
              <h2 className="ax-card__title">Variants</h2>
              <p className="ax-card__subtitle">Default glass overlay vs. high-contrast inverse bubble.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-6)', alignItems: 'center', paddingBlock: 'var(--ax-space-6)' }}>
            <Tip bubbleClass="ax-tooltip" trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>Glass overlay</button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              Frosted surface-overlay{ARROW_TOP}
            </Tip>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>Inverse</button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              High-contrast bubble{ARROW_TOP}
            </Tip>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--secondary" {...p}>With shortcut</button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
              Quick search<kbd className="ax-tooltip__key">⌘</kbd><kbd className="ax-tooltip__key">K</kbd>{ARROW_TOP}
            </Tip>
          </div>
        </section>

        {/* Icon affordances */}
        <section className="ax-card ax-col--6" role="region" aria-label="Tooltips on icon affordances">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">In context</span>
              <h2 className="ax-card__title">Icon-only controls</h2>
              <p className="ax-card__subtitle">The most common use — a label for icon buttons that lack visible text.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-4)', alignItems: 'center', paddingBlock: 'var(--ax-space-6)' }}>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Bold" {...p}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 5h6a3.5 3.5 0 0 1 0 7h-6z" /><path d="M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7" /></svg></button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
              Bold<kbd className="ax-tooltip__key">⌘B</kbd>{ARROW_TOP}
            </Tip>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Italic" {...p}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5l6 0" /><path d="M7 19l6 0" /><path d="M14 5l-4 14" /></svg></button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
              Italic<kbd className="ax-tooltip__key">⌘I</kbd>{ARROW_TOP}
            </Tip>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Insert link" {...p}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 15l6 -6" /><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" /><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" /></svg></button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
              Insert link<kbd className="ax-tooltip__key">⌘K</kbd>{ARROW_TOP}
            </Tip>
            <Tip trigger={(p) => <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Delete" {...p}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg></button>}
              bubbleStyle={{ insetBlockEnd: 'calc(100% + 10px)', insetInlineStart: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              Move to trash{ARROW_TOP}
            </Tip>
          </div>
        </section>

        {/* Rich tooltip */}
        <section className="ax-card ax-col--6" role="region" aria-label="Rich tooltip">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Content</span>
              <h2 className="ax-card__title">Rich tooltip</h2>
              <p className="ax-card__subtitle">A title plus a line of supporting copy — still hover/focus driven.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', gap: 'var(--ax-space-6)', flexWrap: 'wrap', alignItems: 'center', paddingBlock: 'var(--ax-space-6)' }}>
            <Tip bubbleClass="ax-tooltip"
              trigger={(p) => (
                <span className="ax-avatar ax-avatar--lg" tabIndex={0} role="img" aria-label="Ava Sutton, Operations Lead" {...p} style={{ background: 'color-mix(in oklab,var(--ax-viz-violet) 18%,transparent)', color: 'var(--ax-viz-violet)', cursor: 'default' }}>
                  <span className="ax-avatar__initials">AS</span>
                  <span className="ax-avatar__status ax-avatar__status--online" />
                </span>
              )}
              bubbleStyle={{ insetInlineStart: 'calc(100% + 12px)', insetBlockStart: '50%', transform: 'translateY(-50%)', maxWidth: 220, whiteSpace: 'normal', textAlign: 'start' }}>
              <b style={{ display: 'block', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>Ava Sutton</b>
              <span style={{ display: 'block', color: 'var(--ax-text-muted)', marginBlockStart: 2 }}>Operations Lead · Online now</span>
              <span className="ax-tooltip__arrow" style={{ insetInlineStart: -4, insetBlockStart: '50%', marginBlockStart: -4 }} />
            </Tip>
            <Tip bubbleClass="ax-tooltip"
              trigger={(p) => (
                <span tabIndex={0} className="ax-num" {...p} style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 'var(--ax-weight-bold)', color: 'var(--ax-text-strong)', cursor: 'default', borderBlockEnd: '1px dashed var(--ax-border-strong)' }}>$748.2K</span>
              )}
              bubbleStyle={{ insetBlockStart: 'calc(100% + 10px)', insetInlineStart: 0, maxWidth: 240, whiteSpace: 'normal', textAlign: 'start' }}>
              <b style={{ display: 'block', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>Gross revenue</b>
              <span style={{ display: 'block', color: 'var(--ax-text-muted)', marginBlockStart: 2 }}>Jul 2025 – Jun 2026 · <span className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>▲ 12.4%</span> vs. prior period</span>
              <span className="ax-tooltip__arrow" style={{ insetBlockStart: -4, insetInlineStart: 18 }} />
            </Tip>
          </div>
        </section>

        {/* Native title fallback */}
        <section className="ax-card ax-col--6" role="region" aria-label="Native title attribute fallback">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">No-JS fallback</span>
              <h2 className="ax-card__title">Native <code className="ax-code">title</code></h2>
              <p className="ax-card__subtitle">Where a styled bubble is overkill, the browser <code className="ax-code">title</code> still works everywhere.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', paddingBlock: 'var(--ax-space-6)' }}>
            <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', margin: 0 }}>
              The <a className="ax-link" href="#" title="Server-Side Rendering — HTML generated on the server per request">SSR</a> rollout
              shipped Tuesday, ahead of the <span style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, color: 'var(--ax-text)', cursor: 'help' }} title="Originally scheduled for Friday, Jun 13">planned date</span>.
              Hover <a className="ax-link" href="#" title="Average Order Value across the trailing 30 days">AOV</a> for the metric definition.
            </p>
            <div className="ax-divider" />
            <p style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', margin: 0 }}>
              Tip: pair the <code className="ax-code">title</code> attribute with <code className="ax-code">x-tooltip</code> to upgrade it to a styled bubble when Alpine is present.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

export default Tooltips;
