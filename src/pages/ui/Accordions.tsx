/*
 * Vireo React — UI · Accordions.
 * Faithful re-expression of src/html/ui/accordions.html: single-open, multi-open,
 * bordered, flush and icon-led variants. The Alpine x-data/x-collapse open state
 * is ported to React state; aria-expanded + aria-controls preserved. The icon-led
 * card's "Expand all" header button opens every panel (the @ax-open-all event).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const CHEVRON = (
  <svg className="ax-accordion__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);

function Item({ id, title, expanded, onToggle, children }: { id: string; title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode; }) {
  return (
    <div className="ax-accordion__item">
      <button type="button" className="ax-accordion__header" aria-expanded={expanded} onClick={onToggle} aria-controls={id}>
        <span className="ax-accordion__title">{title}</span>
        {CHEVRON}
      </button>
      {expanded && <div className="ax-accordion__panel" id={id}>{children}</div>}
    </div>
  );
}

export function Accordions() {
  const [single, setSingle] = useState<number | null>(1);
  const [multi, setMulti] = useState({ ship: true, returns: false, tax: false });
  const [bordered, setBordered] = useState<number | null>(1);
  const [flush, setFlush] = useState<number | null>(null);
  const [icon, setIcon] = useState({ plan: true, usage: false, alerts: false });

  return (
    <>
      <PageHead
        title="Accordions"
        subtitle="Collapsible panels — single-open, multi-open, bordered, flush and icon-led, all driven by Alpine with proper aria state."
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/pages/faq">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4" /><path d="M12 19l0 .01" /></svg>
            <span className="ax-btn__label">FAQ page</span>
          </Link>
        }
      />

      <div className="ax-dash-grid">
        {/* Single-open */}
        <section className="ax-card ax-col--6" role="region" aria-label="Single-open accordion">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Default</span>
              <h2 className="ax-card__title">Single-open</h2>
              <p className="ax-card__subtitle">Opening one panel closes the others.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-accordion">
              <Item id="sa-1" title="What is included in the Vireo license?" expanded={single === 1} onToggle={() => setSingle(single === 1 ? null : 1)}>
                A single regular license covers one end product. It bundles all 9 framework editions, lifetime updates and 6 months of support, extendable to 12.
              </Item>
              <Item id="sa-2" title="Can I use it for a client project?" expanded={single === 2} onToggle={() => setSingle(single === 2 ? null : 2)}>
                Yes. Build one client dashboard per license; the client may be charged once for the finished product. For SaaS that end users pay to access, an extended license applies.
              </Item>
              <Item id="sa-3" title="Which build tools do I need?" expanded={single === 3} onToggle={() => setSingle(single === 3 ? null : 3)}>
                Node 20+ and a package manager. The HTML edition runs on Vite with Tailwind v4 and Alpine — <code className="ax-code">npm install</code> then <code className="ax-code">npm run dev</code>.
              </Item>
            </div>
          </div>
        </section>

        {/* Multi-open */}
        <section className="ax-card ax-col--6" role="region" aria-label="Multi-open accordion">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Independent</span>
              <h2 className="ax-card__title">Multi-open</h2>
              <p className="ax-card__subtitle">Each panel toggles on its own.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-accordion">
              <Item id="ma-1" title="Shipping & delivery" expanded={multi.ship} onToggle={() => setMulti((m) => ({ ...m, ship: !m.ship }))}>
                Orders ship within 2 business days. Standard delivery is 3–5 days; express is next-day for orders placed before 2pm.
              </Item>
              <Item id="ma-2" title="Returns & refunds" expanded={multi.returns} onToggle={() => setMulti((m) => ({ ...m, returns: !m.returns }))}>
                Unused items can be returned within 30 days for a full refund. Refunds settle to the original payment method within 5 business days.
              </Item>
              <Item id="ma-3" title="Tax & invoicing" expanded={multi.tax} onToggle={() => setMulti((m) => ({ ...m, tax: !m.tax }))}>
                VAT is added at checkout where applicable. A tax invoice is emailed with every order and is available under Billing → Invoices.
              </Item>
            </div>
          </div>
        </section>

        {/* Bordered */}
        <section className="ax-card ax-col--6" role="region" aria-label="Bordered accordion">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Bordered</h2>
              <p className="ax-card__subtitle">Each item is a separate boxed card.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-accordion ax-accordion--bordered">
              <Item id="ba-1" title="Connect your data source" expanded={bordered === 1} onToggle={() => setBordered(bordered === 1 ? null : 1)}>
                Link a warehouse, a REST endpoint or upload a CSV. Vireo maps columns automatically and previews the first rows before import.
              </Item>
              <Item id="ba-2" title="Build your first dashboard" expanded={bordered === 2} onToggle={() => setBordered(bordered === 2 ? null : 2)}>
                Drag KPI cards, charts and tables onto the grid. Every widget rethemes with your accent and respects the 12-column layout.
              </Item>
              <Item id="ba-3" title="Invite your team" expanded={bordered === 3} onToggle={() => setBordered(bordered === 3 ? null : 3)}>
                Send invites by email and assign roles — Owner, Admin or Member. Pending invites expire after 7 days and can be resent at any time.
              </Item>
            </div>
          </div>
        </section>

        {/* Flush */}
        <section className="ax-card ax-col--6" role="region" aria-label="Flush accordion">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Variant</span>
              <h2 className="ax-card__title">Flush</h2>
              <p className="ax-card__subtitle">No outer chrome — hairline dividers only, for sidebars &amp; settings.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ padding: 0 }}>
            <div className="ax-accordion">
              <Item id="fa-1" title="Notifications" expanded={flush === 1} onToggle={() => setFlush(flush === 1 ? null : 1)}>
                Choose which events email you and which only appear in the bell. Critical alerts can never be muted.
              </Item>
              <Item id="fa-2" title="Security" expanded={flush === 2} onToggle={() => setFlush(flush === 2 ? null : 2)}>
                Manage two-factor authentication, active sessions and trusted devices. Revoke any session you don't recognise.
              </Item>
              <Item id="fa-3" title="API & webhooks" expanded={flush === 3} onToggle={() => setFlush(flush === 3 ? null : 3)}>
                Generate scoped API keys and register webhook endpoints. Each delivery is retried up to 5 times with exponential backoff.
              </Item>
            </div>
          </div>
        </section>

        {/* With icons */}
        <section className="ax-card ax-col--12" role="region" aria-label="Icon-led accordion">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Rich</span>
              <h2 className="ax-card__title">With icons &amp; meta</h2>
              <p className="ax-card__subtitle">A leading tile, a supporting badge, and the chevron — the most detailed variant.</p>
            </div>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setIcon({ plan: true, usage: true, alerts: true })}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg>
              <span className="ax-btn__label">Expand all</span>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-accordion ax-accordion--bordered">
              <div className="ax-accordion__item">
                <button type="button" className="ax-accordion__header" aria-expanded={icon.plan} onClick={() => setIcon((s) => ({ ...s, plan: !s.plan }))} aria-controls="ia-1" style={{ gap: 'var(--ax-space-4)' }}>
                  <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: 'var(--ax-accent-wash)', color: 'var(--ax-accent)' }} aria-hidden="true">
                    <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M5 21l-1 -7l16 0l-1 7z" /><path d="M5 11l-2 -6l5 3l4 -5l4 5l5 -3l-2 6" /></svg>
                  </span>
                  <span className="ax-accordion__title" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: 'var(--ax-text-strong)' }}>Plan &amp; billing</span>
                    <span style={{ fontWeight: 'var(--ax-weight-regular)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Team plan · renews Jul 1</span>
                  </span>
                  <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill ax-badge--sm">Active</span>
                  {CHEVRON}
                </button>
                {icon.plan && <div className="ax-accordion__panel" id="ia-1">Your team is on the annual plan at $23 / seat / month with 9 active seats. Add or remove seats at any time; changes are prorated to the next invoice.</div>}
              </div>
              <div className="ax-accordion__item">
                <button type="button" className="ax-accordion__header" aria-expanded={icon.usage} onClick={() => setIcon((s) => ({ ...s, usage: !s.usage }))} aria-controls="ia-2" style={{ gap: 'var(--ax-space-4)' }}>
                  <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-cyan) 16%,transparent)', color: 'var(--ax-viz-cyan)' }} aria-hidden="true">
                    <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>
                  </span>
                  <span className="ax-accordion__title" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: 'var(--ax-text-strong)' }}>Usage this month</span>
                    <span style={{ fontWeight: 'var(--ax-weight-regular)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>72% of API quota used</span>
                  </span>
                  <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill ax-badge--sm">Watch</span>
                  {CHEVRON}
                </button>
                {icon.usage && (
                  <div className="ax-accordion__panel" id="ia-2">
                    You've made 1.44M of your 2M monthly API calls. At the current rate you'll reach the limit around Jun 27 — upgrade or buy a top-up to avoid throttling.
                    <div className="ax-progress ax-progress--sm" style={{ marginTop: 'var(--ax-space-3)', maxWidth: 320 }}><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '72%', background: 'var(--ax-viz-amber)' }} /></div></div>
                  </div>
                )}
              </div>
              <div className="ax-accordion__item">
                <button type="button" className="ax-accordion__header" aria-expanded={icon.alerts} onClick={() => setIcon((s) => ({ ...s, alerts: !s.alerts }))} aria-controls="ia-3" style={{ gap: 'var(--ax-space-4)' }}>
                  <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-violet) 16%,transparent)', color: 'var(--ax-viz-violet)' }} aria-hidden="true">
                    <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
                  </span>
                  <span className="ax-accordion__title" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: 'var(--ax-text-strong)' }}>Alert rules</span>
                    <span style={{ fontWeight: 'var(--ax-weight-regular)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>4 rules · 1 muted</span>
                  </span>
                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill ax-badge--sm">4</span>
                  {CHEVRON}
                </button>
                {icon.alerts && <div className="ax-accordion__panel" id="ia-3">Alerts fire when revenue drops more than 10% day-over-day, a payment fails, stock falls below threshold, or a deploy fails. Delivery goes to the bell and #ops in Slack.</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Accordions;
