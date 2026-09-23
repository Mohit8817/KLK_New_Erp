/*
 * Vireo React — UI · Tabs.
 * Faithful re-expression of src/html/ui/tabs.html: line (animated underline),
 * pill, segmented, iconed and vertical tabs with live panels. The Alpine
 * x-data/axTabs state + the indicator measuring (offsetWidth/offsetLeft →
 * --ax-tabs-ind-* CSS vars) are ported to React state + a layout effect.
 * DOM/classes/ARIA 1:1.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

/** Line / icon tabs with a moving underline indicator (horizontal). */
function LineTabs({ label, tabs, panels }: { label: string; tabs: ReactNode[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ w: '0', x: '0' });
  useLayoutEffect(() => {
    const t = listRef.current?.children[active] as HTMLElement | undefined;
    if (t) setInd({ w: `${t.offsetWidth}px`, x: `${t.offsetLeft}px` });
  }, [active]);
  return (
    <div className="ax-tabs" style={{ '--ax-tabs-ind-w': ind.w, '--ax-tabs-ind-x': ind.x } as React.CSSProperties}>
      <div className="ax-tabs__list" role="tablist" aria-label={label} ref={listRef}>
        {tabs.map((tab, i) => (
          <button key={i} type="button" className="ax-tabs__tab" role="tab" aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)}>{tab}</button>
        ))}
        <span className="ax-tabs__indicator" aria-hidden="true" />
      </div>
      {panels.map((panel, i) => (
        active === i && <div key={i} className="ax-tabs__panel" role="tabpanel">{panel}</div>
      ))}
    </div>
  );
}

/** Vertical tabs with a moving side marker. */
function VerticalTabs({ label, tabs, panels }: { label: string; tabs: ReactNode[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ h: '0', y: '0' });
  useLayoutEffect(() => {
    const t = listRef.current?.children[active] as HTMLElement | undefined;
    if (t) setInd({ h: `${t.offsetHeight}px`, y: `${t.offsetTop}px` });
  }, [active]);
  return (
    <div className="ax-tabs ax-tabs--vertical" style={{ '--ax-tabs-ind-h': ind.h, '--ax-tabs-ind-y': ind.y } as React.CSSProperties}>
      <div className="ax-tabs__list" role="tablist" aria-label={label} ref={listRef} style={{ minWidth: 200 }}>
        {tabs.map((tab, i) => (
          <button key={i} type="button" className="ax-tabs__tab" role="tab" aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)}>{tab}</button>
        ))}
        <span className="ax-tabs__indicator" aria-hidden="true" />
      </div>
      {panels.map((panel, i) => (
        active === i && <div key={i} className="ax-tabs__panel" role="tabpanel">{panel}</div>
      ))}
    </div>
  );
}

/** Pill / segmented tabs — is-active class, no indicator. */
function ClassTabs({ variant, listLabel, listStyle, tabs, tabStyle, panels, initial = 0 }: { variant: string; listLabel: string; listStyle?: React.CSSProperties; tabs: ReactNode[]; tabStyle?: React.CSSProperties; panels: ReactNode[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <div className={`ax-tabs ${variant}`}>
      <div className="ax-tabs__list" role="tablist" aria-label={listLabel} style={listStyle}>
        {tabs.map((tab, i) => (
          <button key={i} type="button" className={`ax-tabs__tab${active === i ? ' is-active' : ''}`} role="tab" aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} style={tabStyle}>{tab}</button>
        ))}
      </div>
      {panels.map((panel, i) => (
        active === i && <div key={i} className="ax-tabs__panel" role="tabpanel">{panel}</div>
      ))}
    </div>
  );
}

const ICON_PROFILE = <svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>;
const ICON_SETTINGS = <svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /></svg>;
const ICON_ALERTS = <svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>;

export function Tabs() {
  return (
    <>
      <PageHead
        title="Tabs"
        subtitle="Line, pill, segmented and vertical tabs — with icons, badges and live panels."
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/ui/accordions">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
            <span className="ax-btn__label">Accordions</span>
          </Link>
        }
      />

      <div className="ax-dash-grid">
        {/* Line */}
        <section className="ax-card ax-col--6" role="region" aria-label="Line tabs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Default</span>
              <h2 className="ax-card__title">Line</h2>
              <p className="ax-card__subtitle">An animated underline tracks the active tab.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <LineTabs
              label="Account sections"
              tabs={['Overview', 'Activity', 'Settings']}
              panels={[
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Workspace <b style={{ color: 'var(--ax-text-strong)' }}>Northwind Labs</b> has 9 members across 4 teams. Last deploy shipped 8 minutes ago.</p>,
                <ul className="ax-list ax-list--compact" style={{ margin: 0 }}>
                  <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}><span className="ax-list__content"><span className="ax-list__title">Devon closed TSK-241</span></span><span className="ax-list__trailing" style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>8m</span></li>
                  <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}><span className="ax-list__content"><span className="ax-list__title">Lena uploaded illustrations</span></span><span className="ax-list__trailing" style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>18m</span></li>
                </ul>,
                <div className="ax-field" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ax-space-4)' }}>
                  <label className="ax-label" htmlFor="tb-2fa" style={{ margin: 0 }}>Require two-factor auth</label>
                  <input id="tb-2fa" type="checkbox" className="ax-switch" defaultChecked aria-label="Require two-factor auth" />
                </div>,
              ]}
            />
          </div>
        </section>

        {/* Pill */}
        <section className="ax-card ax-col--6" role="region" aria-label="Pill tabs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Rounded</span>
              <h2 className="ax-card__title">Pill</h2>
              <p className="ax-card__subtitle">Active tab fills with an accent wash.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ClassTabs
              variant="ax-tabs--pill"
              listLabel="Plan filter"
              tabs={[
                <>All <span className="ax-tabs__badge ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">128</span></>,
                <>Active <span className="ax-tabs__badge ax-badge ax-badge--soft ax-badge--success ax-badge--pill">96</span></>,
                <>Trial <span className="ax-tabs__badge ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">24</span></>,
                <>Churned <span className="ax-tabs__badge ax-badge ax-badge--soft ax-badge--danger ax-badge--pill">8</span></>,
              ]}
              panels={[
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Every account, regardless of state.</p>,
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>96 paying customers in good standing.</p>,
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>24 workspaces still on a 14-day trial.</p>,
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>8 accounts lapsed in the last 90 days.</p>,
              ]}
            />
          </div>
        </section>

        {/* Segmented */}
        <section className="ax-card ax-col--6" role="region" aria-label="Segmented tabs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Grouped</span>
              <h2 className="ax-card__title">Segmented</h2>
              <p className="ax-card__subtitle">A boxed control for a short, exclusive set.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ClassTabs
              variant="ax-tabs--segmented"
              listLabel="Range"
              listStyle={{ maxWidth: 320 }}
              tabStyle={{ flex: 1, justifyContent: 'center' }}
              initial={1}
              tabs={['Day', 'Week', 'Month']}
              panels={[
                <><div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', color: 'var(--ax-text-strong)' }}>$2,480</div><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>today</span></>,
                <><div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', color: 'var(--ax-text-strong)' }}>$18.2K</div><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>this week</span></>,
                <><div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', color: 'var(--ax-text-strong)' }}>$74.8K</div><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>this month</span></>,
              ]}
            />
          </div>
        </section>

        {/* With icons */}
        <section className="ax-card ax-col--6" role="region" aria-label="Tabs with icons">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Iconed</span>
              <h2 className="ax-card__title">With Icons</h2>
              <p className="ax-card__subtitle">Leading glyphs aid scanning in dense headers.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <LineTabs
              label="Profile sections"
              tabs={[
                <>{ICON_PROFILE}Profile</>,
                <>{ICON_SETTINGS}Settings</>,
                <>{ICON_ALERTS}Alerts<span className="ax-tabs__badge ax-badge ax-badge--solid ax-badge--danger ax-badge--count">3</span></>,
              ]}
              panels={[
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Public name, avatar and bio for your profile card.</p>,
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Language, timezone and notification defaults.</p>,
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>You have 3 unread security alerts.</p>,
              ]}
            />
          </div>
        </section>

        {/* Vertical */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vertical tabs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Side rail</span>
              <h2 className="ax-card__title">Vertical</h2>
              <p className="ax-card__subtitle">A leading list with a moving side marker — ideal for settings.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <VerticalTabs
              label="Settings"
              tabs={[
                <>{ICON_PROFILE}General</>,
                <><svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /></svg>Security</>,
                <><svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-8z" /><path d="M3 10h18" /><path d="M7 15v2" /></svg>Billing</>,
                <><svg className="ax-tabs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>Team</>,
              ]}
              panels={[
                <><h3 style={{ margin: '0 0 var(--ax-space-2)', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-strong)' }}>General</h3><p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Workspace name, default locale and the avatar shown across Vireo.</p></>,
                <><h3 style={{ margin: '0 0 var(--ax-space-2)', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-strong)' }}>Security</h3><p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Two-factor enforcement, session length and a live device list.</p></>,
                <><h3 style={{ margin: '0 0 var(--ax-space-2)', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-strong)' }}>Billing</h3><p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>Plan <b style={{ color: 'var(--ax-text-strong)' }}>Business</b> · next invoice <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>$99.00</b> on Jul 12.</p></>,
                <><h3 style={{ margin: '0 0 var(--ax-space-2)', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-strong)' }}>Team</h3><p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>9 members · 3 pending invites · 2 admins.</p></>,
              ]}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default Tabs;
